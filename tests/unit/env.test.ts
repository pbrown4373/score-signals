import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/lib/env/server";

describe("parseServerEnvironment", () => {
  it("defaults to credential-free mock mode", () => {
    expect(parseServerEnvironment({})).toEqual({
      FFMPEG_PATH: "ffmpeg",
      FFPROBE_PATH: "ffprobe",
      MAX_UPLOAD_MB: 250,
      MAX_VIDEO_DURATION_SECONDS: 600,
      NODE_ENV: "development",
      RAW_MEDIA_RETENTION_DAYS: 30,
      SCORE_PROVIDER_MODE: "mock",
      SCORE_MOCK_STORAGE_DIR: ".score-data/mock-storage",
      S3_REGION: "auto",
      LOG_LEVEL: "info",
    });
  });

  it("rejects an unknown provider mode", () => {
    expect(() =>
      parseServerEnvironment({ SCORE_PROVIDER_MODE: "mystery" }),
    ).toThrow("Invalid server environment");
  });
});
