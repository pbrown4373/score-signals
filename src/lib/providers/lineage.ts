export type ProviderInvocation<T> = {
  costMicrousd: number | null;
  latencyMs: number;
  model: string;
  output: T;
  provider: string;
  requestId: string | null;
  usage: Record<string, unknown>;
};
