# Nuxt 4 - Production Framework Patterns

Production-ready Nuxt 4 framework development with SSR, composables, data fetching, server routes, and comprehensive Cloudflare deployment patterns.

## What This Skill Covers

This skill provides **comprehensive Nuxt 4 framework patterns** including:

- **Composables**: useState, useFetch, useAsyncData, custom composables, SSR-safe patterns
- **Data Fetching**: useFetch vs useAsyncData vs $fetch, reactive keys, shallow reactivity, caching strategies
- **Server Routes (Nitro)**: File-based routing, event handlers, database integration, authentication
- **Routing**: File-based pages, dynamic routes, middleware, navigation
- **SEO & Meta**: useHead, useSeoMeta, Open Graph, Twitter cards
- **State Management**: useState patterns, Pinia integration, server/client state
- **Error Handling**: Error pages, boundaries, API errors, validation
- **Hydration**: SSR patterns, mismatches, client-only rendering, debugging
- **Performance**: Lazy loading, code splitting, image optimization, caching, prefetching
- **Testing (Vitest)**: Component, composable, and API testing patterns
- **Cloudflare Deployment**: Pages, Workers, NuxtHub, bindings (D1, KV, R2, Durable Objects, Queues)
- **Layers & Prerendering**: Multi-app architecture, static generation, hybrid rendering

## When to Use This Skill

Use this skill when:

- **Building Nuxt 4 applications** from scratch or migrating from v3
- **Implementing SSR patterns** with server-side rendering
- **Creating composables** for shared logic and state management
- **Setting up server routes** with Nitro and API endpoints
- **Implementing data fetching** with useFetch, useAsyncData, or $fetch
- **Managing state** with useState or Pinia
- **Debugging hydration issues** and SSR mismatches
- **Deploying to Cloudflare** Pages or Workers
- **Optimizing performance** with lazy loading, caching, and code splitting
- **Setting up testing** with Vitest and @nuxt/test-utils
- **Integrating Cloudflare bindings** (D1, KV, R2, Durable Objects, Queues, Workers AI)
- **Implementing WebSocket** real-time features
- **Creating multilayer applications** with Nuxt layers

## Key Features

### ✨ Nuxt v4 Specific Features

- **New directory structure** (`app/` as default srcDir)
- **Shallow reactivity** by default (v4 change)
- **Reactive keys** for auto-refetch
- **Async data handler extraction** (39% smaller bundles in v4.2)
- **Enhanced chunk stability** with import maps (v4.1)
- **Lazy hydration** without auto-imports
- **Abort control** for data fetching (v4.2)

### 🎯 Production Patterns

- **20+ documented anti-patterns** with solutions
- **Comprehensive error handling** patterns
- **SSR-safe composables** with environment guards
- **Authentication patterns** (session-based, JWT)
- **Database integration** (D1 + Drizzle, Kysely)
- **Real-world examples** (auth, blog, e-commerce)

### ☁️ Cloudflare Integration

- **NuxtHub zero-config** bindings
- **D1 database** patterns with Drizzle ORM
- **KV storage** for sessions and caching
- **R2 blob storage** for file uploads
- **Durable Objects** for stateful coordination
- **Queues** for background jobs
- **Workers AI** integration
- **WebSocket** support

### 🧪 Testing Coverage

- **Component testing** with @vue/test-utils
- **Composable testing** patterns
- **API route testing** with @nuxt/test-utils
- **E2E testing** with Playwright
- **Mocking patterns** for useFetch, useState, composables

## Installation

```bash
# Install this skill
cd ~/.claude/skills
git clone https://github.com/secondsky/claude-skills
ln -s "$(pwd)/claude-skills/skills/nuxt-v4" nuxt-v4

# Or use the install script
./scripts/install-skill.sh nuxt-v4
```

## Quick Start

### Create New Nuxt 4 Project

```bash
npx nuxi@latest init my-app
cd my-app
npm install
npm run dev
```

### Key Nuxt 4 Patterns

**useState for Shared State:**
```typescript
const user = useState('user', () => null)  // ✅ Shared across components
const count = ref(0)  // ❌ Local to component only
```

