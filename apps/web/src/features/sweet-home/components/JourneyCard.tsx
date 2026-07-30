import { ArrowRight, Footprints } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

function JourneyCard() {
  return (
    <Card className="shadow-book-xs">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-semibold">Sua jornada</p>
            <p className="mt-1 text-sm text-muted-foreground">214 dias escrevendo esta história</p>
          </div>
          <Footprints className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Construção</span>
            <span>48%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Progresso da jornada" aria-valuemin={0} aria-valuemax={100} aria-valuenow={48}>
            <div className="h-full w-[48%] rounded-full bg-primary" />
          </div>
        </div>
        <dl className="grid gap-3 border-t pt-4 text-sm">
          <div className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">Capítulo atual</dt>
            <dd className="font-medium">Acompanhando a construção</dd>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="size-4 text-primary" aria-hidden="true" />
            <span>Próximo marco: Visita técnica ao apartamento</span>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

export { JourneyCard }
