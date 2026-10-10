import type { Property } from '@/domain/types'
import { clearSelection, selectionKey } from './scoped-persistence'

export interface PropertyReader {
  list: () => Promise<Property[]>
  get: (id: string) => Promise<Property | null>
}
export async function resolveActiveProperty(storage: Storage, userId: string, reader: PropertyReader, assertCurrent: () => void) {
  const properties = await reader.list()
  assertCurrent()
  const saved = storage.getItem(selectionKey(userId))
  let active: Property | null = null
  if (saved) {
    // Do not trust a saved ID, even if it appears in a stale list.
    active = properties.some(property => property.id === saved) ? await reader.get(saved) : null
    assertCurrent()
    if (!active) clearSelection(storage, userId)
  }
  if (!active && properties.length === 1) {
    active = await reader.get(properties[0].id)
    assertCurrent()
  }
  if (active) storage.setItem(selectionKey(userId), active.id)
  return { properties, active }
}
export async function selectActiveProperty(storage: Storage, userId: string, id: string, reader: PropertyReader, assertCurrent: () => void): Promise<Property> {
  const property = await reader.get(id)
  assertCurrent()
  if (!property) throw new Error('Este imóvel não está disponível para sua conta.')
  storage.setItem(selectionKey(userId), property.id)
  return property
}
