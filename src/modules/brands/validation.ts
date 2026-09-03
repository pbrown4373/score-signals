import { z } from "zod";

const requiredText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} must contain at least ${min} characters.`)
    .max(max, `${label} must contain at most ${max} characters.`);

const optionalText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable(),
  );

const optionalSizedText = (min: number, max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().min(min).max(max).nullable(),
  );

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.url("Enter a complete URL, including https://.").max(2048).nullable(),
);

const lineList = z.preprocess(
  (value) =>
    typeof value === "string"
      ? value
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
      : value,
  z.array(z.string().min(1).max(240)).max(10),
);

export const restrictionTypes = [
  "PROHIBITED_CLAIM",
  "REQUIRED_DISCLAIMER",
  "TONE",
  "COMPETITOR",
  "OTHER",
] as const;

export const brandSchema = z.object({
  name: requiredText("Brand name", 2, 120),
  websiteUrl: optionalUrl,
  category: optionalText(120),
  description: optionalText(2000),
  voice: optionalText(1000),
});

export const onboardingSchema = z
  .object({
    brandName: requiredText("Brand name", 2, 120),
    websiteUrl: optionalUrl,
    category: requiredText("Category", 2, 120),
    description: requiredText("Description", 10, 2000),
    voice: optionalText(1000),
    productName: optionalSizedText(2, 120),
    productDescription: optionalText(2000),
    priceDescription: optionalText(240),
    offer: optionalText(1000),
    personaName: optionalSizedText(2, 120),
    personaDescription: optionalText(2000),
    personaPains: lineList,
    personaDesires: lineList,
    personaObjections: lineList,
    awarenessStage: optionalText(120),
    proofLabel: optionalSizedText(2, 120),
    proofDetail: optionalSizedText(2, 1000),
    proofSource: optionalText(500),
    restrictionType: z.enum(restrictionTypes),
    restrictionValue: optionalSizedText(2, 1000),
    restrictionNotes: optionalText(500),
  })
  .superRefine((value, context) => {
    requireCompanion(
      context,
      value.productName,
      [value.productDescription, value.priceDescription, value.offer].some(
        Boolean,
      ),
      "productName",
      "Add a product name or clear the optional product fields.",
    );
    requireCompanion(
      context,
      value.personaName,
      Boolean(
        value.personaDescription ||
        value.awarenessStage ||
        value.personaPains.length ||
        value.personaDesires.length ||
        value.personaObjections.length,
      ),
      "personaName",
      "Add a persona name or clear the optional persona fields.",
    );

    if (Boolean(value.proofLabel) !== Boolean(value.proofDetail)) {
      context.addIssue({
        code: "custom",
        path: [value.proofLabel ? "proofDetail" : "proofLabel"],
        message: "Proof label and detail must be provided together.",
      });
    }
  });

export const productSchema = z.object({
  name: requiredText("Product name", 2, 120),
  description: optionalText(2000),
  priceDescription: optionalText(240),
  offer: optionalText(1000),
});

export const personaSchema = z.object({
  name: requiredText("Persona name", 2, 120),
  description: optionalText(2000),
  pains: lineList,
  desires: lineList,
  objections: lineList,
  awarenessStage: optionalText(120),
});

export const proofPointSchema = z.object({
  label: requiredText("Proof label", 2, 120),
  detail: requiredText("Proof detail", 2, 1000),
  sourceNote: optionalText(500),
});

export const restrictionSchema = z.object({
  restrictionType: z.enum(restrictionTypes),
  value: requiredText("Restriction", 2, 1000),
  notes: optionalText(500),
});

export type BrandInput = z.infer<typeof brandSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type PersonaInput = z.infer<typeof personaSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProofPointInput = z.infer<typeof proofPointSchema>;
export type RestrictionInput = z.infer<typeof restrictionSchema>;

export function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function requireCompanion(
  context: z.RefinementCtx,
  name: string | null,
  hasDetails: boolean,
  path: string,
  message: string,
) {
  if (!name && hasDetails) {
    context.addIssue({ code: "custom", path: [path], message });
  }
}
