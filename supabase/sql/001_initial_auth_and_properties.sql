-- SIGA - Initial Supabase foundation for authentication and properties.
--
-- Run this migration from the Supabase SQL Editor. It is intentionally limited
-- to profiles, properties and property memberships; the remaining SIGA data is
-- still stored locally at this stage.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke create on schema private from authenticated;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint properties_name_not_blank check (btrim(name) <> ''),
  identification text,
  type text,
  current_stage text,
  signature_date date,
  expected_delivery_date date,
  address text,
  city text,
  state text,
  private_area numeric constraint properties_private_area_nonnegative
    check (private_area is null or private_area >= 0),
  bedrooms integer constraint properties_bedrooms_nonnegative
    check (bedrooms is null or bedrooms >= 0),
  parking_spaces integer constraint properties_parking_spaces_nonnegative
    check (parking_spaces is null or parking_spaces >= 0),
  cover_image_path text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_members (
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner'
    constraint property_members_role_check check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (property_id, user_id)
);

create index if not exists properties_created_by_idx
  on public.properties (created_by);

create index if not exists property_members_user_property_idx
  on public.property_members (user_id, property_id);

-- Centralized updated_at maintenance. This function does not need elevated
-- privileges and cannot be invoked directly by browser roles.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.set_updated_at() from anon;
revoke all on function private.set_updated_at() from authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row execute function private.set_updated_at();

-- Keep the immutable creator relationship intact even when an owner updates
-- other property fields directly through PostgREST.
create or replace function private.preserve_property_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception using
      errcode = '42501',
      message = 'The property creator cannot be changed.';
  end if;

  return new;
end;
$$;

revoke all on function private.preserve_property_creator() from public;
revoke all on function private.preserve_property_creator() from anon;
revoke all on function private.preserve_property_creator() from authenticated;

drop trigger if exists properties_preserve_creator on public.properties;
create trigger properties_preserve_creator
before update of created_by on public.properties
for each row execute function private.preserve_property_creator();

