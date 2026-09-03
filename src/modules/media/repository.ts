import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, Tables } from "@/lib/supabase/database.types";
import { MediaError } from "@/modules/media/errors";
import type { UploadInitInput } from "@/modules/media/validation";

export type CreativeAsset = Tables<"creative_assets">;
export type MediaArtifact = Tables<"media_artifacts">;
export type MediaUpload = Tables<"media_uploads">;
export type BackgroundJob = Tables<"background_jobs">;

export type CreativeDetail = {
  artifacts: MediaArtifact[];
  asset: CreativeAsset;
  job: BackgroundJob | null;
  upload: MediaUpload | null;
};

export class MediaRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly tenantId: string,
  ) {}

  async initializeUpload(input: UploadInitInput) {
    const { data, error } = await this.supabase.rpc(
      "initialize_creative_upload",
      {
        requested_byte_size: input.byte_size,
        requested_filename: input.filename,
        requested_initiation_key: input.idempotency_key,
        requested_mime_type: input.mime_type,
        requested_title: input.title,
      },
    );
    const initialized = data?.[0];
    if (error || !initialized)
      throw repositoryError("initialize upload", error);
    return initialized;
  }

  async getUpload(assetId: string): Promise<MediaUpload | null> {
    const { data, error } = await this.supabase
      .from("media_uploads")
      .select("*")
      .eq("tenant_id", this.tenantId)
      .eq("creative_asset_id", assetId)
      .maybeSingle();
    if (error) throw repositoryError("load upload", error);
    return data;
  }

  async listCreatives(): Promise<CreativeAsset[]> {
    const { data, error } = await this.supabase
      .from("creative_assets")
      .select("*")
      .eq("tenant_id", this.tenantId)
      .order("created_at", { ascending: false });
    if (error) throw repositoryError("load creative library", error);
    return data;
  }

  async getCreative(assetId: string): Promise<CreativeDetail | null> {
    const assetResult = await this.supabase
      .from("creative_assets")
      .select("*")
      .eq("tenant_id", this.tenantId)
      .eq("id", assetId)
      .maybeSingle();
    if (assetResult.error)
      throw repositoryError("load creative", assetResult.error);
    if (!assetResult.data) return null;

    const [artifacts, upload, jobs] = await Promise.all([
      this.supabase
        .from("media_artifacts")
        .select("*")
        .eq("tenant_id", this.tenantId)
        .eq("creative_asset_id", assetId)
        .order("created_at"),
      this.supabase
        .from("media_uploads")
        .select("*")
        .eq("tenant_id", this.tenantId)
        .eq("creative_asset_id", assetId)
        .maybeSingle(),
      this.supabase
        .from("background_jobs")
        .select("*")
        .eq("tenant_id", this.tenantId)
        .contains("payload", { creative_asset_id: assetId })
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    for (const result of [artifacts, upload, jobs]) {
      if (result.error)
        throw repositoryError("load creative details", result.error);
    }
    return {
      artifacts: artifacts.data ?? [],
      asset: assetResult.data,
      job: jobs.data?.[0] ?? null,
      upload: upload.data,
    };
  }

  async retry(assetId: string): Promise<string> {
    const { data, error } = await this.supabase.rpc(
      "retry_creative_processing",
      { requested_asset_id: assetId },
    );
    if (error || !data) {
      throw new MediaError(
        "CREATIVE_RETRY_NOT_ALLOWED",
        "This creative cannot be retried in its current state.",
        409,
      );
    }
    return data;
  }

  async delete(assetId: string): Promise<void> {
    const { data: asset, error: loadError } = await this.supabase
      .from("creative_assets")
      .select("source_id")
      .eq("tenant_id", this.tenantId)
      .eq("id", assetId)
      .maybeSingle();
    if (loadError)
      throw repositoryError("load creative for deletion", loadError);
    const { error } = await this.supabase
      .from("creative_assets")
      .delete()
      .eq("tenant_id", this.tenantId)
      .eq("id", assetId);
    if (error) throw repositoryError("delete creative", error);
    if (asset?.source_id) {
      const { error: sourceError } = await this.supabase
        .from("sources")
        .delete()
        .eq("tenant_id", this.tenantId)
        .eq("id", asset.source_id);
      if (sourceError)
        throw repositoryError("delete creative source", sourceError);
    }
  }
}

export class MediaWorkerRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async completeUpload(input: {
    assetId: string;
    byteSize: number;
    mimeType: string;
    retentionDays: number;
    sha256: string;
  }): Promise<string> {
    const { data, error } = await this.supabase.rpc(
      "complete_creative_upload",
      {
        raw_retention_days: input.retentionDays,
        requested_asset_id: input.assetId,
        verified_byte_size: input.byteSize,
        verified_mime_type: input.mimeType,
        verified_sha256: input.sha256,
      },
    );
    if (error || !data) throw repositoryError("complete upload", error);
    return data;
  }

  async rejectUpload(assetId: string, error: MediaError): Promise<void> {
    const result = await this.supabase.rpc("reject_creative_upload", {
      requested_asset_id: assetId,
      requested_error_code: error.code,
      requested_error_message: error.message,
    });
    if (result.error) throw repositoryError("reject upload", result.error);
  }

  async claim(jobId: string) {
    const { data, error } = await this.supabase.rpc("claim_media_job", {
      requested_job_id: jobId,
    });
    if (error) throw repositoryError("claim media job", error);
    return data?.[0] ?? null;
  }

  async getUpload(assetId: string): Promise<MediaUpload> {
    const { data, error } = await this.supabase
      .from("media_uploads")
      .select("*")
      .eq("creative_asset_id", assetId)
      .single();
    if (error || !data) throw repositoryError("load worker upload", error);
    return data;
  }

  async finish(
    jobId: string,
    metadata: { duration_ms: number; height: number; width: number },
    artifacts: Array<{
      byte_size: number;
      kind: MediaArtifact["kind"];
      metadata: Json;
      mime_type: string;
      storage_key: string;
    }>,
  ): Promise<void> {
    const { error } = await this.supabase.rpc("finish_media_job", {
      derived_artifacts: artifacts,
      media_metadata: metadata,
      requested_job_id: jobId,
    });
    if (error) throw repositoryError("finish media job", error);
  }

  async fail(jobId: string, error: MediaError): Promise<void> {
    const result = await this.supabase.rpc("fail_media_job", {
      requested_error_code: error.code,
      requested_error_message: error.message,
      requested_job_id: jobId,
    });
    if (result.error) throw repositoryError("fail media job", result.error);
  }
}

function repositoryError(action: string, cause: unknown): Error {
  return new Error(`Unable to ${action}.`, { cause });
}
