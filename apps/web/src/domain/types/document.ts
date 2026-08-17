import type { EntityId, ISODateString, ISODateTimeString } from './shared'

export interface HouseDocument {
  id: EntityId
  name: string
  description: string
  category: string
  fileType: string
  sizeInBytes: number
  date: ISODateString
  important: boolean
  folderId: EntityId | null
  chapterId: EntityId | null
  financialTransactionId: EntityId | null
  assetId: EntityId | null
  maintenanceId: EntityId | null
  mockUrl: string
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

export interface DocumentFolder {
  id: EntityId
  name: string
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}
