const DATABASE_NAME = 'siga-files'
const DATABASE_VERSION = 2
const DOCUMENT_STORE = 'documents'
const CHAPTER_PHOTO_STORE = 'chapter-photos'
const CHAPTER_PHOTO_CHAPTER_INDEX = 'chapterId'

export interface StoredChapterPhoto {
  photoId: string
  chapterId: string
  blob: Blob
  name: string
  type: string
  size: number
  lastModified: number
}

export type ChapterPhotoStorageErrorCode = 'quota' | 'unavailable' | 'operation'

export class ChapterPhotoStorageError extends Error {
  code: ChapterPhotoStorageErrorCode

  constructor(code: ChapterPhotoStorageErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ChapterPhotoStorageError'
    this.code = code
  }
}

function normalizeStorageError(error: unknown) {
  if (error instanceof ChapterPhotoStorageError) return error

  const name = typeof DOMException !== 'undefined' && error instanceof DOMException
    ? error.name
    : error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : ''

  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
    return new ChapterPhotoStorageError('quota', 'IndexedDB quota exceeded.', { cause: error })
  }

  return new ChapterPhotoStorageError('operation', 'IndexedDB operation failed.', { cause: error })
}

function prepareDatabase(request: IDBOpenDBRequest) {
  const database = request.result

  if (!database.objectStoreNames.contains(DOCUMENT_STORE)) {
    database.createObjectStore(DOCUMENT_STORE, { keyPath: 'documentId' })
  }

  if (!database.objectStoreNames.contains(CHAPTER_PHOTO_STORE)) {
    const photoStore = database.createObjectStore(CHAPTER_PHOTO_STORE, { keyPath: 'photoId' })
    photoStore.createIndex(CHAPTER_PHOTO_CHAPTER_INDEX, 'chapterId', { unique: false })
    return
  }

  const photoStore = request.transaction?.objectStore(CHAPTER_PHOTO_STORE)
  if (photoStore && !photoStore.indexNames.contains(CHAPTER_PHOTO_CHAPTER_INDEX)) {
    photoStore.createIndex(CHAPTER_PHOTO_CHAPTER_INDEX, 'chapterId', { unique: false })
  }
}

function openChapterPhotoDatabase(databaseName: string): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new ChapterPhotoStorageError('unavailable', 'IndexedDB is not available.'))
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const request = indexedDB.open(databaseName, DATABASE_VERSION)

    request.onupgradeneeded = () => prepareDatabase(request)
    request.onsuccess = () => {
      if (settled) {
        request.result.close()
        return
      }

      settled = true
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => {
      if (settled) return
      settled = true
      reject(normalizeStorageError(request.error))
    }
    request.onblocked = () => {
      if (settled) return
      settled = true
      reject(new ChapterPhotoStorageError('operation', 'IndexedDB upgrade was blocked.'))
    }
  })
}

export async function saveChapterPhoto(photoId: string, chapterId: string, file: File, databaseName = DATABASE_NAME): Promise<void> {
  const database = await openChapterPhotoDatabase(databaseName)
  const storedPhoto: StoredChapterPhoto = {
    photoId,
    chapterId,
    blob: file.slice(0, file.size, file.type),
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      database.close()
      reject(normalizeStorageError(error))
    }

    try {
      const transaction = database.transaction(CHAPTER_PHOTO_STORE, 'readwrite')
      const request = transaction.objectStore(CHAPTER_PHOTO_STORE).put(storedPhoto)
      request.onerror = () => fail(request.error)
      transaction.oncomplete = () => {
        if (settled) return
        settled = true
        database.close()
        resolve()
      }
      transaction.onerror = () => fail(transaction.error)
      transaction.onabort = () => fail(transaction.error)
    } catch (error) {
      fail(error)
    }
  })
}

