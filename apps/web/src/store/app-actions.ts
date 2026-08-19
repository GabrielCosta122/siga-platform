import type { Asset, Chapter, DocumentFolder, EntityId, FinancialCommitment, FinancialTransaction, HouseDocument, ISODateString, MaintenanceRecord, MaintenanceRoutine, Property, Room } from '@/domain/types'
import type { AppState } from './app-state'

export type AppAction =
  | { type: 'HYDRATE_STATE'; payload: AppState }
  | { type: 'RESET_STATE'; payload?: AppState }
  | { type: 'UPDATE_PROPERTY'; payload: Partial<Property> }
  | { type: 'ADD_CHAPTER'; payload: Chapter }
  | { type: 'UPDATE_CHAPTER'; payload: { id: EntityId; changes: Partial<Chapter> } }
  | { type: 'DELETE_CHAPTER'; payload: EntityId }
  | { type: 'TOGGLE_CHAPTER_IMPORTANT'; payload: EntityId }
  | { type: 'ADD_FINANCIAL_TRANSACTION'; payload: FinancialTransaction }
  | { type: 'UPDATE_FINANCIAL_TRANSACTION'; payload: { id: EntityId; changes: Partial<FinancialTransaction> } }
  | { type: 'DELETE_FINANCIAL_TRANSACTION'; payload: EntityId }
  | { type: 'ADD_FINANCIAL_COMMITMENT'; payload: FinancialCommitment }
  | { type: 'UPDATE_FINANCIAL_COMMITMENT'; payload: { id: EntityId; changes: Partial<FinancialCommitment> } }
  | { type: 'DELETE_FINANCIAL_COMMITMENT'; payload: EntityId }
  | { type: 'ADD_DOCUMENT'; payload: HouseDocument }
  | { type: 'UPDATE_DOCUMENT'; payload: { id: EntityId; changes: Partial<HouseDocument> } }
  | { type: 'DELETE_DOCUMENT'; payload: EntityId }
  | { type: 'ADD_DOCUMENT_FOLDER'; payload: DocumentFolder }
  | { type: 'ADD_ASSET'; payload: Asset }
  | { type: 'UPDATE_ASSET'; payload: { id: EntityId; changes: Partial<Asset> } }
  | { type: 'DELETE_ASSET'; payload: EntityId }
  | { type: 'ADD_MAINTENANCE'; payload: MaintenanceRecord }
  | { type: 'UPDATE_MAINTENANCE'; payload: { id: EntityId; changes: Partial<MaintenanceRecord> } }
  | { type: 'DELETE_MAINTENANCE'; payload: EntityId }
  | { type: 'COMPLETE_MAINTENANCE'; payload: { id: EntityId; completedDate?: ISODateString } }
  | { type: 'ADD_MAINTENANCE_ROUTINE'; payload: MaintenanceRoutine }
  | { type: 'UPDATE_MAINTENANCE_ROUTINE'; payload: { id: EntityId; changes: Partial<MaintenanceRoutine> } }
  | { type: 'DELETE_MAINTENANCE_ROUTINE'; payload: EntityId }
  | { type: 'ADD_ROOM'; payload: Room }
  | { type: 'UPDATE_ROOM'; payload: { id: EntityId; changes: Partial<Room> } }
  | { type: 'ARCHIVE_ROOM'; payload: EntityId }
