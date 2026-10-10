import type { Property } from '@/domain/types'
import { SupabaseServiceError } from '@/services/supabase/service-error'

import type {
  CreatePropertyWithOwnerArgs,
  PropertyRow,
  PropertyUpdate,
} from './database.types'

export type CreatePropertyInput = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>
export type UpdatePropertyInput = Partial<CreatePropertyInput>

const emptyToNull = (value: string): string | null => {
  const normalized = value.trim()
  return normalized || null
}

const parsePrivateArea = (value: string): number | null => {
  const withoutUnit = value.toLowerCase().replace(/m(?:²|2)/g, '').replace(/\s/g, '')
  if (!withoutUnit) return null

  const normalized = withoutUnit.includes(',')
    ? withoutUnit.replace(/\./g, '').replace(',', '.')
    : withoutUnit
  if (!normalized) return null

  const parsed = Number(normalized)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new SupabaseServiceError('invalid-input', 'Informe uma área privativa válida.')
  }
  return parsed
}

const formatPrivateArea = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return ''

  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} m²`
}

export const mapPropertyRowToDomain = (row: PropertyRow): Property => ({
  id: row.id,
  name: row.name,
  identification: row.identification ?? '',
  type: row.type ?? '',
  currentStage: row.current_stage ?? '',
  signatureDate: row.signature_date ?? '',
  expectedDeliveryDate: row.expected_delivery_date ?? '',
  address: row.address ?? '',
  city: row.city ?? '',
  state: row.state ?? '',
  privateArea: formatPrivateArea(row.private_area),
  bedrooms: row.bedrooms ?? 0,
  parkingSpaces: row.parking_spaces ?? 0,
  coverImage: row.cover_image_path ?? '',
  createdAt: row.created_at ?? '',
  updatedAt: row.updated_at ?? row.created_at ?? '',
})

export const mapPropertyDomainToInsert = (
  property: CreatePropertyInput,
): CreatePropertyWithOwnerArgs => ({
  p_name: property.name.trim(),
  p_identification: emptyToNull(property.identification),
  p_type: emptyToNull(property.type),
  p_current_stage: emptyToNull(property.currentStage),
  p_signature_date: emptyToNull(property.signatureDate),
  p_expected_delivery_date: emptyToNull(property.expectedDeliveryDate),
  p_address: emptyToNull(property.address),
  p_city: emptyToNull(property.city),
  p_state: emptyToNull(property.state),
  p_private_area: parsePrivateArea(property.privateArea),
  p_bedrooms: property.bedrooms,
  p_parking_spaces: property.parkingSpaces,
  p_cover_image_path: emptyToNull(property.coverImage),
})

export const mapPropertyDomainToUpdate = (
  property: UpdatePropertyInput,
): PropertyUpdate => {
  const update: PropertyUpdate = {}

  if (property.name !== undefined) update.name = property.name.trim()
  if (property.identification !== undefined) update.identification = emptyToNull(property.identification)
  if (property.type !== undefined) update.type = emptyToNull(property.type)
  if (property.currentStage !== undefined) update.current_stage = emptyToNull(property.currentStage)
  if (property.signatureDate !== undefined) update.signature_date = emptyToNull(property.signatureDate)
  if (property.expectedDeliveryDate !== undefined) update.expected_delivery_date = emptyToNull(property.expectedDeliveryDate)
  if (property.address !== undefined) update.address = emptyToNull(property.address)
  if (property.city !== undefined) update.city = emptyToNull(property.city)
  if (property.state !== undefined) update.state = emptyToNull(property.state)
  if (property.privateArea !== undefined) update.private_area = parsePrivateArea(property.privateArea)
  if (property.bedrooms !== undefined) update.bedrooms = property.bedrooms
  if (property.parkingSpaces !== undefined) update.parking_spaces = property.parkingSpaces
  if (property.coverImage !== undefined) update.cover_image_path = emptyToNull(property.coverImage)

  return update
}
