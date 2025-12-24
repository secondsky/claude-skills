# Pinia State, Getters, and Actions Guide

Complete API reference for managing state, computed properties, and business logic in Pinia stores.

**Last Updated**: 2025-11-21

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

**See also:**
- `store-syntax-guide.md` for choosing between Option and Setup stores
- `plugins-composables.md` for advanced store enhancement
