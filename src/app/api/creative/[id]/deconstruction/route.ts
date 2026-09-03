import { NextResponse, type NextRequest } from "next/server";

import { jsonError } from "@/lib/http/api";
import { createClient } from "@/lib/supabase/server";
import { AnalysisRepository } from "@/modules/analysis/repository";
import { parseCreativeDNA } from "@/modules/analysis/validation";
import { MediaError } from "@/modules/media/errors";
import { requireMediaRequest } from "@/modules/media/http";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { context } = await requireMediaRequest();
    const result = await new AnalysisRepository(
      await createClient(),
      context.tenant.id,
    ).getResult(id);
    if (!result) {
      throw new MediaError(
        "CREATIVE_NOT_FOUND",
        "Creative DNA is not available.",
        404,
      );
    }
    return NextResponse.json({
      creative_asset_id: id,
      lineage: {
        cost_microusd: result.generationRun.cost_microusd,
        input_fingerprint: result.generationRun.input_fingerprint,
        latency_ms: result.generationRun.latency_ms,
        model: result.generationRun.model,
        prompt_version: result.generationRun.prompt_version,
        provider: result.generationRun.provider,
        schema_version: result.generationRun.schema_version,
      },
      payload: parseCreativeDNA(result.deconstruction.payload),
      summary: result.deconstruction.summary,
    });
  } catch (cause) {
    return jsonError(cause);
  }
}
