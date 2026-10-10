import {
  Armchair,
  Banknote,
  Construction,
  FileCheck,
  Hammer,
  Heart,
  KeyRound,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { Chapter, ChapterCategory, ChapterImpact } from '@/domain/types'
import { formatChapterDateLong, formatChapterDateShort, formatChapterMonth } from '@/lib/chapter-date'

type ChapterCategoryVisualConfig = Readonly<{
  contextClass: string
  editorIcon: LucideIcon
  icon: LucideIcon
  label: string
}>

export const chapterCategories = [
  'construction',
  'acquisition',
  'renovation',
  'furniture',
  'documentation',
  'moment',
] as const satisfies readonly ChapterCategory[]

export const chapterCategoryConfig = {
  construction: { label: 'Construção', icon: Construction, editorIcon: Construction, contextClass: 'bg-primary/5' },
  acquisition: { label: 'Aquisição', icon: Banknote, editorIcon: KeyRound, contextClass: 'bg-success/10' },
  renovation: { label: 'Reforma', icon: Hammer, editorIcon: Hammer, contextClass: 'bg-warning/10' },
  furniture: { label: 'Mobília', icon: Armchair, editorIcon: Armchair, contextClass: 'bg-accent' },
  documentation: { label: 'Documentação', icon: FileCheck, editorIcon: FileCheck, contextClass: 'bg-secondary' },
  moment: { label: 'Momento', icon: Heart, editorIcon: Sparkles, contextClass: 'bg-primary/5' },
} satisfies Record<ChapterCategory, ChapterCategoryVisualConfig>

export const categoryLabels = Object.fromEntries(
  chapterCategories.map(category => [category, chapterCategoryConfig[category].label]),
) as Record<ChapterCategory, string>

export const impactLabels: Record<ChapterImpact, string> = { financial: 'Financeiro', property: 'Patrimônio', inventory: 'Inventário', documentation: 'Documentação', schedule: 'Cronograma', maintenance: 'Manutenção', unrelated: 'Não relacionado' }
export const getImpactLabel = (impact: unknown) => typeof impact === 'string' ? impactLabels[impact as ChapterImpact] ?? 'Outro impacto' : 'Outro impacto'
export const categoryIcons = Object.fromEntries(
  chapterCategories.map(category => [category, chapterCategoryConfig[category].icon]),
) as Record<ChapterCategory, LucideIcon>
export const chapterMonth = (chapter: Chapter) => formatChapterMonth(chapter.date)
export const chapterDateLong = (chapter: Chapter) => formatChapterDateLong(chapter.date)
export const chapterDateShort = (chapter: Chapter) => formatChapterDateShort(chapter.date)
