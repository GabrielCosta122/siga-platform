-- Apply once after 003. Normalized financial data, atomic snapshots and owner-only RLS.
begin;

create table public.property_finance_sync (
  property_id uuid primary key references public.properties(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

create table public.financial_loans (
  id text not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  institution text not null check (btrim(institution) <> ''),
  contract_number text,
  start_date date,
  first_due_date date not null,
  expected_end_date date,
  original_amount numeric check (original_amount is null or original_amount >= 0),
  financed_amount numeric check (financed_amount is null or financed_amount >= 0),
  initial_balance numeric check (initial_balance is null or initial_balance >= 0),
  current_balance numeric check (current_balance is null or current_balance >= 0),
  installment_count integer not null check (installment_count > 0),
  interest_rate_annual numeric check (interest_rate_annual is null or interest_rate_annual >= 0),
  amortization_system text not null check (amortization_system in ('SAC','PRICE','OTHER','UNKNOWN')),
  status text not null check (status in ('active','paid','suspended','cancelled')),
  notes text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (property_id, id)
);

create table public.financial_transactions (
  id text not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  description text not null default '',
  amount numeric not null check (amount > 0),
  transaction_date date not null,
  type text not null check (type in ('expense','income')),
  status text not null check (status in ('paid','pending','scheduled','cancelled')),
  category text not null,
  chapter_id text,
  document_ids text[] not null default '{}',
  asset_id text,
  maintenance_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (property_id, id)
);

create table public.loan_installments (
  id text not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  loan_id text not null,
  installment_number integer not null check (installment_number > 0),
  due_date date not null,
  expected_amount numeric check (expected_amount is null or expected_amount > 0),
  expected_principal numeric check (expected_principal is null or expected_principal >= 0),
  expected_interest numeric check (expected_interest is null or expected_interest >= 0),
  expected_insurance numeric check (expected_insurance is null or expected_insurance >= 0),
  expected_fees numeric check (expected_fees is null or expected_fees >= 0),
  paid_amount numeric check (paid_amount is null or paid_amount > 0),
  paid_date date,
  balance_before numeric check (balance_before is null or balance_before >= 0),
  balance_after numeric check (balance_after is null or balance_after >= 0),
  status text not null check (status in ('pending','upcoming','paid','overdue','cancelled')),
  financial_transaction_id text,
  document_ids text[] not null default '{}',
  source text not null check (source in ('manual','caixa_import')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (property_id, id),
  unique (property_id, loan_id, installment_number),
  foreign key (property_id, loan_id) references public.financial_loans(property_id, id) on delete cascade,
  foreign key (property_id, financial_transaction_id) references public.financial_transactions(property_id, id) on delete set null
);

create table public.financial_commitments (
  id text not null,
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  amount numeric not null check (amount > 0),
  due_date date not null,
  status text not null check (status in ('pending','scheduled','future','paid','cancelled')),
  category text not null,
  chapter_id text,
  series_id text,
  installment_number integer,
  installment_count integer,
  loan_id text,
  loan_installment_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (property_id, id),
  foreign key (property_id, loan_id) references public.financial_loans(property_id, id) on delete cascade,
  foreign key (property_id, loan_installment_id) references public.loan_installments(property_id, id) on delete cascade,
  check ((installment_number is null and installment_count is null) or
    (installment_number > 0 and installment_count > 0 and installment_number <= installment_count))
);

create index financial_loans_property_idx on public.financial_loans(property_id);
create index financial_transactions_property_date_idx on public.financial_transactions(property_id, transaction_date);
create index loan_installments_property_due_idx on public.loan_installments(property_id, due_date);
create index financial_commitments_property_due_idx on public.financial_commitments(property_id, due_date);

alter table public.property_finance_sync enable row level security;
alter table public.financial_loans enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.loan_installments enable row level security;
alter table public.financial_commitments enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['property_finance_sync','financial_loans','financial_transactions','loan_installments','financial_commitments'] loop
    execute format('create policy %I on public.%I for select to authenticated using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()))', table_name || '_select_owner', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()))', table_name || '_insert_owner', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())) with check (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()))', table_name || '_update_owner', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()))', table_name || '_delete_owner', table_name);
  end loop;
end $$;

grant select, insert, update, delete on public.property_finance_sync, public.financial_loans,
  public.financial_transactions, public.loan_installments, public.financial_commitments to authenticated;

