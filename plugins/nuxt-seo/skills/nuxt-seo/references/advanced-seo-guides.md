# Nuxt SEO - Advanced SEO Guides

Advanced SEO topics including I18n, Route Rules, Link Checking, Enhanced Titles, SPA Prerendering, Hydration, Crawler Protection, and 404 Pages.

---

## Table of Contents

1. [I18n Multilanguage SEO](#i18n-multilanguage-seo)
2. [SEO Route Rules](#seo-route-rules)
3. [Enhanced Titles](#enhanced-titles)
4. [Nuxt SEO Utils Deep Dive](#nuxt-seo-utils-deep-dive)
5. [Nuxt Link Checker Rules](#nuxt-link-checker-rules)
6. [Prerendering Vue SPA for SEO](#prerendering-vue-spa-for-seo)
7. [Hydration Mismatches](#hydration-mismatches)
8. [Protecting from Malicious Crawlers](#protecting-from-malicious-crawlers)
9. [SEO-Friendly 404 Pages](#seo-friendly-404-pages)

---

## I18n Multilanguage SEO

### Overview

Both `nuxt-robots` and `nuxt-sitemap` integrate seamlessly with `@nuxtjs/i18n` and `nuxt-i18n-micro` for multilanguage SEO.

### Robots.txt with I18n

The robots module automatically localizes `allow` and `disallow` paths based on your i18n configuration.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  robots: {
    disallow: ['/secret', '/admin'],
  },
  i18n: {
    locales: ['en', 'fr', 'de'],
    defaultLocale: 'en',
    strategy: 'prefix',
  }
})
```

**Generated robots.txt:**
```
User-agent: *
Disallow: /en/secret
Disallow: /en/admin
Disallow: /fr/secret
Disallow: /fr/admin
Disallow: /de/secret
Disallow: /de/admin
```

#### Opt-out of I18n Localization

```typescript
// Per-group opt-out
export default defineNuxtConfig({
  robots: {
    groups: [
      {
        disallow: ['/docs/en/v*', '/docs/zh/v*'],
        _skipI18n: true,  // Skip i18n for this group
      },
    ],
  },
})

// Global opt-out
export default defineNuxtConfig({
  robots: {
    autoI18n: false,  // Disable all i18n localization
  }
})
```

### Sitemap with I18n

The sitemap module automatically generates locale-specific sitemaps:

**Generated structure:**
```
/sitemap_index.xml
/en-sitemap.xml
/fr-sitemap.xml
/de-sitemap.xml
```

#### Automatic Multi-Sitemap Mode

Enabled automatically when:
- Not using `no_prefix` strategy
- Or using Different Domains
- And `sitemaps` option not manually configured

#### Dynamic URLs with I18n Transform

```typescript
// server/api/__sitemap__/urls.ts
export default defineSitemapEventHandler(() => {
  return [
    {
      loc: '/about-us',
      // Automatically creates: /en/about-us, /fr/about-us, /de/about-us
      _i18nTransform: true,
    }
  ]
})
```

#### Custom Path Translations

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  i18n: {
    pages: {
      'about': {
        en: '/about',
        fr: '/a-propos',
        de: '/uber-uns',
      },
    },
  },
})
```

With `_i18nTransform: true`, this generates:
- `/about` (en)
- `/fr/a-propos` (fr)
- `/de/uber-uns` (de)

#### Assign URL to Specific Locale

```typescript
// server/api/__sitemap__/urls.ts
export default defineSitemapEventHandler(() => {
  return [
    {
      loc: '/about-us',
      _sitemap: 'en',  // Only appears in English sitemap
    }
  ]
})
```

#### Debugging Hreflang

Display hreflang counts in sitemap UI:

```typescript
export default defineNuxtConfig({
  sitemap: {
    xslColumns: [
      { label: 'URL', width: '50%' },
      { label: 'Last Modified', select: 'sitemap:lastmod', width: '25%' },
      { label: 'Hreflangs', select: 'count(xhtml)', width: '25%' },
    ],
  }
})
```

---

## SEO Route Rules

### Overview

Nuxt's `routeRules` provide powerful per-route SEO configuration for robots, sitemap, rendering mode, and meta tags.

### Basic Route Rules

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Homepage - highest priority, daily updates
    '/': {
      sitemap: { changefreq: 'daily', priority: 1.0 },
      prerender: true,
    },

    // Blog posts - weekly updates, prerendered
    '/blog/**': {
      sitemap: { changefreq: 'weekly', priority: 0.8 },
      prerender: true,
    },

    // Admin area - no indexing, no sitemap
    '/admin/**': {
      robots: 'noindex, nofollow',
      sitemap: { exclude: true },
    },

    // Search results - don't index (prevents duplicate content)
    '/search': {
      robots: 'noindex, follow',
    },

    // User profiles - no index (privacy)
    '/user/**': {
      robots: 'noindex',
      sitemap: { exclude: true },
    },

    // API routes - exclude from everything
    '/api/**': {
      robots: 'noindex',
      sitemap: { exclude: true },
    },

    // Dynamic products with ISR
    '/products/**': {
      swr: 3600,  // Revalidate every hour
      sitemap: { changefreq: 'daily', priority: 0.7 },
    },

    // Static pages
    '/about': { prerender: true },
    '/contact': { prerender: true },
    '/privacy': { prerender: true },
  }
})
```

### SEO Meta in Route Rules

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/products/**': {
      seoMeta: {
        ogType: 'product',
        twitterCard: 'summary_large_image',
      },
    },
    '/blog/**': {
      seoMeta: {
        ogType: 'article',
        twitterCard: 'summary_large_image',
      },
    },
  }
})
```

### Environment-Based Route Rules

```typescript
// nuxt.config.ts
const isProduction = process.env.NODE_ENV === 'production'
const isStaging = process.env.NUXT_PUBLIC_ENV === 'staging'

export default defineNuxtConfig({
  routeRules: {
    // Block all crawling on staging
    ...(isStaging && {
      '/**': { robots: 'noindex, nofollow' }
    }),

    // Production-only prerendering
    ...(isProduction && {
      '/': { prerender: true },
      '/blog/**': { prerender: true },
    }),
  }
})
```

---

## Enhanced Titles

### Overview

Nuxt SEO Utils provides enhanced title management with fallback titles and templates.

### Automatic Fallback Titles

Every page automatically gets a title generated from the last URL segment:

```
/about-us → "About Us"
/products/blue-shoes → "Blue Shoes"
/blog/my-first-post → "My First Post"
```

### Title Templates

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  site: {
    name: 'My Site',
  },
})
```

This automatically creates title template: `%s | My Site`

### Custom Title Templates

```vue
<script setup>
// Override for specific page
useHead({
  titleTemplate: '%s - Custom Suffix'
})

// Or remove template entirely
useHead({
  titleTemplate: null
})
</script>
```

### Page-Level Title Configuration

```vue
<script setup>
// Simple title
useSeoMeta({
  title: 'My Page Title',
})

// Title with description
useSeoMeta({
  title: 'Product Name',
  description: 'Product description for search results',
  ogTitle: 'Product Name - Special Offer',  // Different for social
})
</script>
```

### Title Best Practices

1. **Keep titles under 60 characters** - Google truncates longer titles
2. **Put keywords near the beginning** - More visible in search results
3. **Make titles unique per page** - Avoid duplicate titles
4. **Include brand name** - Usually at the end with separator
5. **Be descriptive** - Tell users what the page is about

---

## Nuxt SEO Utils Deep Dive

### Features Overview

| Feature | Description |
|---------|-------------|
| **Default Canonical URLs** | Automatic canonical URL generation |
| **Metadata Files** | Next.js-style metadata file support |
| **Breadcrumb Composable** | Easy breadcrumb generation |
| **SEO Meta in Config** | useSeoMeta DX in nuxt.config |
| **Automatic OG Tags** | og:title/og:description from page meta |
| **Tag Validation** | Fix broken tags automatically |
| **Head Optimizations** | Treeshaking and Capo.js |

### Canonical URLs

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  seoUtils: {
    // Whitelist specific query params for canonical
    canonicalQueryParams: ['page', 'sort'],
  }
})
```

**Features:**
- Automatic lowercase URLs
- Respects trailing slash config
- Query param whitelisting

### Breadcrumbs

```vue
<script setup>
const breadcrumbs = useBreadcrumbItems()
// Returns: [
//   { label: 'Home', to: '/' },
//   { label: 'Products', to: '/products' },
//   { label: 'Shoes', to: '/products/shoes' },
// ]
</script>

<template>
  <!-- Works directly with Nuxt UI -->
  <UBreadcrumb :items="breadcrumbs" />

  <!-- Or custom rendering -->
  <nav aria-label="Breadcrumb">
    <ol class="flex gap-2">
      <li v-for="(item, i) in breadcrumbs" :key="i">
        <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
        <span v-if="i < breadcrumbs.length - 1">/</span>
      </li>
    </ol>
  </nav>
</template>
```

### Metadata Files (Next.js-style)

Place files in `public/` directory:

```
public/
├── favicon.ico
├── apple-touch-icon.png
├── og-image.png
└── opengraph-image.png
```

Auto-detected and added to `<head>`.

### Automatic OG Tag Inference

```vue
<script setup>
// Just set title and description
useSeoMeta({
  title: 'My Page',
  description: 'Page description',
})

// og:title and og:description are automatically set
// No need to duplicate!
</script>
```

---

## Nuxt Link Checker Rules

### Available Inspection Rules

| Rule | Description | Why It Matters |
|------|-------------|----------------|
| `absolute-site-urls` | Checks for internal absolute links | Use relative paths for portability |
| `link-text` | Ensures descriptive link text | Accessibility and SEO |
| `missing-hash` | Validates anchor links | UX and accessibility |
| `no-baseless` | Checks for document-relative links | Maintenance issues |
| `no-double-slashes` | Finds `//` in paths | Canonicalization issues |
| `no-duplicate-query-params` | Finds `?a=1&a=2` | Caching/duplicate content |
| `no-error-response` | Finds 4xx/5xx responses | Crawlability |
| `no-javascript` | Finds `href="javascript:"` | Poor UX |
| `no-missing-href` | Ensures `<a>` has `href` | Accessibility |
| `no-non-ascii-chars` | Finds non-ASCII in URLs | Encoding issues |
| `no-underscores` | Finds `_` in URLs | SEO best practice |
| `no-uppercase-chars` | Finds uppercase in URLs | SEO best practice |
| `no-whitespace` | Finds spaces in URLs | Broken links |
| `trailing-slash` | Consistent trailing slashes | Canonicalization |

### Disabling Specific Rules

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  linkChecker: {
    skipInspections: [
      'no-underscores',      // Allow underscores
      'absolute-site-urls',  // Allow absolute internal URLs
      'link-text',           // Skip link text validation
    ],
  },
})
```

### Using Link Checker DevTools

1. Open Nuxt DevTools in development
2. Navigate to "Link Checker" tab
3. See live inspections as you browse
4. Click issues to jump to source

### Build-Time Link Checking

Link checker runs during `nuxt build` for all prerendered pages. Prerender pages you want checked:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/', '/about', '/blog'],
      crawlLinks: true,
    }
  }
})
```

