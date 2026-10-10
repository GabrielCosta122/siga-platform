import { useState } from 'react'
import { BookMarked, FileText, Image, Star } from 'lucide-react'
import { Link } from 'react-router'
import type { Chapter } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getChapterCoverPhoto, getChapterPhotos, getLegacyChapterPhotoSource } from '@/features/chapters/photo-presentation'
import { categoryIcons, categoryLabels, chapterDateShort, getImpactLabel } from '@/features/chapters/presentation'
import { useChapterPhotoObjectUrl } from '@/features/chapters/useChapterPhotoObjectUrls'

function TimelineChapter({ chapter, categoryLabel, documentCount }: { chapter: Chapter; categoryLabel?: string; documentCount?: number }) {
  const Icon = categoryIcons[chapter.category] ?? BookMarked
  const photos = getChapterPhotos(chapter)
  const documentIds = Array.isArray(chapter.documentIds) ? chapter.documentIds : []
  const impacts = Array.isArray(chapter.impacts) ? chapter.impacts : []
  const title = typeof chapter.title === 'string' && chapter.title.trim() ? chapter.title : 'Capítulo sem título'
  const content = typeof chapter.content === 'string' ? chapter.content : ''
  const coverPhoto = getChapterCoverPhoto(chapter)
  const { objectUrl } = useChapterPhotoObjectUrl(coverPhoto?.id)
  const [failedImageSource, setFailedImageSource] = useState('')
  const preferredImageSource = objectUrl ?? getLegacyChapterPhotoSource(coverPhoto)
  const imageSource = preferredImageSource && preferredImageSource !== failedImageSource
    ? preferredImageSource
    : null
  return <article className="relative pl-8 sm:pl-10">
    <span className="absolute top-6 left-0 flex size-7 items-center justify-center rounded-full border bg-background text-primary shadow-book-xs sm:left-0"><Icon className="size-3.5" aria-hidden="true" /></span>
    <Card className="shadow-book-xs"><CardContent className="flex gap-4 pt-5 sm:pt-6">
      {photos.length > 0 ? <div className="hidden size-20 shrink-0 overflow-hidden rounded-md border bg-secondary sm:block">{imageSource ? <img src={imageSource} alt={`Miniatura do capítulo ${title}`} className="h-full w-full object-cover" onError={() => setFailedImageSource(imageSource)} /> : <div className="h-full w-full bg-[linear-gradient(145deg,var(--accent),var(--secondary))] p-3" role="img" aria-label={`Miniatura não disponível do capítulo ${title}`}><div className="h-full border border-primary/20 bg-card/40" /></div>}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium text-muted-foreground">{chapterDateShort(chapter)}</p><Badge variant="outline">{categoryLabel || categoryLabels[chapter.category] || 'Outra categoria'}</Badge>{chapter.important ? <Badge variant="secondary" className="gap-1"><Star aria-hidden="true" /> Importante</Badge> : null}</div>
        <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{content}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Image className="size-3.5" aria-hidden="true" /> {photos.length} fotos</span><span className="flex items-center gap-1.5"><FileText className="size-3.5" aria-hidden="true" /> {documentCount ?? documentIds.length} documentos</span><span className="flex items-center gap-1.5"><BookMarked className="size-3.5" aria-hidden="true" /> {impacts.map(getImpactLabel).join(' · ')}</span></div>
        <Button variant="ghost" size="sm" className="mt-3" render={<Link to={`/livro-da-casa/${chapter.id}`} />}>Abrir capítulo</Button>
      </div>
    </CardContent></Card>
  </article>
}
export { TimelineChapter }
