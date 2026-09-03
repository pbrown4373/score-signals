import { createHash } from "node:crypto";

export function fingerprint(input: unknown): string {
  return createHash("sha256").update(canonicalJson(input)).digest("hex");
}

function canonicalJson(input: unknown): string {
  if (Array.isArray(input)) return `[${input.map(canonicalJson).join(",")}]`;
  if (input && typeof input === "object") {
    return `{${Object.entries(input)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${JSON.stringify(key)}:${canonicalJson(value)}`)
      .join(",")}}`;
  }
  return JSON.stringify(input);
}
