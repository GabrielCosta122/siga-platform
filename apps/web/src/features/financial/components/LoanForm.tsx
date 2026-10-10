import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { CalendarDays, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { FinancialLoan, FinancialLoanAmortizationSystem } from '@/domain/types'
import {
  createManualLoanSchedule,
  type ManualLoanSchedule,
} from '@/features/financial/loan-schedule'
import { isValidISODate, parseCurrencyBRLStrict } from '@/features/financial/presentation'
import { addMonthsClamped, MAX_MONTHLY_INSTALLMENTS } from '@/features/financial/recurrence'
import { formatCurrencyBRL, formatDateLongBR } from '@/lib/utils'

const fieldClass = 'h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const amortizationOptions = [
  { value: 'SAC', label: 'SAC' },
  { value: 'PRICE', label: 'Price' },
  { value: 'OTHER', label: 'Outro' },
  { value: 'UNKNOWN', label: 'Não informado' },
] as const satisfies readonly { value: FinancialLoanAmortizationSystem; label: string }[]
const amortizationSystems = new Set<FinancialLoanAmortizationSystem>(amortizationOptions.map(option => option.value))

type LoanFormErrors = Partial<Record<
  'title' | 'institution' | 'financedAmount' | 'firstDueDate' | 'installmentCount' | 'initialInstallmentAmount' | 'form',
  string
>>

export type FinancialLoanGeneralChanges = Pick<
  FinancialLoan,
  'title' | 'institution' | 'contractNumber' | 'amortizationSystem' | 'notes' | 'updatedAt'
>

type LoanFormBaseProps = {
  onCancel: () => void
}

type LoanFormCreateProps = LoanFormBaseProps & {
  propertyId: string
  initial?: undefined
  onCreate: (schedule: ManualLoanSchedule) => void
  onUpdate?: never
}

type LoanFormEditProps = LoanFormBaseProps & {
  propertyId?: string
  initial: FinancialLoan
  onCreate?: never
  onUpdate: (changes: FinancialLoanGeneralChanges) => void
}

export type LoanFormProps = LoanFormCreateProps | LoanFormEditProps

const currencyInputValue = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(2).replace('.', ',')
    : ''

const parseOptionalCurrency = (value: string) => {
  if (!value.trim()) return null
  return parseCurrencyBRLStrict(value)
}

const normalizeInstitution = (value: string) => {
  const normalized = value.trim()
  return normalized.toLocaleLowerCase('pt-BR') === 'caixa' ? 'caixa' : normalized
}

const safeText = (value: unknown) => typeof value === 'string' ? value : ''

const institutionInputValue = (value: unknown, useDefault: boolean) => {
  if (typeof value !== 'string') return useDefault ? 'Caixa' : ''
  return value.toLocaleLowerCase('pt-BR') === 'caixa' ? 'Caixa' : value
}

const normalizeAmortizationSystem = (value: unknown): FinancialLoanAmortizationSystem =>
  amortizationSystems.has(value as FinancialLoanAmortizationSystem)
    ? value as FinancialLoanAmortizationSystem
    : 'UNKNOWN'

