# SCORE Signals Implementation Plan

Status: active

This plan translates the repository product contract into an implementation sequence. `docs/BUILD_PLAN.md` remains authoritative for scope and exit criteria.

## Selected stable versions

Versions were checked against the npm registry on 2026-09-01 and are pinned in `package-lock.json` when introduced.

### Milestone 0 runtime and tooling

| Package                               |         Version | Purpose                                  |
| ------------------------------------- | --------------: | ---------------------------------------- |
| Node.js                               |            24.x | application and CI runtime               |
| npm                                   |            11.x | package manager                          |
| Next.js                               |          16.3.4 | modular-monolith web application         |
| React / React DOM                     |          19.2.8 | UI runtime                               |
| TypeScript                            |           6.0.3 | latest Next.js-lint-compatible release   |
| Tailwind CSS / `@tailwindcss/postcss` |           4.3.3 | styling foundation                       |
| Zod                                   |           4.5.4 | environment and boundary validation      |
| Pino                                  |          10.3.1 | structured server logging with redaction |
| Vitest                                |          4.1.11 | unit and integration tests               |
| Playwright                            |          1.62.1 | browser smoke and critical-path tests    |
| ESLint / `eslint-config-next`         | 9.39.5 / 16.3.4 | latest mutually compatible lint stack    |
| Prettier / Tailwind plugin            |   3.9.6 / 0.8.1 | deterministic formatting                 |

The project supports Node `>=24.0.0`; CI pins Node 24. Package upgrades are deliberate changes accompanied by `npm run verify`.

### Planned adapter SDK baselines

These packages are not installed until their milestone needs them.

| Boundary           | Initial implementation                              |  Version checked |
| ------------------ | --------------------------------------------------- | ---------------: |
| database/auth      | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) | 2.112.4 / 0.12.5 |
| AI + transcription | OpenAI Responses/audio APIs (`openai`)              |            7.8.0 |
| private storage    | Cloudflare R2 through `@aws-sdk/client-s3`          |         3.1125.0 |
| durable jobs       | Trigger.dev (`@trigger.dev/sdk`)                    |           4.5.15 |
| billing            | Stripe (`stripe`)                                   |           22.6.0 |
| email              | Resend (`resend`)                                   |           6.25.0 |
| analytics          | PostHog (`posthog-node`)                            |           5.51.6 |

See `docs/ADR-0004.md`. Domain interfaces and deterministic mocks remain authoritative; vendor SDK types do not cross adapter boundaries.

### Milestone 1 database and authentication

| Package                 | Version | Purpose                               |
| ----------------------- | ------: | ------------------------------------- |
| `@supabase/supabase-js` | 2.112.4 | Auth and typed Data API client        |
| `@supabase/ssr`         |  0.12.5 | cookie-backed Next.js SSR integration |
| Supabase CLI            | 2.116.0 | local stack, migrations, and types    |

### Milestone 2 Brand Brain

Milestone 2 adds no runtime dependencies. Zod 4.5.4 validates form boundaries, the existing Supabase client provides tenant-scoped persistence, pgTAP verifies RLS and relational invariants, and Playwright covers first-run completion.

### Milestone 3 media intake

| Package                         |  Version | Purpose                                     |
| ------------------------------- | -------: | ------------------------------------------- |
| `@aws-sdk/client-s3`            | 3.1125.0 | S3-compatible private R2 object operations  |
| `@aws-sdk/s3-request-presigner` | 3.1125.0 | short-lived direct-upload targets           |
| FFmpeg / FFprobe                |      7.1 | local verified media transform and metadata |

FFmpeg 7.1 is the development baseline. CI asserts that the hosted runner supplies both binaries; the production worker image must pin its FFmpeg build before launch.

## Proposed file and module structure

```text
src/
  app/                         # routes, layouts, route handlers
    api/health/route.ts
  components/                  # accessible shared UI primitives
  modules/
    auth/
    tenancy/
    brands/
    media/
    analysis/
    patterns/
    composition/
    originality/
    billing/
    usage/
    performance/
    audit/
  lib/
    env/                       # typed server/client configuration
    logging/                   # structured logging and request context
    providers/                 # interfaces, registry, vendor and mock adapters
    validation/
  jobs/                        # durable job definitions and orchestration
tests/
  unit/
  integration/
  e2e/
  fixtures/
supabase/
  migrations/                 # ordered SQL; authoritative once introduced
docs/
  progress/
```

