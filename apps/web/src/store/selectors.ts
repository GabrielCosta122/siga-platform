import type { AppState } from './app-state'
import { compareChaptersChronologicallyAsc, compareChaptersChronologicallyDesc, isValidChapterDate } from '@/lib/chapter-date'
import type { MaintenanceFrequency, MaintenancePriority, MaintenanceRecord, MaintenanceStatus, MaintenanceType } from '@/domain/types'

export const getPublishedChapters = (state: AppState) => state.chapters.filter(chapter => chapter.status === 'published')
export const getDraftChapters = (state: AppState) => state.chapters.filter(chapter => chapter.status === 'draft')
export const getImportantChapters = (state: AppState) => state.chapters.filter(chapter => chapter.important)
export const getChapterById = (state: AppState, id: string) => state.chapters.find(chapter => chapter.id === id)
export const getPublishedChaptersChronologically = (state: AppState) => [...getPublishedChapters(state)].sort(compareChaptersChronologicallyDesc)
export const getRecentChapters = (state: AppState, limit = 3) => getPublishedChaptersChronologically(state)
  .filter(chapter => isValidChapterDate(chapter.date))
  .slice(0, Math.max(0, limit))
export const getAdjacentPublishedChapters = (state: AppState, chapterId: string) => {
  const chapters = getPublishedChapters(state)
    .filter(chapter => isValidChapterDate(chapter.date))
    .sort(compareChaptersChronologicallyAsc)
  const index = chapters.findIndex(chapter => chapter.id === chapterId)
  return index < 0
    ? { previous: undefined, next: undefined }
    : { previous: chapters[index - 1], next: chapters[index + 1] }
}
export const getDocumentsByChapterId = (state: AppState, chapterId: string) => state.documents.filter(document => document.chapterId === chapterId)
export const getDocumentById = (state: AppState, id: string) => state.documents.find(document => document.id === id)
export const getImportantDocuments = (state: AppState) => state.documents.filter(document => document.important)
export const getDocumentsByFolderId = (state: AppState, folderId: string) => state.documents.filter(document => document.folderId === folderId)
export const getTransactionsByChapterId = (state: AppState, chapterId: string) => state.financialTransactions.filter(transaction => transaction.chapterId === chapterId)
export const getAssetsByRoomId = (state: AppState, roomId: string) => state.assets.filter(asset => asset.roomId === roomId)
export const getAssetById = (state: AppState, id: string) => state.assets.find(asset => asset.id === id)
const normalizeAssetKindForSelector = (value: unknown) => typeof value === 'string'
  ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
  : ''
export const getAssetsByKind = (state: AppState, kind: AppState['assets'][number]['kind']) => state.assets.filter(asset => {
  const normalized = normalizeAssetKindForSelector(asset.kind)
  return normalized === kind || (kind === 'property' && ['patrimonio', 'imovel'].includes(normalized)) || (kind === 'inventory' && normalized === 'inventario')
})
export const getActiveRooms = (state: AppState) => [...state.rooms]
  .filter(room => room.active)
  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'pt-BR'))
