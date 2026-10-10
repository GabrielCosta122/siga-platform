-- Apply once after 001; preserves all existing records.
begin;
alter table public.properties add column owner_id uuid;
update public.properties set owner_id = created_by;
alter table public.properties
 alter column owner_id set not null,
 alter column owner_id set default auth.uid(),
 add constraint properties_owner_id_fkey foreign key(owner_id) references auth.users(id) on delete restrict,
 add constraint properties_owner_matches_creator check(owner_id = created_by),
 add constraint properties_private_area_finite check(private_area is null or private_area not in ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric));
create index properties_owner_created_at_idx on public.properties(owner_id, created_at);
insert into public.profiles(id) select id from auth.users on conflict(id) do nothing;
-- Replace permissive policies: PostgreSQL combines them with OR.
do $$
declare p record;
begin
 for p in select * from pg_catalog.pg_policies where schemaname='public' and tablename in ('profiles','properties','property_members') loop
 execute format('drop policy %I on %I.%I',p.policyname,p.schemaname,p.tablename);
 end loop;
end;
$$;
alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_delete_own on public.profiles for delete to authenticated using (id = (select auth.uid()));
alter table public.properties enable row level security;
create policy properties_select_own on public.properties for select to authenticated using (owner_id = (select auth.uid()));
create policy properties_insert_own on public.properties for insert to authenticated with check (owner_id = (select auth.uid()) and created_by = (select auth.uid()));
create policy properties_update_own on public.properties for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()) and created_by = (select auth.uid()));
create policy properties_delete_own on public.properties for delete to authenticated using (owner_id = (select auth.uid()));
alter table public.property_members enable row level security;
create policy property_members_select_denied on public.property_members for select to authenticated using (false);
create policy property_members_insert_denied on public.property_members for insert to authenticated with check (false);
create policy property_members_update_denied on public.property_members for update to authenticated using (false) with check (false);
create policy property_members_delete_denied on public.property_members for delete to authenticated using (false);
-- Preserve membership records, but disable sharing and unused helpers.
revoke all on public.property_members from public, anon, authenticated;
revoke all on function private.is_property_member(uuid) from authenticated;
revoke all on function private.is_property_owner(uuid) from authenticated;
-- Existing UPDATE column grants exclude ownership, id and timestamps.
-- Immutable creator trigger + equality constraint prevent owner transfer.
grant insert (owner_id) on public.properties to authenticated;
grant delete on public.properties to authenticated;
grant insert (id, display_name, avatar_url) on public.profiles to authenticated;
grant delete on public.profiles to authenticated;
comment on column public.properties.owner_id is 'Sole immutable owner; RLS uses auth.uid().';
commit;
