import type {
  EntityId,
  FinancialCommitment,
  ISODateString,
  ISODateTimeString,
} from '@/domain/types'
import { createEntityId } from '@/lib/utils'

export const MIN_MONTHLY_INSTALLMENTS = 2
export const MAX_MONTHLY_INSTALLMENTS = 360

const commitmentStatuses = new Set<FinancialCommitment['status']>([
  'pending',
  'scheduled',
  'future',
  'paid',
  'cancelled',
])

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

type DateParts = {
  year: number
  month: number
  day: number
}

function getDaysInMonth(year: number, month: number) {
  if (month === 2) {
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    return isLeapYear ? 29 : 28
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function parseISODate(value: unknown): DateParts | null {
  if (typeof value !== 'string') return null
  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1 || month < 1 || month > 12 || day < 1) return null

  const lastDay = getDaysInMonth(year, month)
  return day <= lastDay ? { year, month, day } : null
}

function formatISODate({ year, month, day }: DateParts): ISODateString {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Adds calendar months while clamping the original day to the target month's
 * final valid day. Using the original date for each offset preserves sequences
 * such as Jan 31 -> Feb 28 -> Mar 31 instead of drifting to Mar 28.
 */
export function addMonthsClamped(date: ISODateString, monthOffset: number): ISODateString | null {
  const parts = parseISODate(date)
  if (!parts || !Number.isSafeInteger(monthOffset)) return null

  const zeroBasedTargetMonth = parts.month - 1 + monthOffset
  const targetYear = parts.year + Math.floor(zeroBasedTargetMonth / 12)
  const normalizedTargetMonth = ((zeroBasedTargetMonth % 12) + 12) % 12
  if (targetYear < 1 || targetYear > 9999) return null

  const targetMonth = normalizedTargetMonth + 1
  const lastDay = getDaysInMonth(targetYear, targetMonth)
  return formatISODate({
    year: targetYear,
    month: targetMonth,
    day: Math.min(parts.day, lastDay),
  })
}

export interface MonthlyCommitmentSeriesInput {
  title: string
  amount: number
  firstDueDate: ISODateString
  installmentCount: number
  status: FinancialCommitment['status']
  category: string
  chapterId?: EntityId | null
}

export interface MonthlyCommitmentSeriesOptions {
  /** Injectable factories keep focused tests deterministic. */
  createId?: (prefix?: string) => EntityId
  now?: () => ISODateTimeString
}

/**
 * Builds independent commitments for a monthly series. Invalid input produces
 * an empty list so malformed persisted/form values cannot create a partial
 * series or crash the caller.
 */
export function createMonthlyCommitmentSeries(
  input: MonthlyCommitmentSeriesInput,
  options: MonthlyCommitmentSeriesOptions = {},
): FinancialCommitment[] {
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const category = typeof input.category === 'string' ? input.category.trim() : ''
  const count = input.installmentCount
  if (
    !title
    || !category
    || !Number.isFinite(input.amount)
    || input.amount <= 0
    || !Number.isInteger(count)
    || count < MIN_MONTHLY_INSTALLMENTS
    || count > MAX_MONTHLY_INSTALLMENTS
    || !commitmentStatuses.has(input.status)
    || !parseISODate(input.firstDueDate)
  ) return []

  const createId = options.createId ?? createEntityId
  const createdAt = options.now?.() ?? new Date().toISOString()
  const seriesId = createId('series')
  const commitments: FinancialCommitment[] = []

  for (let index = 0; index < count; index += 1) {
    const dueDate = addMonthsClamped(input.firstDueDate, index)
    if (!dueDate) return []

    commitments.push({
      id: createId('commitment'),
      title,
      amount: input.amount,
      dueDate,
      status: input.status,
      category,
      chapterId: input.chapterId ?? null,
      seriesId,
      installmentNumber: index + 1,
      installmentCount: count,
      createdAt,
      updatedAt: createdAt,
    })
  }

  return commitments
}
