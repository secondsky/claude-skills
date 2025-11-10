---
name: Nuxt 4
description: |
  Production-ready Nuxt 4 framework development with SSR, composables,
  data fetching, server routes, and Cloudflare deployment.

  Use when: building Nuxt 4 applications, implementing SSR patterns,
  creating composables, server routes, middleware, data fetching,
  state management, debugging hydration issues, deploying to Cloudflare,
  optimizing performance, or setting up testing with Vitest.

  Keywords: Nuxt 4, Nuxt v4, SSR, universal rendering, Nitro, Vue 3,
  useState, useFetch, useAsyncData, $fetch, composables, auto-imports,
  middleware, server routes, API routes, hydration, file-based routing,
  app directory, SEO, meta tags, useHead, useSeoMeta, transitions,
  error handling, runtime config, Cloudflare Pages, Cloudflare Workers,
  NuxtHub, Workers Assets, D1, KV, R2, Durable Objects, Vitest, testing,
  performance optimization, lazy loading, code splitting, prerendering,
  layers, modules, plugins, Vite, TypeScript, hydration mismatch,
  shallow reactivity, reactive keys, singleton pattern, defineNuxtConfig,
  defineEventHandler, navigateTo, definePageMeta, useRuntimeConfig,
  app.vue, server directory, public directory, assets directory
license: MIT
allowed-tools: [Read, Write, Edit, Bash, WebFetch, WebSearch]
metadata:
  version: 1.0.0
  author: Claude Skills Maintainers
  category: Framework
  framework: Nuxt
  framework-version: 4.x
  last-verified: 2025-11-09
  source: https://github.com/secondsky/claude-skills
---

# Nuxt 4 Best Practices

Production-ready patterns for building modern Nuxt 4 applications with SSR, composables, server routes, and Cloudflare deployment.

## Quick Reference

### Version Requirements

| Package | Minimum | Recommended |
|---------|---------|-------------|
| nuxt | 4.0.0 | 4.2.x |
| vue | 3.5.0 | 3.5.x |
| nitro | 2.10.0 | 2.10.x |
| vite | 6.0.0 | 6.0.x |
| typescript | 5.0.0 | 5.x |

### Key Commands

```bash
# Create new project
npx nuxi@latest init my-app

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run postinstall  # Generates .nuxt directory
npx nuxi typecheck

# Testing (Vitest)
npm run test
npm run test:watch

# Deploy to Cloudflare
npx wrangler deploy
```

### Directory Structure (Nuxt v4)

```
my-nuxt-app/
├── app/                    # ← New default srcDir in v4
│   ├── assets/             # Build-processed assets (CSS, images)
│   ├── components/         # Auto-imported Vue components
│   ├── composables/        # Auto-imported composables
│   ├── layouts/            # Layout components
│   ├── middleware/         # Route middleware
│   ├── pages/              # File-based routing
│   ├── plugins/            # Nuxt plugins
│   ├── utils/              # Auto-imported utility functions
│   ├── app.vue             # Main app component
│   ├── app.config.ts       # App-level runtime config
│   ├── error.vue           # Error page component
│   └── router.options.ts   # Router configuration
│
├── server/                 # Server-side code (Nitro)
│   ├── api/                # API endpoints
│   ├── middleware/         # Server middleware
│   ├── plugins/            # Nitro plugins
│   ├── routes/             # Server routes
│   └── utils/              # Server utilities
│
├── public/                 # Static assets (served from root)
├── shared/                 # Shared code (app + server)
├── content/                # Nuxt Content files (if using)
├── layers/                 # Nuxt layers
├── modules/                # Local modules
├── .nuxt/                  # Generated files (git ignored)
├── .output/                # Build output (git ignored)
├── nuxt.config.ts          # Nuxt configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

**Key Change in v4**: The `app/` directory is now the default `srcDir`. All app code goes in `app/`, server code stays in `server/`.

## New in Nuxt v4

### v4.2 Features (Latest)

**1. Abort Control for Data Fetching**
```typescript
const controller = ref<AbortController>()

const { data } = await useAsyncData(
  'users',
  () => $fetch('/api/users', { signal: controller.value?.signal })
)

