import type { AppState } from './app-state'
import { createInitialAppState } from './initial-data'

export const APP_STORAGE_KEY = 'siga:app-state:v1'
const arrayKeys: (keyof AppState)[] = ['chapters', 'financialTransactions', 'financialCommitments', 'documents', 'documentFolders', 'rooms', 'assets', 'maintenanceRecords', 'maintenanceRoutines']
const isEntityRecord = (value: unknown) => !!value
  && typeof value === 'object'
  && typeof (value as { id?: unknown }).id === 'string'
const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try { return window.localStorage } catch { return null }
}

export function isValidAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppState>
  return candidate.schemaVersion === 1
    && !!candidate.property && typeof candidate.property === 'object'
    && typeof candidate.property.id === 'string'
    && !!candidate.settings && typeof candidate.settings === 'object'
    && arrayKeys.every(key => Array.isArray(candidate[key]) && candidate[key].every(isEntityRecord))
    && typeof candidate.initializedAt === 'string'
    && typeof candidate.updatedAt === 'string'
}

export function hydrateAppState(value: unknown): AppState {
  return isValidAppState(value) ? structuredClone(value) : createInitialAppState()
}

export function loadAppState(): AppState {
  const storage = getStorage()
  if (!storage) return createInitialAppState()
  try {
    const stored = storage.getItem(APP_STORAGE_KEY)
    return stored ? hydrateAppState(JSON.parse(stored)) : createInitialAppState()
  } catch {
    return createInitialAppState()
  }
}

export function saveAppState(state: AppState): boolean {
  const storage = getStorage()
  if (!storage) return false
  try { storage.setItem(APP_STORAGE_KEY, JSON.stringify(state)); return true } catch { return false }
}

export function clearAppState(): boolean {
  const storage = getStorage()
  if (!storage) return false
  try { storage.removeItem(APP_STORAGE_KEY); return true } catch { return false }
}
