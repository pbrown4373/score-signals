import Link from "next/link";

import { logoutAction } from "@/modules/auth/actions";
import { requireTenantContext } from "@/modules/tenancy/context";

export const dynamic = "force-dynamic";

const navigation = [
  { label: "Command Center", href: "/app" },
  { label: "Analyze", href: "/app/analyze" },
  { label: "Library", href: "/app/library" },
  { label: "Concepts" },
  { label: "Brand Brain", href: "/app/brand-brain" },
  { label: "Account" },
];

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await requireTenantContext();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-[var(--line)] bg-white p-6 lg:min-h-screen lg:border-r lg:border-b-0">
        <Link className="font-semibold tracking-tight" href="/app">
          SCORE Signals
        </Link>
        <div className="mt-8 rounded-2xl bg-[var(--background)] p-4">
          <p className="font-semibold">{context.tenant.name}</p>
          <p className="mt-1 text-xs tracking-wide text-[var(--muted)] uppercase">
            {context.role}
          </p>
        </div>
        <nav aria-label="Application" className="mt-8">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    className="block rounded-lg px-3 py-2 font-medium hover:bg-[var(--background)]"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[var(--muted)]"
                  >
                    {item.label}
                    <span className="text-xs">Soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <form action={logoutAction} className="mt-10">
          <button
            className="min-h-11 w-full rounded-full border border-[var(--line)] px-4 py-2 font-semibold"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </aside>
      <div>
        <header className="border-b border-[var(--line)] px-6 py-4 text-right text-sm text-[var(--muted)]">
          {context.user.email ?? "Authenticated user"}
        </header>
        {children}
      </div>
    </div>
  );
}
