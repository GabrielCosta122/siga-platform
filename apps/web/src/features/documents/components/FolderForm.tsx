import { useState, type FormEvent } from 'react'
import type { DocumentFolder } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createEntityId } from '@/lib/utils'

function FolderForm({ onCancel, onSave }: { onCancel: () => void; onSave: (folder: DocumentFolder) => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  function submit(event: FormEvent) { event.preventDefault(); if (!name.trim()) { setError('Informe o nome da pasta.'); return } const now = new Date().toISOString(); onSave({ id: createEntityId('folder'), name: name.trim(), createdAt: now, updatedAt: now }) }
  return <Card className="border-primary/20 shadow-book-sm"><CardHeader><CardTitle className="font-display text-xl">Criar pasta</CardTitle></CardHeader><CardContent><form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={submit} noValidate><label className="flex-1 space-y-1.5"><span className="text-sm font-medium">Nome</span><Input value={name} onChange={event => { setName(event.target.value); setError('') }} aria-invalid={!!error} />{error ? <span className="block text-xs text-destructive">{error}</span> : null}</label><div className="flex gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">Criar pasta</Button></div></form></CardContent></Card>
}
export { FolderForm }
