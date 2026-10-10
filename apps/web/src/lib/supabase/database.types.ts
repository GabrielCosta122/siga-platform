/**
 * Temporary, hand-written subset of the Supabase schema used by the first
 * integration foundation (SQL 001 + 002 + 003). Replace this file with generated database types
 * (`supabase gen types typescript`) after the remote project is provisioned.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProfileRow = {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ProfileInsert = {
  id: string
  display_name?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

export type ProfileUpdate = {
  display_name?: string | null
  avatar_url?: string | null
  updated_at?: string
}

export type PropertyRow = {
  id: string
  name: string
  identification: string | null
  type: string | null
  current_stage: string | null
  signature_date: string | null
  expected_delivery_date: string | null
  address: string | null
  city: string | null
  state: string | null
  private_area: number | null
  bedrooms: number | null
  parking_spaces: number | null
  cover_image_path: string | null
  legacy_import_id: string | null
  owner_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export type PropertyInsert = {
  id?: string
  name: string
  identification?: string | null
  type?: string | null
  current_stage?: string | null
  signature_date?: string | null
  expected_delivery_date?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  private_area?: number | null
  bedrooms?: number | null
  parking_spaces?: number | null
  cover_image_path?: string | null
  legacy_import_id?: string | null
  owner_id?: string
  created_by: string
  created_at?: string
  updated_at?: string
}

export type PropertyUpdate = {
  name?: string
  identification?: string | null
  type?: string | null
  current_stage?: string | null
  signature_date?: string | null
  expected_delivery_date?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  private_area?: number | null
  bedrooms?: number | null
  parking_spaces?: number | null
  cover_image_path?: string | null
  updated_at?: string
}

export type FinanceSyncRow = { property_id: string; revision: number; updated_at: string }
export type FinancialLoanRow = {
  id: string; property_id: string; title: string; institution: string; contract_number: string | null
  start_date: string | null; first_due_date: string; expected_end_date: string | null
  original_amount: number | null; financed_amount: number | null; initial_balance: number | null
  current_balance: number | null; installment_count: number; interest_rate_annual: number | null
  amortization_system: 'SAC' | 'PRICE' | 'OTHER' | 'UNKNOWN'
  status: 'active' | 'paid' | 'suspended' | 'cancelled'; notes: string; created_at: string; updated_at: string
}
export type LoanInstallmentRow = {
  id: string; property_id: string; loan_id: string; installment_number: number; due_date: string
  expected_amount: number | null; expected_principal: number | null; expected_interest: number | null
  expected_insurance: number | null; expected_fees: number | null; paid_amount: number | null
  paid_date: string | null; balance_before: number | null; balance_after: number | null
  status: 'pending' | 'upcoming' | 'paid' | 'overdue' | 'cancelled'
  financial_transaction_id: string | null; document_ids: string[]; source: 'manual' | 'caixa_import'
  created_at: string; updated_at: string
}
export type FinancialCommitmentRow = {
  id: string; property_id: string; title: string; amount: number; due_date: string
  status: 'pending' | 'scheduled' | 'future' | 'paid' | 'cancelled'; category: string
  chapter_id: string | null; series_id: string | null; installment_number: number | null
  installment_count: number | null; loan_id: string | null; loan_installment_id: string | null
  created_at: string; updated_at: string
}
export type FinancialTransactionRow = {
  id: string; property_id: string; title: string; description: string; amount: number; transaction_date: string
  type: 'expense' | 'income'; status: 'paid' | 'pending' | 'scheduled' | 'cancelled'; category: string
  chapter_id: string | null; document_ids: string[]; asset_id: string | null; maintenance_id: string | null
  created_at: string; updated_at: string
}

export type PropertyMemberRole = 'owner' | 'editor' | 'viewer'

export type PropertyMemberRow = {
  property_id: string
  user_id: string
  role: PropertyMemberRole
  created_at: string
}

export type PropertyMemberInsert = {
  property_id: string
  user_id: string
  role?: PropertyMemberRole
  created_at?: string
}

export type PropertyMemberUpdate = {
  role?: PropertyMemberRole
}

export type CreatePropertyWithOwnerArgs = {
  p_name: string
  p_identification: string | null
  p_type: string | null
  p_current_stage: string | null
  p_signature_date: string | null
  p_expected_delivery_date: string | null
  p_address: string | null
  p_city: string | null
  p_state: string | null
  p_private_area: number | null
  p_bedrooms: number | null
  p_parking_spaces: number | null
  p_cover_image_path: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: ProfileInsert
        Update: ProfileUpdate
        Relationships: []
      }
      properties: {
        Row: PropertyRow
        Insert: PropertyInsert
        Update: PropertyUpdate
        Relationships: []
      }
      property_finance_sync: {
        Row: FinanceSyncRow
        Insert: Partial<FinanceSyncRow> & Pick<FinanceSyncRow, 'property_id'>
        Update: Partial<FinanceSyncRow>
        Relationships: []
      }
      financial_loans: {
        Row: FinancialLoanRow
        Insert: FinancialLoanRow
        Update: Partial<FinancialLoanRow>
        Relationships: []
      }
      loan_installments: {
        Row: LoanInstallmentRow
        Insert: LoanInstallmentRow
        Update: Partial<LoanInstallmentRow>
        Relationships: []
      }
      financial_commitments: {
        Row: FinancialCommitmentRow
        Insert: FinancialCommitmentRow
        Update: Partial<FinancialCommitmentRow>
        Relationships: []
      }
      financial_transactions: {
        Row: FinancialTransactionRow
        Insert: FinancialTransactionRow
        Update: Partial<FinancialTransactionRow>
        Relationships: []
      }
      property_members: {
        Row: PropertyMemberRow
        Insert: PropertyMemberInsert
        Update: PropertyMemberUpdate
        Relationships: [
          {
            foreignKeyName: 'property_members_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      replace_property_financial_snapshot: {
        Args: {
          p_property_id: string
          p_loans: Json
          p_installments: Json
          p_commitments: Json
          p_transactions: Json
        }
        Returns: number
      }
      import_legacy_property: {
        Args: CreatePropertyWithOwnerArgs & { p_import_id: string }
        Returns: PropertyRow
      }
      create_property_with_owner: {
        Args: CreatePropertyWithOwnerArgs
        Returns: PropertyRow
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type PublicSchema = Database['public']
export type TableName = keyof PublicSchema['Tables']
export type TableRow<Name extends TableName> = PublicSchema['Tables'][Name]['Row']
export type TableInsert<Name extends TableName> = PublicSchema['Tables'][Name]['Insert']
export type TableUpdate<Name extends TableName> = PublicSchema['Tables'][Name]['Update']
