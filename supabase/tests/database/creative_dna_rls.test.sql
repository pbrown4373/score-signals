begin;

create extension if not exists pgtap with schema extensions;
select plan(25);

insert into auth.users (id, email) values
  ('61000000-0000-0000-0000-000000000001', 'analysis-owner-a@example.test'),
  ('62000000-0000-0000-0000-000000000002', 'analysis-owner-b@example.test'),
  ('63000000-0000-0000-0000-000000000003', 'analysis-viewer-a@example.test');

set local role authenticated;
set local request.jwt.claim.sub = '61000000-0000-0000-0000-000000000001';
select public.bootstrap_tenant('Analysis Tenant Alpha');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '62000000-0000-0000-0000-000000000002';
select public.bootstrap_tenant('Analysis Tenant Beta');
reset role;

insert into public.tenant_memberships (tenant_id, user_id, role)
select id, '63000000-0000-0000-0000-000000000003', 'VIEWER'
from public.tenants where name = 'Analysis Tenant Alpha';

insert into public.sources (id, tenant_id, source_type) values
  ('61100000-0000-0000-0000-000000000001', (select id from public.tenants where name = 'Analysis Tenant Alpha'), 'UPLOAD'),
  ('62200000-0000-0000-0000-000000000002', (select id from public.tenants where name = 'Analysis Tenant Beta'), 'UPLOAD');
insert into public.creative_assets (
  id, tenant_id, source_id, title, status, content_sha256, duration_ms, width, height, mime_type
) values
  ('61110000-0000-0000-0000-000000000001', (select id from public.tenants where name = 'Analysis Tenant Alpha'), '61100000-0000-0000-0000-000000000001', 'Alpha Analysis', 'INGESTING', repeat('a', 64), 1000, 160, 90, 'video/mp4'),
  ('62220000-0000-0000-0000-000000000002', (select id from public.tenants where name = 'Analysis Tenant Beta'), '62200000-0000-0000-0000-000000000002', 'Beta Analysis', 'TRANSCRIBING', repeat('b', 64), 1000, 160, 90, 'video/mp4'),
  ('61110000-0000-0000-0000-000000000003', (select id from public.tenants where name = 'Analysis Tenant Alpha'), '61100000-0000-0000-0000-000000000001', 'Malformed Analysis', 'TRANSCRIBING', repeat('c', 64), 1000, 160, 90, 'video/mp4');

insert into public.background_jobs (
  id, tenant_id, kind, status, idempotency_key, payload, attempt
) values (
  '61111000-0000-0000-0000-000000000001',
  (select id from public.tenants where name = 'Analysis Tenant Alpha'),
  'MEDIA_PROCESSING', 'RUNNING', 'media-alpha-analysis',
  '{"creative_asset_id":"61110000-0000-0000-0000-000000000001"}', 1
), (
  '61111000-0000-0000-0000-000000000003',
  (select id from public.tenants where name = 'Analysis Tenant Alpha'),
  'CREATIVE_ANALYSIS', 'RUNNING', 'malformed-analysis-job',
  '{"creative_asset_id":"61110000-0000-0000-0000-000000000003"}', 1
);

set local role service_role;
set local request.jwt.claim.role = 'service_role';

select lives_ok(
  $$ select public.finish_media_job(
    '61111000-0000-0000-0000-000000000001',
    '{"duration_ms":1000,"width":160,"height":90}', '[]'
  ) $$,
  'Media completion durably enqueues analysis'
);

select results_eq(
  $$ select count(*) from public.background_jobs where kind = 'CREATIVE_ANALYSIS' and payload ->> 'creative_asset_id' = '61110000-0000-0000-0000-000000000001' $$,
  $$ values (1::bigint) $$,
  'Analysis enqueue is unique per creative'
);

select results_eq(
  $$ select attempt from public.claim_analysis_job((select id from public.background_jobs where kind = 'CREATIVE_ANALYSIS' and payload ->> 'creative_asset_id' = '61110000-0000-0000-0000-000000000001')) $$,
  $$ values (1) $$,
  'Analysis worker atomically claims its durable job'
);

