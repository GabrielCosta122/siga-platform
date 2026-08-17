import { useEffect, useMemo, useState } from 'react'
import { FilePlus2, Files, Folder, FolderPlus, Search } from 'lucide-react'
import type { HouseDocument } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DocumentDetails } from '@/features/documents/components/DocumentDetails'
import { DocumentForm } from '@/features/documents/components/DocumentForm'
import { DocumentList } from '@/features/documents/components/DocumentList'
import { FolderForm } from '@/features/documents/components/FolderForm'
import { documentCategoryConfig, documentFileTypeConfig, formatBytes, formatDocumentDate, getDocumentCategoryLabel, getDocumentIcon, normalizeDocumentCategory, normalizeDocumentFileType } from '@/features/documents/presentation'
import { getDocumentById, getImportantDocuments } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import { deleteDocumentFile, getDocumentFile, getDocumentFileStorageMessage, hasDocumentFile, saveDocumentFile, type StoredDocumentFile } from '@/storage/document-file-storage'

type Panel = 'create-document' | 'edit-document' | 'create-folder' | null

function downloadStoredFile(file: StoredDocumentFile) {
  const objectUrl = URL.createObjectURL(file.blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = file.name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

function Documents() {
  const { state, dispatch } = useAppStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [type, setType] = useState('all')
  const [period, setPeriod] = useState('all')
  const [important, setImportant] = useState(false)
  const [linked, setLinked] = useState(false)
  const [folderFilter, setFolderFilter] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | undefined>(state.documents[0]?.id)
  const [panel, setPanel] = useState<Panel>(null)
  const [moving, setMoving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [fileStatus, setFileStatus] = useState<{ documentId?: string; available?: boolean }>({})
  const selected = selectedId ? getDocumentById(state, selectedId) : undefined
  const importantDocuments = getImportantDocuments(state)
  const fileAvailable = fileStatus.documentId === selectedId ? fileStatus.available : undefined
  useEffect(() => {
    let active = true
    if (!selectedId) return () => { active = false }
    hasDocumentFile(selectedId).then(available => { if (active) setFileStatus({ documentId: selectedId, available }) }).catch(() => { if (active) setFileStatus({ documentId: selectedId, available: false }) })
    return () => { active = false }
  }, [selectedId])
  const categoryCount = new Set(state.documents.map(document => normalizeDocumentCategory(document.category) ?? `unknown:${String(document.category)}`)).size
  const periodOptions = useMemo(() => Array.from(new Set(state.documents.filter(document => /^\d{4}-\d{2}-\d{2}$/.test(String(document.date))).map(document => document.date.slice(0, 7)))).sort((a, b) => b.localeCompare(a)), [state.documents])
  const filtered = useMemo(() => [...state.documents].sort((a, b) => String(b.date).localeCompare(String(a.date))).filter(document => {
    const term = search.trim().toLowerCase()
    return (!term || `${document.name} ${document.description}`.toLowerCase().includes(term))
      && (category === 'all' || normalizeDocumentCategory(document.category) === category)
      && (type === 'all' || normalizeDocumentFileType(document.fileType) === type)
      && (period === 'all' || String(document.date).startsWith(period))
      && (!important || document.important)
      && (!linked || !!document.chapterId)
      && (!folderFilter || document.folderId === folderFilter)
  }), [state.documents, search, category, type, period, important, linked, folderFilter])
  function clear() { setSearch(''); setCategory('all'); setType('all'); setPeriod('all'); setImportant(false); setLinked(false); setFolderFilter(null) }
  function showFeedback(message: string) { setFeedback(message); window.setTimeout(() => setFeedback(''), 2800) }
  async function saveDocument(document: HouseDocument, file?: File) {
    if (file) {
      try { await saveDocumentFile(document.id, file) }
      catch (error) { return getDocumentFileStorageMessage(error) }
    }
    if (panel === 'edit-document') { dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: document.id, changes: document } }); showFeedback('Documento atualizado.') }
    else { dispatch({ type: 'ADD_DOCUMENT', payload: document }); setSelectedId(document.id); showFeedback('Documento adicionado.') }
    if (file) setFileStatus({ documentId: document.id, available: true })
    setPanel(null)
    return null
  }
  async function deleteDocument() {
    if (!selected) return
    let physicalDeleteFailed = false
    try { await deleteDocumentFile(selected.id) } catch { physicalDeleteFailed = true }
    dispatch({ type: 'DELETE_DOCUMENT', payload: selected.id })
    setSelectedId(undefined)
    setFileStatus({})
    setConfirmingDelete(false)
    setMoving(false)
    showFeedback(physicalDeleteFailed ? 'Documento excluído. Não foi possível confirmar a remoção do arquivo local.' : 'Documento excluído.')
  }
  async function openDocument() {
    if (!selected) return
    const previewWindow = window.open('', '_blank')
    try {
      const storedFile = await getDocumentFile(selected.id)
      if (!storedFile) { previewWindow?.close(); setFileStatus({ documentId: selected.id, available: false }); showFeedback('Arquivo não disponível neste dispositivo.'); return }
      setFileStatus({ documentId: selected.id, available: true })
      const extension = storedFile.name.split('.').pop()?.toLowerCase() ?? ''
      const canPreview = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/avif'].includes(storedFile.type)
        || ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(extension)
      if (!canPreview) { previewWindow?.close(); downloadStoredFile(storedFile); showFeedback('Este formato foi enviado para download.'); return }
      if (previewWindow) {
        const objectUrl = URL.createObjectURL(storedFile.blob)
        previewWindow.opener = null
        previewWindow.location.href = objectUrl
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
      } else downloadStoredFile(storedFile)
    } catch { previewWindow?.close(); setFileStatus({ documentId: selected.id, available: false }); showFeedback('Não foi possível acessar este arquivo neste dispositivo.') }
  }
  async function downloadDocument() {
    if (!selected) return
    try { const storedFile = await getDocumentFile(selected.id); if (!storedFile) { setFileStatus({ documentId: selected.id, available: false }); showFeedback('Arquivo não disponível neste dispositivo.'); return } setFileStatus({ documentId: selected.id, available: true }); downloadStoredFile(storedFile) }
    catch { setFileStatus({ documentId: selected.id, available: false }); showFeedback('Não foi possível acessar este arquivo neste dispositivo.') }
  }
  const hasFilters = search || category !== 'all' || type !== 'all' || period !== 'all' || important || linked || folderFilter

  return <div className="bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1200px] space-y-8"><header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">{state.documents.length} documentos</p><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Documentos</h1><p className="mt-1 text-sm text-muted-foreground sm:text-base">Tudo o que registra e protege a história do seu lar.</p></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setPanel('create-folder')}><FolderPlus aria-hidden="true"/>Criar pasta</Button><Button type="button" onClick={() => setPanel('create-document')}><FilePlus2 aria-hidden="true"/>Adicionar documento</Button></div></header>
    {feedback ? <p role="status" className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">{feedback}</p> : null}
    {panel === 'create-document' ? <DocumentForm folders={state.documentFolders} chapters={state.chapters} transactions={state.financialTransactions} onCancel={() => setPanel(null)} onSave={saveDocument} /> : null}
    {panel === 'edit-document' && selected ? <DocumentForm key={selected.id} initial={selected} folders={state.documentFolders} chapters={state.chapters} transactions={state.financialTransactions} onCancel={() => setPanel(null)} onSave={saveDocument} /> : null}
    {panel === 'create-folder' ? <FolderForm onCancel={() => setPanel(null)} onSave={folder => { dispatch({ type: 'ADD_DOCUMENT_FOLDER', payload: folder }); setPanel(null); showFeedback('Pasta criada.') }} /> : null}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[[Files,`${state.documents.length} documentos`],[Folder,`${categoryCount} categorias`],[Files,`${state.documents.filter(document => !!document.chapterId).length} vinculados a capítulos`],[Files,`${state.documents.filter(document => !!document.financialTransactionId).length} vinculados a movimentações`]].map(([Icon,label])=>{const I=Icon as typeof Files;return <Card key={label as string} size="sm" className="shadow-book-xs"><CardContent className="flex min-h-[5rem] items-center justify-center gap-3"><I className="size-5 text-primary" aria-hidden="true"/><p className="text-sm font-medium">{label as string}</p></CardContent></Card>})}</section>
    <section><h2 className="font-display text-xl font-semibold">Documentos importantes</h2>{importantDocuments.length ? <div className="mt-4 grid gap-3 lg:grid-cols-3">{importantDocuments.map(document => { const Icon=getDocumentIcon(document.fileType, document.category); return <Card key={document.id} size="sm" className="shadow-book-xs"><CardContent className="flex gap-3"><Icon className="size-5 text-primary" aria-hidden="true"/><div className="min-w-0"><p className="truncate text-sm font-medium">{document.name}</p><p className="mt-1 text-xs text-muted-foreground">{getDocumentCategoryLabel(document.category)} · {formatDocumentDate(document.date)} · {formatBytes(document.sizeInBytes)}</p><Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => { setSelectedId(document.id); setPanel(null) }}>Abrir</Button></div></CardContent></Card> })}</div> : <p className="mt-4 text-sm text-muted-foreground">Nenhum documento marcado como importante.</p>}</section>
    <section className="flex flex-wrap gap-2">{Object.entries(documentCategoryConfig).map(([id, config]) => { const Icon=config.icon; const count=state.documents.filter(document => normalizeDocumentCategory(document.category) === id).length; return <Button type="button" key={id} variant={category===id?'secondary':'outline'} size="sm" onClick={()=>setCategory(category===id?'all':id)}><Icon aria-hidden="true"/>{config.label} ({count})</Button> })}</section>
    <section className="space-y-4"><div className="flex flex-wrap gap-2"><div className="relative min-w-56 flex-1"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/><Input className="pl-9" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar documento"/></div><select value={type} onChange={event=>setType(event.target.value)} className="h-8 rounded-lg border bg-card px-3 text-sm"><option value="all">Todos</option>{Object.entries(documentFileTypeConfig).map(([id, config]) => <option key={id} value={id}>{config.label}</option>)}</select><select value={period} onChange={event=>setPeriod(event.target.value)} className="h-8 rounded-lg border bg-card px-3 text-sm"><option value="all">Todos os períodos</option>{periodOptions.map(month => <option key={month} value={month}>{new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(`${month}-01T12:00:00`))}</option>)}</select><Button type="button" variant={important?'secondary':'outline'} size="sm" aria-pressed={important} onClick={()=>setImportant(!important)}>Importantes</Button><Button type="button" variant={linked?'secondary':'outline'} size="sm" aria-pressed={linked} onClick={()=>setLinked(!linked)}>Com capítulos</Button>{hasFilters?<Button type="button" variant="ghost" size="sm" onClick={clear}>Limpar filtros</Button>:null}</div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">{filtered.length?<DocumentList items={filtered} chapters={state.chapters} transactions={state.financialTransactions} selected={selected?.id} onSelect={document => { setSelectedId(document.id); setPanel(null); setMoving(false); setConfirmingDelete(false) }}/>:<Card><CardContent className="py-12 text-center"><h3 className="font-display text-xl font-semibold">{state.documents.length ? 'Nenhum documento encontrado' : 'Ainda não há documentos'}</h3><p className="mt-2 text-sm text-muted-foreground">{state.documents.length ? 'Ajuste os filtros para encontrar o que procura.' : 'Adicione contratos, comprovantes, notas e outros arquivos relacionados à história da casa.'}</p><div className="mt-5 flex justify-center gap-2"><Button type="button" onClick={()=>setPanel('create-document')}>Adicionar documento</Button>{hasFilters?<Button type="button" variant="outline" onClick={clear}>Limpar filtros</Button>:null}</div></CardContent></Card>}{selected ? <aside className="xl:sticky xl:top-20"><DocumentDetails key={selected.id} item={selected} state={state} fileAvailable={fileAvailable} moving={moving} confirmingDelete={confirmingDelete} onOpen={openDocument} onDownload={downloadDocument} onEdit={()=>setPanel('edit-document')} onToggleImportant={()=>{dispatch({type:'UPDATE_DOCUMENT',payload:{id:selected.id,changes:{important:!selected.important}}});showFeedback(selected.important?'Documento removido dos importantes.':'Documento marcado como importante.')}} onStartMove={()=>{setMoving(true);setConfirmingDelete(false)}} onCancelMove={()=>setMoving(false)} onMove={folderId=>{dispatch({type:'UPDATE_DOCUMENT',payload:{id:selected.id,changes:{folderId}}});setMoving(false);showFeedback('Documento movido.')}} onAskDelete={()=>{setConfirmingDelete(true);setMoving(false)}} onCancelDelete={()=>setConfirmingDelete(false)} onDelete={deleteDocument}/></aside>:null}</div>
    </section>
    <section><h2 className="font-display text-xl font-semibold">Pastas da casa</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{state.documentFolders.map(folder => { const count=state.documents.filter(document=>document.folderId===folder.id).length; return <button type="button" key={folder.id} onClick={()=>setFolderFilter(folderFilter===folder.id?null:folder.id)} className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><Card size="sm" className={folderFilter===folder.id?'ring-primary shadow-book-xs':'shadow-book-xs'}><CardContent><Folder className="size-4 text-primary" aria-hidden="true"/><p className="mt-2 text-sm font-medium">{folder.name}</p><p className="mt-1 text-xs text-muted-foreground">{count} documentos · {formatDocumentDate(String(folder.updatedAt).slice(0,10))}</p></CardContent></Card></button>})}</div></section>
    <section className="rounded-lg bg-secondary/70 p-5 sm:flex sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-semibold">Documentos também fazem parte da história</h2><p className="mt-1 text-sm text-muted-foreground">Vincule arquivos a capítulos, pagamentos e momentos importantes para manter todo o contexto reunido.</p></div><Button type="button" variant="ghost" className="mt-3 sm:mt-0" onClick={()=>setLinked(true)}>Ver vínculos</Button></section>
  </div></div>
}
export {Documents}
