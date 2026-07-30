import type { LucideIcon } from 'lucide-react'
import { BookOpen, LayoutDashboard, Settings, Sparkles } from 'lucide-react'

type NavigationItem = {
  icon: LucideIcon
  label: string
  href: string
  current?: boolean
}

type SidebarProps = {
  navigation?: NavigationItem[]
}

const defaultNavigation: NavigationItem[] = [
  { icon: Sparkles, label: 'Ateliê', href: '/', current: true },
  { icon: LayoutDashboard, label: 'Visão geral', href: '/visao-geral' },
  { icon: BookOpen, label: 'Biblioteca', href: '/biblioteca' },
  { icon: Settings, label: 'Configurações', href: '/configuracoes' },
]

function Sidebar({ navigation = defaultNavigation }: SidebarProps) {
  return (
    <aside
      className="group/sidebar fixed top-0 bottom-0 left-0 z-30 flex h-screen w-16 origin-left flex-col overflow-hidden border-r bg-sidebar shadow-book-xs transition-[width,transform,box-shadow] duration-500 ease-out hover:w-64 hover:[transform:perspective(1200px)_rotateY(-1deg)] hover:shadow-book-md focus-within:w-64 focus-within:[transform:perspective(1200px)_rotateY(-1deg)] focus-within:shadow-book-md"
      aria-label="Navegação principal"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 left-1 w-px bg-primary/25" aria-hidden="true" />

      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-book-xs">
          <BookOpen className="size-4" aria-hidden="true" />
        </div>
        <span className="whitespace-nowrap font-display text-sm font-semibold opacity-0 transition-opacity delay-75 duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
          SIGA
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
        {navigation.map(({ icon: Icon, label, href, current }) => (
          <a
            key={label}
            href={href}
            aria-current={current ? 'page' : undefined}
            aria-label={label}
            className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
              current
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap opacity-0 transition-opacity delay-75 duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
              {label}
            </span>
          </a>
        ))}
      </nav>

      <div className="border-t px-2 py-4">
        <div className="flex items-center gap-3 px-3 text-xs text-muted-foreground">
          <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
          <span className="whitespace-nowrap opacity-0 transition-opacity delay-75 duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
            Sistema disponível
          </span>
        </div>
      </div>
    </aside>
  )
}

export { Sidebar }
export type { NavigationItem }
