import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaRetryButton } from "@/components/media-retry-button";
import { createClient } from "@/lib/supabase/server";
import { MediaRepository } from "@/modules/media/repository";
import { requireTenantContext } from "@/modules/tenancy/context";

export default async function CreativePage({
  params,
}: {
  params: Promise<{ creativeId: string }>;
}) {
  const { creativeId } = await params;
  const context = await requireTenantContext();
  const creative = await new MediaRepository(
    await createClient(),
    context.tenant.id,
  ).getCreative(creativeId);
  if (!creative) notFound();

  return (
    <main className="p-6 sm:p-10">
      <Link
        className="text-sm font-semibold text-[var(--accent)]"
        href="/app/library"
      >
        ← Library
      </Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Creative
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {creative.asset.title ?? "Untitled creative"}
          </h1>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold tracking-wide uppercase">
          {creative.asset.status.replaceAll("_", " ")}
        </span>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Duration" value={duration(creative.asset.duration_ms)} />
        <Metric
          label="Dimensions"
          value={
            creative.asset.width && creative.asset.height
              ? `${creative.asset.width} × ${creative.asset.height}`
              : "Pending"
          }
        />
        <Metric label="Type" value={creative.asset.mime_type ?? "Pending"} />
        <Metric
          label="Job attempts"
          value={String(creative.job?.attempt ?? 0)}
        />
      </section>
      {creative.asset.status === "FAILED" ? (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold">Processing failed</h2>
          <p className="mt-2 text-sm text-red-800">
            {creative.asset.error_message ??
              "The video could not be processed."}
          </p>
          {context.role !== "VIEWER" &&
          creative.job?.attempt !== undefined &&
          creative.job.attempt < creative.job.max_attempts ? (
            <div className="mt-4">
              <MediaRetryButton creativeId={creativeId} />
            </div>
          ) : null}
        </section>
      ) : null}
      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-6">
        <h2 className="text-xl font-semibold">Processing artifacts</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Private objects are listed as metadata only; no public media URLs are
          exposed.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {creative.artifacts.map((artifact) => (
            <li
              className="rounded-xl bg-[var(--background)] p-4"
              key={artifact.id}
            >
              <p className="font-semibold">
                {artifact.kind.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {artifact.mime_type ?? "Unknown type"} ·{" "}
                {bytes(artifact.byte_size)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
      <p className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
        {label}
      </p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function duration(value: number | null): string {
  return value === null ? "Pending" : `${(value / 1000).toFixed(1)} sec`;
}

function bytes(value: number | null): string {
  return value === null
    ? "Unknown size"
    : `${(value / 1_048_576).toFixed(2)} MB`;
}
