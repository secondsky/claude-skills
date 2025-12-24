# Pinia SSR and Nuxt Integration Guide

Complete guide for server-side rendering with Pinia and Nuxt integration.

**Last Updated**: 2025-11-21

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
  pinia.state.value = window.__pinia
}

const app = createApp(App)
app.use(pinia)
```

**CRITICAL:**
- Always escape serialized state to prevent XSS
- Use `devalue` library (not JSON.stringify) for complex data
- Hydrate before calling any `useStore()`

---

## Nuxt Integration

### Installation

Install the official module:

```bash
bunx nuxi@latest module add pinia
```

This adds `@pinia/nuxt` to your project.

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  pinia: {
    storesDirs: ['./stores/**', './custom-folder/stores/**']
  }
})
```

### Auto-imports

The Nuxt module auto-imports:
- `defineStore()`
- `storeToRefs()`
- `usePinia()`
- `acceptHMRUpdate()`
- All stores in `stores/` directory

**Example:**
```typescript
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({ name: 'Eduardo' })
})

// pages/index.vue - NO IMPORTS NEEDED
<script setup>
const userStore = useUserStore() // Auto-imported
const { name } = storeToRefs(userStore) // Auto-imported
</script>
```

---

## Nuxt Server-Side Data Fetching

### Using callOnce for Data Fetching

```vue
<script setup>
const store = useStore()

// Runs once on server, cached
await callOnce('user', () => store.fetchUser())

// Refetch on every navigation
await callOnce('user', () => store.fetchUser(), { mode: 'navigation' })
</script>
```

**Options:**
- `mode: 'server'` (default): Runs once on server, cached
- `mode: 'navigation'`: Refetch on every navigation
- `mode: 'always'`: Refetch on every render

### Using useFetch in Actions

```typescript
export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as User[]
  }),

  actions: {
    async fetchUsers() {
      // In Nuxt, use $fetch for SSR-compatible requests
      this.users = await $fetch('/api/users')
    }
  }
})
```

### Server-Only Actions

```typescript
export const useUserStore = defineStore('user', {
  actions: {
    async fetchServerData() {
      // Only run on server
      if (process.server) {
        this.data = await fetch('/api/server-data')
      }
    }
  }
})
```

---

## SSR Best Practices

### DO:
- ✅ Use `devalue` for state serialization (prevents XSS)
- ✅ Hydrate state before calling `useStore()`
- ✅ Call all `useStore()` before `await` in async actions
- ✅ Return all state from setup stores for SSR tracking
- ✅ Use `skipHydrate()` for browser-only refs (DOM elements)

### DON'T:
- ❌ Use `JSON.stringify()` for serialization (XSS vulnerability)
- ❌ Call `useStore()` after `await` (wrong Pinia instance)
- ❌ Forget to pass Pinia instance explicitly in SSR setup code
- ❌ Use browser-only APIs without SSR guards
- ❌ Keep private state in setup stores (breaks SSR)

---

## SSR Pitfalls and Solutions

### Pitfall 1: Wrong Pinia Instance After Await

**Problem:**
```typescript
actions: {
  async loadData() {
    const data = await fetch('/api')

    // ❌ May use wrong Pinia instance in SSR
    const authStore = useAuthStore()
  }
}
```

**Solution:**
```typescript
actions: {
  async loadData() {
    // ✅ Call useStore() BEFORE await
    const authStore = useAuthStore()

    const data = await fetch('/api')

    // Safe to use authStore now
    if (authStore.isAuthenticated) {
      this.data = data
    }
  }
}
```

### Pitfall 2: Browser APIs in SSR

**Problem:**
```typescript
export const useStore = defineStore('store', () => {
  const theme = ref(localStorage.getItem('theme')) // ❌ Crashes on server
  return { theme }
})
```

**Solution:**
```typescript
export const useStore = defineStore('store', () => {
  const theme = ref('')

  // Only run on client
  if (process.client) {
    theme.value = localStorage.getItem('theme') || 'dark'
  }

  return { theme }
})
```

### Pitfall 3: Private State in Setup Stores

**Problem:**
```typescript
export const useStore = defineStore('store', () => {
  const publicState = ref(0)
  const privateState = ref(0) // ❌ Not returned

  return { publicState } // privateState not tracked for SSR
})
```

**Solution:**
```typescript
export const useStore = defineStore('store', () => {
  const publicState = ref(0)
  const privateState = ref(0)

  // ✅ Return ALL state
  return { publicState, privateState }
})
```

---

## Nuxt 3/4 Specific Patterns

### Using Stores in Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated && to.path !== '/login') {
    return navigateTo('/login')
  }
})
```

### Using Stores in Server Routes

```typescript
// server/api/user.ts
export default defineEventHandler(async (event) => {
  const pinia = usePinia()
  const userStore = useUserStore(pinia)

  return {
    user: userStore.currentUser
  }
})
```

### Using Stores in Plugins

```typescript
// plugins/init.ts
export default defineNuxtPlugin(({ $pinia }) => {
  const authStore = useAuthStore($pinia)

  // Initialize auth on app start
  authStore.init()
})
```

---

## Advanced SSR Patterns

### Per-Request State Isolation

Nuxt automatically creates separate Pinia instances per request. No manual setup needed.

### State Persistence Across Navigation

```typescript
export const useStore = defineStore('store', {
  state: () => ({
    data: null
  }),

  actions: {
    async loadData() {
      // Cache data across client-side navigation
      if (this.data) return

      this.data = await $fetch('/api/data')
    }
  }
})
```

### Prefetching Store Data

```vue
<script setup>
const store = useStore()

// Prefetch data during SSR
await store.loadData()
</script>

<template>
  <div>{{ store.data }}</div>
</template>
```

---

## Debugging SSR Issues

### Check Pinia Instance

```typescript
export const useStore = defineStore('store', () => {
  const pinia = usePinia()

  console.log('Pinia instance:', pinia)
  console.log('Is server:', process.server)

  return {}
})
```

### Verify State Hydration

```typescript
// Client-side
onMounted(() => {
  const pinia = usePinia()
  console.log('Hydrated state:', pinia.state.value)
})
```

### Test with/without JavaScript

Disable JavaScript in browser to verify SSR is working correctly. Page should still render with initial data.

---

## Nuxt Module Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],

  pinia: {
    // Custom stores directories
    storesDirs: ['./stores/**', './modules/**/store/**'],

    // Disable auto-imports (not recommended)
    autoImports: false,

    // Custom auto-import names
    imports: [
      'defineStore',
      'storeToRefs',
      'acceptHMRUpdate',
      // Don't auto-import specific stores
      ['useUserStore', { as: 'useUser' }]
    ]
  }
})
```

---

## Testing SSR

### Server-Side Test

```typescript
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from '@vue/server-renderer'

describe('SSR', () => {
  it('renders store state', async () => {
    const pinia = createPinia()
    const app = createSSRApp({
      setup() {
        const store = useStore()
        store.count = 5
        return () => h('div', store.count)
      }
    })
    app.use(pinia)

    const html = await renderToString(app)
    expect(html).toContain('5')
  })
})
```

---

**See also:**
- `testing-guide.md` for SSR testing patterns
- `plugins-composables.md` for SSR-safe composables
