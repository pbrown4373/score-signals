create type public.restricted_element_type as enum (
  'PHRASE',
  'UNIQUE_FACT',
  'METAPHOR',
  'SCENE',
  'CLAIM',
  'NAME',
  'OTHER'
);

create table public.skeletons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  deconstruction_id uuid not null,
  generation_run_id uuid not null,
  schema_version text not null check (schema_version = '1.0'),
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ->> 'schema_version' = schema_version
  ),
  canonical_text text not null check (char_length(canonical_text) between 20 and 5000),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, deconstruction_id),
  foreign key (tenant_id, deconstruction_id)
    references public.deconstructions(tenant_id, id) on delete cascade,
  foreign key (tenant_id, generation_run_id)
    references public.generation_runs(tenant_id, id)
);

create index skeletons_tenant_created_idx
  on public.skeletons(tenant_id, created_at desc);

create table public.skeleton_restricted_elements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  skeleton_id uuid not null,
  element_type public.restricted_element_type not null,
  value text not null check (char_length(value) between 2 and 500),
  normalized_value text not null check (char_length(normalized_value) between 1 and 500),
  severity smallint not null check (severity between 1 and 5),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, skeleton_id, element_type, normalized_value),
  foreign key (tenant_id, skeleton_id)
    references public.skeletons(tenant_id, id) on delete cascade
);

create index skeleton_restricted_lookup_idx
  on public.skeleton_restricted_elements(tenant_id, skeleton_id, element_type);

create function private.analysis_resume_status(requested_asset_id uuid)
returns public.creative_status
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.deconstructions
      where creative_asset_id = requested_asset_id
    ) then 'SKELETONIZING'::public.creative_status
    when exists (
      select 1 from public.transcripts
      where creative_asset_id = requested_asset_id
    ) then 'ANALYZING'::public.creative_status
    else 'TRANSCRIBING'::public.creative_status
  end;
$$;

revoke all on function private.analysis_resume_status(uuid) from public;

