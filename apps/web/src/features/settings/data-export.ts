import type { AppState } from '@/store/app-state'

type JsonPrimitive = boolean | null | number | string
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type AppStateExport = Readonly<{
  filename: string
  json: string
}>

export type AppStateExportResult =
  | Readonly<{ filename: string; ok: true }>
  | Readonly<{ error: string; ok: false }>

const BLOB_OBJECT_URL_PATTERN = /^blob:(?:https?:\/\/|null\/)/i
const DATA_URL_PATTERN = /^data:(?:[a-z0-9.+-]+\/[a-z0-9.+-]+)?(?:;[^,]*)?,/i
const PHYSICAL_FILE_KEY_PATTERN = /^(?:blob|file|objecturl)$/i

function isPhysicalFile(value: unknown) {
  return (
    (typeof Blob !== 'undefined' && value instanceof Blob)
    || (typeof File !== 'undefined' && value instanceof File)
  )
}

function toJsonValue(value: unknown, ancestors: WeakSet<object>): JsonValue | undefined {
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return BLOB_OBJECT_URL_PATTERN.test(trimmed) || DATA_URL_PATTERN.test(trimmed) ? '' : value
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol') return undefined
  if (isPhysicalFile(value)) return undefined

  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString()
  if (typeof value !== 'object') return undefined
  if (ancestors.has(value)) return undefined

  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      return value.map(item => toJsonValue(item, ancestors) ?? null)
    }

    const result: Record<string, JsonValue> = {}
    for (const [key, item] of Object.entries(value)) {
      if (PHYSICAL_FILE_KEY_PATTERN.test(key)) continue
      const safeValue = toJsonValue(item, ancestors)
      if (safeValue !== undefined) result[key] = safeValue
    }
    return result
  } finally {
    ancestors.delete(value)
  }
}

function getLocalDateKey(date: Date) {
  if (Number.isNaN(date.getTime())) return 'backup'
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function serializeAppStateForExport(state: AppState) {
  const safeState = toJsonValue(state, new WeakSet())
  if (!safeState || Array.isArray(safeState) || typeof safeState !== 'object') {
    throw new Error('O estado atual não pôde ser preparado para exportação.')
  }
  return JSON.stringify(safeState, null, 2)
}

export function createAppStateExport(state: AppState, date = new Date()): AppStateExport {
  return {
    filename: `siga-backup-${getLocalDateKey(date)}.json`,
    json: serializeAppStateForExport(state),
  }
}

export function downloadAppStateExport(state: AppState, date = new Date()): AppStateExportResult {
  try {
    if (
      typeof document === 'undefined'
      || typeof Blob === 'undefined'
      || typeof URL === 'undefined'
      || typeof URL.createObjectURL !== 'function'
    ) {
      return { ok: false, error: 'O download não está disponível neste ambiente.' }
    }

    const backup = createAppStateExport(state, date)
    const objectUrl = URL.createObjectURL(new Blob([backup.json], { type: 'application/json;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = backup.filename
    anchor.hidden = true

    try {
      document.body.append(anchor)
      anchor.click()
    } finally {
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
    }

    return { ok: true, filename: backup.filename }
  } catch {
    return { ok: false, error: 'Não foi possível exportar os dados agora.' }
  }
}
