import { Check, FileText, ImagePlus, Upload } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type AttachmentsPanelProps = {
  featuredPhoto: number
  onFeaturedPhotoChange: (index: number) => void
}

const documents = [
  { name: 'Relatório da obra.pdf', meta: 'PDF · 2,4 MB' },
  { name: 'Comprovante de pagamento.pdf', meta: 'PDF · 186 KB' },
]

function AttachmentsPanel({ featuredPhoto, onFeaturedPhotoChange }: AttachmentsPanelProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="shadow-book-xs">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Fotos</h3>
              <p className="mt-1 text-sm text-muted-foreground">Guarde os detalhes que merecem voltar à memória.</p>
            </div>
            <Button type="button" variant="outline" size="sm"><ImagePlus aria-hidden="true" /> Adicionar</Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((photo) => {
              const selected = photo === featuredPhoto
              return (
                <button
                  key={photo}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onFeaturedPhotoChange(photo)}
                  className={cn(
                    'relative aspect-[4/3] overflow-hidden rounded-md border bg-secondary text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    selected ? 'border-primary ring-2 ring-primary/35' : 'hover:border-primary/35',
                  )}
                >
                  <span className={`absolute inset-0 ${photo === 0 ? 'bg-primary/15' : photo === 1 ? 'bg-success/15' : 'bg-warning/15'}`} />
                  <ImagePlus className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  {selected ? (
                    <span className="absolute right-1.5 bottom-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <Badge variant="secondary" className="gap-1.5"><Check aria-hidden="true" /> Capa da História</Badge>
        </CardContent>
      </Card>

      <Card className="shadow-book-xs">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Documentos</h3>
              <p className="mt-1 text-sm text-muted-foreground">Arquivos que ajudam a preservar o contexto.</p>
            </div>
            <Button type="button" variant="outline" size="sm"><Upload aria-hidden="true" /> Adicionar</Button>
          </div>
          <ul className="divide-y rounded-md border bg-background px-3">
            {documents.map((document) => (
              <li key={document.name} className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{document.name}</span>
                  <span className="block text-xs text-muted-foreground">{document.meta}</span>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export { AttachmentsPanel }
