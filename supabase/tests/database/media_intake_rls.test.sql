begin;

create extension if not exists pgtap with schema extensions;
select plan(31);

insert into auth.users (id, email)
values
  ('51000000-0000-0000-0000-000000000001', 'media-owner-a@example.test'),
  ('52000000-0000-0000-0000-000000000002', 'media-owner-b@example.test'),
  ('53000000-0000-0000-0000-000000000003', 'media-viewer-a@example.test');

set local role authenticated;
set local request.jwt.claim.sub = '51000000-0000-0000-0000-000000000001';
select public.bootstrap_tenant('Media Tenant Alpha');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '52000000-0000-0000-0000-000000000002';
select public.bootstrap_tenant('Media Tenant Beta');
reset role;

insert into public.tenant_memberships (tenant_id, user_id, role)
select id, '53000000-0000-0000-0000-000000000003', 'VIEWER'
from public.tenants where name = 'Media Tenant Alpha';

set local role authenticated;
set local request.jwt.claim.sub = '51000000-0000-0000-0000-000000000001';

select lives_ok(
  $$
    select * from public.initialize_creative_upload(
      'Alpha Creative',
      'alpha.mp4',
      'video/mp4',
      2048,
      'alpha-init-key'
    )
  $$,
  'Writer can initialize an upload'
);

select results_eq(
  $$
    select count(*) from public.initialize_creative_upload(
      'Ignored Replay',
      'replay.mp4',
      'video/mp4',
      4096,
      'alpha-init-key'
    )
  $$,
  $$ values (1::bigint) $$,
  'Upload initialization accepts an idempotent replay'
);

select results_eq(
  $$ select count(*) from public.creative_assets $$,
  $$ values (1::bigint) $$,
  'Initialization replay creates one creative asset'
);

select results_eq(
  $$ select title from public.creative_assets $$,
  $$ values ('Alpha Creative'::text) $$,
  'Initialization replay preserves the original asset'
);

