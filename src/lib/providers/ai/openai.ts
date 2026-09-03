import OpenAI, { APIError } from "openai";
import type { ResponseInputContent } from "openai/resources/responses/responses";

import type { ProviderHealth } from "@/lib/providers/contracts";
import type {
  ModelGateway,
  StructuredModelInput,
} from "@/lib/providers/ai/contracts";
import { MediaError } from "@/modules/media/errors";

export class OpenAIModelGateway implements ModelGateway {
  readonly mode = "live";
  readonly name = "ai";
  readonly provider = "openai";
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async healthcheck(): Promise<ProviderHealth> {
    return { name: this.name, mode: this.mode, status: "ready" };
  }

  async generateStructured(input: StructuredModelInput) {
    const content: ResponseInputContent[] = [
      { type: "input_text", text: input.text },
      ...input.images.map((image): ResponseInputContent => ({
        detail: "low",
        image_url: `data:${image.mimeType};base64,${Buffer.from(image.body).toString("base64")}`,
        type: "input_image",
      })),
    ];
    const started = performance.now();
    try {
      const response = await this.client.responses.create({
        input: [{ role: "user", content }],
        instructions: input.instructions,
        model: this.model,
        store: false,
        text: {
          format: {
            name: input.schemaName,
            schema: input.schema,
            strict: true,
            type: "json_schema",
          },
        },
        tools: [],
      });
      if (!response.output_text) {
        throw new MediaError(
          "CREATIVE_ANALYSIS_PROVIDER_FAILED",
          "Analysis provider returned no structured output.",
          502,
          false,
        );
      }
      return {
        costMicrousd: null,
        latencyMs: Math.round(performance.now() - started),
        model: response.model,
        output: JSON.parse(response.output_text) as unknown,
        provider: this.provider,
        requestId: response.id,
        usage: response.usage ? JSON.parse(JSON.stringify(response.usage)) : {},
      };
    } catch (cause) {
      if (cause instanceof MediaError) throw cause;
      const retryable =
        cause instanceof APIError &&
        (cause.status === 408 ||
          cause.status === 409 ||
          cause.status === 429 ||
          cause.status >= 500);
      throw new MediaError(
        "CREATIVE_ANALYSIS_PROVIDER_FAILED",
        "Analysis provider failed.",
        502,
        retryable,
        { cause },
      );
    }
  }
}