export const getAssetsByChapterId = (state: AppState, chapterId: string) => state.assets.filter(asset => asset.chapterId === chapterId)
export const getAssetsByFinancialTransactionId = (state: AppState, financialTransactionId: string) => state.assets.filter(asset => asset.financialTransactionId === financialTransactionId)
export const getMaintenanceByAssetId = (state: AppState, assetId: string) => state.maintenanceRecords.filter(record => record.assetId === assetId)
export const getMaintenanceById = (state: AppState, id: string) => state.maintenanceRecords.find(record => record.id === id)
export const getMaintenanceByRoomId = (state: AppState, roomId: string) => state.maintenanceRecords.filter(record => record.roomId === roomId)
export const getMaintenanceByChapterId = (state: AppState, chapterId: string) => state.maintenanceRecords.filter(record => record.chapterId === chapterId)
const validAmount = (amount: unknown) => typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? amount : 0
const validISODate = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const timestamp = Date.parse(`${value}T00:00:00.000Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}
const isPaidExpense = (status: unknown, type: unknown) => (status === 'paid' || status === 'Pago') && (type === 'expense' || type === 'Despesa')
const isOpenCommitment = (status: unknown) => ['pending', 'scheduled', 'future', 'Próximo', 'Agendado', 'Futuro'].includes(String(status))
export const getPaidAmount = (state: AppState) => state.financialTransactions.filter(item => isPaidExpense(item.status, item.type)).reduce((total, item) => total + validAmount(item.amount), 0)
export const getTotalInvested = getPaidAmount
export const getFutureCommitments = (state: AppState) => state.financialCommitments.filter(item => isOpenCommitment(item.status)).reduce((total, item) => total + validAmount(item.amount), 0)
export const getNextFinancialCommitment = (state: AppState, fromDate = new Date().toISOString().slice(0, 10)) =>
  [...state.financialCommitments]
    .filter(item => isOpenCommitment(item.status) && validISODate(item.dueDate) && item.dueDate >= fromDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]

export type InvestmentEvolutionPoint = { month: string; monthKey: string; monthlyAmount: number; accumulatedAmount: number }
export const getInvestmentEvolution = (state: AppState): InvestmentEvolutionPoint[] => {
  const totals = state.financialTransactions
    .filter(item => isPaidExpense(item.status, item.type) && validISODate(item.date))
    .reduce<Record<string, number>>((months, item) => {
      const monthKey = item.date.slice(0, 7)
      months[monthKey] = (months[monthKey] ?? 0) + validAmount(item.amount)
      return months
    }, {})
  let accumulatedAmount = 0
  return Object.entries(totals).sort(([a], [b]) => a.localeCompare(b)).map(([monthKey, monthlyAmount]) => {
    accumulatedAmount += monthlyAmount
    const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${monthKey}-01T12:00:00`)).replace('.', '')
    return { month: month.replace(/^./, letter => letter.toUpperCase()), monthKey, monthlyAmount, accumulatedAmount }
  })
}

export type InvestmentDistributionItem = { category: string; amount: number; percent: number }
export const getInvestmentDistribution = (state: AppState): InvestmentDistributionItem[] => {
  const totals = state.financialTransactions
    .filter(item => isPaidExpense(item.status, item.type))
    .reduce<Record<string, number>>((categories, item) => {
      const category = item.category?.trim() || 'Outros'
      categories[category] = (categories[category] ?? 0) + validAmount(item.amount)
      return categories
    }, {})
  const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0)
  return Object.entries(totals).map(([category, amount]) => ({ category, amount, percent: total > 0 ? (amount / total) * 100 : 0 })).sort((a, b) => b.amount - a.amount)
}

const discardedAssetStatuses = new Set(['deleted', 'discarded', 'descartado', 'excluido'])
const isCurrentAsset = (status: unknown) => !discardedAssetStatuses.has(
  typeof status === 'string'
    ? status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_-]+/g, ' ').trim().toLowerCase()
    : '',
)
const validAssetValue = (value: number) => Number.isFinite(value) && value >= 0 ? value : 0
const getLocalISODate = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const normalizeMaintenanceToken = (value: unknown) => typeof value === 'string'
  ? value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
  : ''

