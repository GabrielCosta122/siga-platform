import { Bell, Command } from 'lucide-react'

import { Button } from '@/components/ui/button'

type HeaderProps = {
  title?: string
}

function Header({ title = 'Ateliê' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <span className="font-display text-base font-semibold tracking-tight">{title}</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">SIGA Ink</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Comandos">
          <Command aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell aria-hidden="true" />
        </Button>
      </div>
    </header>
  )
}

export { Header }
