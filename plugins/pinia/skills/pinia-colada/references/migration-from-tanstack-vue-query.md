# Migration Guide: TanStack Vue Query → Pinia Colada

**Last Updated**: 2025-11-11
**Source**: https://pinia-colada.esm.dev/cookbook/migration-tvq.html

---

## Why Migrate to Pinia Colada?

Pinia Colada is specifically designed for Vue.js with:
- Better Vue 3 Composition API integration
- Built on Pinia (official Vue state management)
- Smaller bundle size (~2kb baseline vs ~10kb+)
- First-class TypeScript support
- Better SSR integration with Nuxt
- Simpler API with fewer concepts to learn

---

## Package Migration

### Install Pinia Colada

```bash
# Remove TanStack Vue Query
bun remove @tanstack/vue-query

# Install Pinia Colada
bun add @pinia/colada pinia

# For Nuxt
bun add @pinia/nuxt @pinia/colada-nuxt
```

### Update Plugin Setup

**Before (TanStack Vue Query):**
```typescript
// main.ts
import { VueQueryPlugin } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
    },
  },
})

app.use(VueQueryPlugin, { queryClient })
```

**After (Pinia Colada):**
```typescript
// main.ts
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'

const pinia = createPinia()

app.use(pinia)
app.use(PiniaColada, {
  query: {
    staleTime: 5000,
  },
})
```

---

## API Differences

### Query Hooks

| TanStack Vue Query | Pinia Colada | Notes |
|-------------------|--------------|-------|
| `useQuery({ queryKey, queryFn })` | `useQuery({ key, query })` | Property names changed |
| `queryKey: ['todos']` | `key: ['todos']` | Same array format |
| `queryFn: fetchTodos` | `query: fetchTodos` | Name changed |
| `isLoading` | `isPending` for initial, `isLoading` for any | More granular states |
| `data` | `data` | Same |
| `error` | `error` | Same |
| `refetch()` | `refresh()` | Method renamed |
| `isFetching` | `isLoading` | Simplified |
| `isInitialLoading` | `isPending` | Renamed |

### Mutation Hooks

| TanStack Vue Query | Pinia Colada | Notes |
|-------------------|--------------|-------|
| `useMutation({ mutationFn })` | `useMutation({ mutation })` | Property name changed |
| `mutationFn: createTodo` | `mutation: createTodo` | Name changed |
| `mutate()` | `mutate()` | Same |
| `mutateAsync()` | `mutateAsync()` | Same |
| `isLoading` | `isPending` | Renamed |
| Callbacks in `useMutation` | Callbacks in `useMutation` | Same pattern |

### Query Client / Cache

| TanStack Vue Query | Pinia Colada | Notes |
|-------------------|--------------|-------|
| `useQueryClient()` | `useQueryCache()` | Renamed |
| `queryClient.invalidateQueries()` | `cache.invalidateQueries()` | Same API |
| `queryClient.setQueryData()` | `cache.setQueryData()` | Same API |
| `queryClient.getQueryData()` | `cache.getQueryData()` | Same API |
| `queryClient.prefetchQuery()` | `cache.prefetchQuery()` | Same API |
| `queryClient.cancelQueries()` | `cache.cancelQueries()` | Same API |

---

## Code Migration Examples

### Example 1: Basic Query

**Before (TanStack Vue Query):**
```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['todos'],
  queryFn: async () => {
    const res = await fetch('/api/todos')
    return res.json()
  },
})
</script>
```

**After (Pinia Colada):**
```vue
<script setup lang="ts">
import { useQuery } from '@pinia/colada'

const { data, isPending, error } = useQuery({
  key: ['todos'],
  query: async () => {
    const res = await fetch('/api/todos')
    return res.json()
  },
})
</script>

<template>
  <!-- Change isLoading to isPending -->
  <div v-if="isPending">Loading...</div>
</template>
```

**Changes Required:**
1. Import from `@pinia/colada` instead of `@tanstack/vue-query`
2. Change `queryKey` → `key`
3. Change `queryFn` → `query`
4. Change `isLoading` → `isPending` (for initial load)

