---
name: nuxt-v4
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
  last-verified: 2025-12-09
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
bunx nuxi@latest init my-app

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run postinstall  # Generates .nuxt directory
bunx nuxi typecheck

# Testing (Vitest)
npm run test
npm run test:watch

# Deploy to Cloudflare
bunx wrangler deploy
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

## When to Load References

This skill includes detailed reference files for deep-dive topics. Load these when you need comprehensive guidance beyond the quick-start examples below.

**Load `references/composables.md` when:**
- Writing custom composables with `useState`, `useFetch`, or `useAsyncData`
- Debugging state management issues or memory leaks in composables
- Implementing SSR-safe patterns with browser APIs (localStorage, window, etc.)
- Building authentication or complex state management composables
- Understanding singleton pattern vs per-call composables

**Load `references/data-fetching.md` when:**
- Implementing API data fetching with reactive parameters
- Troubleshooting shallow vs deep reactivity issues
- Debugging data not refreshing when params change
- Handling complex async data flows or multiple API calls
- Implementing pagination, infinite scroll, or search with debounce
- Understanding transform functions, caching, or error handling patterns

**Load `references/server.md` when:**
- Creating or debugging Nitro server API routes
- Integrating databases (D1 + Drizzle, PostgreSQL, etc.)
- Handling server middleware, authentication, or sessions
- Building WebSocket or real-time features
- Understanding request/response utilities (getQuery, readBody, setCookie, etc.)
- Implementing file uploads, streaming, or complex server logic

**Load `references/hydration.md` when:**
- Debugging "Hydration node mismatch" errors
- Implementing `ClientOnly` components correctly
- Checking for non-deterministic values (Math.random(), Date.now(), etc.)
- Understanding SSR vs client-side rendering differences
- Fixing hydration mismatches from browser APIs or third-party scripts

**Load `references/performance.md` when:**
- Optimizing bundle size or Core Web Vitals scores
- Implementing lazy loading, code splitting, or dynamic imports
- Configuring lazy hydration for heavy components
- Setting up image optimization with `NuxtImg` or `NuxtPicture`
- Implementing route-based caching strategies (SWR, ISR, prerendering)
- Debugging slow page loads or poor Lighthouse scores

**Load `references/testing-vitest.md` when:**
- Writing component tests with `@nuxt/test-utils`
- Testing composables with proper Nuxt context
- Mocking Nuxt composables (`useFetch`, `useRoute`, etc.)
- Testing server API routes
- Setting up Vitest configuration for Nuxt projects
- Debugging test failures or improving test coverage

**Load `references/deployment-cloudflare.md` when:**
- Deploying to Cloudflare Pages or Workers
- Configuring wrangler.toml for Nuxt applications
- Setting up NuxtHub integration (D1, KV, R2, Blob)
- Preparing bindings for Cloudflare services (Durable Objects, Queues, etc.)
- Troubleshooting deployment errors or runtime issues
- Understanding Workers Assets vs static site deployment

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

Composables are auto-imported functions that encapsulate reusable logic. **Key rule**: Always use `use` prefix (`useAuth`, `useCart`).

### useState vs ref - Critical Distinction

```typescript
// ✅ CORRECT: Shared state (survives component unmount)
export const useCounter = () => {
  const count = useState('counter', () => 0)  // Singleton
  return { count }
}

// ❌ WRONG: Creates new instance every time!
export const useCounter = () => {
  const count = ref(0)  // Not shared
  return { count }
}
```

**Rule**: `useState` for shared state. `ref` for local component state. `useState` creates a singleton, `ref` doesn't.

**For complete composable patterns** including authentication examples, SSR-safe patterns, and advanced state management, load `references/composables.md`.

## Data Fetching

| Method | Use Case | SSR | Caching | Reactive |
|--------|----------|-----|---------|----------|
| `useFetch` | Simple API calls | ✅ | ✅ | ✅ |
| `useAsyncData` | Custom async logic | ✅ | ✅ | ✅ |
| `$fetch` | Client-side only | ❌ | ❌ | ❌ |

**Quick Examples:**

```typescript
// useFetch - basic
const { data, error, pending } = await useFetch('/api/users')

// useFetch - reactive params (auto-refetch when page changes)
const page = ref(1)
const { data } = await useFetch('/api/users', { query: { page } })

// useAsyncData - multiple calls
const { data } = await useAsyncData('dashboard', async () => {
  const [users, posts] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/posts')
  ])
  return { users, posts }
})
```

**Critical v4 Change**: Shallow reactivity is default. Use `deep: true` option if you need to mutate nested properties.

**For comprehensive data fetching patterns** including reactive keys, error handling, transform functions, and shallow vs deep reactivity, load `references/data-fetching.md`.

