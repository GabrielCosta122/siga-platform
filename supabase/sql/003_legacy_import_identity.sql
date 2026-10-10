-- Apply once after 002. Idempotent import identity per authenticated owner.
begin;
alter table public.properties enable row level security;
alter table public.properties add column legacy_import_id uuid;
alter table public.properties add constraint properties_owner_legacy_import_key unique(owner_id, legacy_import_id);
grant insert (legacy_import_id) on public.properties to authenticated;
-- SECURITY INVOKER retains RLS and existing column grants. No caller owner ID.
create function public.import_legacy_property(p_import_id uuid, p_name text,
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
  p_cover_image_path text default null)
returns public.properties
language plpgsql security invoker set search_path = ''
as $$
declare result public.properties;
begin
  if auth.uid() is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if p_import_id is null then raise exception using errcode='22023', message='Import identity required'; end if;
  insert into public.properties (name, identification, type, current_stage, signature_date, expected_delivery_date, address, city, state, private_area, bedrooms, parking_spaces, cover_image_path, created_by, owner_id, legacy_import_id)
  values (p_name, p_identification, p_type, p_current_stage, p_signature_date, p_expected_delivery_date, p_address, p_city, p_state, p_private_area, p_bedrooms, p_parking_spaces, p_cover_image_path, auth.uid(), auth.uid(), p_import_id)
  on conflict on constraint properties_owner_legacy_import_key do nothing;
  select * into strict result from public.properties
    where owner_id=auth.uid() and legacy_import_id=p_import_id;
  return result;
end;
$$;
revoke all on function public.import_legacy_property(uuid, text, text, text, text, date, date, text, text, text, numeric, integer, integer, text) from public, anon;
grant execute on function public.import_legacy_property(uuid, text, text, text, text, date, date, text, text, text, numeric, integer, integer, text) to authenticated;
comment on column public.properties.legacy_import_id is 'Stable browser legacy identity; retries reuse property without overwriting later edits.';
commit;
