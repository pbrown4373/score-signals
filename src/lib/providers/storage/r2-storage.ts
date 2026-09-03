import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { ProviderHealth } from "@/lib/providers/contracts";
import type {
  StorageAdapter,
  StoredObject,
  StorageUploadTarget,
} from "@/lib/providers/storage/contracts";

export type R2StorageConfig = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  region: string;
  secretAccessKey: string;
};

export class R2StorageAdapter implements StorageAdapter {
  readonly mode = "live";
  readonly name = "storage";
  private readonly client: S3Client;

  constructor(private readonly config: R2StorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async healthcheck(): Promise<ProviderHealth> {
    return { name: this.name, mode: this.mode, status: "ready" };
  }

  async createUploadTarget(input: {
    contentLength: number;
    contentType: string;
    key: string;
    mockUploadUrl: string;
  }): Promise<StorageUploadTarget> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: input.key,
      ContentLength: input.contentLength,
      ContentType: input.contentType,
    });
    return {
      method: "PUT",
      url: await getSignedUrl(this.client, command, { expiresIn: 900 }),
      headers: { "content-type": input.contentType },
    };
  }

  async putObject(input: {
    body: Uint8Array;
    contentType: string;
    key: string;
  }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Body: input.body,
        Bucket: this.config.bucket,
        ContentLength: input.body.byteLength,
        ContentType: input.contentType,
        Key: input.key,
      }),
    );
  }

  async getObject(key: string): Promise<StoredObject> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );
    if (!response.Body) throw new Error("Storage object has no body.");
    const body = await response.Body.transformToByteArray();
    return {
      body,
      contentLength: response.ContentLength ?? body.byteLength,
      contentType: response.ContentType ?? null,
    };
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );
  }
}
