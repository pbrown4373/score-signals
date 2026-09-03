import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

import { getServerEnvironment } from "@/lib/env/server";
import type { StorageAdapter } from "@/lib/providers/storage/contracts";
import { createStorageAdapter } from "@/lib/providers/storage/registry";
import { createServiceClient } from "@/lib/supabase/service";
import { MediaError } from "@/modules/media/errors";
import { processMediaFile } from "@/modules/media/ffmpeg";
import { MediaWorkerRepository } from "@/modules/media/repository";

export async function processMediaJob(
  jobId: string,
  dependencies: {
    repository?: MediaWorkerRepository;
    storage?: StorageAdapter;
  } = {},
): Promise<string | null> {
  const environment = getServerEnvironment();
  const repository =
    dependencies.repository ?? new MediaWorkerRepository(createServiceClient());
  const storage = dependencies.storage ?? createStorageAdapter();
  const claim = await repository.claim(jobId);
  if (!claim) return null;

  const workDirectory = await mkdtemp(join(tmpdir(), "score-media-"));
  try {
    const upload = await repository.getUpload(claim.creative_asset_id);
    const original = await storage.getObject(upload.storage_key);
    const inputPath = join(
      workDirectory,
      `input${extensionForMime(upload.declared_mime_type)}`,
    );
    await writeFile(inputPath, original.body);
    const processed = await processMediaFile({
      ffmpegPath: environment.FFMPEG_PATH,
      ffprobePath: environment.FFPROBE_PATH,
      inputPath,
      maximumDurationSeconds: environment.MAX_VIDEO_DURATION_SECONDS,
      outputDirectory: workDirectory,
    });

    const derived = [];
    for (const [index, artifact] of processed.artifacts.entries()) {
      const key = `${claim.tenant_id}/${claim.creative_asset_id}/derived/${artifactName(artifact.kind, index, artifact.path)}`;
      const body = await readFile(artifact.path);
      await storage.putObject({ body, contentType: artifact.mimeType, key });
      derived.push({
        byte_size: artifact.byteSize,
        kind: artifact.kind,
        metadata: artifact.metadata,
        mime_type: artifact.mimeType,
        storage_key: key,
      });
    }

    return await repository.finish(
      jobId,
      {
        duration_ms: processed.metadata.durationMs,
        height: processed.metadata.height,
        width: processed.metadata.width,
      },
      derived,
    );
  } catch (cause) {
    const error =
      cause instanceof MediaError
        ? cause
        : new MediaError(
            "CREATIVE_PROCESSING_FAILED",
            "The video could not be processed. Retry the job or upload another file.",
            422,
            true,
            { cause },
          );
    await repository.fail(jobId, error);
    return null;
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
  }
}

function artifactName(kind: string, index: number, path: string): string {
  if (kind === "NORMALIZED_VIDEO") return "normalized.mp4";
  if (kind === "AUDIO") return "audio.m4a";
  if (kind === "THUMBNAIL") return "thumbnail.jpg";
  return `frame-${String(index + 1).padStart(3, "0")}${extname(path)}`;
}

function extensionForMime(mimeType: string): string {
  if (mimeType === "video/webm") return ".webm";
  if (mimeType === "video/quicktime") return ".mov";
  return ".mp4";
}
