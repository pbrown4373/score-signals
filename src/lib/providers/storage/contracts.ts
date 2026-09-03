import type { ProviderAdapter } from "@/lib/providers/contracts";

export type StoredObject = {
  body: Uint8Array;
  contentLength: number;
  contentType: string | null;
};

export type StorageUploadTarget = {
  headers: Record<string, string>;
  method: "PUT";
  url: string;
};

export interface StorageAdapter extends ProviderAdapter {
  readonly name: "storage";
  createUploadTarget(input: {
    contentLength: number;
    contentType: string;
    key: string;
    mockUploadUrl: string;
  }): Promise<StorageUploadTarget>;
  deleteObject(key: string): Promise<void>;
  getObject(key: string): Promise<StoredObject>;
  putObject(input: {
    body: Uint8Array;
    contentType: string;
    key: string;
  }): Promise<void>;
}
