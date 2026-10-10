import { Bell, LockKeyhole, Users } from 'lucide-react'
import type {
  AppCategorySetting,
  AppCategorySettingChanges,
  AppNotificationEvent,
  AppSettings,
  Room,
} from '@/domain/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  getSettingsCategoryPresentation,
  settingsCategoryGroups,
} from '@/features/settings/categories'
import { DataPrivacyPanel } from '@/features/settings/components/DataPrivacyPanel'
import { PropertySettingsForm } from '@/features/settings/components/PropertySettingsForm'
import { RoomsSettingsPanel } from '@/features/settings/components/RoomsSettingsPanel'
import type { SettingsSection } from '@/features/settings/components/SettingsNav'
import type {
  PropertySettingsUpdate,
  PropertySettingsValues,
} from '@/features/settings/property-settings'
import type { AppState } from '@/store/app-state'

const fieldClass = 'h-10 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60'

const notificationEventLabels = {
  chapterCreated: 'Capítulo criado',
  upcomingPayment: 'Pagamento próximo',
  overdueCommitment: 'Compromisso atrasado',
  upcomingMaintenance: 'Manutenção próxima',
  overdueMaintenance: 'Manutenção atrasada',
  expiringWarranty: 'Garantia próxima',
  documentAdded: 'Documento adicionado',
} satisfies Record<AppNotificationEvent, string>

interface SettingsPanelProps {
  active: SettingsSection
  disabled?: boolean
  onAddRoom: (room: Room) => void
  onArchiveRoom: (id: string) => void
  onFeedback: (message: string) => void
  onPropertyChange: (value: PropertySettingsValues) => void
  onPropertySave: (changes: PropertySettingsUpdate) => void
  onReset: () => void
  onSettingsChange: (settings: AppSettings) => void
  onUpdateRoom: (id: string, changes: Partial<Room>) => void
  propertyValues: PropertySettingsValues
  settings: AppSettings
  state: AppState
}

function withCategoryChange(
  settings: AppSettings,
  category: AppCategorySetting,
  changes: AppCategorySettingChanges,
) {
  const categories = settings.categories.map(item => item.scope === category.scope && item.id === category.id
    ? { ...item, ...changes, scope: item.scope, id: item.id }
    : item)
  return { ...settings, categories }
}

