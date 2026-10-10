import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock3, LoaderCircle, Save } from 'lucide-react'
import type { AppSettings, Room } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { SettingsNav, type SettingsSection } from '@/features/settings/components/SettingsNav'
import { SettingsPanel } from '@/features/settings/components/SettingsPanel'
import { SettingsStatusCard } from '@/features/settings/components/SettingsStatusCard'
import {
  createPropertySettingsValues,
  PROPERTY_SETTINGS_FORM_ID,
  type PropertySettingsUpdate,
  type PropertySettingsValues,
} from '@/features/settings/property-settings'
import { useAppStore } from '@/store/useAppStore'

type SaveState = 'saved' | 'pending' | 'saving'

const equal = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)

function Settings() {
  const { state, dispatch, resetAppData, saveProperty: persistProperty } = useAppStore()
  const [active, setActive] = useState<SettingsSection>('property')
  const [propertyDraft, setPropertyDraft] = useState<PropertySettingsValues | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldSubmitPropertyRef = useRef(false)

  useEffect(() => () => {
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current)
  }, [])

  useEffect(() => {
    if (active !== 'property' || !shouldSubmitPropertyRef.current) return
    const frame = requestAnimationFrame(() => {
      shouldSubmitPropertyRef.current = false
      const form = document.getElementById(PROPERTY_SETTINGS_FORM_ID)
      if (form instanceof HTMLFormElement) form.requestSubmit()
    })
    return () => cancelAnimationFrame(frame)
  }, [active])

  const propertyValues = propertyDraft ?? createPropertySettingsValues(state.property)
  const currentSettings = settingsDraft ?? state.settings
  const propertyDirty = propertyDraft !== null && !equal(propertyDraft, createPropertySettingsValues(state.property))
  const settingsDirty = settingsDraft !== null && !equal(settingsDraft, state.settings)
  const hasPendingChanges = propertyDirty || settingsDirty
  const saveState: SaveState = saving ? 'saving' : hasPendingChanges ? 'pending' : 'saved'

  const savePresentation = {
    saved: { label: 'Todas as alterações estão salvas', icon: CheckCircle2, className: 'text-success' },
    pending: { label: 'Há alterações pendentes', icon: Clock3, className: 'text-warning-foreground' },
    saving: { label: 'Salvando alterações…', icon: LoaderCircle, className: 'text-primary' },
  } satisfies Record<SaveState, { label: string; icon: typeof CheckCircle2; className: string }>
  const currentSavePresentation = savePresentation[saveState]
  const SaveStateIcon = currentSavePresentation.icon

  function showSaving() {
    setSaving(true)
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current)
    savingTimerRef.current = setTimeout(() => {
      setSaving(false)
      savingTimerRef.current = null
    }, 450)
  }

  async function saveProperty(changes: PropertySettingsUpdate) {
    if (saving) return
    setSaving(true)
    setFeedback('')
    try {
      await persistProperty(changes)
      saveSettings(false)
      setPropertyDraft(null)
      setFeedback('Alterações salvas.')
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'Não foi possível salvar o imóvel.')
    } finally { setSaving(false) }
  }

  function saveSettings(animate = true) {
    if (!settingsDraft || !settingsDirty) return
    if (animate) showSaving()
    if (!equal(settingsDraft.preferences, state.settings.preferences)) {
      dispatch({ type: 'UPDATE_APP_PREFERENCES', payload: settingsDraft.preferences })
    }
    if (!equal(settingsDraft.notifications, state.settings.notifications)) {
      dispatch({
        type: 'UPDATE_NOTIFICATION_SETTINGS',
        payload: {
          channels: settingsDraft.notifications.channels,
          events: settingsDraft.notifications.events,
        },
      })
    }
    settingsDraft.categories.forEach(category => {
      const current = state.settings.categories.find(item => item.scope === category.scope && item.id === category.id)
      if (!current || equal(current, category)) return
      dispatch({
        type: 'UPDATE_CATEGORY_SETTING',
        payload: {
          scope: category.scope,
          id: category.id,
          changes: {
            label: category.label.trim() || current.label,
            tone: category.tone,
            active: category.active,
            order: category.order,
          },
        },
      })
    })
    setSettingsDraft(null)
    setFeedback('Alterações salvas.')
  }

  function saveFromHeader() {
    if (propertyDirty && active === 'property') {
      const form = document.getElementById(PROPERTY_SETTINGS_FORM_ID)
      if (form instanceof HTMLFormElement) form.requestSubmit()
      return
    }
    if (propertyDirty) {
      shouldSubmitPropertyRef.current = true
      setActive('property')
      return
    }
    saveSettings()
  }

  function addRoom(room: Room) {
    dispatch({ type: 'ADD_ROOM', payload: room })
  }

  function updateRoom(id: string, changes: Partial<Room>) {
    dispatch({ type: 'UPDATE_ROOM', payload: { id, changes } })
  }

  function archiveRoom(id: string) {
    dispatch({ type: 'ARCHIVE_ROOM', payload: id })
  }

  function resetData() {
    resetAppData()
    setPropertyDraft(null)
    setSettingsDraft(null)
    setSaving(false)
  }

  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] space-y-8">
        <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Configurações</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">Organize as bases que sustentam a história da sua casa.</p>
            <p className={`mt-3 flex items-center gap-1.5 text-xs ${currentSavePresentation.className}`} aria-live="polite">
              <SaveStateIcon className={`size-3.5 ${saveState === 'saving' ? 'animate-spin' : ''}`} aria-hidden="true" />
              {currentSavePresentation.label}
            </p>
            {feedback ? <p role="status" className="mt-1 text-xs text-muted-foreground">{feedback}</p> : null}
          </div>
          <Button
            type="button"
            onClick={saveFromHeader}
            disabled={!hasPendingChanges || saving}
          >
            <Save aria-hidden="true" />
            Salvar alterações
          </Button>
        </header>

        <div className="grid items-start gap-7 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-20">
            <SettingsNav active={active} onChange={setActive} />
          </aside>
          <SettingsPanel
            active={active}
            state={state}
            settings={currentSettings}
            propertyValues={propertyValues}
            disabled={saving}
            onPropertyChange={value => {
              setPropertyDraft(value)
              setFeedback('')
            }}
            onPropertySave={changes => { void saveProperty(changes) }}
            onSettingsChange={nextSettings => {
              setSettingsDraft(nextSettings)
              setFeedback('')
            }}
            onAddRoom={addRoom}
            onUpdateRoom={updateRoom}
            onArchiveRoom={archiveRoom}
            onReset={resetData}
            onFeedback={setFeedback}
          />
        </div>

        <SettingsStatusCard state={state} />
      </div>
    </div>
  )
}

export { Settings }
