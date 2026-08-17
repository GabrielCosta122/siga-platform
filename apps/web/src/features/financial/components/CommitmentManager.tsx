import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Chapter, FinancialCommitment } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommitmentForm } from '@/features/financial/components/CommitmentForm'
import { formatCurrencyBRL } from '@/lib/utils'
import { formatFinancialDate, getCommitmentStatusLabel } from '@/features/financial/presentation'

function CommitmentManager({ commitments, chapters, onClose, onSave, onDelete }: { commitments: FinancialCommitment[]; chapters: Chapter[]; onClose: () => void; onSave: (commitment: FinancialCommitment, editing: boolean) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState<FinancialCommitment | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<FinancialCommitment | null>(null)
  const sorted = [...commitments].sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
  return <Card className="border-primary/20 shadow-book-sm"><CardHeader><div className="flex items-center justify-between gap-4"><CardTitle className="font-display text-xl">Compromissos financeiros</CardTitle><div className="flex gap-2"><Button type="button" size="sm" onClick={() => { setCreating(true); setEditing(null) }}><Plus /> Novo compromisso</Button><Button type="button" variant="ghost" size="sm" onClick={onClose}>Fechar</Button></div></div></CardHeader><CardContent className="space-y-4">{creating || editing ? <CommitmentForm chapters={chapters} initial={editing ?? undefined} onCancel={() => { setCreating(false); setEditing(null) }} onSave={item => { onSave(item, !!editing); setCreating(false); setEditing(null) }} /> : null}{sorted.length ? <div className="divide-y rounded-lg border px-4">{sorted.map(item => <div key={item.id} className="flex flex-wrap items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title || 'Compromisso sem título'}</p><p className="mt-1 text-xs text-muted-foreground">{formatFinancialDate(item.dueDate)} · {item.category || 'Outros'}</p></div><p className="text-sm font-semibold">{formatCurrencyBRL(Number.isFinite(item.amount) ? item.amount : 0)}</p><Badge variant="outline">{getCommitmentStatusLabel(item.status)}</Badge><Button type="button" variant="ghost" size="icon" aria-label={`Editar ${item.title}`} onClick={() => { setEditing(item); setCreating(false); setDeleting(null) }}><Edit3 /></Button><Button type="button" variant="ghost" size="icon" className="text-destructive" aria-label={`Excluir ${item.title}`} onClick={() => setDeleting(item)}><Trash2 /></Button>{deleting?.id === item.id ? <div className="w-full rounded-md bg-destructive/5 p-3 text-sm"><p className="font-medium">Excluir este compromisso?</p><p className="mt-1 text-xs text-muted-foreground">O compromisso será removido sem excluir capítulos relacionados.</p><div className="mt-3 flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setDeleting(null)}>Cancelar</Button><Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(item.id); setDeleting(null) }}>Excluir compromisso</Button></div></div> : null}</div>)}</div> : <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">Nenhum compromisso registrado.</p>}</CardContent></Card>
}
export { CommitmentManager }
