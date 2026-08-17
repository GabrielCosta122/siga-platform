import type { EntityId, ISODateString, ISODateTimeString } from './shared'

export type ChapterCategory = 'construction' | 'acquisition' | 'renovation' | 'furniture' | 'documentation' | 'moment'
export type ChapterImpact = 'financial' | 'property' | 'inventory' | 'documentation' | 'schedule' | 'maintenance' | 'unrelated'
export type ChapterStatus = 'draft' | 'published'

export interface ChapterPhoto {
  id: EntityId
  name: string
  src: string
  alt: string
  caption: string
  isCover: boolean
  createdAt: ISODateTimeString
}

export interface Chapter {
  id: EntityId
  title: string
  content: string
  category: ChapterCategory
  date: ISODateString
  status: ChapterStatus
  important: boolean
  author: string
  impacts: ChapterImpact[]
  photos: ChapterPhoto[]
  documentIds: EntityId[]
  financialTransactionIds: EntityId[]
  assetIds: EntityId[]
  maintenanceIds: EntityId[]
  coverPhotoId: EntityId | null
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}
