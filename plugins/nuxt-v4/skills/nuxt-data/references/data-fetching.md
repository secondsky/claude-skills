# Data Fetching - Complete Guide

Comprehensive guide to data fetching in Nuxt 4 with useFetch, useAsyncData, and $fetch.

## Table of Contents

- [Method Comparison](#method-comparison)
- [useFetch Deep Dive](#usefetch-deep-dive)
- [useAsyncData Deep Dive](#useasyncdata-deep-dive)
- [$fetch Patterns](#fetch-patterns)
- [Nuxt v4 Changes](#nuxt-v4-changes)
- [Error Handling](#error-handling)
- [Caching Strategies](#caching-strategies)
- [Advanced Patterns](#advanced-patterns)

## Method Comparison

| Feature | useFetch | useAsyncData | $fetch |
|---------|----------|--------------|--------|
| **SSR Support** | ✅ Yes | ✅ Yes | ❌ Client only |
| **Caching** | ✅ Automatic | ✅ Automatic | ❌ No |
| **Reactivity** | ✅ Reactive | ✅ Reactive | ❌ Not reactive |
| **Auto-refresh** | ✅ Yes | ✅ Yes | ❌ No |
| **Use Case** | Simple API calls | Custom logic | Client-side calls |
| **Key Required** | ❌ Optional | ✅ Required | N/A |

### When to Use Each

**useFetch**:
- Simple GET/POST/PUT/DELETE to APIs
- When you want automatic reactivity
- When caching is important
- SSR is needed

**useAsyncData**:
- Multiple API calls in parallel
- Custom async logic
- Complex data transformations
- Conditional data fetching

**$fetch**:
- Client-side only operations
- One-off requests
- Inside event handlers
- No caching needed

## useFetch Deep Dive

### Basic Usage

```typescript
// Simple GET request
const { data, error, pending, refresh, status } = await useFetch('/api/users')

// POST request
const { data } = await useFetch('/api/users', {
  method: 'POST',
  body: { name: 'John', email: 'john@example.com' }
})

// With TypeScript
interface User {
  id: string
  name: string
  email: string
}

const { data } = await useFetch<User[]>('/api/users')
// data is Ref<User[] | null>
```

### Reactive Parameters

**Key Feature in Nuxt v4**: Parameters are reactive by default!

```typescript
// Query params
const page = ref(1)
const limit = ref(10)

const { data } = await useFetch('/api/users', {
  query: {
    page,   // ✅ Auto-refetch when page changes
    limit   // ✅ Auto-refetch when limit changes
  }
})

// Change page → auto-refetch
page.value = 2  // Triggers new fetch

// URL params
const userId = ref('123')

const { data } = await useFetch(() => `/api/users/${userId.value}`)
// ✅ Auto-refetch when userId changes

userId.value = '456'  // Triggers new fetch
```

### Options

```typescript
const { data } = await useFetch('/api/users', {
  // HTTP method
  method: 'POST',

  // Query parameters
  query: { page: 1, limit: 10 },

  // Request body
  body: { name: 'John' },

  // Headers
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },

  // Base URL (defaults to nuxt app baseURL)
  baseURL: 'https://api.example.com',

  // Transform response (must be deterministic!)
  transform: (data) => data.map(u => ({ id: u.id, name: u.name })),

  // Pick specific fields
  pick: ['id', 'name', 'email'],

  // Watch for changes (reactive)
  watch: [page, limit],

  // Immediate fetch (default: true)
  immediate: true,

  // Lazy (don't block navigation)
  lazy: false,

  // Server-only
  server: true,

  // Client-only
  client: true,

  // Deep reactivity (default: false in v4)
  deep: false,

  // Default value
  default: () => [],

  // Retry on error
  retry: 3,
  retryDelay: 500,

  // Timeout
  timeout: 10000,

  // Credentials
  credentials: 'include',

  // Cache (uses key for caching)
  key: 'users-list',

  // Dedupe (prevent duplicate requests)
  dedupe: 'cancel'  // or 'defer'
})
```

### Return Values

```typescript
const {
  data,      // Ref<T | null> - Response data
  error,     // Ref<Error | null> - Error object
  pending,   // Ref<boolean> - Loading state
  refresh,   // () => Promise<void> - Manual refresh
  execute,   // () => Promise<void> - Execute (for lazy fetch)
  status,    // Ref<'idle' | 'pending' | 'success' | 'error'> - Request status
  clear      // () => void - Clear data and error
} = await useFetch('/api/users')
```

### Transform Function

**Important**: Must be deterministic (same input = same output)!

```typescript
// ✅ Good - deterministic
const { data } = await useFetch('/api/users', {
  transform: (users) => users.map(u => ({
    id: u.id,
    name: u.name.toUpperCase(),
    initials: u.name.split(' ').map(n => n[0]).join('')
  }))
})

// ❌ Bad - non-deterministic
const { data } = await useFetch('/api/users', {
  transform: (users) => users.sort(() => Math.random() - 0.5)
})

// ❌ Bad - side effects
const { data } = await useFetch('/api/users', {
  transform: (users) => {
    console.log('Users loaded')  // Side effect!
    return users
  }
})
```

### Lazy Fetching

```typescript
// Don't block navigation
const { data, pending, execute } = await useFetch('/api/heavy-data', {
  lazy: true
})

// Execute manually when needed
const loadData = async () => {
  await execute()
}
```

### Manual Refresh

```typescript
const { data, refresh } = await useFetch('/api/users')

// Refresh data manually
const reloadUsers = async () => {
  await refresh()
}

// In template
<button @click="refresh">Reload</button>
```

## useAsyncData Deep Dive

### Basic Usage

```typescript
// Key is required!
const { data, error, pending } = await useAsyncData(
  'users',  // Unique key
  () => $fetch('/api/users')
)

// With TypeScript
interface User {
  id: string
  name: string
}

const { data } = await useAsyncData<User[]>(
  'users',
  () => $fetch('/api/users')
)
```

### Multiple API Calls

```typescript
const { data } = await useAsyncData('dashboard', async () => {
  const [users, posts, stats] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/posts'),
    $fetch('/api/stats')
  ])

  return { users, posts, stats }
})

// Access data
data.value?.users
data.value?.posts
data.value?.stats
```

### Reactive Keys (Singleton Pattern)

**Nuxt v4 Feature**: Same key shares the same data!

```typescript
// Component A
const { data } = await useAsyncData(
  'app-config',
  () => $fetch('/api/config')
)

// Component B (gets same data!)
const { data: sameData } = await useAsyncData(
  'app-config',
  () => $fetch('/api/config')
)

// data and sameData point to the same ref!
```

### Computed Keys

```typescript
const userId = ref('123')

const { data } = await useAsyncData(
  () => `user-${userId.value}`,  // Reactive key
  () => $fetch(`/api/users/${userId.value}`)
)

// Change userId → new key → new fetch
userId.value = '456'  // Triggers new fetch with new key
```

### Options

```typescript
const { data } = await useAsyncData(
  'users',
  () => $fetch('/api/users'),
  {
    // Watch reactive dependencies
    watch: [page, limit],

    // Transform result
    transform: (data) => data.map(u => ({ id: u.id, name: u.name })),

    // Pick fields
    pick: ['id', 'name'],

    // Server-only
    server: true,

    // Lazy
    lazy: false,

    // Immediate
    immediate: true,

    // Default value
    default: () => [],

    // Deep reactivity
    deep: false,

    // Dedupe
    dedupe: 'cancel'
  }
)
```

### Custom Logic

```typescript
const { data, error } = await useAsyncData('user-posts', async () => {
  // Get user
  const user = await $fetch(`/api/users/${userId.value}`)

  // Get user's posts
  const posts = await $fetch(`/api/posts?userId=${user.id}`)

  // Get comments for each post
  const postsWithComments = await Promise.all(
    posts.map(async (post) => {
      const comments = await $fetch(`/api/comments?postId=${post.id}`)
      return { ...post, comments }
    })
  )

  return {
    user,
    posts: postsWithComments
  }
})
```

## $fetch Patterns

### Client-Side Only

```typescript
// Event handler
const handleSubmit = async () => {
  try {
    const response = await $fetch('/api/users', {
      method: 'POST',
      body: { name: 'John' }
    })

    console.log('User created:', response)
  } catch (error) {
    console.error('Failed:', error)
  }
}

// One-off request
const deleteUser = async (id: string) => {
  await $fetch(`/api/users/${id}`, { method: 'DELETE' })
}
```

### With Options

```typescript
const response = await $fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token.value}`
  },
  body: { name: 'John', email: 'john@example.com' },
  query: { include: 'profile' },
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retry: 3,
  retryDelay: 500
})
```

### Error Handling

```typescript
try {
  const user = await $fetch(`/api/users/${id}`)
} catch (error) {
  if (error.statusCode === 404) {
    console.error('User not found')
  } else if (error.statusCode === 401) {
    console.error('Unauthorized')
  } else {
    console.error('Unknown error:', error)
  }
}
```

## Nuxt v4 Changes

### Shallow Reactivity (Default)

**Breaking Change**: Default changed from `deep: true` to `deep: false`

```typescript
// Nuxt v4 - Shallow (default)
const { data } = await useFetch('/api/users')

// ✅ This works
data.value = newUsers

// ❌ This doesn't trigger reactivity
data.value[0].name = 'New Name'

// Need deep reactivity? Enable it:
const { data } = await useFetch('/api/users', {
  deep: true
})

// ✅ Now this works
data.value[0].name = 'New Name'
```

### Default Values Changed

**Breaking Change**: Default changed from `null` to `undefined`

```typescript
// Nuxt v3
const { data } = await useFetch('/api/users')
data.value  // null initially

// Nuxt v4
const { data } = await useFetch('/api/users')
data.value  // undefined initially

// Provide default value
const { data } = await useFetch('/api/users', {
  default: () => []
})
data.value  // [] initially
```

### Reactive Keys

New feature - computed/ref keys trigger refetch:

```typescript
const userId = ref('123')

// Nuxt v4 - Auto-refetch
const { data } = await useAsyncData(
  () => `user-${userId.value}`,
  () => $fetch(`/api/users/${userId.value}`)
)

userId.value = '456'  // Auto-refetch!
```

## Error Handling

### Basic Error Handling

```typescript
const { data, error, status } = await useFetch('/api/users')

if (error.value) {
  console.error('Error:', error.value.message)
  console.error('Status code:', error.value.statusCode)
  console.error('Status text:', error.value.statusMessage)
}

// Check status
if (status.value === 'error') {
  // Handle error
}
```

### Structured Error Handling

```typescript
const { data, error } = await useFetch('/api/users')

if (error.value) {
  const { statusCode, statusMessage, message } = error.value

  switch (statusCode) {
    case 400:
      showToast({ type: 'error', message: 'Invalid request' })
      break
    case 401:
      await navigateTo('/login')
      break
    case 403:
      showToast({ type: 'error', message: 'Access denied' })
      break
    case 404:
      showToast({ type: 'error', message: 'Not found' })
      break
    case 500:
      showToast({ type: 'error', message: 'Server error' })
      break
    default:
      showToast({ type: 'error', message: message || 'Unknown error' })
  }
}
```

### Retry on Error

```typescript
const { data } = await useFetch('/api/users', {
  retry: 3,          // Retry up to 3 times
  retryDelay: 500,   // Wait 500ms between retries
  onRequestError({ error }) {
    console.error('Request error:', error)
  },
  onResponseError({ response }) {
    console.error('Response error:', response.status)
  }
})
```

## Caching Strategies

### Automatic Caching

useFetch and useAsyncData cache by key:

```typescript
// First call - fetches from server
const { data } = await useFetch('/api/users', {
  key: 'users-list'
})

// Second call - uses cache
const { data: cachedData } = await useFetch('/api/users', {
  key: 'users-list'  // Same key = same cache
})
```

### Manual Cache Control

```typescript
const { data, refresh, clear } = await useFetch('/api/users')

// Refresh from server
await refresh()

// Clear cache
clear()
```

### Cache Invalidation

```typescript
const { data, refresh } = await useFetch('/api/users', {
  key: 'users-list'
})

// After creating new user
const createUser = async (user: User) => {
  await $fetch('/api/users', {
    method: 'POST',
    body: user
  })

  // Invalidate cache
  await refresh()
}
```

### Server-Side Caching with Route Rules

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/api/users': {
      swr: 3600  // Cache for 1 hour
    }
  }
})
```

## Advanced Patterns

### Infinite Scroll

```typescript
const page = ref(1)
const allUsers = ref<User[]>([])
const hasMore = ref(true)

const { data, pending, refresh } = await useFetch(() => `/api/users?page=${page.value}`)

watch(data, (newData) => {
  if (newData) {
    allUsers.value.push(...newData.items)
    hasMore.value = newData.hasNextPage
  }
})

const loadMore = async () => {
  if (hasMore.value && !pending.value) {
    page.value++
    await refresh()
  }
}
```

### Pagination

```typescript
const page = ref(1)
const limit = ref(10)

const { data: paginatedUsers } = await useFetch('/api/users', {
  query: { page, limit }
})

// Navigation
const nextPage = () => page.value++
const prevPage = () => page.value = Math.max(1, page.value - 1)
const goToPage = (p: number) => page.value = p
```

### Optimistic Updates

```typescript
const { data: users, refresh } = await useFetch<User[]>('/api/users')

const deleteUser = async (id: string) => {
  // Optimistic update
  const originalUsers = users.value
  users.value = users.value?.filter(u => u.id !== id) || []

  try {
    await $fetch(`/api/users/${id}`, { method: 'DELETE' })
  } catch (error) {
    // Rollback on error
    users.value = originalUsers
    showToast({ type: 'error', message: 'Failed to delete user' })
  }
}
```

### Dependent Queries

```typescript
const { data: user } = await useFetch(() => `/api/users/${userId.value}`)

// Only fetch posts when user is loaded
const { data: posts } = await useFetch(
  () => user.value ? `/api/posts?userId=${user.value.id}` : null
)
```

### Polling

```typescript
const { data, refresh } = await useFetch('/api/stats')

// Poll every 5 seconds
const intervalId = setInterval(refresh, 5000)

// Cleanup
onUnmounted(() => {
  clearInterval(intervalId)
})
```

### Abort Requests (v4.2)

```typescript
const controller = ref<AbortController>()

const { data } = await useAsyncData(
  'users',
  () => $fetch('/api/users', { signal: controller.value?.signal })
)

// Abort request
const abortRequest = () => {
  controller.value?.abort()
  controller.value = new AbortController()
}
```

### Parallel Requests

```typescript
const { data: dashboard } = await useAsyncData('dashboard', async () => {
  const [users, posts, comments, stats] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/posts'),
    $fetch('/api/comments'),
    $fetch('/api/stats')
  ])

  return { users, posts, comments, stats }
})
```

### Sequential Requests (When Order Matters)

```typescript
const { data } = await useAsyncData('user-flow', async () => {
  // Step 1: Get user
  const user = await $fetch(`/api/users/${userId.value}`)

  // Step 2: Get user's team (depends on user)
  const team = await $fetch(`/api/teams/${user.teamId}`)

  // Step 3: Get team members (depends on team)
  const members = await $fetch(`/api/teams/${team.id}/members`)

  return { user, team, members }
})
```

## Best Practices

1. **Use useFetch for simple API calls**, useAsyncData for complex logic
2. **Always handle errors** explicitly
3. **Provide TypeScript types** for better DX
4. **Use reactive parameters** for auto-refetch
5. **Enable deep reactivity** only when needed (performance)
6. **Use unique keys** for caching and deduplication
7. **Provide default values** to avoid undefined/null checks
8. **Transform on server** when possible (better performance)
9. **Cache aggressively** with route rules
10. **Clean up subscriptions** in onUnmounted

## Common Pitfalls

❌ **Non-deterministic transforms**
❌ **Missing error handling**
❌ **Not using TypeScript**
❌ **Forgetting to watch reactive deps**
❌ **Using $fetch in SSR** (won't work!)
❌ **Not providing default values**
❌ **Enabling deep when not needed** (performance hit)
❌ **Missing cleanup** (memory leaks)

---

**Last Updated**: 2025-12-28
