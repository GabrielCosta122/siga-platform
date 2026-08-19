import { ArrowLeft, BookOpen, Edit3, FileText, Landmark, MoreHorizontal, Star, Trash2 } from 'lucide-react'
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
import { getDocumentFileTypeLabel } from '@/features/documents/presentation'

function ChapterDetails() {
  const { chapterId = '' } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useAppStore()
  const selectedChapter = getChapterById(state, chapterId)
  if (!selectedChapter) return <div className="bg-background px-6 py-20 text-center"><h1 className="font-display text-3xl font-semibold">Capítulo não encontrado</h1><Button className="mt-5" render={<Link to="/livro-da-casa" />}>Voltar ao Livro da Casa</Button></div>
  const chapter = selectedChapter
  const documents = getDocumentsByChapterId(state, chapter.id)
  const transactions = getTransactionsByChapterId(state, chapter.id)
  const { previous, next } = getAdjacentPublishedChapters(state, chapter.id)
  function remove() { if (window.confirm(`Excluir o capítulo “${chapter.title}”?`)) { dispatch({ type: 'DELETE_CHAPTER', payload: chapter.id }); navigate('/livro-da-casa') } }
  function toggleImportant() { dispatch({ type: 'TOGGLE_CHAPTER_IMPORTANT', payload: chapter.id }) }
  return <div className="bg-background px-4 py-8 sm:px-6 lg:px-8"><article className="mx-auto max-w-[1220px] space-y-8">
    <nav aria-label="Voltar ao livro"><Button variant="ghost" size="sm" render={<Link to="/livro-da-casa" />}><ArrowLeft aria-hidden="true" /> Voltar para o Livro da Casa</Button></nav>
    <header className="border-b pb-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="max-w-4xl space-y-3"><p className="text-xs font-medium tracking-wide text-muted-foreground">Livro da Casa <span aria-hidden="true">/</span> Detalhes do capítulo</p><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" className="gap-1.5"><BookOpen aria-hidden="true" /> {categoryLabels[chapter.category]}</Badge><span className="text-sm text-muted-foreground">{chapterDateLong(chapter)}</span><Badge variant="outline">{chapter.status === 'published' ? 'Publicado' : 'Rascunho'}</Badge>{chapter.important ? <Badge variant="outline" className="gap-1 text-primary"><Star aria-hidden="true" /> Capítulo importante</Badge> : null}</div><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{chapter.title}</h1><p className="text-sm text-muted-foreground">Escrito por {chapter.author}</p></div><div className="flex shrink-0 items-center gap-2"><Button variant="outline" render={<Link to={`/novo-capitulo/${chapter.id}`} />}><Edit3 aria-hidden="true" /> Editar capítulo</Button><Button variant="ghost" size="icon" aria-label="Mais opções"><MoreHorizontal aria-hidden="true" /></Button></div></div></header>
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_19rem]"><div className="min-w-0 space-y-10"><ChapterMedia hasPhotos={chapter.photos.length > 0} /><section className="max-w-3xl" aria-labelledby="aconteceu-heading"><h2 id="aconteceu-heading" className="font-display text-2xl font-semibold">O que aconteceu</h2><div className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground/85 sm:text-lg">{chapter.content}</div></section><ChapterImpacts impacts={chapter.impacts} />
      {documents.length ? <section aria-labelledby="documentos-heading"><h2 id="documentos-heading" className="font-display text-xl font-semibold">Documentos deste capítulo</h2><Card className="mt-4 shadow-book-xs"><CardContent className="divide-y pt-3">{documents.map(document => <div key={document.id} className="flex items-center gap-3 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><FileText className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{document.name}</span><span className="block text-xs text-muted-foreground">{getDocumentFileTypeLabel(document.fileType)}</span></span><Button variant="ghost" size="sm">Abrir</Button></div>)}</CardContent></Card></section> : null}
      {transactions.length ? <section aria-labelledby="financeiro-heading"><h2 id="financeiro-heading" className="font-display text-xl font-semibold">Movimentações deste capítulo</h2><Card className="mt-4 shadow-book-xs"><CardContent className="divide-y pt-3">{transactions.map(transaction => <div key={transaction.id} className="flex items-center gap-3 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><Landmark className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{transaction.title}</span><span className="block text-xs text-muted-foreground">{transaction.category}</span></span><span className="text-sm font-semibold">{formatCurrencyBRL(Number.isFinite(transaction.amount) ? transaction.amount : 0)}</span><Button variant="ghost" size="sm" render={<Link to="/financeiro" />}>Ver no Financeiro</Button></div>)}</CardContent></Card></section> : null}
      <footer className="flex flex-wrap gap-2 border-t pt-6"><Button variant="outline" render={<Link to={`/novo-capitulo/${chapter.id}`} />}><Edit3 aria-hidden="true" /> Editar capítulo</Button><Button variant="outline" onClick={toggleImportant}><Star aria-hidden="true" /> {chapter.important ? 'Desmarcar importante' : 'Marcar como importante'}</Button><Button variant="ghost" onClick={remove} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 aria-hidden="true" /> Excluir capítulo</Button></footer><ChapterNavigation previous={previous} next={next} />
    </div><aside className="space-y-4 lg:sticky lg:top-20"><ChapterInfoCard chapter={chapter} /><p className="rounded-lg bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">Este capítulo preserva uma etapa que aproxima a casa do que ela vai se tornar.</p></aside></div>
  </article></div>
}
export { ChapterDetails }
