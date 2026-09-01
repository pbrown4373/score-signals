-- SCORE Signals logical schema.
-- Codex must turn this into ordered Supabase migrations and add tested RLS policies.

create extension if not exists pgcrypto;
create extension if not exists vector;

create type membership_role as enum ('OWNER','ADMIN','MEMBER','VIEWER');
create type source_type as enum ('UPLOAD','URL','YOUTUBE','META_AUTHORIZED','TIKTOK_AUTHORIZED','LICENSED_DATASET','OTHER');
create type creative_status as enum ('PENDING','INGESTING','TRANSCRIBING','EXTRACTING_FRAMES','ANALYZING','SKELETONIZING','READY','FAILED','CANCELLED');
create type generation_status as enum ('QUEUED','GENERATING','EVALUATING','REGENERATING','COMPLETED','FAILED');
create type generation_kind as enum ('CREATIVE_DNA','SKELETON','COMPOSITION','ORIGINALITY','EMBEDDING','OTHER');
create type artifact_kind as enum ('ORIGINAL','AUDIO','THUMBNAIL','FRAME','TRANSCRIPT_FILE','NORMALIZED_VIDEO');
create type evidence_class as enum ('OBSERVED','INFERRED','CUSTOMER_VALIDATED','SCORE_VALIDATED');
create type lifecycle_status as enum ('EMERGING','ACCELERATING','MAINSTREAM','SATURATED','DECLINING');
create type restricted_element_type as enum ('PHRASE','UNIQUE_FACT','METAPHOR','SCENE','CLAIM','NAME','OTHER');

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_profiles (
  id uuid primary key,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tenant_memberships (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null,
  role membership_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_memberships_user_idx on tenant_memberships(user_id);

create table brands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  website_url text,
  category text,
  description text,
  brand_voice jsonb not null default '{}'::jsonb,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index brands_tenant_idx on brands(tenant_id);

create table products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  description text,
  price_description text,
  offer_details jsonb not null default '{}'::jsonb,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_brand_idx on products(tenant_id, brand_id);

create table personas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  description text,
  pains jsonb not null default '[]'::jsonb,
  desires jsonb not null default '[]'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  awareness_stage text,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table brand_proof_points (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  label text not null,
  detail text not null,
  source_note text,
  created_at timestamptz not null default now()
);

create table brand_restrictions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  restriction_type text not null,
  value text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  source_type source_type not null,
  source_url text,
  platform_external_id text,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table creative_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  source_id uuid references sources(id) on delete set null,
  title text,
  media_type text not null default 'VIDEO',
  status creative_status not null default 'PENDING',
  content_sha256 text,
  duration_ms bigint,
  width integer,
  height integer,
  mime_type text,
  error_code text,
  error_message text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index creative_assets_tenant_status_idx on creative_assets(tenant_id, status);

create table media_artifacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  creative_asset_id uuid not null references creative_assets(id) on delete cascade,
  kind artifact_kind not null,
  storage_key text not null,
  mime_type text,
  byte_size bigint,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table transcripts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  creative_asset_id uuid not null references creative_assets(id) on delete cascade,
  language text,
  text_content text not null,
  segments jsonb not null default '[]'::jsonb,
  provider text,
  model text,
  created_at timestamptz not null default now()
);

create table generation_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  kind generation_kind not null,
  status generation_status not null default 'QUEUED',
  provider text,
  model text,
  prompt_version text,
  schema_version text,
  input_fingerprint text,
  request_metadata jsonb not null default '{}'::jsonb,
  usage_metadata jsonb not null default '{}'::jsonb,
  cost_microusd bigint,
  latency_ms bigint,
  attempt integer not null default 0,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table deconstructions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  creative_asset_id uuid not null references creative_assets(id) on delete cascade,
  generation_run_id uuid not null references generation_runs(id),
  schema_version text not null,
  payload jsonb not null,
  summary text,
  created_at timestamptz not null default now()
);

