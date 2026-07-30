import { Building2, FileText, Hammer, Landmark, WalletCards } from 'lucide-react'

const movements = [
  { id: 'entry', title: 'Pagamento da entrada', value: 'R$ 8.500,00', date: '20 de fevereiro de 2026', category: 'Aquisição', status: 'Pago', type: 'Pagamento', chapter: 'Pagamento da entrada', icon: Landmark },
  { id: 'docs', title: 'Taxa de documentação', value: 'R$ 1.200,00', date: '15 de março de 2026', category: 'Documentação', status: 'Pago', type: 'Taxa', chapter: 'Assinatura do contrato', icon: FileText },
  { id: 'work', title: 'Evolução da obra', value: 'R$ 620,00', date: '20 de julho de 2026', category: 'Construção', status: 'Pago', type: 'Pagamento', chapter: 'Atualização da obra — estrutura do 12º andar', icon: Building2 },
  { id: 'materials', title: 'Compra de materiais', value: 'R$ 980,00', date: '25 de julho de 2026', category: 'Reforma', status: 'Pago', type: 'Compra', chapter: '', icon: Hammer },
]

const commitments = [
  { title: 'Parcela da entrada', value: 'R$ 1.450,00', date: '10 de agosto de 2026', status: 'Próximo', category: 'Aquisição' },
  { title: 'Taxa de evolução da obra', value: 'R$ 620,00', date: '20 de agosto de 2026', status: 'Agendado', category: 'Construção' },
  { title: 'Parcela do financiamento', value: 'R$ 1.280,00', date: '10 de setembro de 2026', status: 'Futuro', category: 'Aquisição' },
]

const evolution = [{ month: 'Fev', value: 8500 }, { month: 'Mar', value: 14800 }, { month: 'Abr', value: 21300 }, { month: 'Mai', value: 28100 }, { month: 'Jun', value: 35400 }, { month: 'Jul', value: 42850 }]
const distribution = [{ label: 'Aquisição', value: 'R$ 28.000', percent: 65, icon: Landmark }, { label: 'Construção', value: 'R$ 7.850', percent: 18, icon: Building2 }, { label: 'Documentação', value: 'R$ 3.200', percent: 7, icon: FileText }, { label: 'Reforma', value: 'R$ 2.800', percent: 7, icon: Hammer }, { label: 'Mobília', value: 'R$ 1.000', percent: 3, icon: WalletCards }]

export { commitments, distribution, evolution, movements }
