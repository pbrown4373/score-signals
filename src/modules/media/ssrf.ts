import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

import { MediaError } from "@/modules/media/errors";
import type { SafeSourceUrl } from "@/modules/media/source-adapters";

type AddressResolver = (hostname: string) => Promise<string[]>;

export async function validatePublicSourceUrl(
  rawUrl: string,
  resolver: AddressResolver = resolveAll,
): Promise<SafeSourceUrl> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw unsafeUrl();
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw unsafeUrl();
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw unsafeUrl();
  }

  const addresses = isIP(hostname) ? [hostname] : await resolver(hostname);
  if (
    !addresses.length ||
    addresses.some((address) => !isPublicAddress(address))
  ) {
    throw unsafeUrl();
  }

  return { resolvedAddresses: [...new Set(addresses)].sort(), url };
}

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) return isPublicIpv4(address);
  if (isIP(address) === 6) return isPublicIpv6(address);
  return false;
}

async function resolveAll(hostname: string): Promise<string[]> {
  try {
    const results = await lookup(hostname, { all: true, verbatim: true });
    return results.map((result) => result.address);
  } catch {
    throw unsafeUrl();
  }
}

function isPublicIpv4(address: string): boolean {
  const [a = 0, b = 0, c = 0] = address.split(".").map(Number);
  if (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  ) {
    return false;
  }
  return true;
}

function isPublicIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  ) {
    return false;
  }
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice(7);
    if (isIP(mapped) === 4) return isPublicIpv4(mapped);
    const parts = mapped.split(":");
    if (parts.length === 2) {
      const high = Number.parseInt(parts[0] ?? "", 16);
      const low = Number.parseInt(parts[1] ?? "", 16);
      if (Number.isFinite(high) && Number.isFinite(low)) {
        return isPublicIpv4(
          `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`,
        );
      }
    }
    return false;
  }
  return true;
}

function unsafeUrl(): MediaError {
  return new MediaError(
    "CREATIVE_UNSUPPORTED_SOURCE",
    "This source cannot be imported directly. Upload the video file instead.",
    400,
  );
}
