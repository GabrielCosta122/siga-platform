import { BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'

function EmptyChapters({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="mx-auto flex size-10 items-center justify-center rounded-md bg-secondary text-primary"><BookOpen aria-hidden="true" /></span>
      <h3 className="mt-4 font-display text-xl font-semibold">Nenhum capítulo encontrado</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Tente ajustar os filtros ou escrever um novo capítulo.</p>
      <Button variant="outline" className="mt-5" onClick={onClear}>Limpar filtros</Button>
    </div>
  )
}

export { EmptyChapters }
