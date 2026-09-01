# Codex Build Plan

Implement one milestone at a time. Each is a coherent, reviewable engineering change.

## Milestone 0 — Agent-friendly foundation

Build:
- Next.js TypeScript app
- component/styling foundation
- env validation
- structured logging
- Vitest
- Playwright
- CI
- mock-provider mode
- health endpoint
- `npm run verify`

Exit:
- local app runs
- verify passes
- CI requires no paid keys
- smoke e2e passes

## Milestone 1 — Auth, tenancy, RLS

Build:
- Supabase Auth
- signup/login/logout
- tenant bootstrap
- memberships/roles
- RLS
- authenticated app shell

Exit:
- RLS tests prove isolation

## Milestone 2 — Brand Brain

Build:
- Brand/Product/Persona/Proof/Restriction CRUD
- onboarding wizard
- validation

Exit:
- first-run Brand Brain complete
- CRUD accessible and isolated

## Milestone 3 — Media intake

Build:
- private storage adapter + mock
- upload
- MIME/hash/limits
- FFmpeg metadata/audio/frame pipeline
- durable job state
- safe URL adapter interface
- SSRF guardrails

Exit:
- synthetic valid media processes
- invalid/oversize rejects
- status visible
- retries idempotent

## Milestone 4 — Transcription + Creative DNA

Build:
- transcription adapter
- Model Gateway + OpenAI adapter + mock
- JSON Schema Structured Output validation
- Creative DNA prompt v1
- lineage/cost metadata
- result UI

Exit:
- fixture -> valid Creative DNA
- malformed output handled
- observed/inferred shown

## Milestone 5 — Skeleton boundary

Build:
- Skeleton prompt/schema
- restricted-element extraction
- canonical text
- result UI

Exit:
- gold tests prove source-specific elements removed
- restricted items stored separately

## Milestone 6 — Composer

Build:
- composition context builder
- Brand/Product/Persona/Objective selection
- concept schema/job/persistence
- concept UI/history

Exit:
- automated test proves transcript absent
- 3–10 valid concepts
- restrictions applied

## Milestone 7 — Originality Guardian

Build:
- deterministic overlap
- fuzzy restricted matching
- semantic adapter
- config thresholds
- bounded regeneration

Exit:
- collisions fail
- safe rewrite passes
- retries idempotent

## Milestone 8 — Brief + export

Build:
- production brief
- Markdown
- JSON
- PDF

Exit:
- authorized export tests and e2e pass

## Milestone 9 — Usage + entitlements

Build:
- plan config
- free quotas
- usage ledger
- idempotent meter
- usage UI

Exit:
- limits/retries tested

## Milestone 10 — Stripe self-service billing

Build:
- Stripe adapter
- Checkout
- Portal
- verified webhook
- event idempotency
- subscription mirror

Exit:
- test-mode flow documented/tested
- upgrade needs no human

## Milestone 11 — v1 hardening

Build:
- audit
- deletion/retention
- rate limits
- error taxonomy
- support/help docs
- analytics events
- cost telemetry
- deployment docs
- release checklist

Exit:
- complete self-service e2e
- security checklist
- deployment smoke
- v1 release notes

# Post-MVP

## 12 — Skeleton embeddings + Patterns
## 13 — Signal Snapshots + Opportunity Index
## 14 — Brand Proximity recommendations
## 15 — Performance CSV import
## 16 — Customer-validated learning loop
## 17 — Public/free acquisition analyzer

# End-of-milestone procedure

1. run `npm run verify`
2. update docs
3. add ADR for material decisions
4. write `docs/progress/MILESTONE-N.md`
5. report risks and next milestone
6. do not begin the next milestone if exit criteria fail
