# Nuxt SEO - Complete API Reference

All composables, functions, and APIs across the 8 modules.

---

## Table of Contents

1. [nuxt-robots APIs](#nuxt-robots-apis)
2. [nuxt-sitemap APIs](#nuxt-sitemap-apis)
3. [nuxt-og-image APIs](#nuxt-og-image-apis)
4. [nuxt-schema-org APIs](#nuxt-schema-org-apis)
5. [nuxt-seo-utils APIs](#nuxt-seo-utils-apis)
6. [nuxt-site-config APIs](#nuxt-site-config-apis)

---


## nuxt-robots APIs

### `useRobotsRule(rule: string)`

Set robots meta tag for the current page.

**Parameters**:
- `rule` (string): Robots directives (e.g., "noindex, nofollow")

**Example**:
```vue
<script setup>
useRobotsRule('noindex, nofollow')
</script>
```

---

### `useBotDetection()`

Client-side bot detection.

**Returns**:
- `isBot` (boolean): Whether current request is from a bot
- `name` (string): Name of detected bot

**Example**:
```vue
<script setup>
const { isBot, name } = useBotDetection()

if (isBot) {
  console.log(`Bot detected: ${name}`)
}
</script>
```

---

### `getBotDetection(event)`

Server-side bot detection.

**Parameters**:
- `event` (H3Event): HTTP event object

**Returns**:
- `isBot` (boolean): Whether request is from a bot
- `name` (string): Bot name

**Example**:
```typescript
// server/api/example.ts
export default defineEventHandler((event) => {
  const { isBot, name } = getBotDetection(event)

  if (isBot) {
    // Serve optimized content for bots
  }
})
```

---

### `getPathRobotConfig(path: string)`

Get robots configuration for a specific path.

**Parameters**:
- `path` (string): URL path

**Returns**: Robots configuration object

**Example**:
```typescript
const config = getPathRobotConfig('/admin')
```

---

### `getSiteRobotConfig()`

Get site-wide robots configuration.

**Returns**: Site robots configuration

**Example**:
```typescript
const siteConfig = getSiteRobotConfig()
```

---

## nuxt-sitemap APIs

### `defineSitemapEventHandler(handler)`

Define a dynamic sitemap source.

**Parameters**:
- `handler` (Function): Async function returning sitemap entries

**Returns**: Event handler

**Example**:
```typescript
// server/api/__sitemap__/products.ts
export default defineSitemapEventHandler(async () => {
  const products = await fetchProducts()

  return products.map(product => ({
    loc: `/products/${product.slug}`,
    lastmod: product.updatedAt,
    changefreq: 'weekly',
    priority: 0.8,
    images: product.images.map(img => ({
      loc: img.url,
      caption: img.alt
    }))
  }))
})
```

**Sitemap Entry Format**:
```typescript
interface SitemapEntry {
  loc: string // URL path (required)
  lastmod?: string | Date // Last modified date
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number // 0.0 to 1.0
  images?: Array<{
    loc: string // Image URL
    caption?: string
    title?: string
    geoLocation?: string
    license?: string
  }>
  videos?: Array<{
    title: string
    description?: string
    thumbnailLoc: string
    contentLoc?: string
    duration?: number
    publicationDate?: string
  }>
  news?: {
    publication: {
      name: string
      language: string
    }
    publicationDate: string
    title: string
  }
}
```

---

## nuxt-og-image APIs

### `defineOgImage(options)`

Define an OG image with simple options.

**Parameters**:
```typescript
interface OgImageOptions {
  title?: string
  description?: string
  theme?: string
  image?: string
  price?: string
  renderer?: 'satori' | 'chromium'
  format?: 'png' | 'jpeg'
  quality?: number // 0-100 for JPEG
  // ... other custom options
}
```

**Example**:
```vue
<script setup>
defineOgImage({
  title: 'My Page Title',
  description: 'Page description',
  theme: '#00DC82',
  format: 'png'
})
</script>
```

---

### `defineOgImageComponent(component, props)`

Use a Vue component as OG image template.

**Parameters**:
- `component` (string): Component name (e.g., "OgImage")
- `props` (object): Props to pass to component

**Example**:
```vue
<script setup>
defineOgImageComponent('BlogPost', {
  title: 'Blog Post Title',
  author: 'Author Name',
  date: '2025-01-10',
  image: 'https://example.com/cover.jpg'
})
</script>
```

---

### `defineOgImageScreenshot(options)`

Capture a screenshot of page element as OG image.

**Parameters**:
```typescript
interface OgImageScreenshotOptions {
  selector: string // CSS selector
  width?: number
  height?: number
  delay?: number
}
```

**Example**:
```vue
<script setup>
defineOgImageScreenshot({
  selector: '#og-preview',
  width: 1200,
  height: 630
})
</script>
```

---

## nuxt-schema-org APIs

### `useSchemaOrg(nodes)`

Add Schema.org structured data to the current page.

**Parameters**:
- `nodes` (Array): Schema.org JSON-LD objects

**Returns**: void

**Example - Article**:
```vue
<script setup>
useSchemaOrg([
  {
    '@type': 'Article',
    headline: 'Article Title',
    author: {
      '@type': 'Person',
      name: 'Author Name'
    },
    datePublished: '2025-01-10',
    image: 'https://example.com/image.jpg'
  }
])
</script>
```

**Example - Product**:
```vue
<script setup>
useSchemaOrg([
  {
    '@type': 'Product',
    name: 'Product Name',
    image: 'https://example.com/product.jpg',
    offers: {
      '@type': 'Offer',
      price: '99.99',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    }
  }
])
</script>
```

**Example - Multiple Schemas**:
```vue
<script setup>
useSchemaOrg([
  {
    '@type': 'Organization',
    name: 'My Company',
    url: 'https://example.com'
  },
  {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://example.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: 'https://example.com/products'
      }
    ]
  }
])
</script>
```

---

## nuxt-seo-utils APIs

### `useBreadcrumbItems()`

Generate breadcrumb navigation items from current route.

**Returns**: Array of breadcrumb items

**Example**:
```vue
<script setup>
const breadcrumbs = useBreadcrumbItems()
// [
//   { label: 'Home', to: '/' },
//   { label: 'Products', to: '/products' },
//   { label: 'Product Name', to: '/products/123' }
// ]
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol>
      <li v-for="(item, index) in breadcrumbs" :key="index">
        <NuxtLink :to="item.to">
          {{ item.label }}
        </NuxtLink>
      </li>
    </ol>
  </nav>
</template>
```

---

## nuxt-site-config APIs

### `useSiteConfig()`

Access site configuration.

**Returns**: Site configuration object

**Example**:
```vue
<script setup>
const siteConfig = useSiteConfig()

console.log(siteConfig.url) // https://example.com
console.log(siteConfig.name) // My Site
console.log(siteConfig.description) // Site description
console.log(siteConfig.defaultLocale) // en
</script>
```

---

### `updateSiteConfig(config)`

Dynamically update site configuration.

**Parameters**:
- `config` (object): Partial site configuration

**Example**:
```typescript
updateSiteConfig({
  name: 'New Site Name',
  description: 'New description'
})
```

---

### `createSitePathResolver()`

Create a path resolver with site URL.

**Returns**: Path resolver function

**Example**:
```typescript
const resolvePath = createSitePathResolver()
const fullUrl = resolvePath('/products/123')
// https://example.com/products/123
```

---

### `useNitroOrigin()`

Get the origin URL server-side.

**Returns**: Origin URL

**Example**:
```typescript
// server/api/example.ts
export default defineEventHandler(() => {
  const origin = useNitroOrigin()
  // https://example.com
})
```

---

## Configuration Objects

### Site Config

```typescript
interface SiteConfig {
  url: string // Site URL (required)
  name: string // Site name
  description?: string
  defaultLocale?: string // Default language code
  identity?: {
    type: 'Organization' | 'Person'
    name?: string
    logo?: string
    // ... more identity fields
  }
  twitter?: string
  trailingSlash?: boolean
}
```

---

### Robots Config

```typescript
interface RobotsConfig {
  disallow?: string[]
  allow?: string[]
  groups?: Array<{
    userAgent: string[]
    allow?: string[]
    disallow?: string[]
  }>
  sitemap?: string | string[]
  cleanParam?: string[]
}
```

---

### Sitemap Config

```typescript
interface SitemapConfig {
  strictNuxtContentPaths?: boolean
  exclude?: string[]
  defaults?: {
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority?: number
  }
  sitemaps?: {
    [key: string]: {
      includeAppSources?: boolean
      sources?: string[]
    }
  }
  chunksSize?: number
  cacheMaxAgeSeconds?: number
  filter?: (entry: SitemapEntry) => boolean
}
```

---

### OG Image Config

```typescript
interface OgImageConfig {
  renderer?: 'satori' | 'chromium'
  format?: 'png' | 'jpeg'
  quality?: number
  component?: string
  fonts?: Array<string | {
    name: string
    weight: number
    path: string
  }>
  runtimeCacheStorage?: boolean
}
```

---

### Schema.org Config

```typescript
interface SchemaOrgConfig {
  identity?: {
    type: 'Organization' | 'Person'
    name?: string
    url?: string
    logo?: string
    sameAs?: string[]
    // ... more identity fields
  }
}
```

---

### Link Checker Config

```typescript
interface LinkCheckerConfig {
  enabled?: boolean
  showLiveInspections?: boolean
  failOnError?: boolean
  excludeLinks?: string[]
  skipInspections?: Array<'external' | 'mailto' | 'tel'>
}
```

---

## Route Rules

Configure SEO per route:

```typescript
export default defineNuxtConfig({
  routeRules: {
    '/': {
      sitemap: {
        changefreq: 'daily',
        priority: 1.0
      }
    },
    '/admin/**': {
      robots: 'noindex, nofollow',
      sitemap: { exclude: true }
    }
  }
})
```

---

## Nuxt SEO Meta (useSeoMeta)

While not part of the 8 modules, `useSeoMeta` is commonly used:

```vue
<script setup>
useSeoMeta({
  title: 'Page Title',
  description: 'Page description',
  ogTitle: 'OG Title',
  ogDescription: 'OG Description',
  ogImage: 'https://example.com/og-image.png',
  ogUrl: 'https://example.com/page',
  twitterCard: 'summary_large_image',
  twitterSite: '@mysite',
  twitterCreator: '@author'
})
</script>
```

---

**Last Updated**: 2025-11-10
**Source**: Official Nuxt SEO documentation
