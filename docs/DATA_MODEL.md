# SCORE Data Model

## Conventions

- UUID primary keys.
- `tenant_id` on tenant-owned entities.
- UTC timestamps.
- RLS is the primary browser-access security boundary.
- JSONB stores versioned AI payloads where relational projection is not useful.
- Every persisted AI artifact stores schema/prompt/model lineage.
- Preserve source provenance.
- Use unique idempotency keys for usage and webhooks.

## Core entities

### Tenant / identity
- `tenants`
- `user_profiles`
- `tenant_memberships`

Roles:
- OWNER
- ADMIN
- MEMBER
- VIEWER

### Brand Brain
- `brands`
- `products`
- `personas`
- `brand_proof_points`
- `brand_restrictions`

### Source/media
- `sources`
- `creative_assets`
- `media_artifacts`
- `transcripts`

### AI lineage
- `generation_runs`

### Intelligence
- `deconstructions`
- `skeletons`
- `skeleton_restricted_elements`

### Composition
- `concepts`
- `originality_evaluations`
- `production_briefs`

### Commercial
- `subscriptions`
- `plan_entitlements`
- `usage_events`

### Safety/audit
- `webhook_events`
- `audit_events`

### Post-MVP
- `patterns`
- `pattern_members`
- `signal_snapshots`
- `brand_pattern_scores`
- `performance_imports`
- `performance_records`

## Important invariants

1. Brand, creative, Skeleton, concept, and related artifacts never cross tenants.
2. Concept's Brand and Skeleton must belong to the same tenant.
3. Completed AI artifact includes:
   - generation run ID
   - prompt version
   - schema version
   - provider/model
4. Composer input excludes raw transcript.
5. Restricted source elements are accessible to originality evaluation, not composition ideation.
6. Usage idempotency key is unique per tenant.
7. Stripe webhook event ID is unique globally.
8. Customer performance remains distinguishable from public/inferred evidence.
9. Tenant deletion purges/queues purge of private object storage and tenant DB data.

## Vector policy

Embed normalized `Skeleton.canonical_text`, not raw transcript.

Persist embedding model/dimension metadata.
Do not add a vector index until volume/config justify it.
