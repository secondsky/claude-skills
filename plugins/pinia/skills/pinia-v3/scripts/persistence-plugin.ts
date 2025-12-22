// Pinia Persistence Plugin Examples
// Automatically persist store state to localStorage/sessionStorage

import { PiniaPluginContext } from 'pinia'
import { watch } from 'vue'

// ============================================
// BASIC PERSISTENCE PLUGIN
// ============================================

/**
 * Basic plugin that persists ALL stores to localStorage
 */
export function persistPlugin({ store }: PiniaPluginContext) {
  // Guard against SSR environments where localStorage is undefined
  if (typeof window === 'undefined' || !window.localStorage) return

  // Restore state from localStorage on store initialization
  const stored = localStorage.getItem(store.$id)
  if (stored) {
    try {
      store.$patch(JSON.parse(stored))
    } catch (e) {
      console.error(`Failed to restore store "${store.$id}":`, e)
    }
  }

  // Save state to localStorage on every change
  store.$subscribe((mutation, state) => {
    try {
      localStorage.setItem(store.$id, JSON.stringify(state))
    } catch (e) {
      console.error(`Failed to persist store "${store.$id}":`, e)
    }
  })
}

// ============================================
// SELECTIVE PERSISTENCE PLUGIN
// ============================================

/**
 * Plugin that only persists stores with `persist: true` option
 *
 * Usage:
 * defineStore('cart', {
 *   persist: true, // Enable persistence for this store
 *   state: () => ({ items: [] })
 * })
 */
export function selectivePersistPlugin({ options, store }: PiniaPluginContext) {
  if (!options.persist) return

  // Guard against SSR environments where localStorage is undefined
  if (typeof window === 'undefined' || !window.localStorage) return

  const storageKey = `pinia_${store.$id}`

  // Restore
  const stored = localStorage.getItem(storageKey)
  if (stored) {
    try {
      store.$patch(JSON.parse(stored))
    } catch (e) {
      console.error(`Failed to restore store "${store.$id}":`, e)
    }
  }

  // Persist
  store.$subscribe((mutation, state) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (e) {
      console.error(`Failed to persist store "${store.$id}":`, e)
    }
  })
}

// TypeScript declaration for custom option (removed - see advanced plugin declaration below)

// ============================================
// ADVANCED PERSISTENCE PLUGIN
// ============================================

interface PersistOptions {
  enabled?: boolean
  storage?: 'local' | 'session'
  key?: string
  paths?: string[] // Specific state paths to persist
  debounce?: number // Debounce delay in milliseconds
  beforeRestore?: (context: PiniaPluginContext) => void
  afterRestore?: (context: PiniaPluginContext) => void
}

/**
 * Advanced plugin with fine-grained control
 *
 * Usage:
 * defineStore('user', {
 *   persist: {
 *     enabled: true,
 *     storage: 'local',
 *     key: 'my-user-store',
 *     paths: ['user', 'token'], // Only persist these properties
 *     beforeRestore: () => console.log('Restoring...'),
 *     afterRestore: () => console.log('Restored!')
 *   },
 *   state: () => ({ user: null, token: null, tempData: {} })
 * })
 */
export function advancedPersistPlugin({ options, store }: PiniaPluginContext) {
  const persist = options.persist as PersistOptions | undefined

  if (!persist || !persist.enabled) return

  // Guard against SSR environments where storage APIs are undefined
  if (typeof window === 'undefined') return
  const requestedStorage = persist.storage === 'session' ? 'sessionStorage' : 'localStorage'
  if (!window[requestedStorage]) return

  const storage = persist.storage === 'session' ? sessionStorage : localStorage
  const key = persist.key || `pinia_${store.$id}`

  // Helper to get/set specific paths
  const getPathValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj)
  }

  const setPathValue = (obj: any, path: string, value: any) => {
    const parts = path.split('.')
    const last = parts.pop()!
    const target = parts.reduce((acc, part) => {
      if (!(part in acc)) acc[part] = {}
      return acc[part]
    }, obj)
    target[last] = value
  }

  // Restore state
  const stored = storage.getItem(key)
  if (stored) {
    try {
      const data = JSON.parse(stored)

      if (persist.beforeRestore) {
        persist.beforeRestore({ options, store, pinia: store.$pinia, app: store.$app })
      }

      if (persist.paths) {
        // Restore only specific paths
        const patch: any = {}
        persist.paths.forEach(path => {
          const value = getPathValue(data, path)
          if (value !== undefined) {
            setPathValue(patch, path, value)
          }
        })
        store.$patch(patch)
      } else {
        // Restore all
        store.$patch(data)
      }

      if (persist.afterRestore) {
        persist.afterRestore({ options, store, pinia: store.$pinia, app: store.$app })
      }
    } catch (e) {
      console.error(`Failed to restore store "${store.$id}":`, e)
    }
  }

  // Persist state
  store.$subscribe((mutation, state) => {
    try {
      let dataToStore: any

      if (persist.paths) {
        // Persist only specific paths
        dataToStore = {}
        persist.paths.forEach(path => {
          const value = getPathValue(state, path)
          if (value !== undefined) {
            setPathValue(dataToStore, path, value)
          }
        })
      } else {
        // Persist all
        dataToStore = state
      }

      storage.setItem(key, JSON.stringify(dataToStore))
    } catch (e) {
      console.error(`Failed to persist store "${store.$id}":`, e)
    }
  })
}

// TypeScript declaration
declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | PersistOptions
  }
}

// ============================================
// DEBOUNCED PERSISTENCE PLUGIN
// ============================================

/**
 * Plugin that debounces persistence to reduce localStorage writes
 *
 * Useful for stores that change frequently
 */
export function debouncedPersistPlugin({ options, store }: PiniaPluginContext) {
  if (!options.persist) return

  // Guard against SSR environments where localStorage is undefined
  if (typeof window === 'undefined' || !window.localStorage) return

  const storageKey = `pinia_${store.$id}`
  const debounceMs = typeof options.persist === 'object'
    ? options.persist.debounce || 500
    : 500

  // Restore
  const stored = localStorage.getItem(storageKey)
  if (stored) {
    try {
      store.$patch(JSON.parse(stored))
    } catch (e) {
      console.error(`Failed to restore store "${store.$id}":`, e)
    }
  }

  // Debounced persist
  let timeout: ReturnType<typeof setTimeout> | null = null

  store.$subscribe((mutation, state) => {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state))
      } catch (e) {
        console.error(`Failed to persist store "${store.$id}":`, e)
      }
    }, debounceMs)
  })
}

// ============================================
// USAGE IN main.ts
// ============================================

/*
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// Import your chosen plugin
import { advancedPersistPlugin } from './plugins/persistence'

const pinia = createPinia()

// Register plugin
pinia.use(advancedPersistPlugin)

const app = createApp(App)
app.use(pinia)
app.mount('#app')
*/

// ============================================
// EXAMPLE STORE WITH PERSISTENCE
// ============================================

/*
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  persist: {
    enabled: true,
    storage: 'local',
    paths: ['items', 'total'] // Only persist items and total, not loading states
  },

  state: () => ({
    items: [],
    total: 0,
    loading: false, // Won't be persisted
    error: null // Won't be persisted
  }),

  actions: {
    addItem(item) {
      this.items.push(item)
      this.total += item.price
    }
  }
})
*/
