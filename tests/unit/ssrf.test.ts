import { describe, expect, it } from "vitest";

import { isPublicAddress, validatePublicSourceUrl } from "@/modules/media/ssrf";

describe("safe URL intake", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.2",
    "::1",
    "fd00::1",
    "2001:db8::1",
    "::ffff:7f00:1",
  ])("rejects non-public address %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it("rejects credentials and DNS answers containing a private address", async () => {
    await expect(
      validatePublicSourceUrl("https://user:pass@example.com/video"),
    ).rejects.toThrow("cannot be imported");
    await expect(
      validatePublicSourceUrl("https://example.com/video", async () => [
        "93.184.216.34",
        "127.0.0.1",
      ]),
    ).rejects.toThrow("cannot be imported");
  });

  it("returns pinned public DNS answers for an approved adapter", async () => {
    await expect(
      validatePublicSourceUrl("https://example.com/video", async () => [
        "93.184.216.34",
      ]),
    ).resolves.toMatchObject({ resolvedAddresses: ["93.184.216.34"] });
  });
});
