# Milestone 2 — Brand Brain

Status: complete

## Delivered

- Tenant-owned Brand, Product, Persona, Proof Point, and Restriction tables.
- Database checks for required lengths, JSON shapes, statuses, and documented restriction types.
- Composite tenant/brand foreign keys that prevent cross-tenant child relationships.
- Membership-backed RLS: OWNER, ADMIN, and MEMBER may maintain Brand Brain data; VIEWER is read-only.
- First-brand completion tracking on the tenant.
- Atomic and replay-safe `bootstrap_brand_brain(jsonb)` onboarding function.
- Tenant-scoped Brand Brain repository with explicit tenant filters on every query and mutation.
- Zod validation for onboarding and every CRUD form.
- Five-step, keyboard-usable first-run onboarding for brand, product, persona, voice/proof, and restrictions.
- Brand Brain list, additional-brand creation, detail, update, and delete UI.
- Product, Persona, Proof Point, and Restriction create, read, update, and delete UI.
- Read-only Brand Brain rendering for VIEWER members.
- Command Center first-run state and completed Brand Brain state.
- Generated Supabase TypeScript database contracts.
- ADR 0006 documenting onboarding completion, membership permissions, atomic bootstrap, and same-tenant constraints.

## Security properties verified

- Tenant A cannot read, update, or delete Tenant B Brand Brain records.
- A tenant cannot attach a child entity to another tenant's brand, including under a privileged database role.
- VIEWER can read own-tenant Brand Brain records but cannot create, update, or delete them.
- MEMBER can create, update, and delete Brand Brain records without tenant-administration authority.
- The first brand atomically creates all supplied optional entities and marks onboarding complete.
- Replaying first-run onboarding returns the existing first brand and creates no duplicates.
- Application repositories include the authenticated tenant ID in every read and write in addition to relying on RLS.

## Verification

- `npm run format:check`: passed.
- `npm run lint`: passed with no warnings.
- `npm run typecheck`: passed.
- `npm run test`: 7 files, 16 tests passed.
- `npm run test:db`: 40 pgTAP assertions passed on local Supabase/Postgres.
- `npm run build`: passed; all Brand Brain routes are dynamic server routes.
- `npm run test:e2e`: 4 Chromium tests passed.
- `npm audit --audit-level=critical`: no critical vulnerabilities.
- `npm run verify`: passed end to end.

## Manual checks

- Confirmed all five onboarding steps retain entered values while navigating backward and forward.
- Confirmed a completed full Brand Brain displays its Product, Persona, Proof Point, and Restriction on the detail screen.
- Confirmed the Command Center changes from first-run setup guidance to the completed Brand Brain state.
- Confirmed empty Brand Brain sections explain the next useful action.
- Confirmed VIEWER rendering contains no mutation forms.
- Confirmed generated database types include every Milestone 2 table, relationship, completion field, and bootstrap function.

## Known limitations

- Product, Persona, Proof Point, and Restriction creation is supported after initial Brand creation; bulk import is not part of Milestone 2.
- The first membership remains the active tenant, matching Milestone 1; multi-workspace switching is not exposed in MVP UI.
- Brand Brain deletion is immediate and cascades relational child data. Account-level purge orchestration belongs to Milestone 11.
- Browser confirmation dialogs for destructive Brand Brain actions are not yet included; buttons are explicitly labeled and isolated in destructive sections.
- Local database and e2e verification require Docker, Supabase CLI, and Chromium.
- Playwright signup tests run serially because local Supabase Auth intentionally rate-limits signup attempts.

## Next milestone

Milestone 3 — Media intake:

- private storage adapter and deterministic mock,
- upload initialization and completion,
- byte-level MIME verification, hashing, and configured limits,
- FFmpeg metadata/audio/frame preprocessing,
- durable, replay-safe job state,
- safe URL adapter boundary and SSRF guardrails,
- idempotent retry and visible processing status.

Do not begin Milestone 4 until Milestone 3's valid-media, invalid-media, privacy, status, and retry exit criteria pass.
