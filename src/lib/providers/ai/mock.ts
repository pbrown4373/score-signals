import { randomUUID } from "node:crypto";

import type { ModelGateway } from "@/lib/providers/ai/contracts";
import creativeDnaFixture from "@/lib/providers/ai/fixtures/creative-dna.json";
import type { ProviderHealth } from "@/lib/providers/contracts";

export class MockModelGateway implements ModelGateway {
  readonly mode = "mock";
  readonly model = "mock-analysis-v1";
  readonly name = "ai";
  readonly provider = "mock";

  constructor(private readonly output: unknown = creativeDnaFixture) {}

  async healthcheck(): Promise<ProviderHealth> {
    return { name: this.name, mode: this.mode, status: "ready" };
  }

  async generateStructured() {
    return {
      costMicrousd: 0,
      latencyMs: 0,
      model: this.model,
      output: structuredClone(this.output),
      provider: this.provider,
      requestId: randomUUID(),
      usage: { input_tokens: 100, output_tokens: 200, total_tokens: 300 },
    };
  }
}
