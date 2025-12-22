# Vuex to Pinia Migration Checklist

Complete checklist for migrating from Vuex to Pinia safely and efficiently.

---

## Pre-Migration Preparation

- [ ] **Document current Vuex setup**
  - List all modules and their responsibilities
  - Document any complex state dependencies
  - Note any Vuex plugins in use

- [ ] **Install Pinia alongside Vuex**
  ```bash
  bun add pinia
  # or: npm install pinia
  ```

- [ ] **Set up Pinia instance**
  ```typescript
  // main.ts
  import { createPinia } from 'pinia'

  const pinia = createPinia()
  app.use(pinia) // Can coexist with Vuex initially
  ```

- [ ] **Choose migration strategy**
  - [ ] Big bang (all at once)
  - [ ] Incremental (module by module)
  - [ ] Recommended: **Incremental migration**

---

## Module-by-Module Migration

### Step 1: Directory Structure

**Before (Vuex):**
```text
src/store/
├── index.js
└── modules/
    ├── auth/
    │   └── index.js
    ├── cart/
    │   └── index.js
    └── products/
        └── index.js
```

**After (Pinia):**
```text
src/stores/
├── auth.ts
├── cart.ts
└── products.ts
```

- [ ] Create `src/stores/` directory
- [ ] Plan naming convention: `use[Module]Store`

### Step 2: Module Conversion

For each Vuex module, complete this checklist:

- [ ] **Create Pinia store file**
  - File: `stores/[module-name].ts`
  - Export: `use[ModuleName]Store`

- [ ] **Convert state**
  - [ ] Change from object to function: `state: () => ({ ... })`
  - [ ] Declare all properties (no dynamic properties)
  - [ ] Add TypeScript interfaces

- [ ] **Convert getters**
  - [ ] Remove identity getters (direct state access)
  - [ ] Convert `rootState`/`rootGetters` to store imports
  - [ ] Add return types for getters using `this`

- [ ] **Convert actions**
  - [ ] Remove `{ commit, dispatch, rootState }` parameter
  - [ ] Change `commit('MUTATION')` to `this.property = value`
  - [ ] Convert `dispatch('module/action')` to `useOtherStore().action()`
  - [ ] Change `rootState.module` to `useModuleStore()`

- [ ] **Delete mutations**
  - [ ] Move logic to actions
  - [ ] Use direct state mutation: `this.count++`
  - [ ] Use `$patch()` for multiple mutations

- [ ] **Add HMR support**
  ```typescript
  if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useMyStore, import.meta.hot))
  }
  ```

### Step 3: Component Updates

For each component using the migrated module:

- [ ] **Composition API components**
  ```typescript
  // Before
  import { useStore } from 'vuex'
  const store = useStore()
  const user = computed(() => store.state.auth.user)

  // After
  import { useAuthStore } from '@/stores/auth'
  import { storeToRefs } from 'pinia'
  const auth = useAuthStore()
  const { user } = storeToRefs(auth)
  ```

- [ ] **Options API components**
  ```typescript
  // Before
  import { mapState, mapActions } from 'vuex'
  computed: {
    ...mapState('auth', ['user'])
  }

  // After
  import { mapState, mapActions } from 'pinia'
  import { useAuthStore } from '@/stores/auth'
  computed: {
    ...mapState(useAuthStore, ['user'])
  }
  ```

- [ ] **Update all imports**
- [ ] **Test component functionality**

---

## Common Conversion Patterns

### Pattern 1: Namespaced Modules

**Vuex:**
```typescript
// store/modules/user.js
export default {
  namespaced: true,
  state: () => ({ ... }),
  mutations: { ... },
  actions: { ... }
}
```

**Pinia:**
```typescript
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({ ... }),
  actions: { ... } // No namespaced needed - built-in
})
```

- [ ] Remove `namespaced: true`
- [ ] Store ID is the namespace

### Pattern 2: Root State Access

**Vuex:**
```typescript
getters: {
  userData(state, getters, rootState) {
    return rootState.settings.theme + state.name
  }
}
```

**Pinia:**
```typescript
import { useSettingsStore } from './settings'

getters: {
  userData(state) {
    const settings = useSettingsStore()
    return settings.theme + state.name
  }
}
```

- [ ] Import other stores
- [ ] Replace `rootState.x` with `useXStore()`

### Pattern 3: Mutations → Direct Mutations

**Vuex:**
```typescript
mutations: {
  SET_USER(state, user) {
    state.user = user
  },
  INCREMENT(state) {
    state.count++
  }
}

actions: {
  updateUser({ commit }, user) {
    commit('SET_USER', user)
  }
}
```

**Pinia:**
```typescript
actions: {
  updateUser(user) {
    this.user = user // Direct mutation
  },
  increment() {
    this.count++
  }
}
```

- [ ] Delete all mutations
- [ ] Move mutation logic to actions
- [ ] Use `this.property = value`

