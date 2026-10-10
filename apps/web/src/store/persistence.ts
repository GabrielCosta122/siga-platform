import {
  APP_ACCENT_COLORS,
  APP_CATEGORY_SCOPES,
  APP_CATEGORY_TONES,
  APP_DATE_FORMATS,
  APP_HOME_PAGES,
  APP_INTERFACE_DENSITIES,
  APP_NOTIFICATION_CHANNELS,
  APP_NOTIFICATION_EVENTS,
  APP_THEME_PREFERENCES,
  type AppCategorySetting,
  type AppSettings,
  type Property,
} from '@/domain/types'
import { createDefaultAppSettings, type AppState } from './app-state'
import { createInitialAppState } from './initial-data'

export const APP_STORAGE_KEY = 'siga:app-state:v1'
const legacyArrayKeys = ['chapters', 'financialTransactions', 'financialCommitments', 'documents', 'documentFolders', 'rooms', 'assets', 'maintenanceRecords', 'maintenanceRoutines'] as const satisfies readonly (keyof AppState)[]
const loanArrayKeys = ['financialLoans', 'loanInstallments'] as const satisfies readonly (keyof AppState)[]
const propertyStringKeys = ['id', 'name', 'identification', 'type', 'currentStage', 'signatureDate', 'expectedDeliveryDate', 'address', 'city', 'state', 'privateArea', 'coverImage', 'createdAt', 'updatedAt'] as const satisfies readonly (keyof Property)[]
const propertyNumberKeys = ['bedrooms', 'parkingSpaces'] as const satisfies readonly (keyof Property)[]
const legacyDemoIds = {
  chapters: new Set<string>(['CAP-018', 'july-visit', 'june-payment', 'march-first-visit', 'feb-contract', 'feb-decision']),
  financialTransactions: new Set<string>(['entry', 'docs', 'work', 'materials']),
  financialCommitments: new Set<string>(['commitment-entry', 'commitment-work', 'commitment-financing']),
  documents: new Set<string>(['contract', 'receipt', 'report', 'floorplan', 'invoice', 'visit']),
  documentFolders: new Set<string>(['folder-property', 'folder-construction', 'folder-financial', 'folder-projects', 'folder-warranties']),
  rooms: new Set<string>(Array.from({ length: 8 }, (_, index) => `room-${index + 1}`)),
  assets: new Set<string>(['cabinets', 'counter', 'floor', 'ac', 'fridge', 'sofa', 'tv', 'table', 'chair']),
  maintenanceRecords: new Set<string>(['filters', 'cabinets-maintenance', 'hydraulic', 'install', 'routine-ac-next', 'routine-water-next', 'routine-fridge-next']),
  maintenanceRoutines: new Set<string>(['routine-ac', 'routine-water', 'routine-fridge']),
} as const
const legacyDemoPropertyId = 'property-reserva-palmeiras-1204'

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const isEntityRecord = (value: unknown) => isRecord(value) && typeof value.id === 'string'
const hydrateEntityArray = <T>(value: unknown): T[] => Array.isArray(value)
  ? structuredClone(value.filter(isEntityRecord)) as T[]
  : []
const isOneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && options.includes(value as T)

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try { return window.localStorage } catch { return null }
}

const hydrateProperty = (value: unknown, fallback: Property): Property => {
  if (!isRecord(value)) return structuredClone(fallback)
  const property = structuredClone(fallback)
  for (const key of propertyStringKeys) {
    if (typeof value[key] === 'string') property[key] = value[key]
  }
  for (const key of propertyNumberKeys) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key])) property[key] = value[key]
  }
  return property
}

const isCompleteProperty = (value: unknown): value is Property => isRecord(value)
  && propertyStringKeys.every(key => typeof value[key] === 'string')
  && propertyNumberKeys.every(key => typeof value[key] === 'number' && Number.isFinite(value[key]))

const stripEphemeralChapterPhotoSources = (chapters: AppState['chapters']) => chapters.map(chapter => {
  if (!Array.isArray(chapter.photos)) return chapter
  return {
    ...chapter,
    photos: chapter.photos.map(photo => typeof photo?.src === 'string' && /^(?:blob|data):/i.test(photo.src.trim())
      ? { ...photo, src: '' }
      : photo),
  }
})

