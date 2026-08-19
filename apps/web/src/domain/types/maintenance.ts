import type { EntityId, ISODateString, ISODateTimeString } from './shared'

export type MaintenanceType =
  | 'preventive'
  | 'corrective'
  | 'inspection'
  | 'installation'
  | 'technical_cleaning'

export type MaintenanceStatus =
  | 'planned'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type MaintenancePriority = 'low' | 'medium' | 'high'

export type StandardMaintenanceFrequency =
  | 'monthly'
  | 'every_90_days'
  | 'semiannual'
  | 'annual'

export type MaintenanceFrequency = StandardMaintenanceFrequency | (string & {})

export interface MaintenanceRecord {
  id: EntityId
  title: string
  description: string
  type: MaintenanceType
  status: MaintenanceStatus
  priority: MaintenancePriority
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
  frequency: MaintenanceFrequency
  nextDate: ISODateString
  active: boolean
  roomId: EntityId | null
  assetId: EntityId | null
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}
