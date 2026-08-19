import { useMemo, useState } from 'react'
import { BookPlus, Filter, Search, X } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookSummary } from '@/features/house-book/components/BookSummary'
import { EmptyChapters } from '@/features/house-book/components/EmptyChapters'
import { StoryMilestone } from '@/features/house-book/components/StoryMilestone'
import { TimelineChapter } from '@/features/house-book/components/TimelineChapter'
import { categoryOptions, impactOptions } from '@/features/house-book/data'
import { categoryLabels, chapterMonth, impactLabels } from '@/features/chapters/presentation'
import { isValidChapterDate } from '@/lib/chapter-date'
import { getPublishedChaptersChronologically } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'

function HouseBook() {
  const { state } = useAppStore()
  const chapters = getPublishedChaptersChronologically(state)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [impact, setImpact] = useState('Todos os impactos')
  const [period, setPeriod] = useState('Todo o período')
  const [onlyPhotos, setOnlyPhotos] = useState(false)
  const [onlyImportant, setOnlyImportant] = useState(false)
  const periodOptions = useMemo(() => ['Todo o período', ...Array.from(new Set(chapters.map(chapterMonth)))], [chapters])
  const filteredChapters = useMemo(() => chapters.filter(chapter => {
    const term = search.trim().toLowerCase()
    return (!term || `${chapter.title} ${chapter.content}`.toLowerCase().includes(term))
      && (category === 'Todas' || categoryLabels[chapter.category] === category)
      && (impact === 'Todos os impactos' || chapter.impacts.some(item => impactLabels[item] === impact))
      && (period === 'Todo o período' || chapterMonth(chapter) === period)
      && (!onlyPhotos || chapter.photos.length > 0)
      && (!onlyImportant || chapter.important)
  }), [chapters, search, category, impact, period, onlyPhotos, onlyImportant])
  const groups = useMemo(() => Array.from(new Set(filteredChapters.map(chapterMonth))).map(month => ({ month, chapters: filteredChapters.filter(chapter => chapterMonth(chapter) === month) })), [filteredChapters])
  const firstDatedChapter = [...chapters].reverse().find(chapter => isValidChapterDate(chapter.date))
  const hasActiveFilters = search || category !== 'Todas' || impact !== 'Todos os impactos' || period !== 'Todo o período' || onlyPhotos || onlyImportant
  function clearFilters() { setSearch(''); setCategory('Todas'); setImpact('Todos os impactos'); setPeriod('Todo o período'); setOnlyPhotos(false); setOnlyImportant(false) }

  return <div className="bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1200px] space-y-8">
    <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"><div className="space-y-2"><Badge variant="secondary">{chapters.length} capítulos</Badge><div><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Livro da Casa</h1><p className="mt-1 text-sm text-muted-foreground sm:text-base">Cada capítulo ajuda a contar a história do seu lar.</p></div></div><div className="flex flex-wrap gap-2"><Button variant="outline"><Filter aria-hidden="true" /> Filtros</Button><Button render={<Link to="/novo-capitulo" />}><BookPlus aria-hidden="true" /> Novo Capítulo</Button></div></header>
    <section className="rounded-lg bg-secondary/70 px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6"><p className="font-display text-lg font-medium">Da primeira decisão aos momentos que ainda estão por vir.</p><p className="mt-1 shrink-0 text-sm text-muted-foreground sm:mt-0">{firstDatedChapter ? `${chapterMonth(firstDatedChapter)} — hoje` : 'Aguardando o primeiro capítulo datado'}</p></section>
    <section className="space-y-3" aria-label="Busca e filtros de capítulos"><div className="flex flex-col gap-3 lg:flex-row"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-10 pl-9" placeholder="Buscar por título ou conteúdo" aria-label="Buscar capítulos" /></div><div className="grid gap-2 sm:grid-cols-3 lg:flex"><select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filtrar por categoria" className="h-10 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">{categoryOptions.map(option => <option key={option}>{option}</option>)}</select><select value={impact} onChange={event => setImpact(event.target.value)} aria-label="Filtrar por impacto" className="h-10 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">{impactOptions.map(option => <option key={option}>{option}</option>)}</select><select value={period} onChange={event => setPeriod(event.target.value)} aria-label="Filtrar por período" className="h-10 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">{periodOptions.map(option => <option key={option}>{option}</option>)}</select></div></div>
      <div className="flex flex-wrap items-center gap-2"><Button type="button" variant={onlyPhotos ? 'secondary' : 'outline'} size="sm" aria-pressed={onlyPhotos} onClick={() => setOnlyPhotos(current => !current)}>Com fotos</Button><Button type="button" variant={onlyImportant ? 'secondary' : 'outline'} size="sm" aria-pressed={onlyImportant} onClick={() => setOnlyImportant(current => !current)}>Importantes</Button>{hasActiveFilters ? <Button type="button" variant="ghost" size="sm" onClick={clearFilters}><X aria-hidden="true" /> Limpar filtros</Button> : null}<span className="ml-auto text-xs text-muted-foreground">{filteredChapters.length} {filteredChapters.length === 1 ? 'capítulo encontrado' : 'capítulos encontrados'}</span></div></section>
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_17rem]"><section aria-label="Linha do tempo dos capítulos">{groups.length === 0 ? <EmptyChapters onClear={clearFilters} /> : <div className="space-y-8">{groups.map(group => <div key={group.month} className="relative"><div className="mb-4 flex items-center gap-3"><h2 className="font-display text-xl font-semibold tracking-tight">{group.month}</h2><span className="h-px flex-1 bg-border" /></div><div className="relative space-y-4 before:absolute before:top-0 before:bottom-0 before:left-3 before:w-px before:bg-border sm:before:left-3">{group.chapters.map(chapter => <TimelineChapter key={chapter.id} chapter={chapter} />)}</div>{group.month === 'Março de 2026' ? <StoryMilestone /> : null}</div>)}</div>}</section><aside className="xl:sticky xl:top-20"><BookSummary chapters={chapters} /></aside></div>
  </div></div>
}
export { HouseBook }
