import { ChevronRight, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router'
import type { Chapter, FinancialTransaction } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrencyBRL } from '@/lib/utils'
import { formatFinancialDate, getCategoryIcon, getCategoryLabel, getTransactionStatusLabel } from '@/features/financial/presentation'

function MovementList({ movements, chapters, onSelect }: { movements: FinancialTransaction[]; chapters: Chapter[]; onSelect: (movement: FinancialTransaction) => void }) {
  return <Card className="shadow-book-xs"><CardContent className="divide-y pt-3">{movements.map(item => {
    const Icon = getCategoryIcon(item.category)
    const chapter = chapters.find(candidate => candidate.id === item.chapterId)
    return <article key={item.id} className="flex items-center gap-3 py-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title || 'Movimentação sem título'}</p><p className="mt-1 text-xs text-muted-foreground">{formatFinancialDate(item.date)} · {getCategoryLabel(item.category)}</p>{chapter ? <Link to={`/livro-da-casa/${chapter.id}`} className="mt-1 flex items-center gap-1 truncate text-xs text-primary hover:underline"><LinkIcon className="size-3" aria-hidden="true" /> {chapter.title}</Link> : item.chapterId ? <p className="mt-1 text-xs text-muted-foreground">Capítulo relacionado não disponível</p> : null}</div><div className="text-right"><p className="text-sm font-semibold">{formatCurrencyBRL(Number.isFinite(item.amount) ? item.amount : 0)}</p><Badge variant="secondary" className="mt-1">{getTransactionStatusLabel(item.status)}</Badge></div><Button type="button" variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => onSelect(item)}>Ver detalhes <ChevronRight aria-hidden="true" /></Button></article>
  })}</CardContent></Card>
}
export { MovementList }
