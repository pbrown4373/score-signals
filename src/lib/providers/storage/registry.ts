import { resolve } from "node:path";

import { getServerEnvironment } from "@/lib/env/server";
import type { StorageAdapter } from "@/lib/providers/storage/contracts";
import { MockStorageAdapter } from "@/lib/providers/storage/mock-storage";
import { R2StorageAdapter } from "@/lib/providers/storage/r2-storage";

export function createStorageAdapter(): StorageAdapter {
  const environment = getServerEnvironment();
  if (environment.SCORE_PROVIDER_MODE === "mock") {
    return new MockStorageAdapter(
      resolve(process.cwd(), environment.SCORE_MOCK_STORAGE_DIR),
    );
  }

  const {
    S3_ACCESS_KEY_ID,
    S3_BUCKET,
    S3_ENDPOINT,
    S3_REGION,
    S3_SECRET_ACCESS_KEY,
  } = environment;
  if (
    !S3_ACCESS_KEY_ID ||
    !S3_BUCKET ||
    !S3_ENDPOINT ||
    !S3_SECRET_ACCESS_KEY
  ) {
    throw new Error("Live private storage is not fully configured.");
  }

  return new R2StorageAdapter({
    accessKeyId: S3_ACCESS_KEY_ID,
    bucket: S3_BUCKET,
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  });
}
