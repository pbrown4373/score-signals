# Milestone 5 — Skeleton boundary

Status: complete

## Delivered

- Skeleton prompt v1 that converts names, claims, unique facts/events, hooks, scenes, metaphors, and phrases into reusable persuasive functions.
- Strict structured extraction through the existing Model Gateway with a configurable Skeleton task model and deterministic mock.
- Canonical Skeleton schema validation plus a versioned restricted-element schema.
- Deterministic normalized leakage rejection across the complete Skeleton payload.
- Original gold fixture covering a source name, distinctive phrase, unique fact, metaphor, and scene.
- Tenant-owned `skeletons` and `skeleton_restricted_elements` tables with composite tenant constraints.
- Service-only restricted-element storage with no browser/API/UI access.
- Replay-safe atomic Skeleton/restricted persistence and complete generation lineage.
- Resume-aware durable analysis processing across transcription, Creative DNA, and Skeleton extraction.
- Real `SKELETONIZING` state; `READY` now means both Creative DNA and Skeleton are available.
- Tenant-safe `GET /api/creative/:id/skeleton` endpoint and visually distinct Skeleton result UI.
- ADR 0009 documenting the enforced Originality Firewall boundary.

## Security and integrity properties verified

- Every known gold source-specific value is stored as a restricted element and absent from all Skeleton fields.
- A provider output containing a restricted value inside the Skeleton fails before persistence.
- Tenant A cannot read Tenant B's Skeleton.
- VIEWER can read an own-tenant abstract Skeleton but cannot write one or invoke completion.
- Authenticated tenant members cannot query restricted source values.
- Cross-tenant Skeleton relationships fail at the database constraint layer.
- Skeleton completion and replay do not duplicate or replace restricted values.
- The Skeleton API and UI expose neither raw transcript nor restricted source values.

## Verification

- `npm run format:check`: passed.
- `npm run lint`: passed with no warnings.
- `npm run typecheck`: passed.
- `npm run test`: 15 files, 45 tests passed, including gold leakage, prompt-injection, strict-schema, resume, and malformed-Skeleton coverage.
- `npm run test:db`: 111 pgTAP assertions passed on local Supabase/Postgres, including 40 analysis/Skeleton lineage, isolation, restricted-access, state, and replay assertions.
- `npm run build`: passed; the Skeleton API and result page compile as dynamic routes.
- `npm run test:e2e`: 5 Chromium tests passed, including the upload-to-Skeleton flow and restricted-value absence checks.
- `npm run verify`: passed end to end.
- `npm audit --audit-level=critical`: no critical vulnerabilities.

## Manual checks

- Confirmed synthetic media reaches `READY` only after Creative DNA and Skeleton persistence.
- Confirmed the result page visually separates the Originality Firewall/Skeleton from Creative DNA and explains the abstraction boundary.
- Confirmed the Skeleton displays functional beats, persuasion mechanisms, transfer rules, abstract avoid-copying guidance, canonical text, and complete lineage.
- Confirmed the Skeleton API contains neither raw transcript text nor the gold source name, phrase, fact, metaphor, or scene.
- Confirmed the restricted-element table rejects authenticated browser access while retaining service-role access for future Originality evaluation.

## Known limitations

- Exact normalized collision rejection is a minimum deterministic boundary; fuzzy and semantic collision checks belong to Milestone 7.
- The quality of unrecognized restricted-element extraction still depends on the configured model and prompt. Gold fixtures provide a regression floor, not a legal originality guarantee.
- Live OpenAI calls require a credential and externally deployed worker; local and CI verification use deterministic mocks.
- Skeleton embeddings are intentionally deferred until post-MVP Milestone 12.

## Next milestone

Milestone 6 — Composer:

- composition context builder using Skeleton plus Brand Brain only,
- Brand/Product/Persona/Objective selection,
- concept schema, durable job, and persistence,
- concept result/history UI,
- automated proof that raw transcript and restricted elements are absent from Composer input.

Do not begin Milestone 7 until Milestone 6's context-isolation, concept-count, restriction, and schema exit criteria pass.
