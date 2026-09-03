import { describe, expect, it } from "vitest";

import { MediaError } from "@/modules/media/errors";
import {
  parseUploadInit,
  sniffVideoMimeType,
  validateUploadedVideo,
} from "@/modules/media/validation";

describe("media upload validation", () => {
  it("sniffs supported formats from bytes instead of trusting the extension", () => {
    const mp4 = Uint8Array.from([
      0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109,
    ]);
    const mov = Uint8Array.from([
      0, 0, 0, 24, 102, 116, 121, 112, 113, 116, 32, 32,
    ]);
    const webm = Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3]);
    expect(sniffVideoMimeType(mp4)).toBe("video/mp4");
    expect(sniffVideoMimeType(mov)).toBe("video/quicktime");
    expect(sniffVideoMimeType(webm)).toBe("video/webm");
  });

  it("hashes validated bytes", () => {
    const body = Uint8Array.from([
      0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109,
    ]);
    expect(validateUploadedVideo(body, 100)).toMatchObject({
      mimeType: "video/mp4",
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  it("rejects invalid bytes and oversized declarations", () => {
    expect(() =>
      validateUploadedVideo(new TextEncoder().encode("not video"), 100),
    ).toThrow(MediaError);
    expect(() =>
      parseUploadInit(
        {
          byte_size: 101,
          filename: "large.mp4",
          idempotency_key: "upload-key",
          mime_type: "video/mp4",
        },
        100,
      ),
    ).toThrow("upload limit");
  });
});
