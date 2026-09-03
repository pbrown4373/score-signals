import { describe, expect, it } from "vitest";

import creativeDnaFixture from "@/lib/providers/ai/fixtures/creative-dna.json";
import skeletonExtractionFixture from "@/lib/providers/ai/fixtures/skeleton-extraction.json";
import skeletonGold from "../fixtures/skeleton-gold.json";
import {
  parseCreativeDNA,
  parseSkeletonExtraction,
  parseTranscript,
  strictCreativeDnaProviderSchema,
  strictSkeletonExtractionProviderSchema,
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

  it("accepts a Skeleton extraction and derives a strict provider schema", () => {
    expect(parseSkeletonExtraction(skeletonExtractionFixture)).toMatchObject({
      schema_version: "1.0",
      skeleton: { schema_version: "1.0" },
    });
    const schema = strictSkeletonExtractionProviderSchema();
    expect(schema).not.toHaveProperty("$schema");
    expect(schema).toHaveProperty(
      "required",
      expect.arrayContaining(["skeleton", "restricted_elements"]),
    );
  });

  it("passes the gold originality boundary with every source-specific value isolated", () => {
    const extraction = parseSkeletonExtraction(skeletonExtractionFixture);
    const skeletonText = JSON.stringify(extraction.skeleton).toLowerCase();
    for (const value of skeletonGold.restricted_values) {
      expect(skeletonGold.transcript.toLowerCase()).toContain(
        value.toLowerCase(),
      );
      expect(
        extraction.restricted_elements.map((element) => element.value),
      ).toContain(value);
      expect(skeletonText).not.toContain(value.toLowerCase());
    }
  });

  it("rejects a Skeleton that leaks a restricted source value", () => {
    const leaking = structuredClone(skeletonExtractionFixture);
    leaking.skeleton.canonical_text += " Mara Vale";
    expect(() => parseSkeletonExtraction(leaking)).toThrow(
      "contains restricted name content",
    );
  });
});
