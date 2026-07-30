import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

function FinancialSummaryCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return <Card size="sm" className="shadow-book-xs"><CardContent className="flex min-h-[5.5rem] items-center justify-center gap-3.5 py-1"><span className="flex size-10 items-center justify-center rounded-md bg-accent text-primary"><Icon className="size-4" aria-hidden="true" /></span><div><p className="text-xl font-semibold leading-none tracking-tight">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>
}
export { FinancialSummaryCard }
