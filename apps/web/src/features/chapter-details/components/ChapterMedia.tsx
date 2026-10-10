import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import constructionFoundation from '@/assets/Imagens/sweet-home/construction-foundation.png.png'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ChapterPhoto, EntityId } from '@/domain/types'
import { getChapterPhotos, getLegacyChapterPhotoSource } from '@/features/chapters/photo-presentation'
import { useChapterPhotoObjectUrls } from '@/features/chapters/useChapterPhotoObjectUrls'
import { cn } from '@/lib/utils'

interface ChapterMediaProps {
  photos?: ChapterPhoto[]
  coverPhotoId?: EntityId | null
  categoryLabel?: string
}

const getPhotoText = (value: unknown) => typeof value === 'string' ? value.trim() : ''

function ChapterMedia({ photos = [], coverPhotoId = null, categoryLabel = 'Construção' }: ChapterMediaProps) {
  const chapterPhotos = getChapterPhotos({ photos })
  const coverPhoto = chapterPhotos.find(photo => photo.id === coverPhotoId)
    ?? chapterPhotos.find(photo => photo.isCover)
    ?? chapterPhotos[0]
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(coverPhoto?.id ?? null)
  const [failedImageSources, setFailedImageSources] = useState<string[]>([])
  const selectedPhoto = chapterPhotos.find(photo => photo.id === selectedPhotoId) ?? coverPhoto
  const selectedIndex = selectedPhoto ? chapterPhotos.findIndex(photo => photo.id === selectedPhoto.id) : -1
  const { objectUrls, unavailablePhotoIds } = useChapterPhotoObjectUrls(chapterPhotos.map(photo => photo.id))

  if (chapterPhotos.length === 0 || !selectedPhoto) {
    return (
      <section className="rounded-xl bg-primary/5 p-7 sm:p-10" aria-label="Contexto do capítulo">
        <p className="font-display text-xl font-semibold">{categoryLabel}</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Este capítulo registra uma etapa importante da história, mesmo sem fotos anexadas.</p>
      </section>
    )
  }

  const getPreferredSource = (photo: ChapterPhoto) => objectUrls[photo.id] ?? getLegacyChapterPhotoSource(photo)
  const getDisplaySource = (photo: ChapterPhoto) => {
    const preferredSource = getPreferredSource(photo)
    return preferredSource && !failedImageSources.includes(preferredSource)
      ? preferredSource
      : constructionFoundation
  }
  const selectedPreferredSource = getPreferredSource(selectedPhoto)
  const selectedPhotoUnavailable = (unavailablePhotoIds.includes(selectedPhoto.id)
      && !getLegacyChapterPhotoSource(selectedPhoto))
    || Boolean(selectedPreferredSource && failedImageSources.includes(selectedPreferredSource))
  const selectedIsCover = selectedPhoto.id === coverPhoto?.id

  function markImageUnavailable(source: string | null) {
    if (!source || source === constructionFoundation) return
    setFailedImageSources(current => current.includes(source) ? current : [...current, source])
  }

  function selectRelativePhoto(offset: number) {
    if (chapterPhotos.length < 2 || selectedIndex < 0) return
    const nextIndex = (selectedIndex + offset + chapterPhotos.length) % chapterPhotos.length
    setSelectedPhotoId(chapterPhotos[nextIndex].id)
  }

  return (
    <section className="space-y-4" aria-labelledby="fotos-heading">
      <div className="relative overflow-hidden rounded-xl border bg-secondary shadow-book-md">
        <div className="relative h-[280px] sm:h-[390px]">
          <img
            src={getDisplaySource(selectedPhoto)}
            alt={getPhotoText(selectedPhoto.alt) || getPhotoText(selectedPhoto.name) || 'Foto deste capítulo'}
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={() => markImageUnavailable(selectedPreferredSource)}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.245_0.025_55_/_0.48),transparent_55%)]" />
          <div className="absolute top-4 right-4 left-4 flex items-start justify-between">
            {selectedIsCover ? <Badge className="gap-1.5 bg-card/90 text-foreground"><Check aria-hidden="true" /> Capa da História</Badge> : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="icon" className="border-card/40 bg-card/85" aria-label="Foto anterior" disabled={chapterPhotos.length < 2} onClick={() => selectRelativePhoto(-1)}><ChevronLeft aria-hidden="true" /></Button>
              <Button type="button" variant="outline" size="icon" className="border-card/40 bg-card/85" aria-label="Próxima foto" disabled={chapterPhotos.length < 2} onClick={() => selectRelativePhoto(1)}><ChevronRight aria-hidden="true" /></Button>
            </div>
          </div>
          <div className="absolute right-5 bottom-5 left-5 text-primary-foreground">
            <p className="text-sm font-medium">{getPhotoText(selectedPhoto.caption) || getPhotoText(selectedPhoto.name) || 'Foto deste capítulo'}</p>
            <p className="mt-1 text-xs text-primary-foreground/75">{chapterPhotos.length} {chapterPhotos.length === 1 ? 'foto neste capítulo' : 'fotos neste capítulo'}</p>
            {selectedPhotoUnavailable ? <p className="mt-1 text-xs text-primary-foreground/75">Foto não disponível neste dispositivo.</p> : null}
          </div>
        </div>
      </div>

      <div>
        <h2 id="fotos-heading" className="font-display text-xl font-semibold">Fotos deste capítulo</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {chapterPhotos.map(photo => {
            const selected = photo.id === selectedPhoto.id
            const isCover = photo.id === coverPhoto?.id
            const preferredSource = getPreferredSource(photo)
            return (
              <button
                key={photo.id}
                type="button"
                aria-label={`${getPhotoText(photo.name) || 'Foto do capítulo'}${isCover ? ', capa da história' : ''}`}
                aria-pressed={selected}
                onClick={() => setSelectedPhotoId(photo.id)}
                className={cn('relative aspect-[4/3] overflow-hidden rounded-md border bg-secondary text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', selected ? 'border-primary ring-2 ring-primary/35' : 'hover:border-primary/40')}
              >
                <img src={getDisplaySource(photo)} alt="" className="h-full w-full object-cover object-center" onError={() => markImageUnavailable(preferredSource)} />
                {isCover ? <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[0.65rem] font-medium text-primary-foreground"><Check className="size-3" aria-hidden="true" /> Capa</span> : null}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export { ChapterMedia }
