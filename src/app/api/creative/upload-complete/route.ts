import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { getServerEnvironment } from "@/lib/env/server";
import { jsonError } from "@/lib/http/api";
import { InlineMockJobDispatcher } from "@/lib/providers/jobs/inline-mock";
import { createStorageAdapter } from "@/lib/providers/storage/registry";
import { createServiceClient } from "@/lib/supabase/service";
import { MediaError } from "@/modules/media/errors";
import { requireMediaRequest } from "@/modules/media/http";
import { processJobChain } from "@/modules/jobs/process-job-chain";
import { MediaWorkerRepository } from "@/modules/media/repository";
import { validateUploadedVideo } from "@/modules/media/validation";

const completionSchema = z.object({ creative_asset_id: z.uuid() });

export async function POST(request: NextRequest) {
  let assetId: string | undefined;
  let storageKey: string | undefined;
  let authorizedUpload = false;
  try {
    const parsed = completionSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new MediaError(
        "CREATIVE_INVALID_REQUEST",
        "A valid creative_asset_id is required.",
        400,
      );
    }
    assetId = parsed.data.creative_asset_id;
    const environment = getServerEnvironment();
    const { repository } = await requireMediaRequest(true);
    const upload = await repository.getUpload(assetId);
    if (!upload) {
      throw new MediaError("CREATIVE_NOT_FOUND", "Upload not found.", 404);
    }
    authorizedUpload = true;
    storageKey = upload.storage_key;
    if (
      new Date(upload.expires_at) < new Date() &&
      upload.status === "INITIATED"
    ) {
      throw new MediaError(
        "CREATIVE_UPLOAD_EXPIRED",
        "This upload has expired. Start a new upload.",
        410,
      );
    }
    const storage = createStorageAdapter();
    const object = await storage.getObject(storageKey);
    if (object.contentLength !== upload.declared_byte_size) {
      throw new MediaError(
        "CREATIVE_INVALID_REQUEST",
        "The uploaded byte count does not match the initialized upload.",
        400,
      );
    }
    const verified = validateUploadedVideo(
      object.body,
      environment.MAX_UPLOAD_MB * 1_048_576,
    );
    const workerRepository = new MediaWorkerRepository(createServiceClient());
    const jobId = await workerRepository.completeUpload({
      assetId,
      byteSize: object.contentLength,
      mimeType: verified.mimeType,
      retentionDays: environment.RAW_MEDIA_RETENTION_DAYS,
      sha256: verified.sha256,
    });
    if (environment.SCORE_PROVIDER_MODE === "mock") {
      await new InlineMockJobDispatcher(processJobChain).dispatch(jobId);
    }
    return NextResponse.json(
      { creative_asset_id: assetId, job_id: jobId, status: "QUEUED" },
      { status: 202 },
    );
  } catch (cause) {
    if (assetId && authorizedUpload && cause instanceof MediaError) {
      try {
        const worker = new MediaWorkerRepository(createServiceClient());
        await worker.rejectUpload(assetId, cause);
      } catch {
        // Preserve the original safe client error if failure persistence is unavailable.
      }
      if (storageKey) {
        await createStorageAdapter()
          .deleteObject(storageKey)
          .catch(() => undefined);
      }
    }
    return jsonError(cause);
  }
}
