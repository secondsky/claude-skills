# Pinia Colada Configuration Reference

Complete configuration options for Pinia Colada plugin and advanced cache methods.

---

## PiniaColada Plugin Options (Full Reference)

### Vue Configuration

```typescript
// Vue - main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(PiniaColada, {
  query: {
    // How long data is fresh (no refetch during this time)
    staleTime: 5000,                    // 5 seconds (default: 5000)

    // How long inactive queries stay in cache
    gcTime: 5 * 60 * 1000,              // 5 minutes (default: 5 min)

    // Refetch stale queries on component mount
    refetchOnMount: true,               // default: true

    // Refetch stale queries when window regains focus
    refetchOnWindowFocus: false,        // default: true

    // Refetch stale queries when network reconnects
    refetchOnReconnect: true,           // default: true

    // Number of retries for failed queries
    retry: 3,                           // default: 3

    // Delay between retries (exponential backoff)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },

  mutation: {
    // Mutation-specific defaults (rarely needed)
  },

  // Custom plugins
  plugins: [
    // Add custom plugins here
  ],
})
```

### Nuxt Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',           // MUST be first
    '@pinia/colada-nuxt',
  ],

  piniaColada: {
    query: {
      staleTime: 5000,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 3,
    },
  },
})
```

---

## Query Options (Per-Query Override)

```typescript
const { data, isPending, error } = useQuery({
  // Required: Query key (array or function returning array)
  key: () => ['todos', filters.value],

  // Required: Query function (must throw on error, not return undefined)
  query: async () => {
    const response = await fetch('/api/todos')
    if (!response.ok) throw new Error('Failed')
    return response.json()
  },

  // How long data is fresh (overrides global)
  staleTime: 10000,                 // 10 seconds

  // How long query stays in cache when inactive
  gcTime: 10 * 60 * 1000,           // 10 minutes

  // Whether to refetch stale data on mount
  refetchOnMount: true,

  // Whether to refetch stale data when window gains focus
  refetchOnWindowFocus: false,

  // Whether to refetch stale data when network reconnects
  refetchOnReconnect: true,

  // Number of retries
  retry: 3,

  // Retry delay function
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

  // Whether query is enabled (can be reactive)
  enabled: () => true,

  // Placeholder data while loading
  placeholderData: (previousData) => previousData,

  // Initial data
  initialData: () => [],

  // Refetch interval (milliseconds or function returning milliseconds)
  refetchInterval: false,           // Or: 5000 for every 5 seconds

  // Refetch even when window not focused
  refetchIntervalInBackground: false,

  // Transform query data before caching
  select: (data) => data.filter(item => item.active),
})
```

---

## Mutation Options

```typescript
const { mutate, mutateAsync, isPending, error } = useMutation({
  // Required: Mutation function (async, throws on error)
  mutation: async (variables: CreateTodoInput) => {
    const response = await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(variables),
    })
    if (!response.ok) throw new Error('Failed')
    return response.json()
  },

  // Before mutation (for optimistic updates)
  onMutate: (variables) => {
    // Return context for use in onError/onSuccess/onSettled
    return { previousData: cache.getQueryData(['todos']) }
  },

  // On successful mutation
  onSuccess: (data, variables, context) => {
    console.log('Success:', data)
  },

  // On mutation error
  onError: (error, variables, context) => {
    console.error('Error:', error)
    // Rollback optimistic updates using context
  },

  // Always runs after success or error
  onSettled: async (data, error, variables, context) => {
    // Perfect place for cache invalidation
    await cache.invalidateQueries({ key: ['todos'] })
  },

  // Number of retries
  retry: 0,                         // default: 0 (mutations don't retry by default)

  // Retry delay
  retryDelay: (attemptIndex) => 1000 * 2 ** attemptIndex,
})
```

---

## Query Cache Methods

```typescript
import { useQueryCache } from '@pinia/colada'

const cache = useQueryCache()

// Get cached data
const todos = cache.getQueryData<Todo[]>(['todos'])
// Returns: Todo[] | undefined

// Set cache data (useful for optimistic updates)
cache.setQueryData(['todos'], newTodos)

// Invalidate queries (mark as stale and refetch active ones)
await cache.invalidateQueries({
  key: ['todos'],             // Key prefix or exact key
  exact: false,               // If true, only invalidate exact match
  refetch: true,              // If true, refetch active queries immediately
})

// Prefetch query (fetch but don't use yet)
await cache.prefetchQuery({
  key: ['todos', 123],
  query: () => fetchTodo(123),
  staleTime: 5000,
})

// Cancel in-flight queries (prevents race conditions)
cache.cancelQueries({
  key: ['todos'],
  exact: false,
})

