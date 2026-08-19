import { BookOpen, CalendarDays, FileText, Image, Tag } from 'lucide-react'
import type { Chapter } from '@/domain/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { categoryLabels, chapterDateShort } from '@/features/chapters/presentation'
import { compareChaptersChronologicallyAsc, isValidChapterDate } from '@/lib/chapter-date'

function BookSummary({ chapters }: { chapters: Chapter[] }) {
  const sorted = chapters.filter(chapter => isValidChapterDate(chapter.date)).sort(compareChaptersChronologicallyAsc)
  const frequencies = chapters.reduce<Record<string, number>>((all, chapter) => ({ ...all, [chapter.category]: (all[chapter.category] ?? 0) + 1 }), {})
  const frequent = Object.entries(frequencies).sort((a, b) => b[1] - a[1])[0]?.[0] as Chapter['category'] | undefined
  const items = [
    { icon: BookOpen, label: 'Capítulos', value: String(chapters.length) },
    { icon: CalendarDays, label: 'Primeiro', value: sorted[0] ? chapterDateShort(sorted[0]) : '—' },
    { icon: CalendarDays, label: 'Mais recente', value: sorted.at(-1) ? chapterDateShort(sorted.at(-1)!) : '—' },
    { icon: Tag, label: 'Mais frequente', value: frequent ? categoryLabels[frequent] : '—' },
    { icon: Image, label: 'Fotos', value: String(chapters.reduce((total, chapter) => total + chapter.photos.length, 0)) },
    { icon: FileText, label: 'Documentos', value: String(chapters.reduce((total, chapter) => total + chapter.documentIds.length, 0)) },
  ]
  return <Card className="shadow-book-xs"><CardHeader><CardTitle className="font-display text-lg">Em poucas páginas</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">{items.map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><Icon className="size-4" aria-hidden="true" /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div></div>)}</CardContent></Card>
}
export { BookSummary }
