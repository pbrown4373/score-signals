import { createHash } from "node:crypto";

import { z } from "zod";

import { MediaError } from "@/modules/media/errors";

export const supportedVideoMimeTypes = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

const uploadInitSchema = z.object({
  byte_size: z.number().int().positive(),
  filename: z.string().trim().min(1).max(255),
  idempotency_key: z.string().trim().min(8).max(128),
  mime_type: z.enum(supportedVideoMimeTypes),
  title: z.string().trim().max(200).optional().default(""),
});

export type UploadInitInput = z.infer<typeof uploadInitSchema>;

export function parseUploadInit(
  input: unknown,
  maximumBytes: number,
): UploadInitInput {
  const result = uploadInitSchema.safeParse(input);
  if (!result.success) {
    throw new MediaError(
      "CREATIVE_INVALID_REQUEST",
      "Choose an MP4, MOV, or WebM video and try again.",
      400,
    );
  }
  if (result.data.byte_size > maximumBytes) {
    throw new MediaError(
      "CREATIVE_UPLOAD_TOO_LARGE",
      `The selected file exceeds the ${Math.floor(maximumBytes / 1_048_576)} MB upload limit.`,
      413,
    );
  }
  return result.data;
}

export function validateUploadedVideo(
  body: Uint8Array,
  maximumBytes: number,
): { mimeType: (typeof supportedVideoMimeTypes)[number]; sha256: string } {
  if (body.byteLength === 0 || body.byteLength > maximumBytes) {
    throw new MediaError(
      "CREATIVE_UPLOAD_TOO_LARGE",
      body.byteLength === 0
        ? "The uploaded file is empty."
        : `The uploaded file exceeds the ${Math.floor(maximumBytes / 1_048_576)} MB upload limit.`,
      413,
    );
  }

  const mimeType = sniffVideoMimeType(body);
  if (!mimeType) {
    throw new MediaError(
      "CREATIVE_INVALID_MEDIA",
      "The uploaded bytes are not a supported MP4, MOV, or WebM video.",
      415,
    );
  }

  return {
    mimeType,
    sha256: createHash("sha256").update(body).digest("hex"),
  };
}

export function sniffVideoMimeType(
  body: Uint8Array,
): (typeof supportedVideoMimeTypes)[number] | null {
  if (
    body.byteLength >= 4 &&
    body[0] === 0x1a &&
    body[1] === 0x45 &&
    body[2] === 0xdf &&
    body[3] === 0xa3
  ) {
    return "video/webm";
  }

  if (body.byteLength >= 12 && ascii(body, 4, 8) === "ftyp") {
    return ascii(body, 8, 12) === "qt  " ? "video/quicktime" : "video/mp4";
  }

  return null;
}

function ascii(body: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...body.slice(start, end));
}
