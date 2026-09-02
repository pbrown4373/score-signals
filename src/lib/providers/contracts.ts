export const providerNames = [
  "ai",
  "transcription",
  "storage",
  "jobs",
  "billing",
  "email",
  "analytics",
] as const;

export type ProviderName = (typeof providerNames)[number];
export type ProviderMode = "mock" | "live";

export type ProviderHealth = {
  name: ProviderName;
  mode: ProviderMode;
  status: "ready";
};

export interface ProviderAdapter {
  readonly name: ProviderName;
  readonly mode: ProviderMode;
  healthcheck(): Promise<ProviderHealth>;
}

export type ProviderRegistry = Readonly<Record<ProviderName, ProviderAdapter>>;
