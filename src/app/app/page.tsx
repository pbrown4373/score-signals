export default function CommandCenterPage() {
  return (
    <main className="p-6 sm:p-10">
      <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Command Center
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Your private workspace is ready.
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
        Authentication, membership, and tenant isolation are active. Brand Brain
        setup arrives in the next milestone.
      </p>
      <section
        aria-labelledby="next-action"
        className="mt-10 max-w-2xl rounded-3xl border border-[var(--line)] bg-white p-8"
      >
        <h2 className="text-xl font-semibold" id="next-action">
          Next useful action
        </h2>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          Add your brand, product, persona, proof, and restrictions when Brand
          Brain onboarding becomes available.
        </p>
      </section>
    </main>
  );
}
