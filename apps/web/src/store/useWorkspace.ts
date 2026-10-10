import { createContext, useContext } from 'react'
import type { Property } from '@/domain/types'
import type { AppState } from './app-state'
export interface WorkspaceContextValue {
  properties: Property[]
  active: Property | null
  busy: boolean
  error: string
  notice: string
  legacy: AppState | null
  showLegacy: boolean
  select: (id: string) => Promise<void>
  create: (name: string) => Promise<void>
  importLegacy: () => Promise<void>
  decide: (choice: 'skip' | 'later' | 'show') => void
  reload: () => void
  signOut: () => Promise<void>
}
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
export const useWorkspace = () => useContext(WorkspaceContext)
