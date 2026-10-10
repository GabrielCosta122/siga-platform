import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Archive, Edit3, Folder, Plus, RotateCcw } from 'lucide-react'
import type { Asset, MaintenanceRecord, Room } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createEntityId } from '@/lib/utils'

type RoomEditor = { kind: 'create' } | { kind: 'edit'; id: string } | null
type RoomErrors = Partial<Record<'name' | 'type' | 'order', string>>

export type RoomsSettingsPanelProps = {
  rooms: Room[]
  assets: Asset[]
  maintenanceRecords: MaintenanceRecord[]
  onAddRoom: (room: Room) => void
  onUpdateRoom: (id: string, changes: Partial<Room>) => void
  onArchiveRoom: (id: string) => void
  onFeedback?: (message: string) => void
}

type RoomEditorFormProps = {
  initial?: Room
  nextOrder: number
  confirmingArchive: boolean
  onCancel: () => void
  onSave: (values: { name: string; type: string; order: number }) => void
  onAskArchive: () => void
  onCancelArchive: () => void
  onArchive: () => void
}

const safeText = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback
const safeOrder = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback

function RoomEditorForm({
  initial,
  nextOrder,
  confirmingArchive,
  onCancel,
  onSave,
  onAskArchive,
  onCancelArchive,
  onArchive,
}: RoomEditorFormProps) {
  const [name, setName] = useState(safeText(initial?.name))
  const [type, setType] = useState(safeText(initial?.type))
  const [order, setOrder] = useState(String(safeOrder(initial?.order, nextOrder)))
  const [errors, setErrors] = useState<RoomErrors>({})
  const archiveTriggerRef = useRef<HTMLButtonElement>(null)
  const archiveHeadingRef = useRef<HTMLHeadingElement>(null)
  const shouldRestoreArchiveFocus = useRef(false)

  useEffect(() => {
    if (confirmingArchive) archiveHeadingRef.current?.focus()
    else if (shouldRestoreArchiveFocus.current) {
      archiveTriggerRef.current?.focus()
      shouldRestoreArchiveFocus.current = false
    }
  }, [confirmingArchive])

  function submit(event: FormEvent) {
    event.preventDefault()
    const parsedOrder = Number(order)
    const nextErrors: RoomErrors = {}
    if (!name.trim()) nextErrors.name = 'Informe o nome do ambiente.'
    if (!type.trim()) nextErrors.type = 'Informe o tipo do ambiente.'
    if (!order.trim() || !Number.isInteger(parsedOrder) || parsedOrder < 0) nextErrors.order = 'Informe uma ordem válida.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSave({ name: name.trim(), type: type.trim(), order: parsedOrder })
  }

  return <Card className="border-primary/20 shadow-book-sm">
    <CardHeader><CardTitle className="font-display text-xl">{initial ? 'Editar ambiente' : 'Adicionar ambiente'}</CardTitle></CardHeader>
    <CardContent>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <label className="space-y-1.5"><span className="text-sm font-medium">Nome</span><Input required value={name} onChange={event => setName(event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'settings-room-name-error' : undefined} placeholder="Ex.: Closet" />{errors.name ? <span id="settings-room-name-error" className="block text-xs text-destructive">{errors.name}</span> : null}</label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Tipo</span><Input required value={type} onChange={event => setType(event.target.value)} aria-invalid={!!errors.type} aria-describedby={errors.type ? 'settings-room-type-error' : undefined} placeholder="Ex.: Closet, quarto, área externa" />{errors.type ? <span id="settings-room-type-error" className="block text-xs text-destructive">{errors.type}</span> : null}</label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Ordem</span><Input type="number" min="0" step="1" required value={order} onChange={event => setOrder(event.target.value)} aria-invalid={!!errors.order} aria-describedby={errors.order ? 'settings-room-order-error' : undefined} />{errors.order ? <span id="settings-room-order-error" className="block text-xs text-destructive">{errors.order}</span> : null}</label>
        {confirmingArchive ? <div role="alertdialog" aria-labelledby="settings-room-archive-title" aria-describedby="settings-room-archive-description" onKeyDown={event => { if (event.key === 'Escape') { shouldRestoreArchiveFocus.current = true; onCancelArchive() } }} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 sm:col-span-2"><h3 ref={archiveHeadingRef} id="settings-room-archive-title" tabIndex={-1} className="font-display text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Arquivar este ambiente?</h3><p id="settings-room-archive-description" className="mt-1 text-xs leading-relaxed text-muted-foreground">Itens e manutenções continuarão preservados, e registros antigos seguirão exibindo este ambiente.</p><div className="mt-3 flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => { shouldRestoreArchiveFocus.current = true; onCancelArchive() }}>Cancelar</Button><Button type="button" variant="destructive" size="sm" onClick={onArchive}>Arquivar ambiente</Button></div></div> : <div className="flex flex-wrap justify-end gap-2 border-t pt-4 sm:col-span-2">{initial && initial.active !== false ? <Button ref={archiveTriggerRef} type="button" variant="ghost" className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onAskArchive}><Archive aria-hidden="true" />Arquivar</Button> : null}<Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">{initial ? 'Salvar ambiente' : 'Adicionar ambiente'}</Button></div>}
      </form>
    </CardContent>
  </Card>
}

function RoomsSettingsPanel({
  rooms,
  assets,
  maintenanceRecords,
  onAddRoom,
  onUpdateRoom,
  onArchiveRoom,
  onFeedback,
}: RoomsSettingsPanelProps) {
  const [editor, setEditor] = useState<RoomEditor>(null)
  const [confirmingArchive, setConfirmingArchive] = useState(false)
  const [editorRequest, setEditorRequest] = useState(0)
  const shouldRevealEditor = useRef(false)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const editorTriggerRef = useRef<HTMLElement | null>(null)
  const editingRoom = editor?.kind === 'edit' ? rooms.find(room => room.id === editor.id) : undefined
  const validOrders = rooms.map(room => safeOrder(room.order, -1)).filter(order => order >= 0)
  const nextOrder = (validOrders.length ? Math.max(...validOrders) : -1) + 1
  const sortedRooms = [...rooms].sort((left, right) => {
    const activeComparison = Number(right.active !== false) - Number(left.active !== false)
    return activeComparison
      || safeOrder(left.order, Number.MAX_SAFE_INTEGER) - safeOrder(right.order, Number.MAX_SAFE_INTEGER)
      || safeText(left.name).localeCompare(safeText(right.name), 'pt-BR')
      || left.id.localeCompare(right.id)
  })

  useEffect(() => {
    if (!editor || !shouldRevealEditor.current) return
    shouldRevealEditor.current = false
    editorContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    editorContainerRef.current?.focus({ preventScroll: true })
  }, [editor, editorRequest])

  function openEditor(nextEditor: Exclude<RoomEditor, null>, reveal = false) {
    if (document.activeElement instanceof HTMLElement) editorTriggerRef.current = document.activeElement
    shouldRevealEditor.current = reveal
    setEditor(nextEditor)
    setConfirmingArchive(false)
    if (reveal) setEditorRequest(request => request + 1)
  }

  function closeEditor() {
    const trigger = editorTriggerRef.current
    shouldRevealEditor.current = false
    setEditor(null)
    setConfirmingArchive(false)
    editorTriggerRef.current = null
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus()
    })
  }

  function saveRoom(values: { name: string; type: string; order: number }) {
    const now = new Date().toISOString()
    if (editingRoom) {
      onUpdateRoom(editingRoom.id, values)
      onFeedback?.('Ambiente atualizado.')
    } else {
      onAddRoom({
        id: createEntityId('room'),
        ...values,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      onFeedback?.('Ambiente criado.')
    }
    closeEditor()
  }

  function archiveRoom() {
    if (!editingRoom) return
    onArchiveRoom(editingRoom.id)
    onFeedback?.('Ambiente arquivado.')
    closeEditor()
  }

  function reactivateRoom(room: Room) {
    onUpdateRoom(room.id, { active: true })
    onFeedback?.('Ambiente reativado.')
  }

  return <section aria-labelledby="rooms-settings-heading">
    <div className="flex flex-wrap justify-between gap-3">
      <div><h2 id="rooms-settings-heading" className="font-display text-2xl font-semibold">Ambientes da casa</h2><p className="mt-1 text-sm text-muted-foreground">Os espaços que dão contexto aos capítulos e itens.</p></div>
      <Button type="button" variant="outline" onClick={() => openEditor({ kind: 'create' })}><Plus aria-hidden="true" />Adicionar</Button>
    </div>

    {editor ? <div ref={editorContainerRef} role="region" aria-label="Editor de ambiente" tabIndex={-1} className="mt-5 scroll-mt-20 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">{editor.kind === 'create' ? <RoomEditorForm nextOrder={nextOrder} confirmingArchive={false} onCancel={closeEditor} onSave={saveRoom} onAskArchive={() => undefined} onCancelArchive={() => undefined} onArchive={() => undefined} /> : editingRoom ? <RoomEditorForm key={editingRoom.id} initial={editingRoom} nextOrder={nextOrder} confirmingArchive={confirmingArchive} onCancel={closeEditor} onSave={saveRoom} onAskArchive={() => setConfirmingArchive(true)} onCancelArchive={() => setConfirmingArchive(false)} onArchive={archiveRoom} /> : null}</div> : null}

    {sortedRooms.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{sortedRooms.map(room => {
      const itemCount = assets.filter(asset => asset.roomId === room.id).length
      const maintenanceCount = maintenanceRecords.filter(record => record.roomId === room.id).length
      const roomName = safeText(room.name, 'Ambiente sem nome')
      const isActive = room.active !== false
      return <Card key={room.id} size="sm"><CardContent className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><Folder className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{roomName}</p><p className="text-xs text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'itens'} · {maintenanceCount} {maintenanceCount === 1 ? 'manutenção' : 'manutenções'}</p></div><Badge variant={isActive ? 'outline' : 'secondary'}>{isActive ? 'Ativo' : 'Arquivado'}</Badge>{isActive ? null : <Button type="button" variant="ghost" size="icon-sm" aria-label={`Reativar ${roomName}`} onClick={() => reactivateRoom(room)}><RotateCcw aria-hidden="true" /></Button>}<Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar ${roomName}`} onClick={() => openEditor({ kind: 'edit', id: room.id }, true)}><Edit3 aria-hidden="true" /></Button></CardContent></Card>
    })}</div> : <Card className="mt-5 border-dashed"><CardContent className="py-10 text-center"><p className="text-sm font-medium">Nenhum ambiente cadastrado</p><p className="mt-1 text-xs text-muted-foreground">Adicione o primeiro espaço da casa para organizar itens e cuidados.</p><Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => openEditor({ kind: 'create' }, true)}>Adicionar ambiente</Button></CardContent></Card>}
  </section>
}

export { RoomsSettingsPanel }
