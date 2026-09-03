import OpenAI, { APIError, toFile } from "openai";

import type { ProviderHealth } from "@/lib/providers/contracts";
import type { TranscriptionProvider } from "@/lib/providers/transcription/contracts";
import { MediaError } from "@/modules/media/errors";

export class OpenAITranscriptionProvider implements TranscriptionProvider {
  readonly mode = "live";
  readonly name = "transcription";
  readonly provider = "openai";
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async healthcheck(): Promise<ProviderHealth> {
    return { name: this.name, mode: this.mode, status: "ready" };
  }

  async transcribe(input: {
    body: Uint8Array;
    filename: string;
    mimeType: string;
  }) {
    const started = performance.now();
    try {
      const response = await this.client.audio.transcriptions.create({
        file: await toFile(Buffer.from(input.body), input.filename, {
          type: input.mimeType,
        }),
        model: this.model,
        response_format: "json",
      });
      const language =
        "languages" in response
          ? (response.languages?.[0]?.code ?? null)
          : null;
      return {
        costMicrousd: null,
        latencyMs: Math.round(performance.now() - started),
        model: this.model,
        output: {
          schema_version: "1.0" as const,
          language,
          text: response.text,
          segments: [],
        },
        provider: this.provider,
        requestId: null,
        usage:
          "usage" in response && response.usage
            ? JSON.parse(JSON.stringify(response.usage))
            : {},
      };
    } catch (cause) {
      throw providerError("Transcription provider failed.", cause);
    }
  }
}

function providerError(message: string, cause: unknown): MediaError {
  const retryable =
    cause instanceof APIError &&
    (cause.status === 408 ||
      cause.status === 409 ||
      cause.status === 429 ||
      cause.status >= 500);
  return new MediaError(
    "CREATIVE_ANALYSIS_PROVIDER_FAILED",
    message,
    502,
    retryable,
    { cause },
  );
}
