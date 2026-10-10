import { useState, type FormEvent } from 'react'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export function AccountAccess() {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent, register = false) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setMessage('')
    try {
      const result = register ? await auth.signUp(email, password) : await auth.signIn(email, password)
      if (!result.session) setMessage('Confira seu e-mail para confirmar a conta e depois entre.')
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Não foi possível entrar.') }
    finally { setBusy(false) }
  }
  return <section className="mx-auto max-w-lg space-y-5 px-6 py-12">
    <h1 className="font-display text-3xl font-semibold">Uma história só sua</h1>
    <p className="text-sm text-muted-foreground">Entre para escolher seus imóveis. Os dados antigos deste navegador só serão importados com sua confirmação.</p>
    <Card><CardContent className="pt-6"><form className="space-y-4" onSubmit={event => void submit(event)}>
      <label className="block text-sm">E-mail<Input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></label>
      <label className="block text-sm">Senha<Input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></label>
      <div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? 'Aguarde…' : 'Entrar'}</Button><Button type="button" variant="outline" disabled={busy} onClick={event => { const form = event.currentTarget.form; if (form?.reportValidity()) void submit(event, true) }}>Criar conta</Button></div>
      {message || auth.error ? <p role="alert" className="text-sm text-destructive">{message || auth.error}</p> : null}
    </form></CardContent></Card>
  </section>
}
