import { ChevronRight, Link } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Movement = { id:string; title:string; value:string; date:string; category:string; status:string; chapter:string; icon: LucideIcon }
function MovementList({ movements }: { movements: Movement[] }) { return <Card className="shadow-book-xs"><CardContent className="divide-y pt-3">{movements.map((item) => { const Icon=item.icon; return <article key={item.id} className="flex items-center gap-3 py-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.date} · {item.category}</p>{item.chapter ? <p className="mt-1 flex items-center gap-1 truncate text-xs text-primary"><Link className="size-3" aria-hidden="true" /> {item.chapter}</p> : null}</div><div className="text-right"><p className="text-sm font-semibold">{item.value}</p><Badge variant="secondary" className="mt-1">{item.status}</Badge></div><Button variant="ghost" size="sm" className="hidden sm:inline-flex">Ver detalhes <ChevronRight aria-hidden="true" /></Button></article> })}</CardContent></Card> }
export { MovementList }
