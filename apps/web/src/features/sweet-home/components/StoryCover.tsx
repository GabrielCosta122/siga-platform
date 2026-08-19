import { useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Chapter } from '@/domain/types'
import constructionFoundation from '@/assets/Imagens/sweet-home/construction-foundation.png.png'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { categoryIcons, categoryLabels, chapterDateLong } from '@/features/chapters/presentation'

function StoryCover({ chapters }: { chapters: Chapter[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const currentIndex = chapters.length ? Math.min(selectedIndex, chapters.length - 1) : 0
  const chapter = chapters[currentIndex]
  const coverPhoto = chapter?.photos.find(photo => photo.id === chapter.coverPhotoId)
    ?? chapter?.photos.find(photo => photo.isCover)
    ?? chapter?.photos[0]
  const coverPhotoSource = typeof coverPhoto?.src === 'string' && coverPhoto.src.trim() && !coverPhoto.src.startsWith('/src/')
    ? coverPhoto.src
    : null
  const imageSource = coverPhotoSource || constructionFoundation
  const CategoryIcon = chapter ? (categoryIcons[chapter.category] ?? BookOpen) : BookOpen

  return (
    <article className="relative isolate overflow-hidden rounded-xl border bg-secondary shadow-book-md">
      <div className="relative h-[280px] overflow-hidden sm:h-[360px] xl:h-[420px]">
        <img
          src={imageSource}
          alt={coverPhoto?.alt || (chapter ? `Capa do capítulo ${chapter.title}` : 'Vista aérea da construção do empreendimento')}
          className="absolute inset-0 z-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 z-10 bg-[linear-gradient(to_top,oklch(0.245_0.025_55_/_0.88),oklch(0.245_0.025_55_/_0.28)_48%,transparent_75%)]" />

        <div className="absolute top-4 right-4 left-4 z-20 flex items-start justify-between sm:top-6 sm:right-6 sm:left-6">
          <Badge className="gap-1.5 bg-card/90 text-foreground shadow-book-xs">
            <CategoryIcon className="size-3" aria-hidden="true" />
            {chapter ? (categoryLabels[chapter.category] ?? 'Capítulo') : 'História da casa'}
          </Badge>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="icon" className="border-card/40 bg-card/85 text-foreground hover:bg-card" aria-label="História anterior" disabled={!chapter || currentIndex >= chapters.length - 1} onClick={() => setSelectedIndex(index => Math.min(index + 1, chapters.length - 1))}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="border-card/40 bg-card/85 text-foreground hover:bg-card" aria-label="Próxima história" disabled={!chapter || currentIndex === 0} onClick={() => setSelectedIndex(index => Math.max(0, index - 1))}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="absolute right-5 bottom-5 left-5 z-20 space-y-2 text-primary-foreground sm:right-8 sm:bottom-7 sm:left-8">
          {chapter ? <p className="text-xs font-medium tracking-wide text-primary-foreground/75">{chapterDateLong(chapter)}</p> : null}
          <h2 className="max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {chapter?.title ?? 'Sua história começa aqui'}
          </h2>
          {chapters.length ? <div className="flex gap-1.5 pt-2" aria-label={`História ${currentIndex + 1} de ${chapters.length}`}>
            {chapters.map((item, index) => (
              <span
                key={item.id}
                className={`h-1 rounded-full ${index === currentIndex ? 'w-7 bg-primary-foreground' : 'w-3 bg-primary-foreground/45'}`}
                aria-hidden="true"
              />
            ))}
          </div> : null}
        </div>
      </div>
    </article>
  )
}

export { StoryCover }
