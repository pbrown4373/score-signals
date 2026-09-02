begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'owner-a@example.test',
    '{"display_name":"Owner A"}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'owner-b@example.test',
    '{"display_name":"Owner B"}'::jsonb
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'viewer-a@example.test',
    '{"display_name":"Viewer A"}'::jsonb
  );

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select public.bootstrap_tenant('Tenant Alpha');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-0000-0000-000000000002';
select public.bootstrap_tenant('Tenant Beta');
reset role;

insert into public.tenant_memberships (tenant_id, user_id, role)
select
  tenant.id,
  '30000000-0000-0000-0000-000000000003'::uuid,
  'VIEWER'::public.membership_role
from public.tenants as tenant
where tenant.name = 'Tenant Alpha';

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';

select results_eq(
  $$ select name from public.tenants order by name $$,
  $$ values ('Tenant Alpha'::text) $$,
  'Tenant A owner can read only Tenant A'
);

select results_eq(
  $$ select display_name from public.user_profiles order by display_name $$,
  $$ values ('Owner A'::text) $$,
  'Tenant A owner can read only their own profile'
);

select results_eq(
  $$ select count(*) from public.tenant_memberships $$,
  $$ values (2::bigint) $$,
  'Tenant A members are visible without exposing Tenant B'
);

select results_eq(
  $$
    update public.tenants
    set name = 'Compromised'
    where name = 'Tenant Beta'
    returning name
  $$,
  $$ select null::text where false $$,
  'Tenant A owner cannot update Tenant B'
);

select results_eq(
  $$
    delete from public.tenants
    where name = 'Tenant Beta'
    returning name
  $$,
  $$ select null::text where false $$,
  'Tenant A owner cannot delete Tenant B'
);

select results_eq(
  $$
    insert into public.tenant_memberships (tenant_id, user_id, role)
    select id, '30000000-0000-0000-0000-000000000003'::uuid, 'MEMBER'
    from public.tenants
    where name = 'Tenant Beta'
    returning user_id
  $$,
  $$ select null::uuid where false $$,
  'Tenant A owner cannot write a Tenant B membership'
);

select results_eq(
  $$ update public.tenants set name = 'Tenant Alpha Updated' returning name $$,
  $$ values ('Tenant Alpha Updated'::text) $$,
  'Owner can update their own tenant'
);

select results_eq(
  $$ select public.bootstrap_tenant('Duplicate Tenant') = tenant_id
     from public.tenant_memberships
     where user_id = auth.uid() and role = 'OWNER'
  $$,
  $$ values (true) $$,
  'Tenant bootstrap is idempotent for the current user'
);

select results_eq(
  $$ select count(*) from public.tenants $$,
  $$ values (1::bigint) $$,
  'Idempotent bootstrap does not create another visible tenant'
);

select results_eq(
  $$
    delete from public.tenant_memberships
    where user_id = auth.uid() and role = 'OWNER'
    returning user_id
  $$,
  $$ select null::uuid where false $$,
  'An owner cannot remove their own owner membership'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-0000-0000-000000000003';

select results_eq(
  $$ select name from public.tenants $$,
  $$ values ('Tenant Alpha Updated'::text) $$,
  'Viewer can read their tenant'
);

select results_eq(
  $$ update public.tenants set name = 'Viewer Rewrite' returning name $$,
  $$ select null::text where false $$,
  'Viewer cannot update their tenant'
);

select throws_ok(
  $$
    insert into public.tenant_memberships (tenant_id, user_id, role)
    select tenant_id, '20000000-0000-0000-0000-000000000002'::uuid, 'MEMBER'
    from public.tenant_memberships
    limit 1
  $$,
  '42501',
  null,
  'Viewer cannot add a tenant member'
);

select * from finish();
rollback;
