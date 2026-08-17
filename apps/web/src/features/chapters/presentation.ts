import { Armchair, Banknote, Construction, FileCheck, Heart, Hammer, type LucideIcon } from 'lucide-react'
import type { Chapter, ChapterCategory, ChapterImpact } from '@/domain/types'
import { formatDateLongBR, formatDateShortBR } from '@/lib/utils'

export const categoryLabels: Record<ChapterCategory, string> = { construction: 'Construção', acquisition: 'Aquisição', renovation: 'Reforma', furniture: 'Mobília', documentation: 'Documentação', moment: 'Momento' }
export const impactLabels: Record<ChapterImpact, string> = { financial: 'Financeiro', property: 'Patrimônio', inventory: 'Inventário', documentation: 'Documentação', schedule: 'Cronograma', maintenance: 'Manutenção', unrelated: 'Não relacionado' }
export const getImpactLabel = (impact: unknown) => typeof impact === 'string' ? impactLabels[impact as ChapterImpact] ?? 'Outro impacto' : 'Outro impacto'
export const categoryIcons: Record<ChapterCategory, LucideIcon> = { construction: Construction, acquisition: Banknote, renovation: Hammer, furniture: Armchair, documentation: FileCheck, moment: Heart }
export const chapterMonth = (chapter: Chapter) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${chapter.date}T12:00:00`)).replace(/^./, letter => letter.toUpperCase())
export const chapterDateLong = (chapter: Chapter) => formatDateLongBR(chapter.date)
export const chapterDateShort = (chapter: Chapter) => formatDateShortBR(chapter.date).replace('.', '')
