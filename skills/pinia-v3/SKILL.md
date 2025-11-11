---
name: pinia-v3
description: |
  This skill provides comprehensive knowledge for building Vue 3 applications with Pinia, the official state management library. It should be used when setting up Pinia stores, managing state in Vue applications, migrating from Vuex to Pinia, configuring SSR with Pinia, or encountering state management issues in Vue projects.

  Use when: creating Pinia stores, defining state/getters/actions, setting up Pinia with Nuxt, implementing store composition, configuring plugins, testing stores, using Pinia with Options API, handling SSR state hydration, migrating from Vuex, or debugging store-related errors.

  Keywords: pinia, vue state management, pinia stores, defineStore, vue 3 state, state management, getters, actions, pinia plugins, pinia ssr, nuxt pinia, vuex migration, store composition, pinia testing, setup stores, option stores, storeToRefs, mapState, mapActions, state hydration, pinia nuxt module, createPinia, useStore, pinia devtools, pinia hmr, hot module replacement
license: MIT
---

# Pinia v3 - Vue State Management

**Status**: Production Ready ✅
**Last Updated**: 2025-11-11
**Dependencies**: Vue 3 (or Vue 2.7 with @vue/composition-api)
**Latest Versions**: pinia@^2.2.0, @pinia/nuxt@^0.5.0, @pinia/testing@^0.1.0

---

## Quick Start (5 Minutes)

### 1. Install Pinia

```bash
npm install pinia
# or
yarn add pinia
# or
pnpm add pinia
# or
bun add pinia
```

**For Vue <2.7 users**: Also install `@vue/composition-api`

**Why this matters:**
- Pinia is the official Vue state management library
- Provides better TypeScript support than Vuex
- Eliminates mutations and namespacing complexity
- Full DevTools support with time-travel debugging

### 2. Create and Register Pinia Instance

```typescript
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
```

**CRITICAL:**
- Install Pinia BEFORE using any store
- Call `app.use(pinia)` before mounting the app
- Only one Pinia instance per application (unless SSR)

### 3. Define Your First Store

```typescript
// stores/counter.ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Eduardo'
  }),
  getters: {
    doubleCount: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++
    }
  }
})
```

### 4. Use Store in Components

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <div>
    <p>Count: {{ counter.count }}</p>
    <p>Double: {{ counter.doubleCount }}</p>
    <button @click="counter.increment">Increment</button>
  </div>
</template>
```

---

## The Two Store Syntaxes

### Option Stores (Recommended for Beginners)

Similar to Vue's Options API structure:

```typescript
export const useCounterStore = defineStore('counter', {
  // State = data()
  state: () => ({
    count: 0,
    name: 'Eduardo',
    items: [] as Item[]
  }),

  // Getters = computed properties
  getters: {
    doubleCount: (state) => state.count * 2,
    // Access other getters with regular functions
    doublePlusOne(): number {
      return this.doubleCount + 1
    }
  },

  // Actions = methods
  actions: {
    increment() {
      this.count++
    },
    async fetchData() {
      // Actions can be async
      const data = await api.fetch()
      this.items = data
    }
  }
})
```

**When to use:**
- Simpler mental model (matches Options API)
- Built-in `$reset()` method
- Better for teams familiar with Vuex

### Setup Stores (Recommended for Advanced Users)

Uses Composition API pattern for greater flexibility:

```typescript
export const useCounterStore = defineStore('counter', () => {
  // ref() = state
  const count = ref(0)
  const name = ref('Eduardo')

  // computed() = getters
  const doubleCount = computed(() => count.value * 2)

  // function() = actions
  function increment() {
    count.value++
  }

  async function fetchData() {
    const data = await api.fetch()
    items.value = data
  }

  // MUST return everything you want exposed
  return { count, name, doubleCount, increment, fetchData }
})
```

**CRITICAL for Setup Stores:**
- Must return ALL state properties for Pinia to track them
- Private properties (not returned) break SSR, DevTools, and plugins
- Can use watchers and composables directly
- No built-in `$reset()` - must implement manually

**When to use:**
- Need composables integration
- Want reactive watches in stores
- Prefer Composition API mental model
- Need complex state logic

---

## State Management

### Defining State

**Option Stores:**
```typescript
state: () => ({
  count: 0,
  name: 'Eduardo',
  isAdmin: true,
  items: [],
  // Even undefined values must be declared
  user: undefined as User | undefined
})
```

**Setup Stores:**
```typescript
const count = ref(0)
const name = ref('Eduardo')
const isAdmin = ref(true)
const items = ref<Item[]>([])
const user = ref<User>()

