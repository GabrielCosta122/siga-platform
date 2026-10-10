import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import type { HouseDocument, LoanInstallment } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatFinancialDate, isValidISODate, parseCurrencyBRLStrict } from '@/features/financial/presentation'
import { formatCurrencyBRL } from '@/lib/utils'

const fieldClass = 'h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

type EditableInstallmentChanges = Pick<LoanInstallment,
  | 'dueDate'
  | 'expectedAmount'
  | 'expectedPrincipal'
  | 'expectedInterest'
  | 'expectedInsurance'
  | 'expectedFees'
  | 'balanceBefore'
  | 'balanceAfter'
  | 'status'
  | 'documentIds'
>

type MonetaryField = Exclude<keyof EditableInstallmentChanges, 'dueDate' | 'status' | 'documentIds'>
type InstallmentErrors = Partial<Record<'dueDate' | MonetaryField, string>>

type LoanInstallmentFormProps = {
  installment: LoanInstallment
  documents: HouseDocument[]
  installmentCount: number
  onCancel: () => void
  onSave: (changes: EditableInstallmentChanges) => void
}

const moneyToInput = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
  ? value.toFixed(2).replace('.', ',')
  : ''

const parseOptionalAmount = (value: string) => {
  if (!value.trim()) return null
  return parseCurrencyBRLStrict(value)
}

const safeDocumentIds = (value: unknown) => Array.isArray(value)
  ? value.filter((id): id is string => typeof id === 'string' && !!id.trim())
  : []

