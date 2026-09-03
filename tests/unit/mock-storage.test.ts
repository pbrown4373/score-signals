import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { MockStorageAdapter } from "@/lib/providers/storage/mock-storage";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("MockStorageAdapter", () => {
  it("stores private bytes and metadata without a public URL", async () => {
    const root = await mkdtemp(join(tmpdir(), "score-storage-test-"));
    directories.push(root);
    const storage = new MockStorageAdapter(root);
    await storage.putObject({
      body: new TextEncoder().encode("private"),
      contentType: "video/mp4",
      key: "tenant/creative/original/video.mp4",
    });
    const stored = await storage.getObject(
      "tenant/creative/original/video.mp4",
    );
    expect(new TextDecoder().decode(stored.body)).toBe("private");
    expect(stored.contentType).toBe("video/mp4");
  });

  it("blocks storage-key traversal", async () => {
    const root = await mkdtemp(join(tmpdir(), "score-storage-test-"));
    directories.push(root);
    const storage = new MockStorageAdapter(root);
    await expect(
      storage.putObject({
        body: new Uint8Array(),
        contentType: "text/plain",
        key: "../escape",
      }),
    ).rejects.toThrow("escapes the private mock root");
  });
});
