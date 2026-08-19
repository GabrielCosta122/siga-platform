import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Edit3,
  PauseCircle,
  PlayCircle,
  Search,
  Wrench,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { MaintenanceRecord, MaintenanceRoutine } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MaintenanceCalendar } from '@/features/maintenance/components/MaintenanceCalendar'
import { MaintenanceDetails } from '@/features/maintenance/components/MaintenanceDetails'
import { MaintenanceForm } from '@/features/maintenance/components/MaintenanceForm'
import { MaintenanceTimeline } from '@/features/maintenance/components/MaintenanceTimeline'
import { RoutineForm } from '@/features/maintenance/components/RoutineForm'
import {
  formatMaintenanceDate,
  formatMaintenanceDateShort,
  getLocalMaintenanceDate,
  getMaintenanceDisplayStatus,
  getMaintenanceFrequencyLabel,
  getMaintenanceLocationLabel,
  getMaintenancePriorityLabel,
  getSafeMaintenanceText,
  getMaintenanceTypeIcon,
  getMaintenanceTypeLabel,
  normalizeMaintenanceStatus,
  parseMaintenanceDate,
} from '@/features/maintenance/presentation'
import { formatCurrencyBRL } from '@/lib/utils'
import {
  getActiveMaintenanceRoutines,
  getAssetsWithExpiringWarranty,
  getCompletedMaintenance,
  getMaintenanceById,
  getMaintenanceCostDistribution,
  getMaintenanceCostTotal,
  getOverdueMaintenance,
  getUpcomingMaintenance,
} from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'

type Panel =
  | { kind: 'create-maintenance' }
  | { kind: 'edit-maintenance' | 'reschedule-maintenance'; id: string }
  | { kind: 'create-routine' }
  | { kind: 'edit-routine'; id: string }
  | null

const DAY_IN_MS = 24 * 60 * 60 * 1000

function daysBetween(fromDate: string, toDate: string) {
  const from = parseMaintenanceDate(fromDate)
  const to = parseMaintenanceDate(toDate)
  return from && to ? Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_IN_MS)) : null
}

