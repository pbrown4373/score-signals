import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/modules/brands/onboarding-form";
import { BrandBrainRepository } from "@/modules/brands/repository";
import { requireTenantContext } from "@/modules/tenancy/context";

export default async function BrandBrainOnboardingPage() {
  const context = await requireTenantContext();
  if (context.role === "VIEWER") redirect("/app/brand-brain");

  const brands = await new BrandBrainRepository(
    await createClient(),
    context.tenant.id,
  ).listBrands();
  if (brands[0]) redirect(`/app/brand-brain/${brands[0].id}`);

  return (
    <main className="p-6 sm:p-10">
      <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        First-run setup
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Build your Brand Brain.
      </h1>
      <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
        Brand name, category, and description complete the required setup. Every
        other field is optional and can be maintained later—no meeting or manual
        implementation required.
      </p>
      <OnboardingForm />
    </main>
  );
}
