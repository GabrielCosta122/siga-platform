import type { AppState } from './app-state'

export const getPublishedChapters = (state: AppState) => state.chapters.filter(chapter => chapter.status === 'published')
export const getDraftChapters = (state: AppState) => state.chapters.filter(chapter => chapter.status === 'draft')
export const getImportantChapters = (state: AppState) => state.chapters.filter(chapter => chapter.important)
export const getChapterById = (state: AppState, id: string) => state.chapters.find(chapter => chapter.id === id)
export const getRecentChapters = (state: AppState, limit = 3) => [...getPublishedChapters(state)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, Math.max(0, limit))
export const getDocumentsByChapterId = (state: AppState, chapterId: string) => state.documents.filter(document => document.chapterId === chapterId)
export const getTransactionsByChapterId = (state: AppState, chapterId: string) => state.financialTransactions.filter(transaction => transaction.chapterId === chapterId)
export const getAssetsByRoomId = (state: AppState, roomId: string) => state.assets.filter(asset => asset.roomId === roomId)
export const getMaintenanceByAssetId = (state: AppState, assetId: string) => state.maintenanceRecords.filter(record => record.assetId === assetId)
export const getUpcomingMaintenance = (state: AppState, fromDate = new Date().toISOString().slice(0, 10)) => state.maintenanceRecords.filter(record => record.status !== 'completed' && record.status !== 'cancelled' && record.scheduledDate >= fromDate).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
export const getPaidAmount = (state: AppState) => state.financialTransactions.filter(item => item.status === 'paid' && item.type === 'expense').reduce((total, item) => total + item.amount, 0)
export const getTotalInvested = getPaidAmount
export const getFutureCommitments = (state: AppState) => state.financialCommitments.filter(item => item.status !== 'paid' && item.status !== 'cancelled').reduce((total, item) => total + item.amount, 0)
