import { useState, type FormEvent } from 'react'
import type {
  Asset,
  Chapter,
  FinancialTransaction,
  HouseDocument,
  MaintenanceRecord,
  MaintenanceRoutine,
  Room,
} from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  getSafeMaintenanceCost,
  getSafeMaintenanceText,
  getLocalMaintenanceDate,
  isValidMaintenanceDate,
  maintenancePriorities,
  maintenancePriorityConfig,
  maintenanceStatuses,
  maintenanceStatusConfig,
  maintenanceTypes,
  maintenanceTypeConfig,
  normalizeMaintenancePriority,
  normalizeMaintenanceStatus,
  normalizeMaintenanceType,
  parseMaintenanceCostBRL,
  type MaintenanceType,
} from '@/features/maintenance/presentation'
import { createEntityId } from '@/lib/utils'

type MaintenanceFormMode = 'create' | 'edit' | 'reschedule'
type MaintenanceStatus = MaintenanceRecord['status']
type MaintenancePriority = MaintenanceRecord['priority']

type MaintenanceFormProps = {
  initial?: MaintenanceRecord
  mode?: MaintenanceFormMode
  defaultAssetId?: string
  assets: Asset[]
  rooms: Room[]
  chapters: Chapter[]
  documents: HouseDocument[]
  transactions: FinancialTransaction[]
  routines: MaintenanceRoutine[]
  onCancel: () => void
  onSave: (maintenance: MaintenanceRecord) => void
}

type Errors = Partial<Record<'title' | 'type' | 'status' | 'priority' | 'scheduledDate' | 'completedDate' | 'cost', string>>

const fieldClass = 'h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20'
const getSafeCreatedAt = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.includes('T') && Number.isFinite(Date.parse(value)) ? value : fallback

