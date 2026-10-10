import { ChevronRight } from 'lucide-react'
import type { FinancialCommitment } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyBRL } from '@/lib/utils'
import {
  formatFinancialDate,
  getCategoryLabel,
  getCommitmentInstallmentLabel,
  getCommitmentStatusLabel,
  getLocalFinancialDate,
  isValidISODate,
  normalizeCommitmentStatus,
} from '@/features/financial/presentation'
import { compareFinancialCommitmentsByDueDate } from '@/store/selectors'

function CommitmentsList({ commitments, onOpen }: { commitments: FinancialCommitment[]; onOpen: () => void }) {
  const today = getLocalFinancialDate()
  const sorted = [...commitments]
    .filter(item => ['pending', 'scheduled', 'future'].includes(normalizeCommitmentStatus(item.status) ?? ''))
    .filter(item => isValidISODate(item.dueDate) && item.dueDate >= today)
    .sort(compareFinancialCommitmentsByDueDate)
    .slice(0, 3)

  return (
    <Card className="shadow-book-xs">
      <CardHeader><CardTitle className="font-display text-xl">Próximos compromissos</CardTitle></CardHeader>
      <CardContent className="divide-y">
        {sorted.length ? sorted.map(item => {
          const installmentLabel = getCommitmentInstallmentLabel(item)
          return (
            <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title || 'Compromisso sem título'}</p>
                {installmentLabel ? <p className="mt-0.5 text-xs font-medium text-primary">{installmentLabel}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{formatFinancialDate(item.dueDate)} · {getCategoryLabel(item.category)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatCurrencyBRL(Number.isFinite(item.amount) ? item.amount : 0)}</p>
                <Badge variant="outline" className="mt-1">{getCommitmentStatusLabel(item.status)}</Badge>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label={`Abrir ${item.title}`} onClick={onOpen}>
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          )
        }) : <p className="py-8 text-center text-sm text-muted-foreground">Nenhum compromisso próximo</p>}
      </CardContent>
    </Card>
  )
}

export { CommitmentsList }
