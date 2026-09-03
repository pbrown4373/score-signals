import { getServerEnvironment } from "@/lib/env/server";
import type { ModelGateway } from "@/lib/providers/ai/contracts";
import { MockModelGateway } from "@/lib/providers/ai/mock";
import { OpenAIModelGateway } from "@/lib/providers/ai/openai";

export function createModelGateway(
  task: "analysis" | "skeleton" = "analysis",
): ModelGateway {
  const environment = getServerEnvironment();
  const model =
    task === "skeleton"
      ? environment.SCORE_MODEL_SKELETON
      : environment.SCORE_MODEL_ANALYSIS;
  if (environment.SCORE_PROVIDER_MODE === "mock") {
    return new MockModelGateway(
      undefined,
      task === "skeleton" ? "mock-skeleton-v1" : "mock-analysis-v1",
    );
  }
  if (!environment.OPENAI_API_KEY) {
    throw new Error("Live analysis requires OPENAI_API_KEY.");
  }
  return new OpenAIModelGateway(environment.OPENAI_API_KEY, model);
}
