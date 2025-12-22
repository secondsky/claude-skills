# Performance Optimization

Comprehensive guide to optimizing Nuxt 4 applications for maximum performance.

## Table of Contents

- [Built-in Optimizations](#built-in-optimizations)
- [Component Optimization](#component-optimization)
- [Image Optimization](#image-optimization)
- [Font Optimization](#font-optimization)
- [Code Splitting](#code-splitting)
- [Caching Strategies](#caching-strategies)
- [Bundle Analysis](#bundle-analysis)
- [Prefetching & Preloading](#prefetching--preloading)
- [Database Optimization](#database-optimization)
- [Vite Optimizations](#vite-optimizations)
- [Nitro Optimizations](#nitro-optimizations)
- [Performance Monitoring](#performance-monitoring)
- [Best Practices Checklist](#best-practices-checklist)
- [Common Pitfalls](#common-pitfalls)

## Built-in Optimizations

Nuxt 4 includes many performance optimizations out of the box:

- **Automatic code splitting** by route
- **Tree shaking** to remove unused code
- **Minification** of JavaScript and CSS
- **Preloading** of critical resources
- **Prefetching** of linked pages
- **Async data handler extraction** (39% smaller bundles in v4.2)
- **Import maps** for better chunk stability (v4.1)

## Component Optimization

### Lazy Loading Components

```vue
<script setup>
// Lazy load heavy components
const HeavyChart = defineAsyncComponent(() =>
  import('~/components/HeavyChart.vue')
)

const InteractiveMap = defineAsyncComponent(() =>
  import('~/components/InteractiveMap.vue')
)
</script>

<template>
  <div>
    <!-- Only loads when rendered -->
    <HeavyChart v-if="showChart" />

    <!-- With loading state -->
    <Suspense>
      <InteractiveMap />

      <template #fallback>
        <div>Loading map...</div>
      </template>
    </Suspense>
  </div>
</template>
```

### Lazy Hydration

```vue
<template>
  <div>
    <!-- Hydrate when visible -->
    <HeavyComponent lazy-hydrate="visible" />

    <!-- Hydrate on interaction -->
    <InteractiveWidget lazy-hydrate="interaction" />

    <!-- Hydrate after idle -->
    <LowPriorityComponent lazy-hydrate="idle" />

    <!-- Hydrate after delay -->
    <DelayedComponent lazy-hydrate="delay:5000" />
  </div>
</template>
```

### Lazy Hydration Without Auto-Imports (v4.1)

```vue
<script setup>
const LazyComponent = defineLazyHydrationComponent(() =>
  import('./HeavyComponent.vue')
)
</script>

<template>
  <LazyComponent />
</template>
```

### Lazy Prefix Convention

```
components/
├── HeavyChart.vue          # Auto-imported
├── LazyHeavyChart.vue      # Lazy-loaded
├── InteractiveMap.vue      # Auto-imported
└── LazyInteractiveMap.vue  # Lazy-loaded
```

```vue
<template>
  <div>
    <!-- Auto-loaded -->
    <HeavyChart />

    <!-- Lazy-loaded (only when rendered) -->
    <LazyHeavyChart v-if="showChart" />
  </div>
</template>
```

## Image Optimization

### NuxtImg

```vue
<template>
  <!-- Automatic optimization -->
  <NuxtImg
    src="/images/hero.jpg"
    width="800"
    height="600"
    alt="Hero image"
    loading="lazy"
    format="webp"
    quality="80"
  />

  <!-- Responsive -->
  <NuxtImg
    src="/images/hero.jpg"
    sizes="sm:100vw md:50vw lg:400px"
    alt="Hero image"
  />

  <!-- With provider (Cloudflare Images) -->
  <NuxtImg
    provider="cloudflare"
    src="/images/hero.jpg"
    width="800"
    height="600"
  />
</template>
```

### NuxtPicture

```vue
<template>
  <!-- Multiple formats (WebP, AVIF, fallback) -->
  <NuxtPicture
    src="/images/hero.jpg"
    :img-attrs="{
      alt: 'Hero image',
      loading: 'lazy'
    }"
    sizes="sm:100vw md:50vw lg:400px"
  />
</template>
```

### Setup

```bash
npm install @nuxt/image
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/image'],

  image: {
    // Cloudflare Images
    cloudflare: {
      baseURL: 'https://your-account.cloudflareimages.com'
    },

    // Or Cloudflare R2
    providers: {
      cloudflareR2: {
        baseURL: 'https://your-bucket.r2.cloudflarestorage.com'
      }
    }
  }
})
```

## Font Optimization

### @nuxt/fonts Module

```bash
npm install @nuxt/fonts
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/fonts'],

  fonts: {
    families: [
      { name: 'Inter', provider: 'google' },
      { name: 'Roboto Mono', provider: 'google' }
    ],

    // Automatic optimization
    defaults: {
      fallbacks: {
        'sans-serif': ['Arial', 'sans-serif'],
        'monospace': ['Courier New', 'monospace']
      }
    }
  }
})
```

Features:
- **Automatic font subsetting**
- **Preloading** of critical fonts
- **Font display: swap** by default
- **Local font caching**
- **Self-hosted option**

## Code Splitting

### Route-Based Splitting

Automatic in Nuxt - each page is a separate chunk.

```
pages/
├── index.vue       → index-[hash].js
├── about.vue       → about-[hash].js
└── blog/
    ├── index.vue   → blog-index-[hash].js
    └── [slug].vue  → blog-slug-[hash].js
```

### Component-Based Splitting

```vue
<script setup>
// Separate chunk for this component
const HeavyComponent = defineAsyncComponent(() =>
  import('~/components/HeavyComponent.vue')
)
</script>
```

### Manual Chunks

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk
            vendor: ['vue', 'vue-router'],

            // Heavy libraries
            charts: ['chart.js'],
            maps: ['leaflet']
          }
        }
      }
    }
  }
})
```

## Caching Strategies

### Route Rules

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Static pages (prerender)
    '/': { prerender: true },
    '/about': { prerender: true },

    // ISR (Incremental Static Regeneration)
    '/blog/**': {
      swr: 3600,  // Revalidate every hour
      isr: true
    },

    // API caching
    '/api/posts': {
      swr: 600,  // 10 minutes
      cache: {
        maxAge: 600
      }
    },

    // SPA mode (no SSR)
    '/dashboard/**': { ssr: false },

    // Cache control headers
    '/api/config': {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    }
  }
})
```

### API Response Caching

```typescript
// server/api/posts.get.ts
export default defineCachedEventHandler(
  async (event) => {
    const posts = await db.posts.findMany()
    return posts
  },
  {
    maxAge: 60 * 10,  // 10 minutes
    name: 'posts-list',
    getKey: (event) => {
      const query = getQuery(event)
      return `posts-${query.page || 1}`
    }
  }
)
```

### Data Fetching Cache

```typescript
// Automatic caching with key
const { data } = await useFetch('/api/posts', {
  key: 'posts-list',
  // Cached for this session
})

// Force refresh
const { refresh } = await useFetch('/api/posts', {
  key: 'posts-list'
})

await refresh()  // Bypasses cache
```

## Bundle Analysis

### Analyze Bundle Size

```bash
# Build with analysis
npx nuxi analyze

# Opens bundle analyzer in browser
```

### Reduce Bundle Size

1. **Remove unused dependencies**
```bash
npm prune
```

2. **Use dynamic imports**
```typescript
// Instead of:
import HeavyLibrary from 'heavy-library'

// Use:
const HeavyLibrary = await import('heavy-library')
```

3. **Optimize imports**
```typescript
// Instead of:
import { Button, Input, Select } from '@nuxt/ui'

// Already optimized in Nuxt UI v4
```

4. **Enable tree shaking**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      terserOptions: {
        compress: {
          drop_console: true  // Remove console.logs
        }
      }
    }
  }
})
```

## Prefetching & Preloading

### NuxtLink Prefetching

```vue
<template>
  <!-- Prefetch on hover (default) -->
  <NuxtLink to="/about">About</NuxtLink>

  <!-- Prefetch on visibility -->
  <NuxtLink to="/about" prefetch="visible">About</NuxtLink>

  <!-- No prefetch -->
  <NuxtLink to="/about" :prefetch="false">About</NuxtLink>
</template>
```

### Manual Prefetching

```typescript
const { prefetchComponents } = useNuxtApp()

// Prefetch components
await prefetchComponents('HeavyChart')
await prefetchComponents(['ComponentA', 'ComponentB'])
```

### Preload Critical Resources

```vue
<script setup>
useHead({
  link: [
    {
      rel: 'preload',
      as: 'font',
      href: '/fonts/Inter-Regular.woff2',
      type: 'font/woff2',
      crossorigin: 'anonymous'
    }
  ]
})
</script>
```

## Database Optimization

### Query Optimization

```typescript
// ❌ N+1 query problem
const users = await db.users.findMany()

for (const user of users) {
  user.posts = await db.posts.findMany({
    where: { userId: user.id }
  })
}

// ✅ Single query with join
const users = await db.users.findMany({
  include: {
    posts: true
  }
})
```

### Pagination

```typescript
// server/api/posts.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10

  const [posts, total] = await Promise.all([
    db.posts.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.posts.count()
  ])

  return {
    data: posts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})
```

### Connection Pooling

With Drizzle + D1, connection pooling is automatic.

## Vite Optimizations

### Pre-Bundling

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    optimizeDeps: {
      include: [
        'chart.js',
        'leaflet',
        'marked'
      ]
    }
  }
})
```

### Chunk Size Warnings

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,  // KB
      rollupOptions: {
        output: {
          manualChunks: {
            // Split large dependencies
          }
        }
      }
    }
  }
})
```

## Nitro Optimizations

### Precomputed Dependencies (v4.2)

Automatic in Nuxt v4.2 - reduces cold start time.

### Compression

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    compressPublicAssets: true,  // Gzip/Brotli
    minify: true
  }
})
```

