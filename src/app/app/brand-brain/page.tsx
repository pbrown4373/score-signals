import Link from "next/link";

import { ActionLink } from "@/components/action-link";
import { createClient } from "@/lib/supabase/server";
import { BrandBrainRepository } from "@/modules/brands/repository";
import { requireTenantContext } from "@/modules/tenancy/context";

export default async function BrandBrainPage() {
  const context = await requireTenantContext();
  const brands = await new BrandBrainRepository(
    await createClient(),
    context.tenant.id,
  ).listBrands();
  const canWrite = context.role !== "VIEWER";

  return (
    <main className="p-6 sm:p-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
            Brand Brain
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Brand context, without a kickoff call.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
            Maintain the products, audiences, proof, voice, and restrictions
            that future concepts must use.
          </p>
        </div>
        {canWrite && brands.length ? (
          <ActionLink href="/app/brand-brain/new">Add another brand</ActionLink>
        ) : null}
      </div>

      {brands.length ? (
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link
                className="block rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5"
                href={`/app/brand-brain/${brand.id}`}
              >
                <p className="text-xs font-semibold tracking-wider text-[var(--accent)] uppercase">
                  {brand.category ?? "Uncategorized"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{brand.name}</h2>
                <p className="mt-3 line-clamp-3 leading-6 text-[var(--muted)]">
                  {brand.description ??
                    "Add a description to improve future creative context."}
                </p>
                <span className="mt-5 inline-block font-semibold text-[var(--accent)]">
                  {canWrite ? "Manage Brand Brain" : "View Brand Brain"} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <section className="mt-10 max-w-2xl rounded-3xl border border-[var(--line)] bg-white p-8">
          <h2 className="text-2xl font-semibold">No Brand Brain yet</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            The guided setup starts with the required brand context and lets you
            skip optional details until later.
          </p>
          <div className="mt-6">
            {canWrite ? (
              <ActionLink href="/app/brand-brain/onboarding">
                Start guided setup
              </ActionLink>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Your VIEWER role is read-only. Ask a workspace writer to
                complete setup.
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
