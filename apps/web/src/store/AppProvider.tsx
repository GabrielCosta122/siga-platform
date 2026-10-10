import type { ReactNode } from 'react'
import { useAuth } from '@/auth/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { MainLayout } from '@/layouts/MainLayout'
import { SessionWorkspace } from './SessionWorkspace'
import { StateProvider } from './StateProvider'
import { AccountAccess } from '@/features/workspace/components/AccountAccess'

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  if (!isSupabaseConfigured) return <StateProvider>{children}</StateProvider>
  if (auth.loading) return <MainLayout title="SIGA"><p role="status" className="p-8">Recuperando sua sessão…</p></MainLayout>
  if (!auth.user) return <MainLayout title="Sua história"><AccountAccess /></MainLayout>
  return <SessionWorkspace key={`${auth.user.id}:${auth.getSessionRevision()}`} userId={auth.user.id}>{children}</SessionWorkspace>
}