return { count, name, isAdmin, items, user }
```

**CRITICAL:**
- ALL state properties MUST be defined in `state()` or returned from setup
- Cannot add new state properties dynamically after store creation
- Use proper types for TypeScript inference

### Accessing State

Direct access - read and write:

```typescript
const store = useCounterStore()

// Read
console.log(store.count)

// Write
store.count++
store.name = 'Alice'

// Works with v-model
<input v-model="store.name" />
```

### Mutating State

**Method 1: Direct Mutation**
```typescript
store.count++
store.name = 'Alice'
```

**Method 2: $patch with Object**
```typescript
store.$patch({
  count: store.count + 1,
  name: 'Alice'
})
```

**Method 3: $patch with Function**
```typescript
// Best for complex mutations (arrays, etc.)
store.$patch((state) => {
  state.items.push({ name: 'shoes', quantity: 1 })
  state.hasChanged = true
})
```

### Resetting State

**Option Stores:**
```typescript
store.$reset() // Restores to initial state
```

**Setup Stores:**
```typescript
// Must implement manually
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)

  function $reset() {
    count.value = 0
  }

  return { count, $reset }
})
```

### Subscribing to State Changes

```typescript
store.$subscribe((mutation, state) => {
  // Called after each patch
  console.log(mutation.type) // 'direct' | 'patch object' | 'patch function'
  console.log(mutation.storeId) // 'counter'
  console.log(mutation.payload) // patch object

  // Persist to localStorage
  localStorage.setItem('counter', JSON.stringify(state))
})

// Options
store.$subscribe(callback, {
  detached: true // Keep subscription after component unmounts
})

store.$subscribe(callback, {
  flush: 'sync' // Call immediately (instead of post-component-update)
})
```

---

## Getters (Computed State)

### Defining Getters

**Arrow Functions (Recommended):**
```typescript
getters: {
  doubleCount: (state) => state.count * 2,
  upperName: (state) => state.name.toUpperCase()
}
```

**Regular Functions:**
```typescript
getters: {
  doubleCount(state) {
    return state.count * 2
  }
}
```

### Accessing Other Getters

**IMPORTANT**: When using `this`, must use regular function and type return value:

```typescript
getters: {
  doubleCount: (state) => state.count * 2,

  // Must type return when using 'this'
  doublePlusOne(): number {
    return this.doubleCount + 1
  }
}
```

### Passing Arguments to Getters

Return a function from the getter:

```typescript
getters: {
  getUserById: (state) => {
    return (userId: number) => state.users.find(user => user.id === userId)
  }
}

// Usage in component
<script setup>
import { storeToRefs } from 'pinia'

const store = useUserStore()
const { getUserById } = storeToRefs(store)
</script>

<template>
  <p>User 2: {{ getUserById(2) }}</p>
</template>
```

**NOTE:** Returning functions prevents caching. Consider internal caching if performance matters.

### Accessing Other Stores' Getters

```typescript
import { useOtherStore } from './other-store'

getters: {
  combinedData(state) {
    const otherStore = useOtherStore()
    return state.localData + otherStore.data
  }
}
```

---

## Actions (Business Logic)

### Defining Actions

```typescript
actions: {
  increment() {
    this.count++
  },

  incrementBy(amount: number) {
    this.count += amount
  },

  reset() {
    this.count = 0
  }
}
```

**NOTE:** Cannot use arrow functions (need `this` context)

### Async Actions

Actions can be async and await any promises:

```typescript
actions: {
  async registerUser(login: string, password: string) {
    try {
      this.userData = await api.post({ login, password })
      showToast('Registration successful')
    } catch (error) {
      showToast(error)
      return error
    }
  },

  async fetchUserPreferences() {
    const auth = useAuthStore()
    if (auth.isAuthenticated) {
      this.preferences = await fetchPreferences()
    }
  }
}
```

### Accessing Other Store Actions

```typescript
actions: {
  async loginAndLoad() {
    const auth = useAuthStore()
    await auth.login()

    // After auth succeeds, load user data
    await this.loadUserData()
  }
}
```

### Subscribing to Actions

```typescript
const unsubscribe = store.$onAction(
  ({
    name, // action name
    store, // store instance
    args, // array of action parameters
    after, // hook after action returns/resolves
    onError // hook if action throws/rejects
  }) => {
    const startTime = Date.now()
    console.log(`Action "${name}" started with params:`, args)

    after((result) => {
      console.log(`Finished in ${Date.now() - startTime}ms`)
      console.log('Result:', result)
    })

    onError((error) => {
      console.error(`Failed: ${error}`)
    })
  }
)

// With second parameter true, subscription persists after component unmount
store.$onAction(callback, true)
```

---

## Store Destructuring with Reactivity

### Problem: Direct Destructuring Breaks Reactivity

```typescript
// ❌ DON'T DO THIS
const { name, count } = store // Loses reactivity!
```

### Solution: Use storeToRefs()

```typescript
import { storeToRefs } from 'pinia'

// ✅ Extract state/getters with reactivity
const { name, count, doubleCount } = storeToRefs(store)

// ✅ Actions can be destructured directly (no need for storeToRefs)
const { increment, reset } = store

// Now reactive in templates
<template>
  <p>{{ name }}</p> <!-- Reactive -->
  <button @click="increment">+</button>
</template>
```

---

## Plugins

### Creating a Plugin

```typescript
export function myPlugin(context) {
  context.pinia // Pinia instance
  context.app // Vue app instance (createApp)
  context.store // Store being augmented
  context.options // Store definition options

  // Return object to add properties to every store
  return {
    secret: 'the cake is a lie'
  }
}

// Register
const pinia = createPinia()
pinia.use(myPlugin)
```

### Adding State via Plugins

```typescript
import { ref } from 'vue'

pinia.use(({ store }) => {
  const secret = ref('my-secret')

  // Add to both store and $state for SSR
  store.secret = secret
  store.$state.secret = secret

  return { secret }
})
```

### Adding Options via Plugins

```typescript
// Define custom store option
defineStore('search', {
  // Custom option
  debounce: {
    search: 300,
    reset: 100
  },

  actions: {
    search() { /* ... */ },
    reset() { /* ... */ }
  }
})

// Plugin reads and implements
import { debounce } from 'lodash'

pinia.use(({ options, store }) => {
  if (options.debounce) {
    return Object.keys(options.debounce).reduce((debouncedActions, action) => {
      debouncedActions[action] = debounce(
        store[action],
        options.debounce[action]
      )
      return debouncedActions
    }, {})
  }
})
```

### TypeScript Plugin Typing

```typescript
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    // Add custom store properties
    router: Router
  }

  export interface PiniaCustomStateProperties<S> {
    // Add custom state properties
    myCustomState: string
  }

  export interface DefineStoreOptionsBase<S, Store> {
    // Add custom store options
    debounce?: Partial<Record<keyof StoreActions<Store>, number>>
  }
}
```

---

## Using Stores Outside Components

### The Problem

Stores need the Pinia instance, which is auto-injected in components but not available in module scope.

### ❌ Wrong: Accessing Store at Module Level

```typescript
// router.ts
import { useUserStore } from '@/stores/user'

// ❌ Fails: Pinia not installed yet
const userStore = useUserStore()

router.beforeEach((to) => {
  if (userStore.isLoggedIn) { /* ... */ }
})
```

### ✅ Right: Accessing Store Inside Callbacks

```typescript
// router.ts
import { useUserStore } from '@/stores/user'

router.beforeEach((to) => {
  // ✅ Works: Called after Pinia is installed
  const userStore = useUserStore()

  if (userStore.isLoggedIn) { /* ... */ }
})
```

**Why it works**: Router guards execute AFTER `app.use(pinia)` completes.

### SSR: Explicit Pinia Instance

```typescript
// server-side
export function setupRouter(pinia) {
  router.beforeEach((to) => {
    const userStore = useUserStore(pinia) // Pass explicitly
  })
}
```

---

## Server-Side Rendering (SSR)

### Basic SSR Setup

Works automatically when using stores in `setup()`, getters, or actions.

### State Hydration

**Server Side:**
```typescript
import { renderToString } from '@vue/server-renderer'
import devalue from 'devalue'

const pinia = createPinia()
const app = createSSRApp(App)
app.use(pinia)

const html = await renderToString(app)

// Serialize state (devalue prevents XSS)
const state = devalue(pinia.state.value)

const fullHtml = `
  <html>
    <body>
      <div id="app">${html}</div>
      <script>window.__pinia = ${state}</script>
    </body>
  </html>
`
```

**Client Side:**
```typescript
const pinia = createPinia()

// CRITICAL: Hydrate BEFORE using any stores
if (typeof window !== 'undefined') {
  pinia.state.value = JSON.parse(window.__pinia)
}

const app = createApp(App)
app.use(pinia)
```

**CRITICAL:**
- Always escape serialized state to prevent XSS
- Use `devalue` library (not JSON.stringify) for complex data
- Hydrate before calling any `useStore()`

### Nuxt Integration

Install the official module:

```bash
npx nuxi@latest module add pinia
```

**Configuration:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  pinia: {
    storesDirs: ['./stores/**', './custom-folder/stores/**']
  }
})
```

**Auto-imports:**
- `defineStore()`
- `storeToRefs()`
- `usePinia()`
- `acceptHMRUpdate()`
- All stores in `stores/` directory

**Server-side data fetching:**
```vue
<script setup>
const store = useStore()

// Runs once on server, cached
await callOnce('user', () => store.fetchUser())

// Refetch on every navigation
await callOnce('user', () => store.fetchUser(), { mode: 'navigation' })
</script>
```

---

## Store Composition

### Three Safe Patterns

**1. Nested Stores (Setup Pattern):**
```typescript
export const useCartStore = defineStore('cart', () => {
  const user = useUserStore() // ✅ Top-level call

  const items = ref([])

  function addItem(item) {
    items.value.push(item)
  }

  return { items, addItem, user }
})
```

**2. Shared Getters:**
```typescript
getters: {
  userData() {
    const user = useUserStore() // ✅ Inside getter
    return user.data
  }
}
```

**3. Shared Actions:**
```typescript
actions: {
  async loadData() {
    const user = useUserStore() // ✅ Inside action
    if (user.isAuthenticated) {
      this.data = await fetch('/data')
    }
  }
}
```

### ❌ Circular Dependencies to Avoid

```typescript
// ❌ NEVER: Both stores read each other's state at setup
export const useStoreA = defineStore('a', () => {
  const storeB = useStoreB()
  const value = storeB.value // ❌ Circular dependency
  return { value }
})

export const useStoreB = defineStore('b', () => {
  const storeA = useStoreA()
  const value = storeA.value // ❌ Circular dependency
  return { value }
})
```

### SSR Consideration for Async Actions

```typescript
actions: {
  async loadData() {
    // ✅ All useStore() calls BEFORE await
    const authStore = useAuthStore()
    const settingsStore = useSettingsStore()

    // ❌ Don't call useStore() after await (breaks SSR)
    const data = await fetch('/api')

    // Store calls already made, safe to use
    if (authStore.isAuthenticated) {
      this.data = data
    }
  }
}
```

---

## Using Composables in Stores

### Option Stores

Call composables in `state()`:

```typescript
import { useLocalStorage } from '@vueuse/core'

export const useStore = defineStore('store', {
  state: () => ({
    // ✅ Works - returns writable ref
    theme: useLocalStorage('theme', 'dark')
  })
})
```

**Limitations:**
- Can only return writable state (`ref()`)
- Cannot use composables that return functions or readonly data

### Setup Stores

Almost any composable works:

```typescript
import { useMediaControls } from '@vueuse/core'

export const useVideoStore = defineStore('video', () => {
  const videoEl = ref<HTMLVideoElement>()

  // ✅ All properties auto-categorized
  const { playing, volume, currentTime, togglePictureInPicture } =
    useMediaControls(videoEl, { src: '/video.mp4' })

  return {
    playing,
    volume,
    currentTime,
    togglePictureInPicture,
    videoEl
  }
})
```

**SSR Handling:**
```typescript
import { skipHydrate } from 'pinia'

return {
  // Don't hydrate this from SSR state
  videoEl: skipHydrate(videoEl)
}
```

---

## Testing

### Unit Testing Stores

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import { describe, it, expect, beforeEach } from 'vitest'

describe('Counter Store', () => {
  beforeEach(() => {
    // Fresh Pinia for each test
    setActivePinia(createPinia())
  })

  it('increments', () => {
    const counter = useCounterStore()
    expect(counter.count).toBe(0)
    counter.increment()
    expect(counter.count).toBe(1)
  })

  it('doubles count', () => {
    const counter = useCounterStore()
    counter.count = 5
    expect(counter.doubleCount).toBe(10)
  })
})
```

### Testing with Plugins

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { somePlugin } from './plugins'

describe('Store with Plugin', () => {
  let app

  beforeEach(() => {
    app = createApp({})
    const pinia = createPinia().use(somePlugin)
    app.use(pinia)
    setActivePinia(pinia)
  })
})
```

### Component Testing

```bash
npm i -D @pinia/testing
```

```typescript
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import Counter from './Counter.vue'

describe('Counter Component', () => {
  it('displays count', () => {
    const wrapper = mount(Counter, {
      global: {
        plugins: [createTestingPinia()]
      }
    })

    expect(wrapper.text()).toContain('Count: 0')
  })
})
```

### Setting Initial State

```typescript
const wrapper = mount(Counter, {
  global: {
    plugins: [
      createTestingPinia({
        initialState: {
          counter: { count: 20 }
        }
      })
    ]
  }
})
```

### Stubbing Actions

**Default: All actions stubbed**
```typescript
createTestingPinia() // Actions don't execute
```

**Execute all actions:**
```typescript
createTestingPinia({ stubActions: false })
```

**Selective stubbing:**
```typescript
createTestingPinia({
  stubActions: ['increment', 'reset'] // Only these are stubbed
})
```

**Custom logic:**
```typescript
createTestingPinia({
  stubActions: (actionName, store) => {
    return actionName.startsWith('set') // Stub setters only
  }
})
```

### Mocking Getters

```typescript
const store = useCounterStore()

// Override getter
store.doubleCount = 999

// Reset to default
store.doubleCount = undefined
```

### Vitest Spy Setup

```typescript
import { vi } from 'vitest'

createTestingPinia({
  createSpy: vi.fn,
  stubActions: false
})

// Then mock specific actions
const store = useCounterStore()
vi.spyOn(store, 'fetchData').mockResolvedValue({ data: [] })
```

---

## Hot Module Replacement (HMR)

### Vite Setup

```typescript
// stores/counter.ts
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // store definition
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot))
}
```

### Webpack Setup

```typescript
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(acceptHMRUpdate(useCounterStore, import.meta.webpackHot))
}
```

**Benefits:**
- Edit stores without full page reload
- Preserve application state during development
- Faster development iteration

---

## Options API Usage

### With setup()

```vue
<script>
import { useCounterStore } from '@/stores/counter'

export default {
  setup() {
    const counterStore = useCounterStore()

    return { counterStore }
  },

  methods: {
    handleClick() {
      this.counterStore.increment()
    }
  }
}
</script>
```

### Without setup() - Using Mappers

**mapStores:**
```vue
<script>
import { mapStores } from 'pinia'
import { useCounterStore, useUserStore } from '@/stores'

export default {
  computed: {
    ...mapStores(useCounterStore, useUserStore)
    // Adds this.counterStore and this.userStore
  },

  methods: {
    handleClick() {
      this.counterStore.increment()
    }
  }
}
</script>
```

**mapState (read-only):**
```vue
<script>
import { mapState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    ...mapState(useCounterStore, ['count', 'doubleCount']),
    // Adds this.count and this.doubleCount (read-only)

    ...mapState(useCounterStore, {
      myCount: 'count',
      myDouble: store => store.doubleCount
    })
  }
}
</script>
```

**mapWritableState (read-write):**
```vue
<script>
import { mapWritableState } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    ...mapWritableState(useCounterStore, ['count', 'name'])
    // Can modify: this.count++
  }
}
</script>
```

**mapActions:**
```vue
<script>
import { mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  methods: {
    ...mapActions(useCounterStore, ['increment', 'reset'])
    // Adds this.increment() and this.reset()
  }
}
</script>
```

**Customizing Store Suffix:**
```typescript
import { setMapStoreSuffix } from 'pinia'

setMapStoreSuffix('') // Remove 'Store' suffix
// ...mapStores(useCounter) -> this.counter (not this.counterStore)

setMapStoreSuffix('_store')
// ...mapStores(useCounter) -> this.counter_store
```

---

## Migrating from Vuex

### Directory Structure Change

**Vuex:**
```
src/store/
├── index.js
└── modules/
    ├── user.js
    ├── cart.js
    └── nested/
        └── settings.js
```

**Pinia:**
```
src/stores/
├── user.ts
├── cart.ts
└── nested-settings.ts
```

**Key difference:** Each module becomes an independent store.

### Conversion Steps

**1. Remove module namespacing - built into store IDs**

Vuex:
```typescript
// modules/user.js
export default {
  namespaced: true,
  state: () => ({ ... })
}
```

Pinia:
```typescript
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({ ... })
})
```

**2. Convert state to function (if not already)**

Pinia requires state to be a function:
```typescript
state: () => ({
  firstName: '',
  lastName: ''
})
```

**3. Remove identity getters**

Vuex often had getters that just returned state:
```typescript
// ❌ Remove these
getters: {
  firstName: state => state.firstName
}
```

In Pinia, just access `store.firstName` directly.

**4. Access other stores instead of rootState/rootGetters**

Vuex:
```typescript
getters: {
  fullData(state, getters, rootState, rootGetters) {
    return rootGetters['otherModule/data'] + state.local
  }
}
```

Pinia:
```typescript
import { useOtherStore } from './other'

getters: {
  fullData(state) {
    const other = useOtherStore()
    return other.data + state.local
  }
}
```

**5. Convert actions - remove context parameter**

Vuex:
```typescript
actions: {
  updateUser({ commit, state, dispatch, rootState }, payload) {
    commit('SET_USER', payload)
    dispatch('otherModule/action', null, { root: true })
  }
}
```

Pinia:
```typescript
import { useOtherStore } from './other'

actions: {
  updateUser(payload) {
    this.user = payload // Direct mutation

    const other = useOtherStore()
    other.someAction() // Direct call
  }
}
```

**6. Eliminate mutations**

Vuex:
```typescript
mutations: {
  SET_USER(state, user) {
    state.user = user
  }
}

actions: {
  updateUser({ commit }, user) {
    commit('SET_USER', user)
  }
}
```

Pinia (Option 1 - Direct mutation in action):
```typescript
actions: {
  updateUser(user) {
    this.user = user // No mutation needed
  }
}
```

Pinia (Option 2 - Allow components to mutate):
```typescript
// Component
store.user = newUser // Directly mutate (acceptable in Pinia)
```

**7. Use $reset() instead of custom clear mutations**

Pinia provides built-in reset:
```typescript
store.$reset() // Returns to initial state
```

### Component Migration

**Vuex:**
```vue
<script>
import { mapState, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState('user', ['firstName', 'lastName'])
  },
  methods: {
    ...mapActions('user', ['updateUser'])
  }
}
</script>
```

**Pinia (Composition API):**
```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { firstName, lastName } = storeToRefs(userStore)
const { updateUser } = userStore
</script>
```

**Pinia (Options API):**
```vue
<script>
import { mapState, mapActions } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  computed: {
    ...mapState(useUserStore, ['firstName', 'lastName'])
  },
  methods: {
    ...mapActions(useUserStore, ['updateUser'])
  }
}
</script>
```

---

## Critical Rules

### Always Do

✅ Define all state properties in `state()` or return them from setup stores
✅ Use `storeToRefs()` when destructuring state/getters in components
✅ Call `app.use(pinia)` BEFORE mounting the app
✅ Return all state from setup stores (private state breaks SSR/DevTools)
✅ Call `useStore()` inside functions/callbacks when used outside components
✅ Use `acceptHMRUpdate()` for development HMR support
✅ Type return values when getters use `this` to access other getters
✅ Use `devalue` for SSR state serialization (prevents XSS)
✅ Hydrate state BEFORE calling any `useStore()` on the client (SSR)
✅ Call all `useStore()` BEFORE any `await` in async actions (SSR)

### Never Do

❌ Add state properties dynamically after store creation
❌ Destructure store directly without `storeToRefs()` (loses reactivity)
❌ Use arrow functions for actions (need `this` context)
❌ Return private state in setup stores (breaks SSR/DevTools/plugins)
❌ Call `useStore()` at module top-level (before Pinia installed)
❌ Create circular dependencies between stores (both reading each other's state)
❌ Use `JSON.stringify()` for SSR serialization (vulnerable to XSS)
❌ Call `useStore()` after `await` in actions (breaks SSR)
❌ Forget to type getter return values when using `this`
❌ Skip `beforeEach(() => setActivePinia(createPinia()))` in unit tests

---

## Known Issues Prevention

This skill prevents **12** documented issues:

### Issue #1: Lost Reactivity from Direct Destructuring
**Error**: State changes don't update in template after destructuring
**Why It Happens**: JavaScript destructuring breaks Vue reactivity
**Prevention**: Always use `storeToRefs()` for state/getters

### Issue #2: Cannot Add State Properties Dynamically
**Error**: New properties added after store creation aren't reactive
**Why It Happens**: Pinia needs all properties defined upfront for reactivity
**Prevention**: Declare all properties in `state()`, even if initially `undefined`

### Issue #3: Store Not Found Before Pinia Install
**Error**: `getActivePinia()` returns undefined
**Why It Happens**: Calling `useStore()` before `app.use(pinia)`
**Prevention**: Call `app.use(pinia)` before mounting or accessing stores

### Issue #4: Setup Store Private State Breaks SSR
**Error**: State not serialized/hydrated correctly in SSR
**Why It Happens**: Properties not returned from setup aren't tracked
**Prevention**: Return ALL state properties from setup stores

### Issue #5: Getters with `this` Don't Infer Types
**Error**: TypeScript can't infer return type when getter uses `this`
**Source**: Known TypeScript limitation with Pinia
**Prevention**: Explicitly type return value: `getterName(): ReturnType { ... }`

### Issue #6: Options API Store Suffix Confusion
**Error**: Can't find `this.counterStore` in component
**Why It Happens**: `mapStores()` automatically adds 'Store' suffix
**Prevention**: Use store name + 'Store' or call `setMapStoreSuffix()`

### Issue #7: Actions Called After `await` Break SSR
**Error**: Wrong Pinia instance used in SSR, causing state pollution
**Why It Happens**: `await` changes execution context in async functions
**Prevention**: Call all `useStore()` before any `await` statements

### Issue #8: Circular Store Dependencies Crash App
**Error**: Maximum call stack exceeded
**Why It Happens**: Both stores read each other's state during initialization
**Prevention**: Use getters/actions for cross-store access, not setup-time reads

### Issue #9: XSS Vulnerability in SSR State Serialization
**Error**: User input in state can execute malicious scripts
**Why It Happens**: `JSON.stringify()` doesn't escape executable code
**Prevention**: Use `devalue` library for safe serialization

### Issue #10: HMR Doesn't Work in Development
**Error**: Changes to store require full page reload
**Why It Happens**: Vite/webpack HMR not configured for store
**Prevention**: Add `acceptHMRUpdate()` block to each store file

### Issue #11: Composables Return Functions Break Option Stores
**Error**: Store state contains non-serializable functions
**Why It Happens**: Option stores `state()` can only return writable refs
**Prevention**: Use setup stores for complex composables, or extract only writable state

### Issue #12: State Not Reset Between Unit Tests
**Error**: Tests affect each other, sporadic failures
**Why It Happens**: Single Pinia instance shared across tests
**Prevention**: `beforeEach(() => setActivePinia(createPinia()))` in test suites

---

## Configuration Files Reference

### package.json (Minimal Setup)

```json
{
  "name": "my-vue-app",
  "type": "module",
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.2.0"
  }
}
```

### package.json (With Nuxt)

```json
{
  "name": "my-nuxt-app",
  "type": "module",
  "dependencies": {
    "nuxt": "^3.13.0",
    "@pinia/nuxt": "^0.5.0",
    "pinia": "^2.2.0"
  }
}
```

### package.json (With Testing)

```json
{
  "name": "my-vue-app",
  "type": "module",
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.2.0"
  },
  "devDependencies": {
    "@pinia/testing": "^0.1.0",
    "@vue/test-utils": "^2.4.0",
    "vitest": "^1.0.0"
  }
}
```

**Why these settings:**
- `pinia@^2.2.0` is the latest stable version
- `@pinia/nuxt` auto-configures Pinia for Nuxt 3/4
- `@pinia/testing` provides `createTestingPinia()` for component tests
- Vuex not needed (Pinia replaces it)

---

## Common Patterns

### Pattern 1: Authentication Store

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) throw new Error('Login failed')

    const data = await response.json()
    token.value = data.token
    user.value = data.user
  }

  function logout() {
    token.value = null
    user.value = null
  }

  return { token, user, isAuthenticated, login, logout }
})
```

**When to use**: User authentication and session management

### Pattern 2: API Data Store with Loading States

```typescript
import { defineStore } from 'pinia'

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [] as Product[],
    loading: false,
    error: null as string | null
  }),

  getters: {
    getProductById: (state) => (id: number) => {
      return state.products.find(p => p.id === id)
    }
  },

  actions: {
    async fetchProducts() {
      this.loading = true
      this.error = null

      try {
        const response = await fetch('/api/products')
        this.products = await response.json()
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    }
  }
})
```

**When to use**: Loading data from APIs with loading/error states

### Pattern 3: LocalStorage Persistence Plugin

```typescript
import { PiniaPluginContext } from 'pinia'

export function persistPlugin({ store }: PiniaPluginContext) {
  // Restore state from localStorage
  const stored = localStorage.getItem(store.$id)
  if (stored) {
    store.$patch(JSON.parse(stored))
  }

  // Save state to localStorage on every change
  store.$subscribe((mutation, state) => {
    localStorage.setItem(store.$id, JSON.stringify(state))
  })
}

