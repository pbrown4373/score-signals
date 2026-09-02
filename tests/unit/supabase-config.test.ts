import { describe, expect, it } from "vitest";

import { parseSupabasePublicConfig } from "@/lib/supabase/config";

describe("parseSupabasePublicConfig", () => {
  it("accepts a complete public configuration", () => {
    expect(
      parseSupabasePublicConfig({
        url: "http://127.0.0.1:54321",
        publishableKey: "sb_publishable_test",
      }),
    ).toEqual({
      url: "http://127.0.0.1:54321",
      publishableKey: "sb_publishable_test",
    });
  });

  it("fails closed without the public key", () => {
    expect(() =>
      parseSupabasePublicConfig({
        url: "http://127.0.0.1:54321",
      }),
    ).toThrow("Supabase is not configured");
  });
});
