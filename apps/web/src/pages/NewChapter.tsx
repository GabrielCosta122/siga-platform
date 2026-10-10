import { useMemo, useRef, useState } from 'react'
import { BookCheck, BookOpen, Calendar, Save, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import type { Chapter, ChapterImpact, HouseDocument } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DocumentForm } from '@/features/documents/components/DocumentForm'
import { AttachmentsPanel } from '@/features/new-chapter/components/AttachmentsPanel'
import { CategorySelector } from '@/features/new-chapter/components/CategorySelector'
import { ImpactCard } from '@/features/new-chapter/components/ImpactCard'
import { ReviewCard } from '@/features/new-chapter/components/ReviewCard'
import { categories, impacts, unrelatedImpact, type ChapterCategory } from '@/features/new-chapter/data'
import { useChapterPhotoAttachments } from '@/features/new-chapter/useChapterPhotoAttachments'
import { getConfiguredCategoryOptions } from '@/features/settings/categories'
import { formatChapterDateLong, getChapterDateValidationMessage, getLocalISODate, isValidChapterDate } from '@/lib/chapter-date'
import { cn, createEntityId } from '@/lib/utils'
import { getDocumentFileStorageMessage, saveDocumentFile } from '@/storage/document-file-storage'
import { useAppStore } from '@/store/useAppStore'

