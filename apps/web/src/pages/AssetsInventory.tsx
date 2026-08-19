import { useEffect, useRef, useState } from 'react'
import { Armchair, Clock3, Grid2X2, HousePlus, List, Package, Plus, Search, ShieldCheck, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { Asset, Room } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AssetDetails } from '@/features/assets-inventory/components/AssetDetails'
import { AssetForm } from '@/features/assets-inventory/components/AssetForm'
import { AssetItems } from '@/features/assets-inventory/components/AssetItems'
import { RoomForm } from '@/features/assets-inventory/components/RoomForm'
import {
  assetCategories,
  assetCategoryConfig,
  assetStatusConfig,
  assetStatuses,
  formatAssetDateShort,
  getAssetWarrantyStatus,
  getWarrantyDaysRemaining,
  isValidAssetDate,
  matchesAssetSearch,
  normalizeAssetCategory,
  normalizeAssetKind,
  normalizeAssetStatus,
  type AssetCategory,
  type AssetKind,
  type AssetWarrantyStatus,
  type CanonicalAssetStatus,
} from '@/features/assets-inventory/presentation'
import {
  getActiveRooms,
  getAssetById,
  getAssetDistributionByRoom,
  getAssetsByKind,
  getAssetsWithExpiringWarranty,
  getTotalAssetValue,
} from '@/store/selectors'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrencyBRL } from '@/lib/utils'

type ViewMode = 'cards' | 'list'
type Panel = 'create-asset' | 'edit-asset' | 'create-room' | 'edit-room' | null
type WarrantyFilter = 'all' | AssetWarrantyStatus

