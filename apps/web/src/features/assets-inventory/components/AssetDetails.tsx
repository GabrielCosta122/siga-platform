import { createElement } from 'react'
import {
  Edit3,
  FileText,
  Landmark,
  Link as LinkIcon,
  MoveRight,
  Star,
  Trash2,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router'
import type { Asset, EntityId, MaintenanceRecord, MaintenanceRoutine } from '@/domain/types'
import type { AppState } from '@/store/app-state'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatAssetDate,
  formatAssetDateTime,
  formatAssetWarranty,
  getAssetCategoryLabel,
  getAssetIconForItem,
  getAssetKindLabel,
  getAssetStatusLabel,
  getSafeAssetValue,
} from '@/features/assets-inventory/presentation'
import { formatCurrencyBRL } from '@/lib/utils'

export type AssetDetailsProps = {
  item: Asset
  state: AppState
  moving: boolean
  confirmingDelete: boolean
  onEdit: () => void
  onMove: () => void
  onCancelMove: () => void
  onMoveToRoom: (roomId: EntityId) => void
  onRegisterMaintenance: () => void
  onToggleImportant: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}

type FutureMaintenance =
  | { kind: 'record'; date: string; item: MaintenanceRecord }
  | { kind: 'routine'; date: string; item: MaintenanceRoutine }

const safeIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []

const safeText = (value: unknown, fallback = '—') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const getDateTime = (value: unknown) => {
  if (typeof value !== 'string') return Number.NaN
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/)
  if (!match) return Number.NaN
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date.getTime()
    : Number.NaN
}

function getNextMaintenance(
  records: MaintenanceRecord[],
  routines: MaintenanceRoutine[],
): FutureMaintenance | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTime = today.getTime()

  const futureRecords: FutureMaintenance[] = records
    .filter(record => !['completed', 'cancelled'].includes(record.status))
    .map(record => ({ kind: 'record' as const, date: record.scheduledDate, item: record }))
  const futureRoutines: FutureMaintenance[] = routines
    .filter(routine => routine.active)
    .map(routine => ({ kind: 'routine' as const, date: routine.nextDate, item: routine }))

  return [...futureRecords, ...futureRoutines]
    .filter(candidate => {
      const time = getDateTime(candidate.date)
      return Number.isFinite(time) && time >= todayTime
    })
    .sort((left, right) => getDateTime(left.date) - getDateTime(right.date))[0] ?? null
}

