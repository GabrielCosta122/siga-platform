import type { EntityId, ISODateString, ISODateTimeString } from './shared'

export interface MaintenanceRecord {
  id: EntityId
  title: string
  description: string
  type: string
  status: 'planned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  scheduledDate: ISODateString
  completedDate: ISODateString | null
  cost: number | null
  responsible: string
  supplier: string
  roomId: EntityId | null
  assetId: EntityId | null
  chapterId: EntityId | null
  documentIds: EntityId[]
  financialTransactionId: EntityId | null
  recurringRoutineId: EntityId | null
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

export interface MaintenanceRoutine {
  id: EntityId
  title: string
  frequency: string
  nextDate: ISODateString
  active: boolean
  roomId: EntityId | null
  assetId: EntityId | null
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}
