import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Chapter, FinancialCommitment } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  addMonthsClamped,
  createMonthlyCommitmentSeries,
  MAX_MONTHLY_INSTALLMENTS,
  MIN_MONTHLY_INSTALLMENTS,
} from '@/features/financial/recurrence'
import {
  financialCategories,
  getCommitmentInstallmentLabel,
  getLocalFinancialDate,
  isValidISODate,
  normalizeCommitmentStatus,
  parseCurrencyBRL,
} from '@/features/financial/presentation'
import { getConfiguredCategoryOptions } from '@/features/settings/categories'
import { createEntityId, formatCurrencyBRL } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

const fieldClass = 'h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

type Errors = Partial<Record<'title' | 'amount' | 'date' | 'category' | 'status' | 'installmentCount', string>>

type CommitmentFormProps = {
  chapters: Chapter[]
  initial?: FinancialCommitment
  onCancel: () => void
  onSave: (commitments: FinancialCommitment[]) => void
}

const formatMonthAndYear = (date: string) => new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
}).format(new Date(`${date}T12:00:00`))

function CommitmentForm({ chapters, initial, onCancel, onSave }: CommitmentFormProps) {
  const { state } = useAppStore()
  const errorIdPrefix = useId()
  const storedInitialCategory = financialCategories.includes(initial?.category as typeof financialCategories[number])
    ? initial!.category
    : initial
      ? 'Outros'
      : undefined
  const categoryOptions = getConfiguredCategoryOptions(
    state.settings,
    'financial',
    financialCategories,
    id => id,
    storedInitialCategory,
  )
  const [title, setTitle] = useState(initial?.title ?? '')
  const [amount, setAmount] = useState(initial ? initial.amount.toFixed(2).replace('.', ',') : '')
  const [dueDate, setDueDate] = useState(() => initial?.dueDate ?? getLocalFinancialDate())
  const [category, setCategory] = useState(storedInitialCategory ?? categoryOptions[0]?.id ?? 'Aquisição')
  const [status, setStatus] = useState<FinancialCommitment['status']>(normalizeCommitmentStatus(initial?.status) ?? 'scheduled')
  const [chapterId, setChapterId] = useState(initial?.chapterId ?? '')
  const [repeatsMonthly, setRepeatsMonthly] = useState(false)
  const [installmentCount, setInstallmentCount] = useState('12')
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const submitLocked = useRef(false)
  const missingChapter = initial?.chapterId && !chapters.some(chapter => chapter.id === initial.chapterId)

  const preview = useMemo(() => {
    if (!repeatsMonthly || !isValidISODate(dueDate)) return null

    const parsedAmount = parseCurrencyBRL(amount)
    const parsedCount = Number(installmentCount)
    if (
      !Number.isFinite(parsedAmount)
      || parsedAmount <= 0
      || !Number.isInteger(parsedCount)
      || parsedCount < MIN_MONTHLY_INSTALLMENTS
      || parsedCount > MAX_MONTHLY_INSTALLMENTS
    ) return null

    const lastDueDate = addMonthsClamped(dueDate, parsedCount - 1)
    if (!lastDueDate) return null

    return {
      count: parsedCount,
      amount: parsedAmount,
      firstMonth: formatMonthAndYear(dueDate),
      lastMonth: formatMonthAndYear(lastDueDate),
      total: parsedAmount * parsedCount,
    }
  }, [amount, dueDate, installmentCount, repeatsMonthly])

  function finishSave(commitments: FinancialCommitment[]) {
    if (submitLocked.current) return
    submitLocked.current = true
    setSubmitting(true)
    try {
      onSave(commitments)
    } catch (error) {
      submitLocked.current = false
      setSubmitting(false)
      throw error
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const parsedAmount = parseCurrencyBRL(amount)
    const parsedCount = Number(installmentCount)
    const nextErrors: Errors = {}

    if (!title.trim()) nextErrors.title = 'Informe um título para este compromisso.'
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) nextErrors.amount = 'Informe um valor maior que zero.'
    if (!isValidISODate(dueDate)) nextErrors.date = 'Informe a data de vencimento.'
    if (!categoryOptions.some(option => option.id === category)) nextErrors.category = 'Escolha uma categoria.'
    if (!normalizeCommitmentStatus(status)) nextErrors.status = 'Escolha um status válido.'
    if (repeatsMonthly && !installmentCount.trim()) nextErrors.installmentCount = 'Informe a quantidade de parcelas.'
    else if (repeatsMonthly && (!Number.isInteger(parsedCount) || parsedCount < MIN_MONTHLY_INSTALLMENTS)) nextErrors.installmentCount = 'A quantidade deve ser de pelo menos 2 parcelas.'
    else if (repeatsMonthly && parsedCount > MAX_MONTHLY_INSTALLMENTS) nextErrors.installmentCount = `A quantidade pode ter no máximo ${MAX_MONTHLY_INSTALLMENTS} parcelas.`

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    if (repeatsMonthly && !initial) {
      const commitments = createMonthlyCommitmentSeries({
        title: title.trim(),
        amount: parsedAmount,
        firstDueDate: dueDate,
        installmentCount: parsedCount,
        status,
        category,
        chapterId: chapterId || null,
      })

      if (!commitments.length) {
        setErrors(current => ({ ...current, installmentCount: 'Não foi possível gerar as parcelas. Revise os dados informados.' }))
        return
      }

      finishSave(commitments)
      return
    }

    const now = new Date().toISOString()
    finishSave([{
      ...initial,
      id: initial?.id ?? createEntityId('commitment'),
      title: title.trim(),
      amount: parsedAmount,
      dueDate,
      status,
      category,
      chapterId: chapterId || null,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    }])
  }

  const installmentLabel = initial ? getCommitmentInstallmentLabel(initial) : null

  return (
    <form className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-2" onSubmit={submit} noValidate>
      {installmentLabel ? (
        <div className="rounded-md bg-secondary/60 px-3 py-2 text-sm sm:col-span-2">
          <p className="font-medium">Editando apenas esta parcela · {installmentLabel}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">As demais parcelas da série permanecerão inalteradas.</p>
        </div>
      ) : null}

      <label className="space-y-1.5 sm:col-span-2">
        <span className="text-sm font-medium">Título</span>
        <Input value={title} onChange={event => setTitle(event.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? `${errorIdPrefix}-title` : undefined} />
        {errors.title ? <span id={`${errorIdPrefix}-title`} className="block text-xs text-destructive">{errors.title}</span> : null}
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium">{repeatsMonthly ? 'Valor mensal' : 'Valor'}</span>
        <Input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="R$ 0,00" aria-invalid={!!errors.amount} aria-describedby={errors.amount ? `${errorIdPrefix}-amount` : undefined} />
        {errors.amount ? <span id={`${errorIdPrefix}-amount`} className="block text-xs text-destructive">{errors.amount}</span> : null}
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium">{repeatsMonthly ? 'Primeiro vencimento' : 'Vencimento'}</span>
        <Input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} aria-invalid={!!errors.date} aria-describedby={errors.date ? `${errorIdPrefix}-date` : undefined} />
        {errors.date ? <span id={`${errorIdPrefix}-date`} className="block text-xs text-destructive">{errors.date}</span> : null}
      </label>

      {!initial ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 sm:col-span-2">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-primary"
            checked={repeatsMonthly}
            onChange={event => {
              setRepeatsMonthly(event.target.checked)
              setErrors(current => ({ ...current, installmentCount: undefined }))
            }}
          />
          <span>
            <span className="block text-sm font-medium">Repetir mensalmente</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Crie uma parcela para cada mês, mantendo cada compromisso independente.</span>
          </span>
        </label>
      ) : null}

      {repeatsMonthly ? (
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Quantidade de parcelas</span>
          <Input
            type="number"
            min={MIN_MONTHLY_INSTALLMENTS}
            max={MAX_MONTHLY_INSTALLMENTS}
            step={1}
            value={installmentCount}
            onChange={event => setInstallmentCount(event.target.value)}
            aria-invalid={!!errors.installmentCount}
            aria-describedby={errors.installmentCount ? `${errorIdPrefix}-installment-count` : undefined}
          />
          {errors.installmentCount ? <span id={`${errorIdPrefix}-installment-count`} className="block text-xs text-destructive">{errors.installmentCount}</span> : null}
        </label>
      ) : null}

      {preview ? (
        <div className="rounded-lg bg-secondary/60 p-3 sm:col-span-2" aria-live="polite">
          <p className="text-sm font-medium">{preview.count} parcelas de {formatCurrencyBRL(preview.amount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">De {preview.firstMonth} até {preview.lastMonth}</p>
          <p className="mt-1 text-sm">Total previsto: <span className="font-semibold">{formatCurrencyBRL(preview.total)}</span></p>
        </div>
      ) : null}

      <label className="space-y-1.5">
        <span className="text-sm font-medium">Categoria</span>
        <select className={fieldClass} value={category} onChange={event => setCategory(event.target.value)} aria-invalid={!!errors.category} aria-describedby={errors.category ? `${errorIdPrefix}-category` : undefined}>
          {categoryOptions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        {errors.category ? <span id={`${errorIdPrefix}-category`} className="block text-xs text-destructive">{errors.category}</span> : null}
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium">Status</span>
        <select className={fieldClass} value={status} onChange={event => setStatus(event.target.value as FinancialCommitment['status'])} aria-invalid={!!errors.status} aria-describedby={errors.status ? `${errorIdPrefix}-status` : undefined}>
          <option value="pending">Próximo</option>
          <option value="scheduled">Agendado</option>
          <option value="future">Futuro</option>
          <option value="paid">Pago</option>
          <option value="cancelled">Cancelado</option>
        </select>
        {errors.status ? <span id={`${errorIdPrefix}-status`} className="block text-xs text-destructive">{errors.status}</span> : null}
      </label>

      <label className="space-y-1.5 sm:col-span-2">
        <span className="text-sm font-medium">Capítulo relacionado</span>
        <select className={fieldClass} value={chapterId} onChange={event => setChapterId(event.target.value)}>
          <option value="">Nenhum capítulo</option>
          {missingChapter ? <option value={initial.chapterId!}>Capítulo relacionado não disponível</option> : null}
          {chapters.map(chapter => <option key={chapter.id} value={chapter.id}>{chapter.title} · {chapter.date}</option>)}
        </select>
      </label>

      <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>{initial ? 'Salvar alterações' : repeatsMonthly ? 'Criar parcelas' : 'Salvar compromisso'}</Button>
      </div>
    </form>
  )
}

export { CommitmentForm }
