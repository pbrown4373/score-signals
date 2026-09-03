import { getServerEnvironment } from "@/lib/env/server";
import type { ModelGateway } from "@/lib/providers/ai/contracts";
import { createModelGateway } from "@/lib/providers/ai/registry";
import type { StorageAdapter } from "@/lib/providers/storage/contracts";
import { createStorageAdapter } from "@/lib/providers/storage/registry";
import type { TranscriptionProvider } from "@/lib/providers/transcription/contracts";
import { createTranscriptionProvider } from "@/lib/providers/transcription/registry";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  CreativeDNA,
  TranscriptOutput,
} from "@/modules/analysis/contracts";
import { fingerprint } from "@/modules/analysis/fingerprint";
import {
  buildCreativeDnaInput,
  creativeDnaInstructions,
  creativeDnaPromptVersion,
} from "@/modules/analysis/prompts/creative-dna.v1";
import {
  buildSkeletonInput,
  skeletonInstructions,
  skeletonPromptVersion,
} from "@/modules/analysis/prompts/skeleton.v1";
import {
  AnalysisWorkerRepository,
  type AnalysisWorkerStore,
} from "@/modules/analysis/repository";
import { withTransientRetry } from "@/modules/analysis/retry";
import {
  creativeDnaSchemaVersion,
  parseCreativeDNA,
  parseSkeletonExtraction,
  parseTranscript,
  skeletonSchemaVersion,
  strictCreativeDnaProviderSchema,
  strictSkeletonExtractionProviderSchema,
  transcriptSchemaVersion,
} from "@/modules/analysis/validation";
import { MediaError } from "@/modules/media/errors";

