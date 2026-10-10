import type { AppAction } from './app-actions'
import type { AppState } from './app-state'
import type { FinancialSnapshotInput } from '@/services/supabase/financial.service'

export const financePendingKey = (userId: string, propertyId: string) =>
  `siga:finance-sync:v1:user:${encodeURIComponent(userId)}:property:${encodeURIComponent(propertyId)}`

export const financialSnapshotFromState = (state: AppState): FinancialSnapshotInput => ({
  loans: state.financialLoans,
  installments: state.loanInstallments,
  commitments: state.financialCommitments,
  transactions: state.financialTransactions,
})

export const financialFingerprint = (state: AppState) => JSON.stringify(financialSnapshotFromState(state))

export const isFinancialAction = (action: AppAction) =>
  action.type === 'RESET_STATE' || action.type.includes('FINANCIAL_') || action.type.includes('LOAN_INSTALLMENT')

export const markFinancePending = (storage: Storage, userId: string, propertyId: string) =>
  storage.setItem(financePendingKey(userId, propertyId), '1')
export const clearFinancePending = (storage: Storage, userId: string, propertyId: string) =>
  storage.removeItem(financePendingKey(userId, propertyId))
export const hasFinancePending = (storage: Storage, userId: string, propertyId: string) =>
  storage.getItem(financePendingKey(userId, propertyId)) === '1'
