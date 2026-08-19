import { useEffect, useMemo, useRef, useState } from 'react'
import { Banknote, BookOpen, CalendarDays, Filter, Landmark, Plus, Search, WalletCards } from 'lucide-react'
import { Link } from 'react-router'
import type { FinancialCommitment, FinancialTransaction } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CommitmentManager } from '@/features/financial/components/CommitmentManager'
import { CommitmentsList } from '@/features/financial/components/CommitmentsList'
import { FinancialSummaryCard } from '@/features/financial/components/FinancialSummaryCard'
import { InvestmentEvolution } from '@/features/financial/components/InvestmentEvolution'
import { MovementList } from '@/features/financial/components/MovementList'
import { TransactionDetails } from '@/features/financial/components/TransactionDetails'
import { TransactionForm } from '@/features/financial/components/TransactionForm'
import { financialCategories, formatFinancialDate, getCategoryIcon, getCategoryLabel, normalizeTransactionStatus } from '@/features/financial/presentation'
import { formatCurrencyBRL } from '@/lib/utils'
import { getFutureCommitments, getInvestmentDistribution, getInvestmentEvolution, getNextFinancialCommitment, getPaidAmount, getTotalInvested } from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'

type Panel = { kind: 'create' } | { kind: 'details' | 'edit'; id: string } | { kind: 'commitments' } | null

