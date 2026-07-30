import type { LucideIcon } from 'lucide-react'
import {
  Armchair,
  Banknote,
  Building2,
  CalendarClock,
  Construction,
  FileCheck,
  FileText,
  Hammer,
  Heart,
  KeyRound,
  Package,
  Sparkles,
  Wrench,
} from 'lucide-react'

type Impact = {
  description: string
  icon: LucideIcon
  id: string
  label: string
}

type ChapterCategory = {
  contextClass: string
  icon: LucideIcon
  id: string
  label: string
}

const impacts: Impact[] = [
  { id: 'financial', label: 'Financeiro', description: 'Valores, pagamentos ou investimentos.', icon: Banknote },
  { id: 'assets', label: 'Patrimônio', description: 'Mudanças na estrutura ou no imóvel.', icon: Building2 },
  { id: 'inventory', label: 'Inventário', description: 'Itens adquiridos, movidos ou retirados.', icon: Package },
  { id: 'documents', label: 'Documentação', description: 'Contratos, notas fiscais ou arquivos.', icon: FileText },
  { id: 'timeline', label: 'Cronograma', description: 'Marcos, prazos ou etapas da jornada.', icon: CalendarClock },
  { id: 'maintenance', label: 'Manutenção', description: 'Cuidados, reparos ou revisões.', icon: Wrench },
]

const unrelatedImpact: Impact = {
  id: 'unrelated',
  label: 'Não relacionado',
  description: 'Um momento sem impacto operacional.',
  icon: Heart,
}

const categories: ChapterCategory[] = [
  { id: 'construction', label: 'Construção', icon: Construction, contextClass: 'bg-primary/5' },
  { id: 'acquisition', label: 'Aquisição', icon: KeyRound, contextClass: 'bg-success/10' },
  { id: 'renovation', label: 'Reforma', icon: Hammer, contextClass: 'bg-warning/10' },
  { id: 'furniture', label: 'Mobília', icon: Armchair, contextClass: 'bg-accent' },
  { id: 'documentation', label: 'Documentação', icon: FileCheck, contextClass: 'bg-secondary' },
  { id: 'moment', label: 'Momento', icon: Sparkles, contextClass: 'bg-primary/5' },
]

export { categories, impacts, unrelatedImpact }
export type { ChapterCategory, Impact }
