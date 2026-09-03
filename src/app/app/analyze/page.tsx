import { MediaUploadForm } from "@/components/media-upload-form";
import { getServerEnvironment } from "@/lib/env/server";
import { requireTenantContext } from "@/modules/tenancy/context";

export default async function AnalyzePage() {
  const context = await requireTenantContext();
  const canWrite = context.role !== "VIEWER";

  return (
    <main className="p-6 sm:p-10">
      <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Analyze
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Add a creative
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
        Uploads stay private. SCORE validates the file bytes, records a content
        hash, normalizes the video, and extracts audio and representative
        frames.
      </p>
      <section className="mt-8 max-w-2xl rounded-3xl border border-[var(--line)] bg-[var(--background)] p-7">
        {canWrite ? (
          <MediaUploadForm
            maximumMegabytes={getServerEnvironment().MAX_UPLOAD_MB}
          />
        ) : (
          <p className="text-[var(--muted)]">
            Viewer access is read-only. Ask a workspace member to upload a
            creative.
          </p>
        )}
      </section>
      <p className="mt-6 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        URL intake is restricted to explicitly approved platform adapters. No
        arbitrary page scraping or public-performance claims are used.
      </p>
    </main>
  );
}