function CategoriesPanel({
  disabled,
  settings,
  onChange,
}: {
  disabled: boolean
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}) {
  return (
    <section aria-labelledby="settings-categories-heading">
      <h2 id="settings-categories-heading" className="font-display text-2xl font-semibold">Categorias</h2>
      <p className="mt-1 text-sm text-muted-foreground">A apresentação dos registros, sem alterar seus identificadores internos.</p>
      <div className="mt-5 space-y-5">
        {settingsCategoryGroups.map(group => {
          const activeCount = settings.categories.filter(item => item.scope === group.scope && item.active).length
          return <Card key={group.scope} className="shadow-book-xs">
            <CardContent className="space-y-3 pt-6">
              <div>
                <h3 className="font-display text-lg font-semibold">{group.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{group.scope === 'chapter' ? 'O ID canônico permanece igual mesmo quando o nome visual muda.' : 'A ativação já vale nos novos cadastros; a edição do nome visual será liberada após a migração completa deste módulo.'}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.categories.map((definition, index) => {
                  const stored = settings.categories.find(item => item.scope === group.scope && item.id === definition.id)
                  const category: AppCategorySetting = stored ?? {
                    scope: group.scope,
                    id: definition.id,
                    label: definition.defaultLabel,
                    tone: 'neutral',
                    active: true,
                    order: index,
                  }
                  const presentation = getSettingsCategoryPresentation(category)
                  const Icon = presentation.icon
                  return (
                    <div key={definition.id} className="flex min-w-0 items-center gap-3 rounded-lg border p-3">
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${presentation.contextClass}`}>
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <label className="min-w-0 flex-1 space-y-1">
                        <span className="sr-only">Nome visual de {definition.defaultLabel}</span>
                        <Input
                          value={category.label}
                          maxLength={50}
                          disabled={disabled || group.scope !== 'chapter'}
                          title={group.scope === 'chapter' ? undefined : 'A personalização deste nome será liberada após a migração completa do módulo.'}
                          onChange={event => onChange(withCategoryChange(settings, category, { label: event.target.value }))}
                        />
                        <span className="block truncate font-mono text-[0.65rem] text-muted-foreground">{category.id}</span>
                      </label>
                      <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={category.active}
                          disabled={disabled || (category.active && activeCount <= 1)}
                          title={category.active && activeCount <= 1 ? 'Mantenha ao menos uma categoria ativa neste módulo.' : undefined}
                          aria-label={`${category.active ? 'Desativar' : 'Ativar'} ${presentation.label}`}
                          onChange={event => onChange(withCategoryChange(settings, category, { active: event.target.checked }))}
                          className="size-4 accent-primary"
                        />
                        Ativa
                      </label>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        })}
      </div>
    </section>
  )
}

function PeoplePanel() {
  return (
    <section aria-labelledby="settings-people-heading">
      <h2 id="settings-people-heading" className="font-display text-2xl font-semibold">Pessoas</h2>
      <p className="mt-1 text-sm text-muted-foreground">Quem participa da história e dos cuidados da casa.</p>
      <Card className="mt-5 shadow-book-xs">
        <CardContent className="flex items-start gap-4 pt-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><Users className="size-5" aria-hidden="true" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><p className="font-medium">Gestão de vínculos</p><Badge variant="secondary">Em breve</Badge></div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">Convites e permissões serão habilitados quando o SIGA possuir contas de usuário. Nenhum acesso fictício é criado nesta versão local.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function PreferencesPanel({
  disabled,
  settings,
  onChange,
}: {
  disabled: boolean
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}) {
  const updatePreference = <K extends keyof AppSettings['preferences']>(key: K, value: AppSettings['preferences'][K]) => {
    onChange({ ...settings, preferences: { ...settings.preferences, [key]: value } })
  }

  return (
    <section aria-labelledby="settings-preferences-heading">
      <h2 id="settings-preferences-heading" className="font-display text-2xl font-semibold">Preferências</h2>
      <p className="mt-1 text-sm text-muted-foreground">Ajustes locais para começar cada visita ao SIGA do seu jeito.</p>
      <Card className="mt-5 shadow-book-xs">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Página inicial</span>
            <select
              className={fieldClass}
              value={settings.preferences.homePage}
              disabled={disabled}
              onChange={event => updatePreference('homePage', event.target.value as AppSettings['preferences']['homePage'])}
            >
              <option value="sweet-home">Sweet Home</option>
              <option value="house-book">Livro da Casa</option>
              <option value="financial">Financeiro</option>
            </select>
            <span className="block text-xs text-muted-foreground">Preferência salva localmente; a aplicação automática depende do futuro ajuste da navegação principal.</span>
          </label>
          <label className="space-y-1.5">
            <span className="flex items-center gap-2 text-sm font-medium">Formato de data <Badge variant="outline">Em breve</Badge></span>
            <select className={fieldClass} value={settings.preferences.dateFormat} disabled aria-disabled="true">
              <option value="long">Data por extenso</option>
              <option value="short">Data curta</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="flex items-center gap-2 text-sm font-medium">Densidade <Badge variant="outline">Em breve</Badge></span>
            <select className={fieldClass} value={settings.preferences.density} disabled aria-disabled="true">
              <option value="comfortable">Confortável</option>
              <option value="compact">Compacta</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="flex items-center gap-2 text-sm font-medium">Tema e destaque <Badge variant="outline">Em breve</Badge></span>
            <select className={fieldClass} value={`${settings.preferences.theme}:${settings.preferences.accentColor}`} disabled aria-disabled="true">
              <option value="light:wine">Claro · Vinho SIGA</option>
            </select>
          </label>
        </CardContent>
      </Card>
    </section>
  )
}

function NotificationsPanel({
  disabled,
  settings,
  onChange,
}: {
  disabled: boolean
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}) {
  const updateEvent = (event: AppNotificationEvent, checked: boolean) => onChange({
    ...settings,
    notifications: {
      ...settings.notifications,
      events: { ...settings.notifications.events, [event]: checked },
    },
  })
  const updateChannel = (channel: keyof AppSettings['notifications']['channels'], checked: boolean) => onChange({
    ...settings,
    notifications: {
      ...settings.notifications,
      channels: { ...settings.notifications.channels, [channel]: checked },
    },
  })

  return (
    <section aria-labelledby="settings-notifications-heading">
      <h2 id="settings-notifications-heading" className="font-display text-2xl font-semibold">Notificações</h2>
      <p className="mt-1 text-sm text-muted-foreground">Preferências locais para os acontecimentos que você quer acompanhar.</p>
      <Card className="mt-5 shadow-book-xs">
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span>Dentro do SIGA</span><input type="checkbox" checked={settings.notifications.channels.inApp} disabled={disabled} onChange={event => updateChannel('inApp', event.target.checked)} className="size-4 accent-primary" /></label>
            <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span>E-mail</span><input type="checkbox" checked={settings.notifications.channels.email} disabled={disabled} onChange={event => updateChannel('email', event.target.checked)} className="size-4 accent-primary" /></label>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Bell className="size-3.5" aria-hidden="true" />Estas opções são persistidas localmente; nenhum e-mail é enviado nesta versão.</p>
          <div className="divide-y rounded-lg border px-4">
            {(Object.keys(notificationEventLabels) as AppNotificationEvent[]).map(eventName => (
              <label key={eventName} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>{notificationEventLabels[eventName]}</span>
                <input type="checkbox" checked={settings.notifications.events[eventName]} disabled={disabled} onChange={event => updateEvent(eventName, event.target.checked)} className="size-4 accent-primary" />
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function SecurityPanel() {
  return (
    <section aria-labelledby="settings-security-heading">
      <h2 id="settings-security-heading" className="font-display text-2xl font-semibold">Segurança</h2>
      <p className="mt-1 text-sm text-muted-foreground">Recursos de conta e acesso do SIGA.</p>
      <Card className="mt-5 shadow-book-xs">
        <CardContent className="flex items-start gap-4 pt-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><LockKeyhole className="size-5" aria-hidden="true" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><p className="font-medium">Proteção de conta</p><Badge variant="secondary">Futura versão conectada</Badge></div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">Senha, autenticação em duas etapas e sessões serão implementadas somente quando houver backend e autenticação reais.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function SettingsPanel(props: SettingsPanelProps) {
  const { active } = props
  if (active === 'property') return <PropertySettingsForm value={props.propertyValues} onChange={props.onPropertyChange} onSave={props.onPropertySave} disabled={props.disabled} />
  if (active === 'rooms') return <RoomsSettingsPanel rooms={props.state.rooms} assets={props.state.assets} maintenanceRecords={props.state.maintenanceRecords} onAddRoom={props.onAddRoom} onUpdateRoom={props.onUpdateRoom} onArchiveRoom={props.onArchiveRoom} onFeedback={props.onFeedback} />
  if (active === 'categories') return <CategoriesPanel settings={props.settings} onChange={props.onSettingsChange} disabled={!!props.disabled} />
  if (active === 'people') return <PeoplePanel />
  if (active === 'preferences') return <PreferencesPanel settings={props.settings} onChange={props.onSettingsChange} disabled={!!props.disabled} />
  if (active === 'notifications') return <NotificationsPanel settings={props.settings} onChange={props.onSettingsChange} disabled={!!props.disabled} />
  if (active === 'security') return <SecurityPanel />
  return <DataPrivacyPanel state={props.state} onReset={props.onReset} onFeedback={props.onFeedback} />
}

export { SettingsPanel }
