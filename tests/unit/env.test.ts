import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/lib/env/server";

describe("parseServerEnvironment", () => {
  it("defaults to credential-free mock mode", () => {
    expect(parseServerEnvironment({})).toEqual({
      NODE_ENV: "development",
      SCORE_PROVIDER_MODE: "mock",
      LOG_LEVEL: "info",
    });
  });

  it("rejects an unknown provider mode", () => {
    expect(() =>
      parseServerEnvironment({ SCORE_PROVIDER_MODE: "mystery" }),
    ).toThrow("Invalid server environment");
  });
});
