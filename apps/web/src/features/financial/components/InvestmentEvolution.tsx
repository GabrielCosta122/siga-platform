import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { evolution } from '@/features/financial/data'

function InvestmentEvolution() {
  return <Card className="shadow-book-xs"><CardHeader><CardTitle className="font-display text-xl">A construção deste investimento</CardTitle></CardHeader><CardContent><div className="flex h-44 items-end gap-3 sm:gap-5">{evolution.map((item) => <div key={item.month} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-medium text-muted-foreground">{item.month}</span><div className="flex h-28 w-full items-end rounded-sm bg-secondary/70"><div className="w-full rounded-sm bg-primary/80" style={{ height: `${item.value / 428.5}%` }} /></div><span className="text-[0.65rem] text-muted-foreground">R$ {(item.value / 1000).toFixed(1)}k</span></div>)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm"><span className="text-muted-foreground">Total acumulado </span><strong>R$ 42.850,00</strong></p><p className="flex items-center gap-1 text-sm text-success"><TrendingUp className="size-4" aria-hidden="true" /> +21% desde junho</p></div><p className="mt-4 text-sm italic text-muted-foreground">A cada etapa concluída, o apartamento se torna um pouco mais nosso.</p></CardContent></Card>
}
export { InvestmentEvolution }
