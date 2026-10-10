import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Building2,
  Database,
  Folder,
  Palette,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsSections = [
  ['property', 'Meu imóvel', Building2],
  ['rooms', 'Ambientes', Folder],
  ['categories', 'Categorias', Tags],
  ['people', 'Pessoas', Users],
  ['preferences', 'Preferências', Palette],
  ['notifications', 'Notificações', Bell],
  ['security', 'Segurança', ShieldCheck],
  ['data', 'Dados e privacidade', Database],
] as const satisfies readonly (readonly [string, string, LucideIcon])[]

export type SettingsSection = (typeof settingsSections)[number][0]

interface SettingsNavProps {
  active: SettingsSection
  onChange: (id: SettingsSection) => void
}

function SettingsNav({ active, onChange }: SettingsNavProps) {
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Seções de configurações">
      {settingsSections.map(([id, label, Icon]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring',
            active === id && 'bg-secondary font-medium text-foreground',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  )
}

export { SettingsNav }
