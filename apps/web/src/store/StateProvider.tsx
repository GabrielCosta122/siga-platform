import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import type { Property } from '@/domain/types'
import { useAuth } from '@/auth/useAuth'
import { updateProperty } from '@/services/supabase/properties.service'
import type { UpdatePropertyInput } from '@/lib/supabase/property.mapper'
import { appReducer } from './app-reducer'
import { clearAppState, loadAppState, saveAppState } from './persistence'
import { createInitialAppState } from './initial-data'
import { AppStoreContext } from './useAppStore'
import { browserStorage, fileDatabase, loadScopedState, saveScopedState, scopeKey } from './scoped-persistence'

export function StateProvider({ children, userId, property, onPropertySaved }: {
  children: ReactNode; userId?: string; property?: Property; onPropertySaved?: (property: Property) => void
}) {
  const auth = useAuth()
  const [loaded] = useState(() => {
    if (!userId || !property) return { state: loadAppState(), warning: null, writable: true }
    try { return loadScopedState(browserStorage(), userId, property) }
    catch (cause) { return { state: { ...createInitialAppState(), property }, warning: cause instanceof Error ? cause.message : 'Não foi possível abrir o armazenamento local.', writable: false } }
  })
  const [state, reducerDispatch] = useReducer(appReducer, loaded.state)
  const [storageError, setStorageError] = useState(loaded.warning)
  const [writable, setWritable] = useState(loaded.writable)
  const alive = useRef(false)
  const revision = auth.getSessionRevision()
  const savingProperty = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const assertCurrent = useCallback(() => {
    if (!alive.current || userId && auth.getSessionRevision() !== revision) throw new Error('A sessão ou o imóvel ativo mudou. A operação foi interrompida.')
  }, [userId, auth, revision])
  useEffect(() => {
    if (!writable) return
    try {
      assertCurrent()
      if (userId && property) saveScopedState(browserStorage(), userId, property.id, state)
      else if (!saveAppState(state)) throw new Error('Não foi possível salvar os dados neste navegador.')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível salvar os dados locais.'
      queueMicrotask(() => { if (alive.current) setStorageError(message) })
    }
  }, [state, userId, property, writable, assertCurrent])
  const dispatch = useCallback((action: Parameters<typeof appReducer>[1]) => {
    assertCurrent()
    if (userId && (action.type === 'UPDATE_PROPERTY' || action.type === 'RESET_STATE')) throw new Error('Use a operação de imóvel autenticada.')
    reducerDispatch(action)
  }, [assertCurrent, userId])
  const saveProperty = useCallback(async (input: UpdatePropertyInput) => {
    assertCurrent()
    if (savingProperty.current) throw new Error('Uma gravação do imóvel já está em andamento.')
    savingProperty.current = true
    try {
      if (userId && property) {
        const saved = await updateProperty(property.id, input, userId)
        assertCurrent()
        // Preserve server timestamps and all locally managed module records.
        reducerDispatch({ type: 'APPLY_REMOTE_PROPERTY', payload: saved })
        onPropertySaved?.(saved)
      } else reducerDispatch({ type: 'UPDATE_PROPERTY', payload: input })
    } finally { savingProperty.current = false }
  }, [assertCurrent, userId, property, onPropertySaved])
  const resetAppData = useCallback(() => {
    assertCurrent()
    const empty = createInitialAppState()
    if (userId && property) {
      empty.property = state.property
      // Explicit restore authorizes replacing a corrupt namespace, never v1.
      const storage = browserStorage()
      storage.removeItem(scopeKey(userId, property.id))
      saveScopedState(storage, userId, property.id, empty)
    } else if (!clearAppState()) throw new Error('Não foi possível restaurar os dados locais.')
    setWritable(true)
    setStorageError(null)
    reducerDispatch({ type: 'RESET_STATE', payload: empty })
  }, [assertCurrent, userId, property, state.property])
  const value = useMemo(() => ({ state, dispatch, resetAppData, saveProperty, assertScopeCurrent: assertCurrent,
    fileDatabaseName: userId && property ? fileDatabase(userId, property.id) : 'siga-files',
  }), [state, dispatch, resetAppData, saveProperty, assertCurrent, userId, property])
  return <AppStoreContext.Provider value={value}>
    {storageError ? <p role="alert" className="border-b bg-background px-8 py-3 text-sm text-destructive">{storageError}</p> : null}
    {children}
  </AppStoreContext.Provider>
}
