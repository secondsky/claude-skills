# Pinia Colada Error Catalog

Complete catalog of 12 documented errors with sources, causes, and solutions.

---

## Error #1: Query Not Refetching After Mutation

**Error**: Data doesn't update in UI after successful mutation

**Source**: https://github.com/posva/pinia-colada/discussions/315

**Why It Happens**: Forgot to invalidate queries in mutation hooks

**Solution**: Always use `invalidateQueries` in `onSettled`:
```typescript
useMutation({
  mutation: createTodo,
  async onSettled() {
    await queryCache.invalidateQueries({ key: ['todos'] })
  },
})
```

---

## Error #2: Race Condition with Optimistic Updates

**Error**: Optimistic update gets overwritten by in-flight request

**Source**: https://github.com/posva/pinia-colada/issues/53

**Why It Happens**: Didn't cancel ongoing queries before optimistic update

**Solution**: Always call `cancelQueries` in `onMutate`:
```typescript
onMutate(id) {
  cache.cancelQueries({ key: ['todos'] })
  // Then do optimistic update
}
```

---

## Error #3: SSR Hydration Mismatch

**Error**: `Hydration completed but contains mismatches`

**Source**: Nuxt SSR documentation

**Why It Happens**: Client refetches on mount with different data than server

**Solution**: Set `refetchOnMount: false` for SSR queries
```typescript
useQuery({
  key: ['todos'],
  query: fetchTodos,
  refetchOnMount: false, // Prevents SSR hydration mismatch
})
```

---

## Error #4: Query Key Not Reactive

**Error**: Query doesn't refetch when variable changes

**Why It Happens**: Key is static array instead of function

**Solution**: Use function for reactive keys:
```typescript
// ❌ Wrong - static key
key: ['todos', id.value]

// ✅ Correct - reactive key
key: () => ['todos', id.value]
```

---

## Error #5: Mutation onSuccess Doesn't Await Invalidation

**Error**: Modal closes before data refreshes, showing stale data

**Why It Happens**: `invalidateQueries` not awaited

**Solution**: Always await invalidation:
```typescript
async onSettled() {
  await cache.invalidateQueries({ key: ['todos'] })
  // Now safe to continue
}
```

---

## Error #6: Cannot Read Property of Undefined

**Error**: `Cannot read property 'map' of undefined`

**Why It Happens**: Using `data.value` before it's defined

**Solution**: Always check or provide fallback:
```typescript
// ✅ With optional chaining
const todos = computed(() => data.value?.todos ?? [])

// ✅ With v-if
<ul v-if="data">
  <li v-for="todo in data" :key="todo.id">
```

---

## Error #7: Query Invalidation Doesn't Work

**Error**: `invalidateQueries` doesn't refetch query

**Why It Happens**: Key mismatch (different key structure)

**Solution**: Use exact same key structure:
```typescript
// Query
useQuery({ key: ['todos', { status: 'active' }], ... })

// Invalidation - must match
cache.invalidateQueries({ key: ['todos', { status: 'active' }] })

// Or invalidate by prefix
cache.invalidateQueries({ key: ['todos'] }) // Catches all
```

---

## Error #8: Memory Leak from Unused Queries

**Error**: App becomes slow over time, high memory usage

**Why It Happens**: `gcTime` set too high or to Infinity

**Solution**: Use reasonable `gcTime` (5-60 minutes):
```typescript
app.use(PiniaColada, {
  query: {
    gcTime: 5 * 60 * 1000, // 5 minutes (not Infinity)
  },
})
```

---

## Error #9: Mutation Error Not Handled

**Error**: Unhandled promise rejection in console

**Why It Happens**: Using `mutateAsync` without try/catch

**Solution**: Always handle errors:
```typescript
// With mutate (no try/catch needed)
mutate(variables) // errors in error ref

// With mutateAsync (need try/catch)
try {
  await mutateAsync(variables)
} catch (error) {
  console.error(error)
}
```

---

## Error #10: Nuxt Module Order Wrong

**Error**: `PiniaColada plugin not found` or SSR errors

**Source**: https://pinia-colada.esm.dev/nuxt.html

**Why It Happens**: `@pinia/colada-nuxt` loaded before `@pinia/nuxt`

**Solution**: Always put `@pinia/nuxt` first:
```typescript
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',           // MUST be first
    '@pinia/colada-nuxt',    // Then Colada
  ],
})
```

---

## Error #11: Optimistic Update Lost on Error

**Error**: Optimistic update not rolled back on failure

**Why It Happens**: No rollback logic in `onError`

**Solution**: Always rollback in `onError`:
```typescript
onMutate(id) {
  const prev = cache.getQueryData(['todos'])
  // ... optimistic update
  return { prev }
},
onError(_err, _vars, ctx) {
  if (ctx?.prev) {
    cache.setQueryData(['todos'], ctx.prev)
  }
},
```

---

## Error #12: Infinite Refetch Loop

**Error**: Query refetches continuously

**Why It Happens**: Query key changes on every render (object identity)

**Solution**: Memoize or use stable references:
```typescript
// ❌ Wrong - new object every render
key: () => ['todos', { filters: getFilters() }]

// ✅ Correct - stable reference
const filters = ref({ status: 'active' })
key: () => ['todos', filters.value]
```

---

## Prevention Checklist

Use this checklist to prevent all 12 errors:

- [ ] Invalidate queries in mutation `onSettled` hook
- [ ] Cancel queries before optimistic updates (`onMutate`)
- [ ] Set `refetchOnMount: false` for SSR queries
- [ ] Use function for reactive query keys: `key: () => [...]`
- [ ] Await `invalidateQueries()` when order matters
- [ ] Check `data.value` for undefined before use
- [ ] Match exact key structure when invalidating
- [ ] Set reasonable `gcTime` (5-60 minutes, not Infinity)
- [ ] Use try/catch with `mutateAsync()` or use `mutate()`
- [ ] Put `@pinia/nuxt` before `@pinia/colada-nuxt` in modules
- [ ] Implement rollback in `onError` for optimistic updates
- [ ] Use stable references for query keys (refs, not computed functions)

---

## Official Documentation

- **Pinia Colada**: https://pinia-colada.esm.dev/
- **Troubleshooting**: https://pinia-colada.esm.dev/cookbook/troubleshooting.html
- **GitHub Issues**: https://github.com/posva/pinia-colada/issues
