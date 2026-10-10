import type { AppCategoryScope, AppCategorySettingChanges, AppNotificationSettingsChanges, AppPreferences, Asset, Chapter, DocumentFolder, EntityId, FinancialCommitment, FinancialLoan, FinancialTransaction, HouseDocument, ISODateString, LoanInstallment, MaintenanceRecord, MaintenanceRoutine, Property, Room } from '@/domain/types'
import type { AppState } from './app-state'

export type AppAction =
  | { type: 'HYDRATE_STATE'; payload: AppState }
  | { type: 'RESET_STATE'; payload?: AppState }
  | { type: 'APPLY_REMOTE_PROPERTY'; payload: Property }
  | { type: 'UPDATE_PROPERTY'; payload: Partial<Property> }
  | { type: 'UPDATE_APP_PREFERENCES'; payload: Partial<AppPreferences> }
  | { type: 'UPDATE_NOTIFICATION_SETTINGS'; payload: AppNotificationSettingsChanges }
  | { type: 'UPDATE_CATEGORY_SETTING'; payload: { scope: AppCategoryScope; id: string; changes: AppCategorySettingChanges } }
  | { type: 'ADD_CHAPTER'; payload: Chapter }
  | { type: 'UPDATE_CHAPTER'; payload: { id: EntityId; changes: Partial<Chapter> } }
  | { type: 'DELETE_CHAPTER'; payload: EntityId }
  | { type: 'TOGGLE_CHAPTER_IMPORTANT'; payload: EntityId }
  | { type: 'ADD_FINANCIAL_TRANSACTION'; payload: FinancialTransaction }
  | { type: 'UPDATE_FINANCIAL_TRANSACTION'; payload: { id: EntityId; changes: Partial<FinancialTransaction> } }
  | { type: 'DELETE_FINANCIAL_TRANSACTION'; payload: EntityId }
  | { type: 'ADD_FINANCIAL_COMMITMENT'; payload: FinancialCommitment }
  | { type: 'ADD_FINANCIAL_COMMITMENTS'; payload: FinancialCommitment[] }
  | { type: 'UPDATE_FINANCIAL_COMMITMENT'; payload: { id: EntityId; changes: Partial<FinancialCommitment> } }
  | { type: 'DELETE_FINANCIAL_COMMITMENT'; payload: EntityId }
  | { type: 'DELETE_FINANCIAL_COMMITMENTS'; payload: EntityId[] }
  | { type: 'ADD_FINANCIAL_LOAN'; payload: FinancialLoan }
  | { type: 'ADD_FINANCIAL_LOAN_SCHEDULE'; payload: { loan: FinancialLoan; installments: LoanInstallment[]; commitments: FinancialCommitment[] } }
  | { type: 'UPDATE_FINANCIAL_LOAN'; payload: { id: EntityId; changes: Partial<FinancialLoan> } }
  | { type: 'DELETE_FINANCIAL_LOAN'; payload: EntityId }
  | { type: 'ADD_LOAN_INSTALLMENT'; payload: LoanInstallment }
  | { type: 'ADD_LOAN_INSTALLMENTS'; payload: LoanInstallment[] }
  | { type: 'UPDATE_LOAN_INSTALLMENT'; payload: { id: EntityId; changes: Partial<LoanInstallment>; commitment?: FinancialCommitment } }
  | { type: 'DELETE_LOAN_INSTALLMENT'; payload: EntityId }
  | { type: 'DELETE_LOAN_INSTALLMENTS'; payload: EntityId[] }
  | { type: 'REGISTER_LOAN_INSTALLMENT_PAYMENT'; payload: { installmentId: EntityId; transaction: FinancialTransaction; documentIds?: EntityId[] } }
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
