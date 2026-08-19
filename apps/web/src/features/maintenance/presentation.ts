import {
  Hammer,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type {
  MaintenancePriority,
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
  StandardMaintenanceFrequency,
} from '@/domain/types'
import type { AppState } from '@/store/app-state'
import { formatCurrencyBRL } from '@/lib/utils'

type VisualConfig = Readonly<{ label: string; icon: LucideIcon }>

export type { MaintenancePriority, MaintenanceStatus, MaintenanceType } from '@/domain/types'
export type MaintenanceFrequency = StandardMaintenanceFrequency

export const maintenanceTypes = [
  'preventive',
  'corrective',
  'inspection',
  'installation',
  'technical_cleaning',
] as const satisfies readonly MaintenanceType[]

export const maintenanceTypeConfig = {
  preventive: { label: 'Preventiva', icon: ShieldCheck },
  corrective: { label: 'Corretiva', icon: Wrench },
  inspection: { label: 'Inspeção', icon: Search },
  installation: { label: 'Instalação', icon: Hammer },
  technical_cleaning: { label: 'Limpeza técnica', icon: Sparkles },
} satisfies Record<MaintenanceType, VisualConfig>

export const maintenanceStatuses = [
  'planned',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
] as const satisfies readonly MaintenanceStatus[]

export const maintenanceStatusConfig = {
  planned: { label: 'Planejada' },
  scheduled: { label: 'Agendada' },
  in_progress: { label: 'Em andamento' },
  completed: { label: 'Concluída' },
  cancelled: { label: 'Cancelada' },
} satisfies Record<MaintenanceStatus, Readonly<{ label: string }>>

export const maintenancePriorities = ['low', 'medium', 'high'] as const satisfies readonly MaintenancePriority[]

export const maintenancePriorityConfig = {
  low: { label: 'Baixa' },
  medium: { label: 'Média' },
  high: { label: 'Alta' },
} satisfies Record<MaintenancePriority, Readonly<{ label: string }>>

export const maintenanceFrequencies = ['monthly', 'every_90_days', 'semiannual', 'annual'] as const satisfies readonly StandardMaintenanceFrequency[]

export const maintenanceFrequencyConfig = {
  monthly: { label: 'Mensal' },
  every_90_days: { label: 'A cada 90 dias' },
  semiannual: { label: 'Semestral' },
  annual: { label: 'Anual' },
} satisfies Record<MaintenanceFrequency, Readonly<{ label: string }>>

export const normalizeMaintenanceText = (value: unknown) =>
  typeof value === 'string'
    ? value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('pt-BR')
    : ''

export const getSafeMaintenanceText = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const typeAliases: Readonly<Record<string, MaintenanceType>> = {
  preventive: 'preventive',
  preventiva: 'preventive',
  preventivo: 'preventive',
  corrective: 'corrective',
  corretiva: 'corrective',
  corretivo: 'corrective',
  inspection: 'inspection',
  inspecao: 'inspection',
  installation: 'installation',
  instalacao: 'installation',
  'technical cleaning': 'technical_cleaning',
  'limpeza tecnica': 'technical_cleaning',
}

const statusAliases: Readonly<Record<string, MaintenanceStatus>> = {
  planned: 'planned',
  planejada: 'planned',
  planejado: 'planned',
  overdue: 'planned',
  atrasada: 'planned',
  atrasado: 'planned',
  upcoming: 'scheduled',
  proxima: 'scheduled',
  proximo: 'scheduled',
  scheduled: 'scheduled',
  agendada: 'scheduled',
  agendado: 'scheduled',
  'in progress': 'in_progress',
  'em andamento': 'in_progress',
  completed: 'completed',
  concluida: 'completed',
  concluido: 'completed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  cancelada: 'cancelled',
  cancelado: 'cancelled',
}

const priorityAliases: Readonly<Record<string, MaintenanceRecord['priority']>> = {
  low: 'low',
  baixa: 'low',
  baixo: 'low',
  medium: 'medium',
  media: 'medium',
  medio: 'medium',
  high: 'high',
  alta: 'high',
  alto: 'high',
}

const frequencyAliases: Readonly<Record<string, MaintenanceFrequency>> = {
  monthly: 'monthly',
  mensal: 'monthly',
  'every 90 days': 'every_90_days',
  'a cada 90 dias': 'every_90_days',
  trimestral: 'every_90_days',
  semiannual: 'semiannual',
  semestral: 'semiannual',
  annual: 'annual',
  anual: 'annual',
}

export const normalizeMaintenanceType = (value: unknown): MaintenanceType | null =>
  typeAliases[normalizeMaintenanceText(value)] ?? null

export const normalizeMaintenanceStatus = (value: unknown): MaintenanceStatus | null =>
  statusAliases[normalizeMaintenanceText(value)] ?? null

export const normalizeMaintenancePriority = (value: unknown): MaintenanceRecord['priority'] | null =>
  priorityAliases[normalizeMaintenanceText(value)] ?? null

export const normalizeMaintenanceFrequency = (value: unknown): MaintenanceFrequency | null =>
  frequencyAliases[normalizeMaintenanceText(value)] ?? null

export const getMaintenanceTypeLabel = (value: unknown) => {
  const normalized = normalizeMaintenanceType(value)
  if (normalized) return maintenanceTypeConfig[normalized].label
  return typeof value === 'string' && value.trim() ? value.trim() : 'Tipo indisponível'
}

export const getMaintenanceStatusLabel = (value: unknown) => {
  const normalized = normalizeMaintenanceStatus(value)
  return normalized ? maintenanceStatusConfig[normalized].label : 'Status indisponível'
}

export const getMaintenancePriorityLabel = (value: unknown) => {
  const normalized = normalizeMaintenancePriority(value)
  return normalized ? maintenancePriorityConfig[normalized].label : 'Prioridade indisponível'
}

export const getMaintenanceFrequencyLabel = (value: unknown) => {
  const normalized = normalizeMaintenanceFrequency(value)
  if (normalized) return maintenanceFrequencyConfig[normalized].label
  return typeof value === 'string' && value.trim() ? value.trim() : 'Frequência não informada'
}

export const getMaintenanceTypeIcon = (value: unknown): LucideIcon => {
  const normalized = normalizeMaintenanceType(value)
  return normalized ? maintenanceTypeConfig[normalized].icon : Wrench
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/

export function parseMaintenanceDate(value: unknown): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()))
  }
  if (typeof value !== 'string') return null
  const match = value.match(ISO_DATE_PATTERN)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? date
    : null
}

