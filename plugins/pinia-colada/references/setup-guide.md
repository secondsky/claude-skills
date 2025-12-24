# Pinia Colada Complete Setup Guide

Complete 8-step setup process for Pinia Colada in Vue 3 and Nuxt projects.

---

## Step 1: Install and Configure Plugin

**Vue Project Setup:**
```typescript
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(PiniaColada, {
  query: {
    staleTime: 5000,                   // Data fresh for 5s
    gcTime: 5 * 60 * 1000,             // Keep unused data for 5min
    refetchOnMount: true,              // Refetch stale on component mount
    refetchOnWindowFocus: false,       // Disable refetch on focus
    refetchOnReconnect: true,          // Refetch on network reconnect
    retry: 3,                          // Retry failed requests 3 times
  },
})

app.mount('#app')
```

**Nuxt Project Setup:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
  ],

  piniaColada: {
    query: {
      staleTime: 5000,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  },
})
```

**Key Points:**
- `staleTime`: How long data is considered fresh (no refetch during this time)
- `gcTime`: How long unused data stays in cache before garbage collection
- All options are optional - defaults work well for most cases
- Nuxt module auto-imports all composables (useQuery, useMutation, etc.)

---

## Step 2: Create Reusable Query Composables

**Best Practice Pattern:**
```typescript
// composables/useTodos.ts
import { useQuery } from '@pinia/colada'
import type { UseQueryReturn } from '@pinia/colada'

export interface Todo {
  id: number
  title: string
  completed: boolean
  userId: number
}

export function useTodos(): UseQueryReturn<Todo[], Error> {
  return useQuery({
    key: ['todos'],
    query: async () => {
      const response = await fetch('/api/todos')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    },
    staleTime: 10000, // Override global default for this query
  })
}

// Usage in components
// const { data: todos, isPending, error } = useTodos()
```

**Advanced: Query with Parameters:**
```typescript
// composables/useTodoById.ts
import { useQuery } from '@pinia/colada'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export function useTodoById(id: MaybeRefOrGetter<number>) {
  return useQuery({
    // Key must include all variables used in query
    key: () => ['todos', toValue(id)],
    query: async () => {
      const todoId = toValue(id)
      const response = await fetch(`/api/todos/${todoId}`)
      if (!response.ok) throw new Error('Todo not found')
      return response.json()
    },
  })
}

// Usage with reactive ID
// const todoId = ref(1)
// const { data: todo } = useTodoById(todoId)
// When todoId changes, query automatically refetches
```

**CRITICAL:**
- Always include ALL variables used in query function in the key
- Use `toValue()` to unwrap refs/getters consistently
- Key can be a function that returns array for reactive keys
- Export TypeScript types for better DX

---

## Step 3: Understanding Query Keys

Query keys are the foundation of Pinia Colada's caching system.

**Query Key Rules:**
1. Keys must be arrays (or functions returning arrays)
2. Include all variables that affect the query
3. Keys create a hierarchy for invalidation
4. Keys are serialized to JSON for comparison

**Key Patterns:**
```typescript
// Simple key
key: ['todos']

// Key with parameters
key: () => ['todos', todoId.value]

// Hierarchical keys
key: () => ['todos', 'list', { status: 'active', page: 1 }]

// Keys with filters
key: () => ['todos', {
  userId: currentUser.value.id,
  completed: filter.value,
}]
```

**Invalidation Hierarchy:**
```typescript
const cache = useQueryCache()

// Invalidate ALL todos queries
await cache.invalidateQueries({ key: ['todos'] })

// Invalidate specific todo
await cache.invalidateQueries({ key: ['todos', 123] })

// Exact match only
await cache.invalidateQueries({ key: ['todos'], exact: true })
```

**Why this matters:**
- Hierarchical keys enable efficient partial invalidation
- Including parameters in key ensures independent caching
- Invalidating `['todos']` also invalidates `['todos', 123]`

---

## Step 4: Implementing Mutations

**Basic Mutation Pattern:**
```typescript
// composables/useAddTodo.ts
import { useMutation, useQueryCache } from '@pinia/colada'

