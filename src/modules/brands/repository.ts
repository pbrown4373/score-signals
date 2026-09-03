import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, Tables } from "@/lib/supabase/database.types";
import type {
  BrandInput,
  OnboardingInput,
  PersonaInput,
  ProductInput,
  ProofPointInput,
  RestrictionInput,
} from "@/modules/brands/validation";

export type Brand = Tables<"brands">;
export type Product = Tables<"products">;
export type Persona = Tables<"personas">;
export type ProofPoint = Tables<"brand_proof_points">;
export type Restriction = Tables<"brand_restrictions">;

export type BrandBrain = {
  brand: Brand;
  personas: Persona[];
  products: Product[];
  proofPoints: ProofPoint[];
  restrictions: Restriction[];
};

export class BrandBrainRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly tenantId: string,
  ) {}

  async listBrands(): Promise<Brand[]> {
    const { data, error } = await this.supabase
      .from("brands")
      .select("*")
      .eq("tenant_id", this.tenantId)
      .order("created_at");

    if (error) throw repositoryError("load brands", error);
    return data;
  }

  async getBrandBrain(brandId: string): Promise<BrandBrain | null> {
    const brandResult = await this.supabase
      .from("brands")
      .select("*")
      .eq("tenant_id", this.tenantId)
      .eq("id", brandId)
      .maybeSingle();

    if (brandResult.error) {
      throw repositoryError("load brand", brandResult.error);
    }
    if (!brandResult.data) return null;

    const [products, personas, proofPoints, restrictions] = await Promise.all([
      this.supabase
        .from("products")
        .select("*")
        .eq("tenant_id", this.tenantId)
        .eq("brand_id", brandId)
        .order("created_at"),
      this.supabase
        .from("personas")
        .select("*")
        .eq("tenant_id", this.tenantId)
        .eq("brand_id", brandId)
        .order("created_at"),
      this.supabase
        .from("brand_proof_points")
        .select("*")
        .eq("tenant_id", this.tenantId)
        .eq("brand_id", brandId)
        .order("created_at"),
      this.supabase
        .from("brand_restrictions")
        .select("*")
        .eq("tenant_id", this.tenantId)
        .eq("brand_id", brandId)
        .order("created_at"),
    ]);

    for (const result of [products, personas, proofPoints, restrictions]) {
      if (result.error) throw repositoryError("load Brand Brain", result.error);
    }

    return {
      brand: brandResult.data,
      products: products.data ?? [],
      personas: personas.data ?? [],
      proofPoints: proofPoints.data ?? [],
      restrictions: restrictions.data ?? [],
    };
  }

  async bootstrap(input: OnboardingInput): Promise<string> {
    const { data, error } = await this.supabase.rpc("bootstrap_brand_brain", {
      input: {
        brand_name: input.brandName,
        website_url: input.websiteUrl,
        category: input.category,
        description: input.description,
        voice: input.voice,
        product_name: input.productName,
        product_description: input.productDescription,
        price_description: input.priceDescription,
        offer: input.offer,
        persona_name: input.personaName,
        persona_description: input.personaDescription,
        persona_pains: input.personaPains,
        persona_desires: input.personaDesires,
        persona_objections: input.personaObjections,
        awareness_stage: input.awarenessStage,
        proof_label: input.proofLabel,
        proof_detail: input.proofDetail,
        proof_source: input.proofSource,
        restriction_type: input.restrictionType,
        restriction_value: input.restrictionValue,
        restriction_notes: input.restrictionNotes,
      },
    });

    if (error || !data) throw repositoryError("complete onboarding", error);
    return data;
  }

  async createBrand(input: BrandInput): Promise<string> {
    const { data, error } = await this.supabase
      .from("brands")
      .insert({
        tenant_id: this.tenantId,
        name: input.name,
        website_url: input.websiteUrl,
        category: input.category,
        description: input.description,
        brand_voice: voicePayload(input.voice),
      })
      .select("id")
      .single();

    if (error) throw repositoryError("create brand", error);
    return data.id;
  }

  async updateBrand(brandId: string, input: BrandInput): Promise<void> {
    const { error } = await this.supabase
      .from("brands")
      .update({
        name: input.name,
        website_url: input.websiteUrl,
        category: input.category,
        description: input.description,
        brand_voice: voicePayload(input.voice),
      })
      .eq("tenant_id", this.tenantId)
      .eq("id", brandId)
      .select("id")
      .single();
    if (error) throw repositoryError("update brand", error);
  }

  async deleteBrand(brandId: string): Promise<void> {
    await this.deleteOne("brands", brandId);
  }

  async createProduct(brandId: string, input: ProductInput): Promise<void> {
    const { error } = await this.supabase.from("products").insert({
      tenant_id: this.tenantId,
      brand_id: brandId,
      name: input.name,
      description: input.description,
      price_description: input.priceDescription,
      offer_details: offerPayload(input.offer),
    });
    if (error) throw repositoryError("create product", error);
  }

  async updateProduct(id: string, input: ProductInput): Promise<void> {
    const { error } = await this.supabase
      .from("products")
      .update({
        name: input.name,
        description: input.description,
        price_description: input.priceDescription,
        offer_details: offerPayload(input.offer),
      })
      .eq("tenant_id", this.tenantId)
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw repositoryError("update product", error);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.deleteOne("products", id);
  }

  async createPersona(brandId: string, input: PersonaInput): Promise<void> {
    const { error } = await this.supabase.from("personas").insert({
      tenant_id: this.tenantId,
      brand_id: brandId,
      name: input.name,
      description: input.description,
      pains: input.pains,
      desires: input.desires,
      objections: input.objections,
      awareness_stage: input.awarenessStage,
    });
    if (error) throw repositoryError("create persona", error);
  }

  async updatePersona(id: string, input: PersonaInput): Promise<void> {
    const { error } = await this.supabase
      .from("personas")
      .update({
        name: input.name,
        description: input.description,
        pains: input.pains,
        desires: input.desires,
        objections: input.objections,
        awareness_stage: input.awarenessStage,
      })
      .eq("tenant_id", this.tenantId)
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw repositoryError("update persona", error);
  }

  async deletePersona(id: string): Promise<void> {
    await this.deleteOne("personas", id);
  }

  async createProofPoint(
    brandId: string,
    input: ProofPointInput,
  ): Promise<void> {
    const { error } = await this.supabase.from("brand_proof_points").insert({
      tenant_id: this.tenantId,
      brand_id: brandId,
      label: input.label,
      detail: input.detail,
      source_note: input.sourceNote,
    });
    if (error) throw repositoryError("create proof point", error);
  }

  async updateProofPoint(id: string, input: ProofPointInput): Promise<void> {
    const { error } = await this.supabase
      .from("brand_proof_points")
      .update({
        label: input.label,
        detail: input.detail,
        source_note: input.sourceNote,
      })
      .eq("tenant_id", this.tenantId)
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw repositoryError("update proof point", error);
  }

  async deleteProofPoint(id: string): Promise<void> {
    await this.deleteOne("brand_proof_points", id);
  }

  async createRestriction(
    brandId: string,
    input: RestrictionInput,
  ): Promise<void> {
    const { error } = await this.supabase.from("brand_restrictions").insert({
      tenant_id: this.tenantId,
      brand_id: brandId,
      restriction_type: input.restrictionType,
      value: input.value,
      notes: input.notes,
    });
    if (error) throw repositoryError("create restriction", error);
  }

  async updateRestriction(id: string, input: RestrictionInput): Promise<void> {
    const { error } = await this.supabase
      .from("brand_restrictions")
      .update({
        restriction_type: input.restrictionType,
        value: input.value,
        notes: input.notes,
      })
      .eq("tenant_id", this.tenantId)
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw repositoryError("update restriction", error);
  }

  async deleteRestriction(id: string): Promise<void> {
    await this.deleteOne("brand_restrictions", id);
  }

  private async deleteOne(
    table:
      | "brands"
      | "products"
      | "personas"
      | "brand_proof_points"
      | "brand_restrictions",
    id: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq("tenant_id", this.tenantId)
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw repositoryError(`delete ${table}`, error);
  }
}

export function readJsonDescription(value: Json): string {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.description === "string"
  ) {
    return value.description;
  }
  return "";
}

export function readJsonSummary(value: Json): string {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.summary === "string"
  ) {
    return value.summary;
  }
  return "";
}

export function readStringList(value: Json): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function voicePayload(voice: string | null): Json {
  return { description: voice ?? "" };
}

function offerPayload(offer: string | null): Json {
  return { summary: offer ?? "" };
}

function repositoryError(operation: string, cause: unknown): Error {
  return new Error(`Unable to ${operation}.`, { cause });
}