Modules expose application services and repository interfaces. UI and route handlers call application services, never vendor SDKs directly.

## Setup commands

```bash
npm ci
cp .env.example .env.local
npm run db:start
npm run dev
npm run verify
```

Playwright browser installation is a one-time local/CI setup:

```bash
npx playwright install --with-deps chromium
```

## Environment strategy

- `.env.example` documents every variable with non-secret mock/local defaults where safe.
- `.env.local` and other real environment files are gitignored.
- `SCORE_PROVIDER_MODE=mock` is the default for development, tests, and CI.
- Server variables are parsed once through Zod. Invalid or missing production configuration fails fast with a concise error.
- Only variables intentionally prefixed `NEXT_PUBLIC_` may enter the client bundle.
- Provider credentials are optional in mock mode and required only by the selected live adapter.
- Tests supply explicit environment values and do not depend on a developer machine's secrets.

## Vendor adapters

Application-owned interfaces cover AI, transcription, storage, durable jobs, billing, email, and analytics. A typed registry selects mock or live implementations from validated configuration. Milestone 0 supplies deterministic mocks and a registry seam without importing paid vendor SDKs. Each later milestone adds only its needed live adapter and contract tests.

Initial live choices are OpenAI, OpenAI transcription, Cloudflare R2, Trigger.dev, Stripe, Resend, and PostHog. Unsupported or unsafe URL sources fall back to user upload; no arbitrary scraper is planned.

## Database and migration approach

- `db/schema.sql` is the logical source contract, not an executable initial migration.
- Milestone 1 established small, ordered, forward-only Supabase migrations for identity and tenancy; later tables are introduced only in their owning milestones.
- Identity rows bind to `auth.users`; membership-backed RLS helper functions run from a non-exposed private schema.
- Tenant bootstrap is an authenticated, idempotent security-definer RPC. Browser code cannot insert tenants directly or choose an authoritative tenant ID.
- Brand Brain onboarding uses a separate authenticated, idempotent database function so a first brand and its optional child records commit atomically. Normal maintenance remains behind tenant-scoped repositories and RLS.
- Brand Brain child tables use composite tenant/parent foreign keys in addition to RLS, preventing privileged callers from creating cross-tenant relationships.
- Media sources, uploads, creative assets, artifacts, and jobs use composite tenant constraints and membership-backed RLS. Authenticated initialization/retry functions derive tenant identity; service-only functions own validation and worker transitions.
- Upload and job idempotency keys are unique per tenant. Worker completion upserts deterministic artifact keys and advances a successful Milestone 3 creative to `TRANSCRIBING` for Milestone 4.
- RLS integration tests run against a disposable local Supabase/Postgres 17 instance and prove cross-tenant read and write denial plus viewer read-only behavior.
- Vector columns are deferred until the embedding milestone; the configured model dimension and SQL type must match before migration.
- Generated TypeScript database types are checked in and regenerated deterministically after schema changes.

## Background-job approach

- A Postgres job ledger is the durable source of truth, independent of the eventual execution vendor. Job inputs carry tenant context, operation type, version, and an idempotency key.
- Service-only transactional functions claim, finish, fail, and requeue jobs. State transitions are replay-safe and observable; retries reuse the same job and never duplicate domain records.
- Mock mode dispatches deterministically inline after the durable job is created. This exercises real FFmpeg with no paid credentials while preserving the same state machine.
- Live mode leaves the job queued for a separately deployed worker. Trigger.dev remains the planned initial scheduler/runner, but its SDK is deferred until the live worker is deployed.
- Long-running AI, composition, originality, export, and deletion work follows the same ledger-first pattern in later milestones.

## Testing strategy

- Vitest unit tests cover configuration, adapters, domain functions, state machines, and guardrails.
- Integration tests cover repositories, migrations/RLS, route contracts, idempotency, and schema validation.
- Playwright covers the self-service critical path in mock-provider mode, including signup, tenant bootstrap, Brand Brain onboarding, private media upload, invalid/oversize rejection, visible processing status, logout, and login against local Supabase.
- Fixtures are synthetic or original, deterministic, versioned, and safe to commit.
- `npm run verify` runs formatting check, lint, typecheck, unit/integration tests, production build, and the Chromium smoke e2e suite.
- CI uses no paid credentials and uploads Playwright diagnostics only on failure.