---

## Prerendering Vue SPA for SEO

### The SPA SEO Problem

Single Page Applications (SPAs) render content client-side, meaning:
- Search engines see empty HTML
- Social media previews don't work
- Core Web Vitals suffer

### Solutions in Nuxt

#### Option 1: SSR (Default)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,  // Default, renders on server
})
```

**Best for:** Dynamic content, personalization, real-time data

#### Option 2: SSG (Static Generation)

```bash
bun run generate
# or: npx nuxt generate
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true,  // Auto-discover links
    }
  }
})
```

**Best for:** Content sites, blogs, documentation

#### Option 3: Hybrid (Mixed Rendering)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Static pages
    '/': { prerender: true },
    '/about': { prerender: true },
    '/blog/**': { prerender: true },

    // SSR pages
    '/dashboard/**': { ssr: true },

    // SPA pages (no SEO needed)
    '/admin/**': { ssr: false },

    // ISR pages
    '/products/**': { swr: 3600 },
  }
})
```

**Best for:** Complex sites with mixed content types

#### Option 4: ISR (Incremental Static Regeneration)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/products/**': {
      swr: 3600,  // Stale-while-revalidate: 1 hour
    },
    '/blog/**': {
      isr: 600,   // Regenerate every 10 minutes
    },
  }
})
```

**Best for:** High-traffic sites with frequently updated content

---

## Hydration Mismatches

### What Are Hydration Mismatches?

Hydration is when Vue "takes over" server-rendered HTML. Mismatches occur when server HTML differs from client expectation.

### Common Causes

1. **Date/Time rendering** - Server and client in different timezones
2. **Random values** - Different on server vs client
3. **Browser APIs** - `window`, `document` not available on server
4. **Async data** - Data changes between render and hydration

### Solutions

#### 1. Use `<ClientOnly>` for Browser-Only Content

```vue
<template>
  <ClientOnly>
    <CurrentTime />
    <template #fallback>
      <span>Loading...</span>
    </template>
  </ClientOnly>
