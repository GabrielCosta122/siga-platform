import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type RecentChapterItemProps = {
  category: string
  date: string
  icon: LucideIcon
  title: string
}

function RecentChapterItem({ category, date, icon: Icon, title }: RecentChapterItemProps) {
  return (
    <li className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{date}</span>
          <Badge variant="outline">{category}</Badge>
        </div>
      </div>
      <Button variant="ghost" size="icon" aria-label={`Visualizar ${title}`}>
        <ChevronRight aria-hidden="true" />
      </Button>
    </li>
  )
}

export { RecentChapterItem }
