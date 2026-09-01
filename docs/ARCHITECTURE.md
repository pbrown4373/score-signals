# SCORE Architecture

## Architectural style

Use a **modular monolith + durable asynchronous jobs**.

Do not introduce independent microservices for MVP.

## Logical architecture

```text
Browser
  |
  v
Next.js Application
  |-- UI / Route Handlers / Server Actions
  |-- Application Services
  |-- Domain Modules
  |
  +--> Supabase Auth
  +--> Postgres + pgvector
  +--> Private Object Storage (R2/S3)
  +--> Durable Job Runner
  |      +--> media processing
  |      +--> transcription
  |      +--> Creative DNA
  |      +--> Skeleton
  |      +--> Composer
  |      +--> Originality
  |
  +--> Model Gateway
  |      +--> OpenAI adapter
  |      +--> mock adapter
  |
  +--> Transcription Gateway
  +--> Stripe
  +--> Email adapter
  +--> Analytics adapter
```

## Suggested module layout

```text
src/
  app/
  components/
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
    db/
    env/
    logging/
    validation/
    providers/
      ai/
      transcription/
      storage/
      billing/
      jobs/
      email/
      analytics/
  jobs/
tests/
  unit/
  integration/
  e2e/
supabase/
  migrations/
docs/
```

Codex may adjust layout if it records the decision and preserves boundaries.

## Request vs background work

Synchronous:
- CRUD
- auth/session
- entitlements
- lightweight reads/exports

Durable async:
- media normalization
- transcription
- frame extraction
- Creative DNA
- Skeleton
- composition
- originality regeneration
- embeddings
- large exports
- performance imports

## Creative state machine

- PENDING
- INGESTING
- TRANSCRIBING
- EXTRACTING_FRAMES
- ANALYZING
- SKELETONIZING
- READY
- FAILED
- CANCELLED

## Generation state

- QUEUED
- GENERATING
- EVALUATING
- REGENERATING
- COMPLETED
- FAILED

All state transitions must be idempotent and auditable enough to debug.

## Provider interfaces

Application/domain code calls functions like:

```ts
analyzeCreative(input): Promise<CreativeDNA>
deriveSkeleton(input): Promise<Skeleton>
composeConcepts(input): Promise<ConceptPackage>
evaluateOriginality(input): Promise<OriginalityEvaluation>
embedSkeleton(input): Promise<number[]>
```

Vendor SDK responses do not become domain objects.

## AI implementation direction

Initial AI provider: OpenAI behind adapter.

Use Responses API capabilities for text/image inputs and JSON-schema structured output.

Model IDs are task configuration, e.g.:

- `analysis_vision`
- `skeleton_reasoning`
- `composition`
- `originality_semantic`
- `classification_low_cost`

Do not hard-code a single model everywhere.

## Media

1. validate MIME from bytes,
2. enforce limits,
3. hash,
4. store private,
5. extract deterministic metadata,
6. create lower-cost analysis artifacts,
7. expire raw media by retention policy if configured.

Use signed URLs only.

## Mock mode

`SCORE_PROVIDER_MODE=mock`

Mock mode must:
- require no paid API keys,
- use deterministic JSON fixtures,
- simulate job success/failure,
- permit full critical e2e CI.

## Observability

Structured log fields:
- request_id
- tenant_id when safe
- user_id when safe
- job_id
- generation_run_id
- provider/model
- duration_ms
- status
- error_code
- estimated/actual cost

Never log secrets, auth headers, raw payment data, or raw private transcript by default.

## Configuration

Central typed config:
- plan limits
- upload limits
- retention
- originality thresholds
- model routing
- retries
- concurrency
- feature flags

## Reliability targets

- no cross-tenant access
- webhook idempotency
- job resumability
- no duplicate usage charges
- valid structured artifacts only
- user-visible failure/retry behavior