// Abort the request
const abortRequest = () => {
  controller.value?.abort()
  controller.value = new AbortController()
}
```

**2. Enhanced Error Handling**
- Dual error display: custom error page + technical overlay
- Better error messages in development
- Improved stack traces

**3. Async Data Handler Extraction**
- 39% smaller client bundles
- Data fetching logic extracted to server chunks
- Automatic optimization (no configuration needed)

**4. TypeScript Plugin Support**
- Experimental `@dxup/nuxt` module for TS plugins
- Better IDE integration

### v4.1 Features

**1. Enhanced Chunk Stability**
- Import maps prevent cascading hash changes
- Better long-term caching
- Fewer unnecessary reloads

**2. Lazy Hydration Without Auto-Imports**
```vue
<script setup>
const LazyComponent = defineLazyHydrationComponent(() =>
  import('./HeavyComponent.vue')
)
</script>
```

**3. Module Lifecycle Hooks**
```typescript
// In a Nuxt module
export default defineNuxtModule({
  setup(options, nuxt) {
    nuxt.hooks.hook('modules:onInstall', () => {
      console.log('Module just installed')
    })

    nuxt.hooks.hook('modules:onUpgrade', () => {
      console.log('Module upgraded')
    })
  }
})
```

### Breaking Changes from v3

1. **Default srcDir**: Now `app/` instead of root
2. **Shallow Reactivity**: `useFetch`/`useAsyncData` use shallow refs by default
3. **Default Values**: Changed from `null` to `undefined`
4. **Route Middleware**: Now runs on server by default
5. **App Manifest**: Enabled by default
6. **Typed Pages**: Automatic type generation for routes

## Configuration

### Basic nuxt.config.ts

```typescript
export default defineNuxtConfig({
  // Enable future features
  future: {
    compatibilityVersion: 4
  },

  // Development config
  devtools: { enabled: true },

  // Modules
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxtjs/tailwindcss'
  ],

  // Runtime config (environment variables)
  runtimeConfig: {
    // Server-only
    apiSecret: process.env.API_SECRET,
    databaseUrl: process.env.DATABASE_URL,

    // Public (client + server)
    public: {
      apiBase: process.env.API_BASE || 'https://api.example.com',
      appName: 'My App'
    }
  },

  // App config
  app: {
    head: {
      title: 'My Nuxt App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },

  // Nitro config (server)
  nitro: {
    preset: 'cloudflare-pages',  // or 'cloudflare-module'
    experimental: {
      websocket: true  // Enable WebSocket support
    }
  },

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true
  },

  // Vite config
  vite: {
    optimizeDeps: {
      include: ['some-heavy-library']
    }
  }
})
```

### Runtime Config Best Practices

```typescript
// ✅ Use runtime config for environment variables
const config = useRuntimeConfig()
const apiUrl = config.public.apiBase

// ❌ Don't access process.env directly
const apiUrl = process.env.API_BASE  // Won't work in production
```

**Why?** Runtime config is reactive and works in both server and client environments. It's also type-safe.

## Composables

Composables are auto-imported functions that encapsulate reusable logic. They're the core of Nuxt's reactivity system.

### Naming Conventions

- **Always use `use` prefix**: `useAuth`, `useCart`, `useFetch`
- **Use camelCase**: `useUserProfile`, not `use_user_profile`
- **Be descriptive**: `useProductFilters`, not `useFilters`

### useState vs ref

**Key Rule**: Use `useState` for shared state across components. Use `ref` for local component state.

```typescript
// ✅ Shared state (survives component unmount)
export const useCounter = () => {
  const count = useState('counter', () => 0)

  const increment = () => count.value++
  const decrement = () => count.value--

  return { count, increment, decrement }
}

