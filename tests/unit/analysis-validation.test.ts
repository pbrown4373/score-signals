import { describe, expect, it } from "vitest";

import creativeDnaFixture from "@/lib/providers/ai/fixtures/creative-dna.json";
import {
  parseCreativeDNA,
  parseTranscript,
  strictCreativeDnaProviderSchema,
} from "@/modules/analysis/validation";

describe("versioned analysis schemas", () => {
  it("accepts the deterministic Creative DNA fixture", () => {
    expect(parseCreativeDNA(creativeDnaFixture)).toMatchObject({
      schema_version: "1.0",
      observations: [{ kind: "OBSERVED" }, { kind: "INFERRED" }],
    });
  });

  it("rejects malformed Creative DNA and transcript outputs", () => {
    expect(() => parseCreativeDNA({ schema_version: "1.0" })).toThrow(
      "did not match schema",
    );
    expect(() =>
      parseTranscript({
        schema_version: "1.0",
        language: "en",
        text: "bad timing",
        segments: [{ start_seconds: 2, end_seconds: 1, text: "bad" }],
      }),
    ).toThrow("timing is invalid");
  });

  it("derives an OpenAI strict-compatible schema without weakening the canonical contract", () => {
    const schema = strictCreativeDnaProviderSchema();
    expect(schema).not.toHaveProperty("$schema");
    expect(schema).toHaveProperty(
      "properties.identity.required",
      expect.arrayContaining([
        "advertiser_or_creator",
        "industry",
        "product_category",
      ]),
    );
    expect(parseCreativeDNA(creativeDnaFixture)).toBeTruthy();
  });
});