const maintenanceTypeAliases: Record<string, MaintenanceType> = {
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

const maintenanceStatusAliases: Record<string, MaintenanceStatus> = {
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

const maintenancePriorityAliases: Record<string, MaintenancePriority> = {
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

const maintenanceFrequencyAliases: Record<string, MaintenanceFrequency> = {
  monthly: 'monthly',
  mensal: 'monthly',
  'every 90 days': 'every_90_days',
  'a cada 90 dias': 'every_90_days',
  quarterly: 'every_90_days',
  trimestral: 'every_90_days',
  semiannual: 'semiannual',
  'semi anual': 'semiannual',
  semestral: 'semiannual',
  'a cada 6 meses': 'semiannual',
  annual: 'annual',
  anual: 'annual',
}

export const normalizeMaintenanceType = (value: unknown) => maintenanceTypeAliases[normalizeMaintenanceToken(value)]
export const normalizeMaintenanceStatus = (value: unknown) => maintenanceStatusAliases[normalizeMaintenanceToken(value)]
export const normalizeMaintenancePriority = (value: unknown) => maintenancePriorityAliases[normalizeMaintenanceToken(value)]
export const normalizeMaintenanceFrequency = (value: unknown) => maintenanceFrequencyAliases[normalizeMaintenanceToken(value)]

const isOpenMaintenance = (record: MaintenanceRecord) => {
  const status = normalizeMaintenanceStatus(record.status)
  return !!status && status !== 'completed' && status !== 'cancelled'
}

const compareMaintenanceDateAsc = (a: MaintenanceRecord, b: MaintenanceRecord) =>
  a.scheduledDate.localeCompare(b.scheduledDate) || a.id.localeCompare(b.id)

const getMaintenanceHistoryDate = (record: MaintenanceRecord) =>
  validISODate(record.completedDate) ? record.completedDate : validISODate(record.scheduledDate) ? record.scheduledDate : ''

const addDays = (date: string, days: number) => {
  const result = new Date(`${date}T00:00:00.000Z`)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

export const getUpcomingMaintenance = (
  state: AppState,
  fromDate = getLocalISODate(),
  windowDays: number | null = 30,
) => {
  if (!validISODate(fromDate)) return []
  const normalizedWindowDays = windowDays === null
    ? null
    : Number.isFinite(windowDays) && windowDays >= 0 ? Math.floor(windowDays) : 30
  const throughDate = normalizedWindowDays === null ? null : addDays(fromDate, normalizedWindowDays)

  return state.maintenanceRecords
    .filter(record => isOpenMaintenance(record)
      && validISODate(record.scheduledDate)
      && record.scheduledDate >= fromDate
      && (!throughDate || record.scheduledDate <= throughDate))
    .sort(compareMaintenanceDateAsc)
}

export const getOverdueMaintenance = (state: AppState, referenceDate = getLocalISODate()) => {
  if (!validISODate(referenceDate)) return []
  return state.maintenanceRecords
    .filter(record => isOpenMaintenance(record)
      && validISODate(record.scheduledDate)
      && record.scheduledDate < referenceDate)
    .sort(compareMaintenanceDateAsc)
}

export const getCompletedMaintenance = (state: AppState, year?: number) => {
  const yearPrefix = Number.isInteger(year) && Number(year) >= 0
    ? `${String(year).padStart(4, '0')}-`
    : null

  return state.maintenanceRecords
    .filter(record => normalizeMaintenanceStatus(record.status) === 'completed')
    .filter(record => !yearPrefix || getMaintenanceHistoryDate(record).startsWith(yearPrefix))
    .sort((a, b) => getMaintenanceHistoryDate(b).localeCompare(getMaintenanceHistoryDate(a)) || a.id.localeCompare(b.id))
}

export const getActiveMaintenanceRoutines = (state: AppState) => state.maintenanceRoutines
  .filter(routine => routine.active)
  .sort((a, b) => {
    const aValid = validISODate(a.nextDate)
    const bValid = validISODate(b.nextDate)
    if (aValid && bValid) return a.nextDate.localeCompare(b.nextDate) || a.id.localeCompare(b.id)
    if (aValid) return -1
    if (bValid) return 1
    return a.id.localeCompare(b.id)
  })

export const getNextRoutineOccurrences = (state: AppState, fromDate?: string) => {
  if (fromDate !== undefined && !validISODate(fromDate)) return []
  return getActiveMaintenanceRoutines(state)
    .filter(routine => validISODate(routine.nextDate) && (!fromDate || routine.nextDate >= fromDate))
}

const getValidMaintenanceCost = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null

const getMaintenanceTransactionId = (state: AppState, record: MaintenanceRecord) =>
  typeof record.financialTransactionId === 'string'
    ? record.financialTransactionId
    : state.financialTransactions.find(transaction => transaction.maintenanceId === record.id)?.id ?? null

export const getMaintenanceEffectiveCost = (state: AppState, record: MaintenanceRecord) => {
  const directCost = getValidMaintenanceCost(record.cost)
  if (directCost !== null) return directCost
  const transactionId = getMaintenanceTransactionId(state, record)
  if (!transactionId) return 0
  const transaction = state.financialTransactions.find(item => item.id === transactionId)
  return transaction && isPaidExpense(transaction.status, transaction.type) ? validAmount(transaction.amount) : 0
}

const getMaintenanceCostEntries = (state: AppState, year?: number) => {
  const usedTransactionIds = new Set<string>()
  return getCompletedMaintenance(state, year).flatMap(record => {
    const transactionId = getMaintenanceTransactionId(state, record)
    if (transactionId && usedTransactionIds.has(transactionId)) return []
    if (transactionId) usedTransactionIds.add(transactionId)
    const amount = getMaintenanceEffectiveCost(state, record)
    return amount > 0 ? [{ record, amount }] : []
  })
}

export const getMaintenanceCostTotal = (state: AppState, year?: number) =>
  getMaintenanceCostEntries(state, year).reduce((total, item) => total + item.amount, 0)

export type MaintenanceCostDistributionItem = {
  type: MaintenanceType | 'other'
  amount: number
  percentage: number
}

export const getMaintenanceCostDistribution = (state: AppState, year?: number): MaintenanceCostDistributionItem[] => {
  const totals = getMaintenanceCostEntries(state, year).reduce<Record<string, number>>((result, { record, amount }) => {
    const type = normalizeMaintenanceType(record.type) ?? 'other'
    result[type] = (result[type] ?? 0) + amount
    return result
  }, {})
  const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0)

  return Object.entries(totals)
    .map(([type, amount]) => ({
      type: type as MaintenanceCostDistributionItem['type'],
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount || a.type.localeCompare(b.type))
}

export const getTotalAssetValue = (state: AppState) => state.assets
  .filter(asset => isCurrentAsset(asset.status))
  .reduce((total, asset) => total + validAssetValue(asset.value), 0)

export const getAssetsWithExpiringWarranty = (
  state: AppState,
  referenceDate = getLocalISODate(),
  windowDays = 60,
) => {
  if (!validISODate(referenceDate)) return []

  const normalizedWindowDays = Number.isFinite(windowDays) && windowDays >= 0 ? Math.floor(windowDays) : 60
  const fromTimestamp = Date.parse(`${referenceDate}T00:00:00.000Z`)
  const throughTimestamp = fromTimestamp + normalizedWindowDays * 24 * 60 * 60 * 1000

  return state.assets
    .filter(asset => {
      if (!isCurrentAsset(asset.status) || !asset.warrantyEndDate || !validISODate(asset.warrantyEndDate)) return false
      const warrantyTimestamp = Date.parse(`${asset.warrantyEndDate}T00:00:00.000Z`)
      return warrantyTimestamp >= fromTimestamp && warrantyTimestamp <= throughTimestamp
    })
    .sort((a, b) => (a.warrantyEndDate ?? '').localeCompare(b.warrantyEndDate ?? '') || a.id.localeCompare(b.id))
}

export type AssetDistributionByRoomItem = {
  roomId: string
  roomName: string
  itemCount: number
  totalValue: number
  percentage: number
}

export const getAssetDistributionByRoom = (state: AppState): AssetDistributionByRoomItem[] => {
  const distribution = getActiveRooms(state).filter(room => room.type !== 'general').map(room => {
    const assets = getAssetsByRoomId(state, room.id)
    return {
      roomId: room.id,
      roomName: room.name,
      itemCount: assets.length,
      totalValue: assets
        .filter(asset => isCurrentAsset(asset.status))
        .reduce((total, asset) => total + validAssetValue(asset.value), 0),
    }
  })
  const largestRoomValue = Math.max(0, ...distribution.map(room => room.totalValue))

  return distribution.map(room => ({
    ...room,
    percentage: largestRoomValue > 0 ? (room.totalValue / largestRoomValue) * 100 : 0,
  }))
}