function getLocalISODate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function AssetsInventory() {
  const { state, dispatch } = useAppStore()
  const navigate = useNavigate()
  const [kind, setKind] = useState<AssetKind>('property')
  const [roomId, setRoomId] = useState('all')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | AssetCategory>('all')
  const [status, setStatus] = useState<'all' | CanonicalAssetStatus>('all')
  const [warranty, setWarranty] = useState<WarrantyFilter>('all')
  const [importantOnly, setImportantOnly] = useState(false)
  const [withDocument, setWithDocument] = useState(false)
  const [withTransaction, setWithTransaction] = useState(false)
  const [withChapter, setWithChapter] = useState(false)
  const [mode, setMode] = useState<ViewMode>('cards')
  const [selectedId, setSelectedId] = useState<string | null>(() => getAssetsByKind(state, 'property')[0]?.id ?? null)
  const [panel, setPanel] = useState<Panel>(null)
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [movingAssetId, setMovingAssetId] = useState<string | null>(null)
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const feedbackTimerRef = useRef<number | null>(null)
  const today = getLocalISODate()

  useEffect(() => () => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
  }, [])

  const activeRooms = getActiveRooms(state).filter(room => room.type !== 'general')
  const archivedRooms = [...state.rooms].filter(room => !room.active && room.type !== 'general').sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'pt-BR'))
  const kindCounts = {
    property: getAssetsByKind(state, 'property').length,
    inventory: getAssetsByKind(state, 'inventory').length,
  }
  const expiringWarranties = getAssetsWithExpiringWarranty(state, today)
  const distribution = getAssetDistributionByRoom(state).filter(item => item.itemCount > 0 && activeRooms.some(room => room.id === item.roomId))
  const roomsWithItems = activeRooms.filter(room => distribution.some(item => item.roomId === room.id)).length
  const currentItemCount = state.assets.length

  const visible = getAssetsByKind(state, kind)
    .filter(asset => roomId === 'all' || asset.roomId === roomId)
    .filter(asset => matchesAssetSearch(asset, search))
    .filter(asset => category === 'all' || normalizeAssetCategory(asset.category) === category)
    .filter(asset => status === 'all' || normalizeAssetStatus(asset.status) === status)
    .filter(asset => warranty === 'all' || getAssetWarrantyStatus(asset.warrantyEndDate, today) === warranty)
    .filter(asset => !importantOnly || asset.important)
    .filter(asset => !withDocument || state.documents.some(document => (Array.isArray(asset.documentIds) && asset.documentIds.includes(document.id)) || document.assetId === asset.id))
    .filter(asset => !withTransaction || state.financialTransactions.some(transaction => transaction.id === asset.financialTransactionId || transaction.assetId === asset.id))
    .filter(asset => !withChapter || state.chapters.some(chapter => chapter.id === asset.chapterId))
    .sort((a, b) => String(b.purchaseDate ?? '').localeCompare(String(a.purchaseDate ?? '')) || String(a.name ?? '').localeCompare(String(b.name ?? ''), 'pt-BR'))
  const selected = visible.find(asset => asset.id === selectedId) ?? visible[0]
  const showDetails = !!selected && panel !== 'edit-asset'
  const editingAsset = editingAssetId ? getAssetById(state, editingAssetId) : undefined
  const editingRoom = editingRoomId ? state.rooms.find(room => room.id === editingRoomId) : undefined

  const attentionItems = (() => {
    const alerts: { id: string; text: string; icon: typeof Wrench }[] = []
    expiringWarranties.forEach(asset => {
      const days = getWarrantyDaysRemaining(asset.warrantyEndDate, today)
      if (days === null) return
      const timing = days === 0 ? 'vence hoje' : days === 1 ? 'vence amanhã' : `vence em ${days} dias`
      alerts.push({ id: `warranty-${asset.id}`, text: `A garantia de ${asset.name} ${timing}.`, icon: ShieldCheck })
    })
    state.assets.forEach(asset => {
      const normalizedStatus = normalizeAssetStatus(asset.status)
      if (normalizedStatus === 'awaiting_delivery') alerts.push({ id: `delivery-${asset.id}`, text: `${asset.name} ainda está aguardando entrega.`, icon: Clock3 })
      if (normalizedStatus === 'maintenance') alerts.push({ id: `maintenance-status-${asset.id}`, text: `${asset.name} está em manutenção.`, icon: Wrench })
    })
    const futureCare = [
      ...state.maintenanceRoutines.filter(routine => routine.active && routine.assetId && isValidAssetDate(routine.nextDate) && routine.nextDate >= today).map(routine => ({ id: `routine-${routine.id}`, title: routine.title, date: routine.nextDate, assetId: routine.assetId! })),
      ...state.assets.flatMap(asset => state.maintenanceRecords
        .filter(record => (record.assetId === asset.id || (Array.isArray(asset.maintenanceIds) && asset.maintenanceIds.includes(record.id))) && !['completed', 'cancelled'].includes(String(record.status)) && isValidAssetDate(record.scheduledDate) && record.scheduledDate >= today)
        .map(record => ({ id: `record-${record.id}-${asset.id}`, title: record.title, date: record.scheduledDate, assetId: asset.id }))),
    ].sort((a, b) => a.date.localeCompare(b.date))
    futureCare.forEach(care => {
      const asset = getAssetById(state, care.assetId)
      if (asset && normalizeAssetStatus(asset.status) !== 'discarded') alerts.push({ id: care.id, text: `${care.title} de ${asset.name} está prevista para ${formatAssetDateShort(care.date)}.`, icon: Wrench })
    })
    return alerts.slice(0, 6)
  })()

  const hasFilters = !!search || roomId !== 'all' || category !== 'all' || status !== 'all' || warranty !== 'all' || importantOnly || withDocument || withTransaction || withChapter
  const selectedRoomIsEmpty = roomId !== 'all' && !state.assets.some(asset => asset.roomId === roomId)
  const nextRoomOrder = Math.max(-1, ...state.rooms.map(room => Number.isFinite(room.order) ? room.order : -1)) + 1

  function showFeedback(message: string) {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current)
    setFeedback(message)
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback('')
      feedbackTimerRef.current = null
    }, 2800)
  }

  function clearFilters() {
    setRoomId('all')
    setSearch('')
    setCategory('all')
    setStatus('all')
    setWarranty('all')
    setImportantOnly(false)
    setWithDocument(false)
    setWithTransaction(false)
    setWithChapter(false)
  }

  function saveAsset(asset: Asset) {
    if (panel === 'edit-asset') {
      dispatch({ type: 'UPDATE_ASSET', payload: { id: asset.id, changes: asset } })
      showFeedback('Item atualizado.')
    } else {
      dispatch({ type: 'ADD_ASSET', payload: asset })
      showFeedback('Item adicionado ao seu lar.')
    }
    setKind(normalizeAssetKind(asset.kind) ?? 'property')
    clearFilters()
    setSelectedId(asset.id)
    setPanel(null)
    setEditingAssetId(null)
    setMovingAssetId(null)
    setDeletingAssetId(null)
  }

  function deleteAsset() {
    if (!deletingAssetId || !getAssetById(state, deletingAssetId)) return
    dispatch({ type: 'DELETE_ASSET', payload: deletingAssetId })
    setSelectedId(null)
    setPanel(null)
    setEditingAssetId(null)
    setMovingAssetId(null)
    setDeletingAssetId(null)
    showFeedback('Item excluído.')
  }

  function moveAsset(nextRoomId: string) {
    if (!movingAssetId || !getAssetById(state, movingAssetId) || !nextRoomId) return
    dispatch({ type: 'UPDATE_ASSET', payload: { id: movingAssetId, changes: { roomId: nextRoomId } } })
    setMovingAssetId(null)
    showFeedback('Item movido de ambiente.')
  }

  function saveRoom(room: Room) {
    if (panel === 'edit-room') {
      dispatch({ type: 'UPDATE_ROOM', payload: { id: room.id, changes: room } })
      if (!room.active && roomId === room.id) setRoomId('all')
      showFeedback('Ambiente atualizado.')
    } else {
      dispatch({ type: 'ADD_ROOM', payload: room })
      showFeedback('Ambiente adicionado.')
    }
    setPanel(null)
    setEditingRoomId(null)
  }

  function archiveRoom() {
    if (!editingRoom) return
    dispatch({ type: 'ARCHIVE_ROOM', payload: editingRoom.id })
    if (roomId === editingRoom.id) setRoomId('all')
    setPanel(null)
    setEditingRoomId(null)
    showFeedback('Ambiente arquivado. Os itens associados foram preservados.')
  }

  function openRoomEditor(room: Room) {
    setEditingRoomId(room.id)
    setPanel('edit-room')
  }

  return <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1200px] space-y-8">
      <header className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">{currentItemCount} {currentItemCount === 1 ? 'item registrado' : 'itens registrados'}</p><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Patrimônio e Inventário</h1><p className="mt-1 text-sm text-muted-foreground sm:text-base">Tudo o que faz parte do seu lar, organizado com história e contexto.</p></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => { setPanel('create-room'); setEditingRoomId(null) }}><HousePlus aria-hidden="true"/>Cadastrar ambiente</Button><Button type="button" onClick={() => { setEditingAssetId(null); setPanel('create-asset') }}><Plus aria-hidden="true"/>Adicionar item</Button></div></header>

      {feedback ? <p role="status" className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">{feedback}</p> : null}
      {panel === 'create-asset' ? <AssetForm rooms={state.rooms} chapters={state.chapters} documents={state.documents} transactions={state.financialTransactions} onCancel={() => setPanel(null)} onSave={saveAsset} /> : null}
      {panel === 'edit-asset' && editingAsset ? <AssetForm key={editingAsset.id} initial={editingAsset} rooms={state.rooms} chapters={state.chapters} documents={state.documents} transactions={state.financialTransactions} onCancel={() => { setPanel(null); setEditingAssetId(null) }} onSave={saveAsset} /> : null}
      {panel === 'create-room' ? <RoomForm nextOrder={nextRoomOrder} onCancel={() => setPanel(null)} onSave={saveRoom} /> : null}
      {panel === 'edit-room' && editingRoom ? <RoomForm key={editingRoom.id} initial={editingRoom} nextOrder={nextRoomOrder} onCancel={() => { setPanel(null); setEditingRoomId(null) }} onSave={saveRoom} onArchive={archiveRoom} /> : null}

      <div className="flex w-fit gap-2 rounded-lg bg-secondary p-1"><Button type="button" size="sm" variant={kind === 'property' ? 'default' : 'ghost'} aria-pressed={kind === 'property'} onClick={() => setKind('property')}><Armchair aria-hidden="true"/>Patrimônio ({kindCounts.property})</Button><Button type="button" size="sm" variant={kind === 'inventory' ? 'default' : 'ghost'} aria-pressed={kind === 'inventory'} onClick={() => setKind('inventory')}><Package aria-hidden="true"/>Inventário ({kindCounts.inventory})</Button></div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        [Armchair, formatCurrencyBRL(getTotalAssetValue(state)), 'Valor registrado'],
        [Package, `${currentItemCount} ${currentItemCount === 1 ? 'item' : 'itens'}`, 'entre patrimônio e inventário'],
        [HousePlus, `${roomsWithItems} ${roomsWithItems === 1 ? 'ambiente' : 'ambientes'}`, 'com itens registrados'],
        [ShieldCheck, `${expiringWarranties.length} ${expiringWarranties.length === 1 ? 'garantia' : 'garantias'}`, expiringWarranties.length === 1 ? 'próxima do vencimento' : 'próximas do vencimento'],
      ].map(([Icon, value, label]) => { const IndicatorIcon = Icon as typeof Armchair; return <Card key={label as string} size="sm" className="shadow-book-xs"><CardContent className="flex min-h-[5rem] items-center justify-center gap-3"><IndicatorIcon className="size-5 text-primary" aria-hidden="true"/><div><p className="text-lg font-semibold">{value as string}</p><p className="text-xs text-muted-foreground">{label as string}</p></div></CardContent></Card> })}</section>

      <section><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold">Ambientes da casa</h2>{roomId !== 'all' ? <Button type="button" variant="ghost" size="sm" onClick={() => { const room = state.rooms.find(item => item.id === roomId); if (room) openRoomEditor(room) }}>Editar ambiente</Button> : null}</div><div className="mt-4 flex flex-wrap gap-2"><Button type="button" size="sm" variant={roomId === 'all' ? 'secondary' : 'outline'} aria-pressed={roomId === 'all'} onClick={() => setRoomId('all')}>Todos</Button>{activeRooms.map(room => { const roomDistribution = distribution.find(item => item.roomId === room.id); return <Button type="button" key={room.id} size="sm" variant={roomId === room.id ? 'secondary' : 'outline'} aria-pressed={roomId === room.id} onClick={() => setRoomId(room.id)}>{room.name} ({roomDistribution?.itemCount ?? 0}) · {formatCurrencyBRL(roomDistribution?.totalValue ?? 0)}</Button> })}</div>{archivedRooms.length ? <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Arquivados:</span>{archivedRooms.map(room => <Button type="button" key={room.id} variant="ghost" size="sm" onClick={() => openRoomEditor(room)}>{room.name}</Button>)}</div> : null}</section>

      <section className="rounded-lg bg-secondary/70 p-4"><h2 className="font-display text-lg font-semibold">Precisam da sua atenção</h2>{attentionItems.length ? <div className="mt-3 grid gap-2 sm:grid-cols-3">{attentionItems.map(alert => { const AlertIcon = alert.icon; return <p key={alert.id} className="flex gap-2 text-sm text-muted-foreground"><AlertIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true"/>{alert.text}</p> })}</div> : <p className="mt-2 text-sm text-muted-foreground">Tudo em ordem por aqui.</p>}</section>

      <section className="space-y-4"><div className="flex flex-wrap gap-2"><div className="relative min-w-56 flex-1"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar item" /></div><select aria-label="Filtrar por categoria" className="h-8 rounded-lg border bg-card px-3 text-sm" value={category} onChange={event => setCategory(event.target.value as 'all' | AssetCategory)}><option value="all">Todas as categorias</option>{assetCategories.map(id => <option key={id} value={id}>{assetCategoryConfig[id].label}</option>)}</select><select aria-label="Filtrar por status" className="h-8 rounded-lg border bg-card px-3 text-sm" value={status} onChange={event => setStatus(event.target.value as 'all' | CanonicalAssetStatus)}><option value="all">Todos os status</option>{assetStatuses.map(id => <option key={id} value={id}>{assetStatusConfig[id].label}</option>)}</select><select aria-label="Filtrar por garantia" className="h-8 rounded-lg border bg-card px-3 text-sm" value={warranty} onChange={event => setWarranty(event.target.value as WarrantyFilter)}><option value="all">Todas as garantias</option><option value="valid">Vigentes</option><option value="expiring">Vencem em breve</option><option value="expired">Vencidas</option><option value="unknown">Sem informação</option></select><Button type="button" variant={mode === 'cards' ? 'secondary' : 'outline'} size="icon" aria-label="Visualização em cards" aria-pressed={mode === 'cards'} onClick={() => setMode('cards')}><Grid2X2 aria-hidden="true"/></Button><Button type="button" variant={mode === 'list' ? 'secondary' : 'outline'} size="icon" aria-label="Visualização em lista" aria-pressed={mode === 'list'} onClick={() => setMode('list')}><List aria-hidden="true"/></Button></div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant={importantOnly ? 'secondary' : 'outline'} size="sm" aria-pressed={importantOnly} onClick={() => setImportantOnly(!importantOnly)}>Importantes</Button><Button type="button" variant={withDocument ? 'secondary' : 'outline'} size="sm" aria-pressed={withDocument} onClick={() => setWithDocument(!withDocument)}>Com documento</Button><Button type="button" variant={withTransaction ? 'secondary' : 'outline'} size="sm" aria-pressed={withTransaction} onClick={() => setWithTransaction(!withTransaction)}>Com movimentação</Button><Button type="button" variant={withChapter ? 'secondary' : 'outline'} size="sm" aria-pressed={withChapter} onClick={() => setWithChapter(!withChapter)}>Com capítulo</Button>{hasFilters ? <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Limpar filtros</Button> : null}</div>
        <div className={showDetails ? 'grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]' : ''}>{visible.length ? <AssetItems items={visible} rooms={state.rooms} state={state} selectedId={selected?.id ?? null} onSelect={asset => { setSelectedId(asset.id); setPanel(null); setEditingAssetId(null); setMovingAssetId(null); setDeletingAssetId(null) }} mode={mode} /> : <Card><CardContent className="py-12 text-center"><h3 className="font-display text-xl font-semibold">{state.assets.length === 0 ? 'Sua casa ainda está começando a ganhar forma' : selectedRoomIsEmpty ? 'Este ambiente ainda está vazio' : 'Nenhum item encontrado'}</h3><p className="mt-2 text-sm text-muted-foreground">{state.assets.length === 0 ? 'Adicione móveis, equipamentos, acabamentos e outros itens para construir o inventário do seu lar.' : selectedRoomIsEmpty ? 'Adicione um item para começar a contar a história deste espaço.' : 'Ajuste os filtros para encontrar o que procura.'}</p><div className="mt-5 flex justify-center gap-2"><Button type="button" onClick={() => { setEditingAssetId(null); setPanel('create-asset') }}>Adicionar item</Button>{hasFilters ? <Button type="button" variant="outline" onClick={clearFilters}>Limpar filtros</Button> : null}</div></CardContent></Card>}{showDetails && selected ? <aside className="xl:sticky xl:top-20"><AssetDetails item={selected} state={state} confirmingDelete={deletingAssetId === selected.id} moving={movingAssetId === selected.id} onEdit={() => { setEditingAssetId(selected.id); setPanel('edit-asset') }} onMove={() => { setMovingAssetId(selected.id); setDeletingAssetId(null) }} onToggleImportant={() => { dispatch({ type: 'UPDATE_ASSET', payload: { id: selected.id, changes: { important: !selected.important } } }); showFeedback(selected.important ? 'Item removido dos importantes.' : 'Item marcado como importante.') }} onRegisterMaintenance={() => navigate(`/manutencao?assetId=${encodeURIComponent(selected.id)}`)} onAskDelete={() => { setDeletingAssetId(selected.id); setMovingAssetId(null) }} onCancelDelete={() => setDeletingAssetId(null)} onDelete={deleteAsset} onCancelMove={() => setMovingAssetId(null)} onMoveToRoom={moveAsset} /></aside> : null}</div>
      </section>

      <section><h2 className="font-display text-xl font-semibold">O que compõe cada espaço</h2>{distribution.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{distribution.map(item => <Card key={item.roomId} size="sm"><CardContent><div className="flex justify-between gap-3 text-sm"><span>{item.roomName} · {item.itemCount} {item.itemCount === 1 ? 'item' : 'itens'}</span><span>{formatCurrencyBRL(item.totalValue)}</span></div><div className="mt-2 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }}/></div></CardContent></Card>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Adicione itens aos ambientes para visualizar a distribuição.</p>}</section>

      <section className="rounded-lg bg-secondary/70 p-5 sm:flex sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-semibold">Cada objeto também guarda uma história</h2><p className="mt-1 text-sm text-muted-foreground">Vincule itens a capítulos para lembrar quando chegaram e como passaram a fazer parte da casa.</p></div><Button type="button" variant="ghost" className="mt-3 sm:mt-0" onClick={() => navigate('/livro-da-casa')}>Ver capítulos relacionados</Button></section>
    </div>
  </div>
}

export { AssetsInventory }
