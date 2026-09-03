import type { CreativeDNA } from "@/modules/analysis/contracts";
import type { GenerationRun } from "@/modules/analysis/repository";

export function CreativeDNAResult({
  dna,
  run,
  summary,
}: {
  dna: CreativeDNA;
  run: GenerationRun;
  summary: string | null;
}) {
  return (
    <section className="mt-8 space-y-6" aria-labelledby="creative-dna-heading">
      <div className="rounded-3xl bg-[var(--accent)] p-7 text-white">
        <p className="text-sm font-semibold tracking-[0.16em] uppercase opacity-80">
          Executive Read
        </p>
        <h2 className="mt-2 text-2xl font-semibold" id="creative-dna-heading">
          Creative DNA
        </h2>
        <p className="mt-4 max-w-3xl leading-7">
          {summary ?? "Structured creative analysis is complete."}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ResultList
            label="Why it may work"
            values={dna.assessment.why_it_may_work}
          />
          <ResultList
            label="Evidence limitations"
            values={dna.assessment.evidence_limitations}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ResultCard title="Hook">
          <Datum label="Classification" value={dna.opening.hook_type} />
          <Datum label="Opening line" value={dna.opening.first_spoken_line} />
          <Datum label="First visual" value={dna.opening.first_visual} />
          <Datum label="Mechanism" value={dna.opening.curiosity_mechanism} />
        </ResultCard>
        <ResultCard title="Psychology">
          <Datum label="Primary desire" value={dna.psychology.primary_desire} />
          <Datum
            label="Primary problem"
            value={dna.psychology.primary_problem}
          />
          <Datum label="Awareness" value={dna.psychology.awareness_stage} />
          <Datum
            label="Emotions"
            value={dna.psychology.emotional_triggers.join(", ")}
          />
          <Datum
            label="Objections"
            value={dna.psychology.objections.join(", ")}
          />
        </ResultCard>
        <ResultCard title="Story">
          <ol className="space-y-3">
            {dna.story.beat_map.map((beat) => (
              <li className="flex gap-3" key={`${beat.order}-${beat.role}`}>
                <span className="font-semibold text-[var(--accent)]">
                  {beat.order}
                </span>
                <span>
                  <strong>{beat.role}</strong>
                  <span className="block text-sm text-[var(--muted)]">
                    {beat.description}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </ResultCard>
        <ResultCard title="Proof">
          <Datum label="Types" value={dna.proof.types.join(", ")} />
          <ResultList label="Observed details" values={dna.proof.details} />
          <Datum label="Confidence" value={percent(dna.proof.confidence)} />
        </ResultCard>
        <ResultCard title="Production">
          <Datum label="Camera" value={dna.production.camera_style} />
          <Datum label="Creator" value={dna.production.creator_archetype} />
          <Datum label="Editing" value={dna.production.editing_speed} />
          <Datum label="Audio" value={dna.production.audio_style} />
          <Datum
            label="Product visibility"
            value={dna.production.product_visibility}
          />
        </ResultCard>
        <ResultCard title="Offer / CTA">
          {Object.entries(dna.offer).map(([label, value]) => (
            <Datum
              key={label}
              label={label.replaceAll("_", " ")}
              value={value}
            />
          ))}
        </ResultCard>
      </div>

      <div className="rounded-3xl border border-[var(--line)] bg-white p-7">
        <h3 className="text-xl font-semibold">Evidence register</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Observed statements come directly from supplied evidence. Inferred
          statements are interpretations and are labeled separately.
        </p>
        <ul className="mt-5 space-y-3">
          {dna.observations.map((observation, index) => (
            <li
              className="rounded-xl bg-[var(--background)] p-4"
              key={`${observation.kind}-${index}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    observation.kind === "OBSERVED"
                      ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900"
                      : "rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900"
                  }
                >
                  {observation.kind}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {percent(observation.confidence)} confidence
                </span>
              </div>
              <p className="mt-2">{observation.statement}</p>
            </li>
          ))}
        </ul>
      </div>

      <details className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <summary className="cursor-pointer font-semibold">
          Analysis lineage
        </summary>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Datum
            label="Provider / model"
            value={`${run.provider} / ${run.model}`}
          />
          <Datum label="Prompt" value={run.prompt_version} />
          <Datum label="Schema" value={run.schema_version} />
          <Datum
            label="Latency"
            value={run.latency_ms === null ? null : `${run.latency_ms} ms`}
          />
          <Datum
            label="Cost"
            value={
              run.cost_microusd === null
                ? "Not calculated"
                : `${run.cost_microusd} μUSD`
            }
          />
          <Datum
            label="Input fingerprint"
            value={run.input_fingerprint.slice(0, 16)}
          />
        </dl>
      </details>
    </section>
  );
}

function ResultCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Datum({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
        {label}
      </dt>
      <dd className="mt-1">{value || "Not observed"}</dd>
    </div>
  );
}

function ResultList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="font-semibold">{label}</p>
      {values.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm opacity-80">None observed.</p>
      )}
    </div>
  );
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
