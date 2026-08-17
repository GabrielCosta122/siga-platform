export type EntityId = string
export type ISODateString = string
export type ISODateTimeString = string
export type RecordStatus = 'draft' | 'active' | 'archived' | 'deleted'

export interface CategoryReference {
  id: EntityId
  name: string
}

export interface RelatedEntity {
  id: EntityId
  type: 'chapter' | 'financialTransaction' | 'document' | 'asset' | 'maintenance' | 'property' | 'room'
}

export interface AttachmentReference {
  id: EntityId
  name: string
  type: 'photo' | 'document'
}
