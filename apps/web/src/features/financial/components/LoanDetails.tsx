import { useEffect, useRef, useState } from 'react'
import { Building2, CalendarDays, CheckCircle2, Edit3, FileText, Landmark, ReceiptText, Trash2, WalletCards } from 'lucide-react'
import type { FinancialLoan, FinancialTransaction, LoanInstallment } from '@/domain/types'
import type { AppState } from '@/store/app-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FinancialSummaryCard } from '@/features/financial/components/FinancialSummaryCard'
import { LoanForm } from '@/features/financial/components/LoanForm'
import { LoanInstallmentForm, type EditableInstallmentChanges } from '@/features/financial/components/LoanInstallmentForm'
import { LoanPaymentForm } from '@/features/financial/components/LoanPaymentForm'
import { formatFinancialDate, isValidISODate } from '@/features/financial/presentation'
import { formatCurrencyBRL } from '@/lib/utils'
import {
  getLoanById,
  getLoanCurrentBalance,
  getLoanEvolution,
  getLoanInstallments,
  getLoanInstallmentPaidAmount,
  getLoanInstallmentStatus,
  getLoanProgress,
  getLoanTotalPaid,
  getLoanTotalRemaining,
  getNextLoanInstallment,
} from '@/store/selectors'

type LoanDetailsMode =
  | { kind: 'view' }
  | { kind: 'edit-loan' }
  | { kind: 'edit-installment'; installmentId: string }
  | { kind: 'payment'; installmentId: string }

type LoanDetailsProps = {
  state: AppState
  loanId: string
  onClose: () => void
  onUpdateLoan: (loanId: string, changes: Partial<FinancialLoan>) => void
  onUpdateInstallment: (installmentId: string, changes: EditableInstallmentChanges) => void
  onRegisterPayment: (installmentId: string, transaction: FinancialTransaction, documentIds: string[]) => void
  onDelete: (loanId: string) => void
}

const loanStatusLabels: Record<FinancialLoan['status'], string> = {
  active: 'Ativo',
  paid: 'Quitado',
  suspended: 'Suspenso',
  cancelled: 'Cancelado',
}

const installmentStatusLabels: Record<LoanInstallment['status'], string> = {
  pending: 'Pendente',
  upcoming: 'Próximo',
  paid: 'Pago',
  overdue: 'Atrasado',
  cancelled: 'Cancelado',
}

const installmentStatusVariants: Record<LoanInstallment['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  upcoming: 'default',
  paid: 'secondary',
  overdue: 'destructive',
  cancelled: 'outline',
}

const safeAmount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0
  ? value
  : null

const formatOptionalAmount = (value: unknown) => {
  const amount = safeAmount(value)
  return amount === null ? 'Não informado' : formatCurrencyBRL(amount)
}

const getLoanStatusLabel = (value: unknown) => typeof value === 'string' && value in loanStatusLabels
  ? loanStatusLabels[value as FinancialLoan['status']]
  : 'Status indisponível'

const getAmortizationLabel = (value: unknown) => {
  if (value === 'SAC' || value === 'PRICE') return value
  if (value === 'OTHER') return 'Outro sistema'
  return 'Sistema não informado'
}

const getSafeText = (value: unknown, fallback: string) => typeof value === 'string' && value.trim()
  ? value.trim()
  : fallback

const getSafePositiveInteger = (value: unknown, fallback = 0) => Number.isInteger(value) && Number(value) > 0
  ? Number(value)
  : fallback