// Remove queries from cache
cache.removeQueries({
  key: ['todos'],
  exact: false,
})

// Get all queries
const allQueries = cache.getQueries()

// Get queries matching key
const todoQueries = cache.getQueries({ key: ['todos'] })

// Check if query exists
const exists = cache.hasQuery({ key: ['todos'] })

// Reset entire cache (clear everything)
cache.resetQueries()
```

---

## Advanced Configuration Patterns

### Environment-Specific Configuration

```typescript
// main.ts
const isProd = import.meta.env.PROD

app.use(PiniaColada, {
  query: {
    staleTime: isProd ? 10000 : 1000,       // Longer stale time in prod
    gcTime: isProd ? 30 * 60 * 1000 : 5 * 60 * 1000,  // 30min prod, 5min dev
    refetchOnWindowFocus: !isProd,          // Only in dev
  },
})
```

### API Base URL Configuration

```typescript
// composables/useApiQuery.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export function useApiQuery<T>(endpoint: string, options = {}) {
  return useQuery<T>({
    key: ['api', endpoint],
    query: async () => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
    ...options,
  })
}

// Usage
const { data } = useApiQuery<Todo[]>('/todos')
```

### Custom Error Handling

```typescript
// plugins/errorHandler.ts
import type { PiniaColadaPlugin } from '@pinia/colada'

export const errorHandlerPlugin: PiniaColadaPlugin = ({ cache }) => {
  cache.$onAction(({ name, after, onError }) => {
    onError((error) => {
      // Global error handling
      if (error.status === 401) {
        // Redirect to login
        router.push('/login')
      } else if (error.status === 500) {
        // Show error toast
        toast.error('Server error occurred')
      }
    })
  })
}

// Register
app.use(PiniaColada, {
  plugins: [errorHandlerPlugin],
})
```

### DevTools Plugin

```typescript
// plugins/devtools.ts
import type { PiniaColadaPlugin } from '@pinia/colada'

export const devtoolsPlugin: PiniaColadaPlugin = ({ cache }) => {
  if (import.meta.env.DEV) {
    // Log all query actions
    cache.$onAction(({ name, args, after }) => {
      console.log(`[Pinia Colada] ${name}`, args)

      after((result) => {
        console.log(`[Pinia Colada] ${name} completed`, result)
      })
    })
  }
}
```

---

## TypeScript Configuration

### Strict Types for Queries

```typescript
import type { UseQueryOptions, UseQueryReturn } from '@pinia/colada'

// Define query options type
type TodoQueryOptions = UseQueryOptions<Todo[], Error>

// Create typed query function
function useTodos(options?: TodoQueryOptions): UseQueryReturn<Todo[], Error> {
  return useQuery({
    key: ['todos'],
    query: fetchTodos,
    ...options,
  })
}
```

### Strict Types for Mutations

```typescript
import type { UseMutationOptions, UseMutationReturn } from '@pinia/colada'

type CreateTodoMutation = UseMutationOptions<
  Todo,                    // Result type
  { title: string },       // Variables type
  Error                    // Error type
>

function useCreateTodo(options?: CreateTodoMutation): UseMutationReturn<Todo, { title: string }, Error> {
  return useMutation({
    mutation: createTodo,
    ...options,
  })
}
```

### Global Type Augmentation

```typescript
// types/pinia-colada.d.ts
import '@pinia/colada'

declare module '@pinia/colada' {
  interface QueryMeta {
    // Add custom metadata
    authRequired?: boolean
    cacheDuration?: number
  }
}
```

---

## Performance Optimization

### Reduce Refetch Frequency

```typescript
app.use(PiniaColada, {
  query: {
    staleTime: 30000,              // 30 seconds
    refetchOnWindowFocus: false,   // Disable focus refetch
    refetchOnReconnect: false,     // Disable reconnect refetch
  },
})
```

### Aggressive Caching

```typescript
app.use(PiniaColada, {
  query: {
    staleTime: 5 * 60 * 1000,     // 5 minutes fresh
    gcTime: 60 * 60 * 1000,       // 1 hour in cache
    refetchOnMount: false,         // Don't refetch on mount
  },
})
```

### Memory-Efficient Configuration

```typescript
app.use(PiniaColada, {
  query: {
    gcTime: 2 * 60 * 1000,        // 2 minutes (shorter cache)
  },
})
```

---

## Official Documentation

- **Pinia Colada**: https://pinia-colada.esm.dev/
- **Configuration**: https://pinia-colada.esm.dev/guide/configuration.html
- **TypeScript**: https://pinia-colada.esm.dev/guide/typescript.html
- **Plugins**: https://pinia-colada.esm.dev/cookbook/plugins.html