export function useAddTodo() {
  const cache = useQueryCache()

  return useMutation({
    mutation: async (newTodo: { title: string }) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      })
      if (!response.ok) throw new Error('Failed to create todo')
      return response.json()
    },

    // Invalidate queries after success
    async onSettled() {
      await cache.invalidateQueries({ key: ['todos'] })
    },
  })
}
```

**Mutation with Error Handling:**
```typescript
export function useUpdateTodo() {
  const cache = useQueryCache()

  return useMutation({
    mutation: async ({ id, updates }: { id: number; updates: Partial<Todo> }) => {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Update failed')
      return response.json()
    },

    onSuccess(result, variables, context) {
      // result: API response
      // variables: mutation input
      // context: data from onMutate
      console.log('Todo updated:', result)
    },

    onError(error, variables, context) {
      console.error('Update failed:', error)
      // Rollback logic here if using optimistic updates
    },

    async onSettled(result, error, variables) {
      // Always runs after success or error
      await cache.invalidateQueries({ key: ['todos', variables.id] })
    },
  })
}
```

**Mutation Hooks Order:**
1. `onMutate` - before mutation (for optimistic updates)
2. Mutation executes
3. `onSuccess` - if mutation succeeds
4. `onError` - if mutation fails
5. `onSettled` - always runs (success or error)

---

## Step 5: Optimistic Updates

Optimistic updates make UI feel instant by updating cache before server responds.

**Complete Optimistic Update Pattern:**
```typescript
// composables/useToggleTodo.ts
import { useMutation, useQueryCache } from '@pinia/colada'
import type { Todo } from './useTodos'

export function useToggleTodo() {
  const cache = useQueryCache()

  return useMutation({
    mutation: async (todoId: number) => {
      const response = await fetch(`/api/todos/${todoId}/toggle`, {
        method: 'PATCH',
      })
      if (!response.ok) throw new Error('Toggle failed')
      return response.json()
    },

    // Step 1: Before mutation - save snapshot and update optimistically
    onMutate(todoId: number) {
      // Cancel outgoing queries to avoid race conditions
      cache.cancelQueries({ key: ['todos'] })

      // Snapshot current data for rollback
      const previousTodos = cache.getQueryData<Todo[]>(['todos'])

      // Optimistically update cache
      if (previousTodos) {
        const optimisticTodos = previousTodos.map(todo =>
          todo.id === todoId
            ? { ...todo, completed: !todo.completed }
            : todo
        )
        cache.setQueryData(['todos'], optimisticTodos)
      }

      // Return context for use in onError
      return { previousTodos }
    },

    // Step 2a: On error - rollback optimistic update
    onError(error, todoId, context) {
      // Rollback to snapshot
      if (context?.previousTodos) {
        cache.setQueryData(['todos'], context.previousTodos)
      }
    },

    // Step 3: Always refetch to sync with server
    async onSettled() {
      await cache.invalidateQueries({ key: ['todos'] })
    },
  })
}
```

**Why this pattern works:**
- `cancelQueries` prevents race conditions with in-flight requests
- `getQueryData` retrieves current cache for snapshot
- `setQueryData` updates cache optimistically
- Context from `onMutate` flows to `onError` for rollback
- `onSettled` ensures eventual consistency with server

---

## Step 6: Query Invalidation Strategies

**Invalidation Methods:**

```typescript
import { useQueryCache } from '@pinia/colada'

const cache = useQueryCache()

// 1. Invalidate by key prefix (most common)
await cache.invalidateQueries({ key: ['todos'] })
// Invalidates: ['todos'], ['todos', 123], ['todos', 'list', {...}]

// 2. Exact key match only
await cache.invalidateQueries({ key: ['todos'], exact: true })
// Invalidates only: ['todos']

// 3. Invalidate specific query
await cache.invalidateQueries({ key: ['todos', 123] })

