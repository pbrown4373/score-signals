export type MediaErrorCode =
  | "AUTH_REQUIRED"
  | "CREATIVE_FORBIDDEN"
  | "CREATIVE_INVALID_REQUEST"
  | "CREATIVE_INVALID_MEDIA"
  | "CREATIVE_NOT_FOUND"
  | "CREATIVE_PROCESSING_FAILED"
  | "CREATIVE_RETRY_NOT_ALLOWED"
  | "CREATIVE_UNSUPPORTED_SOURCE"
  | "CREATIVE_UPLOAD_EXPIRED"
  | "CREATIVE_UPLOAD_TOO_LARGE";

export class MediaError extends Error {
  constructor(
    readonly code: MediaErrorCode,
    message: string,
    readonly status: number,
    readonly retryable = false,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "MediaError";
  }
}
