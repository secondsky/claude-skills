# Pinia Colada Common Patterns

Common patterns for queries, mutations, and advanced use cases with Pinia Colada.

---

## Pattern 1: Dependent Queries

Query that depends on result of another query:

```vue
<script setup lang="ts">
import { useQuery } from '@pinia/colada'
import { computed } from 'vue'

// First query
const { data: user } = useQuery({
  key: ['user', 'current'],
  query: fetchCurrentUser,
})

// Second query depends on first
const userId = computed(() => user.value?.id)

const { data: posts } = useQuery({
  key: () => ['posts', userId.value],
  query: () => fetchUserPosts(userId.value!),
  enabled: () => !!userId.value, // Only run when userId exists
})
</script>
```

**When to use**: Multi-step data fetching (user → user's posts)

---

## Pattern 2: Parallel Queries

Multiple independent queries:

```vue
<script setup lang="ts">
const { data: todos } = useQuery({
  key: ['todos'],
  query: fetchTodos,
})

const { data: users } = useQuery({
  key: ['users'],
  query: fetchUsers,
})

const { data: tags } = useQuery({
  key: ['tags'],
  query: fetchTags,
})

// All queries run in parallel
</script>
```

**When to use**: Dashboard pages with multiple data sources

---

## Pattern 3: Conditional Queries

Query that only runs under certain conditions:

```typescript
const showCompleted = ref(false)

const { data: todos } = useQuery({
  key: () => ['todos', { completed: showCompleted.value }],
  query: () => fetchTodos({ completed: showCompleted.value }),
  enabled: () => showCompleted.value, // Only fetch when true
})
```

**When to use**: Lazy-loaded sections, toggleable features

---

## Pattern 4: Background Sync Pattern

Keep data fresh with periodic refetch:

```typescript
const { data: notifications } = useQuery({
  key: ['notifications'],
  query: fetchNotifications,
  staleTime: 30000,           // Fresh for 30s
  refetchInterval: 60000,     // Refetch every 60s
  refetchIntervalInBackground: true, // Even when tab not focused
})
```

**When to use**: Real-time-ish data (notifications, live stats)

---

## Pattern 5: Prefetching on Hover

Prefetch data before navigation:

```vue
<script setup lang="ts">
import { useQueryCache } from '@pinia/colada'

const cache = useQueryCache()

function prefetchTodo(id: number) {
  cache.prefetchQuery({
    key: ['todos', id],
    query: () => fetchTodo(id),
  })
}
</script>

<template>
  <router-link
    :to="`/todos/${todo.id}`"
    @mouseenter="prefetchTodo(todo.id)"
  >
    {{ todo.title }}
  </router-link>
</template>
```

**When to use**: Instant navigation UX

---

## Pattern 6: Mutation with Multiple Invalidations

Invalidate multiple query families:

```typescript
const { mutate } = useMutation({
  mutation: updateUser,
  async onSettled({ id }) {
    // Invalidate multiple related queries
    await Promise.all([
      cache.invalidateQueries({ key: ['user', id] }),
      cache.invalidateQueries({ key: ['users'] }),
      cache.invalidateQueries({ key: ['posts', 'by-user', id] }),
    ])
  },
})
```

**When to use**: Mutations affecting multiple data relationships

---

## Pattern 7: Infinite Queries (Manual Implementation)

Load more pattern for infinite scroll:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@pinia/colada'

const pages = ref<Todo[][]>([])
const currentPage = ref(1)

const { data, isPending, isLoading } = useQuery({
  key: () => ['todos', 'infinite', currentPage.value],
  query: async () => {
    const response = await fetch(`/api/todos?page=${currentPage.value}`)
    return response.json()
  },
})

// Append new page to pages array
watch(data, (newData) => {
  if (newData) {
    pages.value[currentPage.value - 1] = newData
  }
})

const allTodos = computed(() => pages.value.flat())

function loadMore() {
  currentPage.value++
}
</script>

<template>
  <div>
    <ul>
      <li v-for="todo in allTodos" :key="todo.id">
        {{ todo.title }}
      </li>
    </ul>
    <button @click="loadMore" :disabled="isLoading">
      Load More
    </button>
  </div>
</template>
```

**When to use**: Infinite scroll, "load more" pagination

---

## Pattern 8: Optimistic Deletion

Delete with optimistic update and rollback:

```typescript
export function useDeleteTodo() {
  const cache = useQueryCache()

  return useMutation({
    mutation: async (todoId: number) => {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Delete failed')
    },

    onMutate(todoId: number) {
      cache.cancelQueries({ key: ['todos'] })

      const previousTodos = cache.getQueryData<Todo[]>(['todos'])

      // Optimistically remove from UI
      if (previousTodos) {
        cache.setQueryData(
          ['todos'],
          previousTodos.filter(todo => todo.id !== todoId)
        )
      }

      return { previousTodos }
    },

    onError(error, todoId, context) {
      // Rollback on error
      if (context?.previousTodos) {
        cache.setQueryData(['todos'], context.previousTodos)
      }
    },

    async onSettled() {
      await cache.invalidateQueries({ key: ['todos'] })
    },
  })
}
```

**When to use**: Instant feedback for deletions

---

## Pattern 9: Query with Retry Logic

Custom retry strategy:

```typescript
const { data } = useQuery({
  key: ['todos'],
  query: fetchTodos,
  retry: (failureCount, error) => {
    // Don't retry on 404
    if (error.status === 404) return false

    // Retry up to 3 times for other errors
    return failureCount < 3
  },
  retryDelay: (attemptIndex) => {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    return Math.min(1000 * 2 ** attemptIndex, 30000)
  },
})
```

**When to use**: Network-sensitive operations, temporary failures

---

## Pattern 10: Query with Polling

Auto-refetch on interval:

```typescript
const isPolling = ref(true)

const { data } = useQuery({
  key: ['status'],
  query: fetchStatus,
  refetchInterval: () => (isPolling.value ? 5000 : false),
  refetchIntervalInBackground: false,
})

// Control polling
function startPolling() {
  isPolling.value = true
}

function stopPolling() {
  isPolling.value = false
}
```

**When to use**: Status monitoring, progress tracking

---

## Pattern 11: Query Cache Seeding

Pre-populate cache from another query:

```typescript
// List query
const { data: todos } = useQuery({
  key: ['todos'],
  query: fetchTodos,
})

// Individual query - seed from list
const cache = useQueryCache()
watch(todos, (allTodos) => {
  if (allTodos) {
    // Seed individual todo queries
    allTodos.forEach(todo => {
      cache.setQueryData(['todos', todo.id], todo)
    })
  }
})
```

**When to use**: List → detail navigation optimization

---

## Pattern 12: Manual Query Triggering

Query that only runs when explicitly called:

```typescript
const { data, refetch, isLoading } = useQuery({
  key: ['search', searchTerm.value],
  query: () => searchTodos(searchTerm.value),
  enabled: false, // Don't run automatically
})

async function handleSearch() {
  await refetch()
}
```

**When to use**: Search forms, manual data refresh

---

## Official Documentation

- **Pinia Colada**: https://pinia-colada.esm.dev/
- **Cookbook**: https://pinia-colada.esm.dev/cookbook/
- **GitHub Examples**: https://github.com/posva/pinia-colada/tree/main/examples
