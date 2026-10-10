import type { LucideIcon } from 'lucide-react'
import type { ChapterCategory as DomainChapterCategory, ChapterImpact } from '@/domain/types'
import { Banknote, Building2, CalendarClock, FileText, Heart, Package, Wrench } from 'lucide-react'
import { chapterCategories, chapterCategoryConfig } from '@/features/chapters/presentation'

type Impact = { description: string; icon: LucideIcon; id: ChapterImpact; label: string }
type ChapterCategory = { contextClass: string; icon: LucideIcon; id: DomainChapterCategory; label: string }

const impacts: Impact[] = [
  { id: 'financial', label: 'Financeiro', description: 'Valores, pagamentos ou investimentos.', icon: Banknote },
  { id: 'property', label: 'Patrimônio', description: 'Mudanças na estrutura ou no imóvel.', icon: Building2 },
  { id: 'inventory', label: 'Inventário', description: 'Itens adquiridos, movidos ou retirados.', icon: Package },
  { id: 'documentation', label: 'Documentação', description: 'Contratos, notas fiscais ou arquivos.', icon: FileText },
  { id: 'schedule', label: 'Cronograma', description: 'Marcos, prazos ou etapas da jornada.', icon: CalendarClock },
  { id: 'maintenance', label: 'Manutenção', description: 'Cuidados, reparos ou revisões.', icon: Wrench },
]
const unrelatedImpact: Impact = { id: 'unrelated', label: 'Não relacionado', description: 'Um momento sem impacto operacional.', icon: Heart }
const categories: ChapterCategory[] = chapterCategories.map(id => {
  const config = chapterCategoryConfig[id]
  return { id, label: config.label, icon: config.editorIcon, contextClass: config.contextClass }
})

export { categories, impacts, unrelatedImpact }
export type { ChapterCategory, Impact }
