import type { Property } from '@/domain/types'
import {
  mapPropertyDomainToInsert,
  mapPropertyDomainToUpdate,
  mapPropertyRowToDomain,
  type CreatePropertyInput,
  type UpdatePropertyInput,
} from '@/lib/supabase/property.mapper'

import {
  SupabaseServiceError,
  toSupabaseServiceError,
} from './service-error'

import { requireUserClient } from './auth.service'

export type { CreatePropertyInput, UpdatePropertyInput }

const validatePropertyId = (id: string): string => {
  const normalizedId = id.trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedId)) {
    throw new SupabaseServiceError('invalid-input', 'Informe um imóvel válido.')
  }
  return normalizedId
}

const validatePropertyName = (name: string | undefined): void => {
  if (name !== undefined && !name.trim()) {
    throw new SupabaseServiceError('invalid-input', 'Informe um nome para o imóvel.')
  }
}

export const getMyProperties = async (expectedUserId?: string): Promise<Property[]> => {
  try {
    const { user, client } = await requireUserClient(expectedUserId)
    const { data, error } = await client
      .from('properties')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapPropertyRowToDomain)
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível carregar os seus imóveis.')
  }
}

export const getPropertyById = async (id: string, expectedUserId?: string): Promise<Property | null> => {
  const propertyId = validatePropertyId(id)

  try {
    const { user, client } = await requireUserClient(expectedUserId)
    const { data, error } = await client
      .from('properties')
      .select('*')
      .eq('owner_id', user.id)
      .eq('id', propertyId)
      .maybeSingle()

    if (error) throw error
    return data ? mapPropertyRowToDomain(data) : null
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível carregar este imóvel.')
  }
}

export const createProperty = async (input: CreatePropertyInput, expectedUserId?: string): Promise<Property> => {
  validatePropertyName(input.name)

  try {
    const { client } = await requireUserClient(expectedUserId)
    const { data, error } = await client.rpc(
      'create_property_with_owner',
      mapPropertyDomainToInsert(input),
    )

    if (error) throw error
    if (!data) {
      throw new SupabaseServiceError(
        'unknown',
        'O imóvel foi criado, mas não pôde ser carregado.',
      )
    }
    return mapPropertyRowToDomain(data)
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível criar o imóvel agora.')
  }
}

export const updateProperty = async (
  id: string,
  input: UpdatePropertyInput,
  expectedUserId?: string,
): Promise<Property> => {
  const propertyId = validatePropertyId(id)
  validatePropertyName(input.name)
  const update = mapPropertyDomainToUpdate(input)

  if (Object.keys(update).length === 0) {
    throw new SupabaseServiceError('invalid-input', 'Informe ao menos uma alteração.')
  }

  try {
    const { user, client } = await requireUserClient(expectedUserId)
    const { data, error } = await client
      .from('properties')
      .update(update)
      .eq('owner_id', user.id)
      .eq('id', propertyId)
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!data) {
      throw new SupabaseServiceError('not-found', 'Imóvel não encontrado.')
    }
    return mapPropertyRowToDomain(data)
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível atualizar este imóvel.')
  }
}

export const importLegacyProperty = async (sourceId: string, input: CreatePropertyInput, expectedUserId: string): Promise<Property> => {
  validatePropertyId(sourceId)
  validatePropertyName(input.name)
  try {
    const { client } = await requireUserClient(expectedUserId)
    const { data, error } = await client.rpc('import_legacy_property', {
      ...mapPropertyDomainToInsert(input), p_import_id: sourceId,
    })
    if (error) throw error
    if (!data) throw new SupabaseServiceError('unknown', 'A importação não retornou um imóvel.')
    return mapPropertyRowToDomain(data)
  } catch (error) { throw toSupabaseServiceError(error, 'Não foi possível importar o imóvel. Verifique se a migration 003 foi aplicada.') }
}