function Maintenance() {
  const { state, dispatch } = useAppStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const today = getLocalMaintenanceDate()
  const requestedAssetId = searchParams.get('assetId')
  const initialDefaultAssetId = requestedAssetId && state.assets.some(asset => asset.id === requestedAssetId)
    ? requestedAssetId
    : undefined
  const initialSelectedId = getCompletedMaintenance(state)[0]?.id ?? state.maintenanceRecords[0]?.id ?? null

  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId)
  const [defaultAssetId, setDefaultAssetId] = useState<string | undefined>(initialDefaultAssetId)
  const [panel, setPanel] = useState<Panel>(() => initialDefaultAssetId ? { kind: 'create-maintenance' } : null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmingRoutineDeleteId, setConfirmingRoutineDeleteId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(today.slice(0, 7))
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(today)
  const [detailsRequest, setDetailsRequest] = useState(0)
  const [panelRequest, setPanelRequest] = useState(0)
  const shouldRevealDetails = useRef(false)
  const shouldRevealPanel = useRef(false)
  const detailsContainerRef = useRef<HTMLElement>(null)
  const detailsHeadingRef = useRef<HTMLHeadingElement>(null)
  const panelContainerRef = useRef<HTMLElement>(null)
  const deletingRoutineIdRef = useRef<string | null>(null)

  const selected = selectedId ? getMaintenanceById(state, selectedId) : undefined
  const editingMaintenance = panel && 'id' in panel && panel.kind !== 'edit-routine'
    ? getMaintenanceById(state, panel.id)
    : undefined
  const editingRoutine = panel?.kind === 'edit-routine'
    ? state.maintenanceRoutines.find(routine => routine.id === panel.id)
    : undefined
  const editingMaintenanceForForm = useMemo(() => {
    if (!editingMaintenance) return undefined
    const documentIds = Array.isArray(editingMaintenance.documentIds)
      ? editingMaintenance.documentIds.filter((id): id is string => typeof id === 'string')
      : []
    const assetId = typeof editingMaintenance.assetId === 'string'
      ? editingMaintenance.assetId
      : state.assets.find(asset => Array.isArray(asset.maintenanceIds) && asset.maintenanceIds.includes(editingMaintenance.id))?.id ?? null
    const chapterId = typeof editingMaintenance.chapterId === 'string'
      ? editingMaintenance.chapterId
      : state.chapters.find(chapter => Array.isArray(chapter.maintenanceIds) && chapter.maintenanceIds.includes(editingMaintenance.id))?.id ?? null
    const financialTransactionId = typeof editingMaintenance.financialTransactionId === 'string'
      ? editingMaintenance.financialTransactionId
      : state.financialTransactions.find(transaction => transaction.maintenanceId === editingMaintenance.id)?.id ?? null

    return {
      ...editingMaintenance,
      assetId,
      chapterId,
      documentIds: [...new Set([
        ...documentIds,
        ...state.documents.filter(document => document.maintenanceId === editingMaintenance.id).map(document => document.id),
      ])],
      financialTransactionId,
    }
  }, [editingMaintenance, state.assets, state.chapters, state.documents, state.financialTransactions])
  const upcoming = getUpcomingMaintenance(state, today, null)
  const upcomingInThirtyDays = getUpcomingMaintenance(state, today, 30)
  const overdue = getOverdueMaintenance(state, today)
  const currentYear = Number(today.slice(0, 4))
  const completed = getCompletedMaintenance(state)
  const completedThisYear = getCompletedMaintenance(state, currentYear)
  const maintenanceCost = getMaintenanceCostTotal(state)
  const costDistribution = getMaintenanceCostDistribution(state)
  const activeRoutines = getActiveMaintenanceRoutines(state)
  const expiringWarranties = getAssetsWithExpiringWarranty(state, today, 60)

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) return completed
    return completed.filter(record => {
      const location = getMaintenanceLocationLabel(record, state)
      const title = getSafeMaintenanceText(record.title, '')
      const description = getSafeMaintenanceText(record.description, '')
      return `${title} ${description} ${location}`.toLocaleLowerCase('pt-BR').includes(term)
    })
  }, [completed, search, state])

  const attentionItems = useMemo(() => {
    const messages: string[] = []
    overdue.forEach(record => {
      const days = daysBetween(record.scheduledDate, today)
      messages.push(`${getSafeMaintenanceText(record.title, 'Cuidado sem título')} está ${days === null ? 'atrasado' : `atrasado há ${days} ${days === 1 ? 'dia' : 'dias'}`}.`)
    })
    expiringWarranties.forEach(asset => {
      const days = asset.warrantyEndDate ? daysBetween(today, asset.warrantyEndDate) : null
      messages.push(`A garantia de ${getSafeMaintenanceText(asset.name, 'um item')} vence${days === null ? ' em breve' : ` em ${days} ${days === 1 ? 'dia' : 'dias'}`}.`)
    })
    state.maintenanceRecords
      .filter(record => normalizeMaintenanceStatus(record.status) === 'in_progress')
      .forEach(record => messages.push(`${getSafeMaintenanceText(record.title, 'Um cuidado')} está em andamento e aguarda acompanhamento.`))
    activeRoutines
      .filter(routine => parseMaintenanceDate(routine.nextDate) && routine.nextDate < today)
      .filter(routine => !overdue.some(record => record.recurringRoutineId === routine.id))
      .forEach(routine => messages.push(`A rotina ${getSafeMaintenanceText(routine.title, 'sem título')} está com a próxima ocorrência vencida.`))
    return messages
  }, [activeRoutines, expiringWarranties, overdue, state.maintenanceRecords, today])

  useEffect(() => {
    if (!shouldRevealDetails.current) return
    shouldRevealDetails.current = false
    if (!selected) return
    detailsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    detailsHeadingRef.current?.focus({ preventScroll: true })
  }, [detailsRequest, selected])

  useEffect(() => {
    if (!shouldRevealPanel.current || !panel) return
    shouldRevealPanel.current = false
    panelContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    panelContainerRef.current?.focus({ preventScroll: true })
  }, [panel, panelRequest])

  useEffect(() => {
    if (!requestedAssetId) return
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('assetId')
    setSearchParams(nextSearchParams, { replace: true })
  }, [requestedAssetId, searchParams, setSearchParams])

  function showFeedback(message: string) {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2800)
  }

  function clearAssetRequest() {
    setDefaultAssetId(undefined)
    if (!searchParams.has('assetId')) return
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('assetId')
    setSearchParams(nextSearchParams, { replace: true })
  }

  function closePanel() {
    shouldRevealPanel.current = false
    clearAssetRequest()
    setPanel(null)
    setConfirmingDelete(false)
    setConfirmingRoutineDeleteId(null)
  }

  function openPanel(nextPanel: Exclude<Panel, null>, reveal = false) {
    if (nextPanel.kind !== 'create-maintenance') clearAssetRequest()
    deletingRoutineIdRef.current = null
    shouldRevealPanel.current = reveal
    setPanel(nextPanel)
    setConfirmingDelete(false)
    setConfirmingRoutineDeleteId(null)
    if (reveal) setPanelRequest(request => request + 1)
  }

  function viewDetails(record: MaintenanceRecord) {
    shouldRevealDetails.current = true
    clearAssetRequest()
    setSelectedId(record.id)
    setPanel(null)
    setConfirmingDelete(false)
    setDetailsRequest(request => request + 1)
  }

  function updateAssetMaintenanceLink(nextAssetId: string | null, maintenanceId: string) {
    state.assets.forEach(asset => {
      const currentIds = Array.isArray(asset.maintenanceIds)
        ? asset.maintenanceIds.filter((id): id is string => typeof id === 'string')
        : []
      const withoutMaintenance = currentIds.filter(id => id !== maintenanceId)
      const nextIds = asset.id === nextAssetId ? [...withoutMaintenance, maintenanceId] : withoutMaintenance
      if (currentIds.length !== nextIds.length || currentIds.some((id, index) => id !== nextIds[index])) {
        dispatch({ type: 'UPDATE_ASSET', payload: { id: asset.id, changes: { maintenanceIds: nextIds } } })
      }
    })
  }

  function updateChapterMaintenanceLink(nextChapterId: string | null, maintenanceId: string) {
    state.chapters.forEach(chapter => {
      const currentIds = Array.isArray(chapter.maintenanceIds)
        ? chapter.maintenanceIds.filter((id): id is string => typeof id === 'string')
        : []
      const withoutMaintenance = currentIds.filter(id => id !== maintenanceId)
      const nextIds = chapter.id === nextChapterId ? [...withoutMaintenance, maintenanceId] : withoutMaintenance
      if (currentIds.length !== nextIds.length || currentIds.some((id, index) => id !== nextIds[index])) {
        dispatch({ type: 'UPDATE_CHAPTER', payload: { id: chapter.id, changes: { maintenanceIds: nextIds } } })
      }
    })
  }

  function updateDocumentMaintenanceLinks(nextDocumentIds: string[], maintenanceId: string) {
    const requestedDocumentIds = new Set(nextDocumentIds)
    state.documents.forEach(document => {
      const shouldBeLinked = requestedDocumentIds.has(document.id)
      const isLinked = document.maintenanceId === maintenanceId
      if (shouldBeLinked && !isLinked) {
        dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: document.id, changes: { maintenanceId } } })
      } else if (!shouldBeLinked && isLinked) {
        dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: document.id, changes: { maintenanceId: null } } })
      }
    })
  }

  function updateFinancialMaintenanceLink(nextTransactionId: string | null, maintenanceId: string) {
    state.financialTransactions.forEach(transaction => {
      const shouldBeLinked = transaction.id === nextTransactionId
      const isLinked = transaction.maintenanceId === maintenanceId
      if (shouldBeLinked && !isLinked) {
        dispatch({ type: 'UPDATE_FINANCIAL_TRANSACTION', payload: { id: transaction.id, changes: { maintenanceId } } })
      } else if (!shouldBeLinked && isLinked) {
        dispatch({ type: 'UPDATE_FINANCIAL_TRANSACTION', payload: { id: transaction.id, changes: { maintenanceId: null } } })
      }
    })
  }

  function releaseExclusiveMaintenanceRelations(record: MaintenanceRecord) {
    const requestedDocumentIds = new Set(record.documentIds)
    state.maintenanceRecords.forEach(candidate => {
      if (candidate.id === record.id) return
      const currentDocumentIds = Array.isArray(candidate.documentIds)
        ? candidate.documentIds.filter((id): id is string => typeof id === 'string')
        : []
      const nextDocumentIds = currentDocumentIds.filter(id => !requestedDocumentIds.has(id))
      const releasesTransaction = !!record.financialTransactionId
        && candidate.financialTransactionId === record.financialTransactionId
      if (nextDocumentIds.length !== currentDocumentIds.length || releasesTransaction) {
        dispatch({
          type: 'UPDATE_MAINTENANCE',
          payload: {
            id: candidate.id,
            changes: {
              ...(nextDocumentIds.length !== currentDocumentIds.length ? { documentIds: nextDocumentIds } : {}),
              ...(releasesTransaction ? { financialTransactionId: null } : {}),
            },
          },
        })
      }
    })
  }

  function saveMaintenance(record: MaintenanceRecord) {
    const previous = editingMaintenance
    releaseExclusiveMaintenanceRelations(record)
    if (previous) dispatch({ type: 'UPDATE_MAINTENANCE', payload: { id: record.id, changes: record } })
    else dispatch({ type: 'ADD_MAINTENANCE', payload: record })
    updateAssetMaintenanceLink(record.assetId, record.id)
    updateChapterMaintenanceLink(record.chapterId, record.id)
    updateDocumentMaintenanceLinks(record.documentIds, record.id)
    updateFinancialMaintenanceLink(record.financialTransactionId, record.id)
    if (panel?.kind === 'reschedule-maintenance' && record.recurringRoutineId) {
      const routine = state.maintenanceRoutines.find(item => item.id === record.recurringRoutineId)
      if (routine) dispatch({ type: 'UPDATE_MAINTENANCE_ROUTINE', payload: { id: routine.id, changes: { nextDate: record.scheduledDate } } })
    }
    setSelectedId(record.id)
    closePanel()
    showFeedback(panel?.kind === 'reschedule-maintenance' ? 'Manutenção reagendada.' : previous ? 'Manutenção atualizada.' : 'Manutenção registrada.')
  }

  function completeMaintenance() {
    if (!selected) return
    dispatch({ type: 'COMPLETE_MAINTENANCE', payload: { id: selected.id, completedDate: today } })
    setConfirmingDelete(false)
    showFeedback('Cuidado concluído.')
  }

  function deleteMaintenance() {
    if (!selected) return
    updateAssetMaintenanceLink(null, selected.id)
    updateChapterMaintenanceLink(null, selected.id)
    updateDocumentMaintenanceLinks([], selected.id)
    updateFinancialMaintenanceLink(null, selected.id)
    dispatch({ type: 'DELETE_MAINTENANCE', payload: selected.id })
    setSelectedId(null)
    setConfirmingDelete(false)
    closePanel()
    showFeedback('Manutenção excluída.')
  }

  function saveRoutine(routine: MaintenanceRoutine) {
    if (editingRoutine) dispatch({ type: 'UPDATE_MAINTENANCE_ROUTINE', payload: { id: routine.id, changes: routine } })
    else dispatch({ type: 'ADD_MAINTENANCE_ROUTINE', payload: routine })
    closePanel()
    showFeedback(editingRoutine ? 'Rotina atualizada.' : 'Rotina criada.')
  }

  function deleteRoutine() {
    const routineId = editingRoutine?.id
    if (!routineId || confirmingRoutineDeleteId !== routineId || deletingRoutineIdRef.current === routineId) return
    if (!state.maintenanceRoutines.some(routine => routine.id === routineId)) {
      closePanel()
      return
    }
    deletingRoutineIdRef.current = routineId
    dispatch({ type: 'DELETE_MAINTENANCE_ROUTINE', payload: routineId })
    closePanel()
    showFeedback('Rotina excluída.')
  }

  function toggleRoutine(routine: MaintenanceRoutine) {
    dispatch({ type: 'UPDATE_MAINTENANCE_ROUTINE', payload: { id: routine.id, changes: { active: !routine.active } } })
    showFeedback(routine.active ? 'Rotina pausada.' : 'Rotina reativada.')
  }

  const routines = [...state.maintenanceRoutines].sort((left, right) => String(left.nextDate).localeCompare(String(right.nextDate)) || left.id.localeCompare(right.id))

  return <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1200px] space-y-8">
      <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{state.maintenanceRecords.length} registros</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Manutenção</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Cuidar da casa também faz parte da história.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => openPanel({ kind: 'create-routine' })}><CalendarPlus aria-hidden="true" />Criar rotina</Button>
          <Button type="button" onClick={() => openPanel({ kind: 'create-maintenance' })}><Wrench aria-hidden="true" />Registrar manutenção</Button>
        </div>
      </header>

      {feedback ? <p role="status" className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">{feedback}</p> : null}

      {panel ? <section ref={panelContainerRef} role="region" aria-label={panel.kind.includes('routine') ? 'Formulário de rotina' : 'Formulário de manutenção'} tabIndex={-1} className="scroll-mt-20 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {panel.kind === 'create-maintenance' ? <MaintenanceForm defaultAssetId={defaultAssetId} assets={state.assets} rooms={state.rooms} chapters={state.chapters} documents={state.documents} transactions={state.financialTransactions} routines={state.maintenanceRoutines} onCancel={closePanel} onSave={saveMaintenance} /> : null}
        {panel.kind === 'edit-maintenance' && editingMaintenanceForForm ? <MaintenanceForm key={editingMaintenanceForForm.id} initial={editingMaintenanceForForm} mode="edit" assets={state.assets} rooms={state.rooms} chapters={state.chapters} documents={state.documents} transactions={state.financialTransactions} routines={state.maintenanceRoutines} onCancel={closePanel} onSave={saveMaintenance} /> : null}
        {panel.kind === 'reschedule-maintenance' && editingMaintenanceForForm ? <MaintenanceForm key={editingMaintenanceForForm.id} initial={editingMaintenanceForForm} mode="reschedule" assets={state.assets} rooms={state.rooms} chapters={state.chapters} documents={state.documents} transactions={state.financialTransactions} routines={state.maintenanceRoutines} onCancel={closePanel} onSave={saveMaintenance} /> : null}
        {panel.kind === 'create-routine' ? <RoutineForm assets={state.assets} rooms={state.rooms} onCancel={closePanel} onSave={saveRoutine} /> : null}
        {panel.kind === 'edit-routine' && editingRoutine ? <RoutineForm key={editingRoutine.id} initial={editingRoutine} assets={state.assets} rooms={state.rooms} confirmingDelete={confirmingRoutineDeleteId === editingRoutine.id} onCancel={closePanel} onSave={saveRoutine} onAskDelete={() => setConfirmingRoutineDeleteId(editingRoutine.id)} onCancelDelete={() => setConfirmingRoutineDeleteId(null)} onDelete={deleteRoutine} /> : null}
      </section> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [Clock3, `${upcomingInThirtyDays.length} próximas`, 'nos próximos 30 dias'],
          [CheckCircle2, `${completedThisYear.length} concluídas`, 'neste ano'],
          [CalendarCheck, `${overdue.length} atrasadas`, 'precisam de atenção'],
          [Wrench, formatCurrencyBRL(maintenanceCost), 'investidos em manutenção'],
        ].map(([Icon, value, label]) => {
          const SummaryIcon = Icon as typeof Clock3
          return <Card key={label as string} size="sm"><CardContent className="flex min-h-[5rem] items-center justify-center gap-3"><SummaryIcon className="size-5 text-primary" aria-hidden="true" /><div><p className="text-lg font-semibold">{value as string}</p><p className="text-xs text-muted-foreground">{label as string}</p></div></CardContent></Card>
        })}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Próximos cuidados</h2>
        {upcoming.length ? <div className="mt-4 grid gap-3 lg:grid-cols-3">{upcoming.slice(0, 6).map(record => {
          const responsible = getSafeMaintenanceText(record.responsible, '')
          return <Card key={record.id} className="shadow-book-xs"><CardContent className="space-y-3 pt-5"><div className="flex justify-between gap-2"><h3 className="text-sm font-medium">{getSafeMaintenanceText(record.title, 'Manutenção sem título')}</h3><Badge variant="outline">{getMaintenanceDisplayStatus(record, today)}</Badge></div><p className="text-xs text-muted-foreground">{formatMaintenanceDate(record.scheduledDate)} · {getMaintenanceLocationLabel(record, state)}</p><p className="text-xs text-muted-foreground">{getMaintenanceTypeLabel(record.type)} · Prioridade {getMaintenancePriorityLabel(record.priority)}{responsible ? ` · ${responsible}` : ''}</p><Button type="button" variant="ghost" size="sm" onClick={() => viewDetails(record)}>Ver detalhes</Button></CardContent></Card>
        })}</div> : <Card className="mt-4 shadow-book-xs"><CardContent className="py-9 text-center"><p className="text-sm font-medium">Nenhum cuidado próximo</p><p className="mt-1 text-xs text-muted-foreground">Quando um cuidado for agendado, ele aparecerá aqui.</p></CardContent></Card>}
      </section>

      <section className="rounded-lg bg-secondary/70 p-5">
        <h2 className="font-display text-lg font-semibold">Precisam da sua atenção</h2>
        {attentionItems.length ? <div className="mt-3 grid gap-2 sm:grid-cols-3">{attentionItems.map((message, index) => <p key={`${index}-${message}`} className="text-sm text-muted-foreground">• {message}</p>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Tudo em ordem por aqui.</p>}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div>
          <div className="flex items-end justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Histórico de cuidados</h2><p className="mt-1 text-sm text-muted-foreground">Registros que mantêm a casa em continuidade.</p></div></div>
          <div className="relative mt-4"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar cuidado" aria-label="Buscar cuidado no histórico" /></div>
          {filteredHistory.length ? <div className="mt-5"><MaintenanceTimeline items={filteredHistory} state={state} selectedId={selected?.id} onSelect={viewDetails} /></div> : <Card className="mt-5"><CardContent className="py-12 text-center"><h3 className="font-display text-xl font-semibold">{state.maintenanceRecords.length ? 'Ainda não há cuidados concluídos' : 'A casa ainda não possui cuidados registrados'}</h3><p className="mt-2 text-sm text-muted-foreground">{state.maintenanceRecords.length ? 'Conclua um cuidado para começar a construir este histórico.' : 'Registre revisões, reparos e rotinas para acompanhar a conservação do seu lar.'}</p>{!state.maintenanceRecords.length ? <Button type="button" className="mt-5" onClick={() => openPanel({ kind: 'create-maintenance' }, true)}>Registrar manutenção</Button> : null}</CardContent></Card>}
        </div>
        {selected ? <aside ref={detailsContainerRef} className="scroll-mt-20 rounded-xl xl:sticky xl:top-20"><MaintenanceDetails item={selected} state={state} confirmingDelete={confirmingDelete} headingRef={detailsHeadingRef} onEdit={() => openPanel({ kind: 'edit-maintenance', id: selected.id }, true)} onComplete={completeMaintenance} onReschedule={() => openPanel({ kind: 'reschedule-maintenance', id: selected.id }, true)} onAddDocument={() => navigate('/documentos')} onAskDelete={() => setConfirmingDelete(true)} onCancelDelete={() => setConfirmingDelete(false)} onDelete={deleteMaintenance} /></aside> : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <MaintenanceCalendar records={state.maintenanceRecords} monthKey={calendarMonth} selectedDate={selectedCalendarDate} onChangeMonth={month => { setCalendarMonth(month); setSelectedCalendarDate(null) }} onSelectDate={setSelectedCalendarDate} onSelectRecord={viewDetails} today={today} />
        <Card>
          <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="font-display text-xl">Rotinas da casa</CardTitle><Button type="button" variant="ghost" size="sm" onClick={() => openPanel({ kind: 'create-routine' }, true)}><CalendarPlus aria-hidden="true" />Nova rotina</Button></div></CardHeader>
          <CardContent>{routines.length ? <div className="divide-y">{routines.map(routine => {
            const routineTitle = getSafeMaintenanceText(routine.title, 'Rotina sem título')
            return <div key={routine.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{routineTitle}</p><p className="mt-1 text-xs text-muted-foreground">{getMaintenanceFrequencyLabel(routine.frequency)} · {formatMaintenanceDateShort(routine.nextDate)} · {getMaintenanceLocationLabel(routine, state)}</p></div><Badge variant={routine.active ? 'secondary' : 'outline'}>{routine.active ? 'Ativa' : 'Pausada'}</Badge><Button type="button" variant="ghost" size="icon-sm" aria-label={`${routine.active ? 'Pausar' : 'Reativar'} ${routineTitle}`} onClick={() => toggleRoutine(routine)}>{routine.active ? <PauseCircle aria-hidden="true" /> : <PlayCircle aria-hidden="true" />}</Button><Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar ${routineTitle}`} onClick={() => openPanel({ kind: 'edit-routine', id: routine.id }, true)}><Edit3 aria-hidden="true" /></Button></div>
          })}</div> : <div className="py-10 text-center"><p className="text-sm font-medium">Nenhuma rotina cadastrada.</p><p className="mt-1 text-xs text-muted-foreground">Crie uma rotina para acompanhar cuidados recorrentes da casa.</p><Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => openPanel({ kind: 'create-routine' }, true)}>Criar rotina</Button></div>}</CardContent>
        </Card>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Onde estamos cuidando</h2>
        {costDistribution.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{costDistribution.map(item => {
          const Icon = getMaintenanceTypeIcon(item.type)
          const label = item.type === 'other' ? 'Outros' : getMaintenanceTypeLabel(item.type)
          return <Card key={item.type} size="sm" className="shadow-book-xs"><CardContent className="flex items-center gap-3"><Icon className="size-4 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-3 text-sm"><span className="font-medium">{label}</span><span>{formatCurrencyBRL(item.amount)} · {Math.round(item.percentage)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }} /></div></div></CardContent></Card>
        })}</div> : <p className="mt-4 rounded-lg bg-secondary/40 py-8 text-center text-sm text-muted-foreground">Ainda não há custos concluídos para agrupar.</p>}
      </section>

      <section className="rounded-lg bg-secondary/70 p-5 sm:flex sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-semibold">Cuidar também cria memórias</h2><p className="mt-1 text-sm text-muted-foreground">Vincule manutenções a capítulos para preservar o contexto de cada cuidado realizado na casa.</p></div><Button variant="ghost" className="mt-3 sm:mt-0" render={<Link to="/livro-da-casa" />}>Ver capítulos relacionados</Button></section>
    </div>
  </div>
}

export { Maintenance }
