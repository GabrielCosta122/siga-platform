import { BookPlus, Home, Sparkles } from 'lucide-react'

import type { NavigationItem } from '@/components/layout/Sidebar'
import { MainLayout } from '@/layouts/MainLayout'
import { NewChapter } from '@/pages/NewChapter'

const navigation: NavigationItem[] = [
  { icon: Home, label: 'Sweet Home', href: '/' },
  { icon: BookPlus, label: 'Novo Capítulo', href: '/novo-capitulo', current: true },
  { icon: Sparkles, label: 'Ateliê', href: '/atelie' },
]

function App() {
  return (
    <MainLayout title="Novo Capítulo" navigation={navigation}>
      <NewChapter />
    </MainLayout>
  )
}

export default App
