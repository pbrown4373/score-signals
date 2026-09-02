import { ActionLink } from "@/components/action-link";

const steps = [
  {
    label: "Deconstruct",
    detail: "Turn submitted creative into evidence-aware Creative DNA.",
  },
  {
    label: "Abstract",
    detail: "Preserve persuasive structure in an originality-safe Skeleton.",
  },
  {
    label: "Compose",
    detail:
      "Combine the Skeleton with your Brand Brain to create new concepts.",
  },
];

export default function Home() {
  return (
    <main>
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6"
      >
        <span className="font-semibold tracking-tight">SCORE Signals</span>
        <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-sm text-[var(--muted)]">
          Foundation ready
        </span>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="mb-5 text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            Creative intelligence, not imitation
          </p>
          <h1 className="max-w-4xl text-5xl leading-[1.04] font-semibold tracking-[-0.04em] sm:text-7xl">
            Turn creative structures into original ideas for your brand.
          </h1>
        </div>
        <div className="max-w-xl">
          <p className="mb-8 text-lg leading-8 text-[var(--muted)]">
            SCORE Signals will help performance marketers understand persuasive
            architecture, adapt it safely, and build production-ready concepts
            without a meeting or manual handoff.
          </p>
          <ActionLink href="/signup">Analyze a Creative</ActionLink>
        </div>
      </section>

      <section
        aria-labelledby="how-it-works-heading"
        className="border-y border-[var(--line)] bg-white/70"
        id="how-it-works"
      >
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-8 text-2xl font-semibold" id="how-it-works-heading">
            From observation to original execution
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"
                key={step.label}
              >
                <p className="mb-8 text-sm font-semibold text-[var(--accent)]">
                  0{index + 1}
                </p>
                <h3 className="mb-3 text-xl font-semibold">{step.label}</h3>
                <p className="leading-7 text-[var(--muted)]">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