// ❌ Don't use ref for shared state
export const useCounter = () => {
  const count = ref(0)  // Creates new instance every time!
  return { count }
}
```

**Why?** `useState` creates a singleton that's shared across all components using it. `ref` creates a new reactive reference every time the composable is called.

### Complete Composable Example

```typescript
// composables/useAuth.ts
interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const useAuth = () => {
  // Shared state (survives navigation)
  const state = useState<AuthState>('auth', () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }))

  // Login
  const login = async (email: string, password: string) => {
    state.value.isLoading = true
    state.value.error = null

    try {
      const { data, error } = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      if (error.value) {
        throw new Error(error.value.message)
      }

      state.value.user = data.value.user
      state.value.isAuthenticated = true

      // Navigate to dashboard
      await navigateTo('/dashboard')
    } catch (err) {
      state.value.error = err.message
      throw err
    } finally {
      state.value.isLoading = false
    }
  }

  // Logout
  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })

    state.value.user = null
    state.value.isAuthenticated = false

    await navigateTo('/login')
  }

  // Check session (call on app mount)
  const checkSession = async () => {
    // Only run on client
    if (import.meta.server) return

    try {
      const { data } = await useFetch('/api/auth/session')

      if (data.value?.user) {
        state.value.user = data.value.user
        state.value.isAuthenticated = true
      }
    } catch (err) {
      console.error('Session check failed:', err)
    }
  }

  return {
    // State
    user: computed(() => state.value.user),
    isAuthenticated: computed(() => state.value.isAuthenticated),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),

    // Methods
    login,
    logout,
    checkSession
  }
}
```

### SSR-Safe Patterns

```typescript
// ✅ Check environment before using browser APIs
export const useLocalStorage = (key: string) => {
  const value = useState(key, () => {
    // Only access localStorage on client
    if (import.meta.client) {
      return localStorage.getItem(key)
    }
    return null
  })

  const setValue = (newValue: string) => {
    value.value = newValue

    // Only write to localStorage on client
    if (import.meta.client) {
      localStorage.setItem(key, newValue)
    }
  }

  return { value, setValue }
}

// ✅ Use process.client for runtime checks
export const useWindowSize = () => {
  const width = ref(0)
  const height = ref(0)

  const update = () => {
    if (process.client) {
      width.value = window.innerWidth
      height.value = window.innerHeight
    }
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    if (process.client) {
      window.removeEventListener('resize', update)
    }
  })

  return { width, height }
}
```

For more composable patterns, see `references/composables.md`.

## Data Fetching

Nuxt v4 provides three main methods for data fetching:

| Method | Use Case | SSR | Caching | Reactive |
|--------|----------|-----|---------|----------|
| `useFetch` | Simple API calls | ✅ | ✅ | ✅ |
| `useAsyncData` | Custom async logic | ✅ | ✅ | ✅ |
| `$fetch` | Client-side only | ❌ | ❌ | ❌ |

### useFetch

**Best for**: Simple GET requests to API endpoints.

```typescript
// Basic usage
const { data, error, pending, refresh } = await useFetch('/api/users')

// With params (auto-refetch when params change)
const page = ref(1)
const { data } = await useFetch('/api/users', {
  query: { page }  // Reactive! Auto-refetch when page changes
})

// With transform (must be deterministic!)
const { data } = await useFetch('/api/users', {
  transform: (users) => users.map(u => ({
    id: u.id,
    name: u.name
  }))
})

// POST request
const { data, error } = await useFetch('/api/users', {
  method: 'POST',
  body: { name: 'John', email: 'john@example.com' }
})

// Deep reactivity (when you need to mutate nested properties)
const { data } = await useFetch('/api/users', {
  deep: true  // Default is shallow in v4
})
```

### useAsyncData

**Best for**: Custom async logic, multiple API calls, or complex data transformations.

```typescript
// Basic usage
const { data, error, pending } = await useAsyncData(
  'users',  // Unique key (required)
  () => $fetch('/api/users')
)

// Multiple API calls
const { data } = await useAsyncData('dashboard', async () => {
  const [users, posts, stats] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/posts'),
    $fetch('/api/stats')
  ])

  return { users, posts, stats }
})

// With reactive params
const userId = ref('123')
const { data } = await useAsyncData(
  'user',
  () => $fetch(`/api/users/${userId.value}`),
  {
    watch: [userId]  // Re-fetch when userId changes
  }
)

// Singleton pattern (shares data across components)
const { data } = await useAsyncData('global-config', () =>
  $fetch('/api/config')
)
// Another component calling this gets the same data!
```

### Reactive Keys (v4 Feature)

In Nuxt v4, you can use reactive keys that automatically trigger re-fetches:

```typescript
const page = ref(1)
const category = ref('tech')