### Pattern 4: Module Registration

**Vuex:**
```typescript
// store/index.js
import user from './modules/user'
import cart from './modules/cart'

export default createStore({
  modules: {
    user,
    cart
  }
})
```

**Pinia:**
```typescript
// No central registration needed!
// Just import stores where needed

import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
```

- [ ] Remove module registration
- [ ] Stores auto-register on first use

---

## Testing Migration

- [ ] **Unit test stores**
  ```typescript
  import { setActivePinia, createPinia } from 'pinia'
  import { useAuthStore } from '@/stores/auth'

  describe('Auth Store', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('logs in user', async () => {
      const auth = useAuthStore()
      await auth.login({ email: 'test@test.com', password: '123' })
      expect(auth.isAuthenticated).toBe(true)
    })
  })
  ```

- [ ] **Update component tests**
  ```typescript
  import { createTestingPinia } from '@pinia/testing'

  mount(MyComponent, {
    global: {
      plugins: [createTestingPinia()]
    }
  })
  ```

---

## Router Integration Updates

- [ ] **Update navigation guards**

**Vuex:**
```typescript
import store from '@/store'

router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !store.state.auth.isAuthenticated) {
    return '/login'
  }
})
```

**Pinia:**
```typescript
import { useAuthStore } from '@/stores/auth'

router.beforeEach((to, from) => {
  const auth = useAuthStore() // ✅ Call inside guard
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }
})
```

---

## Plugin Migration

- [ ] **Audit Vuex plugins**
  - List all plugins currently in use
  - Check if Pinia equivalents exist
  - Plan custom plugin conversions

- [ ] **Common plugin conversions**

**Vuex Persistence:**
```typescript
// Vuex
import createPersistedState from 'vuex-persistedstate'

createStore({
  plugins: [createPersistedState()]
})
```

**Pinia Persistence:**
```typescript
// Pinia
import { persistPlugin } from '@/plugins/persist'

const pinia = createPinia()
pinia.use(persistPlugin)
```

---

## Performance Optimization

- [ ] **Enable DevTools**
  - Verify Pinia appears in Vue DevTools
  - Test time-travel debugging

- [ ] **Add HMR to all stores**
  - Faster development iteration
  - Preserve state during edits

- [ ] **Remove unused code**
  - Delete Vuex store files
  - Remove Vuex from package.json (when fully migrated)
  - Remove Vuex setup from main.ts

---

## Final Cleanup

- [ ] **Remove Vuex completely**
  ```bash
  bun remove vuex
  # or: npm uninstall vuex
  ```

- [ ] **Delete Vuex files**
  - Remove `store/` directory
  - Remove Vuex TypeScript declarations

- [ ] **Update documentation**
  - Update README with Pinia setup
  - Document new store patterns
  - Update contribution guidelines

- [ ] **Team training**
  - Share Pinia best practices
  - Review common pitfalls
  - Demonstrate new patterns

---

## Verification Checklist

- [ ] **All components work correctly**
- [ ] **All tests pass**
- [ ] **No console errors or warnings**
- [ ] **DevTools shows all stores**
- [ ] **HMR works in development**
- [ ] **SSR hydration works (if applicable)**
- [ ] **Production build succeeds**
- [ ] **No Vuex dependencies remain**

---

## Common Migration Gotchas

### ❌ Don't destructure without storeToRefs()
```typescript
// ❌ Wrong
const { user } = useAuthStore()

// ✅ Correct
const { user } = storeToRefs(useAuthStore())
```

### ❌ Don't call useStore() at module level
```typescript
// ❌ Wrong
const auth = useAuthStore()
router.beforeEach(() => { ... })

// ✅ Correct
router.beforeEach(() => {
  const auth = useAuthStore()
})
```

### ❌ Don't forget to return all state in setup stores
```typescript
// ❌ Wrong
export const useStore = defineStore('store', () => {
  const secret = ref('private') // Not returned!
  return {}
})

// ✅ Correct
export const useStore = defineStore('store', () => {
  const secret = ref('private')
  return { secret } // Exposed
})
```

---

## Migration Timeline Example

**Week 1:**
- [ ] Set up Pinia alongside Vuex
- [ ] Migrate 1-2 simple modules
- [ ] Update related components
- [ ] Test thoroughly

**Week 2:**
- [ ] Migrate 3-4 more modules
- [ ] Update all related components
- [ ] Migrate router guards
- [ ] Update tests

**Week 3:**
- [ ] Migrate remaining modules
- [ ] Complete component updates
- [ ] Migrate plugins
- [ ] Final testing

**Week 4:**
- [ ] Remove Vuex entirely
- [ ] Final verification
- [ ] Deploy to production
- [ ] Monitor for issues

---

**Completed**: [ ] Migration fully complete and verified

**Notes:**
- Take your time with each module
- Test thoroughly at each step
- Keep Vuex and Pinia coexisting during migration
- Roll back quickly if issues arise
