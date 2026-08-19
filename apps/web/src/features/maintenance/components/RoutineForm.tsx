import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { Asset, MaintenanceRoutine, Room } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  isValidMaintenanceDate,
  getSafeMaintenanceText,
  maintenanceFrequencies,
  maintenanceFrequencyConfig,
  normalizeMaintenanceFrequency,
  type MaintenanceFrequency,
} from '@/features/maintenance/presentation'
import { createEntityId } from '@/lib/utils'

type RoutineFormProps = {
  initial?: MaintenanceRoutine
  assets: Asset[]
  rooms: Room[]
  confirmingDelete?: boolean
  onCancel: () => void
  onSave: (routine: MaintenanceRoutine) => void
  onAskDelete?: () => void
  onCancelDelete?: () => void
  onDelete?: () => void
}

type FrequencyChoice = MaintenanceFrequency | 'custom'
type Errors = Partial<Record<'title' | 'frequency' | 'nextDate', string>>

const fieldClass = 'h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20'
const getSafeCreatedAt = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.includes('T') && Number.isFinite(Date.parse(value)) ? value : fallback

function RoutineForm({
  initial,
  assets,
  rooms,
  confirmingDelete = false,
  onCancel,
  onSave,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: RoutineFormProps) {
  const normalizedInitialFrequency = normalizeMaintenanceFrequency(initial?.frequency)
  const initialFrequency = getSafeMaintenanceText(initial?.frequency, '')
  const initialRoomId = typeof initial?.roomId === 'string' ? initial.roomId : ''
  const initialAssetId = typeof initial?.assetId === 'string' ? initial.assetId : ''
  const [title, setTitle] = useState(getSafeMaintenanceText(initial?.title, ''))
  const [frequencyChoice, setFrequencyChoice] = useState<FrequencyChoice>(normalizedInitialFrequency ?? (initialFrequency ? 'custom' : 'monthly'))
  const [customFrequency, setCustomFrequency] = useState(normalizedInitialFrequency ? '' : initialFrequency)
  const [nextDate, setNextDate] = useState(isValidMaintenanceDate(initial?.nextDate) ? initial!.nextDate : '')
  const [active, setActive] = useState(typeof initial?.active === 'boolean' ? initial.active : true)
  const [roomId, setRoomId] = useState(initialRoomId)
  const [assetId, setAssetId] = useState(initialAssetId)
  const [errors, setErrors] = useState<Errors>({})
  const deleteHeadingRef = useRef<HTMLHeadingElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreDeleteFocus = useRef(false)

  useEffect(() => {
    if (confirmingDelete) {
      deleteHeadingRef.current?.focus()
      return
    }
    if (!shouldRestoreDeleteFocus.current) return
    shouldRestoreDeleteFocus.current = false
    deleteButtonRef.current?.focus()
  }, [confirmingDelete])

  const sortedRooms = [...rooms].sort((a, b) => {
    const leftOrder = typeof a.order === 'number' && Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER
    const rightOrder = typeof b.order === 'number' && Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder || getSafeMaintenanceText(a.name, '').localeCompare(getSafeMaintenanceText(b.name, ''), 'pt-BR')
  })
  const missingAsset = !!initialAssetId && !assets.some(asset => asset.id === initialAssetId)
  const missingRoom = !!initialRoomId && !rooms.some(room => room.id === initialRoomId)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (confirmingDelete) return
    const frequency = frequencyChoice === 'custom' ? customFrequency.trim() : frequencyChoice
    const nextErrors: Errors = {}
    if (!title.trim()) nextErrors.title = 'Informe o título da rotina.'
    if (!frequency) nextErrors.frequency = 'Escolha ou descreva a frequência.'
    if (!isValidMaintenanceDate(nextDate)) nextErrors.nextDate = 'Informe a próxima data desta rotina.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const now = new Date().toISOString()
    onSave({
      id: initial?.id ?? createEntityId('routine'),
      title: title.trim(),
      frequency,
      nextDate,
      active,
      roomId: roomId || null,
      assetId: assetId || null,
      createdAt: getSafeCreatedAt(initial?.createdAt, now),
      updatedAt: now,
    })
  }

  function cancelDelete() {
    shouldRestoreDeleteFocus.current = true
    onCancelDelete?.()
  }

  const canDelete = !!initial && !!onAskDelete && !!onCancelDelete && !!onDelete

  return <Card className="border-primary/20 shadow-book-sm">
    <CardHeader><CardTitle className="font-display text-xl">{initial ? 'Editar rotina' : 'Criar rotina'}</CardTitle></CardHeader>
    <CardContent>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Título</span><Input required value={title} onChange={event => setTitle(event.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'routine-title-error' : undefined} placeholder="Ex.: Limpeza dos filtros" />{errors.title ? <span id="routine-title-error" className="block text-xs text-destructive">{errors.title}</span> : null}</label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Frequência</span><select required className={fieldClass} value={frequencyChoice} onChange={event => setFrequencyChoice(event.target.value as FrequencyChoice)} aria-invalid={!!errors.frequency} aria-describedby={errors.frequency ? 'routine-frequency-error' : undefined}>{maintenanceFrequencies.map(id => <option key={id} value={id}>{maintenanceFrequencyConfig[id].label}</option>)}<option value="custom">Personalizada</option></select>{errors.frequency ? <span id="routine-frequency-error" className="block text-xs text-destructive">{errors.frequency}</span> : null}</label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Próxima data</span><Input type="date" required value={nextDate} onChange={event => setNextDate(event.target.value)} aria-invalid={!!errors.nextDate} aria-describedby={errors.nextDate ? 'routine-next-date-error' : undefined} />{errors.nextDate ? <span id="routine-next-date-error" className="block text-xs text-destructive">{errors.nextDate}</span> : null}</label>
        {frequencyChoice === 'custom' ? <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Descreva a frequência</span><Input required value={customFrequency} onChange={event => setCustomFrequency(event.target.value)} aria-invalid={!!errors.frequency} aria-describedby={errors.frequency ? 'routine-frequency-error' : undefined} placeholder="Ex.: A cada 45 dias" /></label> : null}
        <label className="space-y-1.5"><span className="text-sm font-medium">Item relacionado</span><select className={fieldClass} value={assetId} onChange={event => setAssetId(event.target.value)}><option value="">Nenhum item</option>{missingAsset ? <option value={initialAssetId}>Item relacionado não disponível</option> : null}{assets.map(asset => <option key={asset.id} value={asset.id}>{getSafeMaintenanceText(asset.name, 'Item sem nome')}</option>)}</select></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Ambiente relacionado</span><select className={fieldClass} value={roomId} onChange={event => setRoomId(event.target.value)}><option value="">Toda a casa ou sem ambiente</option>{missingRoom ? <option value={initialRoomId}>Ambiente relacionado não disponível</option> : null}{sortedRooms.map(room => <option key={room.id} value={room.id}>{getSafeMaintenanceText(room.name, 'Ambiente sem nome')}{room.active ? '' : ' (arquivado)'}</option>)}</select></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} className="size-4 accent-primary" /> Rotina ativa</label>
        {canDelete && confirmingDelete ? <div role="alertdialog" aria-labelledby="routine-delete-title" aria-describedby="routine-delete-description" className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 sm:col-span-2">
          <h3 ref={deleteHeadingRef} id="routine-delete-title" tabIndex={-1} className="font-display text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">Excluir esta rotina?</h3>
          <p id="routine-delete-description" className="mt-1 text-sm leading-relaxed text-muted-foreground">Essa rotina deixará de organizar os próximos cuidados da casa. Manutenções já registradas permanecerão no histórico.</p>
          <div className="mt-4 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={cancelDelete}>Cancelar</Button><Button type="button" variant="destructive" onClick={onDelete}><Trash2 aria-hidden="true" />Excluir rotina</Button></div>
        </div> : <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 sm:col-span-2">
          {canDelete ? <Button ref={deleteButtonRef} type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onAskDelete}><Trash2 aria-hidden="true" />Excluir rotina</Button> : <span aria-hidden="true" />}
          <div className="flex gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">{initial ? 'Salvar rotina' : 'Criar rotina'}</Button></div>
        </div>}
      </form>
    </CardContent>
  </Card>
}

export { RoutineForm }
export type { RoutineFormProps }
