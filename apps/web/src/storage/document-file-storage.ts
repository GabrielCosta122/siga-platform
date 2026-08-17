const DATABASE_NAME = 'siga-files'
const DATABASE_VERSION = 1
const DOCUMENT_STORE = 'documents'

export interface StoredDocumentFile {
  documentId: string
  blob: Blob
  name: string
  type: string
  size: number
  lastModified: number
}

export type DocumentFileStorageErrorCode = 'quota' | 'unavailable' | 'operation'

export class DocumentFileStorageError extends Error {
  code: DocumentFileStorageErrorCode
  constructor(code: DocumentFileStorageErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'DocumentFileStorageError'
    this.code = code
  }
}

function normalizeStorageError(error: unknown) {
  if (error instanceof DocumentFileStorageError) return error
  const name = typeof DOMException !== 'undefined' && error instanceof DOMException
    ? error.name
    : error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : ''
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
    return new DocumentFileStorageError('quota', 'IndexedDB quota exceeded.', { cause: error })
  }
  return new DocumentFileStorageError('operation', 'IndexedDB operation failed.', { cause: error })
}

function openDocumentDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new DocumentFileStorageError('unavailable', 'IndexedDB is not available.'))
  return new Promise((resolve, reject) => {
    let settled = false
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(DOCUMENT_STORE)) database.createObjectStore(DOCUMENT_STORE, { keyPath: 'documentId' })
    }
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
      reject(new DocumentFileStorageError('operation', 'IndexedDB upgrade was blocked.'))
    }
  })
}

export async function saveDocumentFile(documentId: string, file: File): Promise<void> {
  const database = await openDocumentDatabase()
  const storedFile: StoredDocumentFile = { documentId, blob: file.slice(0, file.size, file.type), name: file.name, type: file.type, size: file.size, lastModified: file.lastModified }
  return new Promise((resolve, reject) => {
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      database.close()
      reject(normalizeStorageError(error))
    }
    try {
      const transaction = database.transaction(DOCUMENT_STORE, 'readwrite')
      const request = transaction.objectStore(DOCUMENT_STORE).put(storedFile)
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

export async function getDocumentFile(documentId: string): Promise<StoredDocumentFile | null> {
  const database = await openDocumentDatabase()
  return new Promise((resolve, reject) => {
    let result: StoredDocumentFile | null = null
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      database.close()
      reject(normalizeStorageError(error))
    }
    try {
      const transaction = database.transaction(DOCUMENT_STORE, 'readonly')
      const request = transaction.objectStore(DOCUMENT_STORE).get(documentId)
      request.onsuccess = () => { result = (request.result as StoredDocumentFile | undefined) ?? null }
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

export async function deleteDocumentFile(documentId: string): Promise<void> {
  const database = await openDocumentDatabase()
  return new Promise((resolve, reject) => {
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      database.close()
      reject(normalizeStorageError(error))
    }
    try {
      const transaction = database.transaction(DOCUMENT_STORE, 'readwrite')
      const request = transaction.objectStore(DOCUMENT_STORE).delete(documentId)
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

export async function hasDocumentFile(documentId: string): Promise<boolean> {
  const database = await openDocumentDatabase()
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
      const transaction = database.transaction(DOCUMENT_STORE, 'readonly')
      const request = transaction.objectStore(DOCUMENT_STORE).count(documentId)
      request.onsuccess = () => { available = request.result > 0 }
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

export function getDocumentFileStorageMessage(error: unknown) {
  return error instanceof DocumentFileStorageError && error.code === 'quota'
    ? 'Não há espaço suficiente neste navegador para armazenar o arquivo.'
    : 'Não foi possível armazenar este arquivo.'
}

export const DOCUMENT_FILE_DATABASE = { name: DATABASE_NAME, version: DATABASE_VERSION, store: DOCUMENT_STORE } as const
