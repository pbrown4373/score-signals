create type public.membership_role as enum ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

create schema if not exists private;
revoke all on schema private from public;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  slug text unique check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (
    display_name is null or char_length(btrim(display_name)) between 1 and 100
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index tenant_memberships_user_idx
  on public.tenant_memberships(user_id, created_at);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function private.set_updated_at();

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function private.current_membership_role(target_tenant_id uuid)
returns public.membership_role
language sql
stable
security definer
set search_path = ''
as $$
  select membership.role
  from public.tenant_memberships as membership
  where membership.tenant_id = target_tenant_id
    and membership.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_membership_role(target_tenant_id) is not null;
$$;

create or replace function private.can_manage_tenant(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_membership_role(target_tenant_id)
    in ('OWNER'::public.membership_role, 'ADMIN'::public.membership_role);
$$;

create or replace function private.can_manage_membership(
  target_tenant_id uuid,
  target_role public.membership_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case private.current_membership_role(target_tenant_id)
    when 'OWNER'::public.membership_role then true
    when 'ADMIN'::public.membership_role then
      target_role in ('MEMBER'::public.membership_role, 'VIEWER'::public.membership_role)
    else false
  end;
$$;

revoke all on function private.current_membership_role(uuid) from public;
revoke all on function private.is_tenant_member(uuid) from public;
revoke all on function private.can_manage_tenant(uuid) from public;
revoke all on function private.can_manage_membership(uuid, public.membership_role) from public;

grant usage on schema private to authenticated, service_role;
grant execute on function private.current_membership_role(uuid) to authenticated, service_role;
grant execute on function private.is_tenant_member(uuid) to authenticated, service_role;
grant execute on function private.can_manage_tenant(uuid) to authenticated, service_role;
grant execute on function private.can_manage_membership(uuid, public.membership_role)
  to authenticated, service_role;

create or replace function public.bootstrap_tenant(requested_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_tenant_id uuid;
  new_tenant_id uuid;
  normalized_name text := btrim(requested_name);
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if char_length(normalized_name) not between 2 and 80 then
    raise exception 'Tenant name must contain between 2 and 80 characters'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select membership.tenant_id
    into existing_tenant_id
  from public.tenant_memberships as membership
  where membership.user_id = current_user_id
  order by membership.created_at, membership.tenant_id
  limit 1;

  if existing_tenant_id is not null then
    return existing_tenant_id;
  end if;

  insert into public.user_profiles (id)
  values (current_user_id)
  on conflict (id) do nothing;

  insert into public.tenants (name)
  values (normalized_name)
  returning id into new_tenant_id;

  insert into public.tenant_memberships (tenant_id, user_id, role)
  values (new_tenant_id, current_user_id, 'OWNER');

  return new_tenant_id;
end;
$$;

revoke all on function public.bootstrap_tenant(text) from public;
grant execute on function public.bootstrap_tenant(text) to authenticated;

alter table public.tenants enable row level security;
alter table public.user_profiles enable row level security;
alter table public.tenant_memberships enable row level security;

create policy tenants_select_member
on public.tenants
for select
to authenticated
using ((select private.is_tenant_member(id)));

create policy tenants_update_manager
on public.tenants
for update
to authenticated
using ((select private.can_manage_tenant(id)))
with check ((select private.can_manage_tenant(id)));

create policy tenants_delete_owner
on public.tenants
for delete
to authenticated
using (
  (select private.current_membership_role(id)) = 'OWNER'::public.membership_role
);

create policy user_profiles_select_self
on public.user_profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy user_profiles_update_self
on public.user_profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy tenant_memberships_select_member
on public.tenant_memberships
for select
to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy tenant_memberships_insert_manager
on public.tenant_memberships
for insert
to authenticated
with check ((select private.can_manage_membership(tenant_id, role)));

create policy tenant_memberships_update_manager
on public.tenant_memberships
for update
to authenticated
using (
  (select private.can_manage_membership(tenant_id, role))
  and not (
    role = 'OWNER'::public.membership_role
    and user_id = (select auth.uid())
  )
)
with check ((select private.can_manage_membership(tenant_id, role)));

create policy tenant_memberships_delete_manager
on public.tenant_memberships
for delete
to authenticated
using (
  (select private.can_manage_membership(tenant_id, role))
  and not (
    role = 'OWNER'::public.membership_role
    and user_id = (select auth.uid())
  )
);

revoke all on public.tenants from anon, authenticated;
revoke all on public.user_profiles from anon, authenticated;
revoke all on public.tenant_memberships from anon, authenticated;

grant select, update, delete on public.tenants to authenticated;
grant select, update on public.user_profiles to authenticated;
grant select, insert, update, delete on public.tenant_memberships to authenticated;
