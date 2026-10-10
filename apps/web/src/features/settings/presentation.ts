import type { AppState } from '@/store/app-state'

// Mantida em um único ponto e alinhada à versão declarada em apps/web/package.json.
export const SIGA_PROTOTYPE_VERSION = '0.0.0'

export type SettingsDataSummary = Readonly<{
  assets: number
  chapters: number
  documents: number
  maintenance: number
  photos: number
}>

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' ? value as Record<string, unknown> : null

const getArray = (value: unknown) => Array.isArray(value) ? value : []

export function getSettingsDataSummary(state: AppState | null | undefined): SettingsDataSummary {
  const safeState = asRecord(state)
  const chapters = getArray(safeState?.chapters)
  return {
    chapters: chapters.length,
    documents: getArray(safeState?.documents).length,
    assets: getArray(safeState?.assets).length,
    maintenance: getArray(safeState?.maintenanceRecords).length,
    photos: chapters.reduce((total, chapter) => {
      const safeChapter = asRecord(chapter)
      return total + getArray(safeChapter?.photos).length
    }, 0),
  }
}

export function formatSettingsUpdatedAt(value: unknown) {
  if (typeof value !== 'string') return 'atualização não disponível'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'atualização não disponível'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date).replace('.', '')
}

export function getSettingsSchemaVersion(state: AppState | null | undefined) {
  const version = asRecord(state)?.schemaVersion
  return typeof version === 'number' && Number.isInteger(version) && version > 0
    ? String(version)
    : 'indisponível'
}
