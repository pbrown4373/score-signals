# SCORE Signals — Codex Build Pack

This repository is the source-of-truth build specification for **SCORE Signals**, a self-service Creative Intelligence SaaS.

## Mission

Build software that helps performance marketers:

1. submit an advertising or short-form creative,
2. extract a structured **Creative DNA**,
3. abstract its reusable persuasive architecture into an originality-safe **Skeleton**,
4. combine that Skeleton with the customer's **Brand Brain**,
5. generate original concepts and production briefs,
6. eventually cluster Skeletons into **Patterns** and score emerging creative opportunities,
7. eventually learn from customer-supplied performance data.

The company must be able to sell, onboard, operate, bill, support, and deliver value **without meetings, demos, consulting, or custom implementation**.

## Core loop

`DISCOVER -> DECONSTRUCT -> COMPOSE -> PERFORM`

MVP value path:

`SUBMIT -> DECONSTRUCT -> SKELETON -> COMPOSE -> ORIGINALITY CHECK -> EXPORT`

## Read in this order

1. `AGENTS.md`
2. `CODEX_MASTER_PROMPT.md`
3. `docs/PRD.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DATA_MODEL.md`
6. `db/schema.sql`
7. `schemas/*.schema.json`
8. `docs/AI_PIPELINE.md`
9. `docs/UX_SPEC.md`
10. `docs/API_SPEC.md`
11. `docs/SECURITY.md`
12. `docs/ACCEPTANCE_TESTS.md`
13. `docs/BUILD_PLAN.md`

## Technology direction

Use latest stable mutually-compatible releases at implementation time. Do not blindly pin stale versions from this specification.

- Next.js + React + TypeScript
- Tailwind CSS + accessible component primitives
- Supabase Postgres + Auth + Row Level Security
- pgvector
- Cloudflare R2 or another S3-compatible private object store
- Trigger.dev or equivalent durable background-job runner
- Stripe Billing + Checkout + verified webhooks
- OpenAI Responses API behind a provider-neutral model gateway
- JSON Schema / Structured Outputs for persisted AI artifacts
- FFmpeg for deterministic media processing
- Vitest + Playwright
- CI that works in mock-provider mode without paid credentials

## Non-negotiables

- No unauthorized scraping dependency.
- No copying source creative language or distinctive source execution.
- Raw media is not the moat; structured derived intelligence is.
- Every tenant-owned record is protected by tenant authorization/RLS.
- Persisted AI outputs validate against versioned schemas.
- Expensive operations are metered and idempotent.
- Background jobs are retryable and safe to replay.
- External vendors are behind adapters and have mock implementations.
- No native video generation in MVP.
- No social publishing in MVP.
- No enterprise SSO in MVP.
- No workflow may require routine founder/staff intervention.

## Definition of done for v1

A stranger can:

1. create an account,
2. create a Brand Brain,
3. upload a supported creative,
4. receive validated Creative DNA,
5. receive an originality-safe Skeleton,
6. generate brand-specific original concepts,
7. receive an originality evaluation,
8. save and export a production brief,
9. upgrade/pay through Stripe,
10. use the product without contacting a human.

The application is deployable, tested, auditable, multi-tenant, and documented.