### Route Rules

```typescript
export default defineNuxtConfig({
  nitro: {
    routeRules: {
      // Prerender static routes
      '/': { prerender: true },

      // Edge caching
      '/api/**': { cache: { maxAge: 600 } }
    }
  }
})
```

## Performance Monitoring

### Web Vitals

```vue
<script setup>
import { useWebVitals } from '~/composables/useWebVitals'

const { lcp, fid, cls, ttfb } = useWebVitals()

// Send to analytics
watch([lcp, fid, cls, ttfb], (metrics) => {
  console.log('Web Vitals:', metrics)
})
</script>
```

### Performance Marks

```typescript
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:finish', () => {
    performance.mark('page-rendered')

    const measure = performance.measure(
      'page-load',
      'navigationStart',
      'page-rendered'
    )

    console.log('Page load time:', measure.duration)
  })
})
```

## Best Practices Checklist

- [ ] Use lazy loading for heavy components
- [ ] Enable lazy hydration where appropriate
- [ ] Optimize images with NuxtImg/NuxtPicture
- [ ] Use @nuxt/fonts for font optimization
- [ ] Implement route-based caching
- [ ] Cache API responses
- [ ] Analyze bundle size regularly
- [ ] Enable prefetching for linked pages
- [ ] Optimize database queries
- [ ] Use connection pooling
- [ ] Enable compression
- [ ] Monitor Web Vitals
- [ ] Prerender static pages
- [ ] Use ISR for dynamic content

## Common Pitfalls

❌ **Loading all components eagerly**
❌ **Not optimizing images**
❌ **Missing font optimization**
❌ **No API caching**
❌ **N+1 query problems**
❌ **Large bundle sizes**
❌ **No prefetching**
❌ **Missing compression**
❌ **Not monitoring performance**

---

**Last Updated**: 2025-11-09
