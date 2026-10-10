import type { ProfileRow } from '@/lib/supabase/database.types'

import { requireUserClient } from './auth.service'
import {
  SupabaseServiceError,
  toSupabaseServiceError,
} from './service-error'

export interface Profile {
  id: string
  displayName: string
  avatarUrl: string
  createdAt: string
  updatedAt: string
}

export interface UpdateMyProfileInput {
  displayName?: string
  avatarUrl?: string
}

const mapProfileRow = (row: ProfileRow): Profile => ({
  id: row.id,
  displayName: row.display_name ?? '',
  avatarUrl: row.avatar_url ?? '',
  createdAt: row.created_at ?? '',
  updatedAt: row.updated_at ?? row.created_at ?? '',
})

const emptyToNull = (value: string): string | null => {
  const normalized = value.trim()
  return normalized || null
}

export const getMyProfile = async (): Promise<Profile | null> => {
  try {
    const { user, client } = await requireUserClient()
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error
    return data ? mapProfileRow(data) : null
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível carregar o seu perfil.')
  }
}

export const updateMyProfile = async (
  input: UpdateMyProfileInput,
): Promise<Profile> => {
  if (input.displayName === undefined && input.avatarUrl === undefined) {
    throw new SupabaseServiceError('invalid-input', 'Informe ao menos uma alteração.')
  }

  try {
    const { user, client } = await requireUserClient()
    const { data, error } = await client
      .from('profiles')
      .update({
        ...(input.displayName !== undefined
          ? { display_name: emptyToNull(input.displayName) }
          : {}),
        ...(input.avatarUrl !== undefined ? { avatar_url: emptyToNull(input.avatarUrl) } : {}),
      })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) throw error
    return mapProfileRow(data)
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível atualizar o seu perfil.')
  }
}
