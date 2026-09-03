create type public.generation_status as enum (
  'QUEUED',
  'GENERATING',
  'EVALUATING',
  'REGENERATING',
  'COMPLETED',
  'FAILED'
);

create type public.generation_kind as enum (
  'TRANSCRIPTION',
  'CREATIVE_DNA',
  'SKELETON',
  'COMPOSITION',
  'ORIGINALITY',
  'EMBEDDING',
  'OTHER'
);

alter table public.background_jobs
  drop constraint background_jobs_kind_check;
alter table public.background_jobs
  add constraint background_jobs_kind_check
  check (kind in ('MEDIA_PROCESSING', 'CREATIVE_ANALYSIS'));

create table public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind public.generation_kind not null,
  status public.generation_status not null default 'QUEUED',
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 240),
  provider text not null check (char_length(provider) between 1 and 100),
  model text not null check (char_length(model) between 1 and 200),
  prompt_version text,
  schema_version text not null check (char_length(schema_version) between 1 and 50),
  input_fingerprint text not null check (input_fingerprint ~ '^[a-f0-9]{64}$'),
  request_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(request_metadata) = 'object'),
  usage_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(usage_metadata) = 'object'),
  cost_microusd bigint check (cost_microusd is null or cost_microusd >= 0),
  latency_ms bigint check (latency_ms is null or latency_ms >= 0),
  attempt integer not null default 0 check (attempt >= 0),
  error_code text,
  error_message text check (error_message is null or char_length(error_message) <= 500),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (tenant_id, id),
  unique (tenant_id, idempotency_key)
);

create index generation_runs_tenant_created_idx
  on public.generation_runs(tenant_id, created_at desc);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  creative_asset_id uuid not null,
  generation_run_id uuid not null,
  schema_version text not null check (schema_version = '1.0'),
  language text,
  text_content text not null,
  segments jsonb not null default '[]'::jsonb check (jsonb_typeof(segments) = 'array'),
  provider text not null,
  model text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, creative_asset_id),
  foreign key (tenant_id, creative_asset_id)
    references public.creative_assets(tenant_id, id) on delete cascade,
  foreign key (tenant_id, generation_run_id)
    references public.generation_runs(tenant_id, id)
);

create table public.deconstructions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  creative_asset_id uuid not null,
  generation_run_id uuid not null,
  schema_version text not null check (schema_version = '1.0'),
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ->> 'schema_version' = schema_version
  ),
  summary text check (summary is null or char_length(summary) <= 1000),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, creative_asset_id),
  foreign key (tenant_id, creative_asset_id)
    references public.creative_assets(tenant_id, id) on delete cascade,
  foreign key (tenant_id, generation_run_id)
    references public.generation_runs(tenant_id, id)
);

create index deconstructions_asset_idx
  on public.deconstructions(tenant_id, creative_asset_id);

drop function public.finish_media_job(uuid, jsonb, jsonb);

