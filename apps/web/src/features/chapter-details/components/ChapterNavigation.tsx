import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import type { Chapter } from '@/domain/types'
import { cn } from '@/lib/utils'

type ChapterNavigationProps = {
  previous?: Chapter
  next?: Chapter
}

function ChapterNavigation({ previous, next }: ChapterNavigationProps) {
  if (!previous && !next) return null

  return (
    <nav className="grid gap-3 border-t pt-6 sm:grid-cols-2" aria-label="Navegação entre capítulos">
      {previous ? (
        <Link to={`/livro-da-casa/${previous.id}`} className="group rounded-lg p-3 text-left transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" aria-hidden="true" /> Capítulo anterior</span>
          <span className="mt-1 block font-display text-base font-semibold">{previous.title}</span>
        </Link>
      ) : null}
      {next ? (
        <Link to={`/livro-da-casa/${next.id}`} className={cn('group rounded-lg p-3 text-right transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', !previous && 'sm:col-start-2')}>
          <span className="flex items-center justify-end gap-2 text-xs text-muted-foreground">Próximo capítulo <ArrowRight className="size-3.5" aria-hidden="true" /></span>
          <span className="mt-1 block font-display text-base font-semibold">{next.title}</span>
        </Link>
      ) : null}
    </nav>
  )
}

export { ChapterNavigation }
