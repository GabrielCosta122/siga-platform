import { useId, useRef, useState, type ChangeEvent } from 'react'
import { Check, Image as ImageIcon, ImagePlus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PhotoAvailability = 'ready' | 'loading' | 'unavailable'

type ChapterPhotoAttachmentView = {
  id: string
  name: string
  alt?: string
  caption: string
  previewUrl: string | null
  availability?: PhotoAvailability
}

type PhotoAttachmentsEditorProps = {
  photos: ChapterPhotoAttachmentView[]
  coverPhotoId: string | null
  onPhotosAdded: (files: File[]) => void
  onPhotoRemoved: (photoId: string) => void
  onPhotoCaptionChange: (photoId: string, caption: string) => void
  onCoverPhotoChange: (photoId: string) => void
  error?: string
  disabled?: boolean
}

function PhotoPreview({ photo }: { photo: ChapterPhotoAttachmentView }) {
  const [failed, setFailed] = useState(false)

  if (photo.availability === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-secondary/55 px-4 text-center text-xs text-muted-foreground">
        Carregando foto…
      </div>
    )
  }

  if (!photo.previewUrl || photo.availability === 'unavailable' || failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-secondary/55 px-4 text-center">
        <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs leading-relaxed text-muted-foreground">Foto não disponível neste dispositivo.</span>
      </div>
    )
  }

  return (
    <img
      src={photo.previewUrl}
      alt={photo.alt?.trim() || photo.caption.trim() || photo.name}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function PhotoAttachmentsEditor({
  photos,
  coverPhotoId,
  onPhotosAdded,
  onPhotoRemoved,
  onPhotoCaptionChange,
  onCoverPhotoChange,
  error,
  disabled = false,
}: PhotoAttachmentsEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
    if (files.length) onPhotosAdded(files)
    event.currentTarget.value = ''
  }

  return (
    <section className="space-y-4" aria-labelledby={`${inputId}-heading`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id={`${inputId}-heading`} className="font-display text-lg font-semibold">Fotos</h3>
          <p id={`${inputId}-help`} className="mt-1 text-sm text-muted-foreground">Guarde os detalhes que merecem voltar à memória.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
          <ImagePlus aria-hidden="true" /> Adicionar
        </Button>
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-describedby={`${inputId}-help`}
          disabled={disabled}
          onChange={selectPhotos}
        />
      </div>

      {error ? <p role="alert" className="rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p> : null}

      {photos.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {photos.map(photo => {
            const isCover = photo.id === coverPhotoId
            const captionId = `${inputId}-${photo.id}-caption`

            return (
              <article key={photo.id} className="overflow-hidden rounded-lg border bg-background">
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                  <PhotoPreview key={`${photo.previewUrl ?? 'empty'}:${photo.availability ?? 'ready'}`} photo={photo} />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 size-7 shadow-book-xs"
                    aria-label={`Remover foto ${photo.name}`}
                    onClick={() => onPhotoRemoved(photo.id)}
                    disabled={disabled}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                  {isCover ? (
                    <Badge className="absolute bottom-2 left-2 gap-1.5 shadow-book-xs">
                      <Check aria-hidden="true" /> Capa da História
                    </Badge>
                  ) : null}
                </div>

                <div className="space-y-2 p-3">
                  <p className="truncate text-xs font-medium" title={photo.name}>{photo.name}</p>
                  <label htmlFor={captionId} className="sr-only">Legenda de {photo.name}</label>
                  <Input
                    id={captionId}
                    value={photo.caption}
                    onChange={event => onPhotoCaptionChange(photo.id, event.target.value)}
                    placeholder="Legenda opcional"
                    className="h-8 text-xs"
                    maxLength={180}
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    variant={isCover ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full"
                    aria-pressed={isCover}
                    onClick={() => onCoverPhotoChange(photo.id)}
                    disabled={disabled || isCover}
                  >
                    <Check aria-hidden="true" /> {isCover ? 'Capa da História' : 'Usar como capa'}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-secondary/20 px-4 py-8 text-center">
          <ImagePlus className="mx-auto size-5 text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">Nenhuma foto adicionada</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Registre imagens que ajudam a lembrar este momento.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {photos.length === 1 ? '1 foto' : `${photos.length} fotos`}
        {coverPhotoId && photos.some(photo => photo.id === coverPhotoId) ? ' · capa selecionada' : ''}
      </p>
    </section>
  )
}

export { PhotoAttachmentsEditor }
export type { ChapterPhotoAttachmentView, PhotoAttachmentsEditorProps, PhotoAvailability }
