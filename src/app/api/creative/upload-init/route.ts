import { NextResponse, type NextRequest } from "next/server";

import { getServerEnvironment } from "@/lib/env/server";
import { jsonError } from "@/lib/http/api";
import { createStorageAdapter } from "@/lib/providers/storage/registry";
import { requireMediaRequest } from "@/modules/media/http";
import { parseUploadInit } from "@/modules/media/validation";

export async function POST(request: NextRequest) {
  try {
    const environment = getServerEnvironment();
    const maximumBytes = environment.MAX_UPLOAD_MB * 1_048_576;
    const input = parseUploadInit(await request.json(), maximumBytes);
    const { repository } = await requireMediaRequest(true);
    const initialized = await repository.initializeUpload(input);
    const target = await createStorageAdapter().createUploadTarget({
      contentLength: input.byte_size,
      contentType: input.mime_type,
      key: initialized.storage_key,
      mockUploadUrl: `/api/creative/${initialized.creative_asset_id}/content`,
    });
    return NextResponse.json({
      creative_asset_id: initialized.creative_asset_id,
      expires_in_seconds: 3600,
      maximum_bytes: maximumBytes,
      upload: target,
    });
  } catch (cause) {
    return jsonError(cause);
  }
}