// 4. Invalidate all queries
await cache.invalidateQueries()

// 5. Invalidate and refetch immediately (default behavior)
await cache.invalidateQueries({
  key: ['todos'],
  refetch: true  // default
})

// 6. Invalidate without refetch (mark stale only)
await cache.invalidateQueries({
  key: ['todos'],
  refetch: false
})
```

**When to Invalidate:**

```typescript
// After mutations
useMutation({
  mutation: createTodo,
  async onSettled() {
    await cache.invalidateQueries({ key: ['todos'] })
  },
})

// On user action
async function handleRefresh() {
  await cache.invalidateQueries({ key: ['todos'] })
}

// On websocket event
socket.on('todo:updated', (todoId) => {
  cache.invalidateQueries({ key: ['todos', todoId] })
})

// On route navigation (Nuxt example)
const route = useRoute()
watch(() => route.params.id, () => {
  cache.invalidateQueries({ key: ['todos', route.params.id] })
})
```

---

## Step 7: Paginated Queries

**Paginated Query Pattern:**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@pinia/colada'

const page = ref(1)
const limit = 10

interface PaginatedResponse {
  todos: Todo[]
  total: number
  page: number
  totalPages: number
}

const { data, isPending, isLoading } = useQuery({
  key: () => ['todos', 'paginated', { page: page.value, limit }],
  query: async () => {
    const response = await fetch(
      `/api/todos?page=${page.value}&limit=${limit}`
    )
    if (!response.ok) throw new Error('Failed to fetch')
    return response.json() as Promise<PaginatedResponse>
  },
  placeholderData: (previousData) => previousData,
  // ^ Keeps previous page data while fetching next page
})

const todos = computed(() => data.value?.todos ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 1)

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
  }
}

function prevPage() {
  if (page.value > 1) {
    page.value--
  }
}
</script>

<template>
  <div>
    <ul v-if="todos.length">
      <li v-for="todo in todos" :key="todo.id">
        {{ todo.title }}
      </li>
    </ul>

    <div class="pagination">
      <button
        @click="prevPage"
        :disabled="page === 1 || isLoading"
      >
        Previous
      </button>

      <span>Page {{ page }} of {{ totalPages }}</span>

      <button
        @click="nextPage"
        :disabled="page === totalPages || isLoading"
      >
        Next
      </button>
    </div>

    <div v-if="isLoading">Loading...</div>
  </div>
</template>
```

**Why `placeholderData` matters:**
- Shows previous page data while next page loads
- Prevents layout shift / flashing
- Better UX than showing loader

---

## Step 8: SSR and Nuxt Integration

**Nuxt Auto-Configuration:**

The `@pinia/colada-nuxt` module automatically:
- Installs and configures Pinia Colada
- Handles SSR serialization/hydration
- Auto-imports all composables
- Configures plugins for SSR compatibility

**SSR Best Practices:**

```typescript
// 1. Use relative URLs for API calls (works in SSR + client)
const { data } = useQuery({
  key: ['todos'],
  query: () => fetch('/api/todos').then(r => r.json()),
})

// 2. Handle SSR/client differences
const { data } = useQuery({
  key: ['todos'],
  query: async () => {
    // Use different URL in SSR vs client if needed
    const baseURL = import.meta.server
      ? 'http://localhost:3000'
      : ''

    const response = await fetch(`${baseURL}/api/todos`)
    return response.json()
  },
})

// 3. Disable refetch on mount for SSR (data already fresh)
const { data } = useQuery({
  key: ['todos'],
  query: fetchTodos,
  refetchOnMount: false, // SSR data is already fresh
})
```

---

## Official Documentation

- **Pinia Colada**: https://pinia-colada.esm.dev/
- **GitHub Repository**: https://github.com/posva/pinia-colada
- **Nuxt Module**: https://nuxt.com/modules/pinia-colada
- **Pinia**: https://pinia.vuejs.org/
