import type { ProviderAdapter } from "@/lib/providers/contracts";
import type { ProviderInvocation } from "@/lib/providers/lineage";

export type ModelImageInput = {
  body: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

export type StructuredModelInput = {
  images: ModelImageInput[];
  instructions: string;
  schema: Record<string, unknown>;
  schemaName: string;
  text: string;
};

export interface ModelGateway extends ProviderAdapter {
  readonly model: string;
  readonly name: "ai";
  readonly provider: string;
  generateStructured(
    input: StructuredModelInput,
  ): Promise<ProviderInvocation<unknown>>;
}
