import { useAppStore } from '@/store/useAppStore'
import { useEffect, useRef, useState } from 'react'
import type { Chapter, ChapterPhoto } from '@/domain/types'
import { createEntityId } from '@/lib/utils'
import {
  deleteChapterPhoto,
  getChapterPhoto,
  getChapterPhotoStorageMessage,
  saveChapterPhoto,
} from '@/storage/chapter-photo-storage'

export type EditableChapterPhoto = ChapterPhoto & {
  previewUrl: string | null
  availability: 'loading' | 'ready' | 'unavailable'
  file?: File
}

const supportedImageTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const supportedImageExtensions = /\.(?:jpe?g|png|webp)$/i

function getSafePhotos(chapter?: Chapter): EditableChapterPhoto[] {
  if (!Array.isArray(chapter?.photos)) return []
  const seenPhotoIds = new Set<string>()
  const photos = chapter.photos.filter(photo => {
    if (!photo || typeof photo.id !== 'string' || !photo.id.trim() || seenPhotoIds.has(photo.id)) return false
    seenPhotoIds.add(photo.id)
    return true
  }).map(photo => ({
    id: photo.id,
    name: typeof photo.name === 'string' && photo.name.trim() ? photo.name : 'Foto do capítulo',
    src: typeof photo.src === 'string' && !/^(?:blob|data):/i.test(photo.src.trim()) ? photo.src : '',
    alt: typeof photo.alt === 'string' && photo.alt.trim() ? photo.alt : 'Foto do capítulo',
    caption: typeof photo.caption === 'string' ? photo.caption : '',
    isCover: Boolean(photo.isCover),
    createdAt: typeof photo.createdAt === 'string' ? photo.createdAt : new Date().toISOString(),
    previewUrl: null,
    availability: 'loading' as const,
  }))
  if (!photos.length) return photos
  const preferredCoverId = typeof chapter.coverPhotoId === 'string' && photos.some(photo => photo.id === chapter.coverPhotoId)
    ? chapter.coverPhotoId
    : photos.find(photo => photo.isCover)?.id ?? photos[0].id
  return photos.map(photo => ({ ...photo, isCover: photo.id === preferredCoverId }))
}

function isSupportedImage(file: File) {
  return supportedImageTypes.has(file.type.toLowerCase())
    || (!file.type && supportedImageExtensions.test(file.name))
}

function toMetadata(photo: EditableChapterPhoto): ChapterPhoto {
  return {
    id: photo.id,
    name: photo.name,
    src: photo.src,
    alt: photo.alt,
    caption: photo.caption,
    isCover: photo.isCover,
    createdAt: photo.createdAt,
  }
}

export function useChapterPhotoAttachments(chapter?: Chapter) {
  const { fileDatabaseName } = useAppStore()
  const [photos, setPhotos] = useState<EditableChapterPhoto[]>(() => getSafePhotos(chapter))
  const [error, setError] = useState('')
  const removedStoredPhotoIds = useRef(new Set<string>())
  const originalPhotoIds = useRef(new Set(getSafePhotos(chapter).map(photo => photo.id)))
  const objectUrls = useRef(new Set<string>())

  function rememberObjectUrl(blob: Blob) {
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return undefined
    const objectUrl = URL.createObjectURL(blob)
    objectUrls.current.add(objectUrl)
    return objectUrl
  }

  function releaseObjectUrl(objectUrl?: string | null) {
    if (!objectUrl || !objectUrls.current.has(objectUrl)) return
    URL.revokeObjectURL(objectUrl)
    objectUrls.current.delete(objectUrl)
  }

  useEffect(() => {
    let active = true
    const chapterPhotos = getSafePhotos(chapter)

    chapterPhotos.forEach(photo => {
      getChapterPhoto(photo.id, fileDatabaseName).then(storedPhoto => {
        if (!active) return
        if (!storedPhoto) {
          setPhotos(current => current.map(item => item.id === photo.id ? { ...item, availability: 'unavailable' } : item))
          return
        }
        const previewUrl = rememberObjectUrl(storedPhoto.blob)
        setPhotos(current => {
          if (!current.some(item => item.id === photo.id)) {
            releaseObjectUrl(previewUrl)
            return current
          }
          return current.map(item => item.id === photo.id
            ? { ...item, previewUrl: previewUrl ?? null, availability: previewUrl ? 'ready' : 'unavailable' }
            : item)
        })
      }).catch(() => {
        if (active) setPhotos(current => current.map(item => item.id === photo.id ? { ...item, availability: 'unavailable' } : item))
      })
    })

    return () => { active = false }
    // NewChapterForm is keyed by chapter id, so this load intentionally runs once per form instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => {
    objectUrls.current.forEach(objectUrl => URL.revokeObjectURL(objectUrl))
    objectUrls.current.clear()
  }, [])

  function addPhotos(files: File[]) {
    setError('')
    const accepted = files.filter(isSupportedImage)
    if (accepted.length !== files.length) setError('Use imagens JPG, JPEG, PNG ou WEBP.')
    if (!accepted.length) return
    const hasCover = photos.some(photo => photo.isCover)
    const now = new Date().toISOString()
    const additions = accepted.map((file, index): EditableChapterPhoto => ({
      id: createEntityId('photo'),
      name: file.name,
      src: '',
      alt: file.name.replace(/\.[^.]+$/, '').trim() || 'Foto do capítulo',
      caption: '',
      isCover: !hasCover && index === 0,
      createdAt: now,
      previewUrl: rememberObjectUrl(file) ?? null,
      availability: 'ready',
      file,
    }))
    setPhotos(current => [...current, ...additions])
  }

  function removePhoto(photoId: string) {
    setError('')
    const removed = photos.find(photo => photo.id === photoId)
    if (!removed) return
    releaseObjectUrl(removed.previewUrl)
    if (originalPhotoIds.current.has(photoId)) removedStoredPhotoIds.current.add(photoId)
    setPhotos(current => {
      const remaining = current.filter(photo => photo.id !== photoId)
      if (removed.isCover && remaining.length) return remaining.map((photo, index) => ({ ...photo, isCover: index === 0 }))
      return remaining
    })
  }

  function updateCaption(photoId: string, caption: string) {
    setPhotos(current => current.map(photo => photo.id === photoId ? { ...photo, caption } : photo))
  }

  function selectCover(photoId: string) {
    setPhotos(current => current.map(photo => ({ ...photo, isCover: photo.id === photoId })))
  }

  async function persistPhotos(chapterId: string) {
    setError('')
    const newlyStoredIds: string[] = []
    try {
      for (const photo of photos) {
        if (!photo.file) continue
        await saveChapterPhoto(photo.id, chapterId, photo.file, fileDatabaseName)
        newlyStoredIds.push(photo.id)
      }
    } catch (storageError) {
      await Promise.allSettled(newlyStoredIds.map(photoId => deleteChapterPhoto(photoId, fileDatabaseName)))
      setError(getChapterPhotoStorageMessage(storageError))
      return null
    }

    const normalizedCoverId = photos.find(photo => photo.isCover)?.id ?? photos[0]?.id ?? null
    const metadata = photos.map(photo => toMetadata({ ...photo, isCover: photo.id === normalizedCoverId }))
    await Promise.allSettled([...removedStoredPhotoIds.current].map(photoId => deleteChapterPhoto(photoId, fileDatabaseName)))
    return { photos: metadata, coverPhotoId: normalizedCoverId }
  }

  return {
    photos,
    photoError: error,
    addPhotos,
    removePhoto,
    updateCaption,
    selectCover,
    persistPhotos,
  }
}
