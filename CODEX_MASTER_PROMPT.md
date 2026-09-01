# Master prompt to paste into Codex

You are the lead engineer responsible for building SCORE Signals from this repository.

Treat the repository documentation, schemas, SQL, acceptance tests, and ADRs as the product contract. Do not use external chat history as the source of truth.

## Before writing production code

1. Read `AGENTS.md`.
2. Read every document listed under "Read in this order" in `README.md`.
3. Inspect the repository and identify inconsistencies, ambiguity, or technically unsafe assumptions.
4. Create `docs/IMPLEMENTATION_PLAN.md` containing:
   - selected stable package versions,
   - proposed file/module structure,
   - setup commands,
   - environment strategy,
   - vendor adapters,
   - database/migration approach,
   - background-job approach,
   - testing strategy,
   - deployment assumptions,
   - milestone sequence,
   - key risks,
   - unresolved decisions.
5. Resolve non-critical ambiguity using the simplest choice consistent with product constraints. Record material choices as ADRs rather than blocking on cosmetic questions.
6. Implement **Milestone 0 only** from `docs/BUILD_PLAN.md`.
7. Run all verification commands.
8. Report:
   - files changed,
   - tests run and results,
   - manual checks,
   - known limitations,
   - exact next milestone.

After Milestone 0 is accepted, continue **one milestone per Codex task**. Never skip exit criteria.

## Mandatory product rules

- SCORE is self-service software. Do not add required demos, onboarding calls, consulting, custom implementation, or sales-assisted flows.
- MVP acquisition must not depend on unauthorized scraping.
- The **Originality Firewall is mandatory**. Final composition operates from the abstract Skeleton plus Brand Brain. Raw source transcript and distinctive source wording are not passed to Composer.
- Source-derived restricted elements may be used by originality evaluation only.
- Public creative observations are not equivalent to proven ad performance.
- All persisted AI outputs conform to versioned JSON Schemas.
- OpenAI, transcription, storage, jobs, billing, email, and analytics are accessed through adapters with mocks.
- CI must run without paid API credentials.
- Use secure Supabase multi-tenancy and RLS.
- Build a modular monolith with durable asynchronous jobs.
- Optimize the repo for future coding agents: explicit contracts, deterministic fixtures, tests, and concise docs.

Do not attempt all milestones in one unreviewed change.
