import type { ProviderAdapter } from "@/lib/providers/contracts";
import type { ProviderInvocation } from "@/lib/providers/lineage";
import type { TranscriptOutput } from "@/modules/analysis/contracts";

export type TranscriptionInput = {
  body: Uint8Array;
  filename: string;
  mimeType: string;
};

export interface TranscriptionProvider extends ProviderAdapter {
  readonly model: string;
  readonly name: "transcription";
  readonly provider: string;
  transcribe(
    input: TranscriptionInput,
  ): Promise<ProviderInvocation<TranscriptOutput>>;
}