create function public.finish_media_job(
  requested_job_id uuid,
  media_metadata jsonb,
  derived_artifacts jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_record public.background_jobs%rowtype;
  requested_asset_id uuid;
  analysis_job_id uuid;
begin
  perform private.require_service_role();

  select job.* into job_record
  from public.background_jobs as job
  where job.id = requested_job_id
  for update;

  if job_record.id is null then
    raise exception 'Job not found' using errcode = 'P0002';
  end if;

  requested_asset_id := (job_record.payload ->> 'creative_asset_id')::uuid;

  if job_record.status not in ('RUNNING', 'SUCCEEDED') then
    raise exception 'Job is not running' using errcode = '55000';
  end if;

  if job_record.status = 'RUNNING' then
    insert into public.media_artifacts (
      tenant_id, creative_asset_id, kind, storage_key, mime_type, byte_size, metadata
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
      kind text, storage_key text, mime_type text, byte_size bigint, metadata jsonb
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
  end if;

  insert into public.background_jobs (
    tenant_id, kind, idempotency_key, payload
  )
  values (
    job_record.tenant_id,
    'CREATIVE_ANALYSIS',
    'creative-analysis:' || requested_asset_id::text,
    jsonb_build_object('creative_asset_id', requested_asset_id)
  )
  on conflict (tenant_id, idempotency_key) do update
    set idempotency_key = excluded.idempotency_key
  returning id into analysis_job_id;

  return analysis_job_id;
end;
$$;

revoke all on function public.finish_media_job(uuid, jsonb, jsonb) from public;
grant execute on function public.finish_media_job(uuid, jsonb, jsonb) to service_role;

create function public.claim_analysis_job(requested_job_id uuid)
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
    and job.kind = 'CREATIVE_ANALYSIS'
    and job.status = 'QUEUED'
    and job.available_at <= now()
    and job.attempt < job.max_attempts
  returning job.* into claimed_job;

  if claimed_job.id is null then
    return;
  end if;

  update public.creative_assets
  set status = 'TRANSCRIBING', error_code = null, error_message = null
  where id = (claimed_job.payload ->> 'creative_asset_id')::uuid;

  return query select
    claimed_job.tenant_id,
    (claimed_job.payload ->> 'creative_asset_id')::uuid,
    claimed_job.attempt;
end;
$$;

revoke all on function public.claim_analysis_job(uuid) from public;
grant execute on function public.claim_analysis_job(uuid) to service_role;

create function public.start_generation_run(
  requested_tenant_id uuid,
  requested_asset_id uuid,
  requested_kind public.generation_kind,
  requested_idempotency_key text,
  requested_provider text,
  requested_model text,
  requested_prompt_version text,
  requested_schema_version text,
  requested_input_fingerprint text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_id uuid;
begin
  perform private.require_service_role();

  if not exists (
    select 1 from public.creative_assets
    where id = requested_asset_id and tenant_id = requested_tenant_id
  ) then
    raise exception 'Creative not found' using errcode = 'P0002';
  end if;

  insert into public.generation_runs (
    tenant_id, kind, status, idempotency_key, provider, model,
    prompt_version, schema_version, input_fingerprint,
    request_metadata, attempt
  )
  values (
    requested_tenant_id, requested_kind, 'GENERATING', requested_idempotency_key,
    requested_provider, requested_model, requested_prompt_version,
    requested_schema_version, requested_input_fingerprint,
    jsonb_build_object('creative_asset_id', requested_asset_id), 1
  )
  on conflict (tenant_id, idempotency_key) do update set
    status = case
      when public.generation_runs.status = 'COMPLETED' then 'COMPLETED'::public.generation_status
      else 'GENERATING'::public.generation_status
    end,
    attempt = case
      when public.generation_runs.status = 'COMPLETED' then public.generation_runs.attempt
      else public.generation_runs.attempt + 1
    end,
    error_code = case when public.generation_runs.status = 'COMPLETED' then public.generation_runs.error_code else null end,
    error_message = case when public.generation_runs.status = 'COMPLETED' then public.generation_runs.error_message else null end,
    completed_at = case when public.generation_runs.status = 'COMPLETED' then public.generation_runs.completed_at else null end
  returning id into run_id;

  return run_id;
end;
$$;

revoke all on function public.start_generation_run(uuid, uuid, public.generation_kind, text, text, text, text, text, text) from public;
grant execute on function public.start_generation_run(uuid, uuid, public.generation_kind, text, text, text, text, text, text) to service_role;

create function public.complete_transcription_run(
  requested_run_id uuid,
  transcript_language text,
  transcript_text text,
  transcript_segments jsonb,
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
  run_record public.generation_runs%rowtype;
  asset_id uuid;
  transcript_id uuid;
begin
  perform private.require_service_role();

  select run.* into run_record from public.generation_runs as run
  where run.id = requested_run_id for update;
  if run_record.id is null or run_record.kind <> 'TRANSCRIPTION' then
    raise exception 'Transcription run not found' using errcode = 'P0002';
  end if;
  asset_id := (run_record.request_metadata ->> 'creative_asset_id')::uuid;

  if run_record.status = 'COMPLETED' then
    select transcript.id into transcript_id
    from public.transcripts as transcript
    where transcript.tenant_id = run_record.tenant_id
      and transcript.creative_asset_id = asset_id;
    return transcript_id;
  end if;
  if run_record.status <> 'GENERATING' then
    raise exception 'Transcription run is not active' using errcode = '55000';
  end if;

  insert into public.transcripts (
    tenant_id, creative_asset_id, generation_run_id, schema_version,
    language, text_content, segments, provider, model
  ) values (
    run_record.tenant_id, asset_id, run_record.id, run_record.schema_version,
    transcript_language, transcript_text, transcript_segments,
    run_record.provider, run_record.model
  )
  on conflict (tenant_id, creative_asset_id) do update set
    generation_run_id = excluded.generation_run_id,
    schema_version = excluded.schema_version,
    language = excluded.language,
    text_content = excluded.text_content,
    segments = excluded.segments,
    provider = excluded.provider,
    model = excluded.model,
    created_at = now()
  returning id into transcript_id;

  update public.generation_runs set
    status = 'COMPLETED',
    usage_metadata = requested_usage_metadata,
    cost_microusd = requested_cost_microusd,
    latency_ms = requested_latency_ms,
    completed_at = now(),
    error_code = null,
    error_message = null
  where id = requested_run_id;

  update public.creative_assets set status = 'ANALYZING'
  where id = asset_id;

  return transcript_id;
end;
$$;

revoke all on function public.complete_transcription_run(uuid, text, text, jsonb, jsonb, bigint, bigint) from public;
grant execute on function public.complete_transcription_run(uuid, text, text, jsonb, jsonb, bigint, bigint) to service_role;

create function public.complete_creative_dna_run(
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

  if job_record.status = 'SUCCEEDED' and run_record.status = 'COMPLETED' then
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

  update public.background_jobs set status = 'SUCCEEDED', completed_at = now()
  where id = requested_job_id;

  update public.creative_assets set
    status = 'READY', error_code = null, error_message = null
  where id = asset_id;

  return deconstruction_id;
end;
$$;

revoke all on function public.complete_creative_dna_run(uuid, uuid, jsonb, text, jsonb, bigint, bigint) from public;
grant execute on function public.complete_creative_dna_run(uuid, uuid, jsonb, text, jsonb, bigint, bigint) to service_role;

create function public.fail_analysis_job(
  requested_job_id uuid,
  requested_run_id uuid,
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
  select job.* into job_record from public.background_jobs as job
  where job.id = requested_job_id for update;
  if job_record.id is null or job_record.status = 'SUCCEEDED' then return; end if;

  if requested_run_id is not null then
    update public.generation_runs set
      status = 'FAILED', completed_at = now(),
      error_code = requested_error_code,
      error_message = left(requested_error_message, 500)
    where id = requested_run_id and tenant_id = job_record.tenant_id;
  end if;

  update public.background_jobs set
    status = 'FAILED', completed_at = now(),
    error_code = requested_error_code,
    error_message = left(requested_error_message, 500)
  where id = requested_job_id;

  update public.creative_assets set
    status = 'FAILED', error_code = requested_error_code,
    error_message = left(requested_error_message, 500)
  where id = (job_record.payload ->> 'creative_asset_id')::uuid;
end;
$$;

revoke all on function public.fail_analysis_job(uuid, uuid, text, text) from public;
grant execute on function public.fail_analysis_job(uuid, uuid, text, text) to service_role;

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
      then 'TRANSCRIBING'::public.creative_status
      else 'INGESTING'::public.creative_status end,
    error_code = null, error_message = null
  where id = requested_asset_id;

  return failed_job.id;
end;
$$;

alter table public.generation_runs enable row level security;
alter table public.transcripts enable row level security;
alter table public.deconstructions enable row level security;

create policy generation_runs_member_select on public.generation_runs
for select to authenticated using (private.is_tenant_member(tenant_id));
create policy transcripts_member_select on public.transcripts
for select to authenticated using (private.is_tenant_member(tenant_id));
create policy deconstructions_member_select on public.deconstructions
for select to authenticated using (private.is_tenant_member(tenant_id));

grant select on public.generation_runs, public.transcripts, public.deconstructions to authenticated;
grant select, insert, update, delete on public.generation_runs, public.transcripts, public.deconstructions to service_role;
