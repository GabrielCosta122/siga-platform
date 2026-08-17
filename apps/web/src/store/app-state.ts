import type { Asset, Chapter, DocumentFolder, FinancialCommitment, FinancialTransaction, HouseDocument, ISODateTimeString, MaintenanceRecord, MaintenanceRoutine, Property, Room } from '@/domain/types'

export interface AppSettings {
  locale: 'pt-BR'
  currency: 'BRL'
}

export interface AppState {
  schemaVersion: 1
  property: Property
  chapters: Chapter[]
  financialTransactions: FinancialTransaction[]
  financialCommitments: FinancialCommitment[]
  documents: HouseDocument[]
  documentFolders: DocumentFolder[]
  rooms: Room[]
  assets: Asset[]
  maintenanceRecords: MaintenanceRecord[]
  maintenanceRoutines: MaintenanceRoutine[]
  settings: AppSettings
  initializedAt: ISODateTimeString
  updatedAt: ISODateTimeString
}
