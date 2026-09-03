import { randomUUID } from "node:crypto";

import type {
  ModelGateway,
  StructuredModelInput,
} from "@/lib/providers/ai/contracts";
import creativeDnaFixture from "@/lib/providers/ai/fixtures/creative-dna.json";
import skeletonExtractionFixture from "@/lib/providers/ai/fixtures/skeleton-extraction.json";
import type { ProviderHealth } from "@/lib/providers/contracts";

export class MockModelGateway implements ModelGateway {
  readonly mode = "mock";
  readonly name = "ai";
  readonly provider = "mock";

  constructor(
    private readonly output: unknown = undefined,
    readonly model = "mock-analysis-v1",
  ) {}

  async healthcheck(): Promise<ProviderHealth> {
    return { name: this.name, mode: this.mode, status: "ready" };
  }

  async generateStructured(input: StructuredModelInput) {
    const output =
      this.output ??
      (input.schemaName === "skeleton_extraction_v1"
        ? skeletonExtractionFixture
        : creativeDnaFixture);
    return {
      costMicrousd: 0,
      latencyMs: 0,
      model: this.model,
      output: structuredClone(output),
      provider: this.provider,
      requestId: randomUUID(),
      usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300 },
    };
  }
}
