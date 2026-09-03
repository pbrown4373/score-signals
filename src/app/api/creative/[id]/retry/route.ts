import { NextResponse, type NextRequest } from "next/server";

import { getServerEnvironment } from "@/lib/env/server";
import { jsonError } from "@/lib/http/api";
import { InlineMockJobDispatcher } from "@/lib/providers/jobs/inline-mock";
import { requireMediaRequest } from "@/modules/media/http";
import { processMediaJob } from "@/modules/media/processor";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { repository } = await requireMediaRequest(true);
    const jobId = await repository.retry(id);
    if (getServerEnvironment().SCORE_PROVIDER_MODE === "mock") {
      await new InlineMockJobDispatcher(processMediaJob).dispatch(jobId);
    }
    return NextResponse.json(
      { creative_asset_id: id, job_id: jobId },
      { status: 202 },
    );
  } catch (cause) {
    return jsonError(cause);
  }
}
