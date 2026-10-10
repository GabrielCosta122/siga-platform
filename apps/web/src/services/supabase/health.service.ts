import { dataMode, isSupabaseConfigured, supabase, type DataMode } from '@/lib/supabase'

import { toSupabaseServiceError } from './service-error'

export interface SupabaseConnectionStatus {
  ok: boolean
  configured: boolean
  mode: DataMode
  checkedAt: string
  message: string
}

export const checkSupabaseConnection = async (): Promise<SupabaseConnectionStatus> => {
  const checkedAt = new Date().toISOString()

  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: false,
      configured: false,
      mode: 'local',
      checkedAt,
      message: 'Supabase não configurado. O SIGA continua no modo local.',
    }
  }

  try {
    const { error } = await supabase.auth.getSession()

    if (error) throw error

    return {
      ok: true,
      configured: true,
      mode: dataMode,
      checkedAt,
      message: 'Cliente Supabase configurado e disponível.',
    }
  } catch (error) {
    const serviceError = toSupabaseServiceError(
      error,
      'Não foi possível validar a conexão com o Supabase.',
    )

    return {
      ok: false,
      configured: true,
      mode: dataMode,
      checkedAt,
      message: serviceError.message,
    }
  }
}
