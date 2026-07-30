import type { LucideIcon } from 'lucide-react'
import { Banknote, Construction, FileCheck, Heart, KeyRound } from 'lucide-react'

type Chapter = {
  category: string
  categoryId: string
  date: string
  description: string
  documents: number
  icon: LucideIcon
  id: string
  impacts: string[]
  important?: boolean
  month: string
  photos: number
  title: string
}

const chapters: Chapter[] = [
  { id: 'july-structure', month: 'Julho de 2026', date: '12 jul 2026', title: 'Atualização da obra — estrutura do 12º andar', description: 'A estrutura do último pavimento começou a ganhar forma e tornou a chegada mais real.', category: 'Construção', categoryId: 'construction', icon: Construction, impacts: ['Patrimônio', 'Cronograma'], photos: 3, documents: 1, important: true },
  { id: 'july-visit', month: 'Julho de 2026', date: '04 jul 2026', title: 'Visita técnica ao apartamento', description: 'Caminhamos pelo futuro apartamento e imaginamos a luz entrando na sala.', category: 'Construção', categoryId: 'construction', icon: Construction, impacts: ['Patrimônio'], photos: 5, documents: 0 },
  { id: 'june-payment', month: 'Junho de 2026', date: '18 jun 2026', title: 'Pagamento da entrada', description: 'Um passo importante para transformar o planejamento em uma escolha concreta.', category: 'Aquisição', categoryId: 'acquisition', icon: Banknote, impacts: ['Financeiro'], photos: 0, documents: 1, important: true },
  { id: 'march-first-visit', month: 'Março de 2026', date: '08 mar 2026', title: 'Primeira visita à obra', description: 'Entre andaimes e conversas, encontramos o lugar onde nossa próxima fase vai acontecer.', category: 'Momento', categoryId: 'moment', icon: Heart, impacts: ['Não relacionado'], photos: 4, documents: 0 },
  { id: 'feb-contract', month: 'Fevereiro de 2026', date: '15 fev 2026', title: 'Assinatura do contrato', description: 'Assinamos os documentos e demos um nome oficial ao sonho que já dividíamos.', category: 'Documentação', categoryId: 'documentation', icon: FileCheck, impacts: ['Documentação', 'Financeiro'], photos: 1, documents: 2, important: true },
  { id: 'feb-decision', month: 'Fevereiro de 2026', date: '02 fev 2026', title: 'A decisão de comprar nosso apartamento', description: 'Uma conversa tranquila que terminou com a certeza de que era hora de começar.', category: 'Momento', categoryId: 'moment', icon: KeyRound, impacts: ['Não relacionado'], photos: 0, documents: 0 },
]

const categoryOptions = ['Todas', 'Construção', 'Aquisição', 'Reforma', 'Mobília', 'Documentação', 'Momento']
const impactOptions = ['Todos os impactos', 'Financeiro', 'Patrimônio', 'Documentação', 'Cronograma', 'Não relacionado']
const periodOptions = ['Todo o período', 'Julho de 2026', 'Junho de 2026', 'Março de 2026', 'Fevereiro de 2026']

export { categoryOptions, chapters, impactOptions, periodOptions }
export type { Chapter }
