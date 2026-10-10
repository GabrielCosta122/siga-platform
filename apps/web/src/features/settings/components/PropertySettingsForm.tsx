import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  isValidPropertyDate,
  PROPERTY_SETTINGS_FORM_ID,
  type PropertySettingsFormProps,
  type PropertySettingsValues,
} from '@/features/settings/property-settings'

const fieldClass = 'space-y-1.5'

type PropertyField = keyof PropertySettingsValues
type PropertyErrors = Partial<Record<PropertyField, string>>

function PropertySettingsForm({
  value,
  onChange,
  onSave,
  formId = PROPERTY_SETTINGS_FORM_ID,
  disabled = false,
  showSubmitButton = false,
}: PropertySettingsFormProps) {
  const [errors, setErrors] = useState<PropertyErrors>({})

  function change(field: PropertyField, nextValue: string) {
    onChange({ ...value, [field]: nextValue })
    if (errors[field]) setErrors(current => ({ ...current, [field]: undefined }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const bedrooms = Number(value.bedrooms)
    const parkingSpaces = Number(value.parkingSpaces)
    const nextErrors: PropertyErrors = {}

    if (!value.name.trim()) nextErrors.name = 'Informe o nome do imóvel.'
    if (!value.identification.trim()) nextErrors.identification = 'Informe a identificação do imóvel.'
    if (!value.type.trim()) nextErrors.type = 'Informe o tipo do imóvel.'
    if (!value.currentStage.trim()) nextErrors.currentStage = 'Informe a etapa atual.'
    if (value.signatureDate && !isValidPropertyDate(value.signatureDate)) nextErrors.signatureDate = 'Informe uma data de assinatura válida.'
    if (value.expectedDeliveryDate && !isValidPropertyDate(value.expectedDeliveryDate)) nextErrors.expectedDeliveryDate = 'Informe uma previsão de entrega válida.'
    if (value.state.trim() && !/^[A-Za-z]{2}$/.test(value.state.trim())) nextErrors.state = 'Informe a UF com duas letras.'
    if (!value.bedrooms.trim() || !Number.isInteger(bedrooms) || bedrooms < 0) nextErrors.bedrooms = 'Informe uma quantidade de quartos válida.'
    if (!value.parkingSpaces.trim() || !Number.isInteger(parkingSpaces) || parkingSpaces < 0) nextErrors.parkingSpaces = 'Informe uma quantidade de vagas válida.'
    if (/^(?:blob:|data:)/i.test(value.coverImage.trim())) nextErrors.coverImage = 'Use um endereço de imagem, sem dados Base64 ou URL temporária.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => {
        const form = document.getElementById(formId)
        form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      })
      return
    }

    onSave({
      name: value.name.trim(),
      identification: value.identification.trim(),
      type: value.type.trim(),
      currentStage: value.currentStage.trim(),
      signatureDate: value.signatureDate,
      expectedDeliveryDate: value.expectedDeliveryDate,
      address: value.address.trim(),
      city: value.city.trim(),
      state: value.state.trim().toUpperCase(),
      privateArea: value.privateArea.trim(),
      bedrooms,
      parkingSpaces,
      coverImage: value.coverImage.trim(),
    })
  }

  return <section aria-labelledby="property-settings-heading">
    <h2 id="property-settings-heading" className="font-display text-2xl font-semibold">Meu imóvel</h2>
    <p className="mt-1 text-sm text-muted-foreground">As informações que aparecem na Sweet Home.</p>
    <Card className="mt-5 shadow-book-xs">
      <CardContent className="pt-6">
        <form id={formId} className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
          <label className={fieldClass}><span className="text-sm font-medium">Nome do imóvel</span><Input required disabled={disabled} value={value.name} onChange={event => change('name', event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'property-name-error' : undefined} />{errors.name ? <span id="property-name-error" className="block text-xs text-destructive">{errors.name}</span> : null}</label>
          <label className={fieldClass}><span className="text-sm font-medium">Identificação</span><Input required disabled={disabled} value={value.identification} onChange={event => change('identification', event.target.value)} aria-invalid={!!errors.identification} aria-describedby={errors.identification ? 'property-identification-error' : undefined} />{errors.identification ? <span id="property-identification-error" className="block text-xs text-destructive">{errors.identification}</span> : null}</label>
          <label className={fieldClass}><span className="text-sm font-medium">Tipo</span><Input required disabled={disabled} value={value.type} onChange={event => change('type', event.target.value)} aria-invalid={!!errors.type} aria-describedby={errors.type ? 'property-type-error' : undefined} />{errors.type ? <span id="property-type-error" className="block text-xs text-destructive">{errors.type}</span> : null}</label>
          <label className={fieldClass}><span className="text-sm font-medium">Etapa atual</span><Input required disabled={disabled} value={value.currentStage} onChange={event => change('currentStage', event.target.value)} aria-invalid={!!errors.currentStage} aria-describedby={errors.currentStage ? 'property-stage-error' : undefined} />{errors.currentStage ? <span id="property-stage-error" className="block text-xs text-destructive">{errors.currentStage}</span> : null}</label>
          <label className={fieldClass}><span className="text-sm font-medium">Data da assinatura</span><Input type="date" disabled={disabled} value={value.signatureDate} onChange={event => change('signatureDate', event.target.value)} aria-invalid={!!errors.signatureDate} aria-describedby={errors.signatureDate ? 'property-signature-error' : undefined} />{errors.signatureDate ? <span id="property-signature-error" className="block text-xs text-destructive">{errors.signatureDate}</span> : null}</label>
          <label className={fieldClass}><span className="text-sm font-medium">Previsão de entrega</span><Input type="date" disabled={disabled} value={value.expectedDeliveryDate} onChange={event => change('expectedDeliveryDate', event.target.value)} aria-invalid={!!errors.expectedDeliveryDate} aria-describedby={errors.expectedDeliveryDate ? 'property-delivery-error' : undefined} />{errors.expectedDeliveryDate ? <span id="property-delivery-error" className="block text-xs text-destructive">{errors.expectedDeliveryDate}</span> : null}</label>
          <label className={`${fieldClass} sm:col-span-2`}><span className="text-sm font-medium">Endereço</span><Input disabled={disabled} value={value.address} onChange={event => change('address', event.target.value)} /></label>
          <label className={fieldClass}><span className="text-sm font-medium">Cidade</span><Input disabled={disabled} value={value.city} onChange={event => change('city', event.target.value)} /></label>
          <label className={fieldClass}><span className="text-sm font-medium">Estado</span><Input disabled={disabled} maxLength={2} value={value.state} onChange={event => change('state', event.target.value)} aria-invalid={!!errors.state} aria-describedby={errors.state ? 'property-state-error' : undefined} placeholder="UF" />{errors.state ? <span id="property-state-error" className="block text-xs text-destructive">{errors.state}</span> : null}</label>
          <label className={fieldClass}><span className="text-sm font-medium">Área privativa</span><Input disabled={disabled} value={value.privateArea} onChange={event => change('privateArea', event.target.value)} placeholder="Ex.: 72 m²" /></label>
          <label className={fieldClass}><span className="text-sm font-medium">Quartos</span><Input type="number" min="0" step="1" required disabled={disabled} value={value.bedrooms} onChange={event => change('bedrooms', event.target.value)} aria-invalid={!!errors.bedrooms} aria-describedby={errors.bedrooms ? 'property-bedrooms-error' : undefined} />{errors.bedrooms ? <span id="property-bedrooms-error" className="block text-xs text-destructive">{errors.bedrooms}</span> : null}</label>
          <label className={fieldClass}><span className="text-sm font-medium">Vagas</span><Input type="number" min="0" step="1" required disabled={disabled} value={value.parkingSpaces} onChange={event => change('parkingSpaces', event.target.value)} aria-invalid={!!errors.parkingSpaces} aria-describedby={errors.parkingSpaces ? 'property-parking-error' : undefined} />{errors.parkingSpaces ? <span id="property-parking-error" className="block text-xs text-destructive">{errors.parkingSpaces}</span> : null}</label>
          <label className={`${fieldClass} sm:col-span-2`}><span className="text-sm font-medium">Foto principal</span><Input disabled={disabled} value={value.coverImage} onChange={event => change('coverImage', event.target.value)} aria-invalid={!!errors.coverImage} aria-describedby={errors.coverImage ? 'property-cover-error' : undefined} placeholder="Endereço da imagem" />{errors.coverImage ? <span id="property-cover-error" className="block text-xs text-destructive">{errors.coverImage}</span> : null}</label>
          {showSubmitButton ? <div className="flex justify-end border-t pt-4 sm:col-span-2"><Button type="submit" disabled={disabled}>Salvar alterações</Button></div> : null}
        </form>
      </CardContent>
    </Card>
  </section>
}

export { PropertySettingsForm }
