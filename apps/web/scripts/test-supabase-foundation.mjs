// Dependency-free contract tests. Mocks do not validate database RLS.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
const clientModule = { supabase: null, createSessionClient: () => clientModule.supabase }
const cache = new Map()
function load(file) {
  if (cache.has(file)) return cache.get(file)
  const exports = {}
  cache.set(file, exports)
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const require = (name) => {
    if (name === '@/lib/supabase') return clientModule
    if (name === '@supabase/supabase-js') return {}
    return load(resolve(name.startsWith('@/') ? root : dirname(file), name.startsWith('@/') ? name.slice(2) + '.ts' : name + '.ts'))
  }
  new Function('exports', 'require', source)(exports, require)
  return exports
}
const services = load(resolve(root, 'services/supabase/properties.service.ts'))
const profiles = load(resolve(root, 'services/supabase/profiles.service.ts'))
const errors = load(resolve(root, 'services/supabase/service-error.ts'))
const mapper = load(resolve(root, 'lib/supabase/property.mapper.ts'))
const auth = load(resolve(root, 'services/supabase/auth.service.ts'))
const id = '11111111-1111-4111-8111-111111111111'
const expectCode = (code) => (error) => error instanceof errors.SupabaseServiceError && error.code === code
await assert.rejects(services.getMyProperties(), expectCode('not-configured'))
await assert.rejects(profiles.getMyProfile(), expectCode('not-configured'))
clientModule.supabase = { auth: { getSession: async () => ({ data: { session: null }, error: null }) } }
await assert.rejects(services.getMyProperties(), expectCode('unauthenticated'))
await assert.rejects(auth.requireCurrentUser(), expectCode('unauthenticated'))
const calls = []
let result = { data: [], error: null }
const query = {
  select: (...args) => { calls.push(['select', ...args]); return query },
  eq: (...args) => { calls.push(['eq', ...args]); return query },
  update: (...args) => { calls.push(['update', ...args]); return query },
  order: async () => result,
  maybeSingle: async () => result,
}
clientModule.supabase = {
  auth: {
    getSession: async () => ({ data: { session: { user: { id } } }, error: null }),
    getUser: async () => ({ data: { user: { id } }, error: null }),
  },
  from: () => query,
  rpc: async (...args) => { calls.push(['rpc', ...args]); return result },
}
assert.deepEqual(await services.getMyProperties(), [])
assert(calls.some(call => call[0] === 'eq' && call[1] === 'owner_id' && call[2] === id))
result = { data: null, error: null }
assert.equal(await services.getPropertyById(id), null)
await assert.rejects(services.updateProperty(id, { name: 'Casa' }), expectCode('not-found'))
await assert.rejects(services.getPropertyById('local-property'), expectCode('invalid-input'))
result = { data: null, error: { message: 'TypeError: Failed to fetch', code: '' } }
await assert.rejects(services.getMyProperties(), expectCode('network'))
assert.equal(mapper.mapPropertyDomainToUpdate({ privateArea: '1.234,56 m²' }).private_area, 1234.56)
assert.throws(() => mapper.mapPropertyDomainToUpdate({ privateArea: 'abc' }), expectCode('invalid-input'))
assert.deepEqual(mapper.mapPropertyDomainToUpdate({ owner_id: id, created_by: id }), {})
result = { data: { id, name: 'Casa', owner_id: id, created_by: id, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', private_area: 50 }, error: null }
const input = { name: 'Casa', identification: '', type: '', currentStage: '', signatureDate: '', expectedDeliveryDate: '', address: '', city: '', state: '', privateArea: '50 m²', bedrooms: 1, parkingSpaces: 0, coverImage: '' }
assert.equal((await services.createProperty(input)).id, id)
const rpc = calls.find(call => call[0] === 'rpc')
assert.equal(rpc[1], 'create_property_with_owner')
assert.equal(rpc[2].p_private_area, 50)
assert(!('owner_id' in rpc[2]))
console.log('Supabase service contracts passed (configuration, session, network, owner filter, mapping, RPC).')
