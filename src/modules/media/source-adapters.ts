export type SafeSourceUrl = {
  resolvedAddresses: string[];
  url: URL;
};

export type SourceAcquisitionPolicy = {
  maximumBytes: number;
  maximumRedirects: number;
  timeoutMilliseconds: number;
};

export interface SourceAdapter {
  readonly name: string;
  supports(url: URL): boolean;
  importSource(input: {
    policy: SourceAcquisitionPolicy;
    source: SafeSourceUrl;
  }): Promise<never>;
}

export function selectSourceAdapter(
  url: URL,
  adapters: readonly SourceAdapter[],
): SourceAdapter | null {
  return adapters.find((adapter) => adapter.supports(url)) ?? null;
}

export const approvedSourceAdapters: readonly SourceAdapter[] = [];
