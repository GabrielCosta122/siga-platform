import type { Chapter, ChapterPhoto } from '@/domain/types'

function getChapterPhotos(chapter: Pick<Chapter, 'photos'> | null | undefined) {
  if (!Array.isArray(chapter?.photos)) return []
  const photoIds = new Set<string>()
  return chapter.photos.filter((photo): photo is ChapterPhoto => {
    if (!photo || typeof photo.id !== 'string' || !photo.id.trim() || photoIds.has(photo.id)) return false
    photoIds.add(photo.id)
    return true
  })
}

function getChapterCoverPhoto(chapter: Pick<Chapter, 'photos' | 'coverPhotoId'> | null | undefined) {
  const photos = getChapterPhotos(chapter)
  return photos.find(photo => photo.id === chapter?.coverPhotoId)
    ?? photos.find(photo => photo.isCover)
    ?? photos[0]
}

function getLegacyChapterPhotoSource(photo: ChapterPhoto | null | undefined) {
  if (typeof photo?.src !== 'string') return null
  const source = photo.src.trim()
  if (!source || source.startsWith('/src/') || /^(blob|data):/i.test(source)) return null
  return source
}

export { getChapterCoverPhoto, getChapterPhotos, getLegacyChapterPhotoSource }
