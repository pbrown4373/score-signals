# Milestone 4 — Transcription + Creative DNA

Status: complete

## Delivered

- Application-owned transcription and Model Gateway contracts with deterministic mocks and live OpenAI adapters.
- Configurable `gpt-transcribe` audio transcription and `gpt-5.6-luna` Responses Structured Output defaults.
- Versioned Draft 2020-12 transcript schema and canonical Creative DNA schema validation with Ajv.
- Creative DNA prompt v1 with delimited untrusted input, prompt-injection resistance, evidence honesty, and explicit observed-versus-inferred classification.
- Durable `CREATIVE_ANALYSIS` job chaining transcription and Creative DNA generation.
- Generation-run lineage for transcription and Creative DNA: provider, model, prompt/schema version, input fingerprint, request metadata, usage, cost, latency, attempt, and errors.
- Tenant-scoped transcript and deconstruction persistence with composite foreign keys and membership-backed RLS.
- Replay-safe completions, bounded transient provider retries, and transcript reuse after a later-stage failure.
- Creative detail result UI for Executive Read, Hook, Psychology, Story, Proof, Production, Offer/CTA, evidence labels, limitations, and generation lineage.
- Tenant-safe deconstruction API that excludes raw source transcripts and private media keys.
- ADR 0008 documenting schema projection, lineage, job, retry, and transcript-boundary decisions.

## Security and integrity properties verified

- Tenant A cannot read Tenant B transcripts, deconstructions, or generation runs.
- VIEWER can read own-tenant results but cannot persist AI output.
- Authenticated browser roles cannot invoke service-only generation completion functions.
- Cross-tenant analysis relationships fail at the database constraint layer.
- Raw transcript content is never returned by creative status, the deconstruction API, or result UI.
- Malformed provider output fails schema validation before deconstruction persistence and is not retried as a transient failure.
- Completion and generation-start replays do not duplicate artifacts or overwrite completed lineage.
- Public creative evidence is described as observation or inference, never as proven performance.

## Verification

- `npm run format:check`: passed.
- `npm run lint`: passed with no warnings.
- `npm run typecheck`: passed.
- `npm run test`: 15 files, 39 tests passed, including malformed-output, schema, prompt-injection, bounded-retry, and fixture validation coverage.
- `npm run test:db`: 96 pgTAP assertions passed on local Supabase/Postgres, including 25 Creative DNA lineage, idempotency, failure, and RLS assertions.
- `npm run build`: passed; the deconstruction API and creative result page compile as dynamic routes.
- `npm run test:e2e`: 5 Chromium tests passed, including media-to-Creative-DNA processing and result/API assertions.
- `npm run verify`: passed end to end.
- `npm audit --audit-level=critical`: no critical vulnerabilities.

## Manual checks

- Confirmed a synthetic video reaches `READY` and displays Hook, Psychology, Story, Proof, Production, Offer/CTA, and evidence limitations.
- Confirmed the evidence register visibly distinguishes `OBSERVED` and `INFERRED` claims.
- Confirmed the deconstruction response includes provider/model, prompt/schema version, fingerprint, latency, and cost lineage.
- Confirmed status and deconstruction responses contain neither raw transcript text nor private storage keys.
- Confirmed live provider model IDs are configuration values and mock mode runs without an OpenAI credential.

## Known limitations

- Live mode requires an externally deployed worker to claim the Postgres job ledger; mock mode chains jobs inline for deterministic local and CI verification.
- Live OpenAI calls require an API key and have not been exercised with paid credentials; mocks and adapter boundaries keep CI credential-free.
- Provider usage is persisted, but model price configuration is not yet selected, so live cost can remain uncalculated.
- Database constraints validate tenant relationships and schema versions; complete JSON Schema validation occurs in trusted application worker code.
- Raw transcripts remain persisted for resumability and Milestone 5 extraction. Retention enforcement belongs to Milestone 11.

## Next milestone

Milestone 5 — Skeleton boundary:

- Skeleton prompt and versioned schema,
- restricted-element extraction and isolated persistence,
- canonical text generation,
- Skeleton result UI,
- gold tests proving source-specific elements are removed.

Do not begin Milestone 6 until Milestone 5's Skeleton and restricted-item isolation exit criteria pass.
