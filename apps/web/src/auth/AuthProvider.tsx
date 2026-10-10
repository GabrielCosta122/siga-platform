import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { browserStorage, clearSelection } from '@/store/scoped-persistence'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  getCurrentSession,
  signInWithEmail,
  signOut as signOutFromSupabase,
  signUpWithEmail,
  subscribeToAuthChanges,
  type AuthSessionResult,
  type Session,
} from '@/services/supabase/auth.service'
import { AuthContext, type AuthContextValue } from './useAuth'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const authRevisionRef = useRef(0)
  const sessionRevisionRef = useRef(0)
  const sessionUserRef = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const getSessionRevision = useCallback(() => sessionRevisionRef.current, [])

  const applySession = useCallback((nextSession: Session | null) => {
    const nextId = nextSession?.user.id ?? null
    if (sessionUserRef.current !== nextId) {
      const previousId = sessionUserRef.current
      sessionRevisionRef.current += 1
      sessionUserRef.current = nextId
      if (previousId) {
        try { clearSelection(browserStorage(), previousId) }
        catch { setError('Não foi possível limpar a seleção anterior neste navegador.') }
      }
    }
    setSession(nextSession)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    let isActive = true
    const bootstrapRevision = authRevisionRef.current

    const unsubscribe = subscribeToAuthChanges((_event, nextSession) => {
      if (!isActive) return

      authRevisionRef.current += 1
      setError(null)
      applySession(nextSession)
      setLoading(false)
    })

    void getCurrentSession()
      .then((currentSession) => {
        if (isActive && authRevisionRef.current === bootstrapRevision) {
          applySession(currentSession)
        }
      })
      .catch((cause: unknown) => {
        if (isActive && authRevisionRef.current === bootstrapRevision) setError(cause instanceof Error ? cause.message : 'Não foi possível recuperar a sessão.')
        if (isActive && authRevisionRef.current === bootstrapRevision) {
          applySession(null)
        }
      })
      .finally(() => {
        if (isActive) setLoading(false)
      })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [applySession])

  // Auth events are authoritative. Applying a completed login promise again
  // could restore a stale session after another tab has already changed accounts.
  const signIn = useCallback(
    (email: string, password: string): Promise<AuthSessionResult> => signInWithEmail(email, password), [],
  )
  const signUp = useCallback(
    (email: string, password: string): Promise<AuthSessionResult> => signUpWithEmail(email, password), [],
  )
  const signOut = useCallback((): Promise<void> => signOutFromSupabase(), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      error,
      getSessionRevision,
      isAuthenticated: session !== null,
      signIn,
      signUp,
      signOut,
    }),
    [loading, error, getSessionRevision, session, signIn, signOut, signUp],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
