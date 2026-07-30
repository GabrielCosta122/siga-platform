import { Home, Sparkles } from 'lucide-react'

import type { NavigationItem } from '@/components/layout/Sidebar'
import { MainLayout } from '@/layouts/MainLayout'
import { SweetHome } from '@/pages/SweetHome'

const navigation: NavigationItem[] = [
  { icon: Home, label: 'Sweet Home', href: '/', current: true },
  { icon: Sparkles, label: 'Ateliê', href: '/atelie' },
]

function App() {
  return (
    <MainLayout title="Sweet Home" navigation={navigation}>
      <SweetHome />
    </MainLayout>
  )
}

export default App
