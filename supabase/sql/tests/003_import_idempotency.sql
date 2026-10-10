-- Run as postgres in a TEST Supabase project with two Auth users, after 003.
begin;
select set_config('siga.test_a', (select id::text from auth.users order by id limit 1), true);
select set_config('siga.test_b', (select id::text from auth.users order by id limit 1 offset 1), true);
select set_config('siga.test_source', gen_random_uuid()::text, true);
do $$ begin
 if nullif(current_setting('siga.test_b'), '') is null then raise exception 'Two test Auth users required'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('siga.test_a'), 'role', 'authenticated')::text, true);
do $$
declare first public.properties; repeated public.properties;
begin
 first := public.import_legacy_property(current_setting('siga.test_source')::uuid, 'First import');
 repeated := public.import_legacy_property(current_setting('siga.test_source')::uuid, 'Retry');
 if first.id <> repeated.id or first.owner_id <> auth.uid() then raise exception 'Duplicate or incorrect owner'; end if;
 update public.properties set name='Later edit' where id=first.id;
 repeated := public.import_legacy_property(current_setting('siga.test_source')::uuid, 'Retry after edit');
 if repeated.name <> 'Later edit' then raise exception 'Retry overwrote later edit'; end if;
 perform set_config('siga.test_property', first.id::text, true);
end $$;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('siga.test_b'), 'role', 'authenticated')::text, true);
do $$
declare own public.properties;
begin
 own := public.import_legacy_property(current_setting('siga.test_source')::uuid, 'B import');
 if own.id=current_setting('siga.test_property')::uuid or own.owner_id <> auth.uid() then raise exception 'Import identity leaked between users'; end if;
 if exists(select 1 from public.properties where id=current_setting('siga.test_property')::uuid) then raise exception 'Cross-user read'; end if;
end $$;
select set_config('request.jwt.claims', '{}', true);
do $$ begin
 begin
  perform public.import_legacy_property(current_setting('siga.test_source')::uuid, 'No session');
  raise exception 'Unauthenticated import succeeded';
 exception when invalid_authorization_specification then null;
 end;
end $$;
reset role;
rollback;
