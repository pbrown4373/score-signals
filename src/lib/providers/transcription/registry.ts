import { getServerEnvironment } from "@/lib/env/server";
import type { TranscriptionProvider } from "@/lib/providers/transcription/contracts";
import { MockTranscriptionProvider } from "@/lib/providers/transcription/mock";
import { OpenAITranscriptionProvider } from "@/lib/providers/transcription/openai";

export function createTranscriptionProvider(): TranscriptionProvider {
  const environment = getServerEnvironment();
  if (environment.SCORE_PROVIDER_MODE === "mock") {
    return new MockTranscriptionProvider();
  }
  if (!environment.OPENAI_API_KEY) {
    throw new Error("Live transcription requires OPENAI_API_KEY.");
  }
  return new OpenAITranscriptionProvider(
    environment.OPENAI_API_KEY,
    environment.SCORE_MODEL_TRANSCRIPTION,
  );
}
