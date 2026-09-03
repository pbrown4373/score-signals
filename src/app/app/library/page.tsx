import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { MediaRepository } from "@/modules/media/repository";
import { requireTenantContext } from "@/modules/tenancy/context";

export default async function LibraryPage() {
  const context = await requireTenantContext();
  const creatives = await new MediaRepository(
    await createClient(),
    context.tenant.id,
  ).listCreatives();

  return (
    <main className="p-6 sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Library
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Creatives
          </h1>
        </div>
        {context.role !== "VIEWER" ? (
          <Link
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 py-2 font-semibold text-white"
            href="/app/analyze"
          >
            Add creative
          </Link>
        ) : null}
      </div>
      {creatives.length ? (
        <ul className="mt-8 grid gap-4 lg:grid-cols-2">
          {creatives.map((creative) => (
            <li key={creative.id}>
              <Link
                className="block rounded-2xl border border-[var(--line)] bg-white p-6 hover:border-[var(--accent)]"
                href={`/app/library/${creative.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-semibold">
                    {creative.title ?? "Untitled creative"}
                  </h2>
                  <StatusBadge status={creative.status} />
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {new Date(creative.created_at).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-8 text-[var(--muted)]">
          No creatives yet. Upload a video to begin.
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold tracking-wide uppercase">
      {status.replaceAll("_", " ")}
    </span>
  );
}
