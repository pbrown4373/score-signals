import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { MediaError } from "@/modules/media/errors";

export function jsonError(cause: unknown): NextResponse {
  const requestId = randomUUID();
  const error =
    cause instanceof MediaError
      ? cause
      : new MediaError(
          "CREATIVE_PROCESSING_FAILED",
          "The request could not be completed.",
          500,
          true,
        );
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        request_id: requestId,
        retryable: error.retryable,
      },
    },
    { status: error.status },
  );
}
