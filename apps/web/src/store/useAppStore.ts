import { createContext, useContext } from 'react'
import type { Dispatch } from 'react'
import type { AppAction } from './app-actions'
import type { UpdatePropertyInput } from '@/lib/supabase/property.mapper'
import type { AppState } from './app-state'

export interface AppStoreContextValue { state: AppState; dispatch: Dispatch<AppAction>; resetAppData: () => void; saveProperty: (input: UpdatePropertyInput) => Promise<void>; fileDatabaseName: string; assertScopeCurrent: () => void }
export const AppStoreContext = createContext<AppStoreContextValue | null>(null)

export function useAppStore() {
  const context = useContext(AppStoreContext)
  if (!context) throw new Error('useAppStore deve ser usado dentro de um AppProvider.')
  return context
}
