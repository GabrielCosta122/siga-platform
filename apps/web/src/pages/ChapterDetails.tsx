import { ArrowLeft, BookOpen, Edit3, FileText, MoreHorizontal, Star, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChapterImpacts } from '@/features/chapter-details/components/ChapterImpacts'
import { ChapterInfoCard } from '@/features/chapter-details/components/ChapterInfoCard'
import { ChapterMedia } from '@/features/chapter-details/components/ChapterMedia'
import { ChapterNavigation } from '@/features/chapter-details/components/ChapterNavigation'

const paragraphs = [
  'Visitamos a obra para acompanhar o avanço da construção. A estrutura do 12º andar já estava concluída e foi possível enxergar com mais clareza como o apartamento começava a fazer parte da paisagem.',
  'Mesmo ainda cercado por concreto, máquinas e estruturas provisórias, aquele momento tornou o projeto mais real. Cada nova etapa concluída aproxima um pouco mais a entrega do nosso lar.',
]

function ChapterDetails() {
  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-[1220px] space-y-8">
        <nav aria-label="Voltar ao livro">
          <Button variant="ghost" size="sm"><ArrowLeft aria-hidden="true" /> Voltar para o Livro da Casa</Button>
        </nav>

        <header className="border-b pb-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-4xl space-y-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground">Livro da Casa <span aria-hidden="true">/</span> Detalhes do capítulo</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5"><BookOpen aria-hidden="true" /> Construção</Badge>
                <span className="text-sm text-muted-foreground">12 de julho de 2026</span>
                <Badge variant="outline">Publicado</Badge>
                <Badge variant="outline" className="gap-1 text-primary"><Star aria-hidden="true" /> Capítulo importante</Badge>
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Atualização da obra — estrutura do 12º andar</h1>
              <p className="text-sm text-muted-foreground">Escrito por Gabriel</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline"><Edit3 aria-hidden="true" /> Editar capítulo</Button>
              <Button variant="ghost" size="icon" aria-label="Mais opções"><MoreHorizontal aria-hidden="true" /></Button>
            </div>
          </div>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-10">
            <ChapterMedia />

            <section className="max-w-3xl" aria-labelledby="aconteceu-heading">
              <h2 id="aconteceu-heading" className="font-display text-2xl font-semibold">O que aconteceu</h2>
              <div className="mt-4 space-y-5 text-base leading-relaxed text-foreground/85 sm:text-lg">
                {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>

            <ChapterImpacts />

            <section aria-labelledby="documentos-heading">
              <h2 id="documentos-heading" className="font-display text-xl font-semibold">Documentos deste capítulo</h2>
              <Card className="mt-4 shadow-book-xs">
                <CardContent className="divide-y pt-3">
                  {[
                    ['Relatório da obra.pdf', 'PDF · 2,4 MB · 12 jul 2026'],
                    ['Registro da visita técnica.pdf', 'PDF · 480 KB · 12 jul 2026'],
                  ].map(([name, meta]) => (
                    <div key={name} className="flex items-center gap-3 py-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><FileText className="size-4" aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{name}</span><span className="block text-xs text-muted-foreground">{meta}</span></span>
                      <Button variant="ghost" size="sm">Abrir</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <ChapterNavigation />

            <footer className="flex flex-wrap gap-2 border-t pt-6">
              <Button variant="outline"><Edit3 aria-hidden="true" /> Editar capítulo</Button>
              <Button variant="outline"><Star aria-hidden="true" /> Desmarcar importante</Button>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 aria-hidden="true" /> Excluir capítulo</Button>
            </footer>
          </div>
          <aside className="space-y-4 lg:sticky lg:top-20">
            <ChapterInfoCard />
            <p className="rounded-lg bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">Este capítulo preserva uma etapa que aproxima a casa do que ela vai se tornar.</p>
          </aside>
        </div>
      </article>
    </div>
  )
}

export { ChapterDetails }
