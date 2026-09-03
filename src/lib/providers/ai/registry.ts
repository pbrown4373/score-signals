import { getServerEnvironment } from "@/lib/env/server";
import type { ModelGateway } from "@/lib/providers/ai/contracts";
import { MockModelGateway } from "@/lib/providers/ai/mock";
import { OpenAIModelGateway } from "@/lib/providers/ai/openai";

export function createModelGateway(): ModelGateway {
  const environment = getServerEnvironment();
  if (environment.SCORE_PROVIDER_MODE === "mock") {
    return new MockModelGateway();
  }
  if (!environment.OPENAI_API_KEY) {
    throw new Error("Live analysis requires OPENAI_API_KEY.");
  }
  return new OpenAIModelGateway(
    environment.OPENAI_API_KEY,
    environment.SCORE_MODEL_ANALYSIS,
  );
}