export async function processAnalysisJob(
  jobId: string,
  dependencies: {
    gateway?: ModelGateway;
    skeletonGateway?: ModelGateway;
    repository?: AnalysisWorkerStore;
    storage?: StorageAdapter;
    transcription?: TranscriptionProvider;
  } = {},
): Promise<void> {
  const environment = getServerEnvironment();
  const repository =
    dependencies.repository ??
    new AnalysisWorkerRepository(createServiceClient());
  const claim = await repository.claim(jobId);
  if (!claim) return;

  const storage = dependencies.storage ?? createStorageAdapter();
  const transcription =
    dependencies.transcription ?? createTranscriptionProvider();
  const gateway = dependencies.gateway ?? createModelGateway();
  const skeletonGateway =
    dependencies.skeletonGateway ?? createModelGateway("skeleton");
  let activeRunId: string | null = null;

  try {
    const inputs = await repository.getInputs(
      claim.creative_asset_id,
      claim.tenant_id,
    );
    let transcript = existingTranscript(inputs.transcript);

    if (!transcript) {
      const audio =
        inputs.artifacts.find((artifact) => artifact.kind === "AUDIO") ??
        inputs.artifacts.find(
          (artifact) => artifact.kind === "NORMALIZED_VIDEO",
        );
      if (!audio) {
        throw new MediaError(
          "CREATIVE_ANALYSIS_PROVIDER_FAILED",
          "No analysis-ready audio or video artifact is available.",
          422,
          false,
        );
      }
      const audioObject = await storage.getObject(audio.storage_key);
      const transcriptFingerprint = fingerprint({
        content: inputs.asset.content_sha256,
        model: transcription.model,
        schema: transcriptSchemaVersion,
      });
      activeRunId = await repository.startRun({
        assetId: claim.creative_asset_id,
        fingerprint: transcriptFingerprint,
        idempotencyKey: `transcription:${claim.creative_asset_id}:${transcriptFingerprint.slice(0, 24)}`,
        kind: "TRANSCRIPTION",
        model: transcription.model,
        promptVersion: null,
        provider: transcription.provider,
        schemaVersion: transcriptSchemaVersion,
        tenantId: claim.tenant_id,
      });
      const invocation = await withTransientRetry(
        () =>
          transcription.transcribe({
            body: audioObject.body,
            filename: audio.kind === "AUDIO" ? "audio.m4a" : "video.mp4",
            mimeType: audio.mime_type ?? "video/mp4",
          }),
        environment.ANALYSIS_PROVIDER_MAX_ATTEMPTS,
      );
      transcript = parseTranscript(invocation.output);
      await repository.completeTranscript(activeRunId, transcript, invocation);
    }

    let dna = existingCreativeDNA(inputs.deconstruction?.payload);
    let deconstructionId = inputs.deconstruction?.id ?? null;

    if (!dna || !deconstructionId) {
      const frames = inputs.artifacts.filter(
        (artifact) => artifact.kind === "FRAME",
      );
      const frameObjects = await Promise.all(
        frames.map(async (frame) => ({
          body: (await storage.getObject(frame.storage_key)).body,
          metadata: frame.metadata,
          mimeType: frame.mime_type,
        })),
      );
      const promptInput = buildCreativeDnaInput({
        durationMs: inputs.asset.duration_ms,
        frameTiming: frameObjects.map((frame) =>
          isRecord(frame.metadata) ? frame.metadata : {},
        ),
        height: inputs.asset.height,
        mimeType: inputs.asset.mime_type,
        transcript: transcript.text,
        width: inputs.asset.width,
      });
      const dnaFingerprint = fingerprint({
        content: inputs.asset.content_sha256,
        frames: frameObjects.map((frame) => frame.metadata),
        model: gateway.model,
        prompt: creativeDnaPromptVersion,
        schema: creativeDnaSchemaVersion,
        transcript: fingerprint(transcript),
      });
      activeRunId = await repository.startRun({
        assetId: claim.creative_asset_id,
        fingerprint: dnaFingerprint,
        idempotencyKey: `creative-dna:${claim.creative_asset_id}:${dnaFingerprint.slice(0, 24)}`,
        kind: "CREATIVE_DNA",
        model: gateway.model,
        promptVersion: creativeDnaPromptVersion,
        provider: gateway.provider,
        schemaVersion: creativeDnaSchemaVersion,
        tenantId: claim.tenant_id,
      });
      const invocation = await withTransientRetry(
        () =>
          gateway.generateStructured({
            images: frameObjects.flatMap((frame) =>
              isImageMime(frame.mimeType)
                ? [{ body: frame.body, mimeType: frame.mimeType }]
                : [],
            ),
            instructions: creativeDnaInstructions,
            schema: strictCreativeDnaProviderSchema(),
            schemaName: "creative_dna_v1",
            text: promptInput,
          }),
        environment.ANALYSIS_PROVIDER_MAX_ATTEMPTS,
      );
      dna = parseCreativeDNA(invocation.output);
      deconstructionId = await repository.completeCreativeDNA(
        jobId,
        activeRunId,
        dna,
        invocation,
      );
    }

    const skeletonFingerprint = fingerprint({
      creative_dna: fingerprint(dna),
      model: skeletonGateway.model,
      prompt: skeletonPromptVersion,
      schema: skeletonSchemaVersion,
      transcript: fingerprint(transcript),
    });
    activeRunId = await repository.startRun({
      assetId: claim.creative_asset_id,
      fingerprint: skeletonFingerprint,
      idempotencyKey: `skeleton:${claim.creative_asset_id}:${skeletonFingerprint.slice(0, 24)}`,
      kind: "SKELETON",
      model: skeletonGateway.model,
      promptVersion: skeletonPromptVersion,
      provider: skeletonGateway.provider,
      schemaVersion: skeletonSchemaVersion,
      tenantId: claim.tenant_id,
    });
    const skeletonInvocation = await withTransientRetry(
      () =>
        skeletonGateway.generateStructured({
          images: [],
          instructions: skeletonInstructions,
          schema: strictSkeletonExtractionProviderSchema(),
          schemaName: "skeleton_extraction_v1",
          text: buildSkeletonInput({
            creativeDna: dna,
            transcript: transcript.text,
          }),
        }),
      environment.ANALYSIS_PROVIDER_MAX_ATTEMPTS,
    );
    const extraction = parseSkeletonExtraction(skeletonInvocation.output);
    await repository.completeSkeleton(
      jobId,
      activeRunId,
      deconstructionId,
      extraction,
      skeletonInvocation,
    );
  } catch (cause) {
    const error =
      cause instanceof MediaError
        ? cause
        : new MediaError(
            "CREATIVE_ANALYSIS_PROVIDER_FAILED",
            "Creative analysis could not be completed.",
            502,
            true,
            { cause },
          );
    await repository.fail(jobId, activeRunId, error);
  }
}

function existingCreativeDNA(payload: unknown): CreativeDNA | null {
  return payload ? parseCreativeDNA(payload) : null;
}

function existingTranscript(
  transcript: {
    language: string | null;
    schema_version: string;
    segments: unknown;
    text_content: string;
  } | null,
): TranscriptOutput | null {
  if (!transcript) return null;
  return parseTranscript({
    language: transcript.language,
    schema_version: transcript.schema_version,
    segments: transcript.segments,
    text: transcript.text_content,
  });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function isImageMime(
  mimeType: string | null,
): mimeType is "image/jpeg" | "image/png" | "image/webp" {
  return ["image/jpeg", "image/png", "image/webp"].includes(mimeType ?? "");
}
