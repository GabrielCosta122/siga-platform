import type { EntityId, ISODateString, ISODateTimeString } from './shared'

export interface FinancialTransaction {
  id: EntityId
  title: string
  description: string
  amount: number
  date: ISODateString
  type: 'expense' | 'income'
  status: 'paid' | 'pending' | 'scheduled' | 'cancelled'
  category: string
  chapterId: EntityId | null
  documentIds: EntityId[]
  assetId: EntityId | null
  maintenanceId: EntityId | null
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

export interface FinancialCommitment {
  id: EntityId
  title: string
  amount: number
  dueDate: ISODateString
  status: 'pending' | 'scheduled' | 'future' | 'paid' | 'cancelled'
  category: string
  chapterId: EntityId | null
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}
