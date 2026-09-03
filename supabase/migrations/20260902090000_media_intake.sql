create type public.source_type as enum (
  'UPLOAD',
  'URL',
  'YOUTUBE',
  'META_AUTHORIZED',
  'TIKTOK_AUTHORIZED',
  'LICENSED_DATASET',
  'OTHER'
);

create type public.creative_status as enum (
  'PENDING',
  'INGESTING',
  'TRANSCRIBING',
  'EXTRACTING_FRAMES',
  'ANALYZING',
  'SKELETONIZING',
  'READY',
  'FAILED',
  'CANCELLED'
);

create type public.artifact_kind as enum (
  'ORIGINAL',
  'AUDIO',
  'THUMBNAIL',
  'FRAME',
  'TRANSCRIPT_FILE',
  'NORMALIZED_VIDEO'
);

create type public.media_upload_status as enum (
  'INITIATED',
  'VALIDATED',
  'REJECTED'
);

create type public.background_job_status as enum (
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED'
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source_type public.source_type not null,
  source_url text,
  platform_external_id text,
  provenance jsonb not null default '{}'::jsonb check (
    jsonb_typeof(provenance) = 'object'
  ),
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create index sources_tenant_created_idx
  on public.sources(tenant_id, created_at desc);

create table public.creative_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source_id uuid,
  title text check (title is null or char_length(btrim(title)) between 1 and 200),
  media_type text not null default 'VIDEO' check (media_type = 'VIDEO'),
  status public.creative_status not null default 'PENDING',
  content_sha256 text check (
    content_sha256 is null or content_sha256 ~ '^[a-f0-9]{64}$'
  ),
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  mime_type text,
  error_code text,
  error_message text check (
    error_message is null or char_length(error_message) <= 500
  ),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, source_id)
    references public.sources(tenant_id, id) on delete set null (source_id)
);

create index creative_assets_tenant_status_idx
  on public.creative_assets(tenant_id, status, created_at desc);

create table public.media_uploads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  creative_asset_id uuid not null,
  initiation_key text not null check (
    char_length(initiation_key) between 8 and 128
  ),
  original_filename text not null check (
    char_length(btrim(original_filename)) between 1 and 255
  ),
  declared_mime_type text not null,
  declared_byte_size bigint not null check (declared_byte_size > 0),
  storage_key text not null unique,
  status public.media_upload_status not null default 'INITIATED',
  rejection_code text,
  expires_at timestamptz not null default now() + interval '1 hour',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, creative_asset_id),
  unique (tenant_id, initiation_key),
  foreign key (tenant_id, creative_asset_id)
    references public.creative_assets(tenant_id, id) on delete cascade
);

create table public.media_artifacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  creative_asset_id uuid not null,
  kind public.artifact_kind not null,
  storage_key text not null unique,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object'
  ),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, creative_asset_id)
    references public.creative_assets(tenant_id, id) on delete cascade,
  unique (tenant_id, id)
);

create unique index media_artifacts_original_unique
  on public.media_artifacts(creative_asset_id)
  where kind = 'ORIGINAL';

create index media_artifacts_asset_idx
  on public.media_artifacts(tenant_id, creative_asset_id, kind, created_at);

create table public.background_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null check (kind = 'MEDIA_PROCESSING'),
  status public.background_job_status not null default 'QUEUED',
  idempotency_key text not null check (
    char_length(idempotency_key) between 8 and 200
  ),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  attempt integer not null default 0 check (attempt >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  error_code text,
  error_message text check (
    error_message is null or char_length(error_message) <= 500
  ),
  available_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, idempotency_key)
);

create index background_jobs_claim_idx
  on public.background_jobs(status, available_at, created_at)
  where status = 'QUEUED';

create trigger creative_assets_set_updated_at
before update on public.creative_assets
for each row execute function private.set_updated_at();

create trigger media_uploads_set_updated_at
before update on public.media_uploads
for each row execute function private.set_updated_at();

create trigger background_jobs_set_updated_at
before update on public.background_jobs
for each row execute function private.set_updated_at();

create or replace function private.require_service_role()
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.require_service_role() from public;
grant execute on function private.require_service_role() to service_role;

