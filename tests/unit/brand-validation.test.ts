import { describe, expect, it } from "vitest";

import {
  brandSchema,
  onboardingSchema,
  personaSchema,
  restrictionSchema,
} from "@/modules/brands/validation";

describe("Brand Brain validation", () => {
  it("accepts the minimum self-service onboarding context", () => {
    const result = onboardingSchema.safeParse({
      brandName: "Northstar Goods",
      websiteUrl: "",
      category: "Home goods",
      description: "Practical products for calmer, more organized homes.",
      voice: "",
      productName: "",
      productDescription: "",
      priceDescription: "",
      offer: "",
      personaName: "",
      personaDescription: "",
      personaPains: "",
      personaDesires: "",
      personaObjections: "",
      awarenessStage: "",
      proofLabel: "",
      proofDetail: "",
      proofSource: "",
      restrictionType: "PROHIBITED_CLAIM",
      restrictionValue: "",
      restrictionNotes: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.websiteUrl).toBeNull();
      expect(result.data.personaPains).toEqual([]);
    }
  });

  it("requires a product name when optional product details are supplied", () => {
    const result = completeOnboarding({
      productName: "",
      offer: "Save 20% with the starter bundle.",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.productName).toBeDefined();
    }
  });

  it("requires proof label and detail together", () => {
    const result = completeOnboarding({
      proofLabel: "Customer research",
      proofDetail: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.proofDetail).toBeDefined();
    }
  });

  it("normalizes persona lists from one item per line", () => {
    const result = personaSchema.parse({
      name: "Busy operators",
      description: "",
      pains: "Manual reporting\n\n Slow approvals ",
      desires: "Faster decisions",
      objections: "Setup time",
      awarenessStage: "Problem aware",
    });

    expect(result.pains).toEqual(["Manual reporting", "Slow approvals"]);
    expect(result.desires).toEqual(["Faster decisions"]);
  });

  it("rejects malformed websites at the application boundary", () => {
    const result = brandSchema.safeParse({
      name: "Northstar",
      websiteUrl: "northstar dot example",
      category: "Home",
      description: "A sufficiently detailed brand description.",
      voice: "Direct",
    });

    expect(result.success).toBe(false);
  });

  it("accepts only documented restriction types", () => {
    expect(
      restrictionSchema.safeParse({
        restrictionType: "IGNORE_ALL_RULES",
        value: "Unsafe",
        notes: "",
      }).success,
    ).toBe(false);
  });
});

function completeOnboarding(overrides: Record<string, string>) {
  return onboardingSchema.safeParse({
    brandName: "Northstar Goods",
    websiteUrl: "https://northstar.example",
    category: "Home goods",
    description: "Practical products for calmer, more organized homes.",
    voice: "Warm and practical",
    productName: "Starter Kit",
    productDescription: "A simple starter kit.",
    priceDescription: "$49",
    offer: "Starter bundle",
    personaName: "Busy organizer",
    personaDescription: "A time-conscious home organizer.",
    personaPains: "Clutter",
    personaDesires: "Calm spaces",
    personaObjections: "Setup time",
    awarenessStage: "Problem aware",
    proofLabel: "Material specification",
    proofDetail: "Documented material details.",
    proofSource: "Product documentation",
    restrictionType: "PROHIBITED_CLAIM",
    restrictionValue: "Do not claim guaranteed results.",
    restrictionNotes: "Compliance rule",
    ...overrides,
  });
}
