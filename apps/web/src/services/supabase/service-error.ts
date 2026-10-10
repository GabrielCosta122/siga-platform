import type { SupabaseClient } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase/database.types'

export type SupabaseServiceErrorCode =
  | 'not-configured'
  | 'invalid-input'
  | 'unauthenticated'
  | 'invalid-credentials'
  | 'permission-denied'
  | 'not-found'
  | 'conflict'
  | 'network'
  | 'unknown'

export class SupabaseServiceError extends Error {
  readonly code: SupabaseServiceErrorCode

  constructor(
    code: SupabaseServiceErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = 'SupabaseServiceError'
    this.code = code
  }
}

interface ErrorLike {
  code?: unknown
  name?: unknown
  status?: unknown
  message?: unknown
}

const getErrorLike = (error: unknown): ErrorLike =>
  typeof error === 'object' && error !== null ? error : {}

export const requireSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabase) {
    throw new SupabaseServiceError(
      'not-configured',
      'A conexão com o Supabase ainda não foi configurada.',
    )
  }

  return supabase
}

export const toSupabaseServiceError = (
  error: unknown,
  fallbackMessage = 'Não foi possível concluir a operação agora.',
): SupabaseServiceError => {
  if (error instanceof SupabaseServiceError) return error

  const details = getErrorLike(error)
  const code = typeof details.code === 'string' ? details.code : ''
  const name = typeof details.name === 'string' ? details.name : ''
  const status = typeof details.status === 'number' ? details.status : null

  if (
    error instanceof TypeError
    || name === 'AuthRetryableFetchError'
    || (typeof details.message === 'string' && /failed to fetch|fetch failed|networkerror|network request failed/i.test(details.message))
    || status === 0
    || (status !== null && status >= 500)
  ) {
    return new SupabaseServiceError(
      'network',
      'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
      { cause: error },
    )
  }

  if (code === 'invalid_credentials') {
    return new SupabaseServiceError(
      'invalid-credentials',
      'E-mail ou senha inválidos.',
      { cause: error },
    )
  }

  if (code === 'email_not_confirmed') {
    return new SupabaseServiceError(
      'unauthenticated',
      'Confirme seu e-mail antes de entrar.',
      { cause: error },
    )
  }

  if (
    code === 'weak_password'
    || code === 'validation_failed'
    || code === 'email_address_invalid'
    || code === '22023'
    || code === '22P02'
    || code === '23514'
  ) {
    return new SupabaseServiceError(
      'invalid-input',
      'Revise as informações fornecidas e tente novamente.',
      { cause: error },
    )
  }

  if (code === 'user_already_exists' || code === 'email_exists' || code === '23505') {
    return new SupabaseServiceError(
      'conflict',
      'Já existe um registro com essas informações.',
      { cause: error },
    )
  }

  if (code === 'PGRST116') {
    return new SupabaseServiceError('not-found', 'Registro não encontrado.', { cause: error })
  }

  if (code === 'session_not_found' || name === 'AuthSessionMissingError') {
    return new SupabaseServiceError('unauthenticated', 'Entre na sua conta para continuar.', { cause: error })
  }

  if (code === '28000' || code === '42501' || status === 401 || status === 403) {
    return new SupabaseServiceError(
      code === '28000' || status === 401 ? 'unauthenticated' : 'permission-denied',
      code === '28000' || status === 401
        ? 'Entre na sua conta para continuar.'
        : 'Você não tem permissão para realizar esta ação.',
      { cause: error },
    )
  }

  return new SupabaseServiceError('unknown', fallbackMessage, { cause: error })
}
