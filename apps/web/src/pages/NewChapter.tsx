import { useMemo, useState } from 'react'
import { BookCheck, BookOpen, Save, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { AttachmentsPanel } from '@/features/new-chapter/components/AttachmentsPanel'
import { CategorySelector } from '@/features/new-chapter/components/CategorySelector'
import { ImpactCard } from '@/features/new-chapter/components/ImpactCard'
import { ReviewCard } from '@/features/new-chapter/components/ReviewCard'
import { categories, impacts, unrelatedImpact, type ChapterCategory } from '@/features/new-chapter/data'
import { cn } from '@/lib/utils'

const chapterDate = '15 de julho de 2026'

function NewChapter() {
  const [description, setDescription] = useState('')
  const [selectedImpactIds, setSelectedImpactIds] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ChapterCategory>(categories[0])
  const [featuredPhoto, setFeaturedPhoto] = useState(0)

  const selectedImpacts = useMemo(
    () => impacts.filter((impact) => selectedImpactIds.includes(impact.id)).map((impact) => impact.label),
    [selectedImpactIds],
  )

  function toggleImpact(id: string) {
    setSelectedImpactIds((current) => {
      if (current.includes(unrelatedImpact.id)) {
        return [id]
      }

      return current.includes(id) ? current.filter((impactId) => impactId !== id) : [...current, id]
    })
  }

  function toggleUnrelated() {
    setSelectedImpactIds((current) => current.includes(unrelatedImpact.id) ? [] : [unrelatedImpact.id])
  }

  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] space-y-8">
        <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="gap-1.5"><BookOpen aria-hidden="true" /> Reserva das Palmeiras</Badge>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Novo Capítulo</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">Registre um momento da história do seu lar.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline"><Save aria-hidden="true" /> Salvar rascunho</Button>
            <Button variant="ghost"><X aria-hidden="true" /> Cancelar</Button>
          </div>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <form className={cn('space-y-8 rounded-xl p-1 transition-colors', selectedCategory.contextClass)} onSubmit={(event) => event.preventDefault()}>
            <Card className="shadow-book-sm">
              <CardContent className="space-y-4 px-6 py-5 sm:px-8 sm:py-6">
                <div>
                  <label htmlFor="chapter-description" className="font-display text-2xl font-semibold tracking-tight">O que aconteceu hoje?</label>
                  <p className="mt-1 text-sm text-muted-foreground">Conte com suas palavras. Os detalhes dão vida à história.</p>
                </div>
                <div className="space-y-1.5">
                  <Textarea
                    id="chapter-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={600}
                    placeholder="Ex.: Visitamos a obra e vimos que a estrutura do 12º andar foi concluída."
                    className="min-h-[9.5rem] resize-y border-0 bg-secondary/55 p-4 text-base leading-relaxed shadow-none focus-visible:border-primary focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-ring/30"
                  />
                  <p className="text-right text-xs text-muted-foreground" aria-live="polite">{description.length} de 600 caracteres</p>
                </div>
                <div className="flex flex-wrap gap-2" aria-label="Sugestões para escrever">
                  {['O que mudou?', 'Quem estava presente?', 'Como você se sentiu?'].map((suggestion) => (
                    <span key={suggestion} className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
                      {suggestion}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <section className="space-y-4" aria-labelledby="impactos-heading">
              <div>
                <h2 id="impactos-heading" className="font-display text-xl font-semibold">Onde isso impacta?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Selecione todos os aspectos que este momento toca.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {impacts.map((impact) => <ImpactCard key={impact.id} impact={impact} selected={selectedImpactIds.includes(impact.id)} onToggle={() => toggleImpact(impact.id)} />)}
              </div>
              <div className="border-t pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Ou registre apenas a memória</p>
                <ImpactCard impact={unrelatedImpact} selected={selectedImpactIds.includes(unrelatedImpact.id)} onToggle={toggleUnrelated} />
              </div>
            </section>

            <section className="space-y-4" aria-labelledby="categoria-heading">
              <div>
                <h2 id="categoria-heading" className="font-display text-xl font-semibold">Categoria principal</h2>
                <p className="mt-1 text-sm text-muted-foreground">Ela define o tom sutil deste capítulo.</p>
              </div>
              <CategorySelector categories={categories} selectedId={selectedCategory.id} onSelect={setSelectedCategory} />
            </section>

            <section className="space-y-4" aria-labelledby="anexos-heading">
              <div>
                <h2 id="anexos-heading" className="font-display text-xl font-semibold">Anexos</h2>
                <p className="mt-1 text-sm text-muted-foreground">Fotos e documentos para guardar junto desta lembrança.</p>
              </div>
              <AttachmentsPanel featuredPhoto={featuredPhoto} onFeaturedPhotoChange={setFeaturedPhoto} />
            </section>

            <footer className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Capítulo de {chapterDate}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline"><Save aria-hidden="true" /> Salvar como rascunho</Button>
                <Button><BookCheck aria-hidden="true" /> Salvar Capítulo</Button>
                <Button variant="ghost"><X aria-hidden="true" /> Cancelar</Button>
              </div>
            </footer>
          </form>

          <aside className="lg:sticky lg:top-20">
            <ReviewCard category={selectedCategory.label} description={description} impacts={selectedImpactIds.includes(unrelatedImpact.id) ? [unrelatedImpact.label] : selectedImpacts} />
          </aside>
        </div>
      </div>
    </div>
  )
}

export { NewChapter }