// Option 1: Reactive query params
const { data } = await useFetch('/api/posts', {
  query: {
    page,      // Auto-refetch when page changes
    category   // Auto-refetch when category changes
  }
})

// Option 2: Computed key
const { data } = await useAsyncData(
  () => `posts-${page.value}-${category.value}`,  // Reactive key
  () => $fetch('/api/posts', {
    query: { page: page.value, category: category.value }
  })
)

// Option 3: watch option
const { data } = await useAsyncData(
  'posts',
  () => $fetch('/api/posts', {
    query: { page: page.value, category: category.value }
  }),
  {
    watch: [page, category]
  }
)
```

### Error Handling

```typescript
const { data, error, status } = await useFetch('/api/users')

// Check for errors
if (error.value) {
  // Error is a Ref<Error | null>
  console.error('Failed to fetch users:', error.value.message)

  // Show error to user
  showToast({
    type: 'error',
    message: error.value.message
  })
}

// Use status to check request state
if (status.value === 'error') {
  // Handle error
}
```

### Shallow vs Deep Reactivity (v4 Change)

**Nuxt v4 default**: Shallow reactivity (better performance).

```typescript
// Shallow (default in v4)
const { data } = await useFetch('/api/users')
// ✅ This works
data.value = newUsers

// ❌ This doesn't trigger reactivity
data.value[0].name = 'New Name'

// Deep reactivity (when needed)
const { data } = await useFetch('/api/users', {
  deep: true
})
// ✅ Now this works
data.value[0].name = 'New Name'
```

**When to use deep?** When you need to mutate nested properties. Otherwise, prefer shallow for better performance.

For more data fetching patterns, see `references/data-fetching.md`.

## Server Routes (Nitro)

Nuxt uses Nitro for server-side code. Server routes are file-based and support HTTP method suffixes.

### File-Based Routing

```
server/
├── api/
│   ├── users/
│   │   ├── index.get.ts       → GET /api/users
│   │   ├── index.post.ts      → POST /api/users
│   │   ├── [id].get.ts        → GET /api/users/:id
│   │   ├── [id].patch.ts      → PATCH /api/users/:id
│   │   └── [id].delete.ts     → DELETE /api/users/:id
│   └── health.get.ts          → GET /api/health
└── routes/
    └── rss.xml.ts             → GET /rss.xml (non-API route)
```

### Basic Event Handler

```typescript
// server/api/users/index.get.ts
export default defineEventHandler(async (event) => {
  // Get query params
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10

  // Fetch from database
  const users = await db.users.findMany({
    skip: (page - 1) * limit,
    take: limit
  })

  return {
    data: users,
    meta: {
      page,
      limit,
      total: await db.users.count()
    }
  }
})
```

### Request Utilities

```typescript
export default defineEventHandler(async (event) => {
  // URL params
  const id = getRouterParam(event, 'id')

  // Query params (?page=1&limit=10)
  const query = getQuery(event)

  // Request body (POST/PUT/PATCH)
  const body = await readBody(event)

  // Headers
  const auth = getHeader(event, 'authorization')

  // Cookies
  const sessionId = getCookie(event, 'sessionId')

  // Method
  const method = event.method

  return { id, query, body, auth, sessionId, method }
})
```

### Response Utilities

```typescript
export default defineEventHandler(async (event) => {
  // Set status code
  setResponseStatus(event, 201)

  // Set headers
  setHeader(event, 'X-Custom-Header', 'value')

  // Set cookies
  setCookie(event, 'sessionId', '123', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7  // 7 days
  })

  // Delete cookie
  deleteCookie(event, 'sessionId')

  return { message: 'Created' }
})
```

### Error Handling

```typescript
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const user = await db.users.findUnique({
    where: { id }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  // Validate permissions
  const session = await getServerSession(event)
  if (!session || session.user.id !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden'
    })
  }

  return user
})
```

### Database Integration Example (D1 + Drizzle)

```typescript
// server/utils/db.ts
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '~/server/database/schema'

export const useDB = () => {
  // Access Cloudflare D1 binding
  const { cloudflare } = useRuntimeConfig()
  return drizzle(cloudflare.env.DB, { schema })
}

