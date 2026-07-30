import { BookOpen, CalendarDays, FileText, Image, Tag } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function BookSummary() {
  const items = [
    { icon: BookOpen, label: 'Capítulos', value: '18' },
    { icon: CalendarDays, label: 'Primeiro', value: '02 fev 2026' },
    { icon: CalendarDays, label: 'Mais recente', value: '12 jul 2026' },
    { icon: Tag, label: 'Mais frequente', value: 'Construção' },
    { icon: Image, label: 'Fotos', value: '34' },
    { icon: FileText, label: 'Documentos', value: '12' },
  ]

  return (
    <Card className="shadow-book-xs">
      <CardHeader><CardTitle className="font-display text-lg">Em poucas páginas</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><Icon className="size-4" aria-hidden="true" /></span>
            <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export { BookSummary }
