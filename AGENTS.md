# AGENTS.md — SCORE Signals

You are building a production SaaS, not a demo.

## Working method

For any non-trivial task:

1. Read the closest relevant repo documentation.
2. Inspect the existing implementation.
3. Write/update the execution plan if the change spans multiple modules.
4. Implement the smallest coherent change.
5. Add/update tests.
6. Run verification.
7. Update docs if contracts or behavior changed.

## Golden rules

1. **Typed boundaries.** Validate external input and structured AI output.
2. **Tenant isolation.** Every tenant-owned table carries `tenant_id`; enforce RLS and application checks.
3. **Secrets stay server-side.**
4. **Idempotent jobs and webhooks.**
5. **No hidden manual work.** Normal operation cannot require staff intervention.
6. **No scraping assumptions.** MVP uses uploads, permitted/approved source adapters, licensed data, or authorized customer integrations.
7. **Originality firewall.** Composer receives Skeleton + Brand Brain, never the raw source transcript.
8. **Evidence honesty.** Public presence is not proof of profitability.
9. **Cost awareness.** Meter and log AI/media operations.
10. **Mock every external provider** so CI works without paid keys.
11. **Accessible UI.**
12. **Tests are part of the feature.**
13. **Avoid premature microservices.** Use a modular monolith + durable jobs.
14. **Keep docs current.**
15. **Do not invent business rules** when a repository contract exists.

## Domain boundaries

Prefer modules for:

- auth
- tenancy
- brands
- media
- analysis
- patterns
- composition
- originality
- billing
- usage
- performance
- audit

UI must not call vendor SDKs directly.

`UI -> application/service layer -> provider adapters`

## Verification scripts

Keep these working:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `npm run verify` (all required pre-merge checks)

## Database

- SQL migrations are authoritative.
- Never bypass RLS from browser code.
- Service-role access is server/worker only and narrowly scoped.
- Use database constraints for critical invariants.

## AI lineage

Persist:
- provider
- model
- prompt version
- schema version
- input fingerprint
- usage/cost metadata when available
- latency
- success/failure
- lineage/run ID

Malformed AI output must never be persisted as completed domain data.

## Git discipline

Keep changes scoped to the active milestone/task.
Do not rewrite unrelated files.
Record material architectural changes as ADRs.
