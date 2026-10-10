import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import { createSessionClient, supabase } from '@/lib/supabase'

import {
  requireSupabaseClient,
  SupabaseServiceError,
  toSupabaseServiceError,
} from './service-error'

export type { AuthChangeEvent, Session, User }

export interface AuthSessionResult {
  user: User | null
  session: Session | null
}

export type AuthStateChangeListener = (
  event: AuthChangeEvent,
  session: Session | null,
) => void

const validateCredentials = (email: string, password: string): string => {
  const normalizedEmail = email.trim()

  if (!normalizedEmail || !password) {
    throw new SupabaseServiceError(
      'invalid-input',
      'Informe e-mail e senha para continuar.',
    )
  }

  return normalizedEmail
}

export const signUpWithEmail = async (
  email: string,
  password: string,
): Promise<AuthSessionResult> => {
  const normalizedEmail = validateCredentials(email, password)

  try {
    const client = requireSupabaseClient()
    const { data, error } = await client.auth.signUp({ email: normalizedEmail, password })

    if (error) throw error
    return { user: data.user, session: data.session }
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível criar a conta agora.')
  }
}

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<AuthSessionResult> => {
  const normalizedEmail = validateCredentials(email, password)

  try {
    const client = requireSupabaseClient()
    const { data, error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) throw error
    return { user: data.user, session: data.session }
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível entrar agora.')
  }
}

export const signOut = async (): Promise<void> => {
  if (!supabase) return

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível sair da conta agora.')
  }
}

export const getCurrentSession = async (): Promise<Session | null> => {
  if (!supabase) return null

  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível recuperar a sessão atual.')
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  if (!supabase) return null

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!sessionData.session) return null

    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  } catch (error) {
    throw toSupabaseServiceError(error, 'Não foi possível recuperar o usuário atual.')
  }
}

export const subscribeToAuthChanges = (
  listener: AuthStateChangeListener,
): (() => void) => {
  if (!supabase) return () => undefined

  const { data } = supabase.auth.onAuthStateChange(listener)
  return () => data.subscription.unsubscribe()
}

// Configuration is checked before session lookup.
export const requireCurrentUser = async (): Promise<User> => {
  requireSupabaseClient()
  const user = await getCurrentUser()
  if (!user) throw new SupabaseServiceError('unauthenticated', 'Entre na sua conta para continuar.')
  return user
}

export const requireUserClient = async (expectedUserId?: string) => {
  const client = requireSupabaseClient()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  const session = data.session
  if (!session || expectedUserId && session.user.id !== expectedUserId) {
    throw new SupabaseServiceError('unauthenticated', 'A sessão mudou. Entre novamente para continuar.')
  }
  const verified = await client.auth.getUser(session.access_token)
  if (verified.error) throw verified.error
  if (!verified.data.user || verified.data.user.id !== session.user.id) {
    throw new SupabaseServiceError('unauthenticated', 'Não foi possível validar a sessão.')
  }
  return { user: verified.data.user, client: createSessionClient(session.access_token) }
}