function Financial() {
  const { state, dispatch } = useAppStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [status, setStatus] = useState('Todos')
  const [type, setType] = useState('Todos')
  const [period, setPeriod] = useState('Todos')
  const [panel, setPanel] = useState<Panel>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [feedback, setFeedback] = useState('')
  const transactionDetailsRef = useRef<HTMLDivElement>(null)
  const shouldFocusTransactionDetails = useRef(false)
  const chapters = state.chapters
  const periodOptions = useMemo(() => Array.from(new Set(state.financialTransactions.filter(item => /^\d{4}-\d{2}-\d{2}$/.test(String(item.date))).map(item => item.date.slice(0, 7)))).sort((a, b) => b.localeCompare(a)), [state.financialTransactions])
  const selectedTransaction = panel && 'id' in panel ? state.financialTransactions.find(item => item.id === panel.id) : undefined
  const filtered = useMemo(() => [...state.financialTransactions].sort((a, b) => String(b.date).localeCompare(String(a.date))).filter(item => {
    const term = search.trim().toLowerCase()
    const normalizedStatus = normalizeTransactionStatus(item.status)
    return (!term || `${item.title} ${item.description}`.toLowerCase().includes(term)) && (category === 'Todas' || getCategoryLabel(item.category) === category) && (status === 'Todos' || normalizedStatus === status) && (type === 'Todos' || item.type === type) && (period === 'Todos' || String(item.date).startsWith(period))
  }), [state.financialTransactions, search, category, status, type, period])
  const totalInvested = getTotalInvested(state)
  const paidAmount = getPaidAmount(state)
  const futureCommitments = getFutureCommitments(state)
  const nextCommitment = getNextFinancialCommitment(state)
  const evolution = getInvestmentEvolution(state)
  const distribution = getInvestmentDistribution(state)
  useEffect(() => {
    if (!shouldFocusTransactionDetails.current || panel?.kind !== 'details' || !selectedTransaction) return

    shouldFocusTransactionDetails.current = false
    transactionDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    transactionDetailsRef.current?.focus({ preventScroll: true })
  }, [panel, selectedTransaction])

  function viewTransactionDetails(transaction: FinancialTransaction) {
    shouldFocusTransactionDetails.current = true
    setPanel({ kind: 'details', id: transaction.id })
    setConfirmingDelete(false)
  }
  function showFeedback(message: string) { setFeedback(message); window.setTimeout(() => setFeedback(''), 2600) }
  function saveTransaction(transaction: FinancialTransaction) {
    if (panel?.kind === 'edit') { dispatch({ type: 'UPDATE_FINANCIAL_TRANSACTION', payload: { id: transaction.id, changes: transaction } }); showFeedback('Movimentação atualizada.') }
    else { dispatch({ type: 'ADD_FINANCIAL_TRANSACTION', payload: transaction }); showFeedback('Movimentação registrada.') }
    setPanel(null)
  }
  function deleteTransaction() { if (!selectedTransaction) return; dispatch({ type: 'DELETE_FINANCIAL_TRANSACTION', payload: selectedTransaction.id }); setPanel(null); setConfirmingDelete(false); showFeedback('Movimentação excluída.') }
  function saveCommitment(commitment: FinancialCommitment, editing: boolean) { dispatch(editing ? { type: 'UPDATE_FINANCIAL_COMMITMENT', payload: { id: commitment.id, changes: commitment } } : { type: 'ADD_FINANCIAL_COMMITMENT', payload: commitment }); showFeedback(editing ? 'Compromisso atualizado.' : 'Compromisso registrado.') }
  function deleteCommitment(id: string) { dispatch({ type: 'DELETE_FINANCIAL_COMMITMENT', payload: id }); showFeedback('Compromisso excluído.') }

  return <div className="bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1200px] space-y-8"><header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Financeiro</h1><p className="mt-1 text-sm text-muted-foreground sm:text-base">Cada investimento ajuda a construir esta história.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setPanel({ kind: 'commitments' })}><CalendarDays aria-hidden="true" /> Ver compromissos</Button><Button type="button" onClick={() => setPanel({ kind: 'create' })}><Plus aria-hidden="true" /> Registrar movimentação</Button></div></header>
    {feedback ? <p role="status" className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">{feedback}</p> : null}
    {panel?.kind === 'create' ? <TransactionForm chapters={chapters} onCancel={() => setPanel(null)} onSave={saveTransaction} /> : null}
    {panel?.kind === 'edit' && selectedTransaction ? <TransactionForm key={selectedTransaction.id} chapters={chapters} initial={selectedTransaction} onCancel={() => setPanel({ kind: 'details', id: selectedTransaction.id })} onSave={saveTransaction} /> : null}
    {panel?.kind === 'details' && selectedTransaction ? <div ref={transactionDetailsRef} role="region" aria-label={`Detalhes da movimentação: ${selectedTransaction.title || 'Movimentação sem título'}`} tabIndex={-1} className="scroll-mt-20 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"><TransactionDetails transaction={selectedTransaction} state={state} confirmingDelete={confirmingDelete} onClose={() => { setPanel(null); setConfirmingDelete(false) }} onEdit={() => { setPanel({ kind: 'edit', id: selectedTransaction.id }); setConfirmingDelete(false) }} onAskDelete={() => setConfirmingDelete(true)} onCancelDelete={() => setConfirmingDelete(false)} onDelete={deleteTransaction} /></div> : null}
    {panel?.kind === 'commitments' ? <CommitmentManager commitments={state.financialCommitments} chapters={chapters} onClose={() => setPanel(null)} onSave={saveCommitment} onDelete={deleteCommitment} /> : null}
    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="size-4" aria-hidden="true" /><select value={period} onChange={event => setPeriod(event.target.value)} aria-label="Filtrar por período" className="rounded-md bg-transparent outline-none"><option value="Todos">Todos os períodos</option>{periodOptions.map(month => <option key={month} value={month}>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`))}</option>)}</select></div>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><FinancialSummaryCard icon={Landmark} value={formatCurrencyBRL(totalInvested)} label="Total investido" detail="na história do lar"/><FinancialSummaryCard icon={WalletCards} value={formatCurrencyBRL(paidAmount)} label="Pago até agora" detail="etapas já concluídas"/><FinancialSummaryCard icon={CalendarDays} value={formatCurrencyBRL(futureCommitments)} label="Compromissos futuros" detail="próximas etapas"/><FinancialSummaryCard icon={Banknote} value={nextCommitment ? formatCurrencyBRL(Number.isFinite(nextCommitment.amount) ? nextCommitment.amount : 0) : '—'} label="Próximo pagamento" detail={nextCommitment ? `${nextCommitment.title} · ${formatFinancialDate(nextCommitment.dueDate)}` : 'Nenhum compromisso próximo'}/></section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]"><InvestmentEvolution evolution={evolution}/><CommitmentsList commitments={state.financialCommitments} onOpen={() => setPanel({ kind: 'commitments' })}/></section>
    <section className="rounded-lg bg-secondary/70 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6"><div><h2 className="font-display text-lg font-semibold">Finanças também contam histórias</h2><p className="mt-1 text-sm text-muted-foreground">Vincule uma movimentação a um capítulo para lembrar o que aquele investimento representou.</p></div><Button variant="ghost" className="mt-3 sm:mt-0" render={<Link to="/livro-da-casa" />}><BookOpen aria-hidden="true" /> Ver capítulos relacionados</Button></section>
    <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Movimentações recentes</h2><p className="mt-1 text-sm text-muted-foreground">Registros que acompanham a construção da casa.</p></div><span className="text-xs text-muted-foreground">{filtered.length} movimentações</span></div><div className="flex flex-wrap gap-2"><div className="relative min-w-52 flex-1"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/><Input value={search} onChange={event => setSearch(event.target.value)} className="pl-9" placeholder="Buscar movimentação"/></div><select value={category} onChange={event => setCategory(event.target.value)} className="h-8 rounded-lg border bg-card px-3 text-sm"><option>Todas</option>{financialCategories.map(item => <option key={item}>{item}</option>)}</select><select value={status} onChange={event => setStatus(event.target.value)} className="h-8 rounded-lg border bg-card px-3 text-sm"><option value="Todos">Todos</option><option value="paid">Pago</option><option value="pending">Pendente</option><option value="scheduled">Agendado</option><option value="cancelled">Cancelado</option></select><select value={type} onChange={event => setType(event.target.value)} className="h-8 rounded-lg border bg-card px-3 text-sm"><option value="Todos">Todos os tipos</option><option value="expense">Despesa</option><option value="income">Entrada</option></select></div>
      {filtered.length ? <MovementList movements={filtered} chapters={state.chapters} onSelect={viewTransactionDetails}/>:<Card><CardContent className="py-12 text-center"><h3 className="font-display text-xl font-semibold">{state.financialTransactions.length ? 'Ainda não há movimentações neste período' : 'Nenhuma movimentação registrada'}</h3><p className="mt-2 text-sm text-muted-foreground">{state.financialTransactions.length ? 'Ajuste os filtros para encontrar outros registros.' : 'Registre um investimento, pagamento ou compromisso para começar a acompanhar a história financeira da casa.'}</p><Button type="button" className="mt-5" onClick={() => setPanel({ kind: 'create' })}><Plus aria-hidden="true"/> Registrar movimentação</Button></CardContent></Card>}
    </section>
    <section><h2 className="font-display text-xl font-semibold">Onde estamos investindo</h2>{distribution.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{distribution.map(item => { const Icon = getCategoryIcon(item.category); return <Card key={item.category} size="sm" className="shadow-book-xs"><CardContent className="flex items-center gap-3"><Icon className="size-4 text-primary" aria-hidden="true"/><div className="min-w-0 flex-1"><div className="flex justify-between gap-3 text-sm"><span className="font-medium">{item.category}</span><span>{formatCurrencyBRL(item.amount)} · {Math.round(item.percent)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary/70" style={{width:`${Math.max(0, Math.min(100, item.percent))}%`}}/></div></div></CardContent></Card> })}</div> : <p className="mt-4 rounded-lg bg-secondary/40 py-8 text-center text-sm text-muted-foreground">Ainda não há investimentos pagos por categoria.</p>}</section>
  </div></div>
}
export { Financial }
