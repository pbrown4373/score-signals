"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodType } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { BrandActionState } from "@/modules/brands/action-state";
import { BrandBrainRepository } from "@/modules/brands/repository";
import { requireTenantContext } from "@/modules/tenancy/context";
import {
  brandSchema,
  onboardingSchema,
  personaSchema,
  productSchema,
  proofPointSchema,
  readFormString,
  restrictionSchema,
} from "@/modules/brands/validation";

export async function bootstrapBrandBrainAction(
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parse(onboardingSchema, {
    brandName: readFormString(formData, "brand_name"),
    websiteUrl: readFormString(formData, "website_url"),
    category: readFormString(formData, "category"),
    description: readFormString(formData, "description"),
    voice: readFormString(formData, "voice"),
    productName: readFormString(formData, "product_name"),
    productDescription: readFormString(formData, "product_description"),
    priceDescription: readFormString(formData, "price_description"),
    offer: readFormString(formData, "offer"),
    personaName: readFormString(formData, "persona_name"),
    personaDescription: readFormString(formData, "persona_description"),
    personaPains: readFormString(formData, "persona_pains"),
    personaDesires: readFormString(formData, "persona_desires"),
    personaObjections: readFormString(formData, "persona_objections"),
    awarenessStage: readFormString(formData, "awareness_stage"),
    proofLabel: readFormString(formData, "proof_label"),
    proofDetail: readFormString(formData, "proof_detail"),
    proofSource: readFormString(formData, "proof_source"),
    restrictionType: readFormString(formData, "restriction_type"),
    restrictionValue: readFormString(formData, "restriction_value"),
    restrictionNotes: readFormString(formData, "restriction_notes"),
  });
  if (!parsed.success) return parsed.state;

  const access = await writableRepository();
  if (!access.success) return access.state;

  let brandId: string;
  try {
    brandId = await access.repository.bootstrap(parsed.data);
  } catch {
    return failure("Brand Brain setup could not be completed. Try again.");
  }

  revalidatePath("/app");
  revalidatePath("/app/brand-brain");
  redirect(`/app/brand-brain/${brandId}?onboarded=1`);
}

export async function createBrandAction(
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parseBrand(formData);
  if (!parsed.success) return parsed.state;
  const access = await writableRepository();
  if (!access.success) return access.state;

  let brandId: string;
  try {
    brandId = await access.repository.createBrand(parsed.data);
  } catch {
    return failure("The brand could not be created.");
  }
  revalidateBrandPaths();
  redirect(`/app/brand-brain/${brandId}`);
}

export async function updateBrandAction(
  brandId: string,
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parseBrand(formData);
  if (!parsed.success) return parsed.state;
  return mutate(brandId, "Brand updated.", async (repository) => {
    await repository.updateBrand(brandId, parsed.data);
  });
}

export async function deleteBrandAction(
  brandId: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  const access = await writableRepository();
  if (!access.success) return;
  await access.repository.deleteBrand(brandId);
  revalidateBrandPaths();
  redirect("/app/brand-brain");
}

export async function createProductAction(
  brandId: string,
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parse(productSchema, {
    name: readFormString(formData, "name"),
    description: readFormString(formData, "description"),
    priceDescription: readFormString(formData, "price_description"),
    offer: readFormString(formData, "offer"),
  });
  if (!parsed.success) return parsed.state;
  return mutate(brandId, "Product saved.", async (repository) => {
    await repository.createProduct(brandId, parsed.data);
  });
}

export async function updateProductAction(
  id: string,
  brandId: string,
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parse(productSchema, {
    name: readFormString(formData, "name"),
    description: readFormString(formData, "description"),
    priceDescription: readFormString(formData, "price_description"),
    offer: readFormString(formData, "offer"),
  });
  if (!parsed.success) return parsed.state;
  return mutate(brandId, "Product updated.", async (repository) => {
    await repository.updateProduct(id, parsed.data);
  });
}

export async function deleteProductAction(
  id: string,
  brandId: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  await remove(brandId, (repository) => repository.deleteProduct(id));
}

export async function createPersonaAction(
  brandId: string,
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parsePersona(formData);
  if (!parsed.success) return parsed.state;
  return mutate(brandId, "Persona saved.", async (repository) => {
    await repository.createPersona(brandId, parsed.data);
  });
}

export async function updatePersonaAction(
  id: string,
  brandId: string,
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parsePersona(formData);
  if (!parsed.success) return parsed.state;
  return mutate(brandId, "Persona updated.", async (repository) => {
    await repository.updatePersona(id, parsed.data);
  });
}

