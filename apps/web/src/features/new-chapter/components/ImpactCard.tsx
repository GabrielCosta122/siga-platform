import { Check } from 'lucide-react'

import type { Impact } from '@/features/new-chapter/data'
import { cn } from '@/lib/utils'

type ImpactCardProps = {
  impact: Impact
  onToggle: () => void
  selected: boolean
}

function ImpactCard({ impact, onToggle, selected }: ImpactCardProps) {
  const Icon = impact.icon

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'relative flex min-h-30 w-full items-start gap-3 rounded-lg border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        selected
          ? 'border-primary bg-primary/10 shadow-book-xs'
          : 'bg-card hover:border-primary/35 hover:bg-card/80',
      )}
    >
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-md', selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary')}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 pr-4">
        <span className="block text-sm font-medium">{impact.label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{impact.description}</span>
      </span>
      {selected ? (
        <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="Selecionado">
          <Check className="size-3" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  )
}

export { ImpactCard }
