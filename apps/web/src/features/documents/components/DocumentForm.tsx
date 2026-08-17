import { useState, type FormEvent } from 'react'
import { FileUp } from 'lucide-react'
import type { Chapter, DocumentFolder, FinancialTransaction, HouseDocument } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createEntityId } from '@/lib/utils'
import { documentCategoryConfig, documentFileTypeConfig, formatBytes, getDocumentFileTypeFromFile, isValidDocumentDate, normalizeDocumentCategory, normalizeDocumentFileType, parseFileSize, type DocumentCategory, type DocumentFileType } from '@/features/documents/presentation'

type Errors = Partial<Record<'name' | 'category' | 'fileType' | 'date', string>>
type SaveResult = string | null
type Props = { initial?: HouseDocument; folders: DocumentFolder[]; chapters: Chapter[]; transactions: FinancialTransaction[]; onCancel: () => void; onSave: (document: HouseDocument, file?: File) => Promise<SaveResult> }
const fieldClass = 'h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function DocumentForm({ initial, folders, chapters, transactions, onCancel, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState<DocumentCategory>(normalizeDocumentCategory(initial?.category) ?? 'contracts')
  const [fileType, setFileType] = useState<DocumentFileType>(normalizeDocumentFileType(initial?.fileType) ?? 'pdf')
  const [size, setSize] = useState(initial ? formatBytes(initial.sizeInBytes) : '')
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const [important, setImportant] = useState(initial?.important ?? false)
  const [folderId, setFolderId] = useState(initial?.folderId ?? '')
  const [chapterId, setChapterId] = useState(initial?.chapterId ?? '')
  const [financialTransactionId, setFinancialTransactionId] = useState(initial?.financialTransactionId ?? '')
  const [selectedFile, setSelectedFile] = useState<File>()
  const [errors, setErrors] = useState<Errors>({})
  const [storageError, setStorageError] = useState('')
  const [saving, setSaving] = useState(false)
  const missingFolder = initial?.folderId && !folders.some(folder => folder.id === initial.folderId)
  const missingChapter = initial?.chapterId && !chapters.some(chapter => chapter.id === initial.chapterId)
  const missingTransaction = initial?.financialTransactionId && !transactions.some(transaction => transaction.id === initial.financialTransactionId)

  function selectFile(file?: File) {
    setSelectedFile(file)
    setStorageError('')
    if (!file) return
    setName(file.name)
    setFileType(getDocumentFileTypeFromFile(file))
    setSize(formatBytes(file.size))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: Errors = {}
    if (!name.trim()) nextErrors.name = 'Informe o nome do documento.'
    if (!normalizeDocumentCategory(category)) nextErrors.category = 'Escolha uma categoria.'
    if (!normalizeDocumentFileType(fileType)) nextErrors.fileType = 'Escolha o tipo do arquivo.'
    if (!isValidDocumentDate(date)) nextErrors.date = 'Informe a data do documento.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const now = new Date().toISOString()
    const storedFileType = selectedFile ? getDocumentFileTypeFromFile(selectedFile) : fileType
    const document: HouseDocument = { id: initial?.id ?? createEntityId('document'), name: name.trim(), description: description.trim(), category, fileType: storedFileType, sizeInBytes: selectedFile?.size ?? parseFileSize(size), date, important, folderId: folderId || null, chapterId: chapterId || null, financialTransactionId: financialTransactionId || null, assetId: initial?.assetId ?? null, maintenanceId: initial?.maintenanceId ?? null, mockUrl: initial?.mockUrl ?? '', createdAt: initial?.createdAt ?? now, updatedAt: now }
    setSaving(true)
    const error = await onSave(document, selectedFile)
    setSaving(false)
    if (error) setStorageError(error)
  }

  return <Card className="border-primary/20 shadow-book-sm"><CardHeader><CardTitle className="font-display text-xl">{initial ? 'Editar documento' : 'Adicionar documento'}</CardTitle></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
    <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Arquivo</span><span className="flex min-h-14 items-center gap-3 rounded-lg border border-dashed bg-secondary/35 p-3"><FileUp className="size-5 shrink-0 text-primary" aria-hidden="true"/><input type="file" accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" onChange={event => selectFile(event.target.files?.[0])} className="block min-w-0 flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/80" /></span><span className="block text-xs text-muted-foreground">{selectedFile ? `${selectedFile.name} · ${formatBytes(selectedFile.size)}` : initial ? 'Escolha um arquivo apenas se quiser substituir o atual.' : 'Selecione um arquivo real ou continue apenas com os metadados.'}</span>{storageError ? <span role="alert" className="block text-xs text-destructive">{storageError}</span> : null}</label>
    <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Nome</span><Input value={name} onChange={event => setName(event.target.value)} aria-invalid={!!errors.name} placeholder="Nome do documento" />{errors.name ? <span className="block text-xs text-destructive">{errors.name}</span> : null}</label>
    <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Descrição</span><Textarea value={description} onChange={event => setDescription(event.target.value)} className="min-h-20" /></label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Categoria</span><select className={fieldClass} value={category} onChange={event => setCategory(event.target.value as DocumentCategory)}>{Object.entries(documentCategoryConfig).map(([id, config]) => <option key={id} value={id}>{config.label}</option>)}</select>{errors.category ? <span className="block text-xs text-destructive">{errors.category}</span> : null}</label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Tipo de arquivo</span><select className={fieldClass} value={fileType} disabled={!!selectedFile} onChange={event => setFileType(event.target.value as DocumentFileType)}>{Object.entries(documentFileTypeConfig).map(([id, config]) => <option key={id} value={id}>{config.label}</option>)}</select>{errors.fileType ? <span className="block text-xs text-destructive">{errors.fileType}</span> : null}</label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Tamanho</span><Input value={size} onChange={event => setSize(event.target.value)} readOnly={!!selectedFile} placeholder="Ex.: 850 KB ou 4,8 MB" /></label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Data</span><Input type="date" value={date} onChange={event => setDate(event.target.value)} aria-invalid={!!errors.date} />{errors.date ? <span className="block text-xs text-destructive">{errors.date}</span> : null}</label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Pasta</span><select className={fieldClass} value={folderId} onChange={event => setFolderId(event.target.value)}><option value="">Sem pasta</option>{missingFolder ? <option value={initial!.folderId!}>Pasta não disponível</option> : null}{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
    <label className="space-y-1.5"><span className="text-sm font-medium">Capítulo relacionado</span><select className={fieldClass} value={chapterId} onChange={event => setChapterId(event.target.value)}><option value="">Nenhum capítulo</option>{missingChapter ? <option value={initial!.chapterId!}>Capítulo não disponível</option> : null}{chapters.map(chapter => <option key={chapter.id} value={chapter.id}>{chapter.title} · {chapter.date}</option>)}</select></label>
    <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Movimentação financeira</span><select className={fieldClass} value={financialTransactionId} onChange={event => setFinancialTransactionId(event.target.value)}><option value="">Nenhuma movimentação</option>{missingTransaction ? <option value={initial!.financialTransactionId!}>Movimentação não disponível</option> : null}{transactions.map(transaction => <option key={transaction.id} value={transaction.id}>{transaction.title} · {transaction.date}</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={important} onChange={event => setImportant(event.target.checked)} className="size-4 accent-primary" /> Marcar como importante</label>
    <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2"><Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando…' : initial ? selectedFile ? 'Substituir arquivo e salvar' : 'Salvar alterações' : 'Adicionar documento'}</Button></div>
  </form></CardContent></Card>
}
export { DocumentForm }
