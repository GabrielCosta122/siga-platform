import type { FinancialCommitment, FinancialLoan, FinancialTransaction, LoanInstallment } from '@/domain/types'
import type { Json, TableRow } from '@/lib/supabase/database.types'
import { requireUserClient } from './auth.service'
import { SupabaseServiceError, toSupabaseServiceError } from './service-error'

export interface FinancialSnapshot {
  initialized: boolean
  revision: number
  loans: FinancialLoan[]
  installments: LoanInstallment[]
  commitments: FinancialCommitment[]
  transactions: FinancialTransaction[]
}

export interface FinancialSnapshotInput {
  loans: FinancialLoan[]
  installments: LoanInstallment[]
  commitments: FinancialCommitment[]
  transactions: FinancialTransaction[]
}

const validatePropertyId = (id: string) => {
  const value = id.trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new SupabaseServiceError('invalid-input', 'Informe um imóvel válido.')
  }
  return value
}

const mapLoan = (row: TableRow<'financial_loans'>): FinancialLoan => ({
  id: row.id, propertyId: row.property_id, title: row.title, institution: row.institution,
  contractNumber: row.contract_number, startDate: row.start_date, firstDueDate: row.first_due_date,
  expectedEndDate: row.expected_end_date, originalAmount: row.original_amount,
  financedAmount: row.financed_amount, initialBalance: row.initial_balance, currentBalance: row.current_balance,
  installmentCount: row.installment_count, interestRateAnnual: row.interest_rate_annual,
  amortizationSystem: row.amortization_system, status: row.status, notes: row.notes,
  createdAt: row.created_at, updatedAt: row.updated_at,
})
const mapInstallment = (row: TableRow<'loan_installments'>): LoanInstallment => ({
  id: row.id, loanId: row.loan_id, installmentNumber: row.installment_number, dueDate: row.due_date,
  expectedAmount: row.expected_amount, expectedPrincipal: row.expected_principal,
  expectedInterest: row.expected_interest, expectedInsurance: row.expected_insurance, expectedFees: row.expected_fees,
  paidAmount: row.paid_amount, paidDate: row.paid_date, balanceBefore: row.balance_before,
  balanceAfter: row.balance_after, status: row.status, financialTransactionId: row.financial_transaction_id,
  documentIds: row.document_ids, source: row.source, createdAt: row.created_at, updatedAt: row.updated_at,
})
const mapCommitment = (row: TableRow<'financial_commitments'>): FinancialCommitment => ({
  id: row.id, title: row.title, amount: row.amount, dueDate: row.due_date, status: row.status,
  category: row.category, chapterId: row.chapter_id, seriesId: row.series_id,
  installmentNumber: row.installment_number, installmentCount: row.installment_count,
  loanId: row.loan_id, loanInstallmentId: row.loan_installment_id,
  createdAt: row.created_at, updatedAt: row.updated_at,
})
const mapTransaction = (row: TableRow<'financial_transactions'>): FinancialTransaction => ({
  id: row.id, title: row.title, description: row.description, amount: row.amount, date: row.transaction_date,
  type: row.type, status: row.status, category: row.category, chapterId: row.chapter_id,
  documentIds: row.document_ids, assetId: row.asset_id, maintenanceId: row.maintenance_id,
  createdAt: row.created_at, updatedAt: row.updated_at,
})