const migrateLegacyDemoData = (state: AppState, fallback: AppState): AppState => {
  const chapters = state.chapters.filter(item => !legacyDemoIds.chapters.has(item.id))
  const financialTransactions = state.financialTransactions.filter(item => !legacyDemoIds.financialTransactions.has(item.id))
  const financialCommitments = state.financialCommitments.filter(item => !legacyDemoIds.financialCommitments.has(item.id))
  const documents = state.documents.filter(item => !legacyDemoIds.documents.has(item.id))
  const documentFolders = state.documentFolders.filter(item => !legacyDemoIds.documentFolders.has(item.id))
  const rooms = state.rooms.filter(item => !legacyDemoIds.rooms.has(item.id))
  const assets = state.assets.filter(item => !legacyDemoIds.assets.has(item.id))
  const maintenanceRecords = state.maintenanceRecords.filter(item => !legacyDemoIds.maintenanceRecords.has(item.id))
  const maintenanceRoutines = state.maintenanceRoutines.filter(item => !legacyDemoIds.maintenanceRoutines.has(item.id))

  const chapterIds = new Set(chapters.map(item => item.id))
  const transactionIds = new Set(financialTransactions.map(item => item.id))
  const documentIds = new Set(documents.map(item => item.id))
  const folderIds = new Set(documentFolders.map(item => item.id))
  const roomIds = new Set(rooms.map(item => item.id))
  const assetIds = new Set(assets.map(item => item.id))
  const maintenanceIds = new Set(maintenanceRecords.map(item => item.id))
  const routineIds = new Set(maintenanceRoutines.map(item => item.id))

  return {
    ...state,
    property: state.property.id === legacyDemoPropertyId ? fallback.property : state.property,
    chapters: chapters.map(item => ({
      ...item,
      documentIds: item.documentIds.filter(id => documentIds.has(id)),
      financialTransactionIds: item.financialTransactionIds.filter(id => transactionIds.has(id)),
      assetIds: item.assetIds.filter(id => assetIds.has(id)),
      maintenanceIds: item.maintenanceIds.filter(id => maintenanceIds.has(id)),
    })),
    financialTransactions: financialTransactions.map(item => ({
      ...item,
      chapterId: item.chapterId && chapterIds.has(item.chapterId) ? item.chapterId : null,
      documentIds: item.documentIds.filter(id => documentIds.has(id)),
      assetId: item.assetId && assetIds.has(item.assetId) ? item.assetId : null,
      maintenanceId: item.maintenanceId && maintenanceIds.has(item.maintenanceId) ? item.maintenanceId : null,
    })),
    financialCommitments: financialCommitments.map(item => ({
      ...item,
      chapterId: item.chapterId && chapterIds.has(item.chapterId) ? item.chapterId : null,
    })),
    documents: documents.map(item => ({
      ...item,
      folderId: item.folderId && folderIds.has(item.folderId) ? item.folderId : null,
      chapterId: item.chapterId && chapterIds.has(item.chapterId) ? item.chapterId : null,
      financialTransactionId: item.financialTransactionId && transactionIds.has(item.financialTransactionId) ? item.financialTransactionId : null,
      assetId: item.assetId && assetIds.has(item.assetId) ? item.assetId : null,
      maintenanceId: item.maintenanceId && maintenanceIds.has(item.maintenanceId) ? item.maintenanceId : null,
    })),
    documentFolders,
    rooms,
    assets: assets.map(item => ({
      ...item,
      roomId: item.roomId && roomIds.has(item.roomId) ? item.roomId : null,
      chapterId: item.chapterId && chapterIds.has(item.chapterId) ? item.chapterId : null,
      documentIds: item.documentIds.filter(id => documentIds.has(id)),
      financialTransactionId: item.financialTransactionId && transactionIds.has(item.financialTransactionId) ? item.financialTransactionId : null,
      maintenanceIds: item.maintenanceIds.filter(id => maintenanceIds.has(id)),
    })),
    maintenanceRecords: maintenanceRecords.map(item => ({
      ...item,
      roomId: item.roomId && roomIds.has(item.roomId) ? item.roomId : null,
      assetId: item.assetId && assetIds.has(item.assetId) ? item.assetId : null,
      chapterId: item.chapterId && chapterIds.has(item.chapterId) ? item.chapterId : null,
      documentIds: item.documentIds.filter(id => documentIds.has(id)),
      financialTransactionId: item.financialTransactionId && transactionIds.has(item.financialTransactionId) ? item.financialTransactionId : null,
      recurringRoutineId: item.recurringRoutineId && routineIds.has(item.recurringRoutineId) ? item.recurringRoutineId : null,
    })),
    maintenanceRoutines: maintenanceRoutines.map(item => ({
      ...item,
      roomId: item.roomId && roomIds.has(item.roomId) ? item.roomId : null,
      assetId: item.assetId && assetIds.has(item.assetId) ? item.assetId : null,
    })),
  }
}

