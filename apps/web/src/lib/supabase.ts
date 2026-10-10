import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './supabase/database.types'

export type DataMode = 'local' | 'supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

const isValidSupabaseUrl = (value: string): boolean => {
  if (!value) return false

  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

const isPrivilegedServerKey = (value: string): boolean => {
  if (value.startsWith('sb_secret_')) return true

  const payload = value.split('.')[1]
  if (!payload || typeof globalThis.atob !== 'function') return false

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (normalizedPayload.length % 4)) % 4)
    const decoded = JSON.parse(globalThis.atob(`${normalizedPayload}${padding}`)) as {
      role?: unknown
    }

    return decoded.role === 'service_role'
  } catch {
    return false
  }
}

export const isSupabaseConfigured =
  isValidSupabaseUrl(supabaseUrl)
  && Boolean(supabasePublishableKey)
  && !isPrivilegedServerKey(supabasePublishableKey)

export const dataMode: DataMode = isSupabaseConfigured ? 'supabase' : 'local'

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabasePublishableKey)
  : null

// Bind data requests to the captured JWT. A later login cannot change their user.
export const createSessionClient = (accessToken: string): SupabaseClient<Database> => {
  if (!isSupabaseConfigured) throw new Error('Supabase não configurado.')
  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
