import { createContext, useContext } from 'react'
import type {
  AuthSessionResult,
  Session,
  User,
} from '@/services/supabase/auth.service'

export interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  getSessionRevision: () => number
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<AuthSessionResult>
  signUp: (email: string, password: string) => Promise<AuthSessionResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.')
  }

  return context
}
