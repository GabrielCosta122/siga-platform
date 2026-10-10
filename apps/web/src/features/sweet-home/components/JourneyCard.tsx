import { ArrowRight, Footprints } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

type JourneyCardProps = {
  currentStage?: string
  signatureDate?: string
  expectedDeliveryDate?: string
}

const parseDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function JourneyCard({ currentStage, signatureDate, expectedDeliveryDate }: JourneyCardProps) {
  const stage = typeof currentStage === 'string' && currentStage.trim() ? currentStage.trim() : 'Etapa não informada'
  const start = parseDate(signatureDate)
  const end = parseDate(expectedDeliveryDate)
  const today = new Date()
  const elapsedDays = start ? Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86_400_000)) : null
  const totalDuration = start && end ? end.getTime() - start.getTime() : 0
  const progress = totalDuration > 0 ? Math.round(Math.min(1, Math.max(0, (today.getTime() - start!.getTime()) / totalDuration)) * 100) : 0
  const journeyLabel = elapsedDays === null
    ? 'Configure as datas do imóvel para acompanhar a jornada'
    : `${elapsedDays} ${elapsedDays === 1 ? 'dia' : 'dias'} escrevendo esta história`
  const nextMilestone = end && end.getTime() >= today.getTime()
    ? `Próximo marco: entrega prevista para ${new Intl.DateTimeFormat('pt-BR').format(end)}`
    : 'Adicione capítulos para registrar os próximos marcos'
  return (
    <Card className="shadow-book-xs">
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-semibold">Sua jornada</p>
            <p className="mt-1 text-sm text-muted-foreground">{journeyLabel}</p>
          </div>
          <Footprints className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>{stage}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Progresso da jornada" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <dl className="grid gap-3 border-t pt-4 text-sm">
          <div className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">Capítulo atual</dt>
            <dd className="font-medium">Etapa atual: {stage}</dd>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowRight className="size-4 text-primary" aria-hidden="true" />
            <span>{nextMilestone}</span>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

export { JourneyCard }
