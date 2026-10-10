import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useWorkspace } from '@/store/useWorkspace'

export function WorkspaceControls() {
  const workspace = useWorkspace()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  if (!workspace) return null
  const { active, legacy, busy } = workspace
  return <section aria-label="Imóvel ativo e dados locais" className="mx-auto max-w-[1200px] space-y-3 px-4 py-4 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-48 flex-1 text-xs text-muted-foreground">Imóvel ativo
        <select className="mt-1 block h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring" value={active?.id ?? ''} disabled={busy} onChange={event => void workspace.select(event.target.value)}>
          <option value="" disabled>{busy ? 'Carregando…' : 'Escolha um imóvel'}</option>
          {workspace.properties.map(property => <option key={property.id} value={property.id}>{property.name}{property.identification ? ` · ${property.identification}` : ''}</option>)}
        </select>
      </label>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => setCreating(current => !current)}>Novo imóvel</Button>
      {legacy ? <Button variant="ghost" size="sm" disabled={busy} onClick={() => { setConfirming(false); workspace.decide('show') }}>Dados antigos</Button> : null}
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => void workspace.signOut()}>Sair</Button>
    </div>
    {busy ? <p role="status" className="text-sm text-muted-foreground">Aguarde, preparando seus dados…</p> : null}
    {workspace.error ? <div role="alert" className="text-sm text-destructive">{workspace.error} <Button size="sm" variant="ghost" disabled={busy} onClick={workspace.reload}>Tentar novamente</Button></div> : null}
    {workspace.notice ? <p role="status" className="text-sm text-muted-foreground">{workspace.notice}</p> : null}
    {!active && !busy ? <p className="text-sm text-muted-foreground">Escolha um imóvel, crie uma nova história ou importe seus dados antigos.</p> : null}
    {creating ? <form className="flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); void workspace.create(name) }}>
      <label className="text-sm">Nome do imóvel<Input value={name} onChange={event => setName(event.target.value)} required disabled={busy} /></label>
      <Button type="submit" disabled={busy || !name.trim()}>Criar imóvel</Button><Button variant="ghost" type="button" disabled={busy} onClick={() => setCreating(false)}>Cancelar</Button>
    </form> : null}
    {legacy && workspace.showLegacy ? <Card><CardContent className="space-y-4 pt-6">
      <h2 className="font-display text-xl font-semibold">Trazer sua história para esta conta?</h2>
      <p className="text-sm">{legacy.property.name || 'Imóvel sem nome'}{legacy.property.identification ? ` · ${legacy.property.identification}` : ''}</p>
      <p className="text-sm text-muted-foreground">{legacy.chapters.length} capítulos · {legacy.financialTransactions.length} movimentações · {legacy.financialCommitments.length} compromissos · {legacy.documents.length} documentos · {legacy.rooms.length} ambientes · {legacy.assets.length} bens · {legacy.maintenanceRecords.length} manutenções · {legacy.maintenanceRoutines.length} rotinas</p>
      <p className="text-xs leading-relaxed text-muted-foreground">A importação cria um imóvel nesta conta e copia registros, preferências, categorias e arquivos disponíveis para um espaço separado neste navegador. Os dados antigos permanecem intactos. Repetir recupera o mesmo imóvel; não substitui edições posteriores.</p>
      {confirming ? <div className="space-y-3 rounded-md border p-4" role="group" aria-label="Confirmar importação">
        <p className="text-sm">Confirma que estes dados pertencem a você e deseja criar este imóvel em sua conta?</p>
        <div className="flex flex-wrap gap-2"><Button disabled={busy || !legacy.property.name.trim()} onClick={() => void workspace.importLegacy()}>Confirmar importação</Button><Button variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>Cancelar</Button></div>
        {!legacy.property.name.trim() ? <p role="alert" className="text-sm text-destructive">O imóvel antigo precisa de um nome. Preencha-o no modo local antes de importar.</p> : null}
      </div> : <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => setConfirming(true)}>Importar dados locais</Button>
        <Button variant="outline" disabled={busy} onClick={() => workspace.decide('skip')}>Começar sem importar</Button>
        <Button variant="ghost" disabled={busy} onClick={() => workspace.decide('later')}>Decidir depois</Button>
      </div>}
    </CardContent></Card> : null}
  </section>
}