select lives_ok(
  $$ select public.start_generation_run(
    (select tenant_id from public.background_jobs where id = '61111000-0000-0000-0000-000000000001'),
    '61110000-0000-0000-0000-000000000001', 'TRANSCRIPTION',
    'transcription-alpha-fingerprint', 'mock', 'mock-transcription-v1', null,
    '1.0', repeat('d', 64)
  ) $$,
  'Worker starts a transcription lineage run'
);

select results_eq(
  $$ select public.start_generation_run(
    (select tenant_id from public.background_jobs where id = '61111000-0000-0000-0000-000000000001'),
    '61110000-0000-0000-0000-000000000001', 'TRANSCRIPTION',
    'transcription-alpha-fingerprint', 'mock', 'mock-transcription-v1', null,
    '1.0', repeat('d', 64)
  ) = (select id from public.generation_runs where kind = 'TRANSCRIPTION') $$,
  $$ values (true) $$,
  'Generation start is idempotent'
);

select results_eq(
  $$ select count(*) from public.generation_runs where kind = 'TRANSCRIPTION' $$,
  $$ values (1::bigint) $$,
  'Transcription replay creates one run'
);

select lives_ok(
  $$ select public.complete_transcription_run(
    (select id from public.generation_runs where kind = 'TRANSCRIPTION'),
    'en', 'A synthetic transcript.',
    '[{"start_seconds":0,"end_seconds":1,"text":"A synthetic transcript."}]',
    '{"audio_seconds":1,"provider_request_id":"mock-request"}', 0, 12
  ) $$,
  'Validated transcript completion persists atomically'
);

select results_eq(
  $$ select provider, model, schema_version from public.transcripts $$,
  $$ values ('mock'::text, 'mock-transcription-v1'::text, '1.0'::text) $$,
  'Transcript preserves provider, model, and schema lineage'
);

select results_eq(
  $$ select status::text from public.creative_assets where id = '61110000-0000-0000-0000-000000000001' $$,
  $$ values ('ANALYZING'::text) $$,
  'Transcript completion advances the real creative state'
);

select lives_ok(
  $$ select public.start_generation_run(
    (select tenant_id from public.background_jobs where id = '61111000-0000-0000-0000-000000000001'),
    '61110000-0000-0000-0000-000000000001', 'CREATIVE_DNA',
    'creative-dna-alpha-fingerprint', 'mock', 'mock-analysis-v1',
    'creative-dna.v1', '1.0', repeat('e', 64)
  ) $$,
  'Worker starts a Creative DNA lineage run'
);

select lives_ok(
  $$ select public.complete_creative_dna_run(
    (select id from public.background_jobs where kind = 'CREATIVE_ANALYSIS' and payload ->> 'creative_asset_id' = '61110000-0000-0000-0000-000000000001'),
    (select id from public.generation_runs where kind = 'CREATIVE_DNA'),
    '{"schema_version":"1.0"}', 'Synthetic structured summary.',
    '{"input_tokens":100,"output_tokens":200,"provider_request_id":"mock-dna"}',
    0, 25
  ) $$,
  'Schema-validated application output completes Creative DNA'
);

select results_eq(
  $$ select status::text from public.creative_assets where id = '61110000-0000-0000-0000-000000000001' $$,
  $$ values ('READY'::text) $$,
  'Creative DNA completion advances the creative to READY'
);

select results_eq(
  $$ select count(*) from public.deconstructions where creative_asset_id = '61110000-0000-0000-0000-000000000001' $$,
  $$ values (1::bigint) $$,
  'Creative DNA is persisted once'
);

select results_eq(
  $$ select provider, model, prompt_version, schema_version, cost_microusd, latency_ms, status::text from public.generation_runs where kind = 'CREATIVE_DNA' $$,
  $$ values ('mock'::text, 'mock-analysis-v1'::text, 'creative-dna.v1'::text, '1.0'::text, 0::bigint, 25::bigint, 'COMPLETED'::text) $$,
  'Creative DNA stores complete model and execution lineage'
);

select results_eq(
  $$ select status::text from public.background_jobs where kind = 'CREATIVE_ANALYSIS' and payload ->> 'creative_asset_id' = '61110000-0000-0000-0000-000000000001' $$,
  $$ values ('SUCCEEDED'::text) $$,
  'Analysis job completes durably'
);

