import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, Tables } from "@/lib/supabase/database.types";
import type { ProviderInvocation } from "@/lib/providers/lineage";
import type {
  CreativeDNA,
  TranscriptOutput,
} from "@/modules/analysis/contracts";
import { MediaError } from "@/modules/media/errors";

export type Deconstruction = Tables<"deconstructions">;
export type GenerationRun = Tables<"generation_runs">;
export type Transcript = Tables<"transcripts">;

export type AnalysisResult = {
  deconstruction: Deconstruction;
  generationRun: GenerationRun;
};

export class AnalysisRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly tenantId: string,
  ) {}

  async getResult(assetId: string): Promise<AnalysisResult | null> {
    const { data: deconstruction, error } = await this.supabase
      .from("deconstructions")
      .select("*")
      .eq("tenant_id", this.tenantId)
      .eq("creative_asset_id", assetId)
      .maybeSingle();
    if (error) throw repositoryError("load Creative DNA", error);
    if (!deconstruction) return null;
    const { data: generationRun, error: runError } = await this.supabase
      .from("generation_runs")
      .select("*")
      .eq("tenant_id", this.tenantId)
      .eq("id", deconstruction.generation_run_id)
      .single();
    if (runError || !generationRun) {
      throw repositoryError("load Creative DNA lineage", runError);
    }
    return { deconstruction, generationRun };
  }
}

export class AnalysisWorkerRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getJobKind(jobId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("background_jobs")
      .select("kind")
      .eq("id", jobId)
      .maybeSingle();
    if (error) throw repositoryError("load job kind", error);
    return data?.kind ?? null;
  }

  async claim(jobId: string) {
    const { data, error } = await this.supabase.rpc("claim_analysis_job", {
      requested_job_id: jobId,
    });
    if (error) throw repositoryError("claim analysis job", error);
    return data?.[0] ?? null;
  }

  async getInputs(assetId: string) {
    const [asset, artifacts, transcript] = await Promise.all([
      this.supabase
        .from("creative_assets")
        .select("*")
        .eq("id", assetId)
        .single(),
      this.supabase
        .from("media_artifacts")
        .select("*")
        .eq("creative_asset_id", assetId)
        .in("kind", ["AUDIO", "NORMALIZED_VIDEO", "FRAME"])
        .order("created_at"),
      this.supabase
        .from("transcripts")
        .select("*")
        .eq("creative_asset_id", assetId)
        .maybeSingle(),
    ]);
    if (asset.error || !asset.data)
      throw repositoryError("load analysis asset", asset.error);
    if (artifacts.error)
      throw repositoryError("load analysis artifacts", artifacts.error);
    if (transcript.error)
      throw repositoryError("load transcript", transcript.error);
    return {
      artifacts: artifacts.data ?? [],
      asset: asset.data,
      transcript: transcript.data,
    };
  }

  async startRun(input: {
    assetId: string;
    fingerprint: string;
    idempotencyKey: string;
    kind: "TRANSCRIPTION" | "CREATIVE_DNA";
    model: string;
    promptVersion: string | null;
    provider: string;
    schemaVersion: string;
    tenantId: string;
  }): Promise<string> {
    const { data, error } = await this.supabase.rpc("start_generation_run", {
      requested_asset_id: input.assetId,
      requested_idempotency_key: input.idempotencyKey,
      requested_input_fingerprint: input.fingerprint,
      requested_kind: input.kind,
      requested_model: input.model,
      requested_prompt_version: input.promptVersion as string,
      requested_provider: input.provider,
      requested_schema_version: input.schemaVersion,
      requested_tenant_id: input.tenantId,
    });
    if (error || !data) throw repositoryError("start generation run", error);
    return data;
  }

  async completeTranscript(
    runId: string,
    transcript: TranscriptOutput,
    invocation: ProviderInvocation<TranscriptOutput>,
  ): Promise<void> {
    const { error } = await this.supabase.rpc("complete_transcription_run", {
      requested_cost_microusd: invocation.costMicrousd as number,
      requested_latency_ms: invocation.latencyMs,
      requested_run_id: runId,
      requested_usage_metadata: withRequestId(invocation),
      transcript_language: transcript.language as string,
      transcript_segments: transcript.segments,
      transcript_text: transcript.text,
    });
    if (error) throw repositoryError("complete transcription", error);
  }

  async completeCreativeDNA(
    jobId: string,
    runId: string,
    dna: CreativeDNA,
    invocation: ProviderInvocation<unknown>,
  ): Promise<void> {
    const { error } = await this.supabase.rpc("complete_creative_dna_run", {
      creative_dna: dna as unknown as Json,
      requested_cost_microusd: invocation.costMicrousd as number,
      requested_job_id: jobId,
      requested_latency_ms: invocation.latencyMs,
      requested_run_id: runId,
      requested_summary:
        dna.assessment.why_it_may_work[0] ?? "Creative DNA analysis completed.",
      requested_usage_metadata: withRequestId(invocation),
    });
    if (error) throw repositoryError("complete Creative DNA", error);
  }

  async fail(
    jobId: string,
    runId: string | null,
    error: MediaError,
  ): Promise<void> {
    const result = await this.supabase.rpc("fail_analysis_job", {
      requested_error_code: error.code,
      requested_error_message: error.message,
      requested_job_id: jobId,
      requested_run_id: runId as string,
    });
    if (result.error) throw repositoryError("fail analysis job", result.error);
  }
}

export type AnalysisWorkerStore = Pick<
  AnalysisWorkerRepository,
  | "claim"
  | "completeCreativeDNA"
  | "completeTranscript"
  | "fail"
  | "getInputs"
  | "getJobKind"
  | "startRun"
>;

function withRequestId(invocation: ProviderInvocation<unknown>): Json {
  return {
    ...invocation.usage,
    provider_request_id: invocation.requestId,
  } as Json;
}

function repositoryError(action: string, cause: unknown): Error {
  return new Error(`Unable to ${action}.`, { cause });
}