-- A direct insert that satisfies the RLS creator check also receives its owner
-- membership in the same statement transaction. The public RPC below remains
-- the service-layer entry point, while this trigger prevents orphan properties
-- if an authenticated client performs a valid direct insert in the future.
create or replace function private.create_initial_property_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.property_members (property_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (property_id, user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.create_initial_property_owner() from public;
revoke all on function private.create_initial_property_owner() from anon;
revoke all on function private.create_initial_property_owner() from authenticated;

drop trigger if exists properties_create_initial_owner on public.properties;
create trigger properties_create_initial_owner
after insert on public.properties
for each row execute function private.create_initial_property_owner();

-- Create a minimal profile for each Auth user. The empty search_path and fully
-- qualified references prevent object-shadowing inside this SECURITY DEFINER
-- function. Failure to create the profile also rolls back the Auth user insert.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(
      btrim(
        coalesce(
          new.raw_user_meta_data ->> 'display_name',
          new.raw_user_meta_data ->> 'full_name',
          ''
        )
      ),
      ''
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.handle_new_auth_user() from anon;
revoke all on function public.handle_new_auth_user() from authenticated;

drop trigger if exists siga_create_profile_after_auth_user on auth.users;
create trigger siga_create_profile_after_auth_user
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- SECURITY DEFINER helpers avoid recursive property_members RLS evaluation.
-- They expose only booleans, live outside the API schema and always derive the
-- caller from auth.uid(); callers cannot ask about another user's membership.
create or replace function private.is_property_member(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.property_members as membership
      where membership.property_id = p_property_id
        and membership.user_id = (select auth.uid())
    );
$$;

create or replace function private.is_property_owner(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.property_members as membership
      where membership.property_id = p_property_id
        and membership.user_id = (select auth.uid())
        and membership.role = 'owner'
    );
$$;

revoke all on function private.is_property_member(uuid) from public;
revoke all on function private.is_property_member(uuid) from anon;
revoke all on function private.is_property_owner(uuid) from public;
revoke all on function private.is_property_owner(uuid) from anon;
grant execute on function private.is_property_member(uuid) to authenticated;
grant execute on function private.is_property_owner(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_members enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists properties_select_for_members on public.properties;
create policy properties_select_for_members
on public.properties
for select
to authenticated
using (private.is_property_member(id));

-- The service layer uses create_property_with_owner below. The owner trigger
-- also keeps a valid direct insert atomic with its initial membership.
drop policy if exists properties_insert_by_creator on public.properties;
create policy properties_insert_by_creator
on public.properties
for insert
to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists properties_update_by_owner on public.properties;
create policy properties_update_by_owner
on public.properties
for update
to authenticated
using (private.is_property_owner(id))
with check (private.is_property_owner(id));

drop policy if exists property_members_select_for_members on public.property_members;
create policy property_members_select_for_members
on public.property_members
for select
to authenticated
using (private.is_property_member(property_id));

-- Least-privilege browser grants. Membership mutation remains unavailable to
-- browser roles; the owner trigger and transactional RPC perform that write.
revoke all on table public.profiles from public;
revoke all on table public.properties from public;
revoke all on table public.property_members from public;

revoke all on table public.profiles from anon;
revoke all on table public.properties from anon;
revoke all on table public.property_members from anon;

revoke all on table public.profiles from authenticated;
revoke all on table public.properties from authenticated;
revoke all on table public.property_members from authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url) on table public.profiles to authenticated;

grant select on table public.properties to authenticated;
grant insert (
  name,
  identification,
  type,
  current_stage,
  signature_date,
  expected_delivery_date,
  address,
  city,
  state,
  private_area,
  bedrooms,
  parking_spaces,
  cover_image_path,
  created_by
) on table public.properties to authenticated;
grant update (
  name,
  identification,
  type,
  current_stage,
  signature_date,
  expected_delivery_date,
  address,
  city,
  state,
  private_area,
  bedrooms,
  parking_spaces,
  cover_image_path
) on table public.properties to authenticated;

grant select on table public.property_members to authenticated;

-- Creates the property and its owner membership in one database transaction.
-- created_by and user_id always come from the authenticated JWT, never from
-- client-provided UUIDs.
create or replace function public.create_property_with_owner(
  p_name text,
  p_identification text default null,
  p_type text default null,
  p_current_stage text default null,
  p_signature_date date default null,
  p_expected_delivery_date date default null,
  p_address text default null,
  p_city text default null,
  p_state text default null,
  p_private_area numeric default null,
  p_bedrooms integer default null,
  p_parking_spaces integer default null,
  p_cover_image_path text default null
)
returns public.properties
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  created_property public.properties;
begin
  if current_user_id is null then
    raise exception using
      errcode = '28000',
      message = 'Authentication is required to create a property.';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception using
      errcode = '22023',
      message = 'Property name is required.';
  end if;

  insert into public.properties (
    name,
    identification,
    type,
    current_stage,
    signature_date,
    expected_delivery_date,
    address,
    city,
    state,
    private_area,
    bedrooms,
    parking_spaces,
    cover_image_path,
    created_by
  )
  values (
    btrim(p_name),
    p_identification,
    p_type,
    p_current_stage,
    p_signature_date,
    p_expected_delivery_date,
    p_address,
    p_city,
    p_state,
    p_private_area,
    p_bedrooms,
    p_parking_spaces,
    p_cover_image_path,
    current_user_id
  )
  returning * into created_property;

  -- The AFTER INSERT trigger already created this membership. Keeping this
  -- idempotent assertion makes the RPC's invariant explicit and resilient if
  -- trigger management changes independently in a later migration.
  insert into public.property_members (property_id, user_id, role)
  values (created_property.id, current_user_id, 'owner')
  on conflict (property_id, user_id) do nothing;

  return created_property;
end;
$$;

revoke all on function public.create_property_with_owner(
  text,
  text,
  text,
  text,
  date,
  date,
  text,
  text,
  text,
  numeric,
  integer,
  integer,
  text
) from public;

revoke all on function public.create_property_with_owner(
  text,
  text,
  text,
  text,
  date,
  date,
  text,
  text,
  text,
  numeric,
  integer,
  integer,
  text
) from anon;

grant execute on function public.create_property_with_owner(
  text,
  text,
  text,
  text,
  date,
  date,
  text,
  text,
  text,
  numeric,
  integer,
  integer,
  text
) to authenticated;

comment on function public.create_property_with_owner(
  text,
  text,
  text,
  text,
  date,
  date,
  text,
  text,
  text,
  numeric,
  integer,
  integer,
  text
) is 'Creates a SIGA property and its owner membership atomically for auth.uid().';