</template>
```

#### 2. Use `onMounted` for Client-Side Code

```vue
<script setup>
const windowWidth = ref(0)

onMounted(() => {
  windowWidth.value = window.innerWidth
})
</script>
```

#### 3. Consistent Date Formatting

```vue
<script setup>
// Bad - different on server/client
const date = new Date().toLocaleString()

// Good - consistent ISO format
const date = new Date().toISOString()

// Or use a library like dayjs with consistent timezone
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

const date = dayjs().utc().format('YYYY-MM-DD HH:mm:ss')
</script>
```

#### 4. Avoid Random Values in Renders

```vue
<script setup>
// Bad - different every render
const id = Math.random().toString(36)

// Good - stable ID
const id = useId()
</script>
```

### SEO Impact of Hydration Mismatches

- **Console warnings** indicate potential issues
- **Content shifts** hurt Core Web Vitals (CLS)
- **Inconsistent content** can confuse crawlers

---

## Protecting from Malicious Crawlers

### Bot Detection with nuxt-robots

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  robots: {
    groups: [
      // Block AI scrapers
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai'],
        disallow: ['/'],
      },
      // Block known bad bots
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot'],
        disallow: ['/'],
      },
      // Allow search engines
      {
        userAgent: ['Googlebot', 'Bingbot', 'DuckDuckBot'],
        allow: ['/'],
      },
    ],
  }
})
```

