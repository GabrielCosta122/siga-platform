import { CalendarDays, ChevronRight, Landmark, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FinancialLoan, LoanInstallment } from '@/domain/types'
import { formatFinancialDate } from '@/features/financial/presentation'
import { formatCurrencyBRL } from '@/lib/utils'
import type { AppState } from '@/store/app-state'
import {
  getLoanCurrentBalance,
  getLoanInstallments,
  getLoanProgress,
  getLoansByPropertyId,
  getNextLoanInstallment,
} from '@/store/selectors'

const loanStatusLabels = {
  active: 'Ativo',
  paid: 'Quitado',
  suspended: 'Suspenso',
  cancelled: 'Cancelado',
} satisfies Record<FinancialLoan['status'], string>

export interface LoanSectionProps {
  state: AppState
  onAdd: () => void
  onView: (loan: FinancialLoan) => void
}

const isKnownAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

const getInstitutionLabel = (institution: unknown) => {
  if (typeof institution !== 'string' || !institution.trim()) return 'Instituição não informada'
  const value = institution.trim()
  return value.toLocaleLowerCase('pt-BR') === 'caixa' ? 'Caixa' : value
}

const getLoanTitle = (value: unknown) => typeof value === 'string' && value.trim()
  ? value.trim()
  : 'Financiamento sem nome'

const getExpectedInstallmentAmount = (
  state: AppState,
  installment: LoanInstallment | undefined,
) => {
  if (!installment) return null
  if (isKnownAmount(installment.expectedAmount)) return installment.expectedAmount
  const commitment = state.financialCommitments.find(item => item.loanInstallmentId === installment.id)
  return isKnownAmount(commitment?.amount) ? commitment.amount : null
}

const hasRecordedBalance = (loan: FinancialLoan, installments: LoanInstallment[]) =>
  isKnownAmount(loan.currentBalance)
  || installments.some(item => item.status === 'paid' && isKnownAmount(item.balanceAfter))

const hasEstimatedBalance = (state: AppState, installments: LoanInstallment[]) => {
  if (installments.some(item => isKnownAmount(item.expectedAmount))) return true
  const installmentIds = new Set(installments.map(item => item.id))
  return state.financialCommitments.some(commitment =>
    typeof commitment.loanInstallmentId === 'string'
    && installmentIds.has(commitment.loanInstallmentId)
    && isKnownAmount(commitment.amount))
}

function LoanSection({ state, onAdd, onView }: LoanSectionProps) {
  const loans = getLoansByPropertyId(state, state.property.id)

  return (
    <section aria-labelledby="financial-loans-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="financial-loans-heading" className="font-display text-xl font-semibold">Financiamentos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Contratos e parcelas que acompanham a construção deste lar.</p>
        </div>
        {loans.length ? <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus aria-hidden="true" /> Adicionar financiamento
        </Button> : null}
      </div>

      {loans.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {loans.map(loan => {
            const loanTitle = getLoanTitle(loan.title)
            const installments = getLoanInstallments(state, loan.id)
            const nextInstallment = loan.status === 'paid' || loan.status === 'cancelled'
              ? undefined
              : getNextLoanInstallment(state, loan.id)
            const nextAmount = getExpectedInstallmentAmount(state, nextInstallment)
            const progress = getLoanProgress(state, loan.id)
            const currentBalance = getLoanCurrentBalance(state, loan.id)
            const recordedBalance = hasRecordedBalance(loan, installments)
            const estimatedBalance = !recordedBalance && hasEstimatedBalance(state, installments)
            const displayBalance = recordedBalance || estimatedBalance
              ? formatCurrencyBRL(currentBalance)
              : 'Não informado'
            const statusLabel = loanStatusLabels[loan.status] ?? 'Status indisponível'
            const installmentCount = progress.totalInstallments || (Number.isInteger(loan.installmentCount) && loan.installmentCount > 0 ? loan.installmentCount : installments.length)

            return (
              <Card key={loan.id} className="shadow-book-xs">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                        <Landmark className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="font-display text-lg"><h3 className="truncate">{loanTitle}</h3></CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">{getInstitutionLabel(loan.institution)}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{statusLabel}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-secondary/45 p-3">
                      <p className="text-xs text-muted-foreground">{estimatedBalance ? 'Saldo estimado' : 'Saldo atual'}</p>
                      <p className="mt-1 text-lg font-semibold tracking-tight">{displayBalance}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/45 p-3">
                      <p className="text-xs text-muted-foreground">Próxima parcela</p>
                      {nextInstallment ? <>
                        <p className="mt-1 text-lg font-semibold tracking-tight">{nextAmount !== null ? formatCurrencyBRL(nextAmount) : 'Valor a confirmar'}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="size-3" aria-hidden="true" />
                          {formatFinancialDate(nextInstallment.dueDate, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          <span aria-hidden="true">·</span>
                          <span>
                            {Number.isInteger(nextInstallment.installmentNumber) && nextInstallment.installmentNumber > 0
                              ? `Parcela ${nextInstallment.installmentNumber}/${installmentCount}`
                              : 'Parcela sem número'}
                          </span>
                        </p>
                      </> : <p className="mt-1 text-sm font-medium">Nenhuma parcela pendente</p>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Parcelas pagas</span>
                      <span className="font-medium">{progress.paidInstallments} de {installmentCount}</span>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
                      role="progressbar"
                      aria-label={`Progresso de ${loanTitle}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(progress.percentage)}
                    >
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${progress.percentage}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-end border-t pt-3">
                    <Button type="button" variant="ghost" size="sm" aria-label={`Ver financiamento ${loanTitle}`} onClick={() => onView(loan)}>
                      Ver financiamento <ChevronRight aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="shadow-book-xs">
          <CardContent className="py-10 text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-md bg-accent text-primary">
              <Landmark className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold">Nenhum financiamento cadastrado</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Registre o financiamento do imóvel para acompanhar parcelas, pagamentos e saldo ao longo da história da casa.
            </p>
            <Button type="button" className="mt-5" onClick={onAdd}>
              <Plus aria-hidden="true" /> Adicionar financiamento
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

export { LoanSection }
