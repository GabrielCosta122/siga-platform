import { useState, type FormEvent } from 'react'
import type { Asset, Chapter, FinancialTransaction, HouseDocument, Room } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createEntityId } from '@/lib/utils'
import {
  assetCategories,
  assetCategoryConfig,
  assetKindConfig,
  assetKinds,
  assetStatusConfig,
  assetStatuses,
  getSafeAssetValue,
  isValidAssetDate,
  normalizeAssetCategory,
  normalizeAssetKind,
  normalizeAssetStatus,
  parseAssetValueBRL,
  type AssetCategory,
  type AssetKind,
  type CanonicalAssetStatus,
} from '@/features/assets-inventory/presentation'

type AssetFormProps = {
  initial?: Asset
  rooms: Room[]
  chapters: Chapter[]
  documents: HouseDocument[]
  transactions: FinancialTransaction[]
  onCancel: () => void
  onSave: (asset: Asset) => void
}

type Errors = Partial<Record<'name' | 'kind' | 'roomId' | 'category' | 'status' | 'value' | 'purchaseDate' | 'installationDate' | 'warrantyEndDate', string>>
const fieldClass = 'h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function AssetForm({ initial, rooms, chapters, documents, transactions, onCancel, onSave }: AssetFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<AssetKind>(normalizeAssetKind(initial?.kind) ?? 'property')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [roomId, setRoomId] = useState(initial?.roomId ?? '')
  const [category, setCategory] = useState<AssetCategory>(normalizeAssetCategory(initial?.category) ?? 'Outros')
  const [status, setStatus] = useState<CanonicalAssetStatus>(normalizeAssetStatus(initial?.status) ?? 'in_use')
  const [important, setImportant] = useState(initial?.important ?? false)
  const [value, setValue] = useState(initial ? getSafeAssetValue(initial.value).toFixed(2).replace('.', ',') : '')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? '')
  const [installationDate, setInstallationDate] = useState(initial?.installationDate ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [serialNumber, setSerialNumber] = useState(initial?.serialNumber ?? '')
  const [supplier, setSupplier] = useState(initial?.supplier ?? '')
  const [warrantyEndDate, setWarrantyEndDate] = useState(initial?.warrantyEndDate ?? '')
  const [chapterId, setChapterId] = useState(initial?.chapterId ?? '')
  const [documentIds, setDocumentIds] = useState<string[]>(Array.isArray(initial?.documentIds) ? [...new Set(initial.documentIds.filter((id): id is string => typeof id === 'string'))] : [])
  const [financialTransactionId, setFinancialTransactionId] = useState(initial?.financialTransactionId ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const activeRooms = [...rooms].filter(room => room.active && (room.type !== 'general' || room.id === initial?.roomId)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'pt-BR'))
  const initialRoom = initial?.roomId ? rooms.find(room => room.id === initial.roomId) : undefined
  const missingRoom = initial?.roomId && !activeRooms.some(room => room.id === initial.roomId)
  const missingChapter = initial?.chapterId && !chapters.some(chapter => chapter.id === initial.chapterId)
  const missingTransaction = initial?.financialTransactionId && !transactions.some(transaction => transaction.id === initial.financialTransactionId)
  const missingDocumentIds = documentIds.filter(id => !documents.some(document => document.id === id))

  function toggleDocument(documentId: string) {
    setDocumentIds(current => current.includes(documentId) ? current.filter(id => id !== documentId) : [...current, documentId])
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const parsedValue = value.trim() ? parseAssetValueBRL(value) : 0
    const nextErrors: Errors = {}
    if (!name.trim()) nextErrors.name = 'Informe o nome deste item.'
    if (!normalizeAssetKind(kind)) nextErrors.kind = 'Escolha se este registro é Patrimônio ou Inventário.'
    if (!roomId) nextErrors.roomId = 'Escolha o ambiente.'
    if (!normalizeAssetCategory(category)) nextErrors.category = 'Escolha uma categoria.'
    if (!normalizeAssetStatus(status)) nextErrors.status = 'Escolha o status.'
    if (!Number.isFinite(parsedValue) || parsedValue < 0) nextErrors.value = 'Informe um valor igual ou maior que zero.'
    if (purchaseDate && !isValidAssetDate(purchaseDate)) nextErrors.purchaseDate = 'Informe uma data de compra válida.'
    if (installationDate && !isValidAssetDate(installationDate)) nextErrors.installationDate = 'Informe uma data de instalação válida.'
    if (warrantyEndDate && !isValidAssetDate(warrantyEndDate)) nextErrors.warrantyEndDate = 'Informe uma data de garantia válida.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const now = new Date().toISOString()
    onSave({
      id: initial?.id ?? createEntityId('asset'),
      name: name.trim(),
      kind,
      description: description.trim(),
      roomId,
      category,
      value: parsedValue,
      status,
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      purchaseDate: purchaseDate || null,
      installationDate: installationDate || null,
      warrantyEndDate: warrantyEndDate || null,
      supplier: supplier.trim(),
      important,
      image: initial?.image ?? '',
      chapterId: chapterId || null,
      documentIds,
      financialTransactionId: financialTransactionId || null,
      maintenanceIds: Array.isArray(initial?.maintenanceIds) ? initial.maintenanceIds : [],
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return <Card className="border-primary/20 shadow-book-sm">
    <CardHeader><CardTitle className="font-display text-xl">{initial ? 'Editar item' : 'Adicionar item'}</CardTitle></CardHeader>
    <CardContent>
      <form className="space-y-6" onSubmit={submit} noValidate>
        <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="mb-3 font-display text-base font-semibold">Identificação</legend>
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Nome</span><Input value={name} onChange={event => setName(event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'asset-name-error' : undefined} placeholder="Nome do item" />{errors.name ? <span id="asset-name-error" className="block text-xs text-destructive">{errors.name}</span> : null}</label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Tipo</span><select className={fieldClass} value={kind} onChange={event => setKind(event.target.value as AssetKind)} aria-invalid={!!errors.kind} aria-describedby={errors.kind ? 'asset-kind-error' : undefined}>{assetKinds.map(id => <option key={id} value={id}>{assetKindConfig[id].label}</option>)}</select>{errors.kind ? <span id="asset-kind-error" className="block text-xs text-destructive">{errors.kind}</span> : null}</label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Ambiente</span><select className={fieldClass} value={roomId} onChange={event => setRoomId(event.target.value)} aria-invalid={!!errors.roomId} aria-describedby={errors.roomId ? 'asset-room-error' : undefined}><option value="">Escolha um ambiente</option>{missingRoom ? <option value={initial!.roomId!}>{initialRoom ? `${initialRoom.name} (arquivado)` : 'Ambiente não disponível'}</option> : null}{activeRooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</select>{errors.roomId ? <span id="asset-room-error" className="block text-xs text-destructive">{errors.roomId}</span> : null}</label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Categoria</span><select className={fieldClass} value={category} onChange={event => setCategory(event.target.value as AssetCategory)} aria-invalid={!!errors.category} aria-describedby={errors.category ? 'asset-category-error' : undefined}>{assetCategories.map(id => <option key={id} value={id}>{assetCategoryConfig[id].label}</option>)}</select>{errors.category ? <span id="asset-category-error" className="block text-xs text-destructive">{errors.category}</span> : null}</label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Status</span><select className={fieldClass} value={status} onChange={event => setStatus(event.target.value as CanonicalAssetStatus)} aria-invalid={!!errors.status} aria-describedby={errors.status ? 'asset-status-error' : undefined}>{assetStatuses.map(id => <option key={id} value={id}>{assetStatusConfig[id].label}</option>)}</select>{errors.status ? <span id="asset-status-error" className="block text-xs text-destructive">{errors.status}</span> : null}</label>
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Descrição</span><Textarea value={description} onChange={event => setDescription(event.target.value)} className="min-h-20" /></label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={important} onChange={event => setImportant(event.target.checked)} className="size-4 accent-primary" /> Marcar como importante</label>
        </fieldset>

        <fieldset className="grid gap-4 border-t pt-5 sm:grid-cols-2"><legend className="mb-3 font-display text-base font-semibold">Financeiro</legend>
          <label className="space-y-1.5"><span className="text-sm font-medium">Valor</span><Input inputMode="decimal" value={value} onChange={event => setValue(event.target.value)} aria-invalid={!!errors.value} aria-describedby={errors.value ? 'asset-value-error' : undefined} placeholder="R$ 0,00" />{errors.value ? <span id="asset-value-error" className="block text-xs text-destructive">{errors.value}</span> : null}</label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Data de compra</span><Input type="date" value={purchaseDate} onChange={event => setPurchaseDate(event.target.value)} aria-invalid={!!errors.purchaseDate} aria-describedby={errors.purchaseDate ? 'asset-purchase-error' : undefined} />{errors.purchaseDate ? <span id="asset-purchase-error" className="block text-xs text-destructive">{errors.purchaseDate}</span> : null}</label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Data de instalação</span><Input type="date" value={installationDate} onChange={event => setInstallationDate(event.target.value)} aria-invalid={!!errors.installationDate} aria-describedby={errors.installationDate ? 'asset-installation-error' : undefined} />{errors.installationDate ? <span id="asset-installation-error" className="block text-xs text-destructive">{errors.installationDate}</span> : null}</label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Garantia até</span><Input type="date" value={warrantyEndDate} onChange={event => setWarrantyEndDate(event.target.value)} aria-invalid={!!errors.warrantyEndDate} aria-describedby={errors.warrantyEndDate ? 'asset-warranty-error' : undefined} />{errors.warrantyEndDate ? <span id="asset-warranty-error" className="block text-xs text-destructive">{errors.warrantyEndDate}</span> : null}</label>
        </fieldset>

        <fieldset className="grid gap-4 border-t pt-5 sm:grid-cols-2"><legend className="mb-3 font-display text-base font-semibold">Produto</legend>
          <label className="space-y-1.5"><span className="text-sm font-medium">Marca</span><Input value={brand} onChange={event => setBrand(event.target.value)} /></label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Modelo</span><Input value={model} onChange={event => setModel(event.target.value)} /></label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Número de série</span><Input value={serialNumber} onChange={event => setSerialNumber(event.target.value)} /></label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Fornecedor</span><Input value={supplier} onChange={event => setSupplier(event.target.value)} /></label>
        </fieldset>

        <fieldset className="grid gap-4 border-t pt-5 sm:grid-cols-2"><legend className="mb-3 font-display text-base font-semibold">Relações</legend>
          <label className="space-y-1.5"><span className="text-sm font-medium">Capítulo relacionado</span><select className={fieldClass} value={chapterId} onChange={event => setChapterId(event.target.value)}><option value="">Nenhum capítulo</option>{missingChapter ? <option value={initial!.chapterId!}>Capítulo relacionado não disponível</option> : null}{chapters.map(chapter => <option key={chapter.id} value={chapter.id}>{chapter.title} · {chapter.date}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Movimentação financeira</span><select className={fieldClass} value={financialTransactionId} onChange={event => setFinancialTransactionId(event.target.value)}><option value="">Nenhuma movimentação</option>{missingTransaction ? <option value={initial!.financialTransactionId!}>Movimentação relacionada não disponível</option> : null}{transactions.map(transaction => <option key={transaction.id} value={transaction.id}>{transaction.title} · {transaction.date}</option>)}</select></label>
          <div className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Documentos relacionados</span>{documents.length || missingDocumentIds.length ? <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border bg-card p-3 sm:grid-cols-2">{missingDocumentIds.map(id => <label key={id} className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked onChange={() => toggleDocument(id)} className="mt-0.5 size-4 accent-primary" /> Documento relacionado não disponível</label>)}{documents.map(document => <label key={document.id} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={documentIds.includes(document.id)} onChange={() => toggleDocument(document.id)} className="mt-0.5 size-4 accent-primary" /><span>{document.name}</span></label>)}</div> : <p className="text-xs text-muted-foreground">Nenhum documento disponível.</p>}</div>
        </fieldset>

        <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button><Button type="submit">{initial ? 'Salvar alterações' : 'Adicionar item'}</Button></div>
      </form>
    </CardContent>
  </Card>
}

export { AssetForm }
