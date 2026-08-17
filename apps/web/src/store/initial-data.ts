import type { Chapter } from '@/domain/types'
import type { AppState } from './app-state'

const timestamp = '2026-07-25T12:00:00.000Z'
const folders = [
  ['folder-property', 'Compra do imóvel'], ['folder-construction', 'Obra'], ['folder-financial', 'Financeiro'],
  ['folder-projects', 'Projetos'], ['folder-warranties', 'Garantias'],
] as const
const roomNames = ['Sala', 'Cozinha', 'Quarto principal', 'Escritório', 'Banheiro', 'Varanda', 'Área de serviço', 'Geral']

const initialState: AppState = {
  schemaVersion: 1,
  property: { id: 'property-reserva-palmeiras-1204', name: 'Reserva das Palmeiras', identification: 'Apartamento 1204', type: 'Apartamento', currentStage: 'Construção', signatureDate: '2026-02-15', expectedDeliveryDate: '2027-06-30', address: '', city: 'São Paulo', state: 'SP', privateArea: '72 m²', bedrooms: 2, parkingSpaces: 1, coverImage: '/src/assets/Imagens/sweet-home/construction-foundation.png.png', createdAt: timestamp, updatedAt: timestamp },
  chapters: [
    { id: 'CAP-018', title: 'Atualização da obra — estrutura do 12º andar', content: 'A estrutura do último pavimento começou a ganhar forma e tornou a chegada mais real.', category: 'construction', date: '2026-07-12', important: true, impacts: ['property', 'schedule'], photos: [{ id: 'photo-cap-018-1', name: 'Estrutura do 12º andar', src: '/src/assets/Imagens/sweet-home/construction-foundation.png.png', alt: 'Estrutura da obra', caption: '', isCover: true, createdAt: timestamp }], documentIds: ['report'], financialTransactionIds: ['work'], assetIds: [], maintenanceIds: [], coverPhotoId: 'photo-cap-018-1' },
    { id: 'july-visit', title: 'Visita técnica ao apartamento', content: 'Caminhamos pelo futuro apartamento e imaginamos a luz entrando na sala.', category: 'construction', date: '2026-07-04', important: false, impacts: ['property'], photos: [], documentIds: ['visit'], financialTransactionIds: [], assetIds: [], maintenanceIds: [], coverPhotoId: null },
    { id: 'june-payment', title: 'Pagamento da entrada', content: 'Um passo importante para transformar o planejamento em uma escolha concreta.', category: 'acquisition', date: '2026-06-18', important: true, impacts: ['financial'], photos: [], documentIds: [], financialTransactionIds: ['entry'], assetIds: [], maintenanceIds: [], coverPhotoId: null },
    { id: 'march-first-visit', title: 'Primeira visita à obra', content: 'Entre andaimes e conversas, encontramos o lugar onde nossa próxima fase vai acontecer.', category: 'moment', date: '2026-03-08', important: false, impacts: ['unrelated'], photos: [], documentIds: [], financialTransactionIds: [], assetIds: [], maintenanceIds: [], coverPhotoId: null },
    { id: 'feb-contract', title: 'Assinatura do contrato', content: 'Assinamos os documentos e demos um nome oficial ao sonho que já dividíamos.', category: 'documentation', date: '2026-02-15', important: true, impacts: ['documentation', 'financial'], photos: [], documentIds: ['contract'], financialTransactionIds: ['docs'], assetIds: [], maintenanceIds: [], coverPhotoId: null },
    { id: 'feb-decision', title: 'A decisão de comprar nosso apartamento', content: 'Uma conversa tranquila que terminou com a certeza de que era hora de começar.', category: 'moment', date: '2026-02-02', important: false, impacts: ['unrelated'], photos: [], documentIds: [], financialTransactionIds: [], assetIds: [], maintenanceIds: [], coverPhotoId: null },
  ].map(chapter => ({ ...chapter, category: chapter.category as Chapter['category'], impacts: chapter.impacts as Chapter['impacts'], status: 'published' as const, author: 'Gabriel', createdAt: timestamp, updatedAt: timestamp })),
  financialTransactions: [
    { id: 'entry', title: 'Pagamento da entrada', amount: 8500, date: '2026-02-20', category: 'Aquisição', chapterId: 'june-payment', documentIds: ['receipt'] },
    { id: 'docs', title: 'Taxa de documentação', amount: 1200, date: '2026-03-15', category: 'Documentação', chapterId: 'feb-contract', documentIds: [] },
    { id: 'work', title: 'Evolução da obra', amount: 620, date: '2026-07-20', category: 'Construção', chapterId: 'CAP-018', documentIds: [] },
    { id: 'materials', title: 'Compra de materiais', amount: 980, date: '2026-07-25', category: 'Reforma', chapterId: null, documentIds: ['invoice'] },
  ].map(item => ({ ...item, description: '', type: 'expense' as const, status: 'paid' as const, assetId: null, maintenanceId: null, createdAt: timestamp, updatedAt: timestamp })),
  financialCommitments: [
    { id: 'commitment-entry', title: 'Parcela da entrada', amount: 1450, dueDate: '2026-08-10', status: 'pending' as const, category: 'Aquisição', chapterId: 'june-payment' },
    { id: 'commitment-work', title: 'Taxa de evolução da obra', amount: 620, dueDate: '2026-08-20', status: 'scheduled' as const, category: 'Construção', chapterId: 'CAP-018' },
    { id: 'commitment-financing', title: 'Parcela do financiamento', amount: 1280, dueDate: '2026-09-10', status: 'future' as const, category: 'Aquisição', chapterId: null },
  ].map(item => ({ ...item, createdAt: timestamp, updatedAt: timestamp })),
  documentFolders: folders.map(([id, name]) => ({ id, name, createdAt: timestamp, updatedAt: timestamp })),
  documents: [
    ['contract', 'Contrato de compra e venda.pdf', 'Documento que formaliza a aquisição do apartamento.', 'Contratos', 5033165, '2026-02-15', true, 'folder-property', 'feb-contract', null],
    ['receipt', 'Comprovante de pagamento da entrada.pdf', 'Comprovante da primeira parcela da entrada.', 'Comprovantes', 870400, '2026-02-20', true, 'folder-financial', null, 'entry'],
    ['report', 'Relatório de evolução da obra.pdf', 'Registro técnico do avanço da construção.', 'Relatórios', 3355443, '2026-07-12', true, 'folder-construction', 'CAP-018', null],
    ['floorplan', 'Planta do apartamento.pdf', 'Planta aprovada do apartamento 1204.', 'Planta e projetos', 6396314, '2026-03-18', false, 'folder-projects', null, null],
    ['invoice', 'Nota fiscal dos materiais.pdf', 'Nota fiscal de materiais usados na obra.', 'Notas fiscais', 634880, '2026-07-25', false, 'folder-construction', null, 'materials'],
    ['visit', 'Registro da visita técnica.jpg', 'Imagem registrada durante a visita técnica.', 'Outros', 2516582, '2026-07-14', false, 'folder-construction', 'july-visit', null],
  ].map(([id, name, description, category, sizeInBytes, date, important, folderId, chapterId, financialTransactionId]) => ({ id: String(id), name: String(name), description: String(description), category: String(category), fileType: String(name).split('.').pop()?.toUpperCase() ?? '', sizeInBytes: Number(sizeInBytes), date: String(date), important: Boolean(important), folderId: String(folderId), chapterId: chapterId ? String(chapterId) : null, financialTransactionId: financialTransactionId ? String(financialTransactionId) : null, assetId: null, maintenanceId: null, mockUrl: '', createdAt: timestamp, updatedAt: timestamp })),
  rooms: roomNames.map((name, order) => ({ id: `room-${order + 1}`, name, type: order === 7 ? 'general' : 'room', active: true, order, createdAt: timestamp, updatedAt: timestamp })),
  assets: [
    ['cabinets', 'Armários planejados da cozinha', 'property', 'room-2', 'Marcenaria', 8500, true, '', '', '2026-06-10', 'contract'], ['counter', 'Bancada de quartzo', 'property', 'room-2', 'Acabamento', 4200, false, '', '', '2026-06-18', null], ['floor', 'Piso laminado', 'property', 'room-3', 'Revestimento', 3600, false, '', '', '2026-07-03', null], ['ac', 'Ar-condicionado', 'property', 'room-3', 'Equipamento instalado', 2900, true, '', 'AC-2026-0948', '2026-07-03', null], ['fridge', 'Geladeira', 'inventory', 'room-2', 'Eletrodoméstico', 3850, false, 'Samsung', 'RT38', '2026-07-15', null], ['sofa', 'Sofá', 'inventory', 'room-1', 'Móvel', 2700, true, '', '', '2026-07-20', null], ['tv', 'Televisão', 'inventory', 'room-1', 'Eletrônico', 2400, false, 'LG', 'TV-55-4820', '2026-07-18', null], ['table', 'Mesa de jantar', 'inventory', 'room-1', 'Móvel', 1850, false, '', '', '2026-07-25', null], ['chair', 'Cadeira de escritório', 'inventory', 'room-4', 'Móvel', 920, false, '', '', '2026-07-12', null],
  ].map(([id, name, kind, roomId, category, value, important, brand, model, purchaseDate]) => ({ id: String(id), name: String(name), kind: kind as 'property' | 'inventory', description: '', roomId: String(roomId), category: String(category), value: Number(value), status: 'active' as const, brand: String(brand), model: String(model), serialNumber: '', purchaseDate: String(purchaseDate), installationDate: null, warrantyEndDate: null, supplier: '', important: Boolean(important), image: '', chapterId: null, documentIds: [], financialTransactionId: null, maintenanceIds: [], createdAt: timestamp, updatedAt: timestamp })),
  maintenanceRecords: [
    ['filters', 'Limpeza dos filtros do ar-condicionado', 'Preventiva', '2026-07-10', 180, 'room-3', 'ac'], ['cabinets-maintenance', 'Ajuste dos armários da cozinha', 'Corretiva', '2026-06-22', null, 'room-2', 'cabinets'], ['hydraulic', 'Inspeção hidráulica', 'Inspeção', '2026-06-05', 350, 'room-2', null], ['install', 'Instalação do ar-condicionado', 'Instalação', '2026-04-18', 950, 'room-3', 'ac'],
  ].map(([id, title, type, date, cost, roomId, assetId]) => ({ id: String(id), title: String(title), description: '', type: String(type), status: 'completed' as const, priority: 'medium' as const, scheduledDate: String(date), completedDate: String(date), cost: cost === null ? null : Number(cost), responsible: '', supplier: '', roomId: String(roomId), assetId: assetId ? String(assetId) : null, chapterId: null, documentIds: [], financialTransactionId: null, recurringRoutineId: null, createdAt: timestamp, updatedAt: timestamp })),
  maintenanceRoutines: [
    { id: 'routine-ac', title: 'Revisão preventiva do ar-condicionado', frequency: 'Semestral', nextDate: '2026-08-15', active: true, roomId: 'room-3', assetId: 'ac' },
    { id: 'routine-water', title: 'Limpeza da caixa d’água', frequency: 'Semestral', nextDate: '2026-08-28', active: true, roomId: 'room-8', assetId: null },
    { id: 'routine-fridge', title: 'Revisão da geladeira', frequency: 'Anual', nextDate: '2026-09-20', active: true, roomId: 'room-2', assetId: 'fridge' },
  ].map(item => ({ ...item, createdAt: timestamp, updatedAt: timestamp })),
  settings: { locale: 'pt-BR', currency: 'BRL' }, initializedAt: timestamp, updatedAt: timestamp,
}

export function createInitialAppState(): AppState {
  return structuredClone(initialState)
}
