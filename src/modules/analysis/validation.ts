import Ajv2020 from "ajv/dist/2020.js";

import creativeDnaSchema from "../../../schemas/creative_dna.schema.json";
import restrictedElementsSchema from "../../../schemas/restricted_elements.schema.json";
import skeletonSchema from "../../../schemas/skeleton.schema.json";
import transcriptSchema from "../../../schemas/transcript.schema.json";
import type {
  CreativeDNA,
  Skeleton,
  SkeletonExtraction,
  TranscriptOutput,
} from "@/modules/analysis/contracts";
import { MediaError } from "@/modules/media/errors";

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateCreativeDna = ajv.compile(creativeDnaSchema);
const validateSkeleton = ajv.compile(skeletonSchema);
const skeletonExtractionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "skeleton", "restricted_elements"],
  properties: {
    schema_version: { const: "1.0" },
    skeleton: withoutMetaSchema(skeletonSchema),
    restricted_elements:
      restrictedElementsSchema.properties.restricted_elements,
  },
} as const;
const validateSkeletonExtraction = ajv.compile(skeletonExtractionSchema);
const validateTranscript = ajv.compile(transcriptSchema);

export const creativeDnaSchemaVersion = "1.0";
export const skeletonSchemaVersion = "1.0";
export const transcriptSchemaVersion = "1.0";

export function parseCreativeDNA(input: unknown): CreativeDNA {
  if (!validateCreativeDna(input)) {
    throw invalidOutput(
      "CREATIVE_ANALYSIS_INVALID_OUTPUT",
      "Creative DNA did not match schema version 1.0.",
    );
  }
  return input as CreativeDNA;
}

export function parseTranscript(input: unknown): TranscriptOutput {
  if (!validateTranscript(input)) {
    throw invalidOutput(
      "CREATIVE_ANALYSIS_INVALID_OUTPUT",
      "Transcript did not match schema version 1.0.",
    );
  }
  const transcript = input as TranscriptOutput;
  if (
    transcript.segments.some(
      (segment) => segment.end_seconds < segment.start_seconds,
    )
  ) {
    throw invalidOutput(
      "CREATIVE_ANALYSIS_INVALID_OUTPUT",
      "Transcript segment timing is invalid.",
    );
  }
  return transcript;
}

export function parseSkeletonExtraction(input: unknown): SkeletonExtraction {
  if (!validateSkeletonExtraction(input)) {
    throw invalidOutput(
      "SKELETON_INVALID_OUTPUT",
      "Skeleton extraction did not match schema version 1.0.",
    );
  }
  const extraction = input as SkeletonExtraction;
  assertRestrictedElements(extraction);
  assertOriginalityBoundary(extraction);
  return extraction;
}

function assertRestrictedElements(extraction: SkeletonExtraction): void {
  const seen = new Set<string>();
  for (const element of extraction.restricted_elements) {
    const normalized = normalize(element.value);
    const key = `${element.element_type}:${normalized}`;
    if (normalized.length < 2 || seen.has(key)) {
      throw invalidOutput(
        "SKELETON_INVALID_OUTPUT",
        "Restricted elements must be distinct and contain meaningful text.",
      );
    }
    seen.add(key);
  }
}

export function parseSkeleton(input: unknown): Skeleton {
  if (!validateSkeleton(input)) {
    throw invalidOutput(
      "SKELETON_INVALID_OUTPUT",
      "Skeleton did not match schema version 1.0.",
    );
  }
  return input as Skeleton;
}

export function creativeDnaJsonSchema(): Record<string, unknown> {
  return structuredClone(creativeDnaSchema) as Record<string, unknown>;
}

export function strictCreativeDnaProviderSchema(): Record<string, unknown> {
  return makeStrict(creativeDnaJsonSchema()) as Record<string, unknown>;
}

export function strictSkeletonExtractionProviderSchema(): Record<
  string,
  unknown
> {
  return makeStrict(structuredClone(skeletonExtractionSchema)) as Record<
    string,
    unknown
  >;
}

function assertOriginalityBoundary(extraction: SkeletonExtraction): void {
  const skeletonText = normalize(JSON.stringify(extraction.skeleton));
  const leaked = extraction.restricted_elements.find((element) => {
    const restricted = normalize(element.value);
    return restricted.length > 1 && skeletonText.includes(restricted);
  });
  if (leaked) {
    throw invalidOutput(
      "SKELETON_BOUNDARY_VIOLATION",
      `Skeleton contains restricted ${leaked.element_type.toLowerCase()} content.`,
    );
  }
}

export function normalizeRestrictedValue(value: string): string {
  return normalize(value);
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

function withoutMetaSchema<T extends Record<string, unknown>>(schema: T) {
  const copy = structuredClone(schema) as T & { $schema?: string };
  delete copy.$schema;
  return copy;
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function invalidOutput(
  code:
    | "CREATIVE_ANALYSIS_INVALID_OUTPUT"
    | "SKELETON_INVALID_OUTPUT"
    | "SKELETON_BOUNDARY_VIOLATION",
  message: string,
): MediaError {
  return new MediaError(code, message, 422, false);
}
