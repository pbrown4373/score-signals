import Link from "next/link";

type AuthPageProps = {
  children: React.ReactNode;
  description: string;
  title: string;
};

export function AuthPage({ children, description, title }: AuthPageProps) {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link className="mb-10 inline-block font-semibold" href="/">
          SCORE Signals
        </Link>
        <section
          aria-labelledby="auth-title"
          className="rounded-3xl border border-[var(--line)] bg-white p-8 shadow-sm"
        >
          <h1 className="text-3xl font-semibold tracking-tight" id="auth-title">
            {title}
          </h1>
          <p className="mt-3 mb-8 leading-7 text-[var(--muted)]">
            {description}
          </p>
          {children}
        </section>
      </div>
    </main>
  );
}