### Server-Side Bot Detection

```typescript
// server/middleware/bot-protection.ts
export default defineEventHandler((event) => {
  const { isBot, name } = getBotDetection(event)

  if (isBot) {
    // Log bot access
    console.log(`Bot detected: ${name}`)

    // Rate limit bots
    // Serve cached content
    // Block specific bots
  }
})
```

### Client-Side Bot Detection

```vue
<script setup>
const { isBot, name } = useBotDetection()

if (isBot) {
  // Don't load analytics
  // Don't show interactive features
  // Serve simplified content
}
</script>
```

### Blocking by User-Agent

```typescript
// server/middleware/block-bots.ts
const blockedBots = ['BadBot', 'EvilCrawler', 'SpamBot']

export default defineEventHandler((event) => {
  const userAgent = getHeader(event, 'user-agent') || ''

  for (const bot of blockedBots) {
    if (userAgent.includes(bot)) {
      throw createError({
        statusCode: 403,
        message: 'Access denied',
      })
    }
  }
})
```

### Rate Limiting

```typescript
// server/middleware/rate-limit.ts
const rateLimits = new Map<string, { count: number; timestamp: number }>()
const WINDOW_MS = 60000  // 1 minute
const MAX_REQUESTS = 60

export default defineEventHandler((event) => {
  const ip = getRequestIP(event) || 'unknown'
  const now = Date.now()
  const record = rateLimits.get(ip)

  if (!record || now - record.timestamp > WINDOW_MS) {
    rateLimits.set(ip, { count: 1, timestamp: now })
    return
  }

  record.count++

  if (record.count > MAX_REQUESTS) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests',
    })
  }
})
```

---

## SEO-Friendly 404 Pages

### Creating a Custom 404 Page

```vue
<!-- error.vue -->
<script setup>
const error = useError()

// Set proper status code
useHead({
  title: 'Page Not Found',
})

useSeoMeta({
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: 'noindex, follow',  // Don't index 404 pages
})
</script>

<template>
  <div class="error-page">
    <h1>{{ error.statusCode === 404 ? 'Page Not Found' : 'Error' }}</h1>
    <p>{{ error.message }}</p>

    <!-- Helpful navigation -->
    <nav>
      <h2>Try these instead:</h2>
      <ul>
        <li><NuxtLink to="/">Home</NuxtLink></li>
        <li><NuxtLink to="/search">Search</NuxtLink></li>
        <li><NuxtLink to="/sitemap">Sitemap</NuxtLink></li>
      </ul>
    </nav>

    <button @click="clearError({ redirect: '/' })">
      Go to Homepage
    </button>
  </div>
</template>
```

### 404 Page Best Practices

1. **Return 404 status code** - Don't soft 404 (200 with "not found" content)
2. **Use `noindex`** - Prevent 404 pages from being indexed
3. **Provide helpful navigation** - Help users find what they need
4. **Include search** - Let users search for content
5. **Match site design** - Consistent branding and navigation
6. **Track 404s** - Monitor for broken links to fix

### Handling Soft 404s

A "soft 404" returns 200 status but shows "not found" content. This confuses search engines.

```typescript
// pages/products/[id].vue
const { data: product, error } = await useFetch(`/api/products/${id}`)

if (!product.value) {
  throw createError({
    statusCode: 404,
    message: 'Product not found',
  })
}
```

### OG Image for 404 Pages

```vue
<!-- error.vue -->
<script setup>
defineOgImage({
  component: 'Error',
  title: 'Page Not Found',
  description: 'The requested page could not be found',
})
</script>
```

### Monitoring 404 Errors

```typescript
// plugins/error-tracking.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('vue:error', (error, instance, info) => {
    // Send to error tracking service
    console.error('Vue error:', error)
  })

  nuxtApp.hook('app:error', (error) => {
    // Track 404s and other errors
    if (error.statusCode === 404) {
      // Log or send to analytics
      console.log('404 error:', error.url)
    }
  })
})
```

---

**Last Updated**: 2025-12-28
**Source**: https://nuxtseo.com

