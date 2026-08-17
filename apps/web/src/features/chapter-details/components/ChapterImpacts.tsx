import { Banknote, CalendarClock, ChevronRight, FileText, Heart, House, Package, Wrench, type LucideIcon } from 'lucide-react'
import type { ChapterImpact } from '@/domain/types'

type ImpactConfig = { title: string; icon: LucideIcon }

const impactConfig = {
  financial: { title: 'Financeiro', icon: Banknote },
  property: { title: 'Patrimônio', icon: House },
  inventory: { title: 'Inventário', icon: Package },
  documentation: { title: 'Documentação', icon: FileText },
  schedule: { title: 'Cronograma', icon: CalendarClock },
  maintenance: { title: 'Manutenção', icon: Wrench },
  unrelated: { title: 'Não relacionado', icon: Heart },
} satisfies Record<ChapterImpact, ImpactConfig>

const legacyImpactAliases: Record<string, ChapterImpact> = { assets: 'property', documents: 'documentation', timeline: 'schedule' }
const fallbackConfig: ImpactConfig = { title: 'Outro impacto', icon: Heart }

function getImpactConfig(impact: unknown): ImpactConfig {
  if (typeof impact !== 'string') return fallbackConfig
  const normalizedImpact = legacyImpactAliases[impact] ?? impact
  return impactConfig[normalizedImpact as ChapterImpact] ?? fallbackConfig
}

function ChapterImpacts({ impacts }: { impacts: ChapterImpact[] }) {
  if (!impacts.length) return null
  return <section aria-labelledby="impactos-heading"><h2 id="impactos-heading" className="font-display text-xl font-semibold">Onde este capítulo impacta</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{impacts.map((impact, index) => { const config = getImpactConfig(impact); const Icon = config.icon; return <article key={`${String(impact)}-${index}`} className="rounded-lg border bg-card p-4 shadow-book-xs"><Icon className="size-4 text-primary" aria-hidden="true" /><h3 className="mt-3 text-sm font-medium">{config.title}</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Este capítulo mantém esse contexto ligado à história da casa.</p><span className="mt-3 flex items-center gap-1 text-xs text-primary">Ver registros relacionados <ChevronRight className="size-3" aria-hidden="true" /></span></article> })}</div></section>
}
export { ChapterImpacts }
