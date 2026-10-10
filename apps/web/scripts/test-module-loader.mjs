import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
const requirePackage = createRequire(import.meta.url)
export const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
export function createModuleLoader(overrides = {}) {
  const cache = new Map()
  function load(file) {
    if (cache.has(file)) return cache.get(file)
    const exports = {}
    cache.set(file, exports)
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {
      fileName: file,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    const require = (name) => {
      if (name in overrides) return overrides[name]
      if (!name.startsWith('.') && !name.startsWith('@/')) return requirePackage(name)
      const base = resolve(name.startsWith('@/') ? sourceRoot : dirname(file), name.startsWith('@/') ? name.slice(2) : name)
      const target = [base, base + '.ts', base + '.tsx', base + '/index.ts'].find(candidate => existsSync(candidate) && /\.tsx?$/.test(candidate))
      if (!target) throw new Error(`Cannot load ${name}`)
      return load(target)
    }
    new Function('exports', 'require', code)(exports, require)
    return exports
  }
  return (name) => load(resolve(sourceRoot, name))
}

// Small lifecycle driver for contract-testing the actual provider logic. It
// supplies hooks, effects and cleanup; it does not claim to test React DOM.
export function createHookDriver() {
  let current
  const hooks = {
    useState(initial) {
      const driver = current, index = driver.cursor++
      if (!(index in driver.slots)) driver.slots[index] = { value: typeof initial === 'function' ? initial() : initial }
      const slot = driver.slots[index]
      return [slot.value, next => { slot.value = typeof next === 'function' ? next(slot.value) : next }]
    },
    useReducer(reducer, initial) {
      const [state, set] = hooks.useState(initial)
      const ref = hooks.useRef(null)
      ref.current ??= action => set(previous => reducer(previous, action))
      return [state, ref.current]
    },
    useRef(initial) {
      const driver = current, index = driver.cursor++
      if (!(index in driver.slots)) driver.slots[index] = { current: initial }
      return driver.slots[index]
    },
    useMemo(fn, deps) {
      const driver = current, index = driver.cursor++, previous = driver.slots[index]
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) driver.slots[index] = { value: fn(), deps }
      return driver.slots[index].value
    },
    useCallback(fn, deps) { return hooks.useMemo(() => fn, deps) },
    useEffect(fn, deps) {
      const driver = current, index = driver.cursor++, previous = driver.slots[index]
      if (!previous || !deps || deps.some((value, i) => value !== previous.deps[i])) {
        driver.effects.push(() => { previous?.cleanup?.(); driver.slots[index] = { deps, cleanup: fn() } })
      }
    },
    createContext: initial => ({ Provider: 'contract-context-provider', initial }),
    useContext: context => context.initial,
  }
  return {
    hooks,
    jsx: { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) },
    mount(component, props) {
      const driver = { slots: [], effects: [], cursor: 0, result: null }
      function render() {
        current = driver; driver.cursor = 0
        driver.result = component(props)
        const effects = driver.effects.splice(0)
        effects.forEach(effect => effect())
        return driver.result
      }
      render()
      return { render, get result() { return driver.result }, unmount() { driver.slots.forEach(slot => slot.cleanup?.()); driver.slots = []; driver.result = null } }
    },
  }
}
