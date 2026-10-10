import type { EntityId, ISODateString, ISODateTimeString } from './shared'

export interface FinancialTransaction {
  id: EntityId
  title: string
  description: string
  amount: number
  date: ISODateString
  type: 'expense' | 'income'
  status: 'paid' | 'pending' | 'scheduled' | 'cancelled'
  category: string
  chapterId: EntityId | null
  documentIds: EntityId[]
  assetId: EntityId | null
  maintenanceId: EntityId | null
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

export interface FinancialCommitment {
  id: EntityId
  title: string
  amount: number
  dueDate: ISODateString
  status: 'pending' | 'scheduled' | 'future' | 'paid' | 'cancelled'
  category: string
  chapterId: EntityId | null
  /** Identifies the monthly series this installment belongs to. */
  seriesId?: EntityId | null
  /** One-based position within a monthly series. */
  installmentNumber?: number | null
  /** Original number of installments in the monthly series. */
  installmentCount?: number | null
  /** Financing contract associated with this commitment, when applicable. */
  loanId?: EntityId | null
  /** Detailed financing installment represented by this commitment. */
  loanInstallmentId?: EntityId | null
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

export type FinancialLoanStatus = 'active' | 'paid' | 'suspended' | 'cancelled'

export type FinancialLoanAmortizationSystem = 'SAC' | 'PRICE' | 'OTHER' | 'UNKNOWN'

export interface FinancialLoan {
  id: EntityId
  propertyId: EntityId
  title: string
  institution: string
  contractNumber: string | null
  startDate: ISODateString | null
  firstDueDate: ISODateString
  expectedEndDate: ISODateString | null
  originalAmount: number | null
  financedAmount: number | null
  initialBalance: number | null
  currentBalance: number | null
  installmentCount: number
  interestRateAnnual: number | null
  amortizationSystem: FinancialLoanAmortizationSystem
  status: FinancialLoanStatus
  notes: string
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

export type LoanInstallmentStatus = 'pending' | 'upcoming' | 'paid' | 'overdue' | 'cancelled'

export type LoanInstallmentSource = 'manual' | 'caixa_import'

export interface LoanInstallment {
  id: EntityId
  loanId: EntityId
  installmentNumber: number
  dueDate: ISODateString
  expectedAmount: number | null
  expectedPrincipal: number | null
  expectedInterest: number | null
  expectedInsurance: number | null
  expectedFees: number | null
  paidAmount: number | null
  paidDate: ISODateString | null
  balanceBefore: number | null
  balanceAfter: number | null
  status: LoanInstallmentStatus
  financialTransactionId: EntityId | null
  documentIds: EntityId[]
  source: LoanInstallmentSource
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}
