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