select results_eq(
  $$ select source_type::text from public.sources $$,
  $$ values ('UPLOAD'::text) $$,
  'Upload source provenance is persisted'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '52000000-0000-0000-0000-000000000002';

select * from public.initialize_creative_upload(
  'Beta Creative',
  'beta.webm',
  'video/webm',
  2048,
  'beta-init-key'
);

select results_eq(
  $$ select title from public.creative_assets $$,
  $$ values ('Beta Creative'::text) $$,
  'Tenant B cannot read Tenant A creative assets'
);

select results_eq(
  $$ select original_filename from public.media_uploads $$,
  $$ values ('beta.webm'::text) $$,
  'Tenant B cannot read Tenant A upload metadata'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '51000000-0000-0000-0000-000000000001';

select results_eq(
  $$ delete from public.creative_assets where title = 'Beta Creative' returning title $$,
  $$ select null::text where false $$,
  'Tenant A cannot delete Tenant B creative asset'
);

select throws_ok(
  $$
    insert into public.creative_assets (tenant_id, title)
    select id, 'Direct insert' from public.tenants limit 1
  $$,
  '42501',
  null,
  'Authenticated users cannot bypass upload initialization'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '53000000-0000-0000-0000-000000000003';

select results_eq(
  $$ select title from public.creative_assets $$,
  $$ values ('Alpha Creative'::text) $$,
  'Viewer can read own-tenant creative status'
);

select throws_ok(
  $$
    select * from public.initialize_creative_upload(
      'Viewer Creative',
      'viewer.mp4',
      'video/mp4',
      1024,
      'viewer-init-key'
    )
  $$,
  '42501',
  null,
  'Viewer cannot initialize an upload'
);

reset role;
set local role service_role;
set local request.jwt.claim.role = 'service_role';

select lives_ok(
  $$
    select public.complete_creative_upload(
      (select id from public.creative_assets where title = 'Alpha Creative'),
      repeat('a', 64),
      'video/mp4',
      2048,
      30
    )
  $$,
  'Service role can validate and enqueue an upload'
);

select results_eq(
  $$
    select public.complete_creative_upload(
      (select id from public.creative_assets where title = 'Alpha Creative'),
      repeat('a', 64),
      'video/mp4',
      2048,
      30
    ) = (
      select id from public.background_jobs
      where payload ->> 'creative_asset_id' = (
        select id::text from public.creative_assets where title = 'Alpha Creative'
      )
    )
  $$,
  $$ values (true) $$,
  'Upload completion returns the existing job on replay'
);

select results_eq(
  $$
    select
      (select count(*) from public.background_jobs where tenant_id = asset.tenant_id),
      (select count(*) from public.media_artifacts where tenant_id = asset.tenant_id)
    from public.creative_assets as asset where asset.title = 'Alpha Creative'
  $$,
  $$ values (1::bigint, 1::bigint) $$,
  'Completion replay creates one job and one original artifact'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '51000000-0000-0000-0000-000000000001';

select results_eq(
  $$ select status::text from public.creative_assets $$,
  $$ values ('INGESTING'::text) $$,
  'Validated creative exposes its real processing state'
);

select results_eq(
  $$ select status::text from public.background_jobs $$,
  $$ values ('QUEUED'::text) $$,
  'Tenant member can inspect the durable queued job'
);

select throws_ok(
  $$
    select public.complete_creative_upload(
      (select id from public.creative_assets limit 1),
      repeat('b', 64),
      'video/mp4',
      2048,
      30
    )
  $$,
  '42501',
  null,
  'Authenticated browser role cannot complete a validated upload'
);

reset role;
set local role service_role;
set local request.jwt.claim.role = 'service_role';

select results_eq(
  $$
    select attempt from public.claim_media_job(
      (select id from public.background_jobs
       where payload ->> 'creative_asset_id' = (
         select id::text from public.creative_assets where title = 'Alpha Creative'
       ))
    )
  $$,
  $$ values (1) $$,
  'Service worker atomically claims a queued media job'
);

select lives_ok(
  $$
    select public.finish_media_job(
      (select id from public.background_jobs
       where payload ->> 'creative_asset_id' = (
         select id::text from public.creative_assets where title = 'Alpha Creative'
       )),
      '{"duration_ms":1200,"width":1080,"height":1920}'::jsonb,
      '[
        {
          "kind":"NORMALIZED_VIDEO",
          "storage_key":"alpha/normalized.mp4",
          "mime_type":"video/mp4",
          "byte_size":1500,
          "metadata":{}
        },
        {
          "kind":"FRAME",
          "storage_key":"alpha/frame-001.jpg",
          "mime_type":"image/jpeg",
          "byte_size":200,
          "metadata":{"index":1}
        }
      ]'::jsonb
    )
  $$,
  'Service worker persists deterministic metadata and artifacts'
);

select results_eq(
  $$
    select status::text, duration_ms, width, height
    from public.creative_assets where title = 'Alpha Creative'
  $$,
  $$ values ('TRANSCRIBING'::text, 1200::bigint, 1080, 1920) $$,
  'Processed creative advances to the transcription handoff state'
);

select results_eq(
  $$
    select status::text, attempt from public.background_jobs
    where payload ->> 'creative_asset_id' = (
      select id::text from public.creative_assets where title = 'Alpha Creative'
    )
      and kind = 'MEDIA_PROCESSING'
  $$,
  $$ values ('SUCCEEDED'::text, 1) $$,
  'Successful job retains its attempt count'
);

select lives_ok(
  $$
    select public.finish_media_job(
      (select id from public.background_jobs
       where payload ->> 'creative_asset_id' = (
         select id::text from public.creative_assets where title = 'Alpha Creative'
       ) and kind = 'MEDIA_PROCESSING'),
      '{"duration_ms":1200,"width":1080,"height":1920}'::jsonb,
      '[]'::jsonb
    )
  $$,
  'Job completion accepts an idempotent replay'
);

select results_eq(
  $$
    select count(*) from public.media_artifacts
    where creative_asset_id = (
      select id from public.creative_assets where title = 'Alpha Creative'
    )
  $$,
  $$ values (3::bigint) $$,
  'Job completion replay does not duplicate artifacts'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '51000000-0000-0000-0000-000000000001';

select throws_ok(
  $$
    select public.retry_creative_processing(
      (select id from public.creative_assets where title = 'Alpha Creative')
    )
  $$,
  '55000',
  null,
  'Successful creative cannot be retried'
);

select * from public.initialize_creative_upload(
  'Retry Creative',
  'retry.mp4',
  'video/mp4',
  2048,
  'retry-init-key'
);

reset role;
set local role service_role;
set local request.jwt.claim.role = 'service_role';

select public.complete_creative_upload(
  (select id from public.creative_assets where title = 'Retry Creative'),
  repeat('c', 64),
  'video/mp4',
  2048,
  30
);

select * from public.claim_media_job(
  (select id from public.background_jobs
   where payload ->> 'creative_asset_id' = (
     select id::text from public.creative_assets where title = 'Retry Creative'
   ))
);

select public.fail_media_job(
  (select id from public.background_jobs
   where payload ->> 'creative_asset_id' = (
     select id::text from public.creative_assets where title = 'Retry Creative'
   )),
  'MEDIA_PROCESSING_FAILED',
  'Synthetic transient failure'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '51000000-0000-0000-0000-000000000001';

select results_eq(
  $$
    select public.retry_creative_processing(
      (select id from public.creative_assets where title = 'Retry Creative')
    ) = public.retry_creative_processing(
      (select id from public.creative_assets where title = 'Retry Creative')
    )
  $$,
  $$ values (true) $$,
  'Retry is idempotent while the same job is queued'
);

select results_eq(
  $$
    select
      (select count(*) from public.creative_assets),
      (select count(*) from public.background_jobs where kind = 'MEDIA_PROCESSING'),
      (select count(*) from public.media_artifacts)
  $$,
  $$ values (2::bigint, 2::bigint, 4::bigint) $$,
  'Retry creates no duplicate creative, job, or original artifact'
);

select results_eq(
  $$
    select status::text from public.background_jobs
    where payload ->> 'creative_asset_id' = (
      select id::text from public.creative_assets where title = 'Retry Creative'
    )
  $$,
  $$ values ('QUEUED'::text) $$,
  'Retry requeues the durable failed job'
);

reset role;
select throws_ok(
  $$
    insert into public.media_artifacts (
      tenant_id, creative_asset_id, kind, storage_key
    )
    select alpha.id, beta_asset.id, 'FRAME', 'cross-tenant/frame.jpg'
    from public.tenants as alpha
    cross join public.creative_assets as beta_asset
    where alpha.name = 'Media Tenant Alpha'
      and beta_asset.title = 'Beta Creative'
  $$,
  '23503',
  null,
  'Composite foreign key rejects cross-tenant media artifacts'
);

set local role service_role;
set local request.jwt.claim.role = 'service_role';

select lives_ok(
  $$
    select public.reject_creative_upload(
      (select id from public.creative_assets where title = 'Beta Creative'),
      'CREATIVE_INVALID_MEDIA',
      'The uploaded bytes are not supported media.'
    )
  $$,
  'Service role can reject invalid media before processing'
);

select results_eq(
  $$
    select status::text, error_code
    from public.creative_assets where title = 'Beta Creative'
  $$,
  $$ values ('FAILED'::text, 'CREATIVE_INVALID_MEDIA'::text) $$,
  'Rejected upload exposes a stable failure state and code'
);

select results_eq(
  $$
    select count(*) from public.background_jobs
    where payload ->> 'creative_asset_id' = (
      select id::text from public.creative_assets where title = 'Beta Creative'
    )
  $$,
  $$ values (0::bigint) $$,
  'Rejected bytes never enqueue expensive processing'
);

select * from finish();
rollback;
