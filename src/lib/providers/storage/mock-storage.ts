import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

import type { ProviderHealth } from "@/lib/providers/contracts";
import type {
  StorageAdapter,
  StoredObject,
  StorageUploadTarget,
} from "@/lib/providers/storage/contracts";

export class MockStorageAdapter implements StorageAdapter {
  readonly mode = "mock";
  readonly name = "storage";

  constructor(private readonly rootDirectory: string) {}

  async healthcheck(): Promise<ProviderHealth> {
    return { name: this.name, mode: this.mode, status: "ready" };
  }

  async createUploadTarget(input: {
    contentLength: number;
    contentType: string;
    key: string;
    mockUploadUrl: string;
  }): Promise<StorageUploadTarget> {
    return {
      method: "PUT",
      url: input.mockUploadUrl,
      headers: { "content-type": input.contentType },
    };
  }

  async putObject(input: {
    body: Uint8Array;
    contentType: string;
    key: string;
  }): Promise<void> {
    const objectPath = this.objectPath(input.key);
    await mkdir(dirname(objectPath), { recursive: true });
    await Promise.all([
      writeFile(objectPath, input.body),
      writeFile(`${objectPath}.content-type`, input.contentType, "utf8"),
    ]);
  }

  async getObject(key: string): Promise<StoredObject> {
    const objectPath = this.objectPath(key);
    const [body, contentType] = await Promise.all([
      readFile(objectPath),
      readFile(`${objectPath}.content-type`, "utf8").catch(() => null),
    ]);
    return {
      body,
      contentLength: body.byteLength,
      contentType,
    };
  }

  async deleteObject(key: string): Promise<void> {
    const objectPath = this.objectPath(key);
    await Promise.all([
      rm(objectPath, { force: true }),
      rm(`${objectPath}.content-type`, { force: true }),
    ]);
  }

  private objectPath(key: string): string {
    const root = resolve(this.rootDirectory);
    const target = resolve(root, key);
    if (target !== root && !target.startsWith(`${root}${sep}`)) {
      throw new Error("Storage key escapes the private mock root.");
    }
    return target;
  }
}
