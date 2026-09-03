begin;

create extension if not exists pgtap with schema extensions;
select plan(27);

insert into auth.users (id, email)
values
  ('41000000-0000-0000-0000-000000000001', 'brand-owner-a@example.test'),
  ('42000000-0000-0000-0000-000000000002', 'brand-owner-b@example.test'),
  ('43000000-0000-0000-0000-000000000003', 'brand-viewer-a@example.test'),
  ('44000000-0000-0000-0000-000000000004', 'brand-member-a@example.test'),
  ('45000000-0000-0000-0000-000000000005', 'brand-onboarding@example.test');

set local role authenticated;
set local request.jwt.claim.sub = '41000000-0000-0000-0000-000000000001';
select public.bootstrap_tenant('Brand Tenant Alpha');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '42000000-0000-0000-0000-000000000002';
select public.bootstrap_tenant('Brand Tenant Beta');
reset role;

insert into public.tenant_memberships (tenant_id, user_id, role)
select id, '43000000-0000-0000-0000-000000000003', 'VIEWER'
from public.tenants where name = 'Brand Tenant Alpha';

insert into public.tenant_memberships (tenant_id, user_id, role)
select id, '44000000-0000-0000-0000-000000000004', 'MEMBER'
from public.tenants where name = 'Brand Tenant Alpha';

set local role authenticated;
set local request.jwt.claim.sub = '41000000-0000-0000-0000-000000000001';

select lives_ok(
  $$
    insert into public.brands (
      tenant_id, name, category, description, brand_voice
    )
    select id, 'Alpha Brand', 'Wellness', 'A complete alpha brand description.',
      '{"description":"Clear and grounded"}'::jsonb
    from public.tenants where name = 'Brand Tenant Alpha'
  $$,
  'Owner can create a brand in their tenant'
);

select results_eq(
  $$ select brand_brain_completed_at is not null from public.tenants $$,
  $$ values (true) $$,
  'First brand marks Brand Brain onboarding complete'
);

select lives_ok(
  $$
    insert into public.products (
      tenant_id, brand_id, name, description, price_description, offer_details
    )
    select tenant_id, id, 'Alpha Product', 'Flagship product', '$49',
      '{"summary":"Starter offer"}'::jsonb
    from public.brands where name = 'Alpha Brand'
  $$,
  'Owner can create a product'
);

select lives_ok(
  $$
    insert into public.personas (
      tenant_id, brand_id, name, description, pains, desires, objections
    )
    select tenant_id, id, 'Busy Operator', 'Time-conscious marketer',
      '["Too much manual work"]'::jsonb,
      '["Faster decisions"]'::jsonb,
      '["Setup time"]'::jsonb
    from public.brands where name = 'Alpha Brand'
  $$,
  'Owner can create a persona'
);

select lives_ok(
  $$
    insert into public.brand_proof_points (tenant_id, brand_id, label, detail)
    select tenant_id, id, 'Customer evidence', 'Verified customer survey results'
    from public.brands where name = 'Alpha Brand'
  $$,
  'Owner can create a proof point'
);

select lives_ok(
  $$
    insert into public.brand_restrictions (
      tenant_id, brand_id, restriction_type, value
    )
    select tenant_id, id, 'PROHIBITED_CLAIM', 'Never promise guaranteed results'
    from public.brands where name = 'Alpha Brand'
  $$,
  'Owner can create a restriction'
);

