import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import type { FinancialLoan, FinancialTransaction, HouseDocument, LoanInstallment } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getConfiguredCategoryOptions } from '@/features/settings/categories'
import {
  financialCategories,
  formatFinancialDate,
  getLocalFinancialDate,
  isValidISODate,
  parseCurrencyBRLStrict,
} from '@/features/financial/presentation'
import { createUuid, formatCurrencyBRL } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

const fieldClass = 'h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

type PaymentErrors = Partial<Record<'amount' | 'date' | 'category', string>>

type LoanPaymentFormProps = {
  loan: FinancialLoan
  installment: LoanInstallment
  documents: HouseDocument[]
  onCancel: () => void
  onSave: (transaction: FinancialTransaction, documentIds: string[]) => void
}

const safeDocumentIds = (value: unknown) => Array.isArray(value)
  ? value.filter((id): id is string => typeof id === 'string' && !!id.trim())
  : []

function LoanPaymentForm({ loan, installment, documents, onCancel, onSave }: LoanPaymentFormProps) {
  const { state } = useAppStore()
  const errorPrefix = useId()
  const categoryOptions = getConfiguredCategoryOptions(state.settings, 'financial', financialCategories, id => id, 'Aquisição')
  const initialAmount = typeof installment.expectedAmount === 'number' && Number.isFinite(installment.expectedAmount) && installment.expectedAmount > 0
    ? installment.expectedAmount.toFixed(2).replace('.', ',')
    : ''
  const [amount, setAmount] = useState(initialAmount)
  const [paidDate, setPaidDate] = useState(getLocalFinancialDate())
  const [category, setCategory] = useState<string>(categoryOptions.find(option => option.id === 'Aquisição')?.id ?? categoryOptions[0]?.id ?? 'Aquisição')
  const [notes, setNotes] = useState('')
  const [documentIds, setDocumentIds] = useState<string[]>(safeDocumentIds(installment.documentIds))
  const [errors, setErrors] = useState<PaymentErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const submitLock = useRef(false)
  const amountRef = useRef<HTMLInputElement>(null)
  const paidDateRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const missingDocumentIds = useMemo(
    () => documentIds.filter(id => !documents.some(document => document.id === id)),
    [documentIds, documents],
  )
  const loanTitle = typeof loan.title === 'string' && loan.title.trim() ? loan.title.trim() : 'Financiamento sem nome'
  const installmentNumber = Number.isInteger(installment.installmentNumber) && installment.installmentNumber > 0 ? installment.installmentNumber : null
  const installmentCount = Number.isInteger(loan.installmentCount) && loan.installmentCount > 0 ? loan.installmentCount : null

  function toggleDocument(id: string) {
    setDocumentIds(current => current.includes(id)
      ? current.filter(documentId => documentId !== id)
      : [...current, id])
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (submitLock.current) return

    const parsedAmount = parseCurrencyBRLStrict(amount)
    const nextErrors: PaymentErrors = {}
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) nextErrors.amount = 'Informe um valor pago maior que zero.'
    if (!isValidISODate(paidDate)) nextErrors.date = 'Informe uma data de pagamento válida.'
    if (!categoryOptions.some(option => option.id === category)) nextErrors.category = 'Escolha uma categoria.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      if (nextErrors.amount) amountRef.current?.focus()
      else if (nextErrors.date) paidDateRef.current?.focus()
      else if (nextErrors.category) categoryRef.current?.focus()
      return
    }

    submitLock.current = true
    setSubmitting(true)
    const now = new Date().toISOString()
    const commitment = state.financialCommitments.find(item => item.loanInstallmentId === installment.id)
    const installmentLabel = installmentNumber && installmentCount
      ? `${installmentNumber}/${installmentCount}`
      : installmentNumber ? String(installmentNumber) : 'sem número'
    const cleanNotes = notes.trim()
    const selectedDocumentIds = [...new Set(documentIds)]

    try {
      onSave({
        id: createUuid(),
        title: `Pagamento ${loanTitle} · Parcela ${installmentLabel}`,
        description: cleanNotes || `Pagamento da parcela ${installmentLabel} do financiamento.`,
        amount: parsedAmount,
        date: paidDate,
        type: 'expense',
        status: 'paid',
        category,
        chapterId: commitment?.chapterId ?? null,
        documentIds: selectedDocumentIds,
        assetId: null,
        maintenanceId: null,
        createdAt: now,
        updatedAt: now,
      }, selectedDocumentIds)
    } catch (error) {
      submitLock.current = false
      setSubmitting(false)
      throw error
    }
  }

  return (
    <form className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-2" onSubmit={submit} noValidate>
      <div className="rounded-md bg-secondary/60 px-3 py-2 text-sm sm:col-span-2">
        <p className="font-medium">Registrar pagamento · Parcela {installmentNumber ?? '—'}/{installmentCount ?? '—'}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Previsto: {typeof installment.expectedAmount === 'number' && Number.isFinite(installment.expectedAmount)
            ? formatCurrencyBRL(installment.expectedAmount)
            : 'valor não informado'} · vencimento {formatFinancialDate(installment.dueDate)}
        </p>
      </div>

      <label className="space-y-1.5">
        <span className="text-sm font-medium">Valor pago</span>
        <Input
          ref={amountRef}
          inputMode="decimal"
          value={amount}
          onChange={event => setAmount(event.target.value)}
          placeholder="R$ 0,00"
          required
          aria-invalid={!!errors.amount}
          aria-describedby={errors.amount ? `${errorPrefix}-amount` : undefined}
        />
        {errors.amount ? <span id={`${errorPrefix}-amount`} role="alert" className="block text-xs text-destructive">{errors.amount}</span> : null}
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium">Data do pagamento</span>
        <Input
          ref={paidDateRef}
          type="date"
          value={paidDate}
          onChange={event => setPaidDate(event.target.value)}
          required
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? `${errorPrefix}-date` : undefined}
        />
        {errors.date ? <span id={`${errorPrefix}-date`} role="alert" className="block text-xs text-destructive">{errors.date}</span> : null}
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium">Categoria</span>
        <select
          ref={categoryRef}
          className={fieldClass}
          value={category}
          onChange={event => setCategory(event.target.value)}
          required
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? `${errorPrefix}-category` : undefined}
        >
          {categoryOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        {errors.category ? <span id={`${errorPrefix}-category`} role="alert" className="block text-xs text-destructive">{errors.category}</span> : null}
      </label>

      <label className="space-y-1.5 sm:col-span-2">
        <span className="text-sm font-medium">Observação</span>
        <Textarea value={notes} onChange={event => setNotes(event.target.value)} className="min-h-20" placeholder="Ex.: débito automático, ajuste de seguro ou encargo." />
      </label>

      <fieldset className="space-y-2 sm:col-span-2">
        <legend className="text-sm font-medium">Comprovantes e documentos</legend>
        {documents.length || missingDocumentIds.length ? (
          <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border bg-card p-3 sm:grid-cols-2">
            {missingDocumentIds.map(id => (
              <label key={id} className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked onChange={() => toggleDocument(id)} className="mt-0.5 size-4 accent-primary" />
                Documento relacionado não disponível
              </label>
            ))}
            {documents.map(document => (
              <label key={document.id} className="flex items-start gap-2 text-xs">
                <input type="checkbox" checked={documentIds.includes(document.id)} onChange={() => toggleDocument(document.id)} className="mt-0.5 size-4 accent-primary" />
                <span>{document.name || 'Documento sem nome'}</span>
              </label>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground">Nenhum documento disponível. Adicione comprovantes no módulo Documentos para vinculá-los aqui.</p>}
      </fieldset>

      <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>Registrar pagamento</Button>
      </div>
    </form>
  )
}

export { LoanPaymentForm }
