import { Check } from 'lucide-react'

import type { ChapterCategory } from '@/features/new-chapter/data'
import { cn } from '@/lib/utils'

type CategorySelectorProps = {
  categories: ChapterCategory[]
  onSelect: (category: ChapterCategory) => void
  selectedId: string
}

function CategorySelector({ categories, onSelect, selectedId }: CategorySelectorProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Categoria principal">
      {categories.map((category) => {
        const Icon = category.icon
        const selected = category.id === selectedId

        return (
          <button
            key={category.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(category)}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              selected ? 'border-primary bg-primary/10 font-medium' : 'bg-card hover:border-primary/35',
            )}
          >
            <span className={cn('flex size-8 items-center justify-center rounded-md', selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary')}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="flex-1">{category.label}</span>
            {selected ? <Check className="size-4 text-primary" aria-label="Selecionada" /> : null}
          </button>
        )
      })}
    </div>
  )
}

export { CategorySelector }
