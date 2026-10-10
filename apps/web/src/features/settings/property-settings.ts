import type { Property } from '@/domain/types'

export const PROPERTY_SETTINGS_FORM_ID = 'settings-property-form'

export type PropertySettingsValues = {
  name: string
  identification: string
  type: string
  currentStage: string
  signatureDate: string
  expectedDeliveryDate: string
  address: string
  city: string
  state: string
  privateArea: string
  bedrooms: string
  parkingSpaces: string
  coverImage: string
}

export type PropertySettingsUpdate = Pick<Property,
  | 'name'
  | 'identification'
  | 'type'
  | 'currentStage'
  | 'signatureDate'
  | 'expectedDeliveryDate'
  | 'address'
  | 'city'
  | 'state'
  | 'privateArea'
  | 'bedrooms'
  | 'parkingSpaces'
  | 'coverImage'
>

export type PropertySettingsFormProps = {
  value: PropertySettingsValues
  onChange: (value: PropertySettingsValues) => void
  onSave: (changes: PropertySettingsUpdate) => void
  formId?: string
  disabled?: boolean
  showSubmitButton?: boolean
}

const safeString = (value: unknown) => typeof value === 'string' ? value : ''
const safeNumberString = (value: unknown) => {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN
  return Number.isFinite(parsed) && parsed >= 0 ? String(parsed) : ''
}

export function isValidPropertyDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function createPropertySettingsValues(property?: Partial<Property> | null): PropertySettingsValues {
  const signatureDate = safeString(property?.signatureDate)
  const expectedDeliveryDate = safeString(property?.expectedDeliveryDate)
  return {
    name: safeString(property?.name),
    identification: safeString(property?.identification),
    type: safeString(property?.type),
    currentStage: safeString(property?.currentStage),
    signatureDate: isValidPropertyDate(signatureDate) ? signatureDate : '',
    expectedDeliveryDate: isValidPropertyDate(expectedDeliveryDate) ? expectedDeliveryDate : '',
    address: safeString(property?.address),
    city: safeString(property?.city),
    state: safeString(property?.state),
    privateArea: safeString(property?.privateArea),
    bedrooms: safeNumberString(property?.bedrooms),
    parkingSpaces: safeNumberString(property?.parkingSpaces),
    coverImage: safeString(property?.coverImage),
  }
}
