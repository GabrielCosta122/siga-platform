import { ChevronRight } from 'lucide-react'
import type { MaintenanceRecord } from '@/domain/types'
import type { AppState } from '@/store/app-state'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatMaintenanceCost,
  formatMaintenanceDateShort,
  formatMaintenanceMonth,
  getMaintenanceDisplayStatus,
  getMaintenanceHistoryDate,
  getMaintenanceLocationLabel,
  getSafeMaintenanceCost,
  getSafeMaintenanceText,
  getMaintenanceTypeIcon,
  parseMaintenanceDate,
} from '@/features/maintenance/presentation'
import { cn } from '@/lib/utils'
import { getMaintenanceEffectiveCost } from '@/store/selectors'

export type MaintenanceTimelineProps = {
  items: MaintenanceRecord[]
  state: AppState
  selectedId?: string | null
  onSelect: (record: MaintenanceRecord) => void
}

type TimelineGroup = {
  label: string
  records: MaintenanceRecord[]
}

function compareRecordsByHistoryDate(left: MaintenanceRecord, right: MaintenanceRecord) {
  const leftDate = parseMaintenanceDate(getMaintenanceHistoryDate(left))?.getTime() ?? Number.NEGATIVE_INFINITY
  const rightDate = parseMaintenanceDate(getMaintenanceHistoryDate(right))?.getTime() ?? Number.NEGATIVE_INFINITY
  if (leftDate !== rightDate) return rightDate - leftDate
  return String(right.updatedAt).localeCompare(String(left.updatedAt)) || left.id.localeCompare(right.id)
}

function groupRecords(items: MaintenanceRecord[]): TimelineGroup[] {
  const groups = new Map<string, MaintenanceRecord[]>()
  ;[...items].sort(compareRecordsByHistoryDate).forEach(record => {
    const month = formatMaintenanceMonth(getMaintenanceHistoryDate(record))
    groups.set(month, [...(groups.get(month) ?? []), record])
  })
  return [...groups].map(([label, records]) => ({ label, records }))
}

function MaintenanceTimeline({ items, state, selectedId, onSelect }: MaintenanceTimelineProps) {
  const groups = groupRecords(items)

  return (
    <div className="space-y-7">
      {groups.map(group => {
        const headingId = `maintenance-month-${group.label.replace(/\W+/g, '-').toLowerCase()}`
        return (
          <section key={group.label} aria-labelledby={headingId}>
            <h3 id={headingId} className="font-display text-xl font-semibold">
              {group.label}
            </h3>
            <div className="relative mt-4 space-y-3 border-l pl-6">
              {group.records.map(record => {
                const Icon = getMaintenanceTypeIcon(record.type)
                const date = getMaintenanceHistoryDate(record)
                const effectiveCost = getMaintenanceEffectiveCost(state, record)
                const displayedCost = getSafeMaintenanceCost(record.cost) !== null || effectiveCost > 0 ? effectiveCost : null
                const documentIds = Array.isArray(record.documentIds) ? record.documentIds.filter((id): id is string => typeof id === 'string') : []
                const documents = state.documents.filter(document => documentIds.includes(document.id) || document.maintenanceId === record.id)
                const chapter = state.chapters.find(candidate => candidate.id === record.chapterId)
                const chapterLabel = chapter
                  ? getSafeMaintenanceText(chapter.title, 'Capítulo sem título')
                  : record.chapterId ? 'Capítulo relacionado não disponível' : 'Sem capítulo relacionado'
                const documentLabel = documents.length
                  ? `${getSafeMaintenanceText(documents[0].name, 'Documento sem nome')}${documents.length > 1 ? ` +${documents.length - 1}` : ''}`
                  : documentIds.length ? 'Documento relacionado não disponível' : 'Sem documento relacionado'
                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => onSelect(record)}
                    aria-pressed={selectedId === record.id}
                    aria-label={`Ver detalhes de ${getSafeMaintenanceText(record.title, 'manutenção sem título')}`}
                    className={cn(
                      'relative w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                      selectedId === record.id && 'ring-2 ring-primary/30',
                    )}
                  >
                    <span className="absolute top-5 -left-9 flex size-6 items-center justify-center rounded-full border bg-background text-primary">
                      <Icon className="size-3" aria-hidden="true" />
                    </span>
                    <Card className="shadow-book-xs transition-colors hover:bg-muted/20">
                      <CardContent className="flex items-center gap-3 pt-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{getSafeMaintenanceText(record.title, 'Manutenção sem título')}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatMaintenanceDateShort(date)} · {getMaintenanceLocationLabel(record, state)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{chapterLabel} · {documentLabel}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{getMaintenanceDisplayStatus(record)}</Badge>
                          <p className="mt-1 text-xs text-muted-foreground">{formatMaintenanceCost(displayedCost)}</p>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                      </CardContent>
                    </Card>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export { MaintenanceTimeline }