export const isValidMaintenanceDate = (value: unknown) => parseMaintenanceDate(value) !== null

const formatParsedDate = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(date)

export const formatMaintenanceDate = (value: unknown) => {
  const date = parseMaintenanceDate(value)
  return date
    ? formatParsedDate(date, { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Data não disponível'
}

export const formatMaintenanceDateShort = (value: unknown) => {
  const date = parseMaintenanceDate(value)
  return date
    ? formatParsedDate(date, { day: '2-digit', month: 'short', year: 'numeric' })
        .replace(/\s+de\s+/g, ' ')
        .replace('.', '')
    : 'Data não disponível'
}

export const formatMaintenanceMonth = (value: unknown) => {
  const date = parseMaintenanceDate(value)
  if (!date) return 'Data não informada'
  const label = formatParsedDate(date, { month: 'long', year: 'numeric' })
  return label.replace(/^./, letter => letter.toLocaleUpperCase('pt-BR'))
}

export const formatMaintenanceDateTime = (value: unknown) => {
  const date = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    : 'Data não disponível'
}

export const getLocalMaintenanceDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const isMaintenanceOverdue = (
  record: Pick<MaintenanceRecord, 'scheduledDate' | 'status'>,
  referenceDate: unknown = getLocalMaintenanceDate(),
) => {
  const scheduled = parseMaintenanceDate(record.scheduledDate)
  const reference = parseMaintenanceDate(referenceDate)
  const status = normalizeMaintenanceStatus(record.status)
  return Boolean(
    scheduled
      && reference
      && status
      && status !== 'completed'
      && status !== 'cancelled'
      && scheduled.getTime() < reference.getTime(),
  )
}

export const isMaintenanceUpcoming = (
  record: Pick<MaintenanceRecord, 'scheduledDate' | 'status'>,
  referenceDate: unknown = getLocalMaintenanceDate(),
  windowDays = 30,
) => {
  const scheduled = parseMaintenanceDate(record.scheduledDate)
  const reference = parseMaintenanceDate(referenceDate)
  const status = normalizeMaintenanceStatus(record.status)
  const safeWindowDays = Number.isFinite(windowDays) && windowDays >= 0 ? Math.floor(windowDays) : 30
  if (!scheduled || !reference || !status || status === 'completed' || status === 'cancelled') return false
  const difference = scheduled.getTime() - reference.getTime()
  return difference >= 0 && difference <= safeWindowDays * 24 * 60 * 60 * 1000
}

export const getMaintenanceDisplayStatus = (
  record: Pick<MaintenanceRecord, 'scheduledDate' | 'status'>,
  referenceDate?: unknown,
) => {
  if (isMaintenanceOverdue(record, referenceDate)) return 'Atrasada'
  const status = normalizeMaintenanceStatus(record.status)
  return status === 'planned' && isMaintenanceUpcoming(record, referenceDate)
    ? 'Próxima'
    : getMaintenanceStatusLabel(record.status)
}

export const getMaintenanceHistoryDate = (
  record: Pick<MaintenanceRecord, 'completedDate' | 'scheduledDate'>,
) => isValidMaintenanceDate(record.completedDate)
  ? record.completedDate
  : isValidMaintenanceDate(record.scheduledDate)
    ? record.scheduledDate
    : null

export const getSafeMaintenanceCost = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null

export const formatMaintenanceCost = (value: unknown) => {
  const amount = getSafeMaintenanceCost(value)
  return amount === null ? 'Sem custo registrado' : formatCurrencyBRL(amount)
}

export function parseMaintenanceCostBRL(value: string) {
  const cleaned = value.replace(/[^\d,.-]/g, '').trim()
  if (!cleaned) return Number.NaN
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  const dotIsThousandsSeparator = lastComma < 0 && /^-?\d{1,3}(?:\.\d{3})+$/.test(cleaned)
  const normalized = lastComma > lastDot
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : dotIsThousandsSeparator
      ? cleaned.replace(/\./g, '')
      : cleaned.replace(/,/g, '')
  return Number(normalized)
}

export const getMaintenanceLocationLabel = (
  record: Pick<MaintenanceRecord, 'assetId' | 'roomId'>,
  state: Pick<AppState, 'assets' | 'rooms'>,
) => {
  const asset = state.assets.find(item => item.id === record.assetId)
  if (asset) return getSafeMaintenanceText(asset.name, 'Item sem nome')
  if (record.assetId) return 'Item relacionado não disponível'
  const room = state.rooms.find(item => item.id === record.roomId)
  if (room) return getSafeMaintenanceText(room.name, 'Ambiente sem nome')
  if (record.roomId) return 'Ambiente relacionado não disponível'
  return 'Geral'
}
