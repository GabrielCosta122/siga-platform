import type {
  EntityId,
  FinancialCommitment,
  FinancialLoan,
  FinancialLoanAmortizationSystem,
  FinancialLoanStatus,
  ISODateString,
  ISODateTimeString,
  LoanInstallment,
} from '@/domain/types'
import { createUuid } from '@/lib/utils'
import { addMonthsClamped, MAX_MONTHLY_INSTALLMENTS } from './recurrence'

export { createUuid } from '@/lib/utils'

const loanStatuses = new Set<FinancialLoanStatus>(['active', 'paid', 'suspended', 'cancelled'])
const amortizationSystems = new Set<FinancialLoanAmortizationSystem>(['SAC', 'PRICE', 'OTHER', 'UNKNOWN'])

const validOptionalAmount = (value: number | null | undefined) => value == null
  || (Number.isFinite(value) && value >= 0)
const validOptionalInstallmentAmount = (value: number | null | undefined) => value == null
  || (Number.isFinite(value) && value > 0)

const cleanOptionalText = (value: string | null | undefined) => {
  const cleanValue = typeof value === 'string' ? value.trim() : ''
  return cleanValue || null
}

export interface ManualLoanScheduleInput {
  propertyId: EntityId
  title: string
  institution: string
  contractNumber?: string | null
  startDate?: ISODateString | null
  firstDueDate: ISODateString
  originalAmount?: number | null
  financedAmount?: number | null
  initialBalance?: number | null
  currentBalance?: number | null
  installmentCount: number
  initialInstallmentAmount?: number | null
  interestRateAnnual?: number | null
  amortizationSystem?: FinancialLoanAmortizationSystem
  status?: FinancialLoanStatus
  notes?: string
  category?: string
  chapterId?: EntityId | null
}

export interface ManualLoanScheduleOptions {
  /** Injectable factories keep schedule tests deterministic. */
  createId?: () => EntityId
  now?: () => ISODateTimeString
}

export interface ManualLoanSchedule {
  loan: FinancialLoan
  installments: LoanInstallment[]
  commitments: FinancialCommitment[]
}

export interface LoanInstallmentCommitmentInput {
  loan: FinancialLoan
  installment: LoanInstallment
  category?: string
  chapterId?: EntityId | null
}

/**
 * Creates the calendar representation for one detailed loan installment.
 * Keeping ID and timestamp factories injectable lets reducers stay pure while
 * forms can prepare an atomic installment + commitment update.
 */
export function createLoanInstallmentCommitment(
  input: LoanInstallmentCommitmentInput,
  options: ManualLoanScheduleOptions = {},
): FinancialCommitment | null {
  const { loan, installment } = input
  const amount = installment.expectedAmount
  const category = typeof input.category === 'string' && input.category.trim()
    ? input.category.trim()
    : 'Aquisição'
  const title = typeof loan.title === 'string' ? loan.title.trim() : ''
  if (
    !loan.id
    || !title
    || installment.loanId !== loan.id
    || !Number.isInteger(installment.installmentNumber)
    || installment.installmentNumber < 1
    || installment.installmentNumber > loan.installmentCount
    || !addMonthsClamped(installment.dueDate, 0)
    || typeof amount !== 'number'
    || !Number.isFinite(amount)
    || amount <= 0
  ) return null

  const createdAt = options.now?.() ?? new Date().toISOString()
  return {
    id: options.createId?.() ?? createUuid(),
    title,
    amount,
    dueDate: installment.dueDate,
    status: installment.status === 'paid'
      ? 'paid'
      : installment.status === 'cancelled'
        ? 'cancelled'
        : installment.status === 'overdue' ? 'pending' : 'scheduled',
    category,
    chapterId: input.chapterId ?? null,
    seriesId: loan.id,
    installmentNumber: installment.installmentNumber,
    installmentCount: loan.installmentCount,
    loanId: loan.id,
    loanInstallmentId: installment.id,
    createdAt,
    updatedAt: createdAt,
  }
}

