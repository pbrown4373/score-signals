import { redirect } from "next/navigation";

import { CreateBrandForm } from "@/modules/brands/brand-forms";
import { requireTenantContext } from "@/modules/tenancy/context";

export default async function NewBrandPage() {
  const context = await requireTenantContext();
  if (context.role === "VIEWER") redirect("/app/brand-brain");

  return (
    <main className="p-6 sm:p-10">
      <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Brand Brain
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Add another brand.
      </h1>
      <p className="mt-4 mb-8 max-w-2xl leading-7 text-[var(--muted)]">
        Create the brand record first, then add its products, personas, proof,
        and restrictions.
      </p>
      <section className="max-w-3xl rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
        <CreateBrandForm />
      </section>
    </main>
  );
}
