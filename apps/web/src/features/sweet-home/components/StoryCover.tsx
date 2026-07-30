import { ChevronLeft, ChevronRight, Construction } from 'lucide-react'

import constructionFoundation from '@/assets/Imagens/sweet-home/construction-foundation.png.png'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function StoryCover() {
  return (
    <article className="relative isolate overflow-hidden rounded-xl border bg-secondary shadow-book-md">
      <div className="relative h-[280px] overflow-hidden sm:h-[360px] xl:h-[420px]">
        <img
          src={constructionFoundation}
          alt="Vista aérea da construção do empreendimento"
          className="absolute inset-0 z-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 z-10 bg-[linear-gradient(to_top,oklch(0.245_0.025_55_/_0.88),oklch(0.245_0.025_55_/_0.28)_48%,transparent_75%)]" />

        <div className="absolute top-4 right-4 left-4 z-20 flex items-start justify-between sm:top-6 sm:right-6 sm:left-6">
          <Badge className="gap-1.5 bg-card/90 text-foreground shadow-book-xs">
            <Construction className="size-3" aria-hidden="true" />
            Construção
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="border-card/40 bg-card/85 text-foreground hover:bg-card" aria-label="História anterior">
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button variant="outline" size="icon" className="border-card/40 bg-card/85 text-foreground hover:bg-card" aria-label="Próxima história">
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="absolute right-5 bottom-5 left-5 z-20 space-y-2 text-primary-foreground sm:right-8 sm:bottom-7 sm:left-8">
          <p className="text-xs font-medium tracking-wide text-primary-foreground/75">15 de fevereiro de 2026</p>
          <h2 className="max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            A fundação da nossa história
          </h2>
          <div className="flex gap-1.5 pt-2" aria-label="História 1 de 4">
            {[0, 1, 2, 3].map((indicator) => (
              <span
                key={indicator}
                className={`h-1 rounded-full ${indicator === 0 ? 'w-7 bg-primary-foreground' : 'w-3 bg-primary-foreground/45'}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

export { StoryCover }
