import { useRef, useState } from 'react'
import { FileSpreadsheet, LoaderCircle, Upload, X } from 'lucide-react'
import type { ManualLoanSchedule } from '@/features/financial/loan-schedule'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatFinancialDate } from '@/features/financial/presentation'
import {
  createImportedFinancingSchedule,
  financingImportId,
  readFinancingCharges,
  type FinancingChargesImportResult,
} from '@/features/financial/import-financing-charges'
import { formatCurrencyBRL } from '@/lib/utils'

type FinancingChargesImportProps = {
  propertyId: string
  existingLoanIds: string[]
  onClose: () => void
  onImport: (schedule: ManualLoanSchedule) => void
}

function FinancingChargesImport({ propertyId, existingLoanIds, onClose, onImport }: FinancingChargesImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<FinancingChargesImportResult | null>(null)
  const [title, setTitle] = useState('Financiamento habitacional')
  const [institution, setInstitution] = useState('Caixa')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const total = result?.charges.reduce((sum, item) => sum + item.amount, 0) ?? 0
  const importId = result ? financingImportId(propertyId, result.charges) : null
  const alreadyImported = importId ? existingLoanIds.includes(importId) : false

  async function selectFile(file?: File) {
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setError('')
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Selecione um arquivo no formato .xlsx.')
      return
    }
    setLoading(true)
    try { setResult(await readFinancingCharges(file)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível ler a planilha.') }
    finally { setLoading(false) }
  }

  function confirmImport() {
    if (!result || alreadyImported) return
    if (!title.trim() || !institution.trim()) {
      setError('Informe o nome do financiamento e a instituição financeira.')
      return
    }
    const schedule = createImportedFinancingSchedule({
      propertyId,
      title,
      institution,
      charges: result.charges,
    })
    if (!schedule) {
      setError('Não foi possível preparar o cronograma. Verifique se há cobranças duplicadas na planilha.')
      return
    }
    onImport(schedule)
  }

  const preview = result?.charges.slice(0, 5) ?? []
  return (
    <Card className="border-primary/20 shadow-book-sm">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div><CardTitle className="font-display text-xl">Importar financiamento</CardTitle><CardDescription>O SIGA criará um financiamento usando somente as colunas Vencimento e Encargo. O arquivo permanece neste dispositivo.</CardDescription></div>
        <Button type="button" variant="ghost" size="icon" aria-label="Fechar importação" onClick={onClose}><X aria-hidden="true" /></Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={event => void selectFile(event.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 text-left transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-book-xs"><FileSpreadsheet aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="block font-medium">{fileName || 'Selecionar planilha XLSX'}</span><span className="mt-1 block text-sm text-muted-foreground">As demais colunas e abas serão ignoradas.</span></span>
          {loading ? <LoaderCircle className="size-5 animate-spin text-primary" aria-label="Lendo planilha" /> : <Upload className="size-5 text-primary" aria-hidden="true" />}
        </button>
        {error ? <Alert variant="destructive"><AlertTitle>Não foi possível importar</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
        {alreadyImported ? <Alert><AlertTitle>Financiamento já importado</AlertTitle><AlertDescription>Este cronograma já existe no imóvel atual e não será duplicado.</AlertDescription></Alert> : null}
        {result ? <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5"><span className="text-sm font-medium">Nome do financiamento</span><Input value={title} onChange={event => setTitle(event.target.value)} /></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Instituição financeira</span><Input value={institution} onChange={event => setInstitution(event.target.value)} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-secondary/70 p-4"><p className="text-xs text-muted-foreground">Parcelas</p><p className="mt-1 text-lg font-semibold">{result.charges.length}</p></div>
            <div className="rounded-lg bg-secondary/70 p-4"><p className="text-xs text-muted-foreground">Total dos encargos</p><p className="mt-1 text-lg font-semibold">{formatCurrencyBRL(total)}</p></div>
            <div className="rounded-lg bg-secondary/70 p-4"><p className="text-xs text-muted-foreground">Linhas ignoradas</p><p className="mt-1 text-lg font-semibold">{result.ignoredRows}</p></div>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground"><span>Vencimento</span><span>Valor do encargo</span></div>
            {preview.map(item => <div key={`${item.rowNumber}-${item.dueDate}`} className="grid grid-cols-[1fr_auto] gap-4 border-b px-4 py-3 text-sm last:border-b-0"><span>{formatFinancialDate(item.dueDate)}</span><span className="font-medium">{formatCurrencyBRL(item.amount)}</span></div>)}
            {result.charges.length > preview.length ? <p className="px-4 py-3 text-center text-xs text-muted-foreground">Mais {result.charges.length - preview.length} parcelas serão importadas.</p> : null}
          </div>
          <p className="text-xs text-muted-foreground">Aba encontrada: {result.sheetName}. O cronograma preservará exatamente as datas presentes na planilha.{result.ignoredRows ? ` ${result.ignoredRows} linhas inválidas serão ignoradas.` : ''}</p>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="button" disabled={alreadyImported} onClick={confirmImport}><Upload aria-hidden="true" />Criar financiamento</Button></div>
        </div> : null}
      </CardContent>
    </Card>
  )
}

export { FinancingChargesImport }
