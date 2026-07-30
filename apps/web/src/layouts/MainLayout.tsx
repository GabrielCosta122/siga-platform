import type { ReactNode } from 'react'

import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

type MainLayoutProps = {
  children: ReactNode
  title?: string
}

/**
 * Estrutura base desacoplada de roteamento. Quando React Router for incluído,
 * os itens de `navigation` podem ser alimentados pelas rotas da aplicação.
 */
function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="min-h-svh bg-background pl-16">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header title={title} />
        <main>{children}</main>
      </div>
    </div>
  )
}

export { MainLayout }
