import { createDefaultAppSettings, type AppState } from './app-state'

const createEmptyProperty = (timestamp: string): AppState['property'] => ({
  id: 'property',
  name: '',
  identification: '',
  type: '',
  currentStage: '',
  signatureDate: '',
  expectedDeliveryDate: '',
  address: '',
  city: '',
  state: '',
  privateArea: '',
  bedrooms: 0,
  parkingSpaces: 0,
  coverImage: '',
  createdAt: timestamp,
  updatedAt: timestamp,
})

export function createInitialAppState(): AppState {
  const timestamp = new Date().toISOString()
  return {
    schemaVersion: 1,
    property: createEmptyProperty(timestamp),
    chapters: [],
    financialTransactions: [],
    financialCommitments: [],
    financialLoans: [],
    loanInstallments: [],
    documents: [],
    documentFolders: [],
    rooms: [],
    assets: [],
    maintenanceRecords: [],
    maintenanceRoutines: [],
    settings: createDefaultAppSettings(),
    initializedAt: timestamp,
    updatedAt: timestamp,
  }
}