## Deployment assumptions

- Next.js deploys as one Node application on Vercel initially; large direct uploads bypass the application through short-lived R2 PUT targets.
- Supabase provides managed Postgres and Auth.
- Trigger.dev hosts durable workers; Cloudflare R2 stores private media.
- Preview and production environments use separate Supabase, storage, Trigger.dev, Stripe, and analytics configuration.
- Health checks expose readiness without secrets or tenant data.
- FFmpeg work runs in an isolated job environment with a pinned binary, not a constrained request runtime. Mock mode runs it inline only for deterministic local/CI verification.

## Milestone sequence

Execute Milestones 0 through 11 exactly as ordered in `docs/BUILD_PLAN.md`, one reviewed Codex task at a time. Post-MVP Milestones 12 through 17 remain deferred. Milestone 3 is complete; Milestone 4 must not begin until Milestone 3 is reviewed.

## Key risks

1. Tenant invariants in the remaining logical SQL are not enforceable by single-column foreign keys; each owning milestone must add database-level same-tenant enforcement as its tables are migrated.
2. The fixed `vector(1536)` column can conflict with a future embedding configuration; vector storage is deferred until dimension selection.
3. Composer persistence represents individual `concepts` while the JSON Schema represents a multi-concept package; Milestone 6 needs an explicit package-to-row mapping ADR.
4. `patterns` may be global or tenant-owned, while related post-MVP tables do not consistently carry `tenant_id`; the aggregation/privacy model must be resolved before Milestone 12.
5. Arbitrary URL import creates SSRF and authorization risks; MVP supports uploads first and only allowlisted adapters later.
6. Media processing and Playwright require system binaries that differ between local, CI, and production environments; versions and images must be pinned.
7. Provider costs and model behavior change over time; schema validation, prompt versioning, mocks, evals, and routing configuration are mandatory defenses.

## Resolved ambiguities

- Use npm and a checked-in lockfile.
- Use the Next.js App Router with Node runtime route handlers.
- Use the stable Webpack production builder; Turbopack remains available for local development.
- Use Tailwind CSS tokens and small accessible project-owned primitives before adopting a larger component kit.
- Use Pino for JSON server logs and a lightweight request-ID helper.
- Use Vercel/Supabase/R2/Trigger.dev as the initial deployment shape, all replaceable behind boundaries.
- Use Supabase SSR cookies with `getClaims()` for server authorization; never authorize from unvalidated session data.
- Use a real local Supabase stack and pgTAP for RLS tests. Stream tests into PostgreSQL so verification does not depend on Docker Desktop host-directory mounts.
- Treat brand name, category, and description as the required first-run Brand Brain context. Optional child records may be skipped and completed later.
- Permit OWNER, ADMIN, and MEMBER to maintain Brand Brain data; keep VIEWER read-only. Enforce same-tenant parentage with composite foreign keys.
- Treat upload as the guaranteed MVP acquisition path; URL adapters are additive and allowlisted.
- Use a filesystem-backed private storage adapter and inline dispatcher only in mock mode. Use R2-compatible private storage in live mode, with the database job ledger remaining authoritative in both modes.
- Stop Milestone 3 processing at `TRANSCRIBING`; transcription and subsequent AI states belong to Milestone 4.
- Permit URL intake only through an explicit adapter allowlist after protocol, hostname, and every resolved address pass SSRF checks. With no approved MVP adapter configured, return an upload fallback.
- Restore `.env.example`, which is listed in `MANIFEST.json` and included in the build-pack ZIP but absent from the initial commit.
- Treat `MANIFEST.json` as provenance for the original build-pack contents, not as a generated inventory of the evolving application.

## Unresolved decisions

- Final plan prices, quotas, retention values, originality thresholds, retry counts, and concurrency remain configuration decisions for their owning milestones.
- Malware scanning is an optional production hardening choice under the security contract; a vendor is not selected in Milestone 3.
- The production media-worker image and Trigger.dev worker deployment remain open deployment work. The image must pin FFmpeg/FFprobe and consume the existing durable ledger before live media intake is enabled.
- Exact OpenAI task model IDs and embedding dimensions remain open until Milestones 4 and 12.
- Cross-customer pattern aggregation, anonymization, and ownership remain blocked from implementation until an explicit post-MVP privacy policy exists.
- Subscription past-due grace behavior needs a billing policy before Milestone 10.
