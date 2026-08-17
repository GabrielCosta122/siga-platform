import type { AppState } from './app-state'

export const getPublishedChapters = (state: AppState) => state.chapters.filter(chapter => chapter.status === 'published')
export const getDraftChapters = (state: AppState) => state.chapters.filter(chapter => chapter.status === 'draft')
export const getImportantChapters = (state: AppState) => state.chapters.filter(chapter => chapter.important)
export const getChapterById = (state: AppState, id: string) => state.chapters.find(chapter => chapter.id === id)
export const getRecentChapters = (state: AppState, limit = 3) => [...getPublishedChapters(state)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, Math.max(0, limit))
export const getDocumentsByChapterId = (state: AppState, chapterId: string) => state.documents.filter(document => document.chapterId === chapterId)
export const getDocumentById = (state: AppState, id: string) => state.documents.find(document => document.id === id)
export const getImportantDocuments = (state: AppState) => state.documents.filter(document => document.important)
export const getDocumentsByFolderId = (state: AppState, folderId: string) => state.documents.filter(document => document.folderId === folderId)
export const getTransactionsByChapterId = (state: AppState, chapterId: string) => state.financialTransactions.filter(transaction => transaction.chapterId === chapterId)
export const getAssetsByRoomId = (state: AppState, roomId: string) => state.assets.filter(asset => asset.roomId === roomId)
export const getMaintenanceByAssetId = (state: AppState, assetId: string) => state.maintenanceRecords.filter(record => record.assetId === assetId)
export const getUpcomingMaintenance = (state: AppState, fromDate = new Date().toISOString().slice(0, 10)) => state.maintenanceRecords.filter(record => record.status !== 'completed' && record.status !== 'cancelled' && record.scheduledDate >= fromDate).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
const validAmount = (amount: number) => Number.isFinite(amount) && amount > 0 ? amount : 0
const validISODate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
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