### Example 2: Query with Parameters

**Before:**
```typescript
const todoId = ref(1)

const { data } = useQuery({
  queryKey: ['todo', todoId],
  queryFn: () => fetchTodo(todoId.value),
})
```

**After:**
```typescript
const todoId = ref(1)

const { data } = useQuery({
  key: () => ['todo', todoId.value],
  query: () => fetchTodo(todoId.value),
})
```

**Changes Required:**
1. Make `key` a function that returns array (for reactivity)
2. Change `queryKey` → `key`, `queryFn` → `query`

### Example 3: Mutation with Invalidation

**Before:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

const { mutate } = useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

**After:**
```typescript
import { useMutation, useQueryCache } from '@pinia/colada'

const cache = useQueryCache()

const { mutate } = useMutation({
  mutation: createTodo,
  async onSettled() {
    await cache.invalidateQueries({ key: ['todos'] })
  },
})
```

**Changes Required:**
1. Import `useQueryCache` instead of `useQueryClient`
2. Change `mutationFn` → `mutation`
3. Prefer `onSettled` over `onSuccess` (runs on both success and error)
4. Change `queryKey` → `key` in invalidation

### Example 4: Optimistic Updates

**Before:**
```typescript
const { mutate } = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previous = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
    return { previous }
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

**After:**
```typescript
const { mutate } = useMutation({
  mutation: updateTodo,
  onMutate(newTodo) {
    cache.cancelQueries({ key: ['todos'] })
    const previous = cache.getQueryData(['todos'])
    cache.setQueryData(['todos'], [...previous, newTodo])
    return { previous }
  },
  onError(err, newTodo, context) {
    cache.setQueryData(['todos'], context.previous)
  },
  async onSettled() {
    await cache.invalidateQueries({ key: ['todos'] })
  },
})
```

**Changes Required:**
1. Use `cache` instead of `queryClient`
2. Change `queryKey` → `key`
3. Change `mutationFn` → `mutation`
4. Remove `async/await` from `onMutate` (not needed)
5. Use direct array instead of callback in `setQueryData`

### Example 5: Nuxt Integration

**Before (TanStack Vue Query):**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@tanstack/vue-query-nuxt'],
})

// plugins/vue-query.ts
export default defineNuxtPlugin((nuxt) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5000 } }
  })
  nuxt.vueApp.use(VueQueryPlugin, { queryClient })
})
```

**After (Pinia Colada):**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',           // Required first
    '@pinia/colada-nuxt',
  ],

  piniaColada: {
    query: {
      staleTime: 5000,
    },
  },
})

// No plugin file needed - auto-configured!
```

**Changes Required:**
1. Replace module with `@pinia/colada-nuxt`
2. Add `@pinia/nuxt` before it
3. Remove plugin file - configuration handled in nuxt.config
4. Auto-imports work out of the box

---

## Breaking Changes to Watch For

### 1. Query Callbacks Removed

**TanStack Vue Query** had query callbacks (`onSuccess`, `onError` in `useQuery`).

**Pinia Colada** removed these. Use `watch` instead:

```typescript
const { data } = useQuery({ key: ['todos'], query: fetchTodos })

