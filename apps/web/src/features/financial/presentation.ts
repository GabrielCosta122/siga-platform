import { Banknote, Building2, FileText, Hammer, Landmark, Package, WalletCards, Wrench, type LucideIcon } from 'lucide-react'
import type { FinancialCommitment, FinancialTransaction } from '@/domain/types'

export const financialCategories = ['Aquisição', 'Construção', 'Documentação', 'Reforma', 'Mobília', 'Manutenção', 'Outros'] as const
export type FinancialCategory = typeof financialCategories[number]

export const categoryIcons = {
  Aquisição: Landmark,
  Construção: Building2,
  Documentação: FileText,
  Reforma: Hammer,
  Mobília: Package,
  Manutenção: Wrench,
  Outros: WalletCards,
} satisfies Record<FinancialCategory, LucideIcon>

export const transactionStatusLabels = { paid: 'Pago', pending: 'Pendente', scheduled: 'Agendado', cancelled: 'Cancelado' } satisfies Record<FinancialTransaction['status'], string>
export const transactionTypeLabels = { expense: 'Despesa', income: 'Entrada' } satisfies Record<FinancialTransaction['type'], string>
export const commitmentStatusLabels = { pending: 'Próximo', scheduled: 'Agendado', future: 'Futuro', paid: 'Pago', cancelled: 'Cancelado' } satisfies Record<FinancialCommitment['status'], string>

const transactionStatusAliases: Record<string, FinancialTransaction['status']> = { Pago: 'paid', Pendente: 'pending', Agendado: 'scheduled', Cancelado: 'cancelled' }
const commitmentStatusAliases: Record<string, FinancialCommitment['status']> = { Próximo: 'pending', Agendado: 'scheduled', Futuro: 'future', Pago: 'paid', Cancelado: 'cancelled' }
export const normalizeTransactionStatus = (status: unknown): FinancialTransaction['status'] | null => typeof status === 'string' && status in transactionStatusLabels ? status as FinancialTransaction['status'] : transactionStatusAliases[String(status)] ?? null
export const normalizeCommitmentStatus = (status: unknown): FinancialCommitment['status'] | null => typeof status === 'string' && status in commitmentStatusLabels ? status as FinancialCommitment['status'] : commitmentStatusAliases[String(status)] ?? null
export const getTransactionStatusLabel = (status: unknown) => { const normalized = normalizeTransactionStatus(status); return normalized ? transactionStatusLabels[normalized] : 'Status indisponível' }
export const getCommitmentStatusLabel = (status: unknown) => { const normalized = normalizeCommitmentStatus(status); return normalized ? commitmentStatusLabels[normalized] : 'Status indisponível' }
export const getTransactionTypeLabel = (type: unknown) => type === 'expense' || type === 'income' ? transactionTypeLabels[type] : 'Tipo indisponível'
export const getCategoryIcon = (category: unknown): LucideIcon => categoryIcons[category as FinancialCategory] ?? Banknote
export const getCategoryLabel = (category: unknown) => typeof category === 'string' && category.trim() ? category : 'Outros'

export function parseCurrencyBRL(value: string) {
  const cleaned = value.replace(/[^\d,.-]/g, '').trim()
  if (!cleaned) return Number.NaN
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  const normalized = lastComma > lastDot ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '')
  return Number(normalized)
}

/**
 * Parses a complete monetary input without silently discarding unexpected
 * characters. Accepts plain numbers, Brazilian grouping/decimal separators,
 * an optional `R$` prefix and a dot decimal with up to two places.
 */
export function parseCurrencyBRLStrict(value: string) {
  const cleaned = value.trim().replace(/^R\$\s*/i, '').replace(/\s/g, '')
  if (!cleaned) return Number.NaN
  if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(cleaned)) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.'))
  }
  if (/^-?\d+(?:,\d{1,2})?$/.test(cleaned)) return Number(cleaned.replace(',', '.'))
  if (/^-?\d+\.\d{1,2}$/.test(cleaned)) return Number(cleaned)
  return Number.NaN
}

export const isValidISODate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export const formatFinancialDate = (value: unknown, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' }) =>
  typeof value === 'string' && isValidISODate(value) ? new Intl.DateTimeFormat('pt-BR', options).format(new Date(`${value}T12:00:00`)) : 'Data não disponível'

export const getLocalFinancialDate = (date = new Date()) => {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export type CommitmentSeriesPosition = {
  seriesId: string
  installmentNumber: number
  installmentCount: number
}

export function getCommitmentSeriesPosition(commitment: FinancialCommitment): CommitmentSeriesPosition | null {
  const { seriesId, installmentNumber, installmentCount } = commitment
  if (
    typeof seriesId !== 'string'
    || !seriesId.trim()
    || !Number.isInteger(installmentNumber)
    || !Number.isInteger(installmentCount)
    || Number(installmentNumber) < 1
    || Number(installmentCount) < 2
    || Number(installmentNumber) > Number(installmentCount)
  ) return null

  return {
    seriesId,
    installmentNumber: Number(installmentNumber),
    installmentCount: Number(installmentCount),
  }
}

export const getCommitmentInstallmentLabel = (commitment: FinancialCommitment) => {
  const position = getCommitmentSeriesPosition(commitment)
  return position ? `${position.installmentNumber} de ${position.installmentCount}` : null
}