create or replace function public.initialize_creative_upload(
  requested_title text,
  requested_filename text,
  requested_mime_type text,
  requested_byte_size bigint,
  requested_initiation_key text
)
returns table (creative_asset_id uuid, storage_key text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_tenant_id uuid;
  existing_asset_id uuid;
  existing_storage_key text;
  new_source_id uuid;
  new_asset_id uuid;
  new_storage_key text;
  safe_filename text := regexp_replace(
    btrim(requested_filename),
    '[^a-zA-Z0-9._-]+',
    '-',
    'g'
  );
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select membership.tenant_id
    into target_tenant_id
  from public.tenant_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at, membership.tenant_id
  limit 1;

  if target_tenant_id is null
    or not private.can_write_tenant(target_tenant_id) then
    raise exception 'Creative write access required' using errcode = '42501';
  end if;

  if char_length(btrim(requested_initiation_key)) not between 8 and 128
    or char_length(btrim(requested_filename)) not between 1 and 255
    or requested_byte_size <= 0 then
    raise exception 'Invalid upload initialization' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(target_tenant_id::text || requested_initiation_key, 2)
  );

  select upload.creative_asset_id, upload.storage_key
    into existing_asset_id, existing_storage_key
  from public.media_uploads as upload
  where upload.tenant_id = target_tenant_id
    and upload.initiation_key = requested_initiation_key;

  if existing_asset_id is not null then
    return query select existing_asset_id, existing_storage_key;
    return;
  end if;

  insert into public.sources (tenant_id, source_type, provenance)
  values (
    target_tenant_id,
    'UPLOAD',
    jsonb_build_object(
      'original_filename', requested_filename,
      'declared_mime_type', requested_mime_type,
      'declared_byte_size', requested_byte_size
    )
  )
  returning id into new_source_id;

  insert into public.creative_assets (
    tenant_id,
    source_id,
    title,
    created_by
  )
  values (
    target_tenant_id,
    new_source_id,
    nullif(btrim(requested_title), ''),
    current_user_id
  )
  returning id into new_asset_id;

  new_storage_key := target_tenant_id::text
    || '/' || new_asset_id::text
    || '/original/' || gen_random_uuid()::text
    || '-' || left(safe_filename, 120);

  insert into public.media_uploads (
    tenant_id,
    creative_asset_id,
    initiation_key,
    original_filename,
    declared_mime_type,
    declared_byte_size,
    storage_key
  )
  values (
    target_tenant_id,
    new_asset_id,
    btrim(requested_initiation_key),
    btrim(requested_filename),
    requested_mime_type,
    requested_byte_size,
    new_storage_key
  );

  return query select new_asset_id, new_storage_key;
end;
$$;

revoke all on function public.initialize_creative_upload(text, text, text, bigint, text)
  from public;
grant execute on function public.initialize_creative_upload(text, text, text, bigint, text)
  to authenticated;

