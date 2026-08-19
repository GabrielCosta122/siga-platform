import {
  AirVent,
  Armchair,
  CheckCircle2,
  Clock3,
  CookingPot,
  LampDesk,
  Package,
  Refrigerator,
  ShieldCheck,
  Sofa,
  Table2,
  Trash2,
  Tv,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { Asset, AssetStatus } from '@/domain/types'

type VisualConfig = Readonly<{ label: string; icon: LucideIcon }>

export const assetKinds = ['property', 'inventory'] as const satisfies readonly Asset['kind'][]
export type AssetKind = (typeof assetKinds)[number]

export const assetKindConfig = {
  property: { label: 'Patrimônio', icon: Armchair },
  inventory: { label: 'Inventário', icon: Package },
} satisfies Record<AssetKind, VisualConfig>

export const assetCategories = [
  'Móvel',
  'Eletrodoméstico',
  'Eletrônico',
  'Marcenaria',
  'Revestimento',
  'Acabamento',
  'Equipamento instalado',
  'Decoração',
  'Outros',
] as const
export type AssetCategory = (typeof assetCategories)[number]

export const assetCategoryConfig = {
  Móvel: { label: 'Móvel', icon: Armchair },
  Eletrodoméstico: { label: 'Eletrodoméstico', icon: Refrigerator },
  Eletrônico: { label: 'Eletrônico', icon: Tv },
  Marcenaria: { label: 'Marcenaria', icon: CookingPot },
  Revestimento: { label: 'Revestimento', icon: Armchair },
  Acabamento: { label: 'Acabamento', icon: Table2 },
  'Equipamento instalado': { label: 'Equipamento instalado', icon: AirVent },
  Decoração: { label: 'Decoração', icon: LampDesk },
  Outros: { label: 'Outros', icon: Package },
} satisfies Record<AssetCategory, VisualConfig>

export const assetStatuses = [
  'in_use',
  'stored',
  'maintenance',
  'borrowed',
  'awaiting_delivery',
  'discarded',
] as const satisfies readonly AssetStatus[]
export type CanonicalAssetStatus = (typeof assetStatuses)[number]

export const assetStatusConfig = {
  in_use: { label: 'Em uso', icon: CheckCircle2 },
  stored: { label: 'Armazenado', icon: Package },
  maintenance: { label: 'Em manutenção', icon: Wrench },
  borrowed: { label: 'Emprestado', icon: Armchair },
  awaiting_delivery: { label: 'Aguardando entrega', icon: Clock3 },
  discarded: { label: 'Descartado', icon: Trash2 },
} satisfies Record<CanonicalAssetStatus, VisualConfig>

export const normalizeAssetText = (value: unknown) =>
  typeof value === 'string'
    ? value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('pt-BR')
    : ''

const kindAliases: Readonly<Record<string, AssetKind>> = {
  property: 'property',
  patrimonio: 'property',
  imovel: 'property',
  inventory: 'inventory',
  inventario: 'inventory',
}

const categoryAliases: Readonly<Record<string, AssetCategory>> = {
  movel: 'Móvel',
  moveis: 'Móvel',
  furniture: 'Móvel',
  eletrodomestico: 'Eletrodoméstico',
  eletrodomesticos: 'Eletrodoméstico',
  appliance: 'Eletrodoméstico',
  appliances: 'Eletrodoméstico',
  eletronico: 'Eletrônico',
  eletronicos: 'Eletrônico',
  electronics: 'Eletrônico',
  marcenaria: 'Marcenaria',
  carpentry: 'Marcenaria',
  revestimento: 'Revestimento',
  revestimentos: 'Revestimento',
  flooring: 'Revestimento',
  acabamento: 'Acabamento',
  acabamentos: 'Acabamento',
  finish: 'Acabamento',
  'equipamento instalado': 'Equipamento instalado',
  'equipamentos instalados': 'Equipamento instalado',
  'installed equipment': 'Equipamento instalado',
  decoracao: 'Decoração',
  decoration: 'Decoração',
  outro: 'Outros',
  outros: 'Outros',
  other: 'Outros',
}

const statusAliases: Readonly<Record<string, CanonicalAssetStatus>> = {
  'em uso': 'in_use',
  ativo: 'in_use',
  active: 'in_use',
  armazenado: 'stored',
  guardado: 'stored',
  archived: 'stored',
  arquivado: 'stored',
  'em manutencao': 'maintenance',
  maintenance: 'maintenance',
  manutencao: 'maintenance',
  emprestado: 'borrowed',
  borrowed: 'borrowed',
  'aguardando entrega': 'awaiting_delivery',
  draft: 'awaiting_delivery',
  rascunho: 'awaiting_delivery',
  descartado: 'discarded',
  discarded: 'discarded',
  deleted: 'discarded',
  excluido: 'discarded',
}

const isAssetKind = (value: string): value is AssetKind => (assetKinds as readonly string[]).includes(value)
const isAssetCategory = (value: string): value is AssetCategory => (assetCategories as readonly string[]).includes(value)
const isCanonicalAssetStatus = (value: string): value is CanonicalAssetStatus => (assetStatuses as readonly string[]).includes(value)

export function normalizeAssetKind(kind: unknown): AssetKind | null {
  if (typeof kind === 'string' && isAssetKind(kind)) return kind
  return kindAliases[normalizeAssetText(kind)] ?? null
}

export function normalizeAssetCategory(category: unknown): AssetCategory | null {
  if (typeof category === 'string' && isAssetCategory(category)) return category
  return categoryAliases[normalizeAssetText(category)] ?? null
}

export function normalizeAssetStatus(status: unknown): CanonicalAssetStatus | null {
  if (typeof status === 'string' && isCanonicalAssetStatus(status)) return status
  return statusAliases[normalizeAssetText(status)] ?? null
}

export const getAssetKindLabel = (kind: unknown) => {
  const normalized = normalizeAssetKind(kind)
  return normalized ? assetKindConfig[normalized].label : 'Tipo indisponível'
}

export const getAssetCategoryLabel = (category: unknown) => {
  const normalized = normalizeAssetCategory(category)
  if (normalized) return assetCategoryConfig[normalized].label
  return typeof category === 'string' && category.trim() ? category.trim() : 'Outros'
}

export const getAssetStatusLabel = (status: unknown) => {
  const normalized = normalizeAssetStatus(status)
  return normalized ? assetStatusConfig[normalized].label : 'Status indisponível'
}

export const getAssetKindIcon = (kind: unknown): LucideIcon => {
  const normalized = normalizeAssetKind(kind)
  return normalized ? assetKindConfig[normalized].icon : Package
}

export const getAssetCategoryIcon = (category: unknown): LucideIcon => {
  const normalized = normalizeAssetCategory(category)
  return normalized ? assetCategoryConfig[normalized].icon : Package
}

export const getAssetStatusIcon = (status: unknown): LucideIcon => {
  const normalized = normalizeAssetStatus(status)
  return normalized ? assetStatusConfig[normalized].icon : Package
}

const assetNameIconRules = [
  { terms: ['ar condicionado'], icon: AirVent },
  { terms: ['geladeira', 'refrigerador'], icon: Refrigerator },
  { terms: ['armario', 'marcenaria'], icon: CookingPot },
  { terms: ['sofa'], icon: Sofa },
  { terms: ['televisao', 'tv'], icon: Tv },
  { terms: ['mesa', 'bancada'], icon: Table2 },
  { terms: ['cadeira', 'escritorio'], icon: LampDesk },
] satisfies ReadonlyArray<{ terms: readonly string[]; icon: LucideIcon }>

export function getAssetIcon(category: unknown, name?: unknown): LucideIcon {
  const normalizedName = normalizeAssetText(name)
  const itemRule = assetNameIconRules.find(rule => rule.terms.some(term => normalizedName.includes(term)))
  return itemRule?.icon ?? getAssetCategoryIcon(category)
}

export const getAssetIconForItem = (asset: Pick<Asset, 'category' | 'name'>): LucideIcon =>
  getAssetIcon(asset.category, asset.name)

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000

function parseAssetDate(value: unknown): Date | null {
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
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null
}

export const isValidAssetDate = (value: unknown) => parseAssetDate(value) !== null

const formatParsedDate = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(date)

export const formatAssetDate = (value: unknown) => {
  const date = parseAssetDate(value)
  return date ? formatParsedDate(date, { day: '2-digit', month: 'long', year: 'numeric' }) : 'Data não disponível'
}

export const formatAssetDateShort = (value: unknown) => {
  const date = parseAssetDate(value)
  if (!date) return 'Data não disponível'
  return formatParsedDate(date, { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/\s+de\s+/g, ' ')
    .replace('.', '')
}

export const formatAssetDateTime = (value: unknown) => {
  const date = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
    : 'Data não disponível'
}

export type AssetWarrantyStatus = 'valid' | 'expiring' | 'expired' | 'unknown'
export const ASSET_WARRANTY_WINDOW_DAYS = 60

export const assetWarrantyStatusConfig = {
  valid: { label: 'Vigente', icon: ShieldCheck },
  expiring: { label: 'Vence em breve', icon: Clock3 },
  expired: { label: 'Vencida', icon: Wrench },
  unknown: { label: 'Sem informação', icon: Package },
} satisfies Record<AssetWarrantyStatus, VisualConfig>

const normalizeWindowDays = (windowDays: number) =>
  Number.isFinite(windowDays) && windowDays >= 0 ? Math.floor(windowDays) : ASSET_WARRANTY_WINDOW_DAYS

export function getWarrantyDaysRemaining(warrantyEndDate: unknown, referenceDate: unknown = new Date()): number | null {
  const warranty = parseAssetDate(warrantyEndDate)
  const reference = parseAssetDate(referenceDate)
  return warranty && reference ? Math.round((warranty.getTime() - reference.getTime()) / DAY_IN_MILLISECONDS) : null
}

export function getAssetWarrantyStatus(
  warrantyEndDate: unknown,
  referenceDate: unknown = new Date(),
  windowDays = ASSET_WARRANTY_WINDOW_DAYS,
): AssetWarrantyStatus {
  const daysRemaining = getWarrantyDaysRemaining(warrantyEndDate, referenceDate)
  if (daysRemaining === null) return 'unknown'
  if (daysRemaining < 0) return 'expired'
  return daysRemaining <= normalizeWindowDays(windowDays) ? 'expiring' : 'valid'
}

export const getAssetWarrantyStatusLabel = (
  warrantyEndDate: unknown,
  referenceDate: unknown = new Date(),
  windowDays = ASSET_WARRANTY_WINDOW_DAYS,
) => assetWarrantyStatusConfig[getAssetWarrantyStatus(warrantyEndDate, referenceDate, windowDays)].label

export function formatAssetWarranty(
  warrantyEndDate: unknown,
  referenceDate: unknown = new Date(),
  windowDays = ASSET_WARRANTY_WINDOW_DAYS,
) {
  const warranty = parseAssetDate(warrantyEndDate)
  const daysRemaining = getWarrantyDaysRemaining(warrantyEndDate, referenceDate)
  if (!warranty || daysRemaining === null) return 'Sem informação'
  if (daysRemaining < 0) return `Vencida em ${formatParsedDate(warranty, { month: 'long', year: 'numeric' })}`
  if (daysRemaining === 0) return 'Vence hoje'
  if (daysRemaining === 1) return 'Vence amanhã'
  if (daysRemaining <= normalizeWindowDays(windowDays)) return `Vence em ${daysRemaining} dias`
  return formatParsedDate(warranty, { month: 'long', year: 'numeric' })
}

export const getSafeAssetValue = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0

export function parseAssetValueBRL(value: string) {
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

export function matchesAssetSearch(asset: Pick<Asset, 'brand' | 'description' | 'model' | 'name' | 'serialNumber'>, query: unknown) {
  const normalizedQuery = normalizeAssetText(query)
  if (!normalizedQuery) return true
  return [asset.name, asset.description, asset.brand, asset.model, asset.serialNumber]
    .some(value => normalizeAssetText(value).includes(normalizedQuery))
}