function MaintenanceForm({
  initial,
  mode,
  defaultAssetId,
  assets,
  rooms,
  chapters,
  documents,
  transactions,
  routines,
  onCancel,
  onSave,
}: MaintenanceFormProps) {
  const resolvedMode: MaintenanceFormMode = initial ? mode ?? 'edit' : 'create'
  const isRescheduling = resolvedMode === 'reschedule' && !!initial
  const initialAssetId = typeof initial?.assetId === 'string' ? initial.assetId : ''
  const initialRoomId = typeof initial?.roomId === 'string' ? initial.roomId : ''
  const initialChapterId = typeof initial?.chapterId === 'string' ? initial.chapterId : ''
  const initialTransactionId = typeof initial?.financialTransactionId === 'string' ? initial.financialTransactionId : ''
  const initialRoutineId = typeof initial?.recurringRoutineId === 'string' ? initial.recurringRoutineId : ''
  const validDefaultAssetId = !initial && resolvedMode === 'create' && defaultAssetId && assets.some(asset => asset.id === defaultAssetId)
    ? defaultAssetId
    : ''
  const initialCost = getSafeMaintenanceCost(initial?.cost)
  const initialStatus: MaintenanceStatus = normalizeMaintenanceStatus(initial?.status) ?? 'planned'

  const [title, setTitle] = useState(getSafeMaintenanceText(initial?.title, ''))
  const [description, setDescription] = useState(getSafeMaintenanceText(initial?.description, ''))
  const [type, setType] = useState<MaintenanceType>(normalizeMaintenanceType(initial?.type) ?? 'preventive')
  const [status, setStatus] = useState<MaintenanceStatus>(initialStatus)
  const [priority, setPriority] = useState<MaintenancePriority>(normalizeMaintenancePriority(initial?.priority) ?? 'medium')
  const [scheduledDate, setScheduledDate] = useState(initial
    ? isValidMaintenanceDate(initial.scheduledDate) ? initial.scheduledDate : ''
    : getLocalMaintenanceDate())
  const [completedDate, setCompletedDate] = useState(isValidMaintenanceDate(initial?.completedDate) ? initial!.completedDate! : '')
  const [cost, setCost] = useState(initialCost === null ? '' : initialCost.toFixed(2).replace('.', ','))
  const [responsible, setResponsible] = useState(getSafeMaintenanceText(initial?.responsible, ''))
  const [supplier, setSupplier] = useState(getSafeMaintenanceText(initial?.supplier, ''))
  const [roomId, setRoomId] = useState(initialRoomId)
  const [assetId, setAssetId] = useState(initialAssetId || validDefaultAssetId)
  const [chapterId, setChapterId] = useState(initialChapterId)
  const [documentIds, setDocumentIds] = useState<string[]>(
    Array.isArray(initial?.documentIds)
      ? [...new Set(initial.documentIds.filter((id): id is string => typeof id === 'string'))]
      : [],
  )
  const [financialTransactionId, setFinancialTransactionId] = useState(initialTransactionId)
  const [recurringRoutineId, setRecurringRoutineId] = useState(initialRoutineId)
  const [errors, setErrors] = useState<Errors>({})

  const sortedRooms = [...rooms].sort((a, b) => {
    const leftOrder = typeof a.order === 'number' && Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER
    const rightOrder = typeof b.order === 'number' && Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder || getSafeMaintenanceText(a.name, '').localeCompare(getSafeMaintenanceText(b.name, ''), 'pt-BR')
  })
  const missingAsset = !!initialAssetId && !assets.some(asset => asset.id === initialAssetId)
  const missingRoom = !!initialRoomId && !rooms.some(room => room.id === initialRoomId)
  const missingChapter = !!initialChapterId && !chapters.some(chapter => chapter.id === initialChapterId)
  const missingTransaction = !!initialTransactionId && !transactions.some(transaction => transaction.id === initialTransactionId)
  const missingRoutine = !!initialRoutineId && !routines.some(routine => routine.id === initialRoutineId)
  const missingDocumentIds = documentIds.filter(id => !documents.some(document => document.id === id))

  function toggleDocument(documentId: string) {
    setDocumentIds(current => current.includes(documentId)
      ? current.filter(id => id !== documentId)
      : [...current, documentId])
  }

  function updateStatus(nextStatus: MaintenanceStatus) {
    setStatus(nextStatus)
    if (nextStatus === 'completed' && !completedDate) setCompletedDate(getLocalMaintenanceDate())
    if (nextStatus !== 'completed') setCompletedDate('')
  }

  function submit(event: FormEvent) {
    event.preventDefault()

    if (isRescheduling && initial) {
      const nextErrors: Errors = {}
      if (!isValidMaintenanceDate(scheduledDate)) nextErrors.scheduledDate = 'Informe quando esse cuidado deve acontecer.'
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length) return

      const now = new Date().toISOString()
      onSave({ ...initial, scheduledDate, createdAt: getSafeCreatedAt(initial.createdAt, now), updatedAt: now })
      return
    }

    const parsedCost = cost.trim() ? parseMaintenanceCostBRL(cost) : null
    const nextErrors: Errors = {}
    if (!title.trim()) nextErrors.title = 'Informe o título da manutenção.'
    if (!normalizeMaintenanceType(type)) nextErrors.type = 'Escolha o tipo de cuidado.'
    if (!normalizeMaintenanceStatus(status)) nextErrors.status = 'Escolha o status.'
    if (!normalizeMaintenancePriority(priority)) nextErrors.priority = 'Escolha a prioridade.'
    if (!isValidMaintenanceDate(scheduledDate)) nextErrors.scheduledDate = 'Informe quando esse cuidado deve acontecer.'
    if (status === 'completed' && !isValidMaintenanceDate(completedDate)) nextErrors.completedDate = 'Informe quando esse cuidado foi concluído.'
    if (parsedCost !== null && (!Number.isFinite(parsedCost) || parsedCost < 0)) nextErrors.cost = 'Informe um custo igual ou maior que zero.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const now = new Date().toISOString()
    onSave({
      id: initial?.id ?? createEntityId('maintenance'),
      title: title.trim(),
      description: description.trim(),
      type,
      status,
      priority,
      scheduledDate,
      completedDate: status === 'completed' ? completedDate : null,
      cost: parsedCost,
      responsible: responsible.trim(),
      supplier: supplier.trim(),
      roomId: roomId || null,
      assetId: assetId || null,
      chapterId: chapterId || null,
      documentIds,
      financialTransactionId: financialTransactionId || null,
      recurringRoutineId: recurringRoutineId || null,
      createdAt: getSafeCreatedAt(initial?.createdAt, now),
      updatedAt: now,
    })
  }

  const titleByMode: Record<MaintenanceFormMode, string> = {
    create: 'Registrar manutenção',
    edit: 'Editar manutenção',
    reschedule: 'Reagendar manutenção',
  }

  return <Card className="border-primary/20 shadow-book-sm">
    <CardHeader>
      <CardTitle className="font-display text-xl">{titleByMode[resolvedMode]}</CardTitle>
      {isRescheduling ? <p className="text-sm text-muted-foreground">{getSafeMaintenanceText(initial.title, 'Manutenção sem título')}</p> : null}
    </CardHeader>
    <CardContent>
      <form className="space-y-6" onSubmit={submit} noValidate>
        {isRescheduling ? <label className="block space-y-1.5">
          <span className="text-sm font-medium">Nova data prevista</span>
          <Input type="date" required value={scheduledDate} onChange={event => setScheduledDate(event.target.value)} aria-invalid={!!errors.scheduledDate} aria-describedby={errors.scheduledDate ? 'maintenance-reschedule-date-error' : undefined} />
          {errors.scheduledDate ? <span id="maintenance-reschedule-date-error" className="block text-xs text-destructive">{errors.scheduledDate}</span> : null}
        </label> : <>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 font-display text-base font-semibold">Cuidado</legend>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Título</span><Input required value={title} onChange={event => setTitle(event.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'maintenance-title-error' : undefined} placeholder="Ex.: Revisão do ar-condicionado" />{errors.title ? <span id="maintenance-title-error" className="block text-xs text-destructive">{errors.title}</span> : null}</label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Descrição</span><Textarea value={description} onChange={event => setDescription(event.target.value)} className="min-h-20" placeholder="Conte o que precisa ser cuidado." /></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Tipo</span><select required className={fieldClass} value={type} onChange={event => setType(event.target.value as MaintenanceType)} aria-invalid={!!errors.type} aria-describedby={errors.type ? 'maintenance-type-error' : undefined}>{maintenanceTypes.map(id => <option key={id} value={id}>{maintenanceTypeConfig[id].label}</option>)}</select>{errors.type ? <span id="maintenance-type-error" className="block text-xs text-destructive">{errors.type}</span> : null}</label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Status</span><select required className={fieldClass} value={status} onChange={event => updateStatus(event.target.value as MaintenanceStatus)} aria-invalid={!!errors.status} aria-describedby={errors.status ? 'maintenance-status-error' : undefined}>{maintenanceStatuses.map(id => <option key={id} value={id}>{maintenanceStatusConfig[id].label}</option>)}</select>{errors.status ? <span id="maintenance-status-error" className="block text-xs text-destructive">{errors.status}</span> : null}</label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Prioridade</span><select required className={fieldClass} value={priority} onChange={event => setPriority(event.target.value as MaintenancePriority)} aria-invalid={!!errors.priority} aria-describedby={errors.priority ? 'maintenance-priority-error' : undefined}>{maintenancePriorities.map(id => <option key={id} value={id}>{maintenancePriorityConfig[id].label}</option>)}</select>{errors.priority ? <span id="maintenance-priority-error" className="block text-xs text-destructive">{errors.priority}</span> : null}</label>
          </fieldset>

          <fieldset className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <legend className="mb-3 font-display text-base font-semibold">Planejamento</legend>
            <label className="space-y-1.5"><span className="text-sm font-medium">Data prevista</span><Input type="date" required value={scheduledDate} onChange={event => setScheduledDate(event.target.value)} aria-invalid={!!errors.scheduledDate} aria-describedby={errors.scheduledDate ? 'maintenance-scheduled-date-error' : undefined} />{errors.scheduledDate ? <span id="maintenance-scheduled-date-error" className="block text-xs text-destructive">{errors.scheduledDate}</span> : null}</label>
            {status === 'completed' ? <label className="space-y-1.5"><span className="text-sm font-medium">Data concluída</span><Input type="date" required value={completedDate} onChange={event => setCompletedDate(event.target.value)} aria-invalid={!!errors.completedDate} aria-describedby={errors.completedDate ? 'maintenance-completed-date-error' : undefined} />{errors.completedDate ? <span id="maintenance-completed-date-error" className="block text-xs text-destructive">{errors.completedDate}</span> : null}</label> : null}
            <label className="space-y-1.5"><span className="text-sm font-medium">Responsável</span><Input value={responsible} onChange={event => setResponsible(event.target.value)} placeholder="Quem acompanhará este cuidado" /></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Fornecedor</span><Input value={supplier} onChange={event => setSupplier(event.target.value)} placeholder="Empresa ou profissional" /></label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Custo</span><Input inputMode="decimal" value={cost} onChange={event => setCost(event.target.value)} aria-invalid={!!errors.cost} aria-describedby={errors.cost ? 'maintenance-cost-error' : undefined} placeholder="R$ 0,00" />{errors.cost ? <span id="maintenance-cost-error" className="block text-xs text-destructive">{errors.cost}</span> : null}</label>
          </fieldset>

          <fieldset className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <legend className="mb-3 font-display text-base font-semibold">Relações</legend>
            <label className="space-y-1.5"><span className="text-sm font-medium">Item relacionado</span><select className={fieldClass} value={assetId} onChange={event => setAssetId(event.target.value)}><option value="">Manutenção geral da casa</option>{missingAsset ? <option value={initialAssetId}>Item relacionado não disponível</option> : null}{assets.map(asset => <option key={asset.id} value={asset.id}>{getSafeMaintenanceText(asset.name, 'Item sem nome')}</option>)}</select></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Ambiente relacionado</span><select className={fieldClass} value={roomId} onChange={event => setRoomId(event.target.value)}><option value="">Toda a casa ou sem ambiente</option>{missingRoom ? <option value={initialRoomId}>Ambiente relacionado não disponível</option> : null}{sortedRooms.map(room => <option key={room.id} value={room.id}>{getSafeMaintenanceText(room.name, 'Ambiente sem nome')}{room.active ? '' : ' (arquivado)'}</option>)}</select></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Capítulo relacionado</span><select className={fieldClass} value={chapterId} onChange={event => setChapterId(event.target.value)}><option value="">Nenhum capítulo</option>{missingChapter ? <option value={initialChapterId}>Capítulo relacionado não disponível</option> : null}{chapters.map(chapter => <option key={chapter.id} value={chapter.id}>{getSafeMaintenanceText(chapter.title, 'Capítulo sem título')} · {getSafeMaintenanceText(chapter.date, 'Data não disponível')}</option>)}</select></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Movimentação financeira</span><select className={fieldClass} value={financialTransactionId} onChange={event => setFinancialTransactionId(event.target.value)}><option value="">Nenhuma movimentação</option>{missingTransaction ? <option value={initialTransactionId}>Movimentação relacionada não disponível</option> : null}{transactions.map(transaction => <option key={transaction.id} value={transaction.id}>{getSafeMaintenanceText(transaction.title, 'Movimentação sem título')} · {getSafeMaintenanceText(transaction.date, 'Data não disponível')}</option>)}</select></label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Rotina recorrente</span><select className={fieldClass} value={recurringRoutineId} onChange={event => setRecurringRoutineId(event.target.value)}><option value="">Nenhuma rotina</option>{missingRoutine ? <option value={initialRoutineId}>Rotina relacionada não disponível</option> : null}{routines.map(routine => <option key={routine.id} value={routine.id}>{getSafeMaintenanceText(routine.title, 'Rotina sem título')} · {getSafeMaintenanceText(routine.nextDate, 'Data não disponível')}</option>)}</select></label>
            <div className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Documentos relacionados</span>{documents.length || missingDocumentIds.length ? <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border bg-card p-3 sm:grid-cols-2">{missingDocumentIds.map(id => <label key={id} className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked onChange={() => toggleDocument(id)} className="mt-0.5 size-4 accent-primary" /> Documento relacionado não disponível</label>)}{documents.map(document => <label key={document.id} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={documentIds.includes(document.id)} onChange={() => toggleDocument(document.id)} className="mt-0.5 size-4 accent-primary" /><span>{getSafeMaintenanceText(document.name, 'Documento sem nome')}</span></label>)}</div> : <p className="text-xs text-muted-foreground">Nenhum documento disponível.</p>}</div>
          </fieldset>
        </>}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">{isRescheduling ? 'Salvar nova data' : initial ? 'Salvar alterações' : 'Registrar manutenção'}</Button>
        </div>
      </form>
    </CardContent>
  </Card>
}

export { MaintenanceForm }
export type { MaintenanceFormMode, MaintenanceFormProps }
