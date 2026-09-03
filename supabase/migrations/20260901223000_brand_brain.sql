alter table public.tenants
add column brand_brain_completed_at timestamptz;

create or replace function private.can_write_tenant(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_membership_role(target_tenant_id)
    in (
      'OWNER'::public.membership_role,
      'ADMIN'::public.membership_role,
      'MEMBER'::public.membership_role
    );
$$;

revoke all on function private.can_write_tenant(uuid) from public;
grant execute on function private.can_write_tenant(uuid)
  to authenticated, service_role;

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  website_url text check (
    website_url is null or char_length(website_url) between 8 and 2048
  ),
  category text check (
    category is null or char_length(btrim(category)) between 2 and 120
  ),
  description text check (
    description is null or char_length(btrim(description)) between 10 and 2000
  ),
  brand_voice jsonb not null default '{}'::jsonb check (
    jsonb_typeof(brand_voice) = 'object'
  ),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create index brands_tenant_idx on public.brands(tenant_id, created_at);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brand_id uuid not null,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  description text check (
    description is null or char_length(btrim(description)) between 2 and 2000
  ),
  price_description text check (
    price_description is null or char_length(btrim(price_description)) <= 240
  ),
  offer_details jsonb not null default '{}'::jsonb check (
    jsonb_typeof(offer_details) = 'object'
  ),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, brand_id)
    references public.brands(tenant_id, id) on delete cascade
);

create index products_brand_idx on public.products(tenant_id, brand_id, created_at);

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brand_id uuid not null,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  description text check (
    description is null or char_length(btrim(description)) between 2 and 2000
  ),
  pains jsonb not null default '[]'::jsonb check (jsonb_typeof(pains) = 'array'),
  desires jsonb not null default '[]'::jsonb check (jsonb_typeof(desires) = 'array'),
  objections jsonb not null default '[]'::jsonb check (
    jsonb_typeof(objections) = 'array'
  ),
  awareness_stage text check (
    awareness_stage is null or char_length(btrim(awareness_stage)) <= 120
  ),
  attributes jsonb not null default '{}'::jsonb check (
    jsonb_typeof(attributes) = 'object'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, brand_id)
    references public.brands(tenant_id, id) on delete cascade
);

create index personas_brand_idx on public.personas(tenant_id, brand_id, created_at);

create table public.brand_proof_points (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brand_id uuid not null,
  label text not null check (char_length(btrim(label)) between 2 and 120),
  detail text not null check (char_length(btrim(detail)) between 2 and 1000),
  source_note text check (
    source_note is null or char_length(btrim(source_note)) <= 500
  ),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, brand_id)
    references public.brands(tenant_id, id) on delete cascade
);

create index brand_proof_points_brand_idx
  on public.brand_proof_points(tenant_id, brand_id, created_at);

create table public.brand_restrictions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  brand_id uuid not null,
  restriction_type text not null check (
    restriction_type in (
      'PROHIBITED_CLAIM',
      'REQUIRED_DISCLAIMER',
      'TONE',
      'COMPETITOR',
      'OTHER'
    )
  ),
  value text not null check (char_length(btrim(value)) between 2 and 1000),
  notes text check (notes is null or char_length(btrim(notes)) <= 500),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, brand_id)
    references public.brands(tenant_id, id) on delete cascade
);

create index brand_restrictions_brand_idx
  on public.brand_restrictions(tenant_id, brand_id, created_at);

create trigger brands_set_updated_at
before update on public.brands
for each row execute function private.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function private.set_updated_at();

create trigger personas_set_updated_at
before update on public.personas
for each row execute function private.set_updated_at();

create or replace function private.mark_brand_brain_complete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tenants
  set brand_brain_completed_at = coalesce(brand_brain_completed_at, now())
  where id = new.tenant_id;

  return new;
end;
$$;

create trigger brands_mark_brand_brain_complete
after insert on public.brands
for each row execute function private.mark_brand_brain_complete();

