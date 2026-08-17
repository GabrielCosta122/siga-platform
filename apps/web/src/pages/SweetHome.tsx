import { BookOpen, BookPlus, Camera, FileText, Landmark } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JourneyCard } from '@/features/sweet-home/components/JourneyCard'
import { RecentChapterItem } from '@/features/sweet-home/components/RecentChapterItem'
import { SectionHeading } from '@/features/sweet-home/components/SectionHeading'
import { StoryCover } from '@/features/sweet-home/components/StoryCover'
import { SummaryCard } from '@/features/sweet-home/components/SummaryCard'
import { categoryIcons, categoryLabels, chapterDateShort } from '@/features/chapters/presentation'
import { formatCurrencyBRL } from '@/lib/utils'
import { getPaidAmount, getRecentChapters } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'

function SweetHome() {
  const { state } = useAppStore()
  const recent = getRecentChapters(state, 3)
  const latest = recent[0]
  const published = state.chapters.filter(chapter => chapter.status === 'published')
  const summaries = [
    { icon: Landmark, label: 'investidos', value: formatCurrencyBRL(getPaidAmount(state)) },
    { icon: BookOpen, label: 'capítulos', value: String(published.length) },
    { icon: FileText, label: 'documentos', value: String(state.documents.length) },
    { icon: Camera, label: 'fotos', value: String(published.reduce((total, chapter) => total + chapter.photos.length, 0)) },
  ]
  return <div className="bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1200px] space-y-9">
    <div className="space-y-6"><header className="space-y-2"><p className="text-sm text-muted-foreground">Bom dia, Gabriel.</p><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{state.property.name} <span className="text-muted-foreground">· {state.property.identification}</span></h1><p className="text-sm italic text-muted-foreground">Toda história merece ser lembrada.</p></header><section className="space-y-3" aria-labelledby="capa-da-historia"><SectionHeading title="Capa da história" description="Um retrato do momento que o seu lar vive agora." /><StoryCover /></section></div>
    <section className="grid gap-5 lg:grid-cols-2" aria-label="Jornada e novo capítulo"><JourneyCard /><Card className="justify-center border-primary/20 bg-primary text-primary-foreground shadow-book-sm"><CardContent className="space-y-4 pt-6"><span className="flex size-10 items-center justify-center rounded-md bg-primary-foreground/15"><BookPlus className="size-5" aria-hidden="true" /></span><div><h2 className="font-display text-xl font-semibold">Um novo momento?</h2><p className="mt-1 text-sm text-primary-foreground/75">Registre o que aconteceu hoje.</p></div><Button className="bg-card text-foreground hover:bg-card/90" render={<Link to="/novo-capitulo" />}><BookPlus aria-hidden="true" />Novo Capítulo</Button></CardContent></Card></section>
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(25rem,0.85fr)]" aria-label="Último capítulo e visão resumida"><Card className="shadow-book-xs"><CardHeader><CardTitle className="font-display text-xl">Último capítulo</CardTitle><CardDescription>{latest ? chapterDateShort(latest) : 'Nenhum capítulo publicado'}</CardDescription></CardHeader><CardContent className="space-y-5"><p className="text-base font-medium">{latest?.title ?? 'Sua história começa aqui'}</p>{latest ? <><div className="flex flex-wrap gap-2"><Badge variant="secondary">{categoryLabels[latest.category]}</Badge>{latest.important ? <Badge variant="outline">Marco importante</Badge> : null}<Badge variant="outline">{latest.photos.length} fotos</Badge></div><Button variant="outline" render={<Link to={`/livro-da-casa/${latest.id}`} />}>Abrir capítulo</Button></> : null}</CardContent></Card><div className="grid grid-cols-2 gap-4">{summaries.map(summary => <SummaryCard key={summary.label} {...summary} />)}</div></section>
    <section className="space-y-5 pb-4" aria-labelledby="capitulos-recentes"><SectionHeading title="Capítulos recentes" description="Pequenos registros que ajudam a contar a história do seu lar." /><Card className="shadow-book-xs"><CardContent className="pt-6"><ul className="divide-y">{recent.map(chapter => <RecentChapterItem key={chapter.id} icon={categoryIcons[chapter.category]} title={chapter.title} date={chapterDateShort(chapter)} category={categoryLabels[chapter.category]} />)}</ul></CardContent></Card></section>
  </div></div>
}
export { SweetHome }