export async function loadFinancialSnapshot(propertyIdInput: string, expectedUserId?: string): Promise<FinancialSnapshot> {
  const propertyId = validatePropertyId(propertyIdInput)
  try {
    const { client } = await requireUserClient(expectedUserId)
    const [marker, loans, installments, commitments, transactions] = await Promise.all([
      client.from('property_finance_sync').select('*').eq('property_id', propertyId).maybeSingle(),
      client.from('financial_loans').select('*').eq('property_id', propertyId).order('created_at'),
      client.from('loan_installments').select('*').eq('property_id', propertyId).order('due_date'),
      client.from('financial_commitments').select('*').eq('property_id', propertyId).order('due_date'),
      client.from('financial_transactions').select('*').eq('property_id', propertyId).order('transaction_date'),
    ])
    const error = marker.error || loans.error || installments.error || commitments.error || transactions.error
    if (error) throw error
    return {
      initialized: Boolean(marker.data), revision: marker.data?.revision ?? 0,
      loans: (loans.data ?? []).map(mapLoan), installments: (installments.data ?? []).map(mapInstallment),
      commitments: (commitments.data ?? []).map(mapCommitment), transactions: (transactions.data ?? []).map(mapTransaction),
    }
  } catch (error) { throw toSupabaseServiceError(error, 'Não foi possível carregar os dados financeiros.') }
}

const loanPayload = (item: FinancialLoan) => ({
  id: item.id, title: item.title, institution: item.institution, contract_number: item.contractNumber,
  start_date: item.startDate, first_due_date: item.firstDueDate, expected_end_date: item.expectedEndDate,
  original_amount: item.originalAmount, financed_amount: item.financedAmount, initial_balance: item.initialBalance,
  current_balance: item.currentBalance, installment_count: item.installmentCount,
  interest_rate_annual: item.interestRateAnnual, amortization_system: item.amortizationSystem,
  status: item.status, notes: item.notes, created_at: item.createdAt, updated_at: item.updatedAt,
})
const installmentPayload = (item: LoanInstallment) => ({
  id: item.id, loan_id: item.loanId, installment_number: item.installmentNumber, due_date: item.dueDate,
  expected_amount: item.expectedAmount, expected_principal: item.expectedPrincipal,
  expected_interest: item.expectedInterest, expected_insurance: item.expectedInsurance,
  expected_fees: item.expectedFees, paid_amount: item.paidAmount, paid_date: item.paidDate,
  balance_before: item.balanceBefore, balance_after: item.balanceAfter, status: item.status,
  financial_transaction_id: item.financialTransactionId, document_ids: item.documentIds,
  source: item.source, created_at: item.createdAt, updated_at: item.updatedAt,
})
const commitmentPayload = (item: FinancialCommitment) => ({
  id: item.id, title: item.title, amount: item.amount, due_date: item.dueDate, status: item.status,
  category: item.category, chapter_id: item.chapterId, series_id: item.seriesId ?? null,
  installment_number: item.installmentNumber ?? null, installment_count: item.installmentCount ?? null,
  loan_id: item.loanId ?? null, loan_installment_id: item.loanInstallmentId ?? null,
  created_at: item.createdAt, updated_at: item.updatedAt,
})
const transactionPayload = (item: FinancialTransaction) => ({
  id: item.id, title: item.title, description: item.description, amount: item.amount,
  transaction_date: item.date, type: item.type, status: item.status, category: item.category,
  chapter_id: item.chapterId, document_ids: item.documentIds, asset_id: item.assetId,
  maintenance_id: item.maintenanceId, created_at: item.createdAt, updated_at: item.updatedAt,
})

export async function saveFinancialSnapshot(propertyIdInput: string, input: FinancialSnapshotInput, expectedUserId?: string): Promise<number> {
  const propertyId = validatePropertyId(propertyIdInput)
  try {
    const { client } = await requireUserClient(expectedUserId)
    const { data, error } = await client.rpc('replace_property_financial_snapshot', {
      p_property_id: propertyId,
      p_loans: input.loans.map(loanPayload) as Json,
      p_installments: input.installments.map(installmentPayload) as Json,
      p_commitments: input.commitments.map(commitmentPayload) as Json,
      p_transactions: input.transactions.map(transactionPayload) as Json,
    })
    if (error) throw error
    if (typeof data !== 'number') throw new SupabaseServiceError('unknown', 'O servidor não confirmou a sincronização financeira.')
    return data
  } catch (error) { throw toSupabaseServiceError(error, 'Não foi possível sincronizar os dados financeiros.') }
}