function LoanDetails({
  state,
  loanId,
  onClose,
  onUpdateLoan,
  onUpdateInstallment,
  onRegisterPayment,
  onDelete,
}: LoanDetailsProps) {
  const loan = getLoanById(state, loanId)
  const [mode, setMode] = useState<LoanDetailsMode>({ kind: 'view' })
  const [period, setPeriod] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [visibleCount, setVisibleCount] = useState(24)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)
  const actionPanelRef = useRef<HTMLDivElement>(null)
  const shouldFocusActionPanel = useRef(false)
  const deleteDialogRef = useRef<HTMLDivElement>(null)
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)
  const deleteLock = useRef(false)

  const installments = getLoanInstallments(state, loanId)
  const progress = getLoanProgress(state, loanId)
  const totalPaid = getLoanTotalPaid(state, loanId)
  const totalRemaining = getLoanTotalRemaining(state, loanId)
  const currentBalance = getLoanCurrentBalance(state, loanId)
  const nextInstallmentCandidate = getNextLoanInstallment(state, loanId)
  const nextInstallment = loan?.status === 'paid' || loan?.status === 'cancelled'
    ? undefined
    : nextInstallmentCandidate
  const evolution = getLoanEvolution(state, loanId)
  const selectedInstallment = mode.kind === 'edit-installment' || mode.kind === 'payment'
    ? installments.find(item => item.id === mode.installmentId)
    : undefined

  const periodOptions = Array.from(new Set(
    installments.filter(item => isValidISODate(String(item.dueDate))).map(item => item.dueDate.slice(0, 7)),
  )).sort()

  const filteredInstallments = installments.filter(item => {
    const effectiveStatus = getLoanInstallmentStatus(state, item)
    const displayStatus = effectiveStatus === 'pending' && item.id === nextInstallment?.id ? 'upcoming' : effectiveStatus
    return (period === 'Todos' || String(item.dueDate).startsWith(period))
      && (statusFilter === 'Todos' || displayStatus === statusFilter)
  })

  const evolutionWindow = (() => {
    if (evolution.length <= 12) return evolution
    const nextIndex = evolution.findIndex(point => point.installmentId === nextInstallment?.id)
    const start = Math.max(0, (nextIndex < 0 ? evolution.length - 12 : nextIndex - 4))
    return evolution.slice(start, start + 12)
  })()

  const evolutionMax = Math.max(1, ...evolutionWindow.flatMap(point => [point.expectedAmount, point.paidAmount]))
  const latestPaidWithBalance = [...installments].reverse().find(item => item.status === 'paid' && safeAmount(item.balanceAfter) !== null)
  const hasExplicitBalance = !!latestPaidWithBalance || safeAmount(loan?.currentBalance) !== null
  const expectedEndDate = isValidISODate(String(loan?.expectedEndDate))
    ? loan?.expectedEndDate
    : installments.findLast(item => isValidISODate(String(item.dueDate)))?.dueDate

  useEffect(() => {
    if (!shouldFocusActionPanel.current || mode.kind === 'view') return
    shouldFocusActionPanel.current = false
    actionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    actionPanelRef.current?.focus({ preventScroll: true })
  }, [focusRequest, mode])

  useEffect(() => {
    if (!confirmingDelete) return
    deleteDialogRef.current?.focus()
  }, [confirmingDelete])

  function openMode(nextMode: LoanDetailsMode) {
    shouldFocusActionPanel.current = true
    setMode(nextMode)
    setConfirmingDelete(false)
    setFocusRequest(request => request + 1)
  }

  function cancelDelete() {
    const trigger = deleteTriggerRef.current
    setConfirmingDelete(false)
    if (trigger?.isConnected) trigger.focus()
  }

  function confirmDelete() {
    if (!loan || deleteLock.current) return
    deleteLock.current = true
    onDelete(loan.id)
  }

  if (!loan) {
    return (
      <Card className="border-primary/20 shadow-book-sm">
        <CardContent className="py-10 text-center">
          <h2 className="font-display text-xl font-semibold">Financiamento não disponível</h2>
          <p className="mt-2 text-sm text-muted-foreground">Este contrato não foi encontrado ou já foi removido.</p>
          <Button type="button" variant="outline" className="mt-4" onClick={onClose}>Voltar ao Financeiro</Button>
        </CardContent>
      </Card>
    )
  }

  const loanTitle = getSafeText(loan.title, 'Financiamento sem nome')
  const institution = getSafeText(loan.institution, 'Instituição não informada')
  const institutionLabel = institution.toLocaleLowerCase('pt-BR') === 'caixa' ? 'Caixa' : institution
  const contractNumber = getSafeText(loan.contractNumber, '')
  const installmentCount = getSafePositiveInteger(loan.installmentCount, installments.length)
  const notes = getSafeText(loan.notes, '')
  const canRegisterPayment = loan.status === 'active'

  return (
    <Card className="border-primary/20 shadow-book-sm">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-display text-2xl"><h2>{loanTitle}</h2></CardTitle>
              <Badge variant="outline">{getLoanStatusLabel(loan.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {institutionLabel}
              {contractNumber ? ` · Contrato ${contractNumber}` : ''} · {getAmortizationLabel(loan.amortizationSystem)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => openMode({ kind: 'edit-loan' })}><Edit3 aria-hidden="true" /> Editar</Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              ref={deleteTriggerRef}
              onClick={() => { setConfirmingDelete(true); setMode({ kind: 'view' }) }}
            >
              <Trash2 aria-hidden="true" /> Excluir
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-7">
        {confirmingDelete ? (
          <div
            ref={deleteDialogRef}
            role="alertdialog"
            aria-modal="false"
            aria-labelledby={`delete-loan-${loan.id}`}
            aria-describedby={`delete-loan-description-${loan.id}`}
            tabIndex={-1}
            className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onKeyDown={event => {
              if (event.key !== 'Escape') return
              event.preventDefault()
              cancelDelete()
            }}
          >
            <h3 id={`delete-loan-${loan.id}`} className="font-display text-lg font-semibold">Excluir este financiamento?</h3>
            <p id={`delete-loan-description-${loan.id}`} className="mt-1 text-sm text-muted-foreground">Isso removerá o cronograma financeiro associado. Movimentações já registradas permanecerão no histórico.</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={cancelDelete}>Cancelar</Button>
              <Button type="button" variant="destructive" onClick={confirmDelete}>Excluir financiamento</Button>
            </div>
          </div>
        ) : null}

        {mode.kind !== 'view' ? (
          <div
            ref={actionPanelRef}
            role="region"
            aria-label={mode.kind === 'edit-loan' ? 'Editar financiamento' : mode.kind === 'payment' ? 'Registrar pagamento da parcela' : 'Editar parcela do financiamento'}
            tabIndex={-1}
            className="scroll-mt-24 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {mode.kind === 'edit-loan' ? (
              <LoanForm
                key={`loan:${loan.id}`}
                initial={loan}
                onCancel={() => setMode({ kind: 'view' })}
                onUpdate={changes => {
                  onUpdateLoan(loan.id, changes)
                  setMode({ kind: 'view' })
                }}
              />
            ) : null}
            {mode.kind === 'edit-installment' && selectedInstallment ? (
              <LoanInstallmentForm
                key={`installment:${selectedInstallment.id}`}
                installment={selectedInstallment}
                documents={state.documents}
                installmentCount={installmentCount}
                onCancel={() => setMode({ kind: 'view' })}
                onSave={changes => {
                  onUpdateInstallment(selectedInstallment.id, changes)
                  setMode({ kind: 'view' })
                }}
              />
            ) : null}
            {mode.kind === 'payment' && selectedInstallment ? (
              <LoanPaymentForm
                key={`payment:${selectedInstallment.id}`}
                loan={loan}
                installment={selectedInstallment}
                documents={state.documents}
                onCancel={() => setMode({ kind: 'view' })}
                onSave={(transaction, documentIds) => {
                  onRegisterPayment(selectedInstallment.id, transaction, documentIds)
                  setMode({ kind: 'view' })
                }}
              />
            ) : null}
            {(mode.kind === 'edit-installment' || mode.kind === 'payment') && !selectedInstallment ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">Parcela não disponível.</p>
                <Button type="button" variant="ghost" className="mt-2" onClick={() => setMode({ kind: 'view' })}>Voltar ao cronograma</Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <section aria-labelledby={`loan-summary-${loan.id}`} className="space-y-3">
          <div>
            <h3 id={`loan-summary-${loan.id}`} className="font-display text-xl font-semibold">Resumo</h3>
            <p className="mt-1 text-sm text-muted-foreground">O que já foi pago e o que ainda está previsto nesta história.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FinancialSummaryCard icon={Landmark} value={formatOptionalAmount(loan.financedAmount)} label="Valor financiado" detail="valor original do contrato" />
            <FinancialSummaryCard icon={WalletCards} value={formatCurrencyBRL(currentBalance)} label={hasExplicitBalance ? 'Saldo devedor' : 'Saldo estimado'} detail={hasExplicitBalance ? 'posição mais recente informada' : 'soma das parcelas previstas'} />
            <FinancialSummaryCard icon={CheckCircle2} value={formatCurrencyBRL(totalPaid)} label="Total pago" detail="somente pagamentos realizados" />
            <FinancialSummaryCard icon={CalendarDays} value={formatCurrencyBRL(totalRemaining)} label="Total previsto restante" detail="parcelas abertas, não o saldo devedor" />
          </div>
          <div className="rounded-lg bg-secondary/50 p-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="font-medium">{progress.paidInstallments} de {progress.totalInstallments} parcelas pagas</span>
              <span className="text-muted-foreground">Previsão de quitação: {expectedEndDate ? formatFinancialDate(expectedEndDate) : 'não disponível'}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-background" role="progressbar" aria-label="Progresso do financiamento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.percentage)}>
              <div className="h-full rounded-full bg-primary/75" style={{ width: `${Math.max(0, Math.min(100, progress.percentage))}%` }} />
            </div>
          </div>
        </section>

        <section aria-labelledby={`next-installment-${loan.id}`} className="space-y-3">
          <h3 id={`next-installment-${loan.id}`} className="font-display text-xl font-semibold">Próxima parcela</h3>
          {nextInstallment ? (
            <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><ReceiptText className="size-5" aria-hidden="true" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Parcela {getSafePositiveInteger(nextInstallment.installmentNumber) || '—'}/{installmentCount || '—'}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatFinancialDate(nextInstallment.dueDate)} · {formatOptionalAmount(nextInstallment.expectedAmount)}</p>
              </div>
              <Badge variant={getLoanInstallmentStatus(state, nextInstallment) === 'overdue' ? 'destructive' : 'default'}>
                {getLoanInstallmentStatus(state, nextInstallment) === 'overdue' ? 'Atrasado' : 'Próximo'}
              </Badge>
              {canRegisterPayment ? <Button type="button" size="sm" onClick={() => openMode({ kind: 'payment', installmentId: nextInstallment.id })}>Registrar pagamento</Button> : null}
            </div>
          ) : <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">Nenhuma parcela pendente.</p>}
        </section>

        <section aria-labelledby={`loan-evolution-${loan.id}`} className="space-y-3">
          <div>
            <h3 id={`loan-evolution-${loan.id}`} className="font-display text-xl font-semibold">Evolução</h3>
            <p className="mt-1 text-sm text-muted-foreground">Valores previstos e efetivamente pagos nas parcelas ao redor do momento atual.</p>
          </div>
          {evolutionWindow.length ? (
            <figure className="rounded-lg border bg-card p-4" aria-label="Comparação entre valores previstos e pagos">
              <div className="flex h-40 items-end gap-3 overflow-x-auto pb-2">
                {evolutionWindow.map(point => {
                  const expectedHeight = point.expectedAmount > 0 ? Math.max(6, (point.expectedAmount / evolutionMax) * 112) : 2
                  const paidHeight = point.paidAmount > 0 ? Math.max(6, (point.paidAmount / evolutionMax) * 112) : 2
                  return (
                    <div key={point.installmentId} className="flex min-w-12 flex-1 flex-col items-center gap-1">
                      <div className="flex h-28 items-end gap-1" aria-hidden="true">
                        <div className="w-2 rounded-t-sm bg-secondary" style={{ height: expectedHeight }} />
                        <div className="w-2 rounded-t-sm bg-primary/75" style={{ height: paidHeight }} />
                      </div>
                      <span className="text-[0.65rem] text-muted-foreground">{point.installmentNumber}</span>
                      <span className="sr-only">Parcela {point.installmentNumber}: previsto {formatCurrencyBRL(point.expectedAmount)}, pago {formatCurrencyBRL(point.paidAmount)}</span>
                    </div>
                  )
                })}
              </div>
              <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-secondary" /> Previsto</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-primary/75" /> Pago</span>
              </figcaption>
            </figure>
          ) : <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">A evolução aparecerá quando houver parcelas no cronograma.</p>}
        </section>

        <section aria-labelledby={`loan-schedule-${loan.id}`} className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 id={`loan-schedule-${loan.id}`} className="font-display text-xl font-semibold">Cronograma</h3>
              <p className="mt-1 text-sm text-muted-foreground">Cada parcela mantém separadamente o previsto, o pago e seus documentos.</p>
            </div>
            <span className="text-xs text-muted-foreground">{filteredInstallments.length} de {installments.length} parcelas</span>
          </div>
          {installments.length ? (
            <div className="flex flex-wrap gap-2">
              <select value={period} onChange={event => { setPeriod(event.target.value); setVisibleCount(24) }} aria-label="Filtrar parcelas por período" className="h-8 rounded-lg border bg-card px-3 text-sm">
                <option value="Todos">Todos os períodos</option>
                {periodOptions.map(month => (
                  <option key={month} value={month}>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`))}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setVisibleCount(24) }} aria-label="Filtrar parcelas por status" className="h-8 rounded-lg border bg-card px-3 text-sm">
                <option value="Todos">Todos os status</option>
                <option value="paid">Pago</option>
                <option value="upcoming">Próximo</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Atrasado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          ) : null}

          {filteredInstallments.length ? (
            <div className="divide-y rounded-lg border px-4">
              {filteredInstallments.slice(0, visibleCount).map(installment => {
                const baseStatus = getLoanInstallmentStatus(state, installment)
                const displayStatus: LoanInstallment['status'] = baseStatus === 'pending' && installment.id === nextInstallment?.id ? 'upcoming' : baseStatus
                const linkedDocuments = state.documents.filter(document => Array.isArray(installment.documentIds) && installment.documentIds.includes(document.id))
                const hasMissingDocuments = Array.isArray(installment.documentIds) && installment.documentIds.some(id => !state.documents.some(document => document.id === id))
                const canPay = canRegisterPayment && displayStatus !== 'paid' && displayStatus !== 'cancelled'
                const expectedBreakdown = [
                  ['Amortização', installment.expectedPrincipal],
                  ['Juros', installment.expectedInterest],
                  ['Seguros', installment.expectedInsurance],
                  ['Tarifas', installment.expectedFees],
                ].flatMap(([label, value]) => {
                  const amount = safeAmount(value)
                  return amount === null ? [] : [`${label}: ${formatCurrencyBRL(amount)}`]
                })
                const balanceBefore = safeAmount(installment.balanceBefore)
                const balanceAfter = safeAmount(installment.balanceAfter)
                const installmentNumber = getSafePositiveInteger(installment.installmentNumber)
                const paidAmount = getLoanInstallmentPaidAmount(state, installment)
                const paidAmountLabel = paidAmount > 0 ? formatCurrencyBRL(paidAmount) : formatOptionalAmount(installment.paidAmount)
                return (
                  <article key={installment.id} className="flex flex-wrap items-center gap-3 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">Parcela {installmentNumber || '—'}/{installmentCount || '—'}</p>
                        <Badge variant={installmentStatusVariants[displayStatus]}>{installmentStatusLabels[displayStatus]}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Vencimento: {formatFinancialDate(installment.dueDate)} · Previsto: {formatOptionalAmount(installment.expectedAmount)}</p>
                      {expectedBreakdown.length ? <p className="mt-1 text-xs text-muted-foreground">{expectedBreakdown.join(' · ')}</p> : null}
                      {balanceBefore !== null || balanceAfter !== null ? <p className="mt-1 text-xs text-muted-foreground">Saldo: {balanceBefore !== null ? formatCurrencyBRL(balanceBefore) : 'não informado'} → {balanceAfter !== null ? formatCurrencyBRL(balanceAfter) : 'não informado'}</p> : null}
                      {displayStatus === 'paid' ? <p className="mt-1 text-xs text-success">Pago: {paidAmountLabel} · {installment.paidDate ? formatFinancialDate(installment.paidDate) : 'data não disponível'}</p> : null}
                      {linkedDocuments.length || hasMissingDocuments ? (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><FileText className="size-3.5" aria-hidden="true" /> {linkedDocuments.map(document => document.name || 'Documento sem nome').join(' · ')}{hasMissingDocuments ? `${linkedDocuments.length ? ' · ' : ''}Documento não disponível` : ''}</p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold">{displayStatus === 'paid' ? paidAmountLabel : formatOptionalAmount(installment.expectedAmount)}</p>
                    <Button type="button" variant="ghost" size="sm" aria-label={`Editar parcela ${installmentNumber || 'sem número'} de ${installmentCount || 'total não informado'}`} onClick={() => openMode({ kind: 'edit-installment', installmentId: installment.id })}><Edit3 aria-hidden="true" /> Editar</Button>
                    {canPay ? <Button type="button" variant="outline" size="sm" aria-label={`Registrar pagamento da parcela ${installmentNumber || 'sem número'} de ${installmentCount || 'total não informado'}`} onClick={() => openMode({ kind: 'payment', installmentId: installment.id })}>Registrar pagamento</Button> : null}
                  </article>
                )
              })}
            </div>
          ) : installments.length ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              <p>Nenhuma parcela encontrada.</p>
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => { setPeriod('Todos'); setStatusFilter('Todos') }}>Limpar filtros</Button>
            </div>
          ) : <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">Nenhuma parcela cadastrada neste financiamento.</p>}

          {filteredInstallments.length > visibleCount ? (
            <div className="flex justify-center"><Button type="button" variant="outline" onClick={() => setVisibleCount(count => count + 24)}>Mostrar mais parcelas</Button></div>
          ) : null}
        </section>

        {notes ? (
          <section className="rounded-lg bg-secondary/40 p-4">
            <div className="flex items-start gap-3"><Building2 className="mt-0.5 size-4 text-primary" aria-hidden="true" /><div><h3 className="text-sm font-medium">Observações do contrato</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{notes}</p></div></div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  )
}

export { LoanDetails }
