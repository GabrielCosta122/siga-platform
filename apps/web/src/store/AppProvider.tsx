import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { appReducer } from './app-reducer'
import { clearAppState, loadAppState, saveAppState } from './persistence'
import { createInitialAppState } from './initial-data'
import { AppStoreContext } from './useAppStore'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadAppState)
  useEffect(() => { saveAppState(state) }, [state])
  const resetAppData = useCallback(() => {
    clearAppState()
    dispatch({ type: 'RESET_STATE', payload: createInitialAppState() })
  }, [])
  const value = useMemo(() => ({ state, dispatch, resetAppData }), [state, resetAppData])
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}