export async function deletePersonaAction(
  id: string,
  brandId: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  await remove(brandId, (repository) => repository.deletePersona(id));
}

export async function createProofPointAction(
  brandId: string,
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parseProofPoint(formData);
  if (!parsed.success) return parsed.state;
  return mutate(brandId, "Proof point saved.", async (repository) => {
    await repository.createProofPoint(brandId, parsed.data);
  });
}

export async function updateProofPointAction(
  id: string,
  brandId: string,
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parseProofPoint(formData);
  if (!parsed.success) return parsed.state;
  return mutate(brandId, "Proof point updated.", async (repository) => {
    await repository.updateProofPoint(id, parsed.data);
  });
}

export async function deleteProofPointAction(
  id: string,
  brandId: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  await remove(brandId, (repository) => repository.deleteProofPoint(id));
}

export async function createRestrictionAction(
  brandId: string,
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parseRestriction(formData);
  if (!parsed.success) return parsed.state;
  return mutate(brandId, "Restriction saved.", async (repository) => {
    await repository.createRestriction(brandId, parsed.data);
  });
}

export async function updateRestrictionAction(
  id: string,
  brandId: string,
  _state: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const parsed = parseRestriction(formData);
  if (!parsed.success) return parsed.state;
  return mutate(brandId, "Restriction updated.", async (repository) => {
    await repository.updateRestriction(id, parsed.data);
  });
}

export async function deleteRestrictionAction(
  id: string,
  brandId: string,
  _formData: FormData,
): Promise<void> {
  void _formData;
  await remove(brandId, (repository) => repository.deleteRestriction(id));
}

function parseBrand(formData: FormData) {
  return parse(brandSchema, {
    name: readFormString(formData, "name"),
    websiteUrl: readFormString(formData, "website_url"),
    category: readFormString(formData, "category"),
    description: readFormString(formData, "description"),
    voice: readFormString(formData, "voice"),
  });
}

function parsePersona(formData: FormData) {
  return parse(personaSchema, {
    name: readFormString(formData, "name"),
    description: readFormString(formData, "description"),
    pains: readFormString(formData, "pains"),
    desires: readFormString(formData, "desires"),
    objections: readFormString(formData, "objections"),
    awarenessStage: readFormString(formData, "awareness_stage"),
  });
}

function parseProofPoint(formData: FormData) {
  return parse(proofPointSchema, {
    label: readFormString(formData, "label"),
    detail: readFormString(formData, "detail"),
    sourceNote: readFormString(formData, "source_note"),
  });
}

function parseRestriction(formData: FormData) {
  return parse(restrictionSchema, {
    restrictionType: readFormString(formData, "restriction_type"),
    value: readFormString(formData, "value"),
    notes: readFormString(formData, "notes"),
  });
}

function parse<T>(schema: ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (result.success) return { success: true as const, data: result.data };
  return {
    success: false as const,
    state: {
      status: "error" as const,
      message: "Check the highlighted fields.",
      fieldErrors: result.error.flatten().fieldErrors,
    },
  };
}

async function writableRepository() {
  const context = await requireTenantContext();
  if (context.role === "VIEWER") {
    return {
      success: false as const,
      state: failure("Your VIEWER role has read-only access."),
    };
  }
  return {
    success: true as const,
    repository: new BrandBrainRepository(
      await createClient(),
      context.tenant.id,
    ),
  };
}

async function mutate(
  brandId: string,
  message: string,
  operation: (repository: BrandBrainRepository) => Promise<void>,
): Promise<BrandActionState> {
  const access = await writableRepository();
  if (!access.success) return access.state;
  try {
    await operation(access.repository);
  } catch {
    return failure("The change could not be saved.");
  }
  revalidatePath(`/app/brand-brain/${brandId}`);
  revalidateBrandPaths();
  return { status: "success", message };
}

async function remove(
  brandId: string,
  operation: (repository: BrandBrainRepository) => Promise<void>,
): Promise<void> {
  const access = await writableRepository();
  if (!access.success) return;
  await operation(access.repository);
  revalidatePath(`/app/brand-brain/${brandId}`);
  revalidateBrandPaths();
}

function revalidateBrandPaths() {
  revalidatePath("/app");
  revalidatePath("/app/brand-brain");
}

function failure(message: string): BrandActionState {
  return { status: "error", message };
}
