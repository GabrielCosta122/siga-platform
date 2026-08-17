import type { AppState } from './app-state'
import { createInitialAppState } from './initial-data'

export const APP_STORAGE_KEY = 'siga:app-state:v1'
const arrayKeys: (keyof AppState)[] = ['chapters', 'financialTransactions', 'financialCommitments', 'documents', 'documentFolders', 'rooms', 'assets', 'maintenanceRecords', 'maintenanceRoutines']

export function isValidAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppState>
  return candidate.schemaVersion === 1
    && !!candidate.property && typeof candidate.property === 'object'
    && typeof candidate.property.id === 'string'
    && !!candidate.settings && typeof candidate.settings === 'object'
    && arrayKeys.every(key => Array.isArray(candidate[key]))
    && typeof candidate.initializedAt === 'string'
    && typeof candidate.updatedAt === 'string'
}

export function hydrateAppState(value: unknown): AppState {
  return isValidAppState(value) ? structuredClone(value) : createInitialAppState()
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined' || !window.localStorage) return createInitialAppState()
  try {
    const stored = window.localStorage.getItem(APP_STORAGE_KEY)
    return stored ? hydrateAppState(JSON.parse(stored)) : createInitialAppState()
  } catch {
    return createInitialAppState()
  }
}

export function saveAppState(state: AppState): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try { window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state)); return true } catch { return false }
}

export function clearAppState(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try { window.localStorage.removeItem(APP_STORAGE_KEY); return true } catch { return false }
}
