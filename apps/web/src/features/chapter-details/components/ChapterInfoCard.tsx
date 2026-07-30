import { CalendarDays, FileKey, UserRound } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function ChapterInfoCard() {
  return (
    <Card className="shadow-book-xs">
      <CardHeader><CardTitle className="font-display text-lg">Informações do capítulo</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Identificador</span><span className="font-medium">CAP-018</span></div>
        <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-muted-foreground"><UserRound className="size-4" aria-hidden="true" /> Autor</span><span className="font-medium">Gabriel</span></div>
        <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Categoria</span><Badge variant="outline">Construção</Badge></div>
        <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Status</span><Badge variant="secondary">Publicado</Badge></div>
        <div className="border-t pt-4 text-xs text-muted-foreground"><p className="flex items-center gap-2"><CalendarDays className="size-3.5" aria-hidden="true" /> Criado em 12 jul 2026</p><p className="mt-2 flex items-center gap-2"><FileKey className="size-3.5" aria-hidden="true" /> Atualizado em 14 jul 2026</p></div>
      </CardContent>
    </Card>
  )
}

export { ChapterInfoCard }
