import readExcelFile from 'read-excel-file/browser'
import type { FinancialCommitment, FinancialLoan, LoanInstallment } from '@/domain/types'
import type { ManualLoanSchedule } from './loan-schedule'

export type FinancingChargeRow = {
  amount: number
  dueDate: string
  rowNumber: number
}

export type FinancingChargesImportResult = {
  charges: FinancingChargeRow[]
  ignoredRows: number
  sheetName: string
}

export type FinancingChargesSheet = {
  sheet: string
  data: unknown[][]
}

const normalizeHeader = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')

const isDueDateHeader = (value: unknown) => normalizeHeader(value) === 'vencimento'
const isChargeAmountHeader = (value: unknown) => ['encargo', 'valor encargo'].includes(normalizeHeader(value))

const toISODate = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear()
    const month = String(value.getUTCMonth() + 1).padStart(2, '0')
    const day = String(value.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  let year: number
  let month: number
  let day: number
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(normalized)
  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized)
  if (isoMatch) [, year, month, day] = isoMatch.map(Number)
  else if (brMatch) [, day, month, year] = brMatch.map(Number)
  else return null
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    : null
}

const toAmount = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null
  if (typeof value !== 'string' || !value.trim()) return null
  const compact = value.replace(/R\$/gi, '').replace(/\s/g, '')
  const normalized = compact.includes(',') ? compact.replace(/\./g, '').replace(',', '.') : compact
  const amount = Number(normalized)
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null
}

export const financingChargeId = (dueDate: string, amount: number) =>
  `financing-charge-${dueDate}-${Math.round(amount * 100)}`

export function parseFinancingChargesSheets(sheets: FinancingChargesSheet[]): FinancingChargesImportResult {
  for (const { sheet, data } of sheets) {
    const headerIndex = data.findIndex(row => row.some(isDueDateHeader) && row.some(isChargeAmountHeader))
    if (headerIndex < 0) continue
    const header = data[headerIndex]
    const dueDateIndex = header.findIndex(isDueDateHeader)
    const amountIndex = header.findIndex(isChargeAmountHeader)
    const charges: FinancingChargeRow[] = []
    let ignoredRows = 0

    data.slice(headerIndex + 1).forEach((row, index) => {
      if (!row.some(value => value !== null && value !== '')) return
      const dueDate = toISODate(row[dueDateIndex])
      const amount = toAmount(row[amountIndex])
      if (!dueDate || amount === null) {
        ignoredRows += 1
        return
      }
      charges.push({ dueDate, amount, rowNumber: headerIndex + index + 2 })
    })

    if (!charges.length) throw new Error('A planilha não contém cobranças válidas nas colunas Vencimento e Encargo.')
    return { charges, ignoredRows, sheetName: sheet }
  }
  throw new Error('Não encontrei uma aba com as colunas Vencimento e Encargo (ou Valor Encargo).')
}

export async function readFinancingCharges(file: File): Promise<FinancingChargesImportResult> {
  return parseFinancingChargesSheets(await readExcelFile(file))
}


export type ImportedFinancingScheduleInput = {
  propertyId: string
  title: string
  institution: string
  charges: FinancingChargeRow[]
}

const stableHash = (value: string) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export const financingImportId = (propertyId: string, charges: FinancingChargeRow[]) => {
  const signature = [...charges]
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.amount - right.amount)
    .map(item => `${item.dueDate}:${Math.round(item.amount * 100)}`)
    .join('|')
  return `financing-import-${stableHash(`${propertyId}|${signature}`)}`
}

export function createImportedFinancingSchedule(
  input: ImportedFinancingScheduleInput,
  now = new Date(),
): ManualLoanSchedule | null {
  const propertyId = input.propertyId.trim()
  const title = input.title.trim()
  const rawInstitution = input.institution.trim()
  const institution = rawInstitution.toLocaleLowerCase('pt-BR') === 'caixa' ? 'caixa' : rawInstitution
  const charges = [...input.charges]
    .filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate) && Number.isFinite(item.amount) && item.amount > 0)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.rowNumber - right.rowNumber)
  if (!propertyId || !title || !institution || charges.length === 0) return null

  const uniqueKeys = new Set(charges.map(item => financingChargeId(item.dueDate, item.amount)))
  if (uniqueKeys.size !== charges.length) return null

  const createdAt = now.toISOString()
  const today = createdAt.slice(0, 10)
  const loanId = financingImportId(propertyId, charges)
  const installmentCount = charges.length
  const loan: FinancialLoan = {
    id: loanId,
    propertyId,
    title,
    institution,
    contractNumber: null,
    startDate: null,
    firstDueDate: charges[0].dueDate,
    expectedEndDate: charges.at(-1)?.dueDate ?? null,
    originalAmount: null,
    financedAmount: null,
    initialBalance: null,
    currentBalance: null,
    installmentCount,
    interestRateAnnual: null,
    amortizationSystem: 'UNKNOWN',
    status: 'active',
    notes: 'Cronograma importado de planilha XLSX. Os valores correspondem à coluna Encargo.',
    createdAt,
    updatedAt: createdAt,
  }

  const installments: LoanInstallment[] = charges.map((charge, index) => ({
    id: `${loanId}-installment-${index + 1}`,
    loanId,
    installmentNumber: index + 1,
    dueDate: charge.dueDate,
    expectedAmount: charge.amount,
    expectedPrincipal: null,
    expectedInterest: null,
    expectedInsurance: null,
    expectedFees: charge.amount,
    paidAmount: null,
    paidDate: null,
    balanceBefore: null,
    balanceAfter: null,
    status: charge.dueDate < today ? 'overdue' : 'upcoming',
    financialTransactionId: null,
    documentIds: [],
    source: 'caixa_import',
    createdAt,
    updatedAt: createdAt,
  }))
  const commitments: FinancialCommitment[] = installments.map(installment => ({
    id: `${loanId}-commitment-${installment.installmentNumber}`,
    title,
    amount: installment.expectedAmount!,
    dueDate: installment.dueDate,
    status: installment.status === 'overdue' ? 'pending' : 'scheduled',
    category: 'Aquisição',
    chapterId: null,
    seriesId: loanId,
    installmentNumber: installment.installmentNumber,
    installmentCount,
    loanId,
    loanInstallmentId: installment.id,
    createdAt,
    updatedAt: createdAt,
  }))
  return { loan, installments, commitments }
}
