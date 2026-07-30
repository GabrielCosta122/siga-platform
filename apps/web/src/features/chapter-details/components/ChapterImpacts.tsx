import { CalendarClock, ChevronRight, FileText, House } from 'lucide-react'

const impacts = [
  { title: 'Patrimônio', description: 'A estrutura física do imóvel avançou.', icon: House },
  { title: 'Cronograma', description: 'Uma nova etapa da obra foi concluída.', icon: CalendarClock },
  { title: 'Documentação', description: 'Relatórios e registros foram anexados.', icon: FileText },
]

function ChapterImpacts() {
  return (
    <section aria-labelledby="impactos-heading">
      <h2 id="impactos-heading" className="font-display text-xl font-semibold">Onde este capítulo impacta</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {impacts.map(({ title, description, icon: Icon }) => (
          <article key={title} className="rounded-lg border bg-card p-4 shadow-book-xs">
            <Icon className="size-4 text-primary" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-medium">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            <span className="mt-3 flex items-center gap-1 text-xs text-primary">Ver registros relacionados <ChevronRight className="size-3" aria-hidden="true" /></span>
          </article>
        ))}
      </div>
    </section>
  )
}

export { ChapterImpacts }
