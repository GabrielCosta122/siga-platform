import type { EntityId, ISODateString, ISODateTimeString, RecordStatus } from './shared'

export type AssetStatus =
  | 'in_use'
  | 'stored'
  | 'maintenance'
  | 'borrowed'
  | 'awaiting_delivery'
  | 'discarded'
  | RecordStatus

export interface Asset {
  id: EntityId
  name: string
  kind: 'property' | 'inventory'
  description: string
  roomId: EntityId | null
  category: string
  value: number
  status: AssetStatus
  brand: string
  model: string
  serialNumber: string
  purchaseDate: ISODateString | null
  installationDate: ISODateString | null
  warrantyEndDate: ISODateString | null
  supplier: string
  important: boolean
  image: string
  chapterId: EntityId | null
  documentIds: EntityId[]
  financialTransactionId: EntityId | null
  maintenanceIds: EntityId[]
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

export interface Room {
  id: EntityId
  name: string
  type: string
  active: boolean
  order: number
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}
