import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useState } from 'react'

import constructionFoundation from '@/assets/Imagens/sweet-home/construction-foundation.png.png'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const photos = [
  { label: 'Vista aérea da estrutura do empreendimento', position: 'object-center' },
  { label: 'Estrutura em construção vista de outro ângulo', position: 'object-[center_40%]' },
  { label: 'Avanço da obra no décimo segundo andar', position: 'object-[center_60%]' },
]

function ChapterMedia({ hasPhotos = true }: { hasPhotos?: boolean }) {
  const [selectedPhoto, setSelectedPhoto] = useState(0)

  if (!hasPhotos) {
    return (
      <section className="rounded-xl bg-primary/5 p-7 sm:p-10" aria-label="Contexto do capítulo">
        <p className="font-display text-xl font-semibold">Construção</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Este capítulo registra uma etapa importante da obra, mesmo sem fotos anexadas.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4" aria-labelledby="fotos-heading">
      <div className="relative overflow-hidden rounded-xl border bg-secondary shadow-book-md">
        <div className="relative h-[280px] sm:h-[390px]">
          <img src={constructionFoundation} alt={photos[selectedPhoto].label} className={cn('absolute inset-0 h-full w-full object-cover', photos[selectedPhoto].position)} />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.245_0.025_55_/_0.48),transparent_55%)]" />
          <div className="absolute top-4 right-4 left-4 flex items-start justify-between">
            <Badge className="gap-1.5 bg-card/90 text-foreground"><Check aria-hidden="true" /> Capa da História</Badge>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="border-card/40 bg-card/85" aria-label="Foto anterior"><ChevronLeft aria-hidden="true" /></Button>
              <Button variant="outline" size="icon" className="border-card/40 bg-card/85" aria-label="Próxima foto"><ChevronRight aria-hidden="true" /></Button>
            </div>
          </div>
          <div className="absolute right-5 bottom-5 left-5 text-primary-foreground">
            <p className="text-sm font-medium">Estrutura do 12º andar em julho de 2026</p>
            <p className="mt-1 text-xs text-primary-foreground/75">3 fotos neste capítulo</p>
          </div>
        </div>
      </div>

      <div>
        <h2 id="fotos-heading" className="font-display text-xl font-semibold">Fotos deste capítulo</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {photos.map((photo, index) => {
            const selected = index === selectedPhoto
            return (
              <button
                key={photo.label}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedPhoto(index)}
                className={cn('relative aspect-[4/3] overflow-hidden rounded-md border bg-secondary text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', selected ? 'border-primary ring-2 ring-primary/35' : 'hover:border-primary/40')}
              >
                <img src={constructionFoundation} alt="" className={cn('h-full w-full object-cover', photo.position)} />
                {selected ? <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[0.65rem] font-medium text-primary-foreground"><Check className="size-3" aria-hidden="true" /> Capa</span> : null}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export { ChapterMedia }
