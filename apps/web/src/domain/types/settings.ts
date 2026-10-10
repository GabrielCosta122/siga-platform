export const APP_HOME_PAGES = ['sweet-home', 'house-book', 'financial'] as const
export type AppHomePage = (typeof APP_HOME_PAGES)[number]

export const APP_DATE_FORMATS = ['long', 'short'] as const
export type AppDateFormat = (typeof APP_DATE_FORMATS)[number]

export const APP_INTERFACE_DENSITIES = ['comfortable', 'compact'] as const
export type AppInterfaceDensity = (typeof APP_INTERFACE_DENSITIES)[number]

export const APP_THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type AppThemePreference = (typeof APP_THEME_PREFERENCES)[number]

export const APP_ACCENT_COLORS = ['wine'] as const
export type AppAccentColor = (typeof APP_ACCENT_COLORS)[number]

export interface AppPreferences {
  homePage: AppHomePage
  dateFormat: AppDateFormat
  density: AppInterfaceDensity
  theme: AppThemePreference
  accentColor: AppAccentColor
}

export const APP_NOTIFICATION_CHANNELS = ['inApp', 'email'] as const
export type AppNotificationChannel = (typeof APP_NOTIFICATION_CHANNELS)[number]

export const APP_NOTIFICATION_EVENTS = [
  'chapterCreated',
  'upcomingPayment',
  'overdueCommitment',
  'upcomingMaintenance',
  'overdueMaintenance',
  'expiringWarranty',
  'documentAdded',
] as const
export type AppNotificationEvent = (typeof APP_NOTIFICATION_EVENTS)[number]

export interface AppNotificationSettings {
  channels: Record<AppNotificationChannel, boolean>
  events: Record<AppNotificationEvent, boolean>
}

export const APP_CATEGORY_SCOPES = ['chapter', 'financial', 'asset', 'maintenance', 'document'] as const
export type AppCategoryScope = (typeof APP_CATEGORY_SCOPES)[number]

export const APP_CATEGORY_TONES = ['primary', 'success', 'warning', 'accent', 'secondary', 'neutral'] as const
export type AppCategoryTone = (typeof APP_CATEGORY_TONES)[number]

export interface AppCategorySetting {
  scope: AppCategoryScope
  id: string
  label: string
  tone: AppCategoryTone
  active: boolean
  order: number
}

export type AppCategorySettingChanges = Partial<Pick<AppCategorySetting, 'label' | 'tone' | 'active' | 'order'>>

export interface AppNotificationSettingsChanges {
  channels?: Partial<AppNotificationSettings['channels']>
  events?: Partial<AppNotificationSettings['events']>
}

export interface AppSettings {
  locale: 'pt-BR'
  currency: 'BRL'
  preferences: AppPreferences
  notifications: AppNotificationSettings
  categories: AppCategorySetting[]
}
