# Milestone 0 — Agent-friendly foundation

Status: complete

## Delivered

- Next.js 16 App Router application with React, strict TypeScript, Tailwind CSS tokens, and an accessible landing-page foundation.
- Zod-backed server environment validation with credential-free mock mode as the default.
- Pino JSON logging with request IDs and redaction for authorization, cookies, tokens, API keys, and secrets.
- Application-owned provider contracts and deterministic mocks for AI, transcription, storage, jobs, billing, email, and analytics.
- `GET /api/health` readiness endpoint with no-store caching and request-ID propagation.
- Vitest unit/integration harness and Playwright Chromium smoke suite.
- GitHub Actions CI pinned to Node 24 with no paid provider credentials.
- One-command pre-merge verification through `npm run verify`.
- Implementation plan and ADR 0004 for runtime, deployment, and initial provider choices.

## Contract review findings

- `.env.example` was present in `MANIFEST.json` and the build-pack ZIP but absent from the initial repository commit; it has been restored.
- TypeScript 7.0.2 is stable but incompatible with the TypeScript ESLint stack bundled by Next.js 16.3.4. The project uses TypeScript 6.0.3, the latest compatible release.
- ESLint 10 is not yet accepted by transitive plugins in `eslint-config-next`; the project uses ESLint 9.39.5 until that stack supports 10.
- The logical SQL does not yet bind Supabase identities, enable RLS, or enforce same-tenant child relationships. These are explicit Milestone 1 requirements.
- `vector(1536)` is unsafe to migrate before selecting and locking the embedding dimensions, so vector persistence remains deferred.
- Concept package schema-to-row mapping and post-MVP Pattern ownership require later ADRs before their milestones.
- Arbitrary URL import is unsafe; upload remains the guaranteed acquisition path and future URL adapters must be allowlisted.

## Verification

- `npm run format:check`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: 4 files, 6 tests passed.
- `npm run build`: passed with static home page and dynamic health route.
- `npm run test:e2e`: 1 Chromium smoke test passed.
- `npm run verify`: passed end to end.
- `npm audit`: 0 vulnerabilities reported at install time.

## Manual checks

- Confirmed the production build route table contains `/` and `/api/health`.
- Confirmed the browser smoke test renders the primary headline and self-service CTA.
- Confirmed the health endpoint returns readiness for all mock providers and propagates `x-request-id`.
- Confirmed CI configuration supplies mock mode and no paid provider credentials.

## Known limitations

- The landing CTA is informational until authenticated creative intake exists.
- Live provider mode intentionally fails closed; live adapters belong to later milestones.
- Authentication, tenancy, database migrations, and RLS are not part of Milestone 0.
- Playwright requires its pinned Chromium binary, installed locally with `npx playwright install chromium`.
- Production builds use Webpack because the current local execution sandbox prevents Turbopack's CSS worker from binding an internal port.
- ESLint 9 is compatibility-pinned even though npm marks the major line unsupported; upgrade when the Next.js lint dependency graph supports ESLint 10.

## Next milestone

Milestone 1 — Auth, tenancy, and RLS:

- Supabase Auth,
- signup/login/logout,
- tenant bootstrap,
- memberships and roles,
- ordered migrations and membership-based RLS,
- authenticated application shell,
- cross-tenant isolation tests.

Do not begin Milestone 2 until Milestone 1's RLS exit criteria pass.
