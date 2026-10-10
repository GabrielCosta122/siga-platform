import { isSafeAppState } from './state-validation'
import type { Property } from '@/domain/types'
import type { AppState } from './app-state'
import { createInitialAppState } from './initial-data'
import { hydrateAppState } from './persistence'

export class LocalPersistenceError extends Error {
  constructor(message: string, options?: ErrorOptions) { super(message, options); this.name = 'LocalPersistenceError' }
}
export function browserStorage(): Storage {
  try { return window.localStorage } catch (cause) {
    throw new LocalPersistenceError('O armazenamento deste navegador não está disponível.', { cause })
  }
}
export const scopeKey = (userId: string, propertyId: string) =>
  `siga:app-state:v2:user:${encodeURIComponent(userId)}:property:${encodeURIComponent(propertyId)}`
export const selectionKey = (userId: string) => `siga:active-property:v2:user:${encodeURIComponent(userId)}`
export const fileDatabase = (userId: string, propertyId: string) =>
  `siga-files:v2:user:${encodeURIComponent(userId)}:property:${encodeURIComponent(propertyId)}`

export interface ScopedLoad { state: AppState; warning: string | null; writable: boolean }
export function loadScopedState(storage: Storage, userId: string, property: Property): ScopedLoad {
  const fallback = { ...createInitialAppState(), property }
  try {
    const raw = storage.getItem(scopeKey(userId, property.id))
    if (!raw) return { state: fallback, warning: null, writable: true }
    const envelope: unknown = JSON.parse(raw)
    if (!envelope || typeof envelope !== 'object'
      || !('version' in envelope) || envelope.version !== 2
      || !('userId' in envelope) || envelope.userId !== userId
      || !('propertyId' in envelope) || envelope.propertyId !== property.id
      || !('state' in envelope) || !isSafeAppState(envelope.state)) {
      return { state: fallback, warning: 'Dados locais inválidos. Uma base vazia foi aberta; o conteúdo original foi preservado. Exporte ou recupere a chave antes de restaurar os dados.', writable: false }
    }
    return { state: { ...hydrateAppState(envelope.state, false), property }, warning: null, writable: true }
  } catch (cause) {
    return { state: fallback, warning: cause instanceof SyntaxError ? 'Dados locais corrompidos; o original foi preservado. Restaure os dados apenas após recuperar sua cópia.' : 'Não foi possível ler os dados locais. Verifique o armazenamento do navegador.', writable: false }
  }
}
export function saveScopedState(storage: Storage, userId: string, propertyId: string, state: AppState, importSourceId?: string): void {
  if (state.property.id !== propertyId || !isSafeAppState(state)) throw new LocalPersistenceError('O estado não corresponde ao imóvel ativo.')
  try {
    const key = scopeKey(userId, propertyId)
    const previous: unknown = JSON.parse(storage.getItem(key) ?? 'null')
    const sourceId = importSourceId ?? (previous && typeof previous === 'object' && 'importSourceId' in previous && typeof previous.importSourceId === 'string' ? previous.importSourceId : undefined)
    storage.setItem(key, JSON.stringify({ version: 2, userId, propertyId, importSourceId: sourceId, state }))
  }
  catch (cause) { throw new LocalPersistenceError('Não foi possível salvar os dados locais. Verifique o espaço disponível.', { cause }) }
}
export function clearSelection(storage: Storage, userId: string): void {
  storage.removeItem(selectionKey(userId))
}
