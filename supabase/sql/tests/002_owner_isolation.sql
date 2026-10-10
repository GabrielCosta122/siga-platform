-- Execute as postgres in a TEST project after 001 + 002. Always rolls back.
-- Requires two existing Auth users; does not create/delete accounts.
begin;
select set_config('siga.test_a', (select id::text from auth.users order by id limit 1), true);
select set_config('siga.test_b', (select id::text from auth.users order by id limit 1 offset 1), true);
do $$ begin
 if nullif(current_setting('siga.test_b'), '') is null then
   raise exception 'Create at least two test Auth users first';
 end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('siga.test_a'), 'role', 'authenticated')::text, true);
do $$
declare p public.properties; second_id uuid; n integer;
begin
 p := public.create_property_with_owner(p_name => 'RLS test A');
 perform set_config('siga.test_property', p.id::text, true);
 if p.owner_id <> auth.uid() then raise exception 'RPC owner mismatch'; end if;
 insert into public.properties(name, created_by) values ('RLS test A second', auth.uid()) returning id into second_id;
 perform set_config('siga.test_second', second_id::text, true);
 select count(*) into n from public.properties where id in (p.id, second_id);
 if n <> 2 then raise exception 'Cannot read two own properties'; end if;
 update public.properties set name = 'RLS test A updated' where id=p.id;
 get diagnostics n = row_count;
 if n <> 1 then raise exception 'Own update failed'; end if;
 begin
   update public.properties set owner_id=current_setting('siga.test_b')::uuid where id=p.id;
   raise exception 'Ownership transfer unexpectedly allowed';
 exception when insufficient_privilege or check_violation then null;
 end;
end $$;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('siga.test_b'), 'role', 'authenticated')::text, true);
do $$
declare target uuid := current_setting('siga.test_property')::uuid; n integer; p public.properties;
begin
 if exists(select 1 from public.properties where id=target) then raise exception 'Cross-user SELECT leaked'; end if;
 update public.properties set name='Hacked' where id=target;
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'Cross-user UPDATE succeeded'; end if;
 delete from public.properties where id=target;
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'Cross-user DELETE succeeded'; end if;
 begin
   insert into public.properties(name, created_by, owner_id)
   values ('Forged owner', auth.uid(), current_setting('siga.test_a')::uuid);
   raise exception 'Cross-user INSERT succeeded';
 exception when insufficient_privilege or check_violation then null;
 end;
 if exists(select 1 from public.profiles where id=current_setting('siga.test_a')::uuid) then
   raise exception 'Cross-user profile SELECT leaked';
 end if;
 update public.profiles set display_name='Hacked' where id=current_setting('siga.test_a')::uuid;
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'Cross-user profile UPDATE succeeded'; end if;
 delete from public.profiles where id=current_setting('siga.test_a')::uuid;
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'Cross-user profile DELETE succeeded'; end if;
 begin
   insert into public.profiles(id) values (current_setting('siga.test_a')::uuid);
   raise exception 'Cross-user profile INSERT succeeded';
 exception when insufficient_privilege then null;
 end;
 begin
   perform 1 from public.property_members;
   raise exception 'Membership access unexpectedly allowed';
 exception when insufficient_privilege then null;
 end;
 p := public.create_property_with_owner(p_name => 'RLS test B');
 if p.owner_id <> auth.uid() then raise exception 'B owner mismatch'; end if;
 delete from public.properties where id=p.id;
 get diagnostics n = row_count;
 if n <> 1 then raise exception 'Own DELETE failed'; end if;
end $$;
-- No subject, even with authenticated role, must see no rows.
select set_config('request.jwt.claims', '{}', true);
do $$ begin
 if exists(select 1 from public.properties) then raise exception 'Missing session leaked data'; end if;
 begin
   perform public.create_property_with_owner(p_name => 'No session');
   raise exception 'Missing session RPC succeeded';
 exception when invalid_authorization_specification then null;
 end;
end $$;
reset role;
rollback;