create or replace function public.complete_creative_upload(
  requested_asset_id uuid,
  verified_sha256 text,
  verified_mime_type text,
  verified_byte_size bigint,
  raw_retention_days integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  upload_record public.media_uploads%rowtype;
  existing_job_id uuid;
  new_job_id uuid;
begin
  perform private.require_service_role();

  select upload.* into upload_record
  from public.media_uploads as upload
  where upload.creative_asset_id = requested_asset_id
  for update;

  if upload_record.id is null then
    raise exception 'Upload not found' using errcode = 'P0002';
  end if;

  if upload_record.status = 'REJECTED' then
    raise exception 'Upload was rejected' using errcode = '55000';
  end if;

  select job.id into existing_job_id
  from public.background_jobs as job
  where job.tenant_id = upload_record.tenant_id
    and job.idempotency_key = 'media-process:' || requested_asset_id::text;

  if existing_job_id is not null then
    return existing_job_id;
  end if;

  update public.media_uploads
  set status = 'VALIDATED', rejection_code = null
  where id = upload_record.id;

  update public.creative_assets
  set
    status = 'INGESTING',
    content_sha256 = verified_sha256,
    mime_type = verified_mime_type,
    error_code = null,
    error_message = null
  where id = requested_asset_id;

  insert into public.media_artifacts (
    tenant_id,
    creative_asset_id,
    kind,
    storage_key,
    mime_type,
    byte_size,
    expires_at
  )
  values (
    upload_record.tenant_id,
    requested_asset_id,
    'ORIGINAL',
    upload_record.storage_key,
    verified_mime_type,
    verified_byte_size,
    now() + make_interval(days => raw_retention_days)
  )
  on conflict (creative_asset_id) where kind = 'ORIGINAL'
  do update set
    mime_type = excluded.mime_type,
    byte_size = excluded.byte_size,
    expires_at = excluded.expires_at;

  insert into public.background_jobs (
    tenant_id,
    kind,
    idempotency_key,
    payload
  )
  values (
    upload_record.tenant_id,
    'MEDIA_PROCESSING',
    'media-process:' || requested_asset_id::text,
    jsonb_build_object('creative_asset_id', requested_asset_id)
  )
  returning id into new_job_id;

  return new_job_id;
end;
$$;

revoke all on function public.complete_creative_upload(uuid, text, text, bigint, integer)
  from public;
grant execute on function public.complete_creative_upload(uuid, text, text, bigint, integer)
  to service_role;

create or replace function public.reject_creative_upload(
  requested_asset_id uuid,
  requested_error_code text,
  requested_error_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_service_role();

  update public.media_uploads
  set status = 'REJECTED', rejection_code = requested_error_code
  where creative_asset_id = requested_asset_id
    and status = 'INITIATED';

  update public.creative_assets
  set
    status = 'FAILED',
    error_code = requested_error_code,
    error_message = left(requested_error_message, 500)
  where id = requested_asset_id
    and status = 'PENDING';
end;
$$;

revoke all on function public.reject_creative_upload(uuid, text, text) from public;
grant execute on function public.reject_creative_upload(uuid, text, text)
  to service_role;

create or replace function public.claim_media_job(requested_job_id uuid)
returns table (tenant_id uuid, creative_asset_id uuid, attempt integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_job public.background_jobs%rowtype;
begin
  perform private.require_service_role();

  update public.background_jobs as job
  set
    status = 'RUNNING',
    attempt = job.attempt + 1,
    started_at = now(),
    completed_at = null,
    error_code = null,
    error_message = null
  where job.id = requested_job_id
    and job.status = 'QUEUED'
    and job.available_at <= now()
    and job.attempt < job.max_attempts
  returning job.* into claimed_job;

  if claimed_job.id is null then
    return;
  end if;

  update public.creative_assets
  set status = 'INGESTING', error_code = null, error_message = null
  where id = (claimed_job.payload ->> 'creative_asset_id')::uuid;

  return query select
    claimed_job.tenant_id,
    (claimed_job.payload ->> 'creative_asset_id')::uuid,
    claimed_job.attempt;
end;
$$;

revoke all on function public.claim_media_job(uuid) from public;
grant execute on function public.claim_media_job(uuid) to service_role;

create or replace function public.finish_media_job(
  requested_job_id uuid,
  media_metadata jsonb,
  derived_artifacts jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_record public.background_jobs%rowtype;
  requested_asset_id uuid;
begin
  perform private.require_service_role();

  select job.* into job_record
  from public.background_jobs as job
  where job.id = requested_job_id
  for update;

  if job_record.status = 'SUCCEEDED' then
    return;
  end if;

  if job_record.status <> 'RUNNING' then
    raise exception 'Job is not running' using errcode = '55000';
  end if;

  requested_asset_id := (job_record.payload ->> 'creative_asset_id')::uuid;

  insert into public.media_artifacts (
    tenant_id,
    creative_asset_id,
    kind,
    storage_key,
    mime_type,
    byte_size,
    metadata
  )
  select
    job_record.tenant_id,
    requested_asset_id,
    artifact.kind::public.artifact_kind,
    artifact.storage_key,
    artifact.mime_type,
    artifact.byte_size,
    coalesce(artifact.metadata, '{}'::jsonb)
  from jsonb_to_recordset(derived_artifacts) as artifact(
    kind text,
    storage_key text,
    mime_type text,
    byte_size bigint,
    metadata jsonb
  )
  on conflict (storage_key) do update set
    mime_type = excluded.mime_type,
    byte_size = excluded.byte_size,
    metadata = excluded.metadata;

  update public.creative_assets
  set
    status = 'TRANSCRIBING',
    duration_ms = (media_metadata ->> 'duration_ms')::bigint,
    width = (media_metadata ->> 'width')::integer,
    height = (media_metadata ->> 'height')::integer,
    error_code = null,
    error_message = null
  where id = requested_asset_id;

  update public.background_jobs
  set status = 'SUCCEEDED', completed_at = now()
  where id = requested_job_id;
end;
$$;

revoke all on function public.finish_media_job(uuid, jsonb, jsonb) from public;
grant execute on function public.finish_media_job(uuid, jsonb, jsonb)
  to service_role;

create or replace function public.fail_media_job(
  requested_job_id uuid,
  requested_error_code text,
  requested_error_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_record public.background_jobs%rowtype;
begin
  perform private.require_service_role();

  select job.* into job_record
  from public.background_jobs as job
  where job.id = requested_job_id
  for update;

  if job_record.id is null or job_record.status = 'SUCCEEDED' then
    return;
  end if;

  update public.background_jobs
  set
    status = 'FAILED',
    completed_at = now(),
    error_code = requested_error_code,
    error_message = left(requested_error_message, 500)
  where id = requested_job_id;

  update public.creative_assets
  set
    status = 'FAILED',
    error_code = requested_error_code,
    error_message = left(requested_error_message, 500)
  where id = (job_record.payload ->> 'creative_asset_id')::uuid;
end;
$$;

revoke all on function public.fail_media_job(uuid, text, text) from public;
grant execute on function public.fail_media_job(uuid, text, text)
  to service_role;

create or replace function public.retry_creative_processing(
  requested_asset_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_tenant_id uuid;
  target_job public.background_jobs%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select asset.tenant_id into target_tenant_id
  from public.creative_assets as asset
  where asset.id = requested_asset_id;

  if target_tenant_id is null
    or not private.can_write_tenant(target_tenant_id) then
    raise exception 'Creative write access required' using errcode = '42501';
  end if;

  select job.* into target_job
  from public.background_jobs as job
  where job.tenant_id = target_tenant_id
    and job.idempotency_key = 'media-process:' || requested_asset_id::text
  for update;

  if target_job.id is null then
    raise exception 'Processing job not found' using errcode = 'P0002';
  end if;

  if target_job.status = 'QUEUED' or target_job.status = 'RUNNING' then
    return target_job.id;
  end if;

  if target_job.status <> 'FAILED' or target_job.attempt >= target_job.max_attempts then
    raise exception 'Creative cannot be retried' using errcode = '55000';
  end if;

  update public.background_jobs
  set status = 'QUEUED', available_at = now(), completed_at = null
  where id = target_job.id;

  update public.creative_assets
  set status = 'INGESTING', error_code = null, error_message = null
  where id = requested_asset_id;

  return target_job.id;
end;
$$;

revoke all on function public.retry_creative_processing(uuid) from public;
grant execute on function public.retry_creative_processing(uuid) to authenticated;

alter table public.sources enable row level security;
alter table public.creative_assets enable row level security;
alter table public.media_uploads enable row level security;
alter table public.media_artifacts enable row level security;
alter table public.background_jobs enable row level security;

create policy sources_select_member
on public.sources for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy sources_delete_writer
on public.sources for delete to authenticated
using ((select private.can_write_tenant(tenant_id)));

create policy creative_assets_select_member
on public.creative_assets for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy creative_assets_delete_writer
on public.creative_assets for delete to authenticated
using ((select private.can_write_tenant(tenant_id)));

create policy media_uploads_select_member
on public.media_uploads for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy media_artifacts_select_member
on public.media_artifacts for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy background_jobs_select_member
on public.background_jobs for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

revoke all on public.sources from anon, authenticated;
revoke all on public.creative_assets from anon, authenticated;
revoke all on public.media_uploads from anon, authenticated;
revoke all on public.media_artifacts from anon, authenticated;
revoke all on public.background_jobs from anon, authenticated;

grant select, delete on public.sources to authenticated;
grant select, delete on public.creative_assets to authenticated;
grant select on public.media_uploads to authenticated;
grant select on public.media_artifacts to authenticated;
grant select on public.background_jobs to authenticated;

grant select, insert, update, delete on public.sources to service_role;
grant select, insert, update, delete on public.creative_assets to service_role;
grant select, insert, update, delete on public.media_uploads to service_role;
grant select, insert, update, delete on public.media_artifacts to service_role;
grant select, insert, update, delete on public.background_jobs to service_role;