function LoanInstallmentForm({ installment, documents, installmentCount, onCancel, onSave }: LoanInstallmentFormProps) {
  const errorPrefix = useId()
  const [dueDate, setDueDate] = useState(typeof installment.dueDate === 'string' ? installment.dueDate : '')
  const [expectedAmount, setExpectedAmount] = useState(moneyToInput(installment.expectedAmount))
  const [expectedPrincipal, setExpectedPrincipal] = useState(moneyToInput(installment.expectedPrincipal))
  const [expectedInterest, setExpectedInterest] = useState(moneyToInput(installment.expectedInterest))
  const [expectedInsurance, setExpectedInsurance] = useState(moneyToInput(installment.expectedInsurance))
  const [expectedFees, setExpectedFees] = useState(moneyToInput(installment.expectedFees))
  const [balanceBefore, setBalanceBefore] = useState(moneyToInput(installment.balanceBefore))
  const [balanceAfter, setBalanceAfter] = useState(moneyToInput(installment.balanceAfter))
  const [status, setStatus] = useState<LoanInstallment['status']>(installment.status === 'paid' ? 'paid' : installment.status === 'cancelled' ? 'cancelled' : installment.status === 'upcoming' ? 'upcoming' : 'pending')
  const [documentIds, setDocumentIds] = useState<string[]>(safeDocumentIds(installment.documentIds))
  const [errors, setErrors] = useState<InstallmentErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const submitLock = useRef(false)
  const dueDateRef = useRef<HTMLInputElement>(null)
  const monetaryFieldRefs = useRef<Partial<Record<MonetaryField, HTMLInputElement | null>>>({})
  const missingDocumentIds = useMemo(
    () => documentIds.filter(id => !documents.some(document => document.id === id)),
    [documentIds, documents],
  )
  const monetaryFields = {
    expectedAmount,
    expectedPrincipal,
    expectedInterest,
    expectedInsurance,
    expectedFees,
    balanceBefore,
    balanceAfter,
  } satisfies Record<MonetaryField, string>
  const displayInstallmentNumber = Number.isInteger(installment.installmentNumber) && installment.installmentNumber > 0
    ? installment.installmentNumber
    : '—'
  const displayInstallmentCount = Number.isInteger(installmentCount) && installmentCount > 0 ? installmentCount : '—'

  function toggleDocument(id: string) {
    setDocumentIds(current => current.includes(id)
      ? current.filter(documentId => documentId !== id)
      : [...current, id])
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (submitLock.current) return

    const nextErrors: InstallmentErrors = {}
    if (!isValidISODate(dueDate)) nextErrors.dueDate = 'Informe um vencimento válido.'
    const parsedAmounts = Object.fromEntries(Object.entries(monetaryFields).map(([field, value]) => [field, parseOptionalAmount(value)])) as Record<MonetaryField, number | null>
    for (const [field, value] of Object.entries(parsedAmounts) as [MonetaryField, number | null][]) {
      if (value !== null && (!Number.isFinite(value) || value < 0)) nextErrors[field] = 'Use um valor igual ou maior que zero.'
      if (field === 'expectedAmount' && value !== null && value <= 0) nextErrors[field] = 'Informe um valor previsto maior que zero ou deixe o campo vazio.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      if (nextErrors.dueDate) dueDateRef.current?.focus()
      else {
        const firstInvalidMonetaryField = Object.keys(monetaryFields).find(field => nextErrors[field as MonetaryField]) as MonetaryField | undefined
        if (firstInvalidMonetaryField) monetaryFieldRefs.current[firstInvalidMonetaryField]?.focus()
      }
      return
    }

    submitLock.current = true
    setSubmitting(true)
    try {
      onSave({
        dueDate,
        ...parsedAmounts,
        status,
        documentIds: [...new Set(documentIds)],
      })
    } catch (error) {
      submitLock.current = false
      setSubmitting(false)
      throw error
    }
  }

  const renderMoneyInput = (
    field: MonetaryField,
    label: string,
    value: string,
    setValue: (value: string) => void,
  ) => (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Input
        ref={element => { monetaryFieldRefs.current[field] = element }}
        inputMode="decimal"
        value={value}
        onChange={event => setValue(event.target.value)}
        placeholder="Não informado"
        aria-invalid={!!errors[field]}
        aria-describedby={errors[field] ? `${errorPrefix}-${field}` : undefined}
      />
      {errors[field] ? <span id={`${errorPrefix}-${field}`} role="alert" className="block text-xs text-destructive">{errors[field]}</span> : null}
    </label>
  )

  return (
    <form className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-2" onSubmit={submit} noValidate>
      <div className="rounded-md bg-secondary/60 px-3 py-2 text-sm sm:col-span-2">
        <p className="font-medium">Editar apenas a parcela {displayInstallmentNumber}/{displayInstallmentCount}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          As demais parcelas não serão recalculadas. Vencimento atual: {formatFinancialDate(installment.dueDate)}
          {typeof installment.expectedAmount === 'number' && Number.isFinite(installment.expectedAmount)
            ? ` · ${formatCurrencyBRL(installment.expectedAmount)}`
            : ''}
        </p>
      </div>

      <label className="space-y-1.5">
        <span className="text-sm font-medium">Vencimento</span>
        <Input
          ref={dueDateRef}
          type="date"
          value={dueDate}
          onChange={event => setDueDate(event.target.value)}
          required
          aria-invalid={!!errors.dueDate}
          aria-describedby={errors.dueDate ? `${errorPrefix}-due-date` : undefined}
        />
        {errors.dueDate ? <span id={`${errorPrefix}-due-date`} role="alert" className="block text-xs text-destructive">{errors.dueDate}</span> : null}
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium">Status</span>
        <select className={fieldClass} value={status} onChange={event => setStatus(event.target.value as LoanInstallment['status'])} disabled={installment.status === 'paid'}>
          {installment.status === 'paid' ? <option value="paid">Pago</option> : null}
          <option value="pending">Pendente</option>
          <option value="upcoming">Próximo</option>
          <option value="cancelled">Cancelado</option>
        </select>
        {installment.status === 'paid' ? <span className="block text-xs text-muted-foreground">O pagamento real permanece registrado.</span> : null}
      </label>

      {renderMoneyInput('expectedAmount', 'Valor previsto', expectedAmount, setExpectedAmount)}
      {renderMoneyInput('expectedPrincipal', 'Amortização prevista', expectedPrincipal, setExpectedPrincipal)}
      {renderMoneyInput('expectedInterest', 'Juros previstos', expectedInterest, setExpectedInterest)}
      {renderMoneyInput('expectedInsurance', 'Seguros previstos', expectedInsurance, setExpectedInsurance)}
      {renderMoneyInput('expectedFees', 'Tarifas e encargos', expectedFees, setExpectedFees)}
      {renderMoneyInput('balanceBefore', 'Saldo antes da parcela', balanceBefore, setBalanceBefore)}
      {renderMoneyInput('balanceAfter', 'Saldo depois da parcela', balanceAfter, setBalanceAfter)}

      <fieldset className="space-y-2 sm:col-span-2">
        <legend className="text-sm font-medium">Documentos relacionados</legend>
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
        ) : <p className="text-xs text-muted-foreground">Nenhum documento disponível.</p>}
      </fieldset>

      <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>Salvar parcela</Button>
      </div>
    </form>
  )
}

export { LoanInstallmentForm }
export type { EditableInstallmentChanges }
