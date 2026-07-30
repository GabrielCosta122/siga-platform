import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { commitments } from '@/features/financial/data'

function CommitmentsList() { return <Card className="shadow-book-xs"><CardHeader><CardTitle className="font-display text-xl">Próximos compromissos</CardTitle></CardHeader><CardContent className="divide-y">{commitments.map((item) => <div key={item.title} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.date} · {item.category}</p></div><div className="text-right"><p className="text-sm font-semibold">{item.value}</p><Badge variant="outline" className="mt-1">{item.status}</Badge></div><Button variant="ghost" size="icon" aria-label={`Abrir ${item.title}`}><ChevronRight aria-hidden="true" /></Button></div>)}</CardContent></Card> }
export { CommitmentsList }
