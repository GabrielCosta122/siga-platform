import { Server } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { AppState } from '@/store/app-state'
import {
  formatSettingsUpdatedAt,
  getSettingsSchemaVersion,
  SIGA_PROTOTYPE_VERSION,
} from '@/features/settings/presentation'

export type SettingsStatusCardProps = {
  state: AppState
}

function SettingsStatusCard({ state }: SettingsStatusCardProps) {
  const updatedAt = formatSettingsUpdatedAt(state.updatedAt)
  const schemaVersion = getSettingsSchemaVersion(state)

  return (
    <Card size="sm" className="shadow-book-xs">
      <CardContent className="flex flex-wrap items-center gap-3">
        <Server aria-hidden="true" className="size-5 text-success" />
        <div>
          <p className="text-sm font-medium">Status do SIGA</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Sistema disponível · última atualização {updatedAt} · armazenamento local ativo · schema v{schemaVersion} · SIGA {SIGA_PROTOTYPE_VERSION}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export { SettingsStatusCard }
