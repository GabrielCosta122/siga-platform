import { useState, type FormEvent } from 'react'
import type { Chapter, FinancialTransaction } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createEntityId } from '@/lib/utils'
import { financialCategories, isValidISODate, normalizeTransactionStatus, parseCurrencyBRL } from '@/features/financial/presentation'

type TransactionFormProps = { chapters: Chapter[]; initial?: FinancialTransaction; onCancel: () => void; onSave: (transaction: FinancialTransaction) => void }
type Errors = Partial<Record<'title' | 'amount' | 'date' | 'category' | 'status', string>>
const fieldClass = 'h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function TransactionForm({ chapters, initial, onCancel, onSave }: TransactionFormProps) {
  const initialCategory = financialCategories.includes(initial?.category as typeof financialCategories[number]) ? initial!.category : initial ? 'Outros' : 'Aquisição'
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(initial ? initial.amount.toFixed(2).replace('.', ',') : '')
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState(initialCategory)
  const [status, setStatus] = useState<FinancialTransaction['status']>(normalizeTransactionStatus(initial?.status) ?? 'paid')
  const [type, setType] = useState<FinancialTransaction['type']>(initial?.type === 'income' ? 'income' : 'expense')
  const [chapterId, setChapterId] = useState(initial?.chapterId ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const missingChapter = initial?.chapterId && !chapters.some(chapter => chapter.id === initial.chapterId)

  function submit(event: FormEvent) {
    event.preventDefault()
    const parsedAmount = parseCurrencyBRL(amount)
    const nextErrors: Errors = {}
    if (!title.trim()) nextErrors.title = 'Informe um título para esta movimentação.'
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) nextErrors.amount = 'Informe um valor maior que zero.'
    if (!isValidISODate(date)) nextErrors.date = 'Informe a data da movimentação.'
    if (!financialCategories.includes(category as typeof financialCategories[number])) nextErrors.category = 'Escolha uma categoria.'
    if (!normalizeTransactionStatus(status)) nextErrors.status = 'Escolha um status válido.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const now = new Date().toISOString()
    onSave({ id: initial?.id ?? createEntityId('transaction'), title: title.trim(), description: description.trim(), amount: parsedAmount, date, type, status, category, chapterId: chapterId || null, documentIds: initial?.documentIds ?? [], assetId: initial?.assetId ?? null, maintenanceId: initial?.maintenanceId ?? null, createdAt: initial?.createdAt ?? now, updatedAt: now })
  }

  return <Card className="border-primary/20 shadow-book-sm"><CardHeader><CardTitle className="font-display text-xl">{initial ? 'Editar movimentação' : 'Registrar movimentação'}</CardTitle></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
    <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Título</span><Input value={title} onChange={event => setTitle(event.target.value)} aria-invalid={!!errors.title} />{errors.title ? <span className="block text-xs text-destructive">{errors.title}</span> : null}</label>
    <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Descrição</span><Textarea value={description} onChange={event => setDescription(event.target.value)} className="min-h-20" /></label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Valor</span><Input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="R$ 0,00" aria-invalid={!!errors.amount} />{errors.amount ? <span className="block text-xs text-destructive">{errors.amount}</span> : null}</label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Data</span><Input type="date" value={date} onChange={event => setDate(event.target.value)} aria-invalid={!!errors.date} />{errors.date ? <span className="block text-xs text-destructive">{errors.date}</span> : null}</label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Categoria</span><select className={fieldClass} value={category} onChange={event => setCategory(event.target.value)}>{financialCategories.map(item => <option key={item}>{item}</option>)}</select>{errors.category ? <span className="block text-xs text-destructive">{errors.category}</span> : null}</label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Status</span><select className={fieldClass} value={status} onChange={event => setStatus(event.target.value as FinancialTransaction['status'])}><option value="paid">Pago</option><option value="pending">Pendente</option><option value="scheduled">Agendado</option><option value="cancelled">Cancelado</option></select>{errors.status ? <span className="block text-xs text-destructive">{errors.status}</span> : null}</label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Tipo</span><select className={fieldClass} value={type} onChange={event => setType(event.target.value as FinancialTransaction['type'])}><option value="expense">Despesa</option><option value="income">Entrada</option></select></label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Capítulo relacionado</span><select className={fieldClass} value={chapterId} onChange={event => setChapterId(event.target.value)}><option value="">Nenhum capítulo</option>{missingChapter ? <option value={initial.chapterId!}>Capítulo relacionado não disponível</option> : null}{chapters.map(chapter => <option key={chapter.id} value={chapter.id}>{chapter.title} · {chapter.date}</option>)}</select></label>
    <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">{initial ? 'Salvar alterações' : 'Salvar movimentação'}</Button></div>
  </form></CardContent></Card>
}
export { TransactionForm }
