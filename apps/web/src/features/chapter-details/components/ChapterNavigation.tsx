import { ArrowLeft, ArrowRight } from 'lucide-react'

function ChapterNavigation() {
  return (
    <nav className="grid gap-3 border-t pt-6 sm:grid-cols-2" aria-label="Navegação entre capítulos">
      <button type="button" className="group rounded-lg p-3 text-left transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" aria-hidden="true" /> Capítulo anterior</span>
        <span className="mt-1 block font-display text-base font-semibold">Pagamento da entrada</span>
      </button>
      <button type="button" className="group rounded-lg p-3 text-right transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <span className="flex items-center justify-end gap-2 text-xs text-muted-foreground">Próximo capítulo <ArrowRight className="size-3.5" aria-hidden="true" /></span>
        <span className="mt-1 block font-display text-base font-semibold">Visita técnica ao apartamento</span>
      </button>
    </nav>
  )
}

export { ChapterNavigation }
