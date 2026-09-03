import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/lib/http/api";
import { createStorageAdapter } from "@/lib/providers/storage/registry";
import { MediaError } from "@/modules/media/errors";
import { requireMediaRequest } from "@/modules/media/http";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { repository } = await requireMediaRequest();
    const creative = await repository.getCreative(id);
    if (!creative) {
      throw new MediaError("CREATIVE_NOT_FOUND", "Creative not found.", 404);
    }
    return NextResponse.json({
      artifacts: creative.artifacts.map((artifact) => ({
        byte_size: artifact.byte_size,
        created_at: artifact.created_at,
        expires_at: artifact.expires_at,
        id: artifact.id,
        kind: artifact.kind,
        metadata: artifact.metadata,
        mime_type: artifact.mime_type,
      })),
      asset: {
        created_at: creative.asset.created_at,
        duration_ms: creative.asset.duration_ms,
        error_code: creative.asset.error_code,
        error_message: creative.asset.error_message,
        height: creative.asset.height,
        id: creative.asset.id,
        mime_type: creative.asset.mime_type,
        status: creative.asset.status,
        title: creative.asset.title,
        updated_at: creative.asset.updated_at,
        width: creative.asset.width,
      },
      job: creative.job
        ? {
            attempt: creative.job.attempt,
            completed_at: creative.job.completed_at,
            error_code: creative.job.error_code,
            error_message: creative.job.error_message,
            id: creative.job.id,
            max_attempts: creative.job.max_attempts,
            status: creative.job.status,
          }
        : null,
      upload: creative.upload
        ? {
            expires_at: creative.upload.expires_at,
            original_filename: creative.upload.original_filename,
            status: creative.upload.status,
          }
        : null,
    });
  } catch (cause) {
    return jsonError(cause);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { repository } = await requireMediaRequest(true);
    const creative = await repository.getCreative(id);
    if (!creative) {
      throw new MediaError("CREATIVE_NOT_FOUND", "Creative not found.", 404);
    }
    const keys = new Set([
      ...(creative.upload ? [creative.upload.storage_key] : []),
      ...creative.artifacts.map((artifact) => artifact.storage_key),
    ]);
    const storage = createStorageAdapter();
    await Promise.all([...keys].map((key) => storage.deleteObject(key)));
    await repository.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (cause) {
    return jsonError(cause);
  }
}
