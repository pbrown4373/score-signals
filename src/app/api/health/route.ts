import { NextResponse } from "next/server";

import { logger } from "@/lib/logging/logger";
import { resolveRequestId } from "@/lib/logging/request-context";
import {
  checkProviderRegistry,
  createProviderRegistry,
} from "@/lib/providers/registry";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = resolveRequestId(request.headers);
  const providers = await checkProviderRegistry(createProviderRegistry());

  logger.info(
    {
      request_id: requestId,
      route: "/api/health",
      status: "ok",
    },
    "health check",
  );

  return NextResponse.json(
    {
      status: "ok",
      service: "score-signals",
      providers: providers.map(({ name, mode, status }) => ({
        name,
        mode,
        status,
      })),
    },
    {
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    },
  );
}
