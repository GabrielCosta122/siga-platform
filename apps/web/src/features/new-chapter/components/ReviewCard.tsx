import { CalendarDays, CheckCircle2, Image, Paperclip } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatChapterDateLong } from '@/lib/chapter-date'

type ReviewCardProps = {
  category: string
  date: string
  description: string
  impacts: string[]
}

function ReviewCard({ category, date, description, impacts }: ReviewCardProps) {
  const title = description.trim() || 'Um novo momento para lembrar'

  return (
    <Card className="shadow-book-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-display text-xl">Revisão do capítulo</CardTitle>
          <Badge variant="secondary">Rascunho</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Título provisório</p>
          <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed">{title}</p>
        </div>
        <dl className="space-y-3 border-y py-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Categoria</dt>
            <dd className="font-medium">{category}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-muted-foreground"><Image className="size-4" aria-hidden="true" /> Fotos</dt>
            <dd className="font-medium">3</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-muted-foreground"><Paperclip className="size-4" aria-hidden="true" /> Documentos</dt>
            <dd className="font-medium">2</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" /> Data do capítulo</dt>
            <dd className="text-right font-medium">{formatChapterDateLong(date)}</dd>
          </div>
        </dl>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Impactos</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {impacts.length > 0 ? impacts.map((impact) => <Badge key={impact} variant="outline">{impact}</Badge>) : <span className="text-sm text-muted-foreground">Nenhum selecionado</span>}
          </div>
        </div>
        <p className="flex gap-2 rounded-md bg-success/10 p-3 text-xs leading-relaxed text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Mais um capítulo foi escrito. Toda história merece ser lembrada.
        </p>
      </CardContent>
    </Card>
  )
}

export { ReviewCard }