**Data Fetching:**
```typescript
// Simple API call
const { data } = await useFetch('/api/users')

// With reactive params (auto-refetch in v4)
const page = ref(1)
const { data } = await useFetch('/api/users', { query: { page } })

// Custom logic
const { data } = await useAsyncData('users', () => $fetch('/api/users'))
```

**Server Routes:**
```typescript
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  const users = await db.users.findMany()
  return users
})
```

**Composables:**
```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const user = useState('auth-user', () => null)
  const login = async (email, password) => { /* ... */ }
  return { user, login }
}
```

## Auto-Trigger Keywords

This skill automatically triggers when you mention:

**Framework**: Nuxt 4, Nuxt v4, Nuxt, SSR, universal rendering, Nitro

**Composables**: useState, useFetch, useAsyncData, $fetch, useRoute, useRouter, useHead, useSeoMeta, useRuntimeConfig

**Auto-imports**: auto-imports, auto-imported, composables, components

**Data Fetching**: data fetching, fetching data, API calls, useFetch, useAsyncData, reactive keys, shallow reactivity

**Server**: server routes, API routes, Nitro, defineEventHandler, server directory, event handlers

**Routing**: file-based routing, pages directory, dynamic routes, middleware, route middleware, definePageMeta

**Hydration**: hydration, hydration mismatch, SSR rendering, ClientOnly

**State**: state management, shared state, global state, useState, Pinia

**Deployment**: Cloudflare Pages, Cloudflare Workers, NuxtHub, Workers Assets, deploy Nuxt

**Bindings**: D1, KV, R2, Durable Objects, Queues, Workers AI, Cloudflare bindings

**Testing**: Vitest, testing, test Nuxt, @nuxt/test-utils, mountSuspended

**Performance**: lazy loading, code splitting, lazy hydration, performance optimization, bundle size

**Errors**: error handling, error page, error boundary, createError

## Related Skills

- **nuxt-ui-v4**: Nuxt UI component library (52 components, theming, design system)
- **cloudflare-d1**: D1 database patterns with Drizzle ORM
- **cloudflare-kv**: KV storage best practices
- **cloudflare-r2**: R2 object storage patterns
- **cloudflare-workers-ai**: Workers AI integration
- **cloudflare-durable-objects**: Stateful coordination patterns
- **cloudflare-queues**: Background job processing
- **better-auth**: Authentication with Better Auth
- **content-collections**: Content management patterns

## Version Requirements

| Package | Minimum | Recommended |
|---------|---------|-------------|
| nuxt | 4.0.0 | 4.2.x |
| vue | 3.5.0 | 3.5.x |
| nitro | 2.10.0 | 2.10.x |
| vite | 6.0.0 | 6.0.x |
| typescript | 5.0.0 | 5.x |

## Token Savings

**Without this skill**: ~25,000 tokens (reading docs + trial-and-error)
**With this skill**: ~7,000 tokens (targeted guidance)
**Savings**: ~72% (~18,000 tokens)

## Errors Prevented

This skill helps prevent **20+ common errors**:

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
11-20. [And 10 more documented in SKILL.md]

## Resources

### References (in `references/`)
- `composables.md` - Advanced composable patterns
- `data-fetching.md` - Complete useFetch/useAsyncData guide
- `server.md` - Nitro server patterns
- `hydration.md` - SSR hydration best practices
- `performance.md` - Optimization strategies
- `deployment-cloudflare.md` - Comprehensive Cloudflare guide
- `testing-vitest.md` - Vitest testing patterns

### Templates (in `templates/`)
- Production `nuxt.config.ts`
- Authentication flow (login, register, middleware)
- Blog with API routes (CRUD operations)
- E-commerce patterns (products, cart)
- Cloudflare Workers setup (`wrangler.toml`)
- Vitest test examples

### Scripts (in `scripts/`)
- `init-nuxt-v4.sh` - Initialize new Nuxt 4 project

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT

---

**Version**: 1.0.0 | **Last Updated**: 2025-11-09 | **Maintainer**: Claude Skills Maintainers
