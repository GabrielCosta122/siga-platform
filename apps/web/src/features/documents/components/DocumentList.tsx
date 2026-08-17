import { Check, Link as LinkIcon, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router'
import type { Chapter, FinancialTransaction, HouseDocument } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DocumentIcon } from '@/features/documents/components/DocumentIcon'
import { formatBytes, formatDocumentDate, getDocumentCategoryLabel, getDocumentFileTypeLabel } from '@/features/documents/presentation'

function DocumentList({ items, chapters, transactions, selected, onSelect }: { items: HouseDocument[]; chapters: Chapter[]; transactions: FinancialTransaction[]; selected?: string; onSelect: (item: HouseDocument) => void }) {
  return <Card className="shadow-book-xs"><CardContent className="divide-y pt-2">{items.map(item => {
    const active = item.id === selected
    const chapter = chapters.find(candidate => candidate.id === item.chapterId)
    const transaction = transactions.find(candidate => candidate.id === item.financialTransactionId)
    return <article key={item.id} className={cn('flex items-center gap-3 py-4 transition-colors', active ? 'bg-primary/5' : 'hover:bg-secondary/50')}>
      <button type="button" onClick={() => onSelect(item)} aria-pressed={active} className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-ring"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><DocumentIcon fileType={item.fileType} category={item.category} className="size-4" /></span><span className="min-w-0 flex-1"><span title={item.name} className="block truncate text-sm font-medium">{item.name || 'Documento sem nome'}</span><span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground"><span>{getDocumentCategoryLabel(item.category)} · {getDocumentFileTypeLabel(item.fileType)}</span><span>{formatBytes(item.sizeInBytes)}</span><span>{formatDocumentDate(item.date)}</span></span></span></button>
      <span className="hidden text-right sm:block">{item.important ? <Badge variant="secondary" className="gap-1"><Check aria-hidden="true"/>Importante</Badge> : null}</span>
      <span className="hidden max-w-40 text-xs text-primary lg:block">{chapter ? <Link to={`/livro-da-casa/${chapter.id}`} className="flex items-center gap-1 truncate hover:underline"><LinkIcon className="size-3 shrink-0"/>{chapter.title}</Link> : transaction ? <Link to="/financeiro" className="flex items-center gap-1 truncate hover:underline"><LinkIcon className="size-3 shrink-0"/>{transaction.title}</Link> : item.chapterId || item.financialTransactionId ? <span className="text-muted-foreground">Vínculo não disponível</span> : null}</span>
      <Button type="button" variant="ghost" size="icon" aria-label={`Opções para ${item.name}`} onClick={() => onSelect(item)}><MoreHorizontal aria-hidden="true"/></Button>
    </article>
  })}</CardContent></Card>
}
export { DocumentList }