/**
 * Creates the three persisted parts of a simple manual financing schedule in
 * one pure operation. The detailed installment remains the source for loan
 * values while its commitment keeps the existing financial calendar working.
 */
export function createManualLoanSchedule(
  input: ManualLoanScheduleInput,
  options: ManualLoanScheduleOptions = {},
): ManualLoanSchedule | null {
  const propertyId = typeof input.propertyId === 'string' ? input.propertyId.trim() : ''
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const rawInstitution = typeof input.institution === 'string' ? input.institution.trim() : ''
  const institution = rawInstitution.toLocaleLowerCase('pt-BR') === 'caixa' ? 'caixa' : rawInstitution
  const category = typeof input.category === 'string' && input.category.trim()
    ? input.category.trim()
    : 'Aquisição'
  const installmentCount = input.installmentCount
  const amortizationSystem = input.amortizationSystem ?? 'UNKNOWN'
  const status = input.status ?? 'active'
  const expectedEndDate = addMonthsClamped(input.firstDueDate, installmentCount - 1)
  const hasValidStartDate = input.startDate == null || addMonthsClamped(input.startDate, 0) !== null

  if (
    !propertyId
    || !title
    || !institution
    || !Number.isInteger(installmentCount)
    || installmentCount < 1
    || installmentCount > MAX_MONTHLY_INSTALLMENTS
    || !expectedEndDate
    || !hasValidStartDate
    || !validOptionalAmount(input.originalAmount)
    || !validOptionalAmount(input.financedAmount)
    || !validOptionalAmount(input.initialBalance)
    || !validOptionalAmount(input.currentBalance)
    || !validOptionalInstallmentAmount(input.initialInstallmentAmount)
    || !validOptionalAmount(input.interestRateAnnual)
    || !amortizationSystems.has(amortizationSystem)
    || !loanStatuses.has(status)
  ) return null

  const createId = options.createId ?? createUuid
  const createdAt = options.now?.() ?? new Date().toISOString()
  const loanId = createId()
  const financedAmount = input.financedAmount ?? null
  const initialBalance = input.initialBalance ?? financedAmount
  const currentBalance = input.currentBalance ?? null
  const expectedAmount = input.initialInstallmentAmount ?? null

  const loan: FinancialLoan = {
    id: loanId,
    propertyId,
    title,
    institution,
    contractNumber: cleanOptionalText(input.contractNumber),
    startDate: input.startDate ?? null,
    firstDueDate: input.firstDueDate,
    expectedEndDate,
    originalAmount: input.originalAmount ?? null,
    financedAmount,
    initialBalance,
    currentBalance,
    installmentCount,
    interestRateAnnual: input.interestRateAnnual ?? null,
    amortizationSystem,
    status,
    notes: typeof input.notes === 'string' ? input.notes.trim() : '',
    createdAt,
    updatedAt: createdAt,
  }

  const installments: LoanInstallment[] = []
  const commitments: FinancialCommitment[] = []

  for (let index = 0; index < installmentCount; index += 1) {
    const dueDate = addMonthsClamped(input.firstDueDate, index)
    if (!dueDate) return null

    const installmentId = createId()
    const installmentNumber = index + 1
    const installment: LoanInstallment = {
      id: installmentId,
      loanId,
      installmentNumber,
      dueDate,
      expectedAmount,
      expectedPrincipal: null,
      expectedInterest: null,
      expectedInsurance: null,
      expectedFees: null,
      paidAmount: null,
      paidDate: null,
      balanceBefore: null,
      balanceAfter: null,
      status: 'pending',
      financialTransactionId: null,
      documentIds: [],
      source: 'manual',
      createdAt,
      updatedAt: createdAt,
    }
    installments.push(installment)
    if (expectedAmount !== null) {
      const commitment = createLoanInstallmentCommitment({
        loan,
        installment,
        category,
        chapterId: input.chapterId,
      }, { createId, now: () => createdAt })
      if (!commitment) return null
      commitments.push(commitment)
    }
  }

  return { loan, installments, commitments }
}