select lives_ok(
  $$ select public.complete_creative_dna_run(
    (select id from public.background_jobs where kind = 'CREATIVE_ANALYSIS' and payload ->> 'creative_asset_id' = '61110000-0000-0000-0000-000000000001'),
    (select id from public.generation_runs where kind = 'CREATIVE_DNA'),
    '{"schema_version":"1.0"}', 'Synthetic structured summary.', '{}', 0, 25
  ) $$,
  'Creative DNA completion accepts a replay'
);

select results_eq(
  $$ select count(*) from public.deconstructions where creative_asset_id = '61110000-0000-0000-0000-000000000001' $$,
  $$ values (1::bigint) $$,
  'Completion replay does not duplicate Creative DNA'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '61000000-0000-0000-0000-000000000001';
select results_eq(
  $$ select count(*) from public.deconstructions $$,
  $$ values (1::bigint) $$,
  'Tenant owner reads own Creative DNA'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '62000000-0000-0000-0000-000000000002';
select results_eq(
  $$ select count(*) from public.deconstructions $$,
  $$ values (0::bigint) $$,
  'Another tenant cannot read Creative DNA'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '63000000-0000-0000-0000-000000000003';
select results_eq(
  $$ select count(*) from public.deconstructions $$,
  $$ values (1::bigint) $$,
  'Viewer can read own-tenant analysis'
);

select throws_ok(
  $$ insert into public.deconstructions (
    tenant_id, creative_asset_id, generation_run_id, schema_version, payload
  ) select tenant_id, creative_asset_id, generation_run_id, '1.0', '{"schema_version":"1.0"}' from public.deconstructions limit 1 $$,
  '42501', null,
  'Viewer cannot write analysis output'
);

select throws_ok(
  $$ select public.complete_creative_dna_run(
    (select id from public.background_jobs limit 1),
    (select id from public.generation_runs limit 1),
    '{"schema_version":"1.0"}', '', '{}', 0, 0
  ) $$,
  '42501', null,
  'Authenticated browser role cannot complete generation runs'
);

reset role;
select throws_ok(
  $$ insert into public.deconstructions (
    tenant_id, creative_asset_id, generation_run_id, schema_version, payload
  ) values (
    (select id from public.tenants where name = 'Analysis Tenant Alpha'),
    '62220000-0000-0000-0000-000000000002',
    (select id from public.generation_runs where kind = 'CREATIVE_DNA'),
    '1.0', '{"schema_version":"1.0"}'
  ) $$,
  '23503', null,
  'Composite foreign keys reject cross-tenant analysis relationships'
);

set local role service_role;
set local request.jwt.claim.role = 'service_role';
select public.start_generation_run(
  (select tenant_id from public.background_jobs where id = '61111000-0000-0000-0000-000000000003'),
  '61110000-0000-0000-0000-000000000003', 'CREATIVE_DNA',
  'malformed-dna-fingerprint', 'mock', 'mock-analysis-v1',
  'creative-dna.v1', '1.0', repeat('f', 64)
);
select public.fail_analysis_job(
  '61111000-0000-0000-0000-000000000003',
  (select id from public.generation_runs where idempotency_key = 'malformed-dna-fingerprint'),
  'CREATIVE_ANALYSIS_INVALID_OUTPUT', 'Creative DNA did not match schema version 1.0.'
);

select results_eq(
  $$ select
    (select status::text from public.creative_assets where id = '61110000-0000-0000-0000-000000000003'),
    (select count(*) from public.deconstructions where creative_asset_id = '61110000-0000-0000-0000-000000000003') $$,
  $$ values ('FAILED'::text, 0::bigint) $$,
  'Malformed provider output fails without persisting completed Creative DNA'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '61000000-0000-0000-0000-000000000001';
select results_eq(
  $$ select public.retry_creative_processing('61110000-0000-0000-0000-000000000003') = public.retry_creative_processing('61110000-0000-0000-0000-000000000003') $$,
  $$ values (true) $$,
  'Failed analysis retry reuses the same durable job idempotently'
);

select * from finish();
rollback;
