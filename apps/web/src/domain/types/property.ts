import type { EntityId, ISODateString, ISODateTimeString } from './shared'

export interface Property {
  id: EntityId
  name: string
  identification: string
  type: string
  currentStage: string
  signatureDate: ISODateString
  expectedDeliveryDate: ISODateString
  address: string
  city: string
  state: string
  privateArea: string
  bedrooms: number
  parkingSpaces: number
  coverImage: string
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}
