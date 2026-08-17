import type { AppAction } from './app-actions'
import type { AppState } from './app-state'
import { createInitialAppState } from './initial-data'

const now = () => new Date().toISOString()
const updateById = <T extends { id: string; updatedAt: string }>(items: T[], id: string, changes: Partial<T>, updatedAt: string) =>
  items.map(item => item.id === id ? { ...item, ...changes, id: item.id, updatedAt } : item)
const deleteById = <T extends { id: string }>(items: T[], id: string) => items.filter(item => item.id !== id)

export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'HYDRATE_STATE') return action.payload
  if (action.type === 'RESET_STATE') return action.payload ?? createInitialAppState()
  const updatedAt = now()

  switch (action.type) {
    case 'UPDATE_PROPERTY': return { ...state, property: { ...state.property, ...action.payload, id: state.property.id, updatedAt }, updatedAt }
    case 'ADD_CHAPTER': return { ...state, chapters: [...state.chapters, action.payload], updatedAt }
    case 'UPDATE_CHAPTER': return { ...state, chapters: updateById(state.chapters, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_CHAPTER': return { ...state, chapters: deleteById(state.chapters, action.payload), updatedAt }
    case 'TOGGLE_CHAPTER_IMPORTANT': return { ...state, chapters: state.chapters.map(item => item.id === action.payload ? { ...item, important: !item.important, updatedAt } : item), updatedAt }
    case 'ADD_FINANCIAL_TRANSACTION': return { ...state, financialTransactions: [...state.financialTransactions, action.payload], updatedAt }
    case 'UPDATE_FINANCIAL_TRANSACTION': return { ...state, financialTransactions: updateById(state.financialTransactions, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_FINANCIAL_TRANSACTION': return { ...state, financialTransactions: deleteById(state.financialTransactions, action.payload), updatedAt }
    case 'ADD_FINANCIAL_COMMITMENT': return { ...state, financialCommitments: [...state.financialCommitments, action.payload], updatedAt }
    case 'UPDATE_FINANCIAL_COMMITMENT': return { ...state, financialCommitments: updateById(state.financialCommitments, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_FINANCIAL_COMMITMENT': return { ...state, financialCommitments: deleteById(state.financialCommitments, action.payload), updatedAt }
    case 'ADD_DOCUMENT': return { ...state, documents: [...state.documents, action.payload], updatedAt }
    case 'UPDATE_DOCUMENT': return { ...state, documents: updateById(state.documents, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_DOCUMENT': return { ...state, documents: deleteById(state.documents, action.payload), updatedAt }
    case 'ADD_DOCUMENT_FOLDER': return { ...state, documentFolders: [...state.documentFolders, action.payload], updatedAt }
    case 'ADD_ASSET': return { ...state, assets: [...state.assets, action.payload], updatedAt }
    case 'UPDATE_ASSET': return { ...state, assets: updateById(state.assets, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_ASSET': return { ...state, assets: deleteById(state.assets, action.payload), updatedAt }
    case 'ADD_MAINTENANCE': return { ...state, maintenanceRecords: [...state.maintenanceRecords, action.payload], updatedAt }
    case 'UPDATE_MAINTENANCE': return { ...state, maintenanceRecords: updateById(state.maintenanceRecords, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'DELETE_MAINTENANCE': return { ...state, maintenanceRecords: deleteById(state.maintenanceRecords, action.payload), updatedAt }
    case 'COMPLETE_MAINTENANCE': return { ...state, maintenanceRecords: updateById(state.maintenanceRecords, action.payload.id, { status: 'completed', completedDate: action.payload.completedDate ?? updatedAt.slice(0, 10) }, updatedAt), updatedAt }
    case 'ADD_ROOM': return { ...state, rooms: [...state.rooms, action.payload], updatedAt }
    case 'UPDATE_ROOM': return { ...state, rooms: updateById(state.rooms, action.payload.id, action.payload.changes, updatedAt), updatedAt }
    case 'ARCHIVE_ROOM': return { ...state, rooms: updateById(state.rooms, action.payload, { active: false }, updatedAt), updatedAt }
  }
}
