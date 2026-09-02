import { getServerEnvironment } from "@/lib/env/server";
import {
  providerNames,
  type ProviderHealth,
  type ProviderRegistry,
} from "@/lib/providers/contracts";
import { MockProvider } from "@/lib/providers/mock-provider";

export function createProviderRegistry(
  mode = getServerEnvironment().SCORE_PROVIDER_MODE,
): ProviderRegistry {
  if (mode !== "mock") {
    throw new Error(
      "Live provider mode is not available until its milestone adapters are configured.",
    );
  }

  return Object.fromEntries(
    providerNames.map((name) => [name, new MockProvider(name)]),
  ) as ProviderRegistry;
}

export async function checkProviderRegistry(
  registry: ProviderRegistry,
): Promise<ProviderHealth[]> {
  return Promise.all(providerNames.map((name) => registry[name].healthcheck()));
}
