import { useEffect, useRef, useState } from 'react'
import { Download, FileUp, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { AppState } from '@/store/app-state'
import { downloadAppStateExport } from '@/features/settings/data-export'
import { getSettingsDataSummary } from '@/features/settings/presentation'

export type DataPrivacyPanelProps = {
  onFeedback?: (message: string) => void
  onReset: () => void
  state: AppState
}

const numberFormatter = new Intl.NumberFormat('pt-BR')

function DataPrivacyPanel({ onFeedback, onReset, state }: DataPrivacyPanelProps) {
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [exportError, setExportError] = useState('')
  const resetTriggerRef = useRef<HTMLButtonElement>(null)
  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null)
  const shouldRestoreResetFocus = useRef(false)
  const summary = getSettingsDataSummary(state)

  useEffect(() => {
    if (confirmingReset) confirmationHeadingRef.current?.focus()
    if (!confirmingReset && shouldRestoreResetFocus.current) {
      resetTriggerRef.current?.focus()
      shouldRestoreResetFocus.current = false
    }
  }, [confirmingReset])

  function exportData() {
    setExportError('')
    const result = downloadAppStateExport(state)
    if (!result.ok) {
      setExportError(result.error)
      return
    }
    onFeedback?.('Cópia dos dados exportada.')
  }

  function cancelReset() {
    shouldRestoreResetFocus.current = true
    setConfirmingReset(false)
  }

  function resetData() {
    try {
      onReset()
      shouldRestoreResetFocus.current = true
      setConfirmingReset(false)
      onFeedback?.('Dados iniciais restaurados.')
    } catch {
      setExportError('Não foi possível restaurar os dados iniciais agora.')
    }
  }

  return (
    <section aria-labelledby="settings-data-heading">
      <h2 id="settings-data-heading" className="font-display text-2xl font-semibold">Dados e privacidade</h2>
      <p className="mt-1 text-sm text-muted-foreground">O que fica guardado na história do seu lar.</p>

      <Card className="mt-5 shadow-book-xs">
        <CardContent className="space-y-5 pt-6">
          <p className="text-sm text-muted-foreground">
            {numberFormatter.format(summary.chapters)} capítulos · {numberFormatter.format(summary.documents)} documentos ·{' '}
            {numberFormatter.format(summary.assets)} itens · {numberFormatter.format(summary.maintenance)} manutenções ·{' '}
            {numberFormatter.format(summary.photos)} fotos
          </p>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={exportData}>
                <Download aria-hidden="true" />
                Exportar dados
              </Button>
              <Button type="button" variant="outline" disabled>
                <FileUp aria-hidden="true" />
                Importar dados · Em breve
              </Button>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              O backup de dados não inclui os arquivos físicos armazenados neste navegador.
            </p>
            {exportError ? <p role="alert" className="text-sm text-destructive">{exportError}</p> : null}
          </div>

          {confirmingReset ? (
            <div
              role="alertdialog"
              aria-labelledby="settings-reset-title"
              aria-describedby="settings-reset-description"
              className="rounded-lg border border-destructive/20 bg-destructive/5 p-4"
              onKeyDown={event => {
                if (event.key === 'Escape') cancelReset()
              }}
            >
              <h3
                ref={confirmationHeadingRef}
                id="settings-reset-title"
                tabIndex={-1}
                className="font-display text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                Restaurar dados iniciais?
              </h3>
              <p id="settings-reset-description" className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Alterações realizadas neste navegador serão substituídas pelos dados iniciais do SIGA.
              </p>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={cancelReset}>Cancelar</Button>
                <Button type="button" variant="destructive" onClick={resetData}>Restaurar dados</Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="font-medium text-destructive">Restaurar o protótipo</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Volte aos dados iniciais sem apagar silenciosamente os arquivos físicos deste navegador.
              </p>
              <Button
                ref={resetTriggerRef}
                type="button"
                variant="ghost"
                className="mt-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmingReset(true)}
              >
                <RotateCcw aria-hidden="true" />
                Restaurar dados iniciais
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export { DataPrivacyPanel }
