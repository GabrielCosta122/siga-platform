import assert from 'node:assert/strict'
import { createModuleLoader, createHookDriver } from './test-module-loader.mjs'
class MemoryStorage {
  values = new Map()
  get length() { return this.values.size }
  key(index) { return [...this.values.keys()][index] ?? null }
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
  clear() { this.values.clear() }
}
const storage = new MemoryStorage()
globalThis.window = { localStorage: storage }
const driver = createHookDriver()
let revision = 1
const auth = { getSessionRevision: () => revision }
let remoteSave = async (id, input) => ({ ...property(id), ...input, updatedAt: '2026-10-10T10:00:00Z' })
const load = createModuleLoader({
  react: driver.hooks, 'react/jsx-runtime': driver.jsx,
  '@/auth/useAuth': { useAuth: () => auth },
  '@/lib/supabase': { isSupabaseConfigured: false, supabase: null },
  '@/services/supabase/properties.service': { updateProperty: (...args) => remoteSave(...args) },
})
const initial = load('store/initial-data.ts').createInitialAppState
const persistence = load('store/persistence.ts')
const scoped = load('store/scoped-persistence.ts')
const active = load('store/active-property.ts')
const legacy = load('store/legacy-import.ts')
const { StateProvider } = load('store/StateProvider.tsx')
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222'
const P = '33333333-3333-4333-8333-333333333333', Q = '44444444-4444-4444-8444-444444444444'
function property(id) { return { ...initial().property, id, name: `Casa ${id}`, updatedAt: '2026-10-10T00:00:00Z' } }
function state(id) { return { ...initial(), property: property(id) } }
function storeValue(mount) { return mount.result.props.value }
const tests = []
async function test(name, fn) { await fn(); tests.push(name) }
await test('duas contas não compartilham estado (provider real)', () => {
  const first = driver.mount(StateProvider, { userId: A, property: property(P) })
  storeValue(first).dispatch({ type: 'ADD_ROOM', payload: { id: 'room-a', name: 'Sala A', type: 'living', active: true, order: 0, createdAt: '', updatedAt: '' } })
  first.render(); first.unmount()
  const second = driver.mount(StateProvider, { userId: B, property: property(P) })
  assert.equal(storeValue(second).state.rooms.length, 0)
  second.unmount()
  assert.equal(scoped.loadScopedState(storage, A, property(P)).state.rooms[0].name, 'Sala A')
})
await test('dois imóveis independentes e troca não sobrescreve anterior', () => {
  const original = storage.getItem(scoped.scopeKey(A, P))
  const next = driver.mount(StateProvider, { userId: A, property: property(Q) })
  storeValue(next).dispatch({ type: 'ADD_ROOM', payload: { id: 'room-q', name: 'Sala Q', type: 'living', active: true, order: 0, createdAt: '', updatedAt: '' } })
  next.render(); next.unmount()
  assert.equal(storage.getItem(scoped.scopeKey(A, P)), original)
  assert.equal(scoped.loadScopedState(storage, A, property(Q)).state.rooms[0].name, 'Sala Q')
  assert.notEqual(scoped.fileDatabase(A, P), scoped.fileDatabase(B, P))
  assert.notEqual(scoped.fileDatabase(A, P), scoped.fileDatabase(A, Q))
})
await test('seleção alheia rejeitada sem excluir dados', async () => {
  storage.setItem(scoped.selectionKey(B), P)
  const before = storage.getItem(scoped.scopeKey(A, P))
  const result = await active.resolveActiveProperty(storage, B, { list: async () => [property(Q)], get: async id => id === Q ? property(Q) : null }, () => {})
  assert.equal(result.active.id, Q)
  assert.equal(storage.getItem(scoped.selectionKey(B)), Q)
  assert.equal(storage.getItem(scoped.scopeKey(A, P)), before)
  await assert.rejects(active.selectActiveProperty(storage, B, P, { get: async () => null }, () => {}), /não está disponível/)
})
await test('seleção salva é revalidada e múltiplos imóveis exigem escolha', async () => {
  storage.setItem(scoped.selectionKey(A), P)
  let reads = 0
  const result = await active.resolveActiveProperty(storage, A, { list: async () => [property(P), property(Q)], get: async () => { reads++; return null } }, () => {})
  assert.equal(reads, 1); assert.equal(result.active, null)
  assert.equal(storage.getItem(scoped.selectionKey(A)), null)
})
const snapshot = state('legacy-id')
snapshot.property.name = 'Casa antiga'
snapshot.settings.preferences.density = 'compact'
// Include a real-shaped record with a former demo ID: explicit import preserves it.
snapshot.rooms = [{ id: 'room-1', name: 'Sala antiga', type: 'living', active: true, order: 0, createdAt: '', updatedAt: '' }]
const rawLegacy = JSON.stringify(snapshot)
storage.setItem(persistence.APP_STORAGE_KEY, rawLegacy)
await test('cancelar/adiar preserva v1 e não faz chamadas remotas', () => {
  assert.equal(legacy.readLegacy(storage).rooms[0].id, 'room-1')
  legacy.recordLegacyDecision(storage, A, 'later')
  assert.equal(storage.getItem(legacy.decisionKey(A)), null)
  legacy.recordLegacyDecision(storage, A, 'skip')
  assert.equal(storage.getItem(persistence.APP_STORAGE_KEY), rawLegacy)
})
let creates = 0, copies = 0
const imported = property('55555555-5555-4555-8555-555555555555')
const importOptions = {
  storage, userId: A, snapshot, assertCurrent: () => {},
  ensureProperty: async () => { creates++; return imported },
  getProperty: async () => imported,
  copyFiles: async () => { copies++ },
}
await test('importação repetida não duplica estado nem imóvel', async () => {
  await legacy.importLegacy(importOptions)
  const before = storage.getItem(scoped.scopeKey(A, imported.id))
  await legacy.importLegacy(importOptions)
  assert.equal(creates, 1); assert.equal(copies, 1)
  assert.equal(storage.getItem(scoped.scopeKey(A, imported.id)), before)
  assert.equal(scoped.loadScopedState(storage, A, imported).state.rooms.length, 1)
  assert.equal(scoped.loadScopedState(storage, A, imported).state.settings.preferences.density, 'compact')
  assert.equal(storage.getItem(persistence.APP_STORAGE_KEY), rawLegacy)
})
await test('retry preserva edições posteriores e marcador de importação', async () => {
  const edited = scoped.loadScopedState(storage, A, imported).state
  edited.rooms[0].name = 'Sala editada'
  scoped.saveScopedState(storage, A, imported.id, edited)
  await legacy.importLegacy(importOptions)
  assert.equal(scoped.loadScopedState(storage, A, imported).state.rooms[0].name, 'Sala editada')
  assert(JSON.parse(storage.getItem(scoped.scopeKey(A, imported.id))).importSourceId)
})
await test('mudança de sessão durante importação não aplica dados', async () => {
  let current = true
  const options = { ...importOptions, userId: B,
    assertCurrent: () => { if (!current) throw new Error('session changed') },
    ensureProperty: async () => { current = false; return property(Q) },
  }
  await assert.rejects(legacy.importLegacy(options), /session changed/)
  assert.equal(storage.getItem(scoped.scopeKey(B, Q)), null)
  assert.equal(storage.getItem(persistence.APP_STORAGE_KEY), rawLegacy)
})
await test('logout/desmontagem limpa memória e bloqueia callbacks antigos sem apagar dados', () => {
  const mounted = driver.mount(StateProvider, { userId: A, property: property(P) })
  const old = storeValue(mounted), before = storage.getItem(scoped.scopeKey(A, P))
  revision++
  scoped.clearSelection(storage, A)
  mounted.unmount()
  assert.equal(mounted.result, null)
  assert.throws(() => old.dispatch({ type: 'UPDATE_APP_PREFERENCES', payload: { density: 'compact' } }), /mudou/)
  assert.equal(storage.getItem(scoped.selectionKey(A)), null)
  assert.equal(storage.getItem(scoped.scopeKey(A, P)), before)
})
await test('modo local continua usando v1, sem Supabase', async () => {
  const local = driver.mount(StateProvider, {})
  assert.equal(storeValue(local).state.property.name, 'Casa antiga')
  await storeValue(local).saveProperty({ name: 'Casa local editada' })
  local.render(); local.unmount()
  assert.equal(JSON.parse(storage.getItem(persistence.APP_STORAGE_KEY)).property.name, 'Casa local editada')
})
await test('estado corrompido/namespace adulterado cai em fallback sem sobrescrever original', () => {
  const badKey = scoped.scopeKey(B, Q)
  storage.setItem(badKey, '{invalid')
  const mounted = driver.mount(StateProvider, { userId: B, property: property(Q) })
  assert.equal(storeValue(mounted).state.rooms.length, 0)
  assert.equal(storage.getItem(badKey), '{invalid')
  mounted.unmount()
  storage.setItem(badKey, JSON.stringify({ version: 2, userId: A, propertyId: Q, state: state(Q) }))
  assert.equal(scoped.loadScopedState(storage, B, property(Q)).writable, false)
  const broken = state(Q); broken.rooms = [{ id: 'broken' }]
  storage.setItem(badKey, JSON.stringify({ version: 2, userId: B, propertyId: Q, state: broken }))
  assert.equal(scoped.loadScopedState(storage, B, property(Q)).writable, false)
})
await test('edição remota só aplica após sucesso; falha mantém estado anterior', async () => {
  const mounted = driver.mount(StateProvider, { userId: A, property: property(P) })
  remoteSave = async () => { throw new Error('offline') }
  await assert.rejects(storeValue(mounted).saveProperty({ name: 'Falha' }), /offline/)
  mounted.render(); assert.equal(storeValue(mounted).state.property.name, property(P).name)
  remoteSave = async (id, input) => ({ ...property(id), ...input, updatedAt: 'server-time' })
  await storeValue(mounted).saveProperty({ name: 'Salvo' })
  mounted.render(); assert.equal(storeValue(mounted).state.property.name, 'Salvo')
  assert.equal(storeValue(mounted).state.property.updatedAt, 'server-time')
  mounted.unmount()
})
await test('resposta de edição depois de logout não aplica estado', async () => {
  let finish
  remoteSave = () => new Promise(resolve => { finish = resolve })
  const mounted = driver.mount(StateProvider, { userId: A, property: property(P) })
  const before = storage.getItem(scoped.scopeKey(A, P))
  const promise = storeValue(mounted).saveProperty({ name: 'Tardia' })
  revision++; mounted.unmount(); finish(property(P))
  await assert.rejects(promise, /mudou/)
  assert.equal(storage.getItem(scoped.scopeKey(A, P)), before)
})
await test('resposta perdida e falha de arquivos reutilizam identidade e retomam sem duplicação', async () => {
  const retryStorage = new MemoryStorage()
  retryStorage.setItem(persistence.APP_STORAGE_KEY, rawLegacy)
  const database = new Map()
  let failedResponse = true, failedFiles = true, creations = 0
  const options = { ...importOptions, storage: retryStorage,
    ensureProperty: async source => {
      if (!database.has(source)) { database.set(source, property(Q)); creations++ }
      if (failedResponse) { failedResponse = false; throw new Error('response lost') }
      return database.get(source)
    },
    getProperty: async () => property(Q),
    copyFiles: async () => { if (failedFiles) { failedFiles = false; throw new Error('quota') } },
  }
  await assert.rejects(legacy.importLegacy(options), /response lost/)
  retryStorage.setItem(persistence.APP_STORAGE_KEY, JSON.stringify({ ...snapshot, property: { ...snapshot.property, name: 'Mudou após falha' } }))
  assert.equal(legacy.readLegacyPreview(retryStorage, A).property.name, 'Casa antiga')
  await assert.rejects(legacy.importLegacy(options), /quota/)
  assert.equal(retryStorage.getItem(scoped.scopeKey(A, Q)), null)
  await legacy.importLegacy(options)
  assert.equal(creations, 1)
  assert.equal(scoped.loadScopedState(retryStorage, A, property(Q)).state.rooms.length, 1)
  assert.equal(JSON.parse(retryStorage.getItem(persistence.APP_STORAGE_KEY)).property.name, 'Mudou após falha')
})
await test('journal final com falha não sobrescreve estado já importado', async () => {
  const retryStorage = new MemoryStorage()
  const options = { ...importOptions, storage: retryStorage }
  const originalSet = retryStorage.setItem.bind(retryStorage)
  let failOnce = true
  retryStorage.setItem = (key, value) => {
    if (failOnce && key.startsWith('siga:legacy-import:') && JSON.parse(value).complete) {
      failOnce = false; throw new Error('journal quota')
    }
    originalSet(key, value)
  }
  await assert.rejects(legacy.importLegacy(options), /journal quota/)
  const edited = scoped.loadScopedState(retryStorage, A, imported).state
  edited.rooms[0].name = 'Preservada após falha'
  scoped.saveScopedState(retryStorage, A, imported.id, edited)
  await legacy.importLegacy(options)
  assert.equal(scoped.loadScopedState(retryStorage, A, imported).state.rooms[0].name, 'Preservada após falha')
})
await test('AuthProvider limpa seleção no evento de logout sem apagar namespaces', async () => {
  let listener
  const session = { user: { id: A }, access_token: 'test-token' }
  const authLoad = createModuleLoader({
    react: driver.hooks, 'react/jsx-runtime': driver.jsx,
    '@/lib/supabase': { isSupabaseConfigured: true },
    '@/services/supabase/auth.service': {
      getCurrentSession: async () => session,
      subscribeToAuthChanges: fn => { listener = fn; return () => {} },
      signOut: async () => {}, signInWithEmail: async () => ({ session }), signUpWithEmail: async () => ({ session }),
    },
  })
  const { AuthProvider } = authLoad('auth/AuthProvider.tsx')
  const mounted = driver.mount(AuthProvider, { children: null })
  await new Promise(resolve => setImmediate(resolve))
  mounted.render()
  assert.equal(mounted.result.props.value.user.id, A)
  const getRevision = mounted.result.props.value.getSessionRevision
  const beforeRevision = getRevision()
  storage.setItem(scoped.selectionKey(A), P)
  const before = storage.getItem(scoped.scopeKey(A, P))
  listener('SIGNED_OUT', null)
  mounted.render()
  assert.equal(mounted.result.props.value.user, null)
  assert.equal(mounted.result.props.value.session, null)
  assert(getRevision() > beforeRevision)
  assert.equal(storage.getItem(scoped.selectionKey(A)), null)
  assert.equal(storage.getItem(scoped.scopeKey(A, P)), before)
  mounted.unmount()
})
await test('AppProvider usa v1 sem Supabase e não monta store autenticado após logout', () => {
  const config = { isSupabaseConfigured: false }
  const emptyAuth = { loading: false, user: null, getSessionRevision: () => 1 }
  const layout = () => null, access = () => null
  const appLoad = createModuleLoader({
    react: driver.hooks, 'react/jsx-runtime': driver.jsx,
    '@/auth/useAuth': { useAuth: () => emptyAuth }, '@/lib/supabase': config,
    '@/layouts/MainLayout': { MainLayout: layout },
    '@/features/workspace/components/AccountAccess': { AccountAccess: access },
    '@/features/workspace/components/WorkspaceControls': { WorkspaceControls: () => null },
    '@/services/supabase/properties.service': {},
  })
  const { AppProvider } = appLoad('store/AppProvider.tsx')
  const { StateProvider: LocalProvider } = appLoad('store/StateProvider.tsx')
  const mounted = driver.mount(AppProvider, { children: 'private records' })
  assert.equal(mounted.result.type, LocalProvider)
  config.isSupabaseConfigured = true
  mounted.render()
  assert.equal(mounted.result.type, layout)
  assert.equal(mounted.result.props.children.type, access)
  assert(!JSON.stringify(mounted.result).includes('private records'))
  mounted.unmount()
})
await test('promessa de login antiga não restaura conta após mudança de sessão', async () => {
  let listener, completeSignIn
  const sessionA = { user: { id: A }, access_token: 'token-a' }
  const sessionB = { user: { id: B }, access_token: 'token-b' }
  const authLoad = createModuleLoader({
    react: driver.hooks, 'react/jsx-runtime': driver.jsx,
    '@/lib/supabase': { isSupabaseConfigured: true },
    '@/services/supabase/auth.service': {
      getCurrentSession: async () => null,
      subscribeToAuthChanges: fn => { listener = fn; return () => {} },
      signOut: async () => {}, signInWithEmail: () => new Promise(resolve => { completeSignIn = resolve }), signUpWithEmail: async () => ({ session: null }),
    },
  })
  const { AuthProvider } = authLoad('auth/AuthProvider.tsx')
  const mounted = driver.mount(AuthProvider, { children: null })
  await new Promise(resolve => setImmediate(resolve)); mounted.render()
  const promise = mounted.result.props.value.signIn('a@example.test', 'test-password')
  listener('SIGNED_IN', sessionB); mounted.render()
  completeSignIn({ session: sessionA }); await promise; mounted.render()
  assert.equal(mounted.result.props.value.user.id, B)
  mounted.unmount()
})
await test('IndexedDB real adapter isola IDs iguais e copia arquivos sem remover origem', async () => {
  const databases = new Map()
  globalThis.indexedDB = {
    open(name) {
      if (!databases.has(name)) databases.set(name, new Map())
      const stores = databases.get(name)
      const database = {
        close() {}, objectStoreNames: { contains: () => true },
        transaction(storeName) {
          if (!stores.has(storeName)) stores.set(storeName, new Map())
          const records = stores.get(storeName)
          const transaction = {
            objectStore() {
              const request = result => {
                const req = { result }
                queueMicrotask(() => req.onsuccess?.())
                return req
              }
              return {
                put(record) { records.set(record.documentId ?? record.photoId, record); return request(undefined) },
                get(id) { return request(records.get(id)) },
                count(id) { return request(records.has(id) ? 1 : 0) },
                delete(id) { records.delete(id); return request(undefined) },
              }
            },
          }
          queueMicrotask(() => queueMicrotask(() => transaction.oncomplete?.()))
          return transaction
        },
      }
      const request = { result: database }
      queueMicrotask(() => request.onsuccess?.())
      return request
    },
  }
  const docs = load('storage/document-file-storage.ts')
  const photos = load('storage/chapter-photo-storage.ts')
  const { copyLegacyFiles } = load('storage/import-legacy-files.ts')
  const file = new File(['private A'], 'a.txt', { type: 'text/plain' })
  await docs.saveDocumentFile('same-id', file, scoped.fileDatabase(A, P))
  assert.equal(await docs.getDocumentFile('same-id', scoped.fileDatabase(B, P)), null)
  assert.equal(await docs.getDocumentFile('same-id', scoped.fileDatabase(A, Q)), null)
  assert.equal(await (await docs.getDocumentFile('same-id', scoped.fileDatabase(A, P))).blob.text(), 'private A')
  await docs.saveDocumentFile('legacy-doc', file)
  await photos.saveChapterPhoto('legacy-photo', 'chapter', file)
  const fileSnapshot = { ...initial(), documents: [{ id: 'legacy-doc' }], chapters: [{ id: 'chapter', photos: [{ id: 'legacy-photo' }] }] }
  await copyLegacyFiles(fileSnapshot, A, P, () => {})
  assert(await docs.getDocumentFile('legacy-doc', scoped.fileDatabase(A, P)))
  assert(await docs.getDocumentFile('legacy-doc'))
  assert(await photos.getChapterPhoto('legacy-photo', scoped.fileDatabase(A, P)))
  assert(await photos.getChapterPhoto('legacy-photo'))
  assert.equal(await photos.getChapterPhoto('legacy-photo', scoped.fileDatabase(B, P)), null)
  delete globalThis.indexedDB
})
console.log(`${tests.length} workspace contracts passed:\n${tests.map(name => '- ' + name).join('\n')}`)