function NewChapterForm({ chapterId }: { chapterId?: string }) {
  const navigate = useNavigate()
  const { state, dispatch, fileDatabaseName } = useAppStore()
  const existing = chapterId ? state.chapters.find(chapter => chapter.id === chapterId) : undefined
  const categoryOptions = getConfiguredCategoryOptions(state.settings, 'chapter', categories.map(category => category.id), id => categories.find(category => category.id === id)?.label ?? id, existing?.category)
  const configuredCategories = categoryOptions.flatMap(option => {
    const category = categories.find(item => item.id === option.id)
    return category ? [{ ...category, label: option.label }] : []
  })
  const initialCategory = configuredCategories.find(category => category.id === existing?.category) ?? configuredCategories[0] ?? categories[0]
  const today = getLocalISODate()
  const [entityId] = useState(() => existing?.id ?? createEntityId('CAP'))
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.content ?? '')
  const [date, setDate] = useState(() => existing ? (isValidChapterDate(existing.date) ? existing.date : '') : today)
  const [selectedImpactIds, setSelectedImpactIds] = useState<ChapterImpact[]>(() => (existing?.impacts ?? []).map(impact => {
    const legacyAliases: Record<string, ChapterImpact> = { assets: 'property', documents: 'documentation', timeline: 'schedule' }
    return legacyAliases[String(impact)] ?? impact
  }))
  const [selectedCategory, setSelectedCategory] = useState<ChapterCategory>(initialCategory)
  const {
    photos,
    photoError,
    addPhotos,
    removePhoto,
    updateCaption,
    selectCover,
    persistPhotos,
  } = useChapterPhotoAttachments(existing)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>(() => {
    const explicitIds = Array.isArray(existing?.documentIds)
      ? existing.documentIds.filter((id): id is string => typeof id === 'string')
      : []
    const inverseIds = existing ? state.documents.filter(document => document.chapterId === existing.id).map(document => document.id) : []
    return [...new Set([...explicitIds, ...inverseIds])].filter(id => state.documents.some(document => document.id === id))
  })
  const [addingDocument, setAddingDocument] = useState(false)
  const [newDocumentIds, setNewDocumentIds] = useState<string[]>([])
  const [documentFeedback, setDocumentFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const savingLock = useRef(false)
  const [error, setError] = useState('')
  const [dateError, setDateError] = useState('')
  const selectedImpacts = useMemo(() => impacts.filter(impact => selectedImpactIds.includes(impact.id)).map(impact => impact.label), [selectedImpactIds])
  const validSelectedDocumentIds = selectedDocumentIds.filter(id => state.documents.some(document => document.id === id))
  const chapterSaveDisabled = saving || addingDocument

  function toggleImpact(id: ChapterImpact) { setSelectedImpactIds(current => current.includes(unrelatedImpact.id) ? [id] : current.includes(id) ? current.filter(impactId => impactId !== id) : [...current, id]) }
  function toggleUnrelated() { setSelectedImpactIds(current => current.includes(unrelatedImpact.id) ? [] : [unrelatedImpact.id]) }
  function toggleDocument(documentId: string) {
    setSelectedDocumentIds(current => current.includes(documentId)
      ? current.filter(id => id !== documentId)
      : [...current, documentId])
  }
  async function saveNewDocument(document: HouseDocument, file?: File) {
    const pendingDocument = { ...document, chapterId: null, updatedAt: new Date().toISOString() }
    if (file) {
      try { await saveDocumentFile(pendingDocument.id, file, fileDatabaseName) }
      catch (storageError) { return getDocumentFileStorageMessage(storageError) }
    }
    dispatch({ type: 'ADD_DOCUMENT', payload: pendingDocument })
    setNewDocumentIds(current => [...new Set([...current, pendingDocument.id])])
    setSelectedDocumentIds(current => [...new Set([...current, pendingDocument.id])])
    setAddingDocument(false)
    setDocumentFeedback('Documento adicionado e vinculado a este capítulo.')
    window.setTimeout(() => setDocumentFeedback(''), 2800)
    return null
  }
  async function save(status: Chapter['status']) {
    if (savingLock.current || addingDocument) return
    const nextError = !title.trim() || !description.trim() ? 'Preencha o título e conte o que aconteceu antes de salvar.' : ''
    const nextDateError = getChapterDateValidationMessage(date, today)
    setError(nextError)
    setDateError(nextDateError)
    if (nextError || nextDateError) return
    savingLock.current = true
    setSaving(true)
    const now = new Date().toISOString()
    const storedPhotos = await persistPhotos(entityId)
    if (!storedPhotos) {
      savingLock.current = false
      setSaving(false)
      return
    }
    const documentIds = validSelectedDocumentIds
    const chapter: Chapter = {
      id: entityId, title: title.trim(), content: description.trim(), category: selectedCategory.id, date, status, important: existing?.important ?? false, author: existing?.author ?? '', impacts: selectedImpactIds, photos: storedPhotos.photos, documentIds, financialTransactionIds: existing?.financialTransactionIds ?? [], assetIds: existing?.assetIds ?? [], maintenanceIds: existing?.maintenanceIds ?? [], coverPhotoId: storedPhotos.coverPhotoId, createdAt: existing?.createdAt ?? now, updatedAt: now,
    }
    state.documents.filter(document => newDocumentIds.includes(document.id) && documentIds.includes(document.id)).forEach(document => {
      dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: document.id, changes: { chapterId: entityId } } })
    })
    state.documents.filter(document => document.chapterId === entityId && !documentIds.includes(document.id)).forEach(document => {
      dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: document.id, changes: { chapterId: null } } })
    })
    dispatch(existing ? { type: 'UPDATE_CHAPTER', payload: { id: entityId, changes: chapter } } : { type: 'ADD_CHAPTER', payload: chapter })
    navigate(status === 'published' ? `/livro-da-casa/${entityId}` : '/livro-da-casa')
  }

  return <div className="bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1200px] space-y-8">
    <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"><div className="space-y-2"><Badge variant="secondary" className="gap-1.5"><BookOpen aria-hidden="true" /> {state.property.name}</Badge><div><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{existing ? 'Editar Capítulo' : 'Novo Capítulo'}</h1><p className="mt-1 text-sm text-muted-foreground sm:text-base">Registre um momento da história do seu lar.</p></div></div><div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" disabled={chapterSaveDisabled} onClick={() => void save('draft')}><Save aria-hidden="true" /> {saving ? 'Salvando…' : 'Salvar rascunho'}</Button><Button type="button" variant="ghost" disabled={chapterSaveDisabled} onClick={() => navigate(existing ? `/livro-da-casa/${existing.id}` : '/livro-da-casa')}><X aria-hidden="true" /> Cancelar</Button></div></header>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]"><form className={cn('space-y-8 rounded-xl p-1 transition-colors', selectedCategory.contextClass)} onSubmit={event => { event.preventDefault(); void save('published') }} noValidate>
      <Card className="shadow-book-sm"><CardContent className="space-y-5 px-6 py-5 sm:px-8 sm:py-6"><div><label htmlFor="chapter-title" className="font-display text-2xl font-semibold tracking-tight">Qual é o título deste capítulo?</label><p className="mt-1 text-sm text-muted-foreground">Uma frase curta para encontrar esta lembrança no Livro da Casa.</p></div><Input id="chapter-title" value={title} onChange={event => { setTitle(event.target.value); setError('') }} maxLength={120} aria-invalid={!!error} aria-describedby={error ? 'chapter-content-error' : undefined} placeholder="Ex.: A primeira noite no apartamento" className="h-10 bg-secondary/55 px-4 text-base" />
        <div className="rounded-lg border bg-secondary/35 p-4"><label htmlFor="chapter-date" className="flex items-center gap-2 font-display text-lg font-semibold"><Calendar className="size-4 text-primary" aria-hidden="true" /> Quando isso aconteceu?</label><p id="chapter-date-help" className="mt-1 text-sm text-muted-foreground">Use a data real do acontecimento, mesmo que ele tenha ocorrido antes de você começar a usar o SIGA.</p><Input id="chapter-date" type="date" value={date} max={today} required aria-invalid={!!dateError} aria-describedby={dateError ? 'chapter-date-help chapter-date-error' : 'chapter-date-help'} onChange={event => { setDate(event.target.value); setDateError('') }} className="mt-3 h-10 max-w-xs bg-card px-4" />{dateError ? <p id="chapter-date-error" role="alert" className="mt-2 text-sm text-destructive">{dateError}</p> : null}</div>
        <div><label htmlFor="chapter-description" className="font-display text-xl font-semibold tracking-tight">O que aconteceu?</label><p className="mt-1 text-sm text-muted-foreground">Conte com suas palavras. Os detalhes dão vida à história.</p></div><div className="space-y-1.5"><Textarea id="chapter-description" value={description} onChange={event => { setDescription(event.target.value); setError('') }} maxLength={600} aria-invalid={!!error} aria-describedby={error ? 'chapter-content-error' : undefined} placeholder="Ex.: Visitamos a obra e vimos que a estrutura do 12º andar foi concluída." className="min-h-[9.5rem] resize-y border-0 bg-secondary/55 p-4 text-base leading-relaxed shadow-none focus-visible:border-primary focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-ring/30" /><p className="text-right text-xs text-muted-foreground" aria-live="polite">{description.length} de 600 caracteres</p></div>{error ? <p id="chapter-content-error" role="alert" className="text-sm text-destructive">{error}</p> : null}
      </CardContent></Card>
      <section className="space-y-4" aria-labelledby="impactos-heading"><div><h2 id="impactos-heading" className="font-display text-xl font-semibold">Onde isso impacta?</h2><p className="mt-1 text-sm text-muted-foreground">Selecione todos os aspectos que este momento toca.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{impacts.map(impact => <ImpactCard key={impact.id} impact={impact} selected={selectedImpactIds.includes(impact.id)} onToggle={() => toggleImpact(impact.id)} />)}</div><div className="border-t pt-4"><p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Ou registre apenas a memória</p><ImpactCard impact={unrelatedImpact} selected={selectedImpactIds.includes(unrelatedImpact.id)} onToggle={toggleUnrelated} /></div></section>
      <section className="space-y-4" aria-labelledby="categoria-heading"><div><h2 id="categoria-heading" className="font-display text-xl font-semibold">Categoria principal</h2><p className="mt-1 text-sm text-muted-foreground">Ela define o tom sutil deste capítulo.</p></div><CategorySelector categories={configuredCategories} selectedId={selectedCategory.id} onSelect={setSelectedCategory} /></section>
      <section className="space-y-4" aria-labelledby="anexos-heading"><div><h2 id="anexos-heading" className="font-display text-xl font-semibold">Anexos</h2><p className="mt-1 text-sm text-muted-foreground">Fotos e documentos para guardar junto desta lembrança.</p></div><AttachmentsPanel photos={photos} coverPhotoId={photos.find(photo => photo.isCover)?.id ?? null} documents={state.documents} selectedDocumentIds={validSelectedDocumentIds} onPhotosAdded={addPhotos} onPhotoRemoved={removePhoto} onPhotoCaptionChange={updateCaption} onCoverPhotoChange={selectCover} onDocumentToggle={toggleDocument} onAddDocument={() => setAddingDocument(true)} photoError={photoError} disabled={saving} />{documentFeedback ? <p role="status" className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">{documentFeedback}</p> : null}{addingDocument ? <DocumentForm folders={state.documentFolders} chapters={state.chapters} transactions={state.financialTransactions} defaultChapterId={entityId} defaultChapterLabel={title.trim() || 'Novo capítulo em edição'} lockChapterId embedded onCancel={() => setAddingDocument(false)} onSave={saveNewDocument} /> : null}</section>
      <footer className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Capítulo de {formatChapterDateLong(date)}</p><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={chapterSaveDisabled} onClick={() => void save('draft')}><Save aria-hidden="true" /> Salvar como rascunho</Button><Button type="submit" disabled={chapterSaveDisabled}><BookCheck aria-hidden="true" /> {saving ? 'Salvando…' : existing ? 'Salvar alterações' : 'Salvar Capítulo'}</Button><Button type="button" variant="ghost" disabled={chapterSaveDisabled} onClick={() => navigate('/livro-da-casa')}><X aria-hidden="true" /> Cancelar</Button></div></footer>
    </form><aside className="lg:sticky lg:top-20"><ReviewCard category={selectedCategory.label} date={date} description={title || description} impacts={selectedImpactIds.includes(unrelatedImpact.id) ? [unrelatedImpact.label] : selectedImpacts} photoCount={photos.length} documentCount={validSelectedDocumentIds.length} coverPhotoName={photos.find(photo => photo.isCover)?.name} /></aside></div>
  </div></div>
}

function NewChapter() {
  const { chapterId } = useParams()
  return <NewChapterForm key={chapterId ?? 'new'} chapterId={chapterId} />
}

export { NewChapter }