const normalizeCategorySettings = (value: unknown, defaults: AppCategorySetting[]) => {
  const categories = new Map(defaults.map(item => [`${item.scope}:${item.id}`, { ...item }]))
  if (!Array.isArray(value)) return [...categories.values()]

  value.forEach((candidate, index) => {
    if (!isRecord(candidate) || !isOneOf(APP_CATEGORY_SCOPES, candidate.scope)) return
    if (typeof candidate.id !== 'string' || !candidate.id.trim()) return
    const id = candidate.id.trim()
    const key = `${candidate.scope}:${id}`
    const current = categories.get(key)
    const label = typeof candidate.label === 'string' && candidate.label.trim()
      ? candidate.label.trim()
      : current?.label ?? id
    const tone = isOneOf(APP_CATEGORY_TONES, candidate.tone)
      ? candidate.tone
      : current?.tone ?? 'neutral'
    const active = typeof candidate.active === 'boolean' ? candidate.active : current?.active ?? true
    const order = typeof candidate.order === 'number' && Number.isFinite(candidate.order) && candidate.order >= 0
      ? Math.floor(candidate.order)
      : current?.order ?? defaults.length + index
    categories.set(key, { scope: candidate.scope, id, label, tone, active, order })
  })

  return [...categories.values()]
}

export function hydrateAppSettings(value: unknown): AppSettings {
  const defaults = createDefaultAppSettings()
  if (!isRecord(value)) return defaults
  const preferences = isRecord(value.preferences) ? value.preferences : {}
  const notifications = isRecord(value.notifications) ? value.notifications : {}
  const channels = isRecord(notifications.channels) ? notifications.channels : {}
  const events = isRecord(notifications.events) ? notifications.events : {}

  return {
    locale: value.locale === 'pt-BR' ? value.locale : defaults.locale,
    currency: value.currency === 'BRL' ? value.currency : defaults.currency,
    preferences: {
      homePage: isOneOf(APP_HOME_PAGES, preferences.homePage) ? preferences.homePage : defaults.preferences.homePage,
      dateFormat: isOneOf(APP_DATE_FORMATS, preferences.dateFormat) ? preferences.dateFormat : defaults.preferences.dateFormat,
      density: isOneOf(APP_INTERFACE_DENSITIES, preferences.density) ? preferences.density : defaults.preferences.density,
      theme: isOneOf(APP_THEME_PREFERENCES, preferences.theme) ? preferences.theme : defaults.preferences.theme,
      accentColor: isOneOf(APP_ACCENT_COLORS, preferences.accentColor) ? preferences.accentColor : defaults.preferences.accentColor,
    },
    notifications: {
      channels: {
        inApp: typeof channels.inApp === 'boolean' ? channels.inApp : defaults.notifications.channels.inApp,
        email: typeof channels.email === 'boolean' ? channels.email : defaults.notifications.channels.email,
      },
      events: {
        chapterCreated: typeof events.chapterCreated === 'boolean' ? events.chapterCreated : defaults.notifications.events.chapterCreated,
        upcomingPayment: typeof events.upcomingPayment === 'boolean' ? events.upcomingPayment : defaults.notifications.events.upcomingPayment,
        overdueCommitment: typeof events.overdueCommitment === 'boolean' ? events.overdueCommitment : defaults.notifications.events.overdueCommitment,
        upcomingMaintenance: typeof events.upcomingMaintenance === 'boolean' ? events.upcomingMaintenance : defaults.notifications.events.upcomingMaintenance,
        overdueMaintenance: typeof events.overdueMaintenance === 'boolean' ? events.overdueMaintenance : defaults.notifications.events.overdueMaintenance,
        expiringWarranty: typeof events.expiringWarranty === 'boolean' ? events.expiringWarranty : defaults.notifications.events.expiringWarranty,
        documentAdded: typeof events.documentAdded === 'boolean' ? events.documentAdded : defaults.notifications.events.documentAdded,
      },
    },
    categories: normalizeCategorySettings(value.categories, defaults.categories),
  }
}