create or replace function public.claim_analysis_job(requested_job_id uuid)
returns table (tenant_id uuid, creative_asset_id uuid, attempt integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_job public.background_jobs%rowtype;
  asset_id uuid;
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
    and job.kind = 'CREATIVE_ANALYSIS'
    and job.status = 'QUEUED'
    and job.available_at <= now()
    and job.attempt < job.max_attempts
  returning job.* into claimed_job;

  if claimed_job.id is null then
    return;
  end if;

  asset_id := (claimed_job.payload ->> 'creative_asset_id')::uuid;
  update public.creative_assets as asset
  set status = private.analysis_resume_status(asset_id),
      error_code = null,
      error_message = null
  where asset.id = asset_id and asset.tenant_id = claimed_job.tenant_id;

  return query select claimed_job.tenant_id, asset_id, claimed_job.attempt;
end;
$$;

create or replace function public.complete_creative_dna_run(
  requested_job_id uuid,
  requested_run_id uuid,
  creative_dna jsonb,
  requested_summary text,
  requested_usage_metadata jsonb,
  requested_cost_microusd bigint,
  requested_latency_ms bigint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_record public.background_jobs%rowtype;
  run_record public.generation_runs%rowtype;
  asset_id uuid;
  deconstruction_id uuid;
begin
  perform private.require_service_role();

  select job.* into job_record from public.background_jobs as job
  where job.id = requested_job_id for update;
  select run.* into run_record from public.generation_runs as run
  where run.id = requested_run_id for update;

  if job_record.id is null or job_record.kind <> 'CREATIVE_ANALYSIS' then
    raise exception 'Analysis job not found' using errcode = 'P0002';
  end if;
  if run_record.id is null or run_record.kind <> 'CREATIVE_DNA'
    or run_record.tenant_id <> job_record.tenant_id then
    raise exception 'Creative DNA run not found' using errcode = 'P0002';
  end if;
  asset_id := (job_record.payload ->> 'creative_asset_id')::uuid;
  if run_record.request_metadata ->> 'creative_asset_id' <> asset_id::text then
    raise exception 'Creative DNA run belongs to another creative' using errcode = '23503';
  end if;

  if run_record.status = 'COMPLETED' then
    select deconstruction.id into deconstruction_id
    from public.deconstructions as deconstruction
    where deconstruction.tenant_id = job_record.tenant_id
      and deconstruction.creative_asset_id = asset_id;
    return deconstruction_id;
  end if;
  if job_record.status <> 'RUNNING' or run_record.status <> 'GENERATING' then
    raise exception 'Creative DNA run is not active' using errcode = '55000';
  end if;

  insert into public.deconstructions (
    tenant_id, creative_asset_id, generation_run_id, schema_version, payload, summary
  ) values (
    job_record.tenant_id, asset_id, run_record.id, run_record.schema_version,
    creative_dna, nullif(left(requested_summary, 1000), '')
  )
  on conflict (tenant_id, creative_asset_id) do update set
    generation_run_id = excluded.generation_run_id,
    schema_version = excluded.schema_version,
    payload = excluded.payload,
    summary = excluded.summary,
    created_at = now()
  returning id into deconstruction_id;

  update public.generation_runs set
    status = 'COMPLETED',
    usage_metadata = requested_usage_metadata,
    cost_microusd = requested_cost_microusd,
    latency_ms = requested_latency_ms,
    completed_at = now(),
    error_code = null,
    error_message = null
  where id = requested_run_id;

  update public.creative_assets set
    status = 'SKELETONIZING', error_code = null, error_message = null
  where id = asset_id;

  return deconstruction_id;
end;
$$;

create function public.complete_skeleton_run(
  requested_job_id uuid,
  requested_run_id uuid,
  requested_deconstruction_id uuid,
  skeleton_payload jsonb,
  restricted_elements jsonb,
  requested_usage_metadata jsonb,
  requested_cost_microusd bigint,
  requested_latency_ms bigint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_record public.background_jobs%rowtype;
  run_record public.generation_runs%rowtype;
  asset_id uuid;
  persisted_skeleton_id uuid;
begin
  perform private.require_service_role();

  select job.* into job_record from public.background_jobs as job
  where job.id = requested_job_id for update;
  select run.* into run_record from public.generation_runs as run
  where run.id = requested_run_id for update;

  if job_record.id is null or job_record.kind <> 'CREATIVE_ANALYSIS' then
    raise exception 'Analysis job not found' using errcode = 'P0002';
  end if;
  if run_record.id is null or run_record.kind <> 'SKELETON'
    or run_record.tenant_id <> job_record.tenant_id then
    raise exception 'Skeleton run not found' using errcode = 'P0002';
  end if;
  asset_id := (job_record.payload ->> 'creative_asset_id')::uuid;
  if run_record.request_metadata ->> 'creative_asset_id' <> asset_id::text then
    raise exception 'Skeleton run belongs to another creative' using errcode = '23503';
  end if;

  if job_record.status = 'SUCCEEDED' and run_record.status = 'COMPLETED' then
    select skeleton.id into persisted_skeleton_id
    from public.skeletons as skeleton
    where skeleton.tenant_id = job_record.tenant_id
      and skeleton.deconstruction_id = requested_deconstruction_id;
    return persisted_skeleton_id;
  end if;
  if job_record.status <> 'RUNNING' or run_record.status <> 'GENERATING' then
    raise exception 'Skeleton run is not active' using errcode = '55000';
  end if;
  if not exists (
    select 1 from public.deconstructions
    where id = requested_deconstruction_id
      and tenant_id = job_record.tenant_id
      and creative_asset_id = asset_id
  ) then
    raise exception 'Deconstruction not found' using errcode = 'P0002';
  end if;

  insert into public.skeletons (
    tenant_id, deconstruction_id, generation_run_id,
    schema_version, payload, canonical_text
  ) values (
    job_record.tenant_id, requested_deconstruction_id, run_record.id,
    run_record.schema_version, skeleton_payload,
    skeleton_payload ->> 'canonical_text'
  )
  on conflict (tenant_id, deconstruction_id) do update set
    generation_run_id = excluded.generation_run_id,
    schema_version = excluded.schema_version,
    payload = excluded.payload,
    canonical_text = excluded.canonical_text,
    created_at = now()
  returning id into persisted_skeleton_id;

  delete from public.skeleton_restricted_elements as restricted
  where restricted.tenant_id = job_record.tenant_id
    and restricted.skeleton_id = persisted_skeleton_id;

  insert into public.skeleton_restricted_elements (
    tenant_id, skeleton_id, element_type, value, normalized_value, severity
  )
  select
    job_record.tenant_id,
    persisted_skeleton_id,
    element.element_type::public.restricted_element_type,
    element.value,
    element.normalized_value,
    element.severity
  from jsonb_to_recordset(restricted_elements) as element(
    element_type text, value text, normalized_value text, severity smallint
  );

  update public.generation_runs set
    status = 'COMPLETED',
    usage_metadata = requested_usage_metadata,
    cost_microusd = requested_cost_microusd,
    latency_ms = requested_latency_ms,
    completed_at = now(),
    error_code = null,
    error_message = null
  where id = requested_run_id;

  update public.background_jobs set status = 'SUCCEEDED', completed_at = now()
  where id = requested_job_id;

  update public.creative_assets set
    status = 'READY', error_code = null, error_message = null
  where id = asset_id;

  return persisted_skeleton_id;
end;
$$;

revoke all on function public.complete_skeleton_run(uuid, uuid, uuid, jsonb, jsonb, jsonb, bigint, bigint) from public;
grant execute on function public.complete_skeleton_run(uuid, uuid, uuid, jsonb, jsonb, jsonb, bigint, bigint) to service_role;

create or replace function public.retry_creative_processing(requested_asset_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_tenant_id uuid;
  failed_job public.background_jobs%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  select asset.tenant_id into target_tenant_id
  from public.creative_assets as asset where asset.id = requested_asset_id;
  if target_tenant_id is null or not private.can_write_tenant(target_tenant_id) then
    raise exception 'Creative write access required' using errcode = '42501';
  end if;

  select job.* into failed_job from public.background_jobs as job
  where job.tenant_id = target_tenant_id
    and job.payload ->> 'creative_asset_id' = requested_asset_id::text
    and job.status = 'FAILED'
  order by job.created_at desc limit 1 for update;

  if failed_job.id is null then
    select job.* into failed_job from public.background_jobs as job
    where job.tenant_id = target_tenant_id
      and job.payload ->> 'creative_asset_id' = requested_asset_id::text
      and job.status = 'QUEUED'
      and job.attempt > 0
    order by job.created_at desc limit 1;
    if failed_job.id is not null then return failed_job.id; end if;
  end if;

  if failed_job.id is null or failed_job.attempt >= failed_job.max_attempts then
    raise exception 'Creative cannot be retried' using errcode = '55000';
  end if;

  update public.background_jobs set
    status = 'QUEUED', available_at = now(), completed_at = null,
    error_code = null, error_message = null
  where id = failed_job.id;

  update public.creative_assets set
    status = case when failed_job.kind = 'CREATIVE_ANALYSIS'
      then private.analysis_resume_status(requested_asset_id)
      else 'INGESTING'::public.creative_status end,
    error_code = null, error_message = null
  where id = requested_asset_id and tenant_id = target_tenant_id;

  return failed_job.id;
end;
$$;

alter table public.skeletons enable row level security;
alter table public.skeleton_restricted_elements enable row level security;

create policy skeletons_member_select on public.skeletons
for select to authenticated using (private.is_tenant_member(tenant_id));

grant select on public.skeletons to authenticated;
revoke all on public.skeleton_restricted_elements from authenticated;
grant select, insert, update, delete on public.skeletons, public.skeleton_restricted_elements to service_role;
