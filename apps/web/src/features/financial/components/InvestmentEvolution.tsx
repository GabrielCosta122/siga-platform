import { TrendingUp } from 'lucide-react'
import type { InvestmentEvolutionPoint } from '@/store/selectors'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyBRL } from '@/lib/utils'

function InvestmentEvolution({ evolution }: { evolution: InvestmentEvolutionPoint[] }) {
  const total = evolution.at(-1)?.accumulatedAmount ?? 0
  const max = Math.max(0, ...evolution.map(item => item.accumulatedAmount))
  const current = evolution.at(-1)
  const previous = evolution.at(-2)
  const variation = current && previous && previous.accumulatedAmount > 0 ? ((current.accumulatedAmount - previous.accumulatedAmount) / previous.accumulatedAmount) * 100 : null
  return <Card className="shadow-book-xs"><CardHeader><CardTitle className="font-display text-xl">A construção deste investimento</CardTitle></CardHeader><CardContent>{evolution.length ? <div className="flex h-44 items-end gap-3 sm:gap-5">{evolution.map(item => <div key={item.monthKey} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-medium text-muted-foreground">{item.month}</span><div className="flex h-28 w-full items-end rounded-sm bg-secondary/70"><div className="w-full rounded-sm bg-primary/80" style={{ height: `${max > 0 ? Math.max(2, (item.accumulatedAmount / max) * 100) : 0}%` }} /></div><span className="text-[0.65rem] text-muted-foreground">{formatCurrencyBRL(item.accumulatedAmount / 1000).replace('R$', '').trim()}k</span></div>)}</div> : <div className="flex h-44 items-center justify-center rounded-md bg-secondary/40 text-sm text-muted-foreground">Ainda não há dados para construir este gráfico.</div>}<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm"><span className="text-muted-foreground">Total acumulado </span><strong>{formatCurrencyBRL(total)}</strong></p>{variation !== null && Number.isFinite(variation) ? <p className="flex items-center gap-1 text-sm text-success"><TrendingUp className="size-4" aria-hidden="true" /> {variation >= 0 ? '+' : ''}{variation.toFixed(0)}% desde {previous?.month}</p> : null}</div><p className="mt-4 text-sm italic text-muted-foreground">A cada etapa concluída, o apartamento se torna um pouco mais nosso.</p></CardContent></Card>
}
export { InvestmentEvolution }
