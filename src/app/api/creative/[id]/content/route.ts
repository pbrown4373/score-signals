import { NextResponse, type NextRequest } from "next/server";

import { getServerEnvironment } from "@/lib/env/server";
import { jsonError } from "@/lib/http/api";
import { createStorageAdapter } from "@/lib/providers/storage/registry";
import { MediaError } from "@/modules/media/errors";
import { requireMediaRequest } from "@/modules/media/http";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const environment = getServerEnvironment();
    if (environment.SCORE_PROVIDER_MODE !== "mock") {
      throw new MediaError(
        "CREATIVE_NOT_FOUND",
        "Upload target not found.",
        404,
      );
    }
    const { id } = await params;
    const { repository } = await requireMediaRequest(true);
    const upload = await repository.getUpload(id);
    if (!upload) {
      throw new MediaError("CREATIVE_NOT_FOUND", "Upload not found.", 404);
    }
    if (
      upload.status !== "INITIATED" ||
      new Date(upload.expires_at) < new Date()
    ) {
      throw new MediaError(
        "CREATIVE_UPLOAD_EXPIRED",
        "This upload target is no longer available.",
        410,
      );
    }
    const maximumBytes = environment.MAX_UPLOAD_MB * 1_048_576;
    const declaredLength = Number(request.headers.get("content-length"));
    if (
      declaredLength > maximumBytes ||
      upload.declared_byte_size > maximumBytes
    ) {
      throw new MediaError(
        "CREATIVE_UPLOAD_TOO_LARGE",
        `The uploaded file exceeds the ${environment.MAX_UPLOAD_MB} MB upload limit.`,
        413,
      );
    }
    const body = new Uint8Array(await request.arrayBuffer());
    if (
      body.byteLength > maximumBytes ||
      body.byteLength !== upload.declared_byte_size
    ) {
      throw new MediaError(
        body.byteLength > maximumBytes
          ? "CREATIVE_UPLOAD_TOO_LARGE"
          : "CREATIVE_INVALID_REQUEST",
        body.byteLength > maximumBytes
          ? `The uploaded file exceeds the ${environment.MAX_UPLOAD_MB} MB upload limit.`
          : "The uploaded byte count does not match the initialized upload.",
        body.byteLength > maximumBytes ? 413 : 400,
      );
    }
    await createStorageAdapter().putObject({
      body,
      contentType: upload.declared_mime_type,
      key: upload.storage_key,
    });
    return new NextResponse(null, { status: 204 });
  } catch (cause) {
    return jsonError(cause);
  }
}
