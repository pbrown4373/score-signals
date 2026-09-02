import { describe, expect, it } from "vitest";

import { providerNames } from "@/lib/providers/contracts";
import {
  checkProviderRegistry,
  createProviderRegistry,
} from "@/lib/providers/registry";

describe("provider registry", () => {
  it("provides deterministic mocks for every external boundary", async () => {
    const health = await checkProviderRegistry(createProviderRegistry("mock"));

    expect(health).toEqual(
      providerNames.map((name) => ({
        name,
        mode: "mock",
        status: "ready",
      })),
    );
  });

  it("fails closed when live adapters are not configured", () => {
    expect(() => createProviderRegistry("live")).toThrow(
      "Live provider mode is not available",
    );
  });
});
