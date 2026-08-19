import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MaintenanceRecord } from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatMaintenanceDate,
  getLocalMaintenanceDate,
  getMaintenanceDisplayStatus,
  getSafeMaintenanceText,
  parseMaintenanceDate,
} from '@/features/maintenance/presentation'
import { cn } from '@/lib/utils'

export type MaintenanceCalendarProps = {
  records: MaintenanceRecord[]
  monthKey: string
  selectedDate: string | null
  onChangeMonth: (monthKey: string) => void
  onSelectDate: (date: string) => void
  onSelectRecord?: (record: MaintenanceRecord) => void
  today?: string
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function parseMonthKey(value: unknown, fallbackDate: string) {
  const match = typeof value === 'string' ? value.match(/^(\d{4})-(\d{2})$/) : null
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    if (year >= 1 && month >= 1 && month <= 12) return { year, month }
  }
  const fallback = parseMaintenanceDate(fallbackDate) ?? new Date()
  return { year: fallback.getUTCFullYear(), month: fallback.getUTCMonth() + 1 }
}

const toMonthKey = (year: number, month: number) =>
  `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`

const toDateKey = (year: number, month: number, day: number) =>
  `${toMonthKey(year, month)}-${String(day).padStart(2, '0')}`

function shiftMonth(year: number, month: number, amount: number) {
  const date = new Date(Date.UTC(year, month - 1 + amount, 1))
  return toMonthKey(date.getUTCFullYear(), date.getUTCMonth() + 1)
}

function MaintenanceCalendar({
  records,
  monthKey,
  selectedDate,
  onChangeMonth,
  onSelectDate,
  onSelectRecord,
  today = getLocalMaintenanceDate(),
}: MaintenanceCalendarProps) {
  const { year, month } = parseMonthKey(monthKey, today)
  const resolvedMonthKey = toMonthKey(year, month)
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const calendarCells = Array.from({ length: firstWeekday + dayCount }, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1,
  )
  while (calendarCells.length % 7) calendarCells.push(null)

  const recordsByDate = new Map<string, MaintenanceRecord[]>()
  records.forEach(record => {
    const parsedDate = parseMaintenanceDate(record.scheduledDate)
    if (!parsedDate) return
    const dateKey = toDateKey(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth() + 1, parsedDate.getUTCDate())
    if (!dateKey.startsWith(resolvedMonthKey)) return
    recordsByDate.set(dateKey, [...(recordsByDate.get(dateKey) ?? []), record])
  })
  const selectedRecords = selectedDate ? recordsByDate.get(selectedDate) ?? [] : []
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace(/^./, letter => letter.toLocaleUpperCase('pt-BR'))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-display text-xl">Agenda de cuidados</CardTitle>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Ver mês anterior"
              onClick={() => onChangeMonth(shiftMonth(year, month, -1))}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Ver próximo mês"
              onClick={() => onChangeMonth(shiftMonth(year, month, 1))}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground" aria-live="polite">{monthLabel}</p>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
          {WEEKDAYS.map(day => (
            <span key={day} className="py-1 font-medium text-muted-foreground" aria-hidden="true">{day}</span>
          ))}
          {calendarCells.map((day, index) => day === null ? (
            <span key={`empty-${index}`} aria-hidden="true" />
          ) : (() => {
            const date = toDateKey(year, month, day)
            const count = recordsByDate.get(date)?.length ?? 0
            const isSelected = date === selectedDate
            const isToday = date === today
            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelectDate(date)}
                aria-label={`${formatMaintenanceDate(date)}${isToday ? ', hoje' : ''}${count ? `, ${count} ${count === 1 ? 'cuidado' : 'cuidados'}` : ''}`}
                aria-current={isToday ? 'date' : undefined}
                aria-pressed={isSelected}
                className={cn(
                  'relative rounded px-1 py-2 outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50',
                  count > 0 && !isSelected && 'bg-secondary/70 font-medium text-primary',
                  isToday && 'ring-1 ring-primary/40',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary/80',
                )}
              >
                {day}
                {count > 0 ? (
                  <span
                    className={cn(
                      'absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary',
                      isSelected && 'bg-primary-foreground',
                    )}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            )
          })())}
        </div>

        <div className="mt-3 border-t pt-3 text-xs text-muted-foreground" aria-live="polite">
          {selectedDate ? (
            selectedRecords.length ? (
              <div className="space-y-2">
                <p>{formatMaintenanceDate(selectedDate)}</p>
                {selectedRecords.map(record => onSelectRecord ? (
                  <button
                    key={record.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-md p-2 text-left outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
                    onClick={() => onSelectRecord(record)}
                  >
                    <span className="min-w-0 truncate text-foreground">{getSafeMaintenanceText(record.title, 'Manutenção sem título')}</span>
                    <Badge variant="outline">{getMaintenanceDisplayStatus(record, today)}</Badge>
                  </button>
                ) : (
                  <div key={record.id} className="flex items-center justify-between gap-3 rounded-md p-2">
                    <span className="min-w-0 truncate text-foreground">{getSafeMaintenanceText(record.title, 'Manutenção sem título')}</span>
                    <Badge variant="outline">{getMaintenanceDisplayStatus(record, today)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p>Nenhum cuidado previsto para {formatMaintenanceDate(selectedDate)}.</p>
            )
          ) : (
            <p>Selecione uma data para ver os cuidados previstos.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { MaintenanceCalendar }
