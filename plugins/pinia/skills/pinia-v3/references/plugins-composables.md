# Pinia Plugins and Composables Guide

Complete guide for extending Pinia with plugins and integrating Vue composables into stores.

**Last Updated**: 2025-11-21

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

## Common Plugin Patterns

### Pattern 1: LocalStorage Persistence Plugin

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

### Pattern 2: Router Integration Plugin

```typescript
import { Router } from 'vue-router'

export function routerPlugin(router: Router) {
  return ({ store }: PiniaPluginContext) => {
    store.router = router
  }
}

// Register
const pinia = createPinia()
pinia.use(routerPlugin(router))

// Now all stores have access to router
export const useStore = defineStore('store', {
  actions: {
    navigateHome() {
      this.router.push('/')
    }
  }
})
```

### Pattern 3: Debounce Plugin

```typescript
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

// Usage
export const useSearchStore = defineStore('search', {
  debounce: {
    search: 300 // 300ms debounce
  },

  actions: {
    search(query: string) {
      // This will be debounced
    }
  }
})
```

### Pattern 4: Logger Plugin

```typescript
pinia.use(({ store }) => {
  store.$onAction(({ name, args, after, onError }) => {
    const startTime = Date.now()
    console.log(`[Action] ${store.$id}.${name}`, args)

    after((result) => {
      console.log(`[Success] ${store.$id}.${name} (${Date.now() - startTime}ms)`, result)
    })

    onError((error) => {
      console.error(`[Error] ${store.$id}.${name}`, error)
    })
  })
})
```

### Pattern 5: API Client Plugin

```typescript
export function apiPlugin(apiClient: ApiClient) {
  return ({ store }: PiniaPluginContext) => {
    store.$api = apiClient
  }
}

// Register
const pinia = createPinia()
pinia.use(apiPlugin(myApiClient))

// Usage
export const useUserStore = defineStore('user', {
  actions: {
    async fetchUsers() {
      this.users = await this.$api.get('/users')
    }
  }
})
```

---

## VueUse Composables Integration

### useLocalStorage Example

```typescript
import { useLocalStorage } from '@vueuse/core'

export const useSettingsStore = defineStore('settings', () => {
  // Automatically synced with localStorage
  const theme = useLocalStorage('theme', 'dark')
  const language = useLocalStorage('language', 'en')

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, language, toggleTheme }
})
```

### useMediaQuery Example

```typescript
import { useMediaQuery } from '@vueuse/core'

export const useLayoutStore = defineStore('layout', () => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')

  return { isMobile, isTablet, isDesktop }
})
```

### useFetch Example

```typescript
import { useFetch } from '@vueuse/core'

export const useDataStore = defineStore('data', () => {
  const { data, error, isFetching, execute } = useFetch('/api/data').json()

  return { data, error, isFetching, execute }
})
```

### useWebSocket Example

```typescript
import { useWebSocket } from '@vueuse/core'

export const useChatStore = defineStore('chat', () => {
  const { status, data, send, open, close } = useWebSocket('ws://localhost:3000')

  const messages = ref<string[]>([])

  watch(data, (newMessage) => {
    if (newMessage) {
      messages.value.push(newMessage)
    }
  })

  function sendMessage(text: string) {
    send(text)
  }

  return { status, messages, sendMessage, open, close }
})
```

---

## Advanced Plugin Patterns

### Conditional Plugin Application

```typescript
pinia.use(({ store, options }) => {
  // Only apply to stores with specific option
  if (options.persist) {
    // Implement persistence
  }
})

// Usage
export const useStore = defineStore('store', {
  persist: true, // Enable persistence for this store
  state: () => ({ count: 0 })
})
```

### Plugin with Cleanup

```typescript
pinia.use(({ store }) => {
  const interval = setInterval(() => {
    store.$state.timestamp = Date.now()
  }, 1000)

  // Cleanup when store is disposed
  store.$dispose(() => {
    clearInterval(interval)
  })
})
```

### Cross-Store Plugin

```typescript
pinia.use(({ store }) => {
  if (store.$id === 'auth') {
    // Watch auth state changes
    watch(() => store.isAuthenticated, (isAuth) => {
      if (!isAuth) {
        // Clear all other stores when user logs out
        const allStores = pinia._s // Access all stores
        allStores.forEach((s) => {
          if (s.$id !== 'auth' && s.$reset) {
            s.$reset()
          }
        })
      }
    })
  }
})
```

---

## Composables Best Practices

### DO:
- ✅ Use setup stores for composables integration
- ✅ Return all composable outputs for SSR
- ✅ Use `skipHydrate()` for browser-only refs (DOM elements)
- ✅ Handle composable errors gracefully
- ✅ Document composable dependencies

### DON'T:
- ❌ Use composables returning functions in option stores' `state()`
- ❌ Forget to return composable values from setup stores
- ❌ Mix composables with complex computed logic (keep simple)
- ❌ Ignore SSR compatibility of composables
- ❌ Use DOM-dependent composables without SSR guards

---

## Plugin TypeScript Examples

### Strong Typing for Custom Properties

```typescript
// types.ts
import 'pinia'
import { Router } from 'vue-router'
import { ApiClient } from './api'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    router: Router
    $api: ApiClient
  }
}

// Now all stores have typed access
export const useStore = defineStore('store', {
  actions: {
    navigate() {
      this.router.push('/') // ✅ Fully typed
    },
    async fetchData() {
      const data = await this.$api.get('/data') // ✅ Fully typed
    }
  }
})
```

### Custom State Properties

```typescript
declare module 'pinia' {
  export interface PiniaCustomStateProperties<S> {
    createdAt: number
    updatedAt: number
  }
}

// Plugin implementation
pinia.use(({ store }) => {
  store.$state.createdAt = Date.now()
  store.$state.updatedAt = Date.now()

  store.$subscribe(() => {
    store.$state.updatedAt = Date.now()
  })
})
```

---

**See also:**
- `ssr-and-nuxt.md` for SSR-safe composables usage
- `testing-guide.md` for testing plugins
