import type { AppAction } from './app-actions'
import type { AppState } from './app-state'
import type { FinancialCommitment, FinancialLoan, FinancialTransaction, LoanInstallment, LoanInstallmentStatus } from '@/domain/types'
import { createInitialAppState } from './initial-data'

const now = () => new Date().toISOString()
const updateById = <T extends { id: string; createdAt: string; updatedAt: string }>(items: T[], id: string, changes: Partial<T>, updatedAt: string) =>
  items.map(item => item.id === id ? { ...item, ...changes, id: item.id, createdAt: item.createdAt, updatedAt } : item)
const deleteById = <T extends { id: string }>(items: T[], id: string) => items.filter(item => item.id !== id)
const mergeDefined = <T extends object>(current: T, changes: Partial<T>): T => Object.fromEntries([
  ...Object.entries(current),
  ...Object.entries(changes).filter(([, value]) => value !== undefined),
]) as T

const normalizeStatusToken = (status: unknown) => typeof status === 'string'
  ? status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
  : ''
const isOpenCommitmentStatus = (status: unknown) => [
  'pending', 'scheduled', 'future', 'proximo', 'pendente', 'agendado', 'agendada', 'futuro', 'futura',
].includes(normalizeStatusToken(status))
const isCancelledCommitmentStatus = (status: unknown) => [
  'cancelled', 'canceled', 'cancelado', 'cancelada',
].includes(normalizeStatusToken(status))
const getFinancialLoans = (state: AppState) => Array.isArray(state.financialLoans) ? state.financialLoans : []
const getLoanInstallments = (state: AppState) => Array.isArray(state.loanInstallments) ? state.loanInstallments : []
const isValidISODate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const timestamp = Date.parse(`${value}T00:00:00.000Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}
const isValidPaymentTransaction = (transaction: FinancialTransaction) => Number.isFinite(transaction.amount)
  && transaction.amount > 0
  && (transaction.type === 'expense' || String(transaction.type) === 'Despesa')
  && (transaction.status === 'paid' || String(transaction.status) === 'Pago')
  && isValidISODate(transaction.date)
const isPaidInstallmentStatus = (status: unknown) => ['paid', 'pago', 'paga'].includes(
  normalizeStatusToken(status),
)
const isCancelledInstallmentStatus = (status: unknown) => ['cancelled', 'canceled', 'cancelado', 'cancelada'].includes(
  normalizeStatusToken(status),
)

const hasUniqueIds = (items: { id: string }[]) => new Set(items.map(item => item.id)).size === items.length

const isAlignedLoanSchedule = (
  state: AppState,
  loan: FinancialLoan,
  installments: LoanInstallment[],
  commitments: FinancialCommitment[],
) => {
  if (!loan.id || getFinancialLoans(state).some(item => item.id === loan.id)) return false
  if (!Number.isInteger(loan.installmentCount) || loan.installmentCount < 1 || installments.length !== loan.installmentCount) return false
  if (!hasUniqueIds(installments) || !hasUniqueIds(commitments)) return false
  const existingInstallmentIds = new Set(getLoanInstallments(state).map(item => item.id))
  const existingCommitmentIds = new Set(state.financialCommitments.map(item => item.id))
  const installmentIds = new Set(installments.map(item => item.id))
  const installmentNumbers = new Set(installments.map(item => item.installmentNumber))
  if (
    installments.some(item => item.loanId !== loan.id || existingInstallmentIds.has(item.id))
    || installmentNumbers.size !== installments.length
    || !installments.every(item => Number.isInteger(item.installmentNumber) && item.installmentNumber >= 1 && item.installmentNumber <= loan.installmentCount)
  ) return false

  if (commitments.length === 0) return installments.every(item => item.expectedAmount === null)
  if (commitments.length !== installments.length) return false
  if (new Set(commitments.map(item => item.loanInstallmentId)).size !== commitments.length) return false
  return commitments.every(commitment => {
    const installment = installments.find(item => item.id === commitment.loanInstallmentId)
    return !!installment
      && installmentIds.has(installment.id)
      && commitment.loanId === loan.id
      && commitment.seriesId === loan.id
      && commitment.installmentNumber === installment.installmentNumber
      && commitment.installmentCount === loan.installmentCount
      && commitment.dueDate === installment.dueDate
      && typeof installment.expectedAmount === 'number'
      && Number.isFinite(installment.expectedAmount)
      && installment.expectedAmount > 0
      && commitment.amount === installment.expectedAmount
      && !existingCommitmentIds.has(commitment.id)
  })
}

const commitmentStatusForInstallment = (status: LoanInstallmentStatus): FinancialCommitment['status'] => {
  if (status === 'paid') return 'paid'
  if (status === 'cancelled') return 'cancelled'
  if (status === 'overdue') return 'pending'
  return 'scheduled'
}

const hasValidInstallmentPosition = (loan: FinancialLoan, installment: LoanInstallment) =>
  installment.loanId === loan.id
  && Number.isInteger(installment.installmentNumber)
  && installment.installmentNumber >= 1
  && installment.installmentNumber <= loan.installmentCount
  && isValidISODate(installment.dueDate)

const installmentPositionKey = (installment: LoanInstallment) => `${installment.loanId}:${installment.installmentNumber}`

const isValidNewInstallmentCommitment = (
  state: AppState,
  loan: FinancialLoan,
  installment: LoanInstallment,
  commitment: FinancialCommitment,
) => typeof installment.expectedAmount === 'number'
  && Number.isFinite(installment.expectedAmount)
  && installment.expectedAmount > 0
  && typeof commitment.id === 'string'
  && !!commitment.id
  && !state.financialCommitments.some(item => item.id === commitment.id || item.loanInstallmentId === installment.id)
  && commitment.loanId === loan.id
  && commitment.loanInstallmentId === installment.id
  && commitment.seriesId === loan.id
  && commitment.installmentNumber === installment.installmentNumber
  && commitment.installmentCount === loan.installmentCount
  && commitment.dueDate === installment.dueDate
  && commitment.amount === installment.expectedAmount
  && commitment.status === commitmentStatusForInstallment(installment.status)
  && typeof commitment.title === 'string'
  && !!commitment.title.trim()
  && typeof commitment.category === 'string'
  && !!commitment.category.trim()
  && typeof commitment.createdAt === 'string'
  && typeof commitment.updatedAt === 'string'

const syncCommitmentFromInstallment = (
  commitment: FinancialCommitment,
  installment: LoanInstallment,
  changes: Partial<LoanInstallment>,
  updatedAt: string,
) => {
  if (commitment.loanInstallmentId !== installment.id) return commitment
  return {
    ...commitment,
    ...(changes.dueDate !== undefined ? { dueDate: installment.dueDate } : {}),
    ...(changes.expectedAmount !== undefined && typeof installment.expectedAmount === 'number' && Number.isFinite(installment.expectedAmount) && installment.expectedAmount >= 0
      ? { amount: installment.expectedAmount }
      : {}),
    ...(changes.loanId !== undefined ? { loanId: installment.loanId } : {}),
    ...(changes.installmentNumber !== undefined ? { installmentNumber: installment.installmentNumber } : {}),
    ...(changes.status !== undefined ? { status: commitmentStatusForInstallment(installment.status) } : {}),
    updatedAt,
  }
}

const removeInstallmentsAndFutureCommitments = (
  state: AppState,
  installmentIds: Set<string>,
  updatedAt: string,
) => ({
  loanInstallments: getLoanInstallments(state).filter(item => !installmentIds.has(item.id)),
  financialCommitments: state.financialCommitments.flatMap(commitment => {
    if (!commitment.loanInstallmentId || !installmentIds.has(commitment.loanInstallmentId)) return [commitment]
    if (isOpenCommitmentStatus(commitment.status)) return []
    return [{ ...commitment, loanId: null, loanInstallmentId: null, updatedAt }]
  }),
})

export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'HYDRATE_STATE') return action.payload
  if (action.type === 'RESET_STATE') return action.payload ?? createInitialAppState()
  const updatedAt = now()

  switch (action.type) {
    case 'APPLY_REMOTE_PROPERTY': return { ...state, property: action.payload, updatedAt }
    case 'UPDATE_PROPERTY': return { ...state, property: { ...state.property, ...action.payload, id: state.property.id, createdAt: state.property.createdAt, updatedAt }, updatedAt }
    case 'UPDATE_APP_PREFERENCES': return {
      ...state,
      settings: { ...state.settings, preferences: mergeDefined(state.settings.preferences, action.payload) },
      updatedAt,
    }
    case 'UPDATE_NOTIFICATION_SETTINGS': return {
      ...state,
      settings: {
        ...state.settings,
        notifications: {
          channels: mergeDefined(state.settings.notifications.channels, action.payload.channels ?? {}),
          events: mergeDefined(state.settings.notifications.events, action.payload.events ?? {}),
        },
      },
      updatedAt,
    }
    case 'UPDATE_CATEGORY_SETTING': {
      const categoryExists = state.settings.categories.some(item => item.scope === action.payload.scope && item.id === action.payload.id)
      if (!categoryExists) return state
      return {
        ...state,
        settings: {
          ...state.settings,
          categories: state.settings.categories.map(item => item.scope === action.payload.scope && item.id === action.payload.id
            ? mergeDefined<typeof item>(item, action.payload.changes)
            : item),
        },
        updatedAt,
      }
    }
    case 'ADD_CHAPTER': return { ...state, chapters: [...state.chapters, action.payload], updatedAt }
    case 'UPDATE_CHAPTER': return { ...state, chapters: updateById(state.chapters, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_CHAPTER': return { ...state, chapters: deleteById(state.chapters, action.payload), updatedAt }
    case 'TOGGLE_CHAPTER_IMPORTANT': return { ...state, chapters: state.chapters.map(item => item.id === action.payload ? { ...item, important: !item.important, updatedAt } : item), updatedAt }
    case 'ADD_FINANCIAL_TRANSACTION': return { ...state, financialTransactions: [...state.financialTransactions, action.payload], updatedAt }
    case 'UPDATE_FINANCIAL_TRANSACTION': {
      const current = state.financialTransactions.find(item => item.id === action.payload.id)
      if (!current) return state
      const transaction = { ...current, ...action.payload.changes, id: current.id, createdAt: current.createdAt, updatedAt }
      const isPayment = isValidPaymentTransaction(transaction)
      const linkedInstallmentIds = new Set<string>()
      const loanInstallments = getLoanInstallments(state).map(installment => {
        if (installment.financialTransactionId !== transaction.id) return installment
        linkedInstallmentIds.add(installment.id)
        const documentIds = action.payload.changes.documentIds !== undefined
          ? [...new Set([
              ...(Array.isArray(installment.documentIds) ? installment.documentIds : []),
              ...(Array.isArray(transaction.documentIds) ? transaction.documentIds : []),
            ])]
          : installment.documentIds
        return {
          ...installment,
          status: isPayment ? 'paid' as const : 'pending' as const,
          paidAmount: isPayment ? transaction.amount : null,
          paidDate: isPayment ? transaction.date : null,
          documentIds,
          updatedAt,
        }
      })
      return {
        ...state,
        financialTransactions: state.financialTransactions.map(item => item.id === transaction.id ? transaction : item),
        loanInstallments,
        financialCommitments: linkedInstallmentIds.size > 0
          ? state.financialCommitments.map(commitment => commitment.loanInstallmentId && linkedInstallmentIds.has(commitment.loanInstallmentId)
            ? { ...commitment, status: isPayment ? 'paid' : 'scheduled', updatedAt }
            : commitment)
          : state.financialCommitments,
        updatedAt,
      }
    }
    case 'DELETE_FINANCIAL_TRANSACTION': {
      if (!state.financialTransactions.some(item => item.id === action.payload)) return state
      const linkedInstallmentIds = new Set(getLoanInstallments(state)
        .filter(installment => installment.financialTransactionId === action.payload)
        .map(installment => installment.id))
      return {
        ...state,
        financialTransactions: deleteById(state.financialTransactions, action.payload),
        loanInstallments: getLoanInstallments(state).map(installment => installment.financialTransactionId === action.payload
          ? {
              ...installment,
              status: 'pending',
              paidAmount: null,
              paidDate: null,
              financialTransactionId: null,
              updatedAt,
            }
          : installment),
        financialCommitments: linkedInstallmentIds.size > 0
          ? state.financialCommitments.map(commitment => commitment.loanInstallmentId && linkedInstallmentIds.has(commitment.loanInstallmentId)
            ? {
                ...commitment,
                status: isCancelledCommitmentStatus(commitment.status) ? 'cancelled' : 'scheduled',
                updatedAt,
              }
            : commitment)
          : state.financialCommitments,
        updatedAt,
      }
    }
    case 'ADD_FINANCIAL_COMMITMENT': return action.payload.loanId || action.payload.loanInstallmentId
      ? state
      : { ...state, financialCommitments: [...state.financialCommitments, action.payload], updatedAt }
    case 'ADD_FINANCIAL_COMMITMENTS': return action.payload.length > 0
      && hasUniqueIds(action.payload)
      && action.payload.every(item => !item.loanId && !item.loanInstallmentId)
      && action.payload.every(item => !state.financialCommitments.some(current => current.id === item.id))
      ? { ...state, financialCommitments: [...state.financialCommitments, ...action.payload], updatedAt }
      : state
    case 'UPDATE_FINANCIAL_COMMITMENT': {
      const commitment = state.financialCommitments.find(item => item.id === action.payload.id)
      if (!commitment || commitment.loanId || commitment.loanInstallmentId) return state
      return { ...state, financialCommitments: updateById(state.financialCommitments, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    }
    case 'DELETE_FINANCIAL_COMMITMENT': {
      const commitment = state.financialCommitments.find(item => item.id === action.payload)
      if (!commitment || commitment.loanId || commitment.loanInstallmentId) return state
      return { ...state, financialCommitments: deleteById(state.financialCommitments, action.payload), updatedAt }
    }
    case 'DELETE_FINANCIAL_COMMITMENTS': {
      if (action.payload.length === 0) return state
      const ids = new Set(action.payload)
      const deletableIds = new Set(state.financialCommitments
        .filter(item => ids.has(item.id) && !item.loanId && !item.loanInstallmentId)
        .map(item => item.id))
      if (deletableIds.size === 0) return state
      return { ...state, financialCommitments: state.financialCommitments.filter(item => !deletableIds.has(item.id)), updatedAt }
    }
    case 'ADD_FINANCIAL_LOAN': return getFinancialLoans(state).some(item => item.id === action.payload.id)
      ? state
      : { ...state, financialLoans: [...getFinancialLoans(state), action.payload], updatedAt }
    case 'ADD_FINANCIAL_LOAN_SCHEDULE': {
      if (!isAlignedLoanSchedule(state, action.payload.loan, action.payload.installments, action.payload.commitments)) return state
      return {
        ...state,
        financialLoans: [...getFinancialLoans(state), action.payload.loan],
        loanInstallments: [...getLoanInstallments(state), ...action.payload.installments],
        financialCommitments: [...state.financialCommitments, ...action.payload.commitments],
        updatedAt,
      }
    }
    case 'UPDATE_FINANCIAL_LOAN': {
      const loans = getFinancialLoans(state)
      if (!loans.some(item => item.id === action.payload.id)) return state
      return { ...state, financialLoans: updateById(loans, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    }
    case 'DELETE_FINANCIAL_LOAN': {
      const loans = getFinancialLoans(state)
      if (!loans.some(item => item.id === action.payload)) return state
      const installmentIds = new Set(getLoanInstallments(state).filter(item => item.loanId === action.payload).map(item => item.id))
      const related = removeInstallmentsAndFutureCommitments(state, installmentIds, updatedAt)
      const financialCommitments = related.financialCommitments.flatMap(commitment => {
        if (commitment.loanId !== action.payload) return [commitment]
        if (isOpenCommitmentStatus(commitment.status)) return []
        return [{ ...commitment, loanId: null, loanInstallmentId: null, updatedAt }]
      })
      return {
        ...state,
        financialLoans: deleteById(loans, action.payload),
        loanInstallments: related.loanInstallments,
        financialCommitments,
        updatedAt,
      }
    }
    case 'ADD_LOAN_INSTALLMENT': {
      const installments = getLoanInstallments(state)
      const loan = getFinancialLoans(state).find(item => item.id === action.payload.loanId)
      if (
        !loan
        || !hasValidInstallmentPosition(loan, action.payload)
        || installments.some(item => item.id === action.payload.id || installmentPositionKey(item) === installmentPositionKey(action.payload))
      ) return state
      return { ...state, loanInstallments: [...installments, action.payload], updatedAt }
    }
    case 'ADD_LOAN_INSTALLMENTS': {
      if (action.payload.length === 0 || !hasUniqueIds(action.payload)) return state
      const installments = getLoanInstallments(state)
      const currentIds = new Set(installments.map(item => item.id))
      const loans = new Map(getFinancialLoans(state).map(item => [item.id, item]))
      const currentPositions = new Set(installments.map(installmentPositionKey))
      const newPositions = action.payload.map(installmentPositionKey)
      if (
        new Set(newPositions).size !== newPositions.length
        || action.payload.some(item => {
          const loan = loans.get(item.loanId)
          return currentIds.has(item.id)
            || currentPositions.has(installmentPositionKey(item))
            || !loan
            || !hasValidInstallmentPosition(loan, item)
        })
      ) return state
      return { ...state, loanInstallments: [...installments, ...action.payload], updatedAt }
    }
    case 'UPDATE_LOAN_INSTALLMENT': {
      const installments = getLoanInstallments(state)
      const current = installments.find(item => item.id === action.payload.id)
      if (
        !current
        || (action.payload.changes.loanId !== undefined && action.payload.changes.loanId !== current.loanId)
        || (action.payload.changes.installmentNumber !== undefined && action.payload.changes.installmentNumber !== current.installmentNumber)
        || (action.payload.changes.status === 'paid'
          && !isPaidInstallmentStatus(current.status)
          && !current.financialTransactionId
          && !(typeof current.paidAmount === 'number' && Number.isFinite(current.paidAmount) && current.paidAmount > 0))
      ) return state
      const linkedCommitments = state.financialCommitments.filter(commitment => commitment.loanInstallmentId === current.id)
      const historicalCommitment = linkedCommitments.find(commitment => !isOpenCommitmentStatus(commitment.status))
      const changes = action.payload.changes.expectedAmount === null && historicalCommitment
        ? {
            ...action.payload.changes,
            expectedAmount: typeof current.expectedAmount === 'number' && Number.isFinite(current.expectedAmount)
              ? current.expectedAmount
              : Number.isFinite(historicalCommitment.amount) ? historicalCommitment.amount : null,
          }
        : action.payload.changes
      const installment = { ...current, ...changes, id: current.id, createdAt: current.createdAt, updatedAt }
      const loan = getFinancialLoans(state).find(item => item.id === installment.loanId)
      const needsCommitment = linkedCommitments.length === 0
        && typeof installment.expectedAmount === 'number'
        && Number.isFinite(installment.expectedAmount)
        && installment.expectedAmount > 0
      if (
        needsCommitment
          ? !loan || !action.payload.commitment || !isValidNewInstallmentCommitment(state, loan, installment, action.payload.commitment)
          : action.payload.commitment !== undefined
      ) return state
      const financialCommitments = state.financialCommitments.flatMap(commitment => {
        if (commitment.loanInstallmentId !== installment.id) return [commitment]
        if (changes.expectedAmount === null && isOpenCommitmentStatus(commitment.status)) return []
        return [syncCommitmentFromInstallment(commitment, installment, changes, updatedAt)]
      })
      if (action.payload.commitment) financialCommitments.push({ ...action.payload.commitment, updatedAt })
      return {
        ...state,
        loanInstallments: installments.map(item => item.id === current.id ? installment : item),
        financialCommitments,
        updatedAt,
      }
    }
    case 'DELETE_LOAN_INSTALLMENT': {
      if (!getLoanInstallments(state).some(item => item.id === action.payload)) return state
      const related = removeInstallmentsAndFutureCommitments(state, new Set([action.payload]), updatedAt)
      return { ...state, ...related, updatedAt }
    }
    case 'DELETE_LOAN_INSTALLMENTS': {
      if (action.payload.length === 0) return state
      const ids = new Set(action.payload)
      if (!getLoanInstallments(state).some(item => ids.has(item.id))) return state
      const related = removeInstallmentsAndFutureCommitments(state, ids, updatedAt)
      return { ...state, ...related, updatedAt }
    }
    case 'REGISTER_LOAN_INSTALLMENT_PAYMENT': {
      const installments = getLoanInstallments(state)
      const installment = installments.find(item => item.id === action.payload.installmentId)
      const loan = installment
        ? getFinancialLoans(state).find(item => item.id === installment.loanId)
        : undefined
      const linkedTransaction = installment?.financialTransactionId
        ? state.financialTransactions.find(item => item.id === installment.financialTransactionId)
        : undefined
      if (
        !installment
        || loan?.status !== 'active'
        || isPaidInstallmentStatus(installment.status)
        || isCancelledInstallmentStatus(installment.status)
        || (typeof installment.paidAmount === 'number' && Number.isFinite(installment.paidAmount) && installment.paidAmount > 0)
        || (linkedTransaction ? isValidPaymentTransaction(linkedTransaction) : false)
        || !isValidPaymentTransaction(action.payload.transaction)
        || state.financialTransactions.some(item => item.id === action.payload.transaction.id)
      ) return state
      const documentIds = [...new Set([
        ...(Array.isArray(installment.documentIds) ? installment.documentIds : []),
        ...(Array.isArray(action.payload.transaction.documentIds) ? action.payload.transaction.documentIds : []),
        ...(action.payload.documentIds ?? []),
      ])]
      const transaction = {
        ...action.payload.transaction,
        ...(linkedTransaction && !isValidPaymentTransaction(linkedTransaction)
          ? { id: linkedTransaction.id, createdAt: linkedTransaction.createdAt }
          : {}),
        documentIds,
        updatedAt,
      }
      const paidInstallment: LoanInstallment = {
        ...installment,
        status: 'paid',
        paidAmount: transaction.amount,
        paidDate: transaction.date,
        financialTransactionId: transaction.id,
        documentIds,
        updatedAt,
      }
      return {
        ...state,
        financialTransactions: linkedTransaction && !isValidPaymentTransaction(linkedTransaction)
          ? state.financialTransactions.map(item => item.id === linkedTransaction.id ? transaction : item)
          : [...state.financialTransactions, transaction],
        loanInstallments: installments.map(item => item.id === installment.id ? paidInstallment : item),
        financialCommitments: state.financialCommitments.map(commitment => commitment.loanInstallmentId === installment.id
          ? { ...commitment, status: 'paid', updatedAt }
          : commitment),
        updatedAt,
      }
    }
    case 'ADD_DOCUMENT': return { ...state, documents: [...state.documents, action.payload], updatedAt }
    case 'UPDATE_DOCUMENT': return { ...state, documents: updateById(state.documents, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_DOCUMENT': return { ...state, documents: deleteById(state.documents, action.payload), updatedAt }
    case 'ADD_DOCUMENT_FOLDER': return { ...state, documentFolders: [...state.documentFolders, action.payload], updatedAt }
    case 'ADD_ASSET': return { ...state, assets: [...state.assets, action.payload], updatedAt }
    case 'UPDATE_ASSET': return { ...state, assets: updateById(state.assets, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_ASSET': return { ...state, assets: deleteById(state.assets, action.payload), updatedAt }
    case 'ADD_MAINTENANCE': return { ...state, maintenanceRecords: [...state.maintenanceRecords, action.payload], updatedAt }
    case 'UPDATE_MAINTENANCE': return { ...state, maintenanceRecords: updateById(state.maintenanceRecords, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_MAINTENANCE': return { ...state, maintenanceRecords: deleteById(state.maintenanceRecords, action.payload), updatedAt }
    case 'COMPLETE_MAINTENANCE': return { ...state, maintenanceRecords: updateById(state.maintenanceRecords, action.payload.id, { status: 'completed', completedDate: action.payload.completedDate ?? updatedAt.slice(0, 10) }, updatedAt), updatedAt }
    case 'ADD_MAINTENANCE_ROUTINE': return { ...state, maintenanceRoutines: [...state.maintenanceRoutines, action.payload], updatedAt }
    case 'UPDATE_MAINTENANCE_ROUTINE': return { ...state, maintenanceRoutines: updateById(state.maintenanceRoutines, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_MAINTENANCE_ROUTINE': return state.maintenanceRoutines.some(item => item.id === action.payload)
      ? { ...state, maintenanceRoutines: deleteById(state.maintenanceRoutines, action.payload), updatedAt }
      : state
    case 'ADD_ROOM': return { ...state, rooms: [...state.rooms, action.payload], updatedAt }
    case 'UPDATE_ROOM': return { ...state, rooms: updateById(state.rooms, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'ARCHIVE_ROOM': return { ...state, rooms: updateById(state.rooms, action.payload, { active: false }, updatedAt), updatedAt }
  }
}