create table skeletons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  deconstruction_id uuid not null references deconstructions(id) on delete cascade,
  generation_run_id uuid not null references generation_runs(id),
  schema_version text not null,
  payload jsonb not null,
  canonical_text text not null,
  embedding vector(1536),
  embedding_model text,
  created_at timestamptz not null default now()
);

create table skeleton_restricted_elements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  skeleton_id uuid not null references skeletons(id) on delete cascade,
  element_type restricted_element_type not null,
  value text not null,
  normalized_value text,
  severity smallint not null default 1 check (severity between 1 and 5),
  created_at timestamptz not null default now()
);

create table concepts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  persona_id uuid references personas(id) on delete set null,
  skeleton_id uuid not null references skeletons(id),
  generation_run_id uuid not null references generation_runs(id),
  schema_version text not null,
  title text not null,
  payload jsonb not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table originality_evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  concept_id uuid not null references concepts(id) on delete cascade,
  generation_run_id uuid references generation_runs(id),
  schema_version text not null,
  passed boolean not null,
  phrase_overlap numeric,
  ngram_overlap numeric,
  semantic_similarity numeric,
  flags jsonb not null default '[]'::jsonb,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table production_briefs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  concept_id uuid not null references concepts(id) on delete cascade,
  payload jsonb not null,
  schema_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table patterns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  description text,
  canonical_structure jsonb not null default '{}'::jsonb,
  lifecycle lifecycle_status,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table pattern_members (
  pattern_id uuid not null references patterns(id) on delete cascade,
  skeleton_id uuid not null references skeletons(id) on delete cascade,
  similarity numeric(6,5),
  created_at timestamptz not null default now(),
  primary key(pattern_id, skeleton_id)
);

create table signal_snapshots (
  id uuid primary key default gen_random_uuid(),
  pattern_id uuid not null references patterns(id) on delete cascade,
  measured_at timestamptz not null,
  velocity numeric,
  acceleration numeric,
  diffusion numeric,
  novelty numeric,
  structural_reusability numeric,
  evidence_confidence numeric,
  saturation_penalty numeric,
  arbitrage_bonus numeric,
  base_score numeric,
  final_score numeric,
  lifecycle lifecycle_status,
  evidence_class evidence_class not null default 'INFERRED',
  evidence jsonb not null default '{}'::jsonb,
  unique(pattern_id, measured_at)
);

create table brand_pattern_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  pattern_id uuid not null references patterns(id) on delete cascade,
  measured_at timestamptz not null default now(),
  brand_proximity numeric,
  final_score numeric,
  rationale jsonb not null default '{}'::jsonb
);

create table performance_imports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  source text not null default 'CSV',
  status text not null,
  storage_key text,
  mapping jsonb not null default '{}'::jsonb,
  error_report jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table performance_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  import_id uuid references performance_imports(id) on delete set null,
  creative_asset_id uuid references creative_assets(id) on delete set null,
  concept_id uuid references concepts(id) on delete set null,
  external_ad_id text,
  period_start date,
  period_end date,
  spend numeric(14,2),
  impressions bigint,
  clicks bigint,
  conversions numeric,
  revenue numeric(14,2),
  metrics jsonb not null default '{}'::jsonb,
  evidence_class evidence_class not null default 'CUSTOMER_VALIDATED',
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_code text not null default 'FREE',
  status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table plan_entitlements (
  plan_code text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

create table usage_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  event_type text not null,
  quantity numeric not null default 1,
  unit text not null default 'COUNT',
  idempotency_key text not null,
  generation_run_id uuid references generation_runs(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(tenant_id, idempotency_key)
);

create table webhook_events (
  id text primary key,
  provider text not null,
  event_type text not null,
  status text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  actor_user_id uuid,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Codex must:
-- 1) bind user_profiles/user IDs to Supabase auth.users in migrations,
-- 2) enable RLS on every tenant-owned table,
-- 3) implement membership-based SELECT/INSERT/UPDATE/DELETE policies,
-- 4) add same-tenant invariant enforcement where FK alone is insufficient,
-- 5) test cross-tenant reads and writes,
-- 6) reconcile vector dimensions with actual configured embedding dimensions.
