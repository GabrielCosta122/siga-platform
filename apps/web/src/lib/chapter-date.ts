import type { Chapter } from '@/domain/types'

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function parseChapterDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const match = value.match(ISO_DATE_PATTERN)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    ? date
    : null
}

function createdAtTimestamp(chapter: Chapter) {
  const timestamp = Date.parse(String(chapter.createdAt ?? ''))
  return Number.isFinite(timestamp) ? timestamp : null
}

function compareCreatedAt(left: Chapter, right: Chapter, direction: 'asc' | 'desc') {
  const leftTimestamp = createdAtTimestamp(left)
  const rightTimestamp = createdAtTimestamp(right)
  if (leftTimestamp !== null && rightTimestamp !== null) {
    if (leftTimestamp !== rightTimestamp) {
      return direction === 'asc' ? leftTimestamp - rightTimestamp : rightTimestamp - leftTimestamp
    }
    return left.id.localeCompare(right.id)
  }
  if (leftTimestamp !== null) return -1
  if (rightTimestamp !== null) return 1
  return left.id.localeCompare(right.id)
}

export function getLocalISODate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const isValidChapterDate = (value: unknown): value is string => parseChapterDate(value) !== null

export function getChapterDateValidationMessage(value: unknown, maximumDate = getLocalISODate()) {
  if (!value) return 'Informe quando este capítulo aconteceu.'
  if (!isValidChapterDate(value)) return 'Informe uma data válida para este capítulo.'
  if (isValidChapterDate(maximumDate) && value > maximumDate) return 'A data do capítulo não pode estar no futuro.'
  return ''
}

export function formatChapterDateLong(value: unknown) {
  const date = parseChapterDate(value)
  return date
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
    : 'Data não informada'
}

export function formatChapterDateShort(value: unknown) {
  const date = parseChapterDate(value)
  return date
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date).replace('.', '')
    : 'Data não informada'
}

export function formatChapterMonth(value: unknown) {
  const date = parseChapterDate(value)
  if (!date) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(date)
    .replace(/^./, letter => letter.toUpperCase())
}

export function formatChapterTimestamp(value: unknown) {
  const date = typeof value === 'string' ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date).replace('.', '')
    : 'Data não disponível'
}

export function compareChaptersChronologicallyDesc(left: Chapter, right: Chapter) {
  const leftIsValid = isValidChapterDate(left.date)
  const rightIsValid = isValidChapterDate(right.date)
  if (leftIsValid && rightIsValid) {
    const dateOrder = right.date.localeCompare(left.date)
    return dateOrder || compareCreatedAt(left, right, 'desc')
  }
  if (leftIsValid) return -1
  if (rightIsValid) return 1
  return 0
}

export function compareChaptersChronologicallyAsc(left: Chapter, right: Chapter) {
  const leftIsValid = isValidChapterDate(left.date)
  const rightIsValid = isValidChapterDate(right.date)
  if (leftIsValid && rightIsValid) {
    const dateOrder = left.date.localeCompare(right.date)
    return dateOrder || compareCreatedAt(left, right, 'asc')
  }
  if (leftIsValid) return -1
  if (rightIsValid) return 1
  return 0
}
