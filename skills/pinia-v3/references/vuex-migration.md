# Migrating from Vuex to Pinia

Complete guide for migrating existing Vuex applications to Pinia.

**Last Updated**: 2025-11-21

---

## Directory Structure Change

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

---

## Conversion Steps

### 1. Remove Module Namespacing

Module namespacing is built into Pinia store IDs.

**Vuex:**
```typescript
// modules/user.js
export default {
  namespaced: true,
  state: () => ({ ... })
}
```

**Pinia:**
```typescript
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({ ... })
})
```

---

### 2. Convert State to Function

Pinia requires state to be a function.

**Vuex (object state):**
```typescript
state: {
  firstName: '',
  lastName: ''
}
```

**Pinia (function state):**
```typescript
state: () => ({
  firstName: '',
  lastName: ''
})
```

---

### 3. Remove Identity Getters

Vuex often had getters that just returned state.

**Vuex:**
```typescript
// ❌ Remove these
getters: {
  firstName: state => state.firstName
}
```

**Pinia:**
In Pinia, just access `store.firstName` directly. No getter needed.

---

### 4. Replace rootState/rootGetters

Use direct store imports instead of root access.

**Vuex:**
```typescript
getters: {
  fullData(state, getters, rootState, rootGetters) {
    return rootGetters['otherModule/data'] + state.local
  }
}
```

**Pinia:**
```typescript
import { useOtherStore } from './other'

getters: {
  fullData(state) {
    const other = useOtherStore()
    return other.data + state.local
  }
}
```

---

### 5. Convert Actions

Remove context parameter and use direct mutations.

**Vuex:**
```typescript
actions: {
  updateUser({ commit, state, dispatch, rootState }, payload) {
    commit('SET_USER', payload)
    dispatch('otherModule/action', null, { root: true })
  }
}
```

**Pinia:**
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

---

### 6. Eliminate Mutations

Pinia doesn't need mutations - mutate state directly.

**Vuex:**
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

**Pinia (Option 1 - Action mutation):**
```typescript
actions: {
  updateUser(user) {
    this.user = user // No mutation needed
  }
}
```

**Pinia (Option 2 - Component mutation):**
```typescript
// Component
store.user = newUser // Directly mutate (acceptable in Pinia)
```

---

### 7. Use $reset() Instead of Custom Clear

**Vuex:**
```typescript
mutations: {
  CLEAR_STATE(state) {
    state.user = null
    state.data = []
  }
}
```

**Pinia:**
```typescript
store.$reset() // Returns to initial state
```

---

## Component Migration

### Composition API

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

**Pinia:**
```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { firstName, lastName } = storeToRefs(userStore)
const { updateUser } = userStore
</script>
```

---

### Options API

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

**Pinia:**
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

## Complete Migration Example

### Vuex Store

```typescript
// store/modules/user.js
export default {
  namespaced: true,

  state: {
    firstName: '',
    lastName: '',
    age: 0
  },

  getters: {
    fullName: state => `${state.firstName} ${state.lastName}`,
    isAdult: state => state.age >= 18
  },

  mutations: {
    SET_FIRST_NAME(state, name) {
      state.firstName = name
    },
    SET_LAST_NAME(state, name) {
      state.lastName = name
    },
    SET_AGE(state, age) {
      state.age = age
    }
  },

  actions: {
    async loadUser({ commit }, userId) {
      const response = await fetch(`/api/users/${userId}`)
      const user = await response.json()

      commit('SET_FIRST_NAME', user.firstName)
      commit('SET_LAST_NAME', user.lastName)
      commit('SET_AGE', user.age)
    },

    updateFirstName({ commit }, name) {
      commit('SET_FIRST_NAME', name)
    }
  }
}
```

### Pinia Store (Option Store)

```typescript
// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    firstName: '',
    lastName: '',
    age: 0
  }),

  getters: {
    fullName: (state) => `${state.firstName} ${state.lastName}`,
    isAdult: (state) => state.age >= 18
  },

  actions: {
    async loadUser(userId: number) {
      const response = await fetch(`/api/users/${userId}`)
      const user = await response.json()

      // Direct mutations - no commits needed
      this.firstName = user.firstName
      this.lastName = user.lastName
      this.age = user.age
    },

    updateFirstName(name: string) {
      this.firstName = name
    }
  }
})
```