select results_eq(
  $$
    select
      (select count(*) from public.brands),
      (select count(*) from public.products),
      (select count(*) from public.personas),
      (select count(*) from public.brand_proof_points),
      (select count(*) from public.brand_restrictions)
  $$,
  $$ values (1::bigint, 1::bigint, 1::bigint, 1::bigint, 1::bigint) $$,
  'Owner reads all Brand Brain records in their tenant'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '42000000-0000-0000-0000-000000000002';

insert into public.brands (tenant_id, name, category, description)
select id, 'Beta Brand', 'Apparel', 'A complete beta brand description.'
from public.tenants where name = 'Brand Tenant Beta';

insert into public.products (tenant_id, brand_id, name)
select tenant_id, id, 'Beta Product'
from public.brands where name = 'Beta Brand';

select results_eq(
  $$ select name from public.brands order by name $$,
  $$ values ('Beta Brand'::text) $$,
  'Tenant B cannot read Tenant A brands'
);

select results_eq(
  $$ select name from public.products order by name $$,
  $$ values ('Beta Product'::text) $$,
  'Tenant B cannot read Tenant A products'
);

select results_eq(
  $$ update public.brands set name = 'Cross-tenant rewrite' returning name $$,
  $$ values ('Cross-tenant rewrite'::text) $$,
  'Tenant B updates only its visible brand'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '41000000-0000-0000-0000-000000000001';

select results_eq(
  $$
    update public.brands set name = 'Compromised Beta'
    where name = 'Cross-tenant rewrite' returning name
  $$,
  $$ select null::text where false $$,
  'Tenant A cannot update Tenant B brand'
);

select results_eq(
  $$
    delete from public.products where name = 'Beta Product' returning name
  $$,
  $$ select null::text where false $$,
  'Tenant A cannot delete Tenant B product'
);

reset role;
select throws_ok(
  $$
    insert into public.products (tenant_id, brand_id, name)
    select tenant.id, beta.id, 'Mismatched Product'
    from public.tenants as tenant
    cross join public.brands as beta
    where tenant.name = 'Brand Tenant Alpha'
      and beta.name = 'Cross-tenant rewrite'
  $$,
  '23503',
  null,
  'Composite foreign key rejects a cross-tenant parent relationship'
);
set local role authenticated;
set local request.jwt.claim.sub = '41000000-0000-0000-0000-000000000001';

select lives_ok(
  $$ update public.products set name = 'Alpha Product Updated' $$,
  'Owner can update an own-tenant child record'
);

select results_eq(
  $$ delete from public.brand_proof_points returning label $$,
  $$ values ('Customer evidence'::text) $$,
  'Owner can delete an own-tenant child record'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '43000000-0000-0000-0000-000000000003';

select results_eq(
  $$ select name from public.brands $$,
  $$ values ('Alpha Brand'::text) $$,
  'Viewer can read own-tenant brands'
);

select results_eq(
  $$ update public.brands set name = 'Viewer rewrite' returning name $$,
  $$ select null::text where false $$,
  'Viewer cannot update a brand'
);

select results_eq(
  $$ delete from public.products returning name $$,
  $$ select null::text where false $$,
  'Viewer cannot delete a product'
);

select throws_ok(
  $$
    insert into public.brand_restrictions (
      tenant_id, brand_id, restriction_type, value
    )
    select tenant_id, id, 'OTHER', 'Viewer-created restriction'
    from public.brands limit 1
  $$,
  '42501',
  null,
  'Viewer cannot create a restriction'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '44000000-0000-0000-0000-000000000004';

select lives_ok(
  $$
    insert into public.brand_proof_points (tenant_id, brand_id, label, detail)
    select tenant_id, id, 'Member evidence', 'Members may maintain Brand Brain data'
    from public.brands limit 1
  $$,
  'Member can create Brand Brain data'
);

select results_eq(
  $$
    update public.personas set awareness_stage = 'Problem aware'
    returning awareness_stage
  $$,
  $$ values ('Problem aware'::text) $$,
  'Member can update Brand Brain data'
);

select results_eq(
  $$ delete from public.brand_restrictions returning restriction_type $$,
  $$ values ('PROHIBITED_CLAIM'::text) $$,
  'Member can delete Brand Brain data'
);

select throws_ok(
  $$
    insert into public.brands (tenant_id, name)
    select id, 'x' from public.tenants limit 1
  $$,
  '23514',
  null,
  'Database constraints reject invalid brand names'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '45000000-0000-0000-0000-000000000005';
select public.bootstrap_tenant('Onboarding Tenant');

select lives_ok(
  $$
    select public.bootstrap_brand_brain(
      '{
        "brand_name":"Onboarding Brand",
        "category":"Home goods",
        "description":"A complete onboarding brand description.",
        "voice":"Warm and practical",
        "product_name":"Onboarding Product",
        "persona_name":"Home Organizer",
        "persona_pains":["Clutter"],
        "persona_desires":["Calm spaces"],
        "persona_objections":["Time"],
        "proof_label":"Material proof",
        "proof_detail":"Documented material specification",
        "restriction_type":"PROHIBITED_CLAIM",
        "restriction_value":"Do not claim instant results"
      }'::jsonb
    )
  $$,
  'Onboarding RPC atomically creates a complete Brand Brain'
);

select results_eq(
  $$
    select
      (select count(*) from public.brands),
      (select count(*) from public.products),
      (select count(*) from public.personas),
      (select count(*) from public.brand_proof_points),
      (select count(*) from public.brand_restrictions)
  $$,
  $$ values (1::bigint, 1::bigint, 1::bigint, 1::bigint, 1::bigint) $$,
  'Onboarding persists each supplied entity once'
);

select lives_ok(
  $$
    select public.bootstrap_brand_brain(
      '{
        "brand_name":"Duplicate Brand",
        "category":"Other",
        "description":"This replay must not create another brand."
      }'::jsonb
    )
  $$,
  'Onboarding RPC accepts a replay'
);

select results_eq(
  $$ select count(*) from public.brands $$,
  $$ values (1::bigint) $$,
  'Onboarding replay is idempotent'
);

select * from finish();
rollback;
