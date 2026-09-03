import Link from "next/link";

import { ActionLink } from "@/components/action-link";
import { createClient } from "@/lib/supabase/server";
import { BrandBrainRepository } from "@/modules/brands/repository";
import { requireTenantContext } from "@/modules/tenancy/context";

export default async function CommandCenterPage() {
  const context = await requireTenantContext();
  const brands = await new BrandBrainRepository(
    await createClient(),
    context.tenant.id,
  ).listBrands();
  const hasBrandBrain = brands.length > 0;

  return (
    <main className="p-6 sm:p-10">
      <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Command Center
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        {hasBrandBrain
          ? "Your Brand Brain is ready."
          : "Your private workspace is ready."}
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
        {hasBrandBrain
          ? "Your private brand context is ready for the creative workflow. Keep it current as products, audiences, proof, and restrictions change."
          : "Your workspace is secure and private. Complete Brand Brain to give future creative analysis and composition the context they need."}
      </p>
      <section
        aria-labelledby="next-action"
        className="mt-10 max-w-2xl rounded-3xl border border-[var(--line)] bg-white p-8"
      >
        <h2 className="text-xl font-semibold" id="next-action">
          Next useful action
        </h2>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          {hasBrandBrain
            ? "Upload a video for secure media intake, or review your brand context before analysis."
            : "Add a brand name, category, and description. Products, personas, proof, voice, and restrictions can be added now or later."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {hasBrandBrain ? (
            <>
              <ActionLink href="/app/analyze">Analyze a creative</ActionLink>
              <Link
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] px-5 py-2 font-semibold"
                href={`/app/brand-brain/${brands[0]?.id}`}
              >
                Review Brand Brain
              </Link>
            </>
          ) : context.role === "VIEWER" ? (
            <p className="text-sm text-[var(--muted)]">
              An OWNER, ADMIN, or MEMBER must complete setup.
            </p>
          ) : (
            <ActionLink href="/app/brand-brain/onboarding">
              Set up Brand Brain
            </ActionLink>
          )}
        </div>
      </section>
    </main>
  );
}