## Server Routes (Nitro)

Nitro provides file-based server routes with HTTP method suffixes:

```
server/api/users/index.get.ts    → GET /api/users
server/api/users/[id].get.ts     → GET /api/users/:id
server/api/users/[id].delete.ts  → DELETE /api/users/:id
```

**Basic Event Handler:**

```typescript
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')  // URL params
  const query = getQuery(event)            // Query params
  const body = await readBody(event)       // Request body

  // Error handling
  if (!id) {
    throw createError({ statusCode: 404, message: 'Not found' })
  }

  return { id, query, body }
})
```

**For complete server patterns** including request/response utilities, cookie handling, database integration (D1 + Drizzle), WebSockets, and middleware, load `references/server.md`.

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
bun add pinia @pinia/nuxt
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

**Top Causes of "Hydration Mismatch" Errors:**
1. **Non-deterministic values**: `Math.random()`, `Date.now()` → Use `useState` instead
2. **Browser APIs on server**: `window`, `localStorage`, `document` → Guard with `onMounted()` or `import.meta.client`
3. **ClientOnly**: Wrap client-only components in `<ClientOnly>` component

**Quick Fix:**
```vue
<!-- ❌ Wrong -->
<script setup>
const id = Math.random()
</script>

<!-- ✅ Right -->
<script setup>
const id = useState('id', () => Math.random())
</script>
```

**For comprehensive hydration debugging** including all causes, ClientOnly patterns, and fix strategies, load `references/hydration.md`.

## Performance Optimization

**Key Strategies:**
- **Lazy Loading**: `defineAsyncComponent(() => import('~/components/Heavy.vue'))`
- **Lazy Hydration**: `<Component lazy-hydrate="visible|interaction|idle" />`
- **Image Optimization**: `<NuxtImg>` and `<NuxtPicture>` for automatic optimization
- **Route Caching**: Configure `routeRules` in `nuxt.config.ts` for SWR, ISR, prerendering

**Quick Example:**
```typescript
// nuxt.config.ts - Route rules
routeRules: {
  '/': { swr: 3600 },              // Cache 1 hour
  '/about': { prerender: true },    // Pre-render at build
  '/dashboard/**': { ssr: false }   // SPA mode
}
```

**For comprehensive optimization** including bundle analysis, Core Web Vitals, lazy hydration patterns, and caching strategies, load `references/performance.md`.

## Testing with Vitest

**Setup:**
```bash
bun add -d @nuxt/test-utils vitest @vue/test-utils happy-dom
```

**Key Features:**
- `mountSuspended()` for component testing with Nuxt context
- `@nuxt/test-utils/config` for Vitest configuration
- Mock Nuxt composables (`useFetch`, `useRoute`, etc.)

**For complete testing patterns** including component tests, composable tests, server route tests, and mocking strategies, load `references/testing-vitest.md`.

## Deployment to Cloudflare

**Quick Deploy Commands:**

```bash
# Cloudflare Pages (Recommended)
npm run build
bunx wrangler pages deploy .output/public

# Cloudflare Workers
npm run build
bunx wrangler deploy
```

**Automatic Deployment**: Push to GitHub → Connect Cloudflare Pages → Auto-detected and built

**NuxtHub**: `bun add @nuxthub/core` for simplified D1, KV, R2, and Cache API integration.

**For comprehensive Cloudflare deployment** including wrangler.toml configuration, bindings setup (D1, KV, R2), NuxtHub integration patterns, and environment variables, load `references/deployment-cloudflare.md`.

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

**Additional Common Mistakes:**
- Not using auto-imports (Vue composables, Nuxt utils are auto-imported)
- Missing method suffix in server route file names (`users.get.ts`, not `users.ts`)
- Missing TypeScript types in `useFetch<T>()` calls
- Blocking plugins (use `parallel: true` option for heavy operations)
- Non-deterministic rendering causing hydration mismatches

## Troubleshooting Guide

**Quick Fixes for Common Issues:**

1. **Hydration Mismatch**: Check for browser APIs without guards (`window`, `localStorage`), non-deterministic values (`Math.random()`, `Date.now()`), or wrap in `<ClientOnly>`

2. **Data Not Refreshing**: Ensure params are reactive: `useFetch('/api/users', { query: { page } })` where `page = ref(1)`

3. **TypeScript/Build Errors**: Clear cache and regenerate: `rm -rf .nuxt .output node_modules/.vite && bun install && npm run dev`

**Note**: Server route 404s usually mean missing `.get.ts`/`.post.ts` suffix or wrong directory (`server/api/` not `app/api/`)

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

**Version**: 1.0.0 | **Last Updated**: 2025-11-28 | **License**: MIT