// Instead of onSuccess callback
watch(data, (newData) => {
  if (newData) {
    console.log('Query succeeded:', newData)
  }
})
```

### 2. `enabled` Option Behavior

Both support `enabled`, but Pinia Colada requires a function:

**Before:**
```typescript
const enabled = ref(false)
useQuery({ queryKey: ['todos'], queryFn: fetchTodos, enabled })
```

**After:**
```typescript
const enabled = ref(false)
useQuery({ key: ['todos'], query: fetchTodos, enabled: () => enabled.value })
```

### 3. `placeholderData` vs `initialData`

**TanStack Vue Query** has both `placeholderData` and `initialData`.

**Pinia Colada** has:
- `placeholderData` - shows while loading, not cached
- No `initialData` (use `placeholderData` instead)

### 4. `gcTime` Replaces `cacheTime`

**Before:**
```typescript
queryClient.setDefaultOptions({
  queries: { cacheTime: 5 * 60 * 1000 },
})
```

**After:**
```typescript
app.use(PiniaColada, {
  query: { gcTime: 5 * 60 * 1000 },
})
```

---

## Migration Checklist

- [ ] Install `@pinia/colada` and `pinia`
- [ ] Remove `@tanstack/vue-query`
- [ ] Update plugin setup in `main.ts` or `nuxt.config.ts`
- [ ] Replace all `useQuery` imports
- [ ] Change `queryKey` → `key`, `queryFn` → `query`
- [ ] Change `isLoading` → `isPending` for initial load state
- [ ] Replace `useQueryClient` → `useQueryCache`
- [ ] Change `mutationFn` → `mutation` in mutations
- [ ] Update all `queryKey` → `key` in cache operations
- [ ] Convert query callbacks to `watch` statements
- [ ] Make `enabled` option a function if used
- [ ] Change `cacheTime` → `gcTime`
- [ ] Update Nuxt integration if using Nuxt
- [ ] Test all queries, mutations, and invalidations
- [ ] Verify SSR hydration if using SSR

---

## Feature Parity

| Feature | TanStack Vue Query | Pinia Colada | Status |
|---------|-------------------|--------------|--------|
| Basic queries | ✅ | ✅ | Full parity |
| Query keys | ✅ | ✅ | Full parity |
| Mutations | ✅ | ✅ | Full parity |
| Cache management | ✅ | ✅ | Full parity |
| Optimistic updates | ✅ | ✅ | Full parity |
| Query invalidation | ✅ | ✅ | Full parity |
| Prefetching | ✅ | ✅ | Full parity |
| SSR support | ✅ | ✅ | Full parity (better in Nuxt) |
| Paginated queries | ✅ | ✅ | Full parity |
| Infinite queries | ✅ | ⚠️ | Use paginated queries pattern |
| Query cancellation | ✅ | ✅ | Full parity |
| DevTools | ✅ | ✅ | Built-in Vue DevTools support |
| Suspense | ✅ | ❌ | Not yet supported |
| Query callbacks | ✅ | ❌ | Use `watch` instead |
| Retry logic | ✅ | ✅ | Full parity |
| Background refetch | ✅ | ✅ | Full parity |

---

## Common Migration Mistakes

### Mistake 1: Forgetting to Make Key a Function

```typescript
// ❌ Wrong - won't be reactive
const id = ref(1)
useQuery({ key: ['todo', id.value], query: () => fetchTodo(id.value) })

// ✅ Correct - reactive
useQuery({ key: () => ['todo', id.value], query: () => fetchTodo(id.value) })
```

### Mistake 2: Using `isLoading` for Initial State

```typescript
// ❌ Wrong - isLoading is true during refetches too
const { data, isLoading } = useQuery({ key: ['todos'], query: fetchTodos })

// ✅ Correct - use isPending for initial load
const { data, isPending } = useQuery({ key: ['todos'], query: fetchTodos })
```

### Mistake 3: Not Awaiting `invalidateQueries`

```typescript
// ❌ Wrong - mutation resolves before refetch completes
onSuccess() {
  cache.invalidateQueries({ key: ['todos'] })
  closeModal() // Might see stale data
}

// ✅ Correct - wait for refetch
async onSettled() {
  await cache.invalidateQueries({ key: ['todos'] })
  closeModal() // Data is fresh
}
```

---

## Need Help?

- **Official Migration Guide**: https://pinia-colada.esm.dev/cookbook/migration-tvq.html
- **Pinia Colada Docs**: https://pinia-colada.esm.dev/
- **GitHub Issues**: https://github.com/posva/pinia-colada/issues
- **Pinia Colada Skill**: See [SKILL.md](../SKILL.md) for complete documentation

---

**Happy migrating!** Pinia Colada provides a simpler, more Vue-native experience. 🍹
