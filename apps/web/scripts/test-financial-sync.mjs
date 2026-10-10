import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createModuleLoader } from './test-module-loader.mjs'

const load = createModuleLoader()
const sync = load('store/financial-sync.ts')
const initial = load('store/initial-data.ts').createInitialAppState()
const storage = new (class {
  values = new Map()
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
})()
const user = '11111111-1111-4111-8111-111111111111'
const property = '22222222-2222-4222-8222-222222222222'

assert.equal(sync.hasFinancePending(storage, user, property), false)
sync.markFinancePending(storage, user, property)
assert.equal(sync.hasFinancePending(storage, user, property), true)
sync.clearFinancePending(storage, user, property)
assert.equal(sync.hasFinancePending(storage, user, property), false)
assert(sync.isFinancialAction({ type: 'ADD_FINANCIAL_TRANSACTION', payload: {} }))
assert(sync.isFinancialAction({ type: 'UPDATE_LOAN_INSTALLMENT', payload: {} }))
assert(!sync.isFinancialAction({ type: 'ADD_CHAPTER', payload: {} }))
assert.deepEqual(sync.financialSnapshotFromState(initial), {
  loans: [], installments: [], commitments: [], transactions: [],
})
const changed = { ...initial, financialTransactions: [{ id: 'tx-1' }] }
assert.notEqual(sync.financialFingerprint(initial), sync.financialFingerprint(changed))
const migration = readFileSync(resolve('../../supabase/sql/004_financial_sync.sql'), 'utf8')
for (const table of ['property_finance_sync', 'financial_loans', 'financial_transactions', 'loan_installments', 'financial_commitments']) {
  assert(migration.includes(`alter table public.${table} enable row level security`))
}
assert(migration.includes('create function public.replace_property_financial_snapshot'))
assert(migration.includes('select x.id, p_property_id'))
console.log('Sincronização financeira: 15 contratos passaram.')