create or replace function public.bootstrap_brand_brain(input jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_tenant_id uuid;
  existing_brand_id uuid;
  new_brand_id uuid;
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
    raise exception 'Brand Brain write access required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_tenant_id::text, 1));

  select brand.id into existing_brand_id
  from public.brands as brand
  where brand.tenant_id = target_tenant_id
  order by brand.created_at, brand.id
  limit 1;

  if existing_brand_id is not null then
    return existing_brand_id;
  end if;

  insert into public.brands (
    tenant_id,
    name,
    website_url,
    category,
    description,
    brand_voice
  )
  values (
    target_tenant_id,
    input ->> 'brand_name',
    nullif(input ->> 'website_url', ''),
    input ->> 'category',
    input ->> 'description',
    jsonb_build_object('description', coalesce(input ->> 'voice', ''))
  )
  returning id into new_brand_id;

  if nullif(input ->> 'product_name', '') is not null then
    insert into public.products (
      tenant_id,
      brand_id,
      name,
      description,
      price_description,
      offer_details
    )
    values (
      target_tenant_id,
      new_brand_id,
      input ->> 'product_name',
      nullif(input ->> 'product_description', ''),
      nullif(input ->> 'price_description', ''),
      jsonb_build_object('summary', coalesce(input ->> 'offer', ''))
    );
  end if;

  if nullif(input ->> 'persona_name', '') is not null then
    insert into public.personas (
      tenant_id,
      brand_id,
      name,
      description,
      pains,
      desires,
      objections,
      awareness_stage
    )
    values (
      target_tenant_id,
      new_brand_id,
      input ->> 'persona_name',
      nullif(input ->> 'persona_description', ''),
      coalesce(input -> 'persona_pains', '[]'::jsonb),
      coalesce(input -> 'persona_desires', '[]'::jsonb),
      coalesce(input -> 'persona_objections', '[]'::jsonb),
      nullif(input ->> 'awareness_stage', '')
    );
  end if;

  if nullif(input ->> 'proof_label', '') is not null then
    insert into public.brand_proof_points (
      tenant_id,
      brand_id,
      label,
      detail,
      source_note
    )
    values (
      target_tenant_id,
      new_brand_id,
      input ->> 'proof_label',
      input ->> 'proof_detail',
      nullif(input ->> 'proof_source', '')
    );
  end if;

  if nullif(input ->> 'restriction_value', '') is not null then
    insert into public.brand_restrictions (
      tenant_id,
      brand_id,
      restriction_type,
      value,
      notes
    )
    values (
      target_tenant_id,
      new_brand_id,
      input ->> 'restriction_type',
      input ->> 'restriction_value',
      nullif(input ->> 'restriction_notes', '')
    );
  end if;

  return new_brand_id;
end;
$$;

revoke all on function public.bootstrap_brand_brain(jsonb) from public;
grant execute on function public.bootstrap_brand_brain(jsonb) to authenticated;

alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.personas enable row level security;
alter table public.brand_proof_points enable row level security;
alter table public.brand_restrictions enable row level security;

create policy brands_select_member
on public.brands for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy brands_insert_writer
on public.brands for insert to authenticated
with check ((select private.can_write_tenant(tenant_id)));

create policy brands_update_writer
on public.brands for update to authenticated
using ((select private.can_write_tenant(tenant_id)))
with check ((select private.can_write_tenant(tenant_id)));

create policy brands_delete_writer
on public.brands for delete to authenticated
using ((select private.can_write_tenant(tenant_id)));

create policy products_select_member
on public.products for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy products_insert_writer
on public.products for insert to authenticated
with check ((select private.can_write_tenant(tenant_id)));

create policy products_update_writer
on public.products for update to authenticated
using ((select private.can_write_tenant(tenant_id)))
with check ((select private.can_write_tenant(tenant_id)));

create policy products_delete_writer
on public.products for delete to authenticated
using ((select private.can_write_tenant(tenant_id)));

create policy personas_select_member
on public.personas for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy personas_insert_writer
on public.personas for insert to authenticated
with check ((select private.can_write_tenant(tenant_id)));

create policy personas_update_writer
on public.personas for update to authenticated
using ((select private.can_write_tenant(tenant_id)))
with check ((select private.can_write_tenant(tenant_id)));

create policy personas_delete_writer
on public.personas for delete to authenticated
using ((select private.can_write_tenant(tenant_id)));

create policy brand_proof_points_select_member
on public.brand_proof_points for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy brand_proof_points_insert_writer
on public.brand_proof_points for insert to authenticated
with check ((select private.can_write_tenant(tenant_id)));

create policy brand_proof_points_update_writer
on public.brand_proof_points for update to authenticated
using ((select private.can_write_tenant(tenant_id)))
with check ((select private.can_write_tenant(tenant_id)));

create policy brand_proof_points_delete_writer
on public.brand_proof_points for delete to authenticated
using ((select private.can_write_tenant(tenant_id)));

create policy brand_restrictions_select_member
on public.brand_restrictions for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy brand_restrictions_insert_writer
on public.brand_restrictions for insert to authenticated
with check ((select private.can_write_tenant(tenant_id)));

create policy brand_restrictions_update_writer
on public.brand_restrictions for update to authenticated
using ((select private.can_write_tenant(tenant_id)))
with check ((select private.can_write_tenant(tenant_id)));

create policy brand_restrictions_delete_writer
on public.brand_restrictions for delete to authenticated
using ((select private.can_write_tenant(tenant_id)));

revoke all on public.brands from anon, authenticated;
revoke all on public.products from anon, authenticated;
revoke all on public.personas from anon, authenticated;
revoke all on public.brand_proof_points from anon, authenticated;
revoke all on public.brand_restrictions from anon, authenticated;

grant select, insert, update, delete on public.brands to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.personas to authenticated;
grant select, insert, update, delete on public.brand_proof_points to authenticated;
grant select, insert, update, delete on public.brand_restrictions to authenticated;
