import { useState } from 'react'
import { ArrowDownToLine, ArrowLeft, BookOpen, Edit3, FileText, Landmark, MoreHorizontal, Star, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChapterImpacts } from '@/features/chapter-details/components/ChapterImpacts'
import { ChapterInfoCard } from '@/features/chapter-details/components/ChapterInfoCard'
import { ChapterMedia } from '@/features/chapter-details/components/ChapterMedia'
import { ChapterNavigation } from '@/features/chapter-details/components/ChapterNavigation'
import { categoryLabels, chapterDateLong } from '@/features/chapters/presentation'
import { getAdjacentPublishedChapters, getChapterById, getDocumentsByChapterId, getTransactionsByChapterId } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrencyBRL } from '@/lib/utils'
import { formatBytes, formatDocumentDate, getDocumentFileTypeLabel } from '@/features/documents/presentation'
import { getConfiguredCategoryLabel } from '@/features/settings/categories'
import { deleteChapterPhotosByChapterId } from '@/storage/chapter-photo-storage'
import { getDocumentFile, type StoredDocumentFile } from '@/storage/document-file-storage'

function downloadStoredFile(file: StoredDocumentFile) {
  const objectUrl = URL.createObjectURL(file.blob)
  const anchor = window.document.createElement('a')
  anchor.href = objectUrl
  anchor.download = file.name
  window.document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

function ChapterDetails() {
  const { chapterId = '' } = useParams()
  const navigate = useNavigate()
  const { state, dispatch, fileDatabaseName, assertScopeCurrent } = useAppStore()
  const [fileFeedback, setFileFeedback] = useState('')
  const selectedChapter = getChapterById(state, chapterId)
  if (!selectedChapter) return <div className="bg-background px-6 py-20 text-center"><h1 className="font-display text-3xl font-semibold">Capítulo não encontrado</h1><Button className="mt-5" render={<Link to="/livro-da-casa" />}>Voltar ao Livro da Casa</Button></div>
  const chapter = selectedChapter
  const chapterTitle = typeof chapter.title === 'string' && chapter.title.trim() ? chapter.title : 'Capítulo sem título'
  const chapterContent = typeof chapter.content === 'string' ? chapter.content : ''
  const chapterAuthor = typeof chapter.author === 'string' && chapter.author.trim() ? chapter.author : 'Autoria não disponível'
  const chapterPhotos = Array.isArray(chapter.photos) ? chapter.photos : []
  const categoryLabel = getConfiguredCategoryLabel(state.settings, 'chapter', chapter.category, categoryLabels[chapter.category] ?? 'Outra categoria')
  const documents = getDocumentsByChapterId(state, chapter.id)
  const transactions = getTransactionsByChapterId(state, chapter.id)
  const { previous, next } = getAdjacentPublishedChapters(state, chapter.id)
  function showFileFeedback(message: string) {
    setFileFeedback(message)
    window.setTimeout(() => setFileFeedback(''), 2800)
  }
  async function openDocumentFile(documentId: string) {
    const previewWindow = window.open('', '_blank')
    try {
      const storedFile = await getDocumentFile(documentId, fileDatabaseName); assertScopeCurrent()
      if (!storedFile) {
        previewWindow?.close()
        showFileFeedback('Arquivo não disponível neste dispositivo.')
        return
      }
      const extension = storedFile.name.split('.').pop()?.toLowerCase() ?? ''
      const canPreview = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/avif'].includes(storedFile.type)
        || ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(extension)
      if (!canPreview) {
        previewWindow?.close()
        downloadStoredFile(storedFile)
        showFileFeedback('Este formato foi enviado para download.')
        return
      }
      if (!previewWindow) {
        downloadStoredFile(storedFile)
        return
      }
      const objectUrl = URL.createObjectURL(storedFile.blob)
      previewWindow.opener = null
      previewWindow.location.href = objectUrl
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch {
      previewWindow?.close()
      showFileFeedback('Não foi possível acessar este arquivo neste dispositivo.')
    }
  }
  async function downloadDocumentFile(documentId: string) {
    try {
      const storedFile = await getDocumentFile(documentId, fileDatabaseName); assertScopeCurrent()
      if (!storedFile) {
        showFileFeedback('Arquivo não disponível neste dispositivo.')
        return
      }
      downloadStoredFile(storedFile)
    } catch {
      showFileFeedback('Não foi possível acessar este arquivo neste dispositivo.')
    }
  }
  async function remove() {
    if (!window.confirm(`Excluir o capítulo “${chapterTitle}”?`)) return
    let cleanupFailed = false
    try { await deleteChapterPhotosByChapterId(chapter.id, fileDatabaseName) } catch { cleanupFailed = true }
    dispatch({ type: 'DELETE_CHAPTER', payload: chapter.id })
    if (cleanupFailed) window.console.warn('Não foi possível remover todas as fotos físicas deste capítulo.')
    navigate('/livro-da-casa')
  }
  function toggleImportant() { dispatch({ type: 'TOGGLE_CHAPTER_IMPORTANT', payload: chapter.id }) }
  return <div className="bg-background px-4 py-8 sm:px-6 lg:px-8"><article className="mx-auto max-w-[1220px] space-y-8">
    <nav aria-label="Voltar ao livro"><Button variant="ghost" size="sm" render={<Link to="/livro-da-casa" />}><ArrowLeft aria-hidden="true" /> Voltar para o Livro da Casa</Button></nav>
    <header className="border-b pb-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="max-w-4xl space-y-3"><p className="text-xs font-medium tracking-wide text-muted-foreground">Livro da Casa <span aria-hidden="true">/</span> Detalhes do capítulo</p><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" className="gap-1.5"><BookOpen aria-hidden="true" /> {categoryLabel}</Badge><span className="text-sm text-muted-foreground">{chapterDateLong(chapter)}</span><Badge variant="outline">{chapter.status === 'published' ? 'Publicado' : 'Rascunho'}</Badge>{chapter.important ? <Badge variant="outline" className="gap-1 text-primary"><Star aria-hidden="true" /> Capítulo importante</Badge> : null}</div><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{chapterTitle}</h1><p className="text-sm text-muted-foreground">Escrito por {chapterAuthor}</p></div><div className="flex shrink-0 items-center gap-2"><Button variant="outline" render={<Link to={`/novo-capitulo/${chapter.id}`} />}><Edit3 aria-hidden="true" /> Editar capítulo</Button><Button variant="ghost" size="icon" aria-label="Mais opções"><MoreHorizontal aria-hidden="true" /></Button></div></div></header>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_19rem]"><div className="min-w-0 space-y-10"><ChapterMedia photos={chapterPhotos} coverPhotoId={chapter.coverPhotoId} categoryLabel={categoryLabel} /><section className="max-w-3xl" aria-labelledby="aconteceu-heading"><h2 id="aconteceu-heading" className="font-display text-2xl font-semibold">O que aconteceu</h2><div className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground/85 sm:text-lg">{chapterContent}</div></section><ChapterImpacts impacts={Array.isArray(chapter.impacts) ? chapter.impacts : []} />
      {fileFeedback ? <p role="status" className="rounded-md bg-secondary px-4 py-3 text-sm text-muted-foreground">{fileFeedback}</p> : null}
      {documents.length ? <section aria-labelledby="documentos-heading"><h2 id="documentos-heading" className="font-display text-xl font-semibold">Documentos deste capítulo</h2><Card className="mt-4 shadow-book-xs"><CardContent className="divide-y pt-3">{documents.map(item => <div key={item.id} className="flex flex-wrap items-center gap-3 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><FileText className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.name}</span><span className="block text-xs text-muted-foreground">{getDocumentFileTypeLabel(item.fileType)} · {formatBytes(Number.isFinite(item.sizeInBytes) ? item.sizeInBytes : 0)} · {formatDocumentDate(item.date)}</span></span><span className="flex gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => void openDocumentFile(item.id)}>Abrir</Button><Button type="button" variant="ghost" size="sm" onClick={() => void downloadDocumentFile(item.id)}><ArrowDownToLine aria-hidden="true" /> Baixar</Button></span></div>)}</CardContent></Card></section> : null}
      {transactions.length ? <section aria-labelledby="financeiro-heading"><h2 id="financeiro-heading" className="font-display text-xl font-semibold">Movimentações deste capítulo</h2><Card className="mt-4 shadow-book-xs"><CardContent className="divide-y pt-3">{transactions.map(transaction => <div key={transaction.id} className="flex items-center gap-3 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><Landmark className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{transaction.title}</span><span className="block text-xs text-muted-foreground">{transaction.category}</span></span><span className="text-sm font-semibold">{formatCurrencyBRL(Number.isFinite(transaction.amount) ? transaction.amount : 0)}</span><Button variant="ghost" size="sm" render={<Link to="/financeiro" />}>Ver no Financeiro</Button></div>)}</CardContent></Card></section> : null}
      <footer className="flex flex-wrap gap-2 border-t pt-6"><Button variant="outline" render={<Link to={`/novo-capitulo/${chapter.id}`} />}><Edit3 aria-hidden="true" /> Editar capítulo</Button><Button variant="outline" onClick={toggleImportant}><Star aria-hidden="true" /> {chapter.important ? 'Desmarcar importante' : 'Marcar como importante'}</Button><Button variant="ghost" onClick={remove} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 aria-hidden="true" /> Excluir capítulo</Button></footer><ChapterNavigation previous={previous} next={next} />
    </div><aside className="space-y-4 lg:sticky lg:top-20"><ChapterInfoCard chapter={chapter} /><p className="rounded-lg bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">Este capítulo preserva uma etapa que aproxima a casa do que ela vai se tornar.</p></aside></div>
  </article></div>
}
export { ChapterDetails }
