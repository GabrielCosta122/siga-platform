import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Property } from '@/domain/types'
import { useAuth } from '@/auth/useAuth'
import { MainLayout } from '@/layouts/MainLayout'
import { WorkspaceControls } from '@/features/workspace/components/WorkspaceControls'
import { createProperty, getMyProperties, getPropertyById, importLegacyProperty } from '@/services/supabase/properties.service'
import { copyLegacyFiles } from '@/storage/import-legacy-files'
import { createInitialAppState } from './initial-data'
import type { AppState } from './app-state'
import { browserStorage, selectionKey } from './scoped-persistence'
import { resolveActiveProperty, selectActiveProperty } from './active-property'
import { decisionKey, importLegacy, readLegacyPreview, recordLegacyDecision } from './legacy-import'
import { StateProvider } from './StateProvider'
import { WorkspaceContext } from './useWorkspace'

export function SessionWorkspace({ userId, children }: { userId: string; children: ReactNode }) {
  const { getSessionRevision, signOut } = useAuth()
  const [revision] = useState(getSessionRevision)
  const alive = useRef(false)
  const operation = useRef(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [active, setActive] = useState<Property | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [legacy, setLegacy] = useState<AppState | null>(null)
  const [showLegacy, setShowLegacy] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const reader = useMemo(() => ({ list: () => getMyProperties(userId), get: (id: string) => getPropertyById(id, userId) }), [userId])
  const assertCurrent = useCallback(() => {
    if (!alive.current || getSessionRevision() !== revision) throw new Error('A sessão mudou. A operação foi interrompida; os dados antigos foram preservados.')
  }, [getSessionRevision, revision])
  useEffect(() => {
    alive.current = true
    let cancelled = false
    const current = () => { assertCurrent(); if (cancelled) throw new Error('A consulta foi cancelada.') }
    async function load() {
      try {
        const storage = browserStorage()
        try {
          const snapshot = readLegacyPreview(storage, userId)
          setLegacy(snapshot)
          setShowLegacy(Boolean(snapshot) && !storage.getItem(decisionKey(userId)))
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível ler o legado.') }
        const result = await resolveActiveProperty(storage, userId, reader, current)
        current()
        setProperties(result.properties)
        setActive(result.active)
      } catch (cause) {
        if (!cancelled && getSessionRevision() === revision) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os imóveis.')
      } finally { if (!cancelled && getSessionRevision() === revision) setBusy(false) }
    }
    void load()
    return () => { cancelled = true; alive.current = false }
  }, [userId, reader, assertCurrent, getSessionRevision, revision, refresh])

  const run = useCallback(async (task: () => Promise<void>) => {
    if (operation.current) return
    operation.current = true
    setBusy(true); setError(''); setNotice('')
    try { assertCurrent(); await task() }
    catch (cause) { if (alive.current && getSessionRevision() === revision) setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.') }
    finally { operation.current = false; if (alive.current && getSessionRevision() === revision) setBusy(false) }
  }, [assertCurrent, getSessionRevision, revision])
  const select = useCallback((id: string) => run(async () => {
    const property = await selectActiveProperty(browserStorage(), userId, id, reader, assertCurrent)
    setActive(property)
    setNotice('Imóvel ativo selecionado.')
  }), [run, userId, reader, assertCurrent])
  const create = useCallback((name: string) => run(async () => {
    const input = { ...createInitialAppState().property, name }
    const property = await createProperty(input, userId)
    assertCurrent()
    browserStorage().setItem(selectionKey(userId), property.id)
    setProperties(current => [...current, property]); setActive(property)
    setNotice('Imóvel criado. Os demais registros continuam neste navegador.')
  }), [run, userId, assertCurrent])
  const migrate = useCallback(() => run(async () => {
    if (!legacy) throw new Error('Nenhum legado válido está disponível para importar.')
    const property = await importLegacy({
      storage: browserStorage(), userId, snapshot: legacy, assertCurrent,
      ensureProperty: (sourceId, input) => importLegacyProperty(sourceId, input, userId),
      getProperty: reader.get,
      copyFiles: (snapshot, id) => copyLegacyFiles(snapshot, userId, id, assertCurrent),
    })
    assertCurrent()
    browserStorage().setItem(selectionKey(userId), property.id)
    setProperties(current => current.some(item => item.id === property.id) ? current.map(item => item.id === property.id ? property : item) : [...current, property])
    setActive(property); setShowLegacy(false)
    setNotice('Importação concluída. A cópia antiga permanece intacta.')
  }), [run, legacy, userId, assertCurrent, reader])
  const decide = useCallback((choice: 'skip' | 'later' | 'show') => {
    try {
      assertCurrent()
      recordLegacyDecision(browserStorage(), userId, choice)
      setShowLegacy(choice === 'show')
      setNotice(choice === 'skip' ? 'Você pode importar depois. Os dados antigos foram preservados.' : '')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível registrar a decisão.') }
  }, [assertCurrent, userId])
  const onPropertySaved = useCallback((property: Property) => {
    setActive(property)
    setProperties(current => current.map(item => item.id === property.id ? property : item))
  }, [])
  const value = useMemo(() => ({ properties, active, busy, error, notice, legacy, showLegacy, select, create,
    importLegacy: migrate, decide, reload: () => { setBusy(true); setError(''); setRefresh(current => current + 1) },
    signOut: () => run(signOut),
  }), [properties, active, busy, error, notice, legacy, showLegacy, select, create, migrate, decide, run, signOut])
  return <WorkspaceContext.Provider value={value}>
    {active ? <StateProvider key={`${userId}:${active.id}`} userId={userId} property={active} onPropertySaved={onPropertySaved}>{children}</StateProvider>
      : <MainLayout title="Sua história"><WorkspaceControls /></MainLayout>}
  </WorkspaceContext.Provider>
}
