import { useState, type FormEvent } from 'react'
import type { Room } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createEntityId } from '@/lib/utils'

type RoomFormProps = {
  initial?: Room
  nextOrder: number
  onCancel: () => void
  onSave: (room: Room) => void
  onArchive?: () => void
}

type Errors = Partial<Record<'name' | 'type' | 'order', string>>

function RoomForm({ initial, nextOrder, onCancel, onSave, onArchive }: RoomFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState(initial?.type === 'general' ? 'Ambiente geral' : initial?.type ?? '')
  const [order, setOrder] = useState(String(initial?.order ?? nextOrder))
  const [active, setActive] = useState(initial?.active ?? true)
  const [confirmingArchive, setConfirmingArchive] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  function submit(event: FormEvent) {
    event.preventDefault()
    const parsedOrder = Number(order)
    const nextErrors: Errors = {}
    if (!name.trim()) nextErrors.name = 'Informe o nome do ambiente.'
    if (!type.trim()) nextErrors.type = 'Informe o tipo do ambiente.'
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) nextErrors.order = 'Informe uma ordem válida.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const now = new Date().toISOString()
    onSave({
      id: initial?.id ?? createEntityId('room'),
      name: name.trim(),
      type: type.trim(),
      active: initial ? active : true,
      order: parsedOrder,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return <Card className="border-primary/20 shadow-book-sm">
    <CardHeader><CardTitle className="font-display text-xl">{initial ? 'Editar ambiente' : 'Cadastrar ambiente'}</CardTitle></CardHeader>
    <CardContent>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <label className="space-y-1.5"><span className="text-sm font-medium">Nome</span><Input value={name} onChange={event => setName(event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'room-name-error' : undefined} placeholder="Ex.: Sala de estar" />{errors.name ? <span id="room-name-error" className="block text-xs text-destructive">{errors.name}</span> : null}</label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Tipo</span><Input value={type} onChange={event => setType(event.target.value)} aria-invalid={!!errors.type} aria-describedby={errors.type ? 'room-type-error' : undefined} placeholder="Ex.: Sala, quarto, área externa" />{errors.type ? <span id="room-type-error" className="block text-xs text-destructive">{errors.type}</span> : null}</label>
        {initial ? <label className="space-y-1.5"><span className="text-sm font-medium">Ordem</span><Input type="number" min="0" step="1" value={order} onChange={event => setOrder(event.target.value)} aria-invalid={!!errors.order} aria-describedby={errors.order ? 'room-order-error' : undefined} />{errors.order ? <span id="room-order-error" className="block text-xs text-destructive">{errors.order}</span> : null}</label> : null}
        {initial ? <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} className="size-4 accent-primary" /> Ambiente ativo</label> : null}
        {confirmingArchive ? <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 sm:col-span-2"><h3 className="font-display text-base font-semibold">Arquivar este ambiente?</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Os itens associados continuarão preservados e poderão indicar este ambiente como arquivado.</p><div className="mt-3 flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingArchive(false)}>Cancelar</Button><Button type="button" variant="destructive" size="sm" onClick={onArchive}>Arquivar ambiente</Button></div></div> : <div className="flex flex-wrap justify-end gap-2 border-t pt-4 sm:col-span-2">{initial?.active && onArchive ? <Button type="button" variant="ghost" className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirmingArchive(true)}>Arquivar</Button> : null}<Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">{initial ? 'Salvar ambiente' : 'Adicionar ambiente'}</Button></div>}
      </form>
    </CardContent>
  </Card>
}

export { RoomForm }
