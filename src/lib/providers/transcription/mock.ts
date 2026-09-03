import { randomUUID } from "node:crypto";

import type { ProviderHealth } from "@/lib/providers/contracts";
import type { TranscriptionProvider } from "@/lib/providers/transcription/contracts";
import type { TranscriptOutput } from "@/modules/analysis/contracts";

export class MockTranscriptionProvider implements TranscriptionProvider {
  readonly mode = "mock";
  readonly model = "mock-transcription-v1";
  readonly name = "transcription";
  readonly provider = "mock";

  constructor(
    private readonly output: TranscriptOutput = {
      schema_version: "1.0",
      language: "en",
      text: "A creator introduces a common organization problem, demonstrates a compact kit, gives a documented material detail, and invites viewers to learn more.",
      segments: [
        {
          start_seconds: 0,
          end_seconds: 1,
          text: "A creator presents a short product demonstration.",
        },
      ],
    },
  ) {}

  async healthcheck(): Promise<ProviderHealth> {
    return { name: this.name, mode: this.mode, status: "ready" };
  }

  async transcribe() {
    return {
      costMicrousd: 0,
      latencyMs: 0,
      model: this.model,
      output: structuredClone(this.output),
      provider: this.provider,
      requestId: randomUUID(),
      usage: { audio_seconds: 1 },
    };
  }
}
