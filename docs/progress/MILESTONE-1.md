# Milestone 1 — Auth, tenancy, and RLS

Status: complete

## Delivered

- Supabase Auth signup, login, email confirmation callback, and logout flows.
- Cookie-backed browser/server Supabase clients and a Next.js proxy for token refresh.
- Claim-validated server authorization using `supabase.auth.getClaims()`.
- Protected application shell with tenant, membership role, user identity, navigation, and sign-out.
- Ordered Supabase migration for `tenants`, `user_profiles`, and `tenant_memberships`.
- OWNER, ADMIN, MEMBER, and VIEWER membership roles.
- Idempotent, concurrency-safe `bootstrap_tenant(text)` database function.
- Membership-backed RLS for tenant, profile, and membership access.
- Explicit table grants; no direct browser insert authority for tenants or profiles.
- Generated TypeScript database types.
- Local Supabase/Postgres 17 configuration with no hosted project or paid credentials.
- pgTAP isolation tests streamed into the disposable database container.
- Chromium e2e coverage for signup, owner tenant bootstrap, logout, and login.
- ADR 0005 documenting the claim-validated tenancy boundary.

## Security properties verified

- Tenant A cannot read, update, delete, or add a membership to Tenant B.
- A user can read only their own profile.
- Members can see memberships only within their tenant.
- VIEWER can read their tenant but cannot update it or add members.
- OWNER can update their tenant but cannot remove their own OWNER membership.
- Tenant bootstrap is idempotent and does not create duplicates on replay.
- Browser auth uses the public Supabase key only; no service-role key enters the client.
- Protected pages authorize validated claims rather than trusting session cookie contents.

## Verification

- `npm run format:check`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: 6 files, 10 tests passed.
- `npm run test:db`: 13 pgTAP assertions passed on local Supabase/Postgres.
- `npm run build`: passed.
- `npm run test:e2e`: 2 Chromium tests passed.
- `npm audit --audit-level=critical`: no critical vulnerabilities.
- `npm run verify`: passed end to end.

## Manual checks

- Confirmed a new local user receives one OWNER membership and one private tenant.
- Confirmed sign-out returns to the login page and password sign-in restores the tenant shell.
- Confirmed the production route table marks `/app` and `/auth/confirm` dynamic.
- Confirmed the RLS suite executes with authenticated JWT claim context against real PostgreSQL policies.
- Confirmed local and CI workflows need no hosted Supabase project or paid credentials.

## Known limitations

- Production Supabase project provisioning, redirect URLs, SMTP, and email-confirmation policy remain deployment configuration.
- Password reset, account deletion, and membership-management UI are not part of Milestone 1.
- The bootstrap function returns the user's first existing tenant; additional-tenant creation is not exposed in MVP UI.
- Only identity and tenancy tables have been migrated. Later tenant-owned tables must add RLS and same-tenant constraints in their owning milestones.
- Local database verification requires Docker.
- The checked-in publishable key is for the disposable local Supabase project only and is not a secret.

## Next milestone

Milestone 2 — Brand Brain:

- Brand, Product, Persona, Proof, and Restriction CRUD,
- self-service onboarding wizard,
- typed validation,
- tenant-scoped repositories and RLS,
- isolated CRUD tests.

Do not begin Milestone 3 until Milestone 2's onboarding and isolation exit criteria pass.