// Register
const pinia = createPinia()
pinia.use(persistPlugin)
```

**When to use**: Persisting user preferences, cart data, etc.

### Pattern 4: Router Integration

```typescript
// router/index.ts
import { useAuthStore } from '@/stores/auth'

router.beforeEach((to, from) => {
  const auth = useAuthStore() // ✅ Called inside guard

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }
})
```

**When to use**: Protected routes, navigation guards

### Pattern 5: Form Store with Validation

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFormStore = defineStore('form', () => {
  const firstName = ref('')
  const lastName = ref('')
  const email = ref('')

  const errors = ref<Record<string, string>>({})

  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0
  })

  function validate() {
    errors.value = {}

    if (!firstName.value) {
      errors.value.firstName = 'First name is required'
    }

    if (!email.value.includes('@')) {
      errors.value.email = 'Invalid email'
    }
  }

  async function submit() {
    validate()
    if (!isValid.value) return

    await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify({
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value
      })
    })
  }

  function $reset() {
    firstName.value = ''
    lastName.value = ''
    email.value = ''
    errors.value = {}
  }

  return {
    firstName,
    lastName,
    email,
    errors,
    isValid,
    validate,
    submit,
    $reset
  }
})
```

**When to use**: Complex multi-step forms, form state management

---

## Official Documentation

- **Pinia**: https://pinia.vuejs.org/
- **Getting Started**: https://pinia.vuejs.org/getting-started.html
- **Core Concepts**: https://pinia.vuejs.org/core-concepts/
- **SSR Guide**: https://pinia.vuejs.org/ssr/
- **Nuxt Integration**: https://pinia.vuejs.org/ssr/nuxt.html
- **Testing**: https://pinia.vuejs.org/cookbook/testing.html
- **Vuex Migration**: https://pinia.vuejs.org/cookbook/migration-vuex.html
- **GitHub**: https://github.com/vuejs/pinia

---

## Package Versions (Verified 2025-11-11)

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.2.0"
  },
  "devDependencies": {
    "@pinia/testing": "^0.1.0",
    "@pinia/nuxt": "^0.5.0",
    "@vue/test-utils": "^2.4.0",
    "vitest": "^1.0.0",
    "devalue": "^5.0.0"
  }
}
```

---

## Troubleshooting

### Problem: "getActivePinia() was called with no active Pinia"
**Solution**:
1. Ensure `app.use(pinia)` is called before mounting
2. If outside component, call `useStore()` inside callback/function
3. For SSR, pass pinia instance explicitly: `useStore(pinia)`

### Problem: State changes don't update in template
**Solution**: Use `storeToRefs()` instead of direct destructuring

### Problem: Getter using `this` has TypeScript errors
**Solution**: Explicitly type the return value: `myGetter(): ReturnType { return this.otherGetter }`

### Problem: $reset() not available in setup store
**Solution**: Implement custom reset manually:
```typescript
function $reset() {
  count.value = 0
  name.value = ''
}
return { count, name, $reset }
```

### Problem: HMR not working for stores
**Solution**: Add HMR acceptance block:
```typescript
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMyStore, import.meta.hot))
}
```

### Problem: Tests fail intermittently
**Solution**: Create fresh Pinia in `beforeEach()`:
```typescript
beforeEach(() => {
  setActivePinia(createPinia())
})
```

---

## Complete Setup Checklist

- [ ] Installed `pinia` package
- [ ] Created Pinia instance with `createPinia()`
- [ ] Registered with `app.use(pinia)` before mounting
- [ ] Created stores directory (e.g., `src/stores/`)
- [ ] Defined at least one store with `defineStore()`
- [ ] Used `storeToRefs()` when destructuring in components
- [ ] Typed getter return values when using `this`
- [ ] Added HMR support with `acceptHMRUpdate()` (development)
- [ ] Configured SSR hydration (if using SSR)
- [ ] Configured `@pinia/nuxt` (if using Nuxt)
- [ ] Set up testing with `createTestingPinia()` (if testing)
- [ ] All stores follow consistent naming: `use[Name]Store`
- [ ] Verified DevTools integration works

---

**Questions? Issues?**

1. Check official docs: https://pinia.vuejs.org/
2. Review "Known Issues Prevention" section above
3. Verify setup checklist is complete
4. Check for TypeScript configuration issues
5. Ensure Pinia is installed before using stores
