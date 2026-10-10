import type { AppSettings, Asset, Chapter, DocumentFolder, FinancialCommitment, FinancialLoan, FinancialTransaction, HouseDocument, ISODateTimeString, LoanInstallment, MaintenanceRecord, MaintenanceRoutine, Property, Room } from '@/domain/types'

export type { AppSettings } from '@/domain/types'

const defaultAppSettings: AppSettings = {
  locale: 'pt-BR',
  currency: 'BRL',
  preferences: {
    homePage: 'sweet-home',
    dateFormat: 'long',
    density: 'comfortable',
    theme: 'light',
    accentColor: 'wine',
  },
  notifications: {
    channels: { inApp: true, email: false },
    events: {
      chapterCreated: true,
      upcomingPayment: true,
      overdueCommitment: true,
      upcomingMaintenance: true,
      overdueMaintenance: true,
      expiringWarranty: true,
      documentAdded: true,
    },
  },
  categories: [
    { scope: 'chapter', id: 'construction', label: 'Construção', tone: 'primary', active: true, order: 0 },
    { scope: 'chapter', id: 'acquisition', label: 'Aquisição', tone: 'success', active: true, order: 1 },
    { scope: 'chapter', id: 'renovation', label: 'Reforma', tone: 'warning', active: true, order: 2 },
    { scope: 'chapter', id: 'furniture', label: 'Mobília', tone: 'accent', active: true, order: 3 },
    { scope: 'chapter', id: 'documentation', label: 'Documentação', tone: 'secondary', active: true, order: 4 },
    { scope: 'chapter', id: 'moment', label: 'Momento', tone: 'primary', active: true, order: 5 },
    { scope: 'financial', id: 'Aquisição', label: 'Aquisição', tone: 'success', active: true, order: 0 },
    { scope: 'financial', id: 'Construção', label: 'Construção', tone: 'primary', active: true, order: 1 },
    { scope: 'financial', id: 'Documentação', label: 'Documentação', tone: 'secondary', active: true, order: 2 },
    { scope: 'financial', id: 'Reforma', label: 'Reforma', tone: 'warning', active: true, order: 3 },
    { scope: 'financial', id: 'Mobília', label: 'Mobília', tone: 'accent', active: true, order: 4 },
    { scope: 'financial', id: 'Manutenção', label: 'Manutenção', tone: 'warning', active: true, order: 5 },
    { scope: 'financial', id: 'Outros', label: 'Outros', tone: 'neutral', active: true, order: 6 },
    { scope: 'asset', id: 'Móvel', label: 'Móvel', tone: 'accent', active: true, order: 0 },
    { scope: 'asset', id: 'Eletrodoméstico', label: 'Eletrodoméstico', tone: 'secondary', active: true, order: 1 },
    { scope: 'asset', id: 'Eletrônico', label: 'Eletrônico', tone: 'primary', active: true, order: 2 },
    { scope: 'asset', id: 'Marcenaria', label: 'Marcenaria', tone: 'accent', active: true, order: 3 },
    { scope: 'asset', id: 'Revestimento', label: 'Revestimento', tone: 'secondary', active: true, order: 4 },
    { scope: 'asset', id: 'Acabamento', label: 'Acabamento', tone: 'warning', active: true, order: 5 },
    { scope: 'asset', id: 'Equipamento instalado', label: 'Equipamento instalado', tone: 'primary', active: true, order: 6 },
    { scope: 'asset', id: 'Decoração', label: 'Decoração', tone: 'accent', active: true, order: 7 },
    { scope: 'asset', id: 'Outros', label: 'Outros', tone: 'neutral', active: true, order: 8 },
    { scope: 'maintenance', id: 'preventive', label: 'Preventiva', tone: 'success', active: true, order: 0 },
    { scope: 'maintenance', id: 'corrective', label: 'Corretiva', tone: 'warning', active: true, order: 1 },
    { scope: 'maintenance', id: 'inspection', label: 'Inspeção', tone: 'secondary', active: true, order: 2 },
    { scope: 'maintenance', id: 'installation', label: 'Instalação', tone: 'primary', active: true, order: 3 },
    { scope: 'maintenance', id: 'technical_cleaning', label: 'Limpeza técnica', tone: 'accent', active: true, order: 4 },
    { scope: 'document', id: 'contracts', label: 'Contratos', tone: 'primary', active: true, order: 0 },
    { scope: 'document', id: 'receipts', label: 'Comprovantes', tone: 'success', active: true, order: 1 },
    { scope: 'document', id: 'invoices', label: 'Notas fiscais', tone: 'warning', active: true, order: 2 },
    { scope: 'document', id: 'reports', label: 'Relatórios', tone: 'secondary', active: true, order: 3 },
    { scope: 'document', id: 'plans', label: 'Planta e projetos', tone: 'accent', active: true, order: 4 },
    { scope: 'document', id: 'other', label: 'Outros', tone: 'neutral', active: true, order: 5 },
  ],
}

export function createDefaultAppSettings(): AppSettings {
  return structuredClone(defaultAppSettings)
}

export interface AppState {
  schemaVersion: 1
  property: Property
  chapters: Chapter[]
  financialTransactions: FinancialTransaction[]
  financialCommitments: FinancialCommitment[]
  financialLoans: FinancialLoan[]
  loanInstallments: LoanInstallment[]
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
