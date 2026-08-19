import { createElement } from 'react'
import { CalendarDays, Check, FileText, Link as LinkIcon, Wrench } from 'lucide-react'
import type { Asset, EntityId, Room } from '@/domain/types'
import type { AppState } from '@/store/app-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatAssetDateShort,
  formatAssetWarranty,
  getAssetCategoryLabel,
  getAssetIconForItem,
  getAssetStatusLabel,
  getSafeAssetValue,
} from '@/features/assets-inventory/presentation'
import { cn, formatCurrencyBRL } from '@/lib/utils'

export type AssetItemsProps = {
  items: Asset[]
  rooms: Room[]
  state: AppState
  selectedId: EntityId | null
  onSelect: (item: Asset) => void
  mode: 'cards' | 'list'
}

const safeIds = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []

function AssetItems({ items, rooms, state, selectedId, onSelect, mode }: AssetItemsProps) {
  return (
    <div className={mode === 'cards' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-2'}>
      {items.map(item => {
        const active = item.id === selectedId
        const room = rooms.find(candidate => candidate.id === item.roomId)
        const chapter = state.chapters.find(candidate => candidate.id === item.chapterId)
        const documentIds = safeIds(item.documentIds)
        const relatedDocuments = state.documents.filter(document =>
          documentIds.includes(document.id) || document.assetId === item.id,
        )
        const transaction = state.financialTransactions.find(candidate => candidate.id === item.financialTransactionId)
          ?? state.financialTransactions.find(candidate => candidate.assetId === item.id)
        const maintenanceIds = safeIds(item.maintenanceIds)
        const maintenanceCount = state.maintenanceRecords.filter(record =>
          maintenanceIds.includes(record.id) || record.assetId === item.id,
        ).length
        const brandAndModel = [item.brand, item.model]
          .filter(value => typeof value === 'string' && value.trim())
          .join(' · ')

        return (
          <Card
            key={item.id}
            className={cn('shadow-book-xs', active && 'ring-2 ring-primary/30')}
          >
            <CardContent
              className={cn(
                'flex gap-3 pt-5',
                mode === 'list' && 'items-center py-4',
              )}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                {createElement(getAssetIconForItem(item), {
                  className: 'size-5',
                  'aria-hidden': true,
                })}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p title={item.name} className="truncate text-sm font-medium">
                    {item.name || 'Item sem nome'}
                  </p>
                  {item.important ? (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="size-3" aria-hidden="true" />
                      Importante
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {room?.name ?? (item.roomId ? 'Ambiente não disponível' : 'Sem ambiente')}
                  {' · '}
                  {getAssetCategoryLabel(item.category)}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {formatCurrencyBRL(getSafeAssetValue(item.value))}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" aria-hidden="true" />
                    {formatAssetDateShort(item.purchaseDate)}
                  </span>
                  {brandAndModel ? <span>{brandAndModel}</span> : null}
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Garantia: {formatAssetWarranty(item.warrantyEndDate)}
                </p>

                {chapter || relatedDocuments.length || transaction || maintenanceCount ? (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-primary">
                    {chapter ? (
                      <span className="flex min-w-0 items-center gap-1">
                        <LinkIcon className="size-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{chapter.title}</span>
                      </span>
                    ) : null}
                    {relatedDocuments.length ? (
                      <span className="flex items-center gap-1">
                        <FileText className="size-3" aria-hidden="true" />
                        {relatedDocuments.length} {relatedDocuments.length === 1 ? 'documento' : 'documentos'}
                      </span>
                    ) : null}
                    {transaction ? <span>Movimentação vinculada</span> : null}
                    {maintenanceCount ? (
                      <span className="flex items-center gap-1">
                        <Wrench className="size-3" aria-hidden="true" />
                        {maintenanceCount} {maintenanceCount === 1 ? 'manutenção' : 'manutenções'}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                <Badge variant="outline">{getAssetStatusLabel(item.status)}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Ver detalhes de ${item.name || 'item sem nome'}`}
                  aria-pressed={active}
                  onClick={() => onSelect(item)}
                >
                  Ver detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export { AssetItems }
