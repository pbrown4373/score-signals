import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { BrandBrainEditor } from "@/modules/brands/brand-forms";
import { BrandBrainRepository } from "@/modules/brands/repository";
import { requireTenantContext } from "@/modules/tenancy/context";

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ brandId: string }>;
  searchParams: Promise<{ onboarded?: string }>;
}) {
  const [{ brandId }, query, context] = await Promise.all([
    params,
    searchParams,
    requireTenantContext(),
  ]);
  const brain = await new BrandBrainRepository(
    await createClient(),
    context.tenant.id,
  ).getBrandBrain(brandId);
  if (!brain) notFound();

  return (
    <main className="p-6 sm:p-10">
      <Link
        className="text-sm font-semibold text-[var(--accent)] hover:underline"
        href="/app/brand-brain"
      >
        ← All brands
      </Link>
      <div className="mt-6 mb-10">
        <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          Brand Brain
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {brain.brand.name}
        </h1>
        {query.onboarded === "1" ? (
          <p
            className="mt-5 max-w-2xl rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"
            role="status"
          >
            Brand Brain setup is complete. You can refine every section below.
          </p>
        ) : null}
      </div>
      <BrandBrainEditor brain={brain} canWrite={context.role !== "VIEWER"} />
    </main>
  );
}