function AssetDetails({
  item,
  state,
  moving,
  confirmingDelete,
  onEdit,
  onMove,
  onCancelMove,
  onMoveToRoom,
  onRegisterMaintenance,
  onToggleImportant,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: AssetDetailsProps) {
  const room = state.rooms.find(candidate => candidate.id === item.roomId)
  const chapter = state.chapters.find(candidate => candidate.id === item.chapterId)
  const requestedDocumentIds = safeIds(item.documentIds)
  const documents = state.documents.filter(document =>
    requestedDocumentIds.includes(document.id) || document.assetId === item.id,
  )
  const missingDocumentCount = requestedDocumentIds.filter(
    id => !state.documents.some(document => document.id === id),
  ).length
  const transaction = state.financialTransactions.find(candidate => candidate.id === item.financialTransactionId)
    ?? state.financialTransactions.find(candidate => candidate.assetId === item.id)
  const requestedMaintenanceIds = safeIds(item.maintenanceIds)
  const maintenanceRecords = state.maintenanceRecords.filter(record =>
    requestedMaintenanceIds.includes(record.id) || record.assetId === item.id,
  )
  const maintenanceRoutines = state.maintenanceRoutines.filter(routine => routine.assetId === item.id)
  const nextMaintenance = getNextMaintenance(maintenanceRecords, maintenanceRoutines)
  const availableRooms = [...state.rooms]
    .filter(candidate => (candidate.active && candidate.type !== 'general') || candidate.id === item.roomId)
    .sort((left, right) => left.order - right.order)

  return (
    <Card className="shadow-book-sm">
      <CardHeader>
        <CardTitle className="font-display text-lg">Detalhes do item</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <span className="flex size-12 items-center justify-center rounded-md bg-secondary text-primary">
          {createElement(getAssetIconForItem(item), {
            className: 'size-6',
            'aria-hidden': true,
          })}
        </span>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{safeText(item.name, 'Item sem nome')}</p>
            {item.important ? <Badge variant="secondary">Importante</Badge> : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge variant="outline">{getAssetKindLabel(item.kind)}</Badge>
            <Badge variant="outline">{getAssetStatusLabel(item.status)}</Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {safeText(item.description, 'Sem descrição.')}
          </p>
        </div>

        <dl className="space-y-2 border-y py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Ambiente</dt>
            <dd className="text-right">
              {room?.name ?? (item.roomId ? 'Ambiente não disponível' : 'Sem ambiente')}
              {room && !room.active ? ' (arquivado)' : ''}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Categoria</dt>
            <dd className="text-right">{getAssetCategoryLabel(item.category)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Valor</dt>
            <dd className="text-right font-medium">{formatCurrencyBRL(getSafeAssetValue(item.value))}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Marca</dt>
            <dd className="text-right">{safeText(item.brand)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Modelo</dt>
            <dd className="text-right">{safeText(item.model)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Número de série</dt>
            <dd className="text-right">{safeText(item.serialNumber)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Compra</dt>
            <dd className="text-right">{formatAssetDate(item.purchaseDate)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Instalação</dt>
            <dd className="text-right">{formatAssetDate(item.installationDate)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Fornecedor</dt>
            <dd className="text-right">{safeText(item.supplier)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Garantia</dt>
            <dd className="text-right">{formatAssetWarranty(item.warrantyEndDate)}</dd>
          </div>
        </dl>

        <div className="space-y-2 text-xs text-muted-foreground">
          {chapter ? (
            <p>
              Capítulo:{' '}
              <Link to={`/livro-da-casa/${chapter.id}`} className="text-primary hover:underline">
                {chapter.title}
              </Link>
            </p>
          ) : item.chapterId ? (
            <p>Capítulo relacionado não disponível</p>
          ) : (
            <p>Sem capítulo relacionado</p>
          )}

          {documents.length ? (
            <div>
              <p className="mb-1">Documentos relacionados</p>
              <ul className="space-y-1">
                {documents.map(document => (
                  <li key={document.id}>
                    <Link to="/documentos" className="flex items-center gap-1 text-primary hover:underline">
                      <FileText className="size-3 shrink-0" aria-hidden="true" />
                      {document.name || 'Documento sem nome'}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Sem documentos relacionados</p>
          )}
          {missingDocumentCount ? <p>{missingDocumentCount} documento relacionado não disponível</p> : null}

          {transaction ? (
            <p>
              Movimentação:{' '}
              <Link to="/financeiro" className="text-primary hover:underline">
                {transaction.title || 'Movimentação sem título'} ·{' '}
                {formatCurrencyBRL(
                  typeof transaction.amount === 'number' && Number.isFinite(transaction.amount)
                    ? transaction.amount
                    : 0,
                )}
              </Link>
            </p>
          ) : item.financialTransactionId ? (
            <p>Movimentação financeira relacionada não disponível</p>
          ) : (
            <p>Sem movimentação financeira relacionada</p>
          )}

          <div>
            <p className="mb-1">Manutenções relacionadas</p>
            {maintenanceRecords.length ? (
              <ul className="space-y-1">
                {maintenanceRecords.map(record => (
                  <li key={record.id}>
                    <Link to="/manutencao" className="flex items-center gap-1 text-primary hover:underline">
                      <Wrench className="size-3 shrink-0" aria-hidden="true" />
                      {record.title || 'Manutenção sem título'}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma manutenção registrada</p>
            )}
          </div>

          {nextMaintenance ? (
            <p>
              Próxima manutenção:{' '}
              <Link to="/manutencao" className="text-primary hover:underline">
                {nextMaintenance.item.title || 'Manutenção sem título'} · {formatAssetDate(nextMaintenance.date)}
              </Link>
            </p>
          ) : (
            <p>Nenhuma manutenção futura relacionada</p>
          )}
        </div>

        <p className="border-t pt-3 text-xs text-muted-foreground">
          Criado em {formatAssetDateTime(item.createdAt)}
          <br />
          Atualizado em {formatAssetDateTime(item.updatedAt)}
        </p>

        {moving ? (
          <div className="rounded-lg border p-3">
            <label htmlFor={`asset-room-${item.id}`} className="text-xs font-medium">
              Mover para
            </label>
            <select
              id={`asset-room-${item.id}`}
              defaultValue={item.roomId ?? ''}
              onChange={event => {
                if (event.target.value) onMoveToRoom(event.target.value)
              }}
              className="mt-2 h-9 w-full rounded-lg border bg-card px-3 text-sm"
            >
              <option value="" disabled>Escolha um ambiente</option>
              {availableRooms.map(candidate => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}{candidate.active ? '' : ' (arquivado)'}
                </option>
              ))}
            </select>
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={onCancelMove}>
              Cancelar
            </Button>
          </div>
        ) : null}

        {confirmingDelete ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <h3 className="font-display text-base font-semibold">Excluir este item?</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              O item será removido do inventário. Capítulos, documentos, movimentações e manutenções relacionados não serão excluídos.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onCancelDelete}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
                Excluir item
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <Button type="button" variant="outline" onClick={onEdit}>
              <Edit3 aria-hidden="true" />
              Editar item
            </Button>
            <Button type="button" variant="ghost" onClick={onRegisterMaintenance}>
              <Wrench aria-hidden="true" />
              Registrar manutenção
            </Button>
            <Button type="button" variant="ghost" onClick={onMove}>
              <MoveRight aria-hidden="true" />
              Mover de ambiente
            </Button>
            <Button type="button" variant="ghost" onClick={onToggleImportant}>
              <Star aria-hidden="true" />
              {item.important ? 'Remover dos importantes' : 'Marcar como importante'}
            </Button>
            {chapter ? (
              <Link to={`/livro-da-casa/${chapter.id}`} className={buttonVariants({ variant: 'ghost' })}>
                <LinkIcon aria-hidden="true" />
                Abrir capítulo
              </Link>
            ) : null}
            {transaction ? (
              <Link to="/financeiro" className={buttonVariants({ variant: 'ghost' })}>
                <Landmark aria-hidden="true" />
                Abrir movimentação
              </Link>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onAskDelete}
            >
              <Trash2 aria-hidden="true" />
              Excluir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { AssetDetails }
