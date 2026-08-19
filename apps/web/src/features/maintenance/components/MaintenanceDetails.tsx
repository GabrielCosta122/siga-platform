import type { Ref } from 'react'
import { CalendarDays, CheckCircle2, Edit3, FileText, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import type { MaintenanceRecord } from '@/domain/types'
import type { AppState } from '@/store/app-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatMaintenanceCost,
  formatMaintenanceDate,
  formatMaintenanceDateTime,
  getMaintenanceDisplayStatus,
  getMaintenanceFrequencyLabel,
  getMaintenancePriorityLabel,
  getSafeMaintenanceCost,
  getSafeMaintenanceText,
  getMaintenanceTypeLabel,
  normalizeMaintenanceStatus,
} from '@/features/maintenance/presentation'
import { getMaintenanceEffectiveCost } from '@/store/selectors'

export type MaintenanceDetailsProps = {
  item: MaintenanceRecord
  state: AppState
  confirmingDelete: boolean
  headingRef?: Ref<HTMLHeadingElement>
  onEdit: () => void
  onComplete: () => void
  onReschedule: () => void
  onAddDocument: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}

const safeIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []

function MaintenanceDetails({
  item,
  state,
  confirmingDelete,
  headingRef,
  onEdit,
  onComplete,
  onReschedule,
  onAddDocument,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: MaintenanceDetailsProps) {
  const asset = state.assets.find(candidate => candidate.id === item.assetId)
  const room = state.rooms.find(candidate => candidate.id === item.roomId)
  const chapter = state.chapters.find(candidate => candidate.id === item.chapterId)
  const requestedDocumentIds = safeIds(item.documentIds)
  const documents = state.documents.filter(document =>
    requestedDocumentIds.includes(document.id) || document.maintenanceId === item.id,
  )
  const missingDocumentCount = requestedDocumentIds.filter(
    id => !state.documents.some(document => document.id === id),
  ).length
  const transaction = state.financialTransactions.find(candidate => candidate.id === item.financialTransactionId)
    ?? state.financialTransactions.find(candidate => candidate.maintenanceId === item.id)
  const routine = state.maintenanceRoutines.find(candidate => candidate.id === item.recurringRoutineId)
  const status = normalizeMaintenanceStatus(item.status)
  const canBeCompletedOrRescheduled = status !== 'completed' && status !== 'cancelled'
  const effectiveCost = getMaintenanceEffectiveCost(state, item)
  const displayedCost = getSafeMaintenanceCost(item.cost) !== null || effectiveCost > 0 ? effectiveCost : null

  return (
    <Card className="shadow-book-sm">
      <CardHeader>
        <CardTitle>
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Detalhes do cuidado
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">{getSafeMaintenanceText(item.title, 'Manutenção sem título')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{getMaintenanceDisplayStatus(item)}</Badge>
            <Badge variant="outline">{getMaintenanceTypeLabel(item.type)}</Badge>
            <Badge variant="outline">Prioridade {getMaintenancePriorityLabel(item.priority)}</Badge>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {getSafeMaintenanceText(item.description, 'Sem descrição.')}
          </p>
        </div>

        <dl className="space-y-2 border-y py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="flex gap-1 text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden="true" />
              Data prevista
            </dt>
            <dd className="text-right">{formatMaintenanceDate(item.scheduledDate)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Data concluída</dt>
            <dd className="text-right">{item.completedDate ? formatMaintenanceDate(item.completedDate) : 'Ainda não concluída'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Item</dt>
            <dd className="text-right">
              {asset ? (
                <Link to="/patrimonio" className="text-primary hover:underline">
                  {getSafeMaintenanceText(asset.name, 'Item sem nome')}
                </Link>
              ) : item.assetId ? 'Item relacionado não disponível' : 'Sem item relacionado'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Ambiente</dt>
            <dd className="text-right">
              {room ? getSafeMaintenanceText(room.name, 'Ambiente sem nome') : item.roomId ? 'Ambiente relacionado não disponível' : 'Geral'}
              {room && !room.active ? ' (arquivado)' : ''}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Responsável</dt>
            <dd className="text-right">{getSafeMaintenanceText(item.responsible, 'Não informado')}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Fornecedor</dt>
            <dd className="text-right">{getSafeMaintenanceText(item.supplier, 'Não informado')}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Custo</dt>
            <dd className="text-right font-medium">{formatMaintenanceCost(displayedCost)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Garantia do item</dt>
            <dd className="text-right">
              {asset?.warrantyEndDate ? formatMaintenanceDate(asset.warrantyEndDate) : 'Sem garantia informada'}
            </dd>
          </div>
        </dl>

        <div className="space-y-2 text-xs text-muted-foreground">
          {documents.length ? (
            <div>
              <p className="mb-1">Documentos relacionados</p>
              <ul className="space-y-1">
                {documents.map(document => (
                  <li key={document.id}>
                    <Link to="/documentos" className="flex items-center gap-1 text-primary hover:underline">
                      <FileText className="size-3 shrink-0" aria-hidden="true" />
                      {getSafeMaintenanceText(document.name, 'Documento sem nome')}
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
                {getSafeMaintenanceText(transaction.title, 'Movimentação sem título')}
              </Link>
            </p>
          ) : item.financialTransactionId ? (
            <p>Movimentação financeira relacionada não disponível</p>
          ) : (
            <p>Sem movimentação financeira relacionada</p>
          )}

          {chapter ? (
            <p>
              Capítulo:{' '}
              <Link to={`/livro-da-casa/${chapter.id}`} className="text-primary hover:underline">
                {getSafeMaintenanceText(chapter.title, 'Capítulo sem título')}
              </Link>
            </p>
          ) : item.chapterId ? (
            <p>Capítulo relacionado não disponível</p>
          ) : (
            <p>Sem capítulo relacionado</p>
          )}

          {routine ? (
            <p>
              Rotina: {getSafeMaintenanceText(routine.title, 'Rotina sem título')} · {getMaintenanceFrequencyLabel(routine.frequency)} · próxima em{' '}
              {formatMaintenanceDate(routine.nextDate)}
            </p>
          ) : item.recurringRoutineId ? (
            <p>Rotina relacionada não disponível</p>
          ) : (
            <p>Sem rotina relacionada</p>
          )}
        </div>

        <p className="border-t pt-3 text-xs text-muted-foreground">
          Criado em {formatMaintenanceDateTime(item.createdAt)}
          <br />
          Atualizado em {formatMaintenanceDateTime(item.updatedAt)}
        </p>

        {confirmingDelete ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <h3 className="font-display text-base font-semibold">Excluir esta manutenção?</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              O cuidado será removido. Itens, ambientes, capítulos, documentos e movimentações relacionados não serão excluídos.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onCancelDelete}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
                Excluir manutenção
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <Button type="button" variant="outline" onClick={onEdit}>
              <Edit3 aria-hidden="true" />
              Editar manutenção
            </Button>
            {canBeCompletedOrRescheduled ? (
              <>
                <Button type="button" onClick={onComplete}>
                  <CheckCircle2 aria-hidden="true" />
                  Marcar como concluída
                </Button>
                <Button type="button" variant="ghost" onClick={onReschedule}>
                  <CalendarDays aria-hidden="true" />
                  Reagendar
                </Button>
              </>
            ) : null}
            <Button type="button" variant="ghost" onClick={onAddDocument}>
              <FileText aria-hidden="true" />
              Adicionar documento
            </Button>
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

export { MaintenanceDetails }
