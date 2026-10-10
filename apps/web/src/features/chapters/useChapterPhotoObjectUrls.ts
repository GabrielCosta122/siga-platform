import { useAppStore } from '@/store/useAppStore'
import { useEffect, useMemo, useState } from 'react'

import { getChapterPhoto } from '@/storage/chapter-photo-storage'

type ChapterPhotoObjectUrlState = {
  requestKey: string
  objectUrls: Record<string, string>
  unavailablePhotoIds: string[]
  loading: boolean
}

const PHOTO_ID_SEPARATOR = '\u001f'

function getPhotoIds(photoIds: readonly string[]) {
  return Array.from(new Set(photoIds.filter(photoId => typeof photoId === 'string' && photoId.trim())))
}

function useChapterPhotoObjectUrls(photoIds: readonly string[]) {
  const { fileDatabaseName } = useAppStore()
  const requestKey = getPhotoIds(photoIds).join(PHOTO_ID_SEPARATOR)
  const requestedPhotoIds = useMemo(
    () => requestKey ? requestKey.split(PHOTO_ID_SEPARATOR) : [],
    [requestKey],
  )
  const [state, setState] = useState<ChapterPhotoObjectUrlState>({
    requestKey: '',
    objectUrls: {},
    unavailablePhotoIds: [],
    loading: false,
  })

  useEffect(() => {
    let cancelled = false
    const createdObjectUrls: string[] = []

    if (requestedPhotoIds.length === 0) return

    Promise.all(requestedPhotoIds.map(async photoId => {
      try {
        const storedPhoto = await getChapterPhoto(photoId, fileDatabaseName)
        if (!storedPhoto?.blob || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
          return { photoId, objectUrl: null }
        }

        const objectUrl = URL.createObjectURL(storedPhoto.blob)
        createdObjectUrls.push(objectUrl)
        return { photoId, objectUrl }
      } catch {
        return { photoId, objectUrl: null }
      }
    })).then(results => {
      if (cancelled) {
        if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
          createdObjectUrls.forEach(objectUrl => URL.revokeObjectURL(objectUrl))
        }
        return
      }

      const objectUrls: Record<string, string> = {}
      const unavailablePhotoIds: string[] = []
      results.forEach(({ photoId, objectUrl }) => {
        if (objectUrl) objectUrls[photoId] = objectUrl
        else unavailablePhotoIds.push(photoId)
      })
      setState({ requestKey, objectUrls, unavailablePhotoIds, loading: false })
    })

    return () => {
      cancelled = true
      if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return
      createdObjectUrls.forEach(objectUrl => URL.revokeObjectURL(objectUrl))
    }
  }, [requestKey, requestedPhotoIds, fileDatabaseName])

  if (state.requestKey !== requestKey) {
    return {
      objectUrls: {} as Record<string, string>,
      unavailablePhotoIds: [] as string[],
      loading: requestedPhotoIds.length > 0,
    }
  }

  return {
    objectUrls: state.objectUrls,
    unavailablePhotoIds: state.unavailablePhotoIds,
    loading: state.loading,
  }
}

function useChapterPhotoObjectUrl(photoId: string | null | undefined) {
  const normalizedPhotoId = typeof photoId === 'string' && photoId.trim() ? photoId : null
  const photoIds = useMemo(() => normalizedPhotoId ? [normalizedPhotoId] : [], [normalizedPhotoId])
  const { objectUrls, unavailablePhotoIds, loading } = useChapterPhotoObjectUrls(photoIds)

  return {
    objectUrl: normalizedPhotoId ? objectUrls[normalizedPhotoId] ?? null : null,
    unavailable: normalizedPhotoId ? unavailablePhotoIds.includes(normalizedPhotoId) : false,
    loading,
  }
}

export { useChapterPhotoObjectUrl, useChapterPhotoObjectUrls }