create function public.replace_property_financial_snapshot(
  p_property_id uuid,
  p_loans jsonb,
  p_installments jsonb,
  p_commitments jsonb,
  p_transactions jsonb
) returns bigint
language plpgsql security invoker set search_path = ''
as $$
declare next_revision bigint;
begin
  if auth.uid() is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if not exists (select 1 from public.properties where id=p_property_id and owner_id=auth.uid()) then
    raise exception using errcode='42501', message='Property access denied';
  end if;
  if jsonb_typeof(p_loans) <> 'array' or jsonb_typeof(p_installments) <> 'array'
    or jsonb_typeof(p_commitments) <> 'array' or jsonb_typeof(p_transactions) <> 'array' then
    raise exception using errcode='22023', message='Financial snapshot arrays required';
  end if;

  delete from public.financial_commitments where property_id=p_property_id;
  delete from public.loan_installments where property_id=p_property_id;
  delete from public.financial_loans where property_id=p_property_id;
  delete from public.financial_transactions where property_id=p_property_id;

  insert into public.financial_transactions (id, property_id, title, description, amount, transaction_date,
    type, status, category, chapter_id, document_ids, asset_id, maintenance_id, created_at, updated_at)
  select x.id, p_property_id, x.title, x.description, x.amount, x.transaction_date, x.type, x.status,
    x.category, x.chapter_id, x.document_ids, x.asset_id, x.maintenance_id, x.created_at, x.updated_at
  from jsonb_to_recordset(p_transactions) as x(
    id text, title text, description text, amount numeric, transaction_date date, type text, status text,
    category text, chapter_id text, document_ids text[], asset_id text, maintenance_id text,
    created_at timestamptz, updated_at timestamptz);

  insert into public.financial_loans (id, property_id, title, institution, contract_number, start_date,
    first_due_date, expected_end_date, original_amount, financed_amount, initial_balance, current_balance,
    installment_count, interest_rate_annual, amortization_system, status, notes, created_at, updated_at)
  select x.id, p_property_id, x.title, x.institution, x.contract_number, x.start_date, x.first_due_date,
    x.expected_end_date, x.original_amount, x.financed_amount, x.initial_balance, x.current_balance,
    x.installment_count, x.interest_rate_annual, x.amortization_system, x.status, x.notes, x.created_at, x.updated_at
  from jsonb_to_recordset(p_loans) as x(
    id text, title text, institution text, contract_number text, start_date date, first_due_date date,
    expected_end_date date, original_amount numeric, financed_amount numeric, initial_balance numeric,
    current_balance numeric, installment_count integer, interest_rate_annual numeric,
    amortization_system text, status text, notes text, created_at timestamptz, updated_at timestamptz);

  insert into public.loan_installments (id, property_id, loan_id, installment_number, due_date,
    expected_amount, expected_principal, expected_interest, expected_insurance, expected_fees, paid_amount,
    paid_date, balance_before, balance_after, status, financial_transaction_id, document_ids, source,
    created_at, updated_at)
  select x.id, p_property_id, x.loan_id, x.installment_number, x.due_date, x.expected_amount,
    x.expected_principal, x.expected_interest, x.expected_insurance, x.expected_fees, x.paid_amount,
    x.paid_date, x.balance_before, x.balance_after, x.status, x.financial_transaction_id,
    x.document_ids, x.source, x.created_at, x.updated_at
  from jsonb_to_recordset(p_installments) as x(
    id text, loan_id text, installment_number integer, due_date date, expected_amount numeric,
    expected_principal numeric, expected_interest numeric, expected_insurance numeric, expected_fees numeric,
    paid_amount numeric, paid_date date, balance_before numeric, balance_after numeric, status text,
    financial_transaction_id text, document_ids text[], source text, created_at timestamptz, updated_at timestamptz);

  insert into public.financial_commitments (id, property_id, title, amount, due_date, status, category,
    chapter_id, series_id, installment_number, installment_count, loan_id, loan_installment_id,
    created_at, updated_at)
  select x.id, p_property_id, x.title, x.amount, x.due_date, x.status, x.category, x.chapter_id,
    x.series_id, x.installment_number, x.installment_count, x.loan_id, x.loan_installment_id,
    x.created_at, x.updated_at
  from jsonb_to_recordset(p_commitments) as x(
    id text, title text, amount numeric, due_date date, status text, category text, chapter_id text,
    series_id text, installment_number integer, installment_count integer, loan_id text,
    loan_installment_id text, created_at timestamptz, updated_at timestamptz);

  insert into public.property_finance_sync(property_id, revision, updated_at)
  values (p_property_id, 1, now())
  on conflict (property_id) do update set revision=public.property_finance_sync.revision+1, updated_at=now()
  returning revision into next_revision;
  return next_revision;
end;
$$;

revoke all on function public.replace_property_financial_snapshot(uuid,jsonb,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.replace_property_financial_snapshot(uuid,jsonb,jsonb,jsonb,jsonb) to authenticated;
commit;
