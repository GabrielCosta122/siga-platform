import { CalendarDays, FileKey, UserRound } from 'lucide-react'
import type { Chapter } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { categoryLabels } from '@/features/chapters/presentation'
import { getConfiguredCategoryLabel } from '@/features/settings/categories'
import { formatChapterTimestamp } from '@/lib/chapter-date'
import { useAppStore } from '@/store/useAppStore'

function ChapterInfoCard({ chapter }: { chapter: Chapter }) {
  const { state } = useAppStore()
  const categoryLabel = getConfiguredCategoryLabel(state.settings, 'chapter', chapter.category, categoryLabels[chapter.category] ?? 'Outra categoria')
  return <Card className="shadow-book-xs"><CardHeader><CardTitle className="font-display text-lg">Informações do capítulo</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
    <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Identificador</span><span className="font-medium">{chapter.id}</span></div>
    <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-muted-foreground"><UserRound className="size-4" aria-hidden="true" /> Autor</span><span className="font-medium">{typeof chapter.author === 'string' ? chapter.author : 'Autoria não disponível'}</span></div>
    <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Categoria</span><Badge variant="outline">{categoryLabel}</Badge></div>
    <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Status</span><Badge variant="secondary">{chapter.status === 'published' ? 'Publicado' : 'Rascunho'}</Badge></div>
    <div className="border-t pt-4 text-xs text-muted-foreground"><p className="flex items-center gap-2"><CalendarDays className="size-3.5" aria-hidden="true" /> Criado no SIGA: {formatChapterTimestamp(chapter.createdAt)}</p><p className="mt-2 flex items-center gap-2"><FileKey className="size-3.5" aria-hidden="true" /> Última atualização: {formatChapterTimestamp(chapter.updatedAt)}</p></div>
  </CardContent></Card>
}
export { ChapterInfoCard }
