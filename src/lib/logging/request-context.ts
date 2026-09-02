import { randomUUID } from "node:crypto";

const requestIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/;

export function resolveRequestId(headers: Headers): string {
  const candidate = headers.get("x-request-id");
  return candidate && requestIdPattern.test(candidate)
    ? candidate
    : randomUUID();
}
