import type { LucideIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

type SummaryCardProps = {
  icon: LucideIcon
  label: string
  value: string
}

function SummaryCard({ icon: Icon, label, value }: SummaryCardProps) {
  return (
    <Card size="sm" className="shadow-book-xs">
      <CardContent className="flex min-h-[4.5rem] items-center justify-center gap-3.5 py-1">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-semibold leading-none tracking-tight">{value}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export { SummaryCard }
