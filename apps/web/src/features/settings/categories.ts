import { Tags, type LucideIcon } from 'lucide-react'
import type {
  AppCategoryScope,
  AppCategorySetting,
  AppCategoryTone,
  AppSettings,
} from '@/domain/types'
import {
  assetCategories,
  assetCategoryConfig,
} from '@/features/assets-inventory/presentation'
import {
  chapterCategories,
  chapterCategoryConfig,
} from '@/features/chapters/presentation'
import {
  documentCategoryConfig,
  type DocumentCategory,
} from '@/features/documents/presentation'
import {
  categoryIcons as financialCategoryIcons,
  financialCategories,
} from '@/features/financial/presentation'
import {
  maintenanceTypeConfig,
  maintenanceTypes,
} from '@/features/maintenance/presentation'

export type SettingsCategoryDefinition = Readonly<{
  defaultLabel: string
  icon: LucideIcon
  id: string
}>

export type SettingsCategoryGroup = Readonly<{
  categories: readonly SettingsCategoryDefinition[]
  label: string
  scope: AppCategoryScope
}>

const documentCategories = Object.keys(documentCategoryConfig) as DocumentCategory[]

export const categoryToneClasses = {
  primary: 'bg-primary/5 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning-foreground',
  accent: 'bg-accent text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  neutral: 'bg-muted text-muted-foreground',
} satisfies Record<AppCategoryTone, string>

export const settingsCategoryGroups = [
  {
    scope: 'chapter',
    label: 'Capítulos',
    categories: chapterCategories.map(id => ({
      id,
      defaultLabel: chapterCategoryConfig[id].label,
      icon: chapterCategoryConfig[id].icon,
    })),
  },
  {
    scope: 'financial',
    label: 'Financeiro',
    categories: financialCategories.map(id => ({
      id,
      defaultLabel: id,
      icon: financialCategoryIcons[id],
    })),
  },
  {
    scope: 'document',
    label: 'Documentos',
    categories: documentCategories.map(id => ({
      id,
      defaultLabel: documentCategoryConfig[id].label,
      icon: documentCategoryConfig[id].icon,
    })),
  },
  {
    scope: 'asset',
    label: 'Patrimônio e inventário',
    categories: assetCategories.map(id => ({
      id,
      defaultLabel: assetCategoryConfig[id].label,
      icon: assetCategoryConfig[id].icon,
    })),
  },
  {
    scope: 'maintenance',
    label: 'Manutenção',
    categories: maintenanceTypes.map(id => ({
      id,
      defaultLabel: maintenanceTypeConfig[id].label,
      icon: maintenanceTypeConfig[id].icon,
    })),
  },
] as const satisfies readonly SettingsCategoryGroup[]

export function getSettingsCategoryDefinition(scope: unknown, categoryId: unknown) {
  if (typeof scope !== 'string' || typeof categoryId !== 'string') return null
  const group = settingsCategoryGroups.find(item => item.scope === scope)
  return group?.categories.find(item => item.id === categoryId) ?? null
}

export function getSettingsCategoryPresentation(setting: AppCategorySetting) {
  const definition = getSettingsCategoryDefinition(setting.scope, setting.id)
  return {
    ...setting,
    label: setting.label.trim() || definition?.defaultLabel || setting.id || 'Categoria sem nome',
    icon: definition?.icon ?? Tags,
    contextClass: categoryToneClasses[setting.tone] ?? categoryToneClasses.neutral,
  }
}

export function getConfiguredCategoryOptions<T extends string>(
  settings: AppSettings | null | undefined,
  scope: AppCategoryScope,
  canonicalIds: readonly T[],
  getDefaultLabel: (id: T) => string,
  currentId?: string | null,
) {
  const configured = Array.isArray(settings?.categories) ? settings.categories : []
  const availableIds = canonicalIds.filter(id => {
    const setting = configured.find(item => item.scope === scope && item.id === id)
    return setting?.active !== false || id === currentId
  })
  const safeIds = availableIds.length ? availableIds : canonicalIds.slice(0, 1)
  return safeIds.map(id => {
    const setting = configured.find(item => item.scope === scope && item.id === id)
    return {
      id,
      label: setting?.label?.trim() || getDefaultLabel(id),
    }
  })
}

export function getConfiguredCategoryLabel(
  settings: AppSettings | null | undefined,
  scope: AppCategoryScope,
  id: unknown,
  fallback: string,
) {
  if (typeof id !== 'string') return fallback
  const category = Array.isArray(settings?.categories)
    ? settings.categories.find(item => item.scope === scope && item.id === id)
    : undefined
  return category?.label?.trim() || fallback
}
