import type {
  ProviderAdapter,
  ProviderHealth,
  ProviderName,
} from "@/lib/providers/contracts";

export class MockProvider implements ProviderAdapter {
  readonly mode = "mock";

  constructor(readonly name: ProviderName) {}

  async healthcheck(): Promise<ProviderHealth> {
    return {
      name: this.name,
      mode: this.mode,
      status: "ready",
    };
  }
}