### Pinia Store (Setup Store)

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const firstName = ref('')
  const lastName = ref('')
  const age = ref(0)

  // Getters
  const fullName = computed(() => `${firstName.value} ${lastName.value}`)
  const isAdult = computed(() => age.value >= 18)

  // Actions
  async function loadUser(userId: number) {
    const response = await fetch(`/api/users/${userId}`)
    const user = await response.json()

    firstName.value = user.firstName
    lastName.value = user.lastName
    age.value = user.age
  }

  function updateFirstName(name: string) {
    firstName.value = name
  }

  return {
    firstName,
    lastName,
    age,
    fullName,
    isAdult,
    loadUser,
    updateFirstName
  }
})
```

---

## Vuex Features and Pinia Equivalents

| Vuex Feature | Pinia Equivalent |
|--------------|------------------|
| `state` | `state()` (option) or `ref()` (setup) |
| `getters` | `getters` (option) or `computed()` (setup) |
| `mutations` | ❌ Not needed - mutate directly |
| `actions` | `actions` (option) or `function()` (setup) |
| `namespaced: true` | Automatic (store ID) |
| `rootState` | Import other stores |
| `rootGetters` | Import other stores |
| `commit()` | Direct mutation |
| `dispatch()` | Call action directly |
| `mapState` | `storeToRefs()` or `mapState()` |
| `mapGetters` | `storeToRefs()` or `mapState()` |
| `mapMutations` | ❌ Not needed |
| `mapActions` | `mapActions()` or destructure |
| `modules` | Independent stores |
| `registerModule` | Create new store dynamically |

---

## Migration Checklist

- [ ] Install Pinia: `bun add pinia`
- [ ] Create `stores/` directory
- [ ] Convert each Vuex module to a Pinia store
- [ ] Remove `namespaced` property (automatic in Pinia)
- [ ] Convert state to function if needed
- [ ] Remove identity getters
- [ ] Replace `rootState`/`rootGetters` with store imports
- [ ] Remove mutations, merge into actions
- [ ] Update actions to mutate state directly
- [ ] Convert components from Vuex helpers to Pinia
- [ ] Replace `commit()` calls with direct mutations
- [ ] Replace `dispatch()` calls with direct action calls
- [ ] Test all functionality
- [ ] Remove Vuex from `package.json`
- [ ] Delete `store/` directory

---

## Common Migration Pitfalls

### Pitfall 1: Forgetting to Use storeToRefs()

```vue
<!-- ❌ Wrong - loses reactivity -->
<script setup>
const { firstName, lastName } = useUserStore()
</script>

<!-- ✅ Correct - maintains reactivity -->
<script setup>
import { storeToRefs } from 'pinia'
const { firstName, lastName } = storeToRefs(useUserStore())
</script>
```

### Pitfall 2: Trying to Commit Mutations

```typescript
// ❌ Vuex habits die hard
actions: {
  updateUser(user) {
    this.commit('SET_USER', user) // No commit in Pinia!
  }
}

// ✅ Mutate directly
actions: {
  updateUser(user) {
    this.user = user
  }
}
```

### Pitfall 3: Not Converting Nested Modules

Don't forget to convert deeply nested Vuex modules:

```
store/modules/user/profile.js → stores/user-profile.ts
```

---

## Gradual Migration Strategy

### Step 1: Install Pinia Alongside Vuex

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import store from './store' // Vuex store

const app = createApp(App)
const pinia = createPinia()

app.use(store) // Keep Vuex
app.use(pinia) // Add Pinia
app.mount('#app')
```

### Step 2: Migrate One Module at a Time

Convert one Vuex module to Pinia, test thoroughly, then move to next module.

### Step 3: Remove Vuex When Complete

```typescript
// Remove Vuex
// app.use(store)

// Keep only Pinia
app.use(pinia)
```

---

## Benefits After Migration

**What you gain:**
- ✅ Simpler API (no mutations, no namespacing)
- ✅ Better TypeScript support
- ✅ Smaller bundle size
- ✅ Automatic code splitting per store
- ✅ DevTools with time-travel debugging
- ✅ Hot module replacement (HMR)
- ✅ Plugin system
- ✅ SSR support out of the box

**What you lose:**
- ❌ Nothing! Pinia is a complete replacement

---

**See also:**
- `store-syntax-guide.md` for choosing Option vs Setup stores
- `state-getters-actions.md` for complete Pinia API
