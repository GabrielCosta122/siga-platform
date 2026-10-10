import { isSafeAppState } from './state-validation'
import type { Property } from '@/domain/types'
import type { AppState } from './app-state'
import { APP_STORAGE_KEY, hydrateAppState, isHydratableAppState } from './persistence'
import { loadScopedState, LocalPersistenceError, saveScopedState, scopeKey } from './scoped-persistence'

const IDENTITY_KEY = 'siga:legacy-identity:v2'
export const decisionKey = (userId: string) => `siga:legacy-decision:v2:user:${encodeURIComponent(userId)}`
export function recordLegacyDecision(storage: Storage, userId: string, choice: 'skip' | 'later' | 'show'): void {
  if (choice === 'skip') storage.setItem(decisionKey(userId), 'skip')
}
const journalKey = (userId: string, sourceId: string) => `siga:legacy-import:v2:user:${encodeURIComponent(userId)}:source:${sourceId}`
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function readLegacy(storage: Storage): AppState | null {
  const raw = storage.getItem(APP_STORAGE_KEY)
  if (!raw) return null
  let value: unknown
  try { value = JSON.parse(raw) } catch (cause) { throw new LocalPersistenceError('Os dados antigos estão corrompidos; a chave v1 foi preservada.', { cause }) }
  if (!isHydratableAppState(value)) throw new LocalPersistenceError('Os dados antigos não possuem um formato compatível; a chave v1 foi preservada.')
  const state = hydrateAppState(value, false)
  if (!isSafeAppState(state)) throw new LocalPersistenceError('Não foi possível validar os dados antigos.')
  return state
}
export function legacyIdentity(storage: Storage): string {
  const saved = storage.getItem(IDENTITY_KEY)
  if (saved) {
    if (!uuid.test(saved)) throw new LocalPersistenceError('A identidade da importação está corrompida. Recupere o registro antes de tentar novamente.')
    return saved
  }
  const id = crypto.randomUUID()
  storage.setItem(IDENTITY_KEY, id)
  return id
}
interface ImportJournal { version: 2; sourceId: string; snapshot: AppState; propertyId: string | null; complete: boolean }
function parseJournal(raw: string, sourceId: string): ImportJournal {
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || !('version' in parsed) || parsed.version !== 2
    || !('sourceId' in parsed) || parsed.sourceId !== sourceId
    || !('snapshot' in parsed) || !isSafeAppState(parsed.snapshot)
    || !('propertyId' in parsed) || !(parsed.propertyId === null || typeof parsed.propertyId === 'string' && uuid.test(parsed.propertyId))
    || !('complete' in parsed) || typeof parsed.complete !== 'boolean') throw new LocalPersistenceError('O registro da importação está inválido; nenhum dado foi substituído.')
  return { version: 2, sourceId, snapshot: parsed.snapshot, propertyId: parsed.propertyId, complete: parsed.complete }
}
export function readLegacyPreview(storage: Storage, userId: string): AppState | null {
  if (!storage.getItem(APP_STORAGE_KEY)) return null
  const sourceId = storage.getItem(IDENTITY_KEY)
  if (sourceId) {
    if (!uuid.test(sourceId)) throw new LocalPersistenceError('A identidade da importação está inválida.')
    const journal = storage.getItem(journalKey(userId, sourceId))
    if (journal) return parseJournal(journal, sourceId).snapshot
  }
  return readLegacy(storage)
}
export interface LegacyImportOptions {
  storage: Storage
  userId: string
  snapshot: AppState
  assertCurrent: () => void
  ensureProperty: (sourceId: string, property: Property) => Promise<Property>
  getProperty: (id: string) => Promise<Property | null>
  copyFiles: (snapshot: AppState, propertyId: string) => Promise<void>
}
// Persist a stable snapshot BEFORE contacting the server. All retries use it.
async function performImport(options: LegacyImportOptions): Promise<Property> {
  const { storage, userId, assertCurrent } = options
  assertCurrent()
  const sourceId = legacyIdentity(storage)
  const key = journalKey(userId, sourceId)
  const raw = storage.getItem(key)
  let journal: ImportJournal = { version: 2, sourceId, snapshot: options.snapshot, propertyId: null, complete: false }
  if (raw) journal = parseJournal(raw, sourceId)
  storage.setItem(key, JSON.stringify(journal))
  let property = journal.propertyId ? await options.getProperty(journal.propertyId) : null
  assertCurrent()
  if (journal.propertyId && !property) throw new Error('O imóvel importado não está mais disponível. A importação não criará uma cópia automaticamente.')
  if (!property) property = await options.ensureProperty(sourceId, journal.snapshot.property)
  assertCurrent()
  journal.propertyId = property.id
  storage.setItem(key, JSON.stringify(journal))
  if (journal.complete) return property
  // Never overwrite a previously committed state on a retry, even if the final
  // journal write failed. The envelope's import marker is the commit record.
  const targetKey = scopeKey(userId, property.id)
  const existing = storage.getItem(targetKey)
  if (existing) {
    const envelope: unknown = JSON.parse(existing)
    if (!envelope || typeof envelope !== 'object' || !('importSourceId' in envelope) || envelope.importSourceId !== sourceId) {
      throw new LocalPersistenceError('Este imóvel já possui dados locais. A importação não vai sobrescrevê-los.')
    }
    if (!loadScopedState(storage, userId, property).writable) throw new LocalPersistenceError('O estado já importado está corrompido; recupere-o antes de continuar.')
  } else {
    await options.copyFiles(journal.snapshot, property.id)
    assertCurrent()
    const state = { ...journal.snapshot, property, financialLoans: journal.snapshot.financialLoans.map(loan => ({ ...loan, propertyId: property.id })), updatedAt: new Date().toISOString() }
    // One atomic localStorage write commits the state and its import identity.
    saveScopedState(storage, userId, property.id, state, sourceId)
  }
  assertCurrent()
  journal.complete = true
  storage.setItem(key, JSON.stringify(journal))
  storage.setItem(decisionKey(userId), 'imported')
  return property
}

// Serialize across tabs before allocating the source identity or writing a journal.
let pending: Promise<void> = Promise.resolve()
export async function importLegacy(options: LegacyImportOptions): Promise<Property> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('siga:legacy-import:v2', () => performImport(options))
  }
  const previous = pending
  let release: () => void = () => undefined
  pending = new Promise<void>(resolve => { release = resolve })
  await previous
  try { return await performImport(options) } finally { release() }
}
