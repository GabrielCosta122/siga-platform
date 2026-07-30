import type { ReactNode } from 'react'

import { Header } from '@/components/layout/Header'
import { Sidebar, type NavigationItem } from '@/components/layout/Sidebar'

type MainLayoutProps = {
  children: ReactNode
  navigation?: NavigationItem[]
  title?: string
}

/**
 * Estrutura base desacoplada de roteamento. Quando React Router for incluído,
 * os itens de `navigation` podem ser alimentados pelas rotas da aplicação.
 */
function MainLayout({ children, navigation, title }: MainLayoutProps) {
  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar navigation={navigation} />
      <div className="min-w-0 flex-1">
        <Header title={title} />
        <main>{children}</main>
      </div>
    </div>
  )
}

export { MainLayout }