export async function getChapterPhoto(photoId: string, databaseName = DATABASE_NAME): Promise<StoredChapterPhoto | null> {
  const database = await openChapterPhotoDatabase(databaseName)

  return new Promise((resolve, reject) => {
    let result: StoredChapterPhoto | null = null
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      database.close()
      reject(normalizeStorageError(error))
    }

    try {
      const transaction = database.transaction(CHAPTER_PHOTO_STORE, 'readonly')
      const request = transaction.objectStore(CHAPTER_PHOTO_STORE).get(photoId)
      request.onsuccess = () => {
        result = (request.result as StoredChapterPhoto | undefined) ?? null
      }
      request.onerror = () => fail(request.error)
      transaction.oncomplete = () => {
        if (settled) return
        settled = true
        database.close()
        resolve(result)
      }
      transaction.onerror = () => fail(transaction.error)
      transaction.onabort = () => fail(transaction.error)
    } catch (error) {
      fail(error)
    }
  })
}

export async function deleteChapterPhoto(photoId: string, databaseName = DATABASE_NAME): Promise<void> {
  const database = await openChapterPhotoDatabase(databaseName)

  return new Promise((resolve, reject) => {
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      database.close()
      reject(normalizeStorageError(error))
    }

    try {
      const transaction = database.transaction(CHAPTER_PHOTO_STORE, 'readwrite')
      const request = transaction.objectStore(CHAPTER_PHOTO_STORE).delete(photoId)
      request.onerror = () => fail(request.error)
      transaction.oncomplete = () => {
        if (settled) return
        settled = true
        database.close()
        resolve()
      }
      transaction.onerror = () => fail(transaction.error)
      transaction.onabort = () => fail(transaction.error)
    } catch (error) {
      fail(error)
    }
  })
}

export async function deleteChapterPhotosByChapterId(chapterId: string, databaseName = DATABASE_NAME): Promise<void> {
  const database = await openChapterPhotoDatabase(databaseName)

  return new Promise((resolve, reject) => {
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      database.close()
      reject(normalizeStorageError(error))
    }

    try {
      const transaction = database.transaction(CHAPTER_PHOTO_STORE, 'readwrite')
      const store = transaction.objectStore(CHAPTER_PHOTO_STORE)
      const request = store.index(CHAPTER_PHOTO_CHAPTER_INDEX).openKeyCursor(IDBKeyRange.only(chapterId))

      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) return
        store.delete(cursor.primaryKey)
        cursor.continue()
      }
      request.onerror = () => fail(request.error)
      transaction.oncomplete = () => {
        if (settled) return
        settled = true
        database.close()
        resolve()
      }
      transaction.onerror = () => fail(transaction.error)
      transaction.onabort = () => fail(transaction.error)
    } catch (error) {
      fail(error)
    }
  })
}

export async function hasChapterPhoto(photoId: string, databaseName = DATABASE_NAME): Promise<boolean> {
  const database = await openChapterPhotoDatabase(databaseName)

  return new Promise((resolve, reject) => {
    let available = false
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      database.close()
      reject(normalizeStorageError(error))
    }

    try {
      const transaction = database.transaction(CHAPTER_PHOTO_STORE, 'readonly')
      const request = transaction.objectStore(CHAPTER_PHOTO_STORE).count(photoId)
      request.onsuccess = () => {
        available = request.result > 0
      }
      request.onerror = () => fail(request.error)
      transaction.oncomplete = () => {
        if (settled) return
        settled = true
        database.close()
        resolve(available)
      }
      transaction.onerror = () => fail(transaction.error)
      transaction.onabort = () => fail(transaction.error)
    } catch (error) {
      fail(error)
    }
  })
}

export function getChapterPhotoStorageMessage(error: unknown) {
  return error instanceof ChapterPhotoStorageError && error.code === 'quota'
    ? 'Não há espaço suficiente neste navegador para armazenar a foto.'
    : 'Não foi possível armazenar uma das fotos.'
}

export const CHAPTER_PHOTO_DATABASE = {
  name: DATABASE_NAME,
  version: DATABASE_VERSION,
  store: CHAPTER_PHOTO_STORE,
  chapterIndex: CHAPTER_PHOTO_CHAPTER_INDEX,
} as const