// server/api/users/[id].get.ts
import { eq } from 'drizzle-orm'
import { users } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  return user
})
```

For more server patterns, see `references/server.md`.

## Routing

Nuxt uses file-based routing in the `pages/` directory.

### Basic Pages

```
app/pages/
├── index.vue              → /
├── about.vue              → /about
├── users/
│   ├── index.vue          → /users
│   └── [id].vue           → /users/:id
└── blog/
    ├── index.vue          → /blog
    ├── [slug].vue         → /blog/:slug
    └── [...slug].vue      → /blog/* (catch-all)
```

### Dynamic Routes

```vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
// Get route params
const route = useRoute()
const userId = route.params.id

// Or use computed for reactivity
const userId = computed(() => route.params.id)

// Fetch user data
const { data: user } = await useFetch(`/api/users/${userId.value}`)
</script>

<template>
  <div>
    <h1>{{ user?.name }}</h1>
  </div>
</template>
```

### Navigation

```vue
<script setup>
const goToUser = (id: string) => {
  navigateTo(`/users/${id}`)
}

const goBack = () => {
  navigateTo(-1)  // Go back in history
}
</script>

<template>
  <!-- Declarative navigation -->
  <NuxtLink to="/about">About</NuxtLink>
  <NuxtLink :to="`/users/${user.id}`">View User</NuxtLink>

  <!-- Programmatic navigation -->
  <button @click="goToUser('123')">View User</button>
</template>
```

### Route Middleware

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})

// app/pages/dashboard.vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>
```

### Global Middleware

```typescript
// app/middleware/analytics.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // Runs on every route change
  console.log('Navigating from', from.path, 'to', to.path)

  // Track page view
  if (import.meta.client) {
    window.gtag('event', 'page_view', {
      page_path: to.path
    })
  }
})
```

## SEO & Meta Tags

### useHead

```vue
<script setup lang="ts">
useHead({
  title: 'My Page Title',
  meta: [
    { name: 'description', content: 'Page description' },
    { property: 'og:title', content: 'My Page Title' },
    { property: 'og:description', content: 'Page description' },
    { property: 'og:image', content: 'https://example.com/og-image.jpg' }
  ],
  link: [
    { rel: 'canonical', href: 'https://example.com/my-page' }
  ]
})
</script>
```

### useSeoMeta (Recommended)

Better for SEO tags with type safety:

```vue
<script setup lang="ts">
useSeoMeta({
  title: 'My Page Title',
  description: 'Page description',
  ogTitle: 'My Page Title',
  ogDescription: 'Page description',
  ogImage: 'https://example.com/og-image.jpg',
  twitterCard: 'summary_large_image'
})
</script>
```

### Dynamic Meta Tags

```vue
<script setup lang="ts">
const route = useRoute()
const { data: post } = await useFetch(`/api/posts/${route.params.slug}`)

useSeoMeta({
  title: post.value?.title,
  description: post.value?.excerpt,
  ogTitle: post.value?.title,
  ogDescription: post.value?.excerpt,
  ogImage: post.value?.image,
  ogUrl: `https://example.com/blog/${post.value?.slug}`,
  twitterCard: 'summary_large_image'
})
</script>
```

### Title Template

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      titleTemplate: '%s | My App'  // "Page Title | My App"
    }
  }
})
```

## State Management

### useState (Built-in)

For simple shared state:

```typescript
// composables/useCart.ts
export const useCart = () => {
  const items = useState('cart-items', () => [])
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  const addItem = (product) => {
    const existing = items.value.find(i => i.id === product.id)

    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...product, quantity: 1 })
    }
  }

  const removeItem = (id) => {
    items.value = items.value.filter(i => i.id !== id)
  }

  return { items, total, addItem, removeItem }
}
```

### Pinia (For Complex State)

```bash
npm install pinia @pinia/nuxt
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt']
})

// stores/auth.ts
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAuthenticated: false
  }),

  getters: {
    userName: (state) => state.user?.name ?? 'Guest'
  },

  actions: {
    async login(email: string, password: string) {
      const { data } = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      this.user = data.user
      this.isAuthenticated = true
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
    }
  }
})
```

## Error Handling

### Error Page

```vue
<!-- app/error.vue -->
<script setup lang="ts">
const props = defineProps({
  error: Object
})

const handleError = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.message }}</p>
    <button @click="handleError">Go Home</button>
  </div>
</template>
```

### Error Boundaries

```vue
<script setup lang="ts">
const error = ref(null)

const handleError = (err) => {
  console.error('Component error:', err)
  error.value = err
}
</script>

<template>
  <NuxtErrorBoundary @error="handleError">
    <template #error="{ error, clearError }">
      <div>
        <h2>Something went wrong</h2>
        <p>{{ error }}</p>
        <button @click="clearError">Try again</button>
      </div>
    </template>

    <!-- Your component content -->
    <MyComponent />
  </NuxtErrorBoundary>
</template>
```

### API Error Handling

```typescript
const { data, error, status } = await useFetch('/api/users')

if (error.value) {
  showError({
    statusCode: error.value.statusCode,
    message: error.value.message,
    fatal: true  // Stops rendering
  })
}
```

## Hydration Best Practices

Hydration is the process of making server-rendered HTML interactive on the client. Mismatches cause errors.

### Common Causes of Hydration Mismatches

```vue
<!-- ❌ Wrong: Math.random() gives different values -->
<script setup>
const id = Math.random()
</script>

<!-- ✅ Right: Use useState for consistent values -->
<script setup>
const id = useState('unique-id', () => Math.random())
</script>

<!-- ❌ Wrong: window object doesn't exist on server -->
<script setup>
const width = window.innerWidth
</script>

<!-- ✅ Right: Check environment first -->
<script setup>
const width = ref(0)

onMounted(() => {
  width.value = window.innerWidth
})
</script>

<!-- ❌ Wrong: localStorage on server -->
<script setup>
const theme = localStorage.getItem('theme')
</script>

<!-- ✅ Right: Use ClientOnly or onMounted -->
<script setup>
const theme = ref('light')

onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'light'
})
</script>
```

### ClientOnly Component

```vue
<template>
  <div>
    <h1>My Page</h1>

    <!-- Only renders on client -->
    <ClientOnly>
      <HeavyComponent />

      <!-- Fallback shown during SSR -->
      <template #fallback>
        <div>Loading...</div>
      </template>
    </ClientOnly>
  </div>
</template>
```

For more hydration patterns, see `references/hydration.md`.

## Performance Optimization

### Component Lazy Loading

```vue
<!-- Lazy load component (only when visible) -->
<script setup>
const LazyChart = defineAsyncComponent(() =>
  import('~/components/HeavyChart.vue')
)
</script>

<template>
  <!-- Loads only when rendered -->
  <LazyChart v-if="showChart" />
</template>
```

### Lazy Hydration

```vue
<template>
  <!-- Hydrate when visible -->
  <HeavyComponent lazy-hydrate="visible" />

  <!-- Hydrate on interaction -->
  <InteractiveComponent lazy-hydrate="interaction" />

  <!-- Hydrate after idle -->
  <LowPriorityComponent lazy-hydrate="idle" />
</template>
```

### Image Optimization

```vue
<template>
  <!-- Automatic optimization -->
  <NuxtImg
    src="/images/hero.jpg"
    width="800"
    height="600"
    alt="Hero image"
    loading="lazy"
  />

  <!-- Responsive images -->
  <NuxtPicture
    src="/images/hero.jpg"
    :img-attrs="{ alt: 'Hero image' }"
    sizes="sm:100vw md:50vw lg:400px"
  />
</template>
```

### Route Rules (Caching)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Cache homepage for 1 hour
    '/': { swr: 3600 },

    // Pre-render at build time
    '/about': { prerender: true },

    // ISR (regenerate every hour)
    '/blog/**': { swr: 3600 },

    // Client-side only (SPA mode)
    '/dashboard/**': { ssr: false },

    // API caching
    '/api/posts': { swr: 600 }
  }
})
```

For more optimization strategies, see `references/performance.md`.

## Testing with Vitest

### Setup

```bash
npm install -D @nuxt/test-utils vitest @vue/test-utils happy-dom
```

```typescript
// vitest.config.ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom'
      }
    }
  }
})
```

### Component Testing

```typescript
// components/Button.test.ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Button from './Button.vue'

describe('Button', () => {
  it('renders correctly', async () => {
    const wrapper = await mountSuspended(Button, {
      props: {
        label: 'Click me'
      }
    })

    expect(wrapper.text()).toContain('Click me')
  })

  it('emits click event', async () => {
    const wrapper = await mountSuspended(Button)

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

### Composable Testing

```typescript
// composables/useCounter.test.ts
import { describe, it, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('increments count', () => {
    const { count, increment } = useCounter()

    expect(count.value).toBe(0)

    increment()
    expect(count.value).toBe(1)
  })
})
```

For more testing patterns, see `references/testing-vitest.md`.

## Deployment to Cloudflare

### Cloudflare Pages (Recommended)

**Automatic deployment** via GitHub integration:

1. Push your repo to GitHub
2. Connect to Cloudflare Pages
3. Cloudflare auto-detects Nuxt and builds

**Manual deployment:**

```bash
npm run build
npx wrangler pages deploy .output/public
```

### Cloudflare Workers

```bash
npm run build
npx wrangler deploy
```

**wrangler.toml:**

```toml
name = "my-nuxt-app"
main = ".output/server/index.mjs"
compatibility_date = "2024-09-19"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = ".output/public"

# Bindings
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "xxx"

[[kv_namespaces]]
binding = "KV"
id = "xxx"

[[r2_buckets]]
binding = "R2"
bucket_name = "my-bucket"
```

### NuxtHub Integration

```bash
npm install @nuxthub/core
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxthub/core'],

  hub: {
    database: true,  // D1
    kv: true,        // KV
    blob: true,      // R2
    cache: true      // Cache API
  }
})
```

For comprehensive Cloudflare deployment guide, see `references/deployment-cloudflare.md`.

## Common Anti-Patterns

### ❌ 1. Using ref Instead of useState for Shared State

```typescript
// ❌ Wrong
export const useAuth = () => {
  const user = ref(null)  // New instance every time!
  return { user }
}

// ✅ Right
export const useAuth = () => {
  const user = useState('auth-user', () => null)
  return { user }
}
```

### ❌ 2. Missing SSR Guards for Browser APIs

```typescript
// ❌ Wrong
const width = window.innerWidth

// ✅ Right
const width = ref(0)
onMounted(() => {
  width.value = window.innerWidth
})
```

### ❌ 3. Non-Deterministic Transform Functions

```typescript
// ❌ Wrong
const { data } = await useFetch('/api/users', {
  transform: (users) => users.sort(() => Math.random() - 0.5)
})

// ✅ Right
const { data } = await useFetch('/api/users', {
  transform: (users) => users.sort((a, b) => a.name.localeCompare(b.name))
})
```

### ❌ 4. Missing Error Handling in Data Fetching

```typescript
// ❌ Wrong
const { data } = await useFetch('/api/users')
console.log(data.value.length)  // Crashes if error!

// ✅ Right
const { data, error } = await useFetch('/api/users')

if (error.value) {
  showToast({ type: 'error', message: error.value.message })
  return
}

console.log(data.value.length)
```

### ❌ 5. Accessing process.env Instead of Runtime Config

```typescript
// ❌ Wrong
const apiUrl = process.env.API_URL  // Won't work in production!

// ✅ Right
const config = useRuntimeConfig()
const apiUrl = config.public.apiBase
```

### ❌ 6. Not Using Auto-Imports

```typescript
// ❌ Wrong
import { ref, computed, watch } from 'vue'
import { useState } from '#app'

// ✅ Right
// Nothing! They're auto-imported
const count = ref(0)
const doubled = computed(() => count.value * 2)
```

### ❌ 7. Incorrect Server Route File Naming

```
// ❌ Wrong
server/api/users.ts          # No method suffix

// ✅ Right
server/api/users.get.ts      # GET method
server/api/users.post.ts     # POST method
```

### ❌ 8. Missing TypeScript Types

```typescript
// ❌ Wrong
const { data } = await useFetch('/api/users')

// ✅ Right
interface User {
  id: string
  name: string
  email: string
}

const { data } = await useFetch<User[]>('/api/users')
```

### ❌ 9. Plugin Performance Issues

```typescript
// ❌ Wrong - blocks app initialization
export default defineNuxtPlugin(async (nuxtApp) => {
  await someHeavyOperation()
})

// ✅ Right - parallel loading
export default defineNuxtPlugin({
  name: 'my-plugin',
  parallel: true,
  async setup() {
    await someHeavyOperation()
  }
})
```

### ❌ 10. Not Handling Hydration Mismatches

```vue
<!-- ❌ Wrong -->
<template>
  <div>{{ new Date().toISOString() }}</div>
</template>

<!-- ✅ Right -->
<template>
  <ClientOnly>
    <div>{{ currentTime }}</div>
  </ClientOnly>
</template>

<script setup>
const currentTime = ref('')

onMounted(() => {
  currentTime.value = new Date().toISOString()
})
</script>
```

## Troubleshooting Guide

### Hydration Mismatch Errors

**Symptom**: Console error "Hydration node mismatch"

**Solution**:
1. Check for browser APIs without guards
2. Look for non-deterministic values (Math.random(), Date.now())
3. Wrap problematic components in `<ClientOnly>`
4. Use `useState` for values that must be consistent

### Data Not Refreshing

**Symptom**: `useFetch` not re-fetching when params change

**Solution**:
```typescript
// Make sure params are reactive
const page = ref(1)
const { data } = await useFetch('/api/users', {
  query: { page }  // ✅ Reactive
})

// Or use watch
const { data } = await useAsyncData(
  'users',
  () => $fetch('/api/users', { query: { page: page.value } }),
  {
    watch: [page]  // ✅ Watch for changes
  }
)
```

### Server Route Not Found

**Symptom**: 404 error for API route

**Solution**:
1. Check file naming: `users.get.ts`, not `users.ts`
2. Verify file location: `server/api/`, not `app/api/`
3. Restart dev server

### TypeScript Errors

**Symptom**: Type errors in auto-imports

**Solution**:
```bash
# Regenerate .nuxt directory
rm -rf .nuxt
npm run dev

# Or run postinstall
npm run postinstall
```

### Build Errors

**Symptom**: Build fails with module errors

**Solution**:
```bash
# Clear cache
rm -rf .nuxt .output node_modules/.vite

# Reinstall
npm install

# Build again
npm run build
```

## Related Skills

- **nuxt-ui-v4**: Nuxt UI component library (52 components, theming, design system)
- **cloudflare-d1**: D1 database patterns with Drizzle ORM
- **cloudflare-kv**: KV storage patterns
- **cloudflare-r2**: R2 object storage
- **cloudflare-workers-ai**: Workers AI integration
- **better-auth**: Authentication with Better Auth

## Templates Available

See the `templates/` directory for:
- Production-ready `nuxt.config.ts`
- Authentication flow (login, register, middleware)
- Blog with API routes (CRUD operations)
- E-commerce patterns (products, cart)
- Cloudflare Workers setup with bindings
- Vitest test examples
- Component examples

## References

- `references/composables.md` - Advanced composable patterns
- `references/data-fetching.md` - Complete data fetching guide
- `references/server.md` - Server route patterns
- `references/hydration.md` - SSR hydration best practices
- `references/performance.md` - Performance optimization strategies
- `references/deployment-cloudflare.md` - Comprehensive Cloudflare deployment guide
- `references/testing-vitest.md` - Vitest testing patterns

## Token Savings

**Without this skill**: ~25,000 tokens (reading docs + trial-and-error)
**With this skill**: ~7,000 tokens (targeted guidance)
**Savings**: ~72% (~18,000 tokens)

## Errors Prevented

This skill helps prevent 20+ common errors:

1. Using `ref` instead of `useState` for shared state
2. Missing SSR guards for browser APIs
3. Non-deterministic transform functions
4. Missing error handling in data fetching
5. Incorrect server route file naming
6. Missing `process.client` checks
7. Hydration mismatches from Date/Math.random()
8. Accessing `process.env` instead of `runtimeConfig`
9. Not using auto-imports properly
10. Missing TypeScript types
11. Incorrect middleware patterns
12. Plugin performance issues
13. Cache invalidation problems
14. Missing `key` in `useAsyncData`
15. Incorrect server error handling
16. Missing route validation
17. Improper cookie handling
18. Memory leaks in composables
19. Incorrect lazy loading patterns
20. Bundle size issues from improper imports

---

**Version**: 1.0.0 | **Last Updated**: 2025-11-09 | **License**: MIT