const isValidCategorySetting = (value: unknown): value is AppCategorySetting => isRecord(value)
  && isOneOf(APP_CATEGORY_SCOPES, value.scope)
  && typeof value.id === 'string'
  && typeof value.label === 'string'
  && isOneOf(APP_CATEGORY_TONES, value.tone)
  && typeof value.active === 'boolean'
  && typeof value.order === 'number'
  && Number.isFinite(value.order)

export const isValidAppSettings = (value: unknown): value is AppSettings => {
  if (!isRecord(value) || value.locale !== 'pt-BR' || value.currency !== 'BRL') return false
  if (!isRecord(value.preferences) || !isRecord(value.notifications) || !Array.isArray(value.categories)) return false
  const notifications = value.notifications
  if (!isOneOf(APP_HOME_PAGES, value.preferences.homePage)
    || !isOneOf(APP_DATE_FORMATS, value.preferences.dateFormat)
    || !isOneOf(APP_INTERFACE_DENSITIES, value.preferences.density)
    || !isOneOf(APP_THEME_PREFERENCES, value.preferences.theme)
    || !isOneOf(APP_ACCENT_COLORS, value.preferences.accentColor)) return false
  const channels = notifications.channels
  const events = notifications.events
  if (!isRecord(channels) || !isRecord(events)) return false
  return APP_NOTIFICATION_CHANNELS.every(channel => typeof channels[channel] === 'boolean')
    && APP_NOTIFICATION_EVENTS.every(event => typeof events[event] === 'boolean')
    && value.categories.every(isValidCategorySetting)
}

export const isHydratableAppState = (value: unknown) => {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.property)) return false
  return legacyArrayKeys.every(key => Array.isArray(value[key]) && value[key].every(isEntityRecord))
}

export function isValidAppState(value: unknown): value is AppState {
  if (!isHydratableAppState(value) || !isRecord(value)) return false
  return isCompleteProperty(value.property)
    && loanArrayKeys.every(key => Array.isArray(value[key]) && value[key].every(isEntityRecord))
    && isValidAppSettings(value.settings)
    && typeof value.initializedAt === 'string'
    && typeof value.updatedAt === 'string'
}

export function hydrateAppState(value: unknown, removeLegacyDemo = true): AppState {
  const fallback = createInitialAppState()
  if (!isHydratableAppState(value) || !isRecord(value)) return fallback
  const candidate = structuredClone(value)
  const hydrated: AppState = {
    ...candidate,
    schemaVersion: 1,
    property: hydrateProperty(candidate.property, fallback.property),
    chapters: stripEphemeralChapterPhotoSources(candidate.chapters as AppState['chapters']),
    financialLoans: hydrateEntityArray<AppState['financialLoans'][number]>(candidate.financialLoans),
    loanInstallments: hydrateEntityArray<AppState['loanInstallments'][number]>(candidate.loanInstallments),
    settings: hydrateAppSettings(candidate.settings),
    initializedAt: typeof candidate.initializedAt === 'string' ? candidate.initializedAt : fallback.initializedAt,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : fallback.updatedAt,
  } as AppState
  return removeLegacyDemo ? migrateLegacyDemoData(hydrated, fallback) : hydrated
}

export function loadAppState(): AppState {
  const storage = getStorage()
  if (!storage) return createInitialAppState()
  try {
    const stored = storage.getItem(APP_STORAGE_KEY)
    return stored ? hydrateAppState(JSON.parse(stored)) : createInitialAppState()
  } catch {
    return createInitialAppState()
  }
}

export function saveAppState(state: AppState): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(APP_STORAGE_KEY, JSON.stringify({ ...state, chapters: stripEphemeralChapterPhotoSources(state.chapters) }))
    return true
  } catch { return false }
}

export function clearAppState(): boolean {
  const storage = getStorage()
  if (!storage) return false
  try { storage.removeItem(APP_STORAGE_KEY); return true } catch { return false }
}
