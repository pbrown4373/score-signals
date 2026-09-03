import type { GenerationRun } from "@/modules/analysis/repository";
import type { Skeleton } from "@/modules/analysis/contracts";

export function SkeletonResult({
  run,
  skeleton,
}: {
  run: GenerationRun;
  skeleton: Skeleton;
}) {
  return (
    <section
      className="mt-8 rounded-3xl border-2 border-[var(--accent)] bg-white p-7"
      aria-labelledby="skeleton-heading"
    >
      <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Originality Firewall
      </p>
      <h2 className="mt-2 text-2xl font-semibold" id="skeleton-heading">
        Skeleton
      </h2>
      <p className="mt-3 max-w-3xl text-[var(--muted)]">
        The Skeleton preserves the persuasive architecture while removing
        source-specific language and details.
      </p>
      <h3 className="mt-6 text-xl font-semibold">{skeleton.name}</h3>
      <p className="mt-2 max-w-4xl leading-7">
        {skeleton.one_sentence_structure}
      </p>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-semibold">Functional sequence</h3>
          <ol className="mt-3 space-y-3">
            {skeleton.beats.map((beat) => (
              <li
                className="rounded-xl bg-[var(--background)] p-4"
                key={`${beat.order}-${beat.role}`}
              >
                <p className="font-semibold">
                  {beat.order}. {beat.role}
                </p>
                <p className="mt-1 text-sm">{beat.function}</p>
                {beat.constraints.length ? (
                  <ul className="mt-2 list-disc pl-5 text-sm text-[var(--muted)]">
                    {beat.constraints.map((constraint) => (
                      <li key={constraint}>{constraint}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-5">
          <List
            title="Persuasion mechanisms"
            values={skeleton.persuasion_mechanisms}
          />
          <List title="Transfer rules" values={skeleton.transfer_rules} />
          <List title="Avoid copying" values={skeleton.avoid_copying} />
        </div>
      </div>

      <div className="mt-7 rounded-2xl bg-[var(--accent)] p-5 text-white">
        <h3 className="font-semibold">Canonical structure</h3>
        <p className="mt-2 text-sm leading-6">{skeleton.canonical_text}</p>
      </div>

      <details className="mt-6 rounded-2xl border border-[var(--line)] p-5">
        <summary className="cursor-pointer font-semibold">
          Skeleton lineage
        </summary>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Datum
            label="Provider / model"
            value={`${run.provider} / ${run.model}`}
          />
          <Datum label="Prompt" value={run.prompt_version ?? "Not recorded"} />
          <Datum label="Schema" value={run.schema_version} />
          <Datum
            label="Latency"
            value={
              run.latency_ms === null ? "Not recorded" : `${run.latency_ms} ms`
            }
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
        </div>
      </details>

      <p className="mt-6 text-sm font-semibold text-[var(--muted)]">
        This abstract structure is ready for original concept creation.
      </p>
    </section>
  );
}

function List({ title, values }: { title: string; values: string[] }) {
  return (
    <section>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </section>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 break-words">{value}</p>
    </div>
  );
}
