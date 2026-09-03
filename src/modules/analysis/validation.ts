import Ajv2020 from "ajv/dist/2020.js";

import creativeDnaSchema from "../../../schemas/creative_dna.schema.json";
import transcriptSchema from "../../../schemas/transcript.schema.json";
import type {
  CreativeDNA,
  TranscriptOutput,
} from "@/modules/analysis/contracts";
import { MediaError } from "@/modules/media/errors";

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateCreativeDna = ajv.compile(creativeDnaSchema);
const validateTranscript = ajv.compile(transcriptSchema);

export const creativeDnaSchemaVersion = "1.0";
export const transcriptSchemaVersion = "1.0";

export function parseCreativeDNA(input: unknown): CreativeDNA {
  if (!validateCreativeDna(input)) {
    throw invalidOutput("Creative DNA did not match schema version 1.0.");
  }
  return input as CreativeDNA;
}

export function parseTranscript(input: unknown): TranscriptOutput {
  if (!validateTranscript(input)) {
    throw invalidOutput("Transcript did not match schema version 1.0.");
  }
  const transcript = input as TranscriptOutput;
  if (
    transcript.segments.some(
      (segment) => segment.end_seconds < segment.start_seconds,
    )
  ) {
    throw invalidOutput("Transcript segment timing is invalid.");
  }
  return transcript;
}

export function creativeDnaJsonSchema(): Record<string, unknown> {
  return structuredClone(creativeDnaSchema) as Record<string, unknown>;
}

export function strictCreativeDnaProviderSchema(): Record<string, unknown> {
  return makeStrict(creativeDnaJsonSchema()) as Record<string, unknown>;
}

function makeStrict(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(makeStrict);
  if (!value || typeof value !== "object") return value;
  const object = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, makeStrict(child)]),
  );
  delete object.$schema;
  if (object.type === "object" && isRecord(object.properties)) {
    object.required = Object.keys(object.properties);
  }
  return object;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function invalidOutput(message: string): MediaError {
  return new MediaError(
    "CREATIVE_ANALYSIS_INVALID_OUTPUT",
    message,
    422,
    false,
  );
}
