# Pinia Store Syntax Guide

Complete comparison of the two store definition syntaxes in Pinia v3.

**Last Updated**: 2025-11-21

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
  const items = ref([])

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
  return { count, name, items, doubleCount, increment, fetchData }
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

## Syntax Comparison Table

| Feature | Option Stores | Setup Stores |
|---------|---------------|--------------|
| **Syntax** | Object options | Function with return |
| **State** | `state: () => ({...})` | `const x = ref()` |
| **Getters** | `getters: {...}` | `const x = computed()` |
| **Actions** | `actions: {...}` | `function x() {...}` |
| **$reset()** | ✅ Built-in | ❌ Must implement |
| **Composables** | Limited support | ✅ Full support |
| **Watchers** | ❌ Not available | ✅ Available |
| **Learning curve** | Easier | Steeper |
| **Flexibility** | Lower | Higher |
| **TypeScript** | Good | Excellent |
| **SSR safety** | Automatic | Manual (must return all) |
| **DevTools** | Automatic | Manual (must return all) |

---

## Option Store Complete Example

```typescript
import { defineStore } from 'pinia'

interface User {
  id: number
  name: string
  email: string
}

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [] as User[],
    currentUserId: null as number | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    currentUser: (state) => {
      return state.users.find(u => u.id === state.currentUserId)
    },

    // Access other getters - must use regular function
    currentUserEmail(): string | undefined {
      return this.currentUser?.email
    },

    // Getter with arguments
    getUserById: (state) => {
      return (userId: number) => state.users.find(u => u.id === userId)
    }
  },

  actions: {
    async fetchUsers() {
      this.loading = true
      this.error = null

      try {
        const response = await fetch('/api/users')
        this.users = await response.json()
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    setCurrentUser(userId: number) {
      this.currentUserId = userId
    },

    clearCurrentUser() {
      this.currentUserId = null
    }
  }
})
```

---

## Setup Store Complete Example

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<User[]>([])
  const currentUserId = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const currentUser = computed(() => {
    return users.value.find(u => u.id === currentUserId.value)
  })

  const currentUserEmail = computed(() => {
    return currentUser.value?.email
  })

  // Getter with arguments (returns function)
  const getUserById = computed(() => {
    return (userId: number) => users.value.find(u => u.id === userId)
  })

  // Actions
  async function fetchUsers() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch('/api/users')
      users.value = await response.json()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function setCurrentUser(userId: number) {
    currentUserId.value = userId
  }

  function clearCurrentUser() {
    currentUserId.value = null
  }

  // Manual $reset implementation
  function $reset() {
    users.value = []
    currentUserId.value = null
    loading.value = false
    error.value = null
  }

  // MUST return everything
  return {
    // State
    users,
    currentUserId,
    loading,
    error,
    // Getters
    currentUser,
    currentUserEmail,
    getUserById,
    // Actions
    fetchUsers,
    setCurrentUser,
    clearCurrentUser,
    $reset
  }
})
```

---

## Choosing Between Syntaxes

**Use Option Stores if:**
- Team is familiar with Vue Options API or Vuex
- Need built-in `$reset()` functionality
- Want simpler mental model
- Don't need advanced composables integration

**Use Setup Stores if:**
- Team prefers Composition API
- Need to integrate VueUse or other composables
- Want to use watchers inside stores
- Need maximum flexibility
- Building complex state logic

**Recommendation:** Start with Option Stores for simpler use cases. Migrate to Setup Stores when you need composables or advanced patterns.

---

**See also:**
- `state-getters-actions.md` for detailed API reference
- `plugins-composables.md` for composables integration patterns
