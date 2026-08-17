import { CalendarDays, FileKey, UserRound } from 'lucide-react'
import type { Chapter } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { categoryLabels, chapterDateShort } from '@/features/chapters/presentation'

function ChapterInfoCard({ chapter }: { chapter: Chapter }) {
  return <Card className="shadow-book-xs"><CardHeader><CardTitle className="font-display text-lg">Informações do capítulo</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
    <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Identificador</span><span className="font-medium">{chapter.id}</span></div>
    <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-muted-foreground"><UserRound className="size-4" aria-hidden="true" /> Autor</span><span className="font-medium">{chapter.author}</span></div>
    <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Categoria</span><Badge variant="outline">{categoryLabels[chapter.category]}</Badge></div>
    <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Status</span><Badge variant="secondary">{chapter.status === 'published' ? 'Publicado' : 'Rascunho'}</Badge></div>
    <div className="border-t pt-4 text-xs text-muted-foreground"><p className="flex items-center gap-2"><CalendarDays className="size-3.5" aria-hidden="true" /> Criado em {chapterDateShort({ ...chapter, date: chapter.createdAt.slice(0, 10) })}</p><p className="mt-2 flex items-center gap-2"><FileKey className="size-3.5" aria-hidden="true" /> Atualizado em {chapterDateShort({ ...chapter, date: chapter.updatedAt.slice(0, 10) })}</p></div>
  </CardContent></Card>
}
export { ChapterInfoCard }
