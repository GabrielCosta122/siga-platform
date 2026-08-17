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

export const isValidISODate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export const formatFinancialDate = (value: unknown, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' }) =>
  typeof value === 'string' && isValidISODate(value) ? new Intl.DateTimeFormat('pt-BR', options).format(new Date(`${value}T12:00:00`)) : 'Data não disponível'