function LoanForm(props: LoanFormProps) {
  const { initial, onCancel } = props
  const isEditing = Boolean(initial)
  const errorPrefix = useId()
  const titleRef = useRef<HTMLInputElement>(null)
  const institutionRef = useRef<HTMLInputElement>(null)
  const financedAmountRef = useRef<HTMLInputElement>(null)
  const firstDueDateRef = useRef<HTMLInputElement>(null)
  const installmentCountRef = useRef<HTMLInputElement>(null)
  const initialInstallmentAmountRef = useRef<HTMLInputElement>(null)
  const submitLocked = useRef(false)
  const [title, setTitle] = useState(() => safeText(initial?.title))
  const [institution, setInstitution] = useState(() => institutionInputValue(initial?.institution, !initial))
  const [contractNumber, setContractNumber] = useState(() => safeText(initial?.contractNumber))
  const [financedAmount, setFinancedAmount] = useState(currencyInputValue(initial?.financedAmount))
  const [firstDueDate, setFirstDueDate] = useState(() => safeText(initial?.firstDueDate))
  const [installmentCount, setInstallmentCount] = useState(() => initial && Number.isInteger(initial.installmentCount) && initial.installmentCount > 0 ? String(initial.installmentCount) : '')
  const [initialInstallmentAmount, setInitialInstallmentAmount] = useState('')
  const [amortizationSystem, setAmortizationSystem] = useState<FinancialLoanAmortizationSystem>(() => normalizeAmortizationSystem(initial?.amortizationSystem))
  const [notes, setNotes] = useState(() => safeText(initial?.notes))
  const [errors, setErrors] = useState<LoanFormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const schedulePreview = useMemo(() => {
    if (isEditing || !isValidISODate(firstDueDate)) return null
    const count = Number(installmentCount)
    if (!Number.isInteger(count) || count < 1 || count > MAX_MONTHLY_INSTALLMENTS) return null
    const lastDueDate = addMonthsClamped(firstDueDate, count - 1)
    if (!lastDueDate) return null
    const installmentAmount = parseOptionalCurrency(initialInstallmentAmount)
    return {
      count,
      firstDueDate,
      lastDueDate,
      installmentAmount: installmentAmount !== null && Number.isFinite(installmentAmount) && installmentAmount > 0
        ? installmentAmount
        : null,
    }
  }, [firstDueDate, initialInstallmentAmount, installmentCount, isEditing])

  function focusFirstInvalid(nextErrors: LoanFormErrors) {
    if (nextErrors.title) titleRef.current?.focus()
    else if (nextErrors.institution) institutionRef.current?.focus()
    else if (nextErrors.financedAmount) financedAmountRef.current?.focus()
    else if (nextErrors.firstDueDate) firstDueDateRef.current?.focus()
    else if (nextErrors.installmentCount) installmentCountRef.current?.focus()
    else if (nextErrors.initialInstallmentAmount) initialInstallmentAmountRef.current?.focus()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLocked.current) return

    const parsedFinancedAmount = parseOptionalCurrency(financedAmount)
    const parsedInitialInstallmentAmount = parseOptionalCurrency(initialInstallmentAmount)
    const parsedInstallmentCount = Number(installmentCount)
    const nextErrors: LoanFormErrors = {}

    if (!title.trim()) nextErrors.title = 'Informe um nome para o financiamento.'
    if (!institution.trim()) nextErrors.institution = 'Informe a instituição financeira.'
    if (!isEditing && parsedFinancedAmount !== null && (!Number.isFinite(parsedFinancedAmount) || parsedFinancedAmount <= 0)) {
      nextErrors.financedAmount = 'Informe um valor financiado maior que zero.'
    }

    if (!isEditing) {
      if (!isValidISODate(firstDueDate)) nextErrors.firstDueDate = 'Informe o primeiro vencimento.'
      if (!Number.isInteger(parsedInstallmentCount) || parsedInstallmentCount < 1 || parsedInstallmentCount > MAX_MONTHLY_INSTALLMENTS) {
        nextErrors.installmentCount = `Informe uma quantidade entre 1 e ${MAX_MONTHLY_INSTALLMENTS} parcelas.`
      }
      if (parsedInitialInstallmentAmount !== null && (!Number.isFinite(parsedInitialInstallmentAmount) || parsedInitialInstallmentAmount <= 0)) {
        nextErrors.initialInstallmentAmount = 'Informe um valor mensal maior que zero.'
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      focusFirstInvalid(nextErrors)
      return
    }

    submitLocked.current = true
    setSubmitting(true)
    const now = new Date().toISOString()

    if (initial && props.onUpdate) {
      props.onUpdate({
        title: title.trim(),
        institution: normalizeInstitution(institution),
        contractNumber: contractNumber.trim() || null,
        amortizationSystem,
        notes: notes.trim(),
        updatedAt: now,
      })
      submitLocked.current = false
      setSubmitting(false)
      return
    }

    if (!initial && props.onCreate) {
      const schedule = createManualLoanSchedule({
        propertyId: props.propertyId,
        title,
        institution,
        contractNumber,
        firstDueDate,
        financedAmount: parsedFinancedAmount,
        installmentCount: parsedInstallmentCount,
        initialInstallmentAmount: parsedInitialInstallmentAmount,
        amortizationSystem,
        notes,
      })

      if (schedule) {
        props.onCreate(schedule)
        submitLocked.current = false
        setSubmitting(false)
        return
      }
    }

    submitLocked.current = false
    setSubmitting(false)
    setErrors({ form: 'Não foi possível preparar este financiamento. Revise os dados e tente novamente.' })
  }

  return (
    <Card className="border-primary/20 shadow-book-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
            <Landmark className="size-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="font-display text-xl"><h2>{isEditing ? 'Editar financiamento' : 'Adicionar financiamento'}</h2></CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditing
                ? 'Atualize os dados gerais sem alterar o cronograma já registrado.'
                : 'Registre o contrato e prepare o primeiro cronograma de parcelas da casa.'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
          {errors.form ? <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive sm:col-span-2">{errors.form}</p> : null}

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Nome do financiamento</span>
            <Input
              ref={titleRef}
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Ex.: Financiamento Caixa"
              autoComplete="off"
              aria-required="true"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? `${errorPrefix}-title` : undefined}
            />
            {errors.title ? <span id={`${errorPrefix}-title`} className="block text-xs text-destructive">{errors.title}</span> : null}
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium">Instituição</span>
            <Input
              ref={institutionRef}
              value={institution}
              onChange={event => setInstitution(event.target.value)}
              placeholder="Ex.: Caixa"
              autoComplete="organization"
              aria-required="true"
              aria-invalid={Boolean(errors.institution)}
              aria-describedby={errors.institution ? `${errorPrefix}-institution` : undefined}
            />
            {errors.institution ? <span id={`${errorPrefix}-institution`} className="block text-xs text-destructive">{errors.institution}</span> : null}
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium">Número do contrato <span className="font-normal text-muted-foreground">(opcional)</span></span>
            <Input value={contractNumber} onChange={event => setContractNumber(event.target.value)} autoComplete="off" />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium">Valor financiado <span className="font-normal text-muted-foreground">{isEditing ? '(preservado)' : '(opcional)'}</span></span>
            <Input
              ref={financedAmountRef}
              inputMode="decimal"
              value={financedAmount}
              onChange={event => setFinancedAmount(event.target.value)}
              placeholder="R$ 0,00"
              disabled={isEditing}
              aria-invalid={Boolean(errors.financedAmount)}
              aria-describedby={[
                isEditing ? `${errorPrefix}-financed-amount-help` : null,
                errors.financedAmount ? `${errorPrefix}-financed-amount` : null,
              ].filter(Boolean).join(' ') || undefined}
            />
            {isEditing ? <span id={`${errorPrefix}-financed-amount-help`} className="block text-xs text-muted-foreground">O valor original é preservado para não alterar saldos nem parcelas existentes.</span> : null}
            {errors.financedAmount ? <span id={`${errorPrefix}-financed-amount`} className="block text-xs text-destructive">{errors.financedAmount}</span> : null}
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium">Sistema de amortização</span>
            <select className={fieldClass} value={amortizationSystem} onChange={event => setAmortizationSystem(event.target.value as FinancialLoanAmortizationSystem)}>
              {amortizationOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          {!initial ? <>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Primeiro vencimento</span>
              <Input
                ref={firstDueDateRef}
                type="date"
                value={firstDueDate}
                onChange={event => setFirstDueDate(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.firstDueDate)}
                aria-describedby={errors.firstDueDate ? `${errorPrefix}-first-due-date` : undefined}
              />
              {errors.firstDueDate ? <span id={`${errorPrefix}-first-due-date`} className="block text-xs text-destructive">{errors.firstDueDate}</span> : null}
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium">Quantidade de parcelas</span>
              <Input
                ref={installmentCountRef}
                type="number"
                min={1}
                max={MAX_MONTHLY_INSTALLMENTS}
                step={1}
                value={installmentCount}
                onChange={event => setInstallmentCount(event.target.value)}
                aria-required="true"
                aria-invalid={Boolean(errors.installmentCount)}
                aria-describedby={errors.installmentCount ? `${errorPrefix}-installment-count` : undefined}
              />
              {errors.installmentCount ? <span id={`${errorPrefix}-installment-count`} className="block text-xs text-destructive">{errors.installmentCount}</span> : null}
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium">Valor mensal inicial <span className="font-normal text-muted-foreground">(opcional)</span></span>
              <Input
                ref={initialInstallmentAmountRef}
                inputMode="decimal"
                value={initialInstallmentAmount}
                onChange={event => setInitialInstallmentAmount(event.target.value)}
                placeholder="R$ 0,00"
                aria-invalid={Boolean(errors.initialInstallmentAmount)}
                aria-describedby={errors.initialInstallmentAmount ? `${errorPrefix}-initial-installment-amount` : undefined}
              />
              {errors.initialInstallmentAmount ? <span id={`${errorPrefix}-initial-installment-amount`} className="block text-xs text-destructive">{errors.initialInstallmentAmount}</span> : null}
            </label>
          </> : (
            <div className="rounded-lg bg-secondary/50 p-4 sm:col-span-2">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">Cronograma preservado</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {Number.isInteger(initial.installmentCount) && initial.installmentCount > 0 ? `${initial.installmentCount} parcelas` : 'Cronograma existente'} desde {isValidISODate(initial.firstDueDate) ? formatDateLongBR(initial.firstDueDate) : 'uma data não disponível'}. Alterações aqui não recalculam as parcelas existentes.
                  </p>
                </div>
              </div>
            </div>
          )}

          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium">Observações <span className="font-normal text-muted-foreground">(opcional)</span></span>
            <Textarea value={notes} onChange={event => setNotes(event.target.value)} className="min-h-24" placeholder="Informações importantes sobre o contrato ou o cronograma." />
          </label>

          {schedulePreview ? (
            <div className="rounded-lg border border-primary/15 bg-accent/40 p-4 sm:col-span-2" aria-live="polite">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-medium">{schedulePreview.count} {schedulePreview.count === 1 ? 'parcela mensal' : 'parcelas mensais'}</p>
                  <p className="mt-1 text-muted-foreground">
                    De {formatDateLongBR(schedulePreview.firstDueDate)} até {formatDateLongBR(schedulePreview.lastDueDate)}.
                  </p>
                  {schedulePreview.installmentAmount !== null ? <p className="mt-1 text-muted-foreground">
                    Valor inicial de {formatCurrencyBRL(schedulePreview.installmentAmount)} · total previsto simples de <span className="font-medium text-foreground">{formatCurrencyBRL(schedulePreview.installmentAmount * schedulePreview.count)}</span>.
                  </p> : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{isEditing ? 'Salvar alterações' : 'Criar financiamento'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export { LoanForm }
