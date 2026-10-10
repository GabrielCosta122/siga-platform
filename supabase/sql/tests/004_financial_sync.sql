-- Run after 004 in a disposable/test project. The transaction always rolls back.
begin;
do $$
declare
  owner_a uuid;
  owner_b uuid;
  property_a uuid;
  property_b uuid;
  revision bigint;
begin
  insert into auth.users(id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values
    ('10000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','finance-a@example.test','',now(),now()),
    ('20000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','finance-b@example.test','',now(),now());
  owner_b := '20000000-0000-4000-8000-000000000004';
  owner_a := '10000000-0000-4000-8000-000000000004';

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  select (public.create_property_with_owner('Finance A')).id into property_a;
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  select (public.create_property_with_owner('Finance B')).id into property_b;
  perform set_config('request.jwt.claim.sub', owner_a::text, true);

  select public.replace_property_financial_snapshot(property_a,
    '[{"id":"loan-1","title":"Contrato","institution":"caixa","contract_number":null,"start_date":null,"first_due_date":"2026-10-18","expected_end_date":"2026-10-18","original_amount":null,"financed_amount":null,"initial_balance":null,"current_balance":null,"installment_count":1,"interest_rate_annual":null,"amortization_system":"UNKNOWN","status":"active","notes":"","created_at":"2026-10-10T12:00:00Z","updated_at":"2026-10-10T12:00:00Z"}]',
    '[{"id":"installment-1","loan_id":"loan-1","installment_number":1,"due_date":"2026-10-18","expected_amount":121.38,"expected_principal":null,"expected_interest":null,"expected_insurance":null,"expected_fees":121.38,"paid_amount":null,"paid_date":null,"balance_before":null,"balance_after":null,"status":"upcoming","financial_transaction_id":null,"document_ids":[],"source":"caixa_import","created_at":"2026-10-10T12:00:00Z","updated_at":"2026-10-10T12:00:00Z"}]',
    '[{"id":"commitment-1","title":"Contrato","amount":121.38,"due_date":"2026-10-18","status":"scheduled","category":"Aquisição","chapter_id":null,"series_id":"loan-1","installment_number":1,"installment_count":1,"loan_id":"loan-1","loan_installment_id":"installment-1","created_at":"2026-10-10T12:00:00Z","updated_at":"2026-10-10T12:00:00Z"}]',
    '[]') into revision;
  if revision <> 1 then raise exception 'First revision mismatch'; end if;
  if (select count(*) from public.financial_loans where property_id=property_a) <> 1 then raise exception 'Owner cannot read own loan'; end if;

  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  if exists (select 1 from public.financial_loans where property_id=property_a) then raise exception 'RLS leaked loan'; end if;
  begin
    perform public.replace_property_financial_snapshot(property_a, '[]','[]','[]','[]');
    raise exception 'Cross-owner replace unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  select public.replace_property_financial_snapshot(property_a, '[]','[]','[]','[]') into revision;
  if revision <> 2 then raise exception 'Revision did not increment'; end if;
  if exists (select 1 from public.financial_loans where property_id=property_a) then raise exception 'Atomic replacement did not delete old rows'; end if;
end $$;
rollback;
