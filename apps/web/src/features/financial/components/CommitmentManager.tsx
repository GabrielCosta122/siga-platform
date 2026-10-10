import { Edit3, Landmark, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Chapter, FinancialCommitment } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommitmentForm } from '@/features/financial/components/CommitmentForm'
import {
  formatFinancialDate,
  getCategoryLabel,
  getCommitmentSeriesPosition,
  getCommitmentStatusLabel,
  isValidISODate,
  normalizeCommitmentStatus,
} from '@/features/financial/presentation'
import { formatCurrencyBRL } from '@/lib/utils'
import { compareFinancialCommitmentsByDueDate } from '@/store/selectors'

type CommitmentManagerProps = {
  commitments: FinancialCommitment[]
  chapters: Chapter[]
  onClose: () => void
  onSave: (commitments: FinancialCommitment[], editing: boolean) => void
  onDelete: (ids: string[]) => void
  onOpenLoan: (loanId: string) => void
}

function CommitmentManager({ commitments, chapters, onClose, onSave, onDelete, onOpenLoan }: CommitmentManagerProps) {
  const [editing, setEditing] = useState<FinancialCommitment | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<FinancialCommitment | null>(null)
  const [period, setPeriod] = useState('Todos')
  const [category, setCategory] = useState('Todas')
  const [status, setStatus] = useState('Todos')
  const [editFocusRequest, setEditFocusRequest] = useState(0)
  const managerRef = useRef<HTMLDivElement>(null)
  const commitmentFormRef = useRef<HTMLDivElement>(null)
  const shouldFocusCommitmentForm = useRef(false)
  const deleteDialogRef = useRef<HTMLDivElement>(null)
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)

  const periodOptions = useMemo(() => Array.from(new Set(
    commitments
      .filter(item => isValidISODate(String(item.dueDate)))
      .map(item => item.dueDate.slice(0, 7)),
  )).sort(), [commitments])

  const categoryOptions = useMemo(() => Array.from(new Set(
    commitments.map(item => item.category).filter(item => typeof item === 'string' && item.trim()),
  )).sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b), 'pt-BR')), [commitments])

  const sorted = useMemo(() => [...commitments]
    .filter(item => period === 'Todos' || String(item.dueDate).startsWith(period))
    .filter(item => category === 'Todas' || item.category === category)
    .filter(item => status === 'Todos' || normalizeCommitmentStatus(item.status) === status)
    .sort(compareFinancialCommitmentsByDueDate), [category, commitments, period, status])

  useEffect(() => {
    if (!editing || !shouldFocusCommitmentForm.current) return

    shouldFocusCommitmentForm.current = false
    commitmentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    commitmentFormRef.current?.focus({ preventScroll: true })
  }, [editFocusRequest, editing])

  useEffect(() => {
    if (!deleting) return
    deleteDialogRef.current?.focus()
  }, [deleting])

  function save(commitmentItems: FinancialCommitment[]) {
    onSave(commitmentItems, !!editing)
    setCreating(false)
    setEditing(null)
  }

  function deleteCommitments(ids: string[]) {
    onDelete(ids)
    if (editing && ids.includes(editing.id)) setEditing(null)
    setDeleting(null)
    managerRef.current?.focus()
  }

  function cancelDelete() {
    const trigger = deleteTriggerRef.current
    setDeleting(null)
    if (trigger?.isConnected) trigger.focus()
  }

  function getCurrentAndFollowingIds(item: FinancialCommitment) {
    const position = getCommitmentSeriesPosition(item)
    if (!position) return [item.id]

    const ids = commitments
      .filter(candidate => candidate.seriesId === position.seriesId)
      .filter(candidate => Number.isInteger(candidate.installmentNumber) && Number(candidate.installmentNumber) >= position.installmentNumber)
      .map(candidate => candidate.id)

    return ids.includes(item.id) ? ids : [item.id, ...ids]
  }

  return (
    <Card ref={managerRef} tabIndex={-1} className="border-primary/20 shadow-book-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="font-display text-xl">Compromissos financeiros</CardTitle>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => { setCreating(true); setEditing(null); setDeleting(null) }}>
              <Plus aria-hidden="true" /> Novo compromisso
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {creating || editing ? (
          <div
            ref={commitmentFormRef}
            role="region"
            aria-label={editing ? `Editar compromisso: ${editing.title || 'Compromisso sem título'}` : 'Novo compromisso'}
            tabIndex={-1}
            className="scroll-mt-24 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <CommitmentForm
              key={editing ? `edit:${editing.id}` : 'new'}
              chapters={chapters}
              initial={editing ?? undefined}
              onCancel={() => { setCreating(false); setEditing(null) }}
              onSave={save}
            />
          </div>
        ) : null}

        {commitments.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period}
              onChange={event => setPeriod(event.target.value)}
              aria-label="Filtrar compromissos por período"
              className="h-8 rounded-lg border bg-card px-3 text-sm"
            >
              <option value="Todos">Todos os períodos</option>
              {periodOptions.map(month => (
                <option key={month} value={month}>
                  {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`))}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={event => setCategory(event.target.value)}
              aria-label="Filtrar compromissos por categoria"
              className="h-8 rounded-lg border bg-card px-3 text-sm"
            >
              <option value="Todas">Todas as categorias</option>
              {categoryOptions.map(item => <option key={item} value={item}>{getCategoryLabel(item)}</option>)}
            </select>
            <select
              value={status}
              onChange={event => setStatus(event.target.value)}
              aria-label="Filtrar compromissos por status"
              className="h-8 rounded-lg border bg-card px-3 text-sm"
            >
              <option value="Todos">Todos os status</option>
              <option value="pending">Próximo</option>
              <option value="scheduled">Agendado</option>
              <option value="future">Futuro</option>
              <option value="paid">Pago</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <span className="ml-auto text-xs text-muted-foreground">{sorted.length} de {commitments.length}</span>
          </div>
        ) : null}

        {sorted.length ? (
          <div className="divide-y rounded-lg border px-4">
            {sorted.map(item => {
              const seriesPosition = getCommitmentSeriesPosition(item)
              const isDeleting = deleting?.id === item.id
              const loanId = typeof item.loanId === 'string' && item.loanId.trim() ? item.loanId : null
              const isLoanCommitment = loanId !== null || (typeof item.loanInstallmentId === 'string' && !!item.loanInstallmentId.trim())

              return (
                <div key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title || 'Compromisso sem título'}</p>
                    {seriesPosition ? <p className="mt-0.5 text-xs font-medium text-primary">{seriesPosition.installmentNumber} de {seriesPosition.installmentCount}</p> : null}
                    <p className="mt-1 text-xs text-muted-foreground">{formatFinancialDate(item.dueDate)} · {getCategoryLabel(item.category)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrencyBRL(Number.isFinite(item.amount) ? item.amount : 0)}</p>
                  <Badge variant="outline">{getCommitmentStatusLabel(item.status)}</Badge>
                  {isLoanCommitment ? (
                    loanId ? <Button type="button" variant="ghost" size="sm" onClick={() => onOpenLoan(loanId)}><Landmark aria-hidden="true" /> Ver financiamento</Button>
                      : <span className="text-xs text-muted-foreground">Financiamento não disponível</span>
                  ) : <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={seriesPosition ? `Editar apenas esta parcela: ${item.title}` : `Editar ${item.title}`}
                      title={seriesPosition ? 'Editar apenas esta parcela' : 'Editar compromisso'}
                      onClick={() => {
                        shouldFocusCommitmentForm.current = true
                        setEditing(item)
                        setCreating(false)
                        setDeleting(null)
                        setEditFocusRequest(request => request + 1)
                      }}
                    >
                      <Edit3 aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      aria-label={`Excluir ${item.title}`}
                      onClick={event => {
                        deleteTriggerRef.current = event.currentTarget
                        setDeleting(item)
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </>}

                  {isDeleting ? (
                    <div
                      ref={deleteDialogRef}
                      className="w-full rounded-md bg-destructive/5 p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      role="alertdialog"
                      aria-modal="false"
                      aria-labelledby={`delete-commitment-${item.id}`}
                      aria-describedby={`delete-commitment-description-${item.id}`}
                      tabIndex={-1}
                      onKeyDown={event => {
                        if (event.key !== 'Escape') return
                        event.preventDefault()
                        cancelDelete()
                      }}
                    >
                      <p id={`delete-commitment-${item.id}`} className="font-medium">
                        {seriesPosition ? 'Excluir parcela da série?' : 'Excluir este compromisso?'}
                      </p>
                      <p id={`delete-commitment-description-${item.id}`} className="mt-1 text-xs text-muted-foreground">
                        {seriesPosition
                          ? 'Escolha se deseja remover apenas esta parcela ou também as parcelas seguintes. Capítulos relacionados não serão excluídos.'
                          : 'O compromisso será removido sem excluir capítulos relacionados.'}
                      </p>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={cancelDelete}>Cancelar</Button>
                        <Button type="button" variant={seriesPosition ? 'outline' : 'destructive'} size="sm" className={seriesPosition ? 'text-destructive' : undefined} onClick={() => deleteCommitments([item.id])}>
                          {seriesPosition ? 'Excluir apenas esta parcela' : 'Excluir compromisso'}
                        </Button>
                        {seriesPosition ? (
                          <Button type="button" variant="destructive" size="sm" onClick={() => deleteCommitments(getCurrentAndFollowingIds(item))}>
                            Excluir esta e as próximas
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : commitments.length ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            <p>Nenhum compromisso encontrado.</p>
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => { setPeriod('Todos'); setCategory('Todas'); setStatus('Todos') }}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">Nenhum compromisso registrado.</p>
        )}
      </CardContent>
    </Card>
  )
}

export { CommitmentManager }
