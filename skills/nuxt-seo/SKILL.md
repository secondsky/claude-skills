---
name: nuxt-seo
description: |
  Comprehensive guide for all 8 Nuxt SEO modules: @nuxtjs/seo, nuxt-robots, nuxt-sitemap, nuxt-og-image, nuxt-schema-org, nuxt-link-checker, nuxt-seo-utils, and nuxt-site-config. Use when building SEO-optimized Nuxt applications, implementing robots.txt and sitemaps, generating Open Graph images, adding Schema.org structured data, managing meta tags, checking links, or configuring site-wide SEO settings. Covers latest versions (v3+/v4+) with Bun/npm/pnpm package managers. Prevents common SEO configuration errors, sitemap generation issues, OG image rendering problems, and robots.txt misconfigurations.
license: MIT
keywords:
  # Core Technologies
  - nuxt
  - nuxt 3
  - nuxt 4
  - nuxt seo
  - vue
  - vue 3
  - seo
  - search engine optimization

  # All 8 Modules
  - "@nuxtjs/seo"
  - nuxt-robots
  - nuxt-sitemap
  - nuxt-og-image
  - nuxt-schema-org
  - nuxt-link-checker
  - nuxt-seo-utils
  - nuxt-site-config

  # SEO Features
  - robots.txt
  - sitemap
  - sitemap.xml
  - og image
  - open graph
  - social sharing
  - meta tags
  - schema.org
  - structured data
  - json-ld
  - canonical urls
  - breadcrumbs

  # Technical Features
  - bot detection
  - crawling
  - indexing
  - noindex
  - nofollow
  - xml sitemap
  - multiple sitemaps
  - sitemap index
  - dynamic sitemap
  - og image generation
  - satori
  - chromium rendering
  - vue templates

  # Use Cases
  - seo setup
  - seo configuration
  - meta management
  - social media preview
  - search optimization
  - link checking
  - broken links
  - site config
  - multi-language seo
  - i18n seo

  # Package Managers
  - bun
  - npm
  - pnpm

  # Common Errors Prevented
  - sitemap not generated
  - robots.txt missing
  - og image not rendering
  - schema validation errors
  - broken links
  - duplicate meta tags
  - canonical url issues
  - sitemap index errors

metadata:
  version: 1.0.0
  last_updated: 2025-11-10
  module_versions:
    nuxtjs_seo: 3.2.2
    nuxt_robots: 5.5.6
    nuxt_sitemap: 7.4.7
    nuxt_og_image: 5.1.12
    nuxt_schema_org: 5.0.9
    nuxt_link_checker: 4.3.6
    nuxt_seo_utils: 7.0.18
    nuxt_site_config: 3.2.11
  nuxt_compatibility: ">=3.0.0"
  auto_trigger_scenarios:
    - Setting up SEO in Nuxt project
    - Configuring robots.txt or sitemap
    - Generating Open Graph images
    - Adding Schema.org structured data
    - Managing meta tags and social sharing
    - Checking and fixing broken links
    - Implementing site-wide SEO configuration
---

# Nuxt SEO - Complete Guide to All 8 SEO Modules

**Status**: Production Ready
**Last Updated**: 2025-11-10
**Dependencies**: Nuxt >=3.0.0
**Latest Versions**: See module versions table below

Use this skill when building SEO-optimized Nuxt applications with any combination of the 8 official Nuxt SEO modules. This skill covers the complete Nuxt SEO ecosystem maintained by Harlan Wilton.

---

## Nuxt SEO Ecosystem Overview

Nuxt SEO consists of **8 specialized modules** that work together seamlessly:

| Module | Version | Downloads | Purpose |
|--------|---------|-----------|---------|
| **@nuxtjs/seo** | v3.2.2 | 1.8M | Primary SEO module (installs all 8 modules as bundle) |
| **nuxt-robots** | v5.5.6 | 7.1M | Manages robots.txt and bot detection |
| **nuxt-sitemap** | v7.4.7 | 8.6M | Generates XML sitemaps with advanced features |
| **nuxt-og-image** | v5.1.12 | 2.5M | Creates Open Graph images via Vue templates |
| **nuxt-schema-org** | v5.0.9 | 2.9M | Builds Schema.org structured data graphs |
| **nuxt-link-checker** | v4.3.6 | 2M | Finds and fixes broken links |
| **nuxt-seo-utils** | v7.0.18 | 1.1M | SEO utilities for discoverability & shareability |
| **nuxt-site-config** | v3.2.11 | 7.9M | Centralized site configuration management |

**Requirements**: Nuxt v3 or v4

---

## Quick Start (5 Minutes)

### 1. Install Complete SEO Bundle

Install all 8 modules at once:

```bash
# Using Bun (primary)
bunx nuxi module add @nuxtjs/seo

# Using npm (backup)
npx nuxi module add @nuxtjs/seo

# Using pnpm (backup)
pnpm dlx nuxi module add @nuxtjs/seo
```

**Why this matters:**
- Installs all 8 modules with a single command
- Ensures compatible versions across modules
- Provides best-practice defaults automatically

### 2. Configure Site Settings

Add to `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: 'https://example.com',
    name: 'My Awesome Site',
    description: 'Building amazing web experiences',
    defaultLocale: 'en'
  }
})
```

**CRITICAL:**
- Set `site.url` to production URL (required for sitemaps and canonical URLs)
- Use environment variable for multi-environment setups
- Set `defaultLocale` if using i18n

### 3. Restart and Verify

```bash
bun run dev
# or
npm run dev
```

Visit these URLs to verify:
- `http://localhost:3000/robots.txt` - Robots file
- `http://localhost:3000/sitemap.xml` - Sitemap

---

## Installation Options

### Option 1: Complete Bundle (Recommended)

```bash
bunx nuxi module add @nuxtjs/seo
# or: npx nuxi module add @nuxtjs/seo
```

Configuration:

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo']
})
```

### Option 2: Individual Modules

Install only what's needed:

```bash
# Bun
bunx nuxi module add nuxt-robots
bunx nuxi module add nuxt-sitemap
bunx nuxi module add nuxt-og-image

# npm
npx nuxi module add nuxt-robots
npx nuxi module add nuxt-sitemap
npx nuxi module add nuxt-og-image

# pnpm (backup)
pnpm dlx nuxi module add nuxt-robots
pnpm dlx nuxi module add nuxt-sitemap
pnpm dlx nuxi module add nuxt-og-image
```

Configuration:

```typescript
export default defineNuxtConfig({
  modules: [
    'nuxt-robots',
    'nuxt-sitemap',
    'nuxt-og-image'
  ]
})
```

---

## Module 1: @nuxtjs/seo (Primary SEO Module)

**Version**: v3.2.2 | **Downloads**: 1.8M | **Stars**: 1,296

### Purpose

Primary SEO module that provides foundational features and installs all 8 modules as a bundle when used.

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: 'https://example.com',
    name: 'My Awesome Site',
    description: 'Welcome to my awesome site!',
    defaultLocale: 'en'
  }
})
```

### Key Features

- Installs all 8 SEO modules with sensible defaults
- Provides unified configuration through `site` object
- Integrates with Nuxt Content for automatic SEO
- Handles meta tags, titles, and descriptions automatically

---

## Module 2: nuxt-robots (Robots.txt & Bot Detection)

**Version**: v5.5.6 | **Downloads**: 7.1M | **Stars**: 497

### Purpose

Manages robots crawling your site with minimal configuration and best practice defaults. Controls which pages search engines can crawl and provides bot detection capabilities.

### Basic Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-robots'],

  robots: {
    // Site-wide rules
    disallow: ['/admin', '/private'],

    // User-agent specific rules
    groups: [
      {
        userAgent: ['Googlebot'],
        allow: ['/'],
        disallow: ['/admin']
      },
      {
        userAgent: ['Bingbot'],
        allow: ['/']
      }
    ],

    // Sitemap reference
    sitemap: 'https://example.com/sitemap.xml',

    // Clean params for Yandex
    cleanParam: ['utm_source', 'utm_medium', 'utm_campaign']
  }
})
```

### Page-Level Control

```vue
<script setup>
// Block indexing on this page
defineRouteRules({
  robots: 'noindex, nofollow'
})

// Or use composable
useRobotsRule('noindex, nofollow')
</script>
```

### Bot Detection

**Server-side**:

```typescript
// server/api/example.ts
export default defineEventHandler((event) => {
  const botDetection = getBotDetection(event)

  if (botDetection.isBot) {
    console.log('Bot detected:', botDetection.name)
    // Serve optimized content for bots
  }
})
```

**Client-side**:

```vue
<script setup>
const { isBot, name } = useBotDetection()

if (isBot) {
  console.log('Bot detected:', name)
}
</script>
```

### APIs

- **`useRobotsRule(rule: string)`**: Set robots meta tag for current page
- **`useBotDetection()`**: Client-side bot detection
- **`getBotDetection(event)`**: Server-side bot detection
- **`getPathRobotConfig(path: string)`**: Get robots config for specific path
- **`getSiteRobotConfig()`**: Get site-wide robots config

### Common Patterns

**Development Mode - Block All**:

```typescript
robots: {
  disallow: process.env.NODE_ENV === 'development' ? ['/'] : []
}
```

**Staging Environment - Block Completely**:

```typescript
robots: {
  disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : []
}
```

---

## Module 3: nuxt-sitemap (XML Sitemap Generation)

**Version**: v7.4.7 | **Downloads**: 8.6M | **Stars**: 398

### Purpose

Powerfully flexible XML sitemaps that integrate seamlessly with your Nuxt app. Generates sitemaps automatically from routes with support for dynamic URLs, multiple sitemaps, media, and advanced optimization.

### Basic Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-sitemap'],

  site: {
    url: 'https://example.com'
  },

  sitemap: {
    // Automatically includes all routes
    strictNuxtContentPaths: true,

    // Exclude specific URLs
    exclude: [
      '/admin/**',
      '/private/**'
    ],

    // Default values for all URLs
    defaults: {
      changefreq: 'daily',
      priority: 0.7
    }
  }
})
```

### Multiple Sitemaps

```typescript
sitemap: {
  sitemaps: {
    pages: {
      includeAppSources: true
    },
    products: {
      sources: [
        '/api/__sitemap__/products'
      ]
    },
    blog: {
      sources: [
        '/api/__sitemap__/blog'
      ]
    }
  }
}
```

### Dynamic URLs from API

Create `/server/api/__sitemap__/products.ts`:

```typescript
export default defineSitemapEventHandler(async () => {
  const products = await fetchProducts()

  return products.map(product => ({
    loc: `/products/${product.slug}`,
    lastmod: product.updatedAt,
    changefreq: 'weekly',
    priority: 0.8,
    // Add images
    images: product.images.map(img => ({
      loc: img.url,
      caption: img.alt
    }))
  }))
})
```

### Sitemap Index (for large sites)

```typescript
sitemap: {
  sitemaps: true,
  chunksSize: 1000, // Split into chunks of 1000 URLs
}
```

Generates:
```
/sitemap_index.xml
/sitemap-0.xml
/sitemap-1.xml
/sitemap-2.xml
```

### Route Rules

```typescript
export default defineNuxtConfig({
  routeRules: {
    '/': { sitemap: { changefreq: 'daily', priority: 1.0 } },
    '/about': { sitemap: { changefreq: 'monthly', priority: 0.8 } },
    '/admin/**': { sitemap: { exclude: true } }
  }
})
```

### Media Support

**Images**:

```typescript
{
  loc: '/products/awesome-product',
  images: [
    {
      loc: 'https://example.com/images/product.jpg',
      caption: 'Product image',
      title: 'Awesome Product',
      geoLocation: 'New York, USA',
      license: 'https://example.com/license'
    }
  ]
}
```

**Videos**:

```typescript
{
  loc: '/videos/tutorial',
  videos: [
    {
      title: 'How to Use Our Product',
      description: 'A comprehensive tutorial',
      thumbnailLoc: 'https://example.com/thumb.jpg',
      contentLoc: 'https://example.com/video.mp4',
      duration: 600
    }
  ]
}
```

### Google Search Console Submission

After deploying:

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property
3. Navigate to **Sitemaps** in left menu
4. Enter sitemap URL: `https://example.com/sitemap.xml`
5. Click **Submit**

---

## Module 4: nuxt-og-image (Open Graph Image Generation)

**Version**: v5.1.12 | **Downloads**: 2.5M | **Stars**: 481

### Purpose

Generate Open Graph images dynamically using Vue templates. Creates beautiful social sharing previews for Twitter, Facebook, LinkedIn with zero runtime overhead.

### Basic Usage

```vue
<script setup>
defineOgImage({
  title: 'Welcome to My Site',
  description: 'Building amazing web experiences',
  theme: '#00DC82'
})
</script>

<template>
  <div>
    <h1>Welcome</h1>
  </div>
</template>
```

Generates: `https://example.com/__og-image__/og.png`

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-og-image'],

  ogImage: {
    // Rendering engine: 'satori' (default) or 'chromium'
    renderer: 'satori',

    // Image format: 'png' or 'jpeg'
    format: 'png',

    // Quality for JPEG (0-100)
    quality: 90,

    // Default component
    component: 'OgImage',

    // Custom fonts
    fonts: [
      'Inter:400',
      'Inter:700'
    ]
  }
})
```

### Vue Component Templates

Create `/components/OgImage.vue`:

```vue
<template>
  <div class="w-full h-full flex flex-col justify-between p-12 bg-gradient-to-br from-blue-500 to-purple-600">
    <div>
      <h1 class="text-6xl font-bold text-white mb-4">
        {{ title }}
      </h1>
      <p class="text-2xl text-white/90">
        {{ description }}
      </p>
    </div>

    <div class="flex items-center">
      <img v-if="logo" :src="logo" class="w-16 h-16 mr-4" />
      <div class="text-xl text-white">
        {{ siteName }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  siteName: String,
  logo: String
})
</script>
```

Use in page:

```vue
<script setup>
defineOgImageComponent('OgImage', {
  title: 'Custom OG Image',
  description: 'Built with Vue templates',
  siteName: 'My Awesome Site',
  logo: 'https://example.com/logo.png'
})
</script>
```

### Screenshot Mode

```vue
<script setup>
defineOgImageScreenshot({
  selector: '#og-preview', // CSS selector to capture
  width: 1200,
  height: 630
})
</script>

<template>
  <div>
    <div id="og-preview" class="hidden">
      <!-- Content to capture -->
      <h1>Page Title</h1>
    </div>

    <div>
      <!-- Actual page content -->
    </div>
  </div>
</template>
```

### Custom Fonts

```typescript
// nuxt.config.ts
ogImage: {
  fonts: [
    // Google Fonts
    'Inter:400',
    'Inter:700',
    'Roboto:400',

    // Local fonts
    {
      name: 'MyFont',
      weight: 400,
      path: '/fonts/myfont.ttf'
    }
  ]
}
```

### APIs

- **`defineOgImage(options)`**: Define OG image with options
- **`defineOgImageComponent(component, props)`**: Use Vue component
- **`defineOgImageScreenshot(options)`**: Capture screenshot

---

## Module 5: nuxt-schema-org (Schema.org Structured Data)

**Version**: v5.0.9 | **Downloads**: 2.9M | **Stars**: 176

### Purpose

Build Schema.org graphs for enhanced search results with rich snippets, knowledge panels, and better SEO.

### Basic Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-schema-org'],

  site: {
    url: 'https://example.com',
    name: 'My Awesome Site'
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Company',
      url: 'https://example.com',
      logo: 'https://example.com/logo.png'
    }
  }
})
```

### Usage in Pages

```vue
<script setup>
useSchemaOrg([
  {
    '@type': 'Article',
    headline: 'How to Build Amazing Web Apps',
    author: {
      '@type': 'Person',
      name: 'Jane Doe'
    },
    datePublished: '2025-01-10',
    dateModified: '2025-01-11',
    image: 'https://example.com/article-image.jpg',
    description: 'Learn how to build amazing web applications.'
  }
])
</script>
```

### Common Schema Types

**Organization**:

```typescript
useSchemaOrg([
  {
    '@type': 'Organization',
    name: 'My Company',
    url: 'https://example.com',
    logo: 'https://example.com/logo.png',
    sameAs: [
      'https://twitter.com/mycompany',
      'https://facebook.com/mycompany'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-123-4567',
      contactType: 'customer service'
    }
  }
])
```

**Product**:

```typescript
useSchemaOrg([
  {
    '@type': 'Product',
    name: 'Amazing Product',
    image: 'https://example.com/product.jpg',
    description: 'The best product ever made',
    brand: {
      '@type': 'Brand',
      name: 'My Brand'
    },
    offers: {
      '@type': 'Offer',
      url: 'https://example.com/products/amazing-product',
      priceCurrency: 'USD',
      price: '99.99',
      availability: 'https://schema.org/InStock'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127'
    }
  }
])
```

**FAQ**:

```typescript
useSchemaOrg([
  {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Nuxt?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Nuxt is a Vue.js framework for building web applications.'
        }
      }
    ]
  }
])
```

### APIs

- **`useSchemaOrg(nodes)`**: Add Schema.org structured data to page

---

## Module 6: nuxt-link-checker (Link Validation)

**Version**: v4.3.6 | **Downloads**: 2M | **Stars**: 95

### Purpose

Find and fix links that may negatively affect SEO. Detects broken links, redirects, and issues during development and build.

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-link-checker'],

  linkChecker: {
    enabled: true,
    showLiveInspections: true,
    failOnError: false,
    excludeLinks: [
      'https://example.com/temp/*'
    ],
    skipInspections: ['external']
  }
})
```

### Features

- Detects 404 (broken) links
- Identifies redirect chains
- Finds malformed URLs
- Checks internal and external links
- Validates anchor links (#hash)
- DevTools integration
- Build-time scanning

---

## Module 7: nuxt-seo-utils (SEO Utilities)

**Version**: v7.0.18 | **Downloads**: 1.1M | **Stars**: 113

### Purpose

SEO utilities for discoverability and shareability including canonical URLs, breadcrumbs, app icons, and Open Graph automation.

### Breadcrumb Utilities

```vue
<script setup>
const breadcrumbs = useBreadcrumbItems()
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

### APIs

- **`useBreadcrumbItems()`**: Generate breadcrumb navigation items

---

## Module 8: nuxt-site-config (Site Configuration)

**Version**: v3.2.11 | **Downloads**: 7.9M | **Stars**: 75

### Purpose

Centralized site configuration management for all SEO modules. Single source of truth for site-wide settings.

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-site-config'],

  site: {
    url: 'https://example.com',
    name: 'My Awesome Site',
    description: 'Building amazing web experiences',
    defaultLocale: 'en',
    identity: {
      type: 'Organization'
    },
    twitter: '@mysite',
    trailingSlash: false
  }
})
```

### Runtime Configuration

```vue
<script setup>
const siteConfig = useSiteConfig()

console.log(siteConfig.url) // https://example.com
console.log(siteConfig.name) // My Awesome Site
</script>
```

### APIs

- **`useSiteConfig()`**: Access site configuration
- **`updateSiteConfig(config)`**: Update site configuration
- **`createSitePathResolver()`**: Create path resolver with site URL
- **`useNitroOrigin()`**: Get origin URL server-side

---

## Integration Patterns

### Complete SEO Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: 'https://example.com',
    name: 'My Awesome Site',
    description: 'Building amazing experiences',
    defaultLocale: 'en'
  },

  robots: {
    disallow: ['/admin'],
    sitemap: 'https://example.com/sitemap.xml'
  },

  sitemap: {
    sitemaps: {
      pages: { includeAppSources: true },
      blog: { sources: ['/api/__sitemap__/blog'] }
    }
  },

  ogImage: {
    fonts: ['Inter:400', 'Inter:700']
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Company',
      logo: 'https://example.com/logo.png'
    }
  },

  linkChecker: {
    enabled: true,
    failOnError: false
  }
})
```

### Blog Page Example

```vue
<!-- pages/blog/[slug].vue -->
<script setup>
const route = useRoute()
const { data: post } = await useFetch(`/api/posts/${route.params.slug}`)

// SEO Meta
useSeoMeta({
  title: post.value.title,
  description: post.value.excerpt,
  ogTitle: post.value.title,
  ogDescription: post.value.excerpt,
  ogImage: post.value.coverImage,
  twitterCard: 'summary_large_image'
})

// OG Image
defineOgImageComponent('BlogPost', {
  title: post.value.title,
  author: post.value.author.name,
  date: post.value.publishedAt,
  image: post.value.coverImage
})

// Schema.org
useSchemaOrg([
  {
    '@type': 'BlogPosting',
    headline: post.value.title,
    image: post.value.coverImage,
    datePublished: post.value.publishedAt,
    dateModified: post.value.updatedAt,
    author: {
      '@type': 'Person',
      name: post.value.author.name
    },
    description: post.value.excerpt
  }
])
</script>
```

### E-commerce Product Page

```vue
<!-- pages/products/[id].vue -->
<script setup>
const route = useRoute()
const product = await fetchProduct(route.params.id)

// SEO Meta
useSeoMeta({
  title: `${product.name} - Buy Now`,
  description: product.description,
  ogImage: product.mainImage
})

// OG Image
defineOgImage({
  title: product.name,
  description: product.tagline,
  image: product.mainImage,
  price: `$${product.price}`
})

// Schema.org Product
useSchemaOrg([
  {
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average,
      reviewCount: product.rating.count
    }
  }
])
</script>
```

---

## Critical Rules

### Always Do

✅ Set `site.url` in nuxt.config.ts (required for sitemaps and canonical URLs)
✅ Use environment variables for multi-environment setups
✅ Configure robots.txt to block admin/private pages
✅ Add Schema.org structured data to all important pages
✅ Generate OG images for social sharing
✅ Test all SEO features before deploying to production
✅ Submit sitemap to Google Search Console after deployment
✅ Enable link checker during development

### Never Do

❌ Forget to set `site.url` (breaks sitemaps and canonical URLs)
❌ Allow crawling of staging environments
❌ Skip Schema.org for key pages (products, articles, events)
❌ Deploy without testing OG images
❌ Use outdated module versions
❌ Ignore broken links found by link checker
❌ Forget to exclude admin/private routes from sitemap
❌ Use wrong rendering engine for OG images (Chromium vs Satori)

---

## Known Issues Prevention

This skill prevents **10** documented common SEO mistakes:

### Issue #1: Sitemap Not Generating

**Error**: `/sitemap.xml` returns 404
**Why It Happens**: Missing `site.url` configuration
**Prevention**: Always set `site.url` in nuxt.config.ts

### Issue #2: robots.txt Missing

**Error**: `/robots.txt` not accessible
**Why It Happens**: Module not installed or misconfigured
**Prevention**: Install `nuxt-robots` and set `site.url`

### Issue #3: OG Images Not Rendering

**Error**: `/__og-image__/og.png` returns error
**Why It Happens**: Incompatible CSS with Satori renderer
**Prevention**: Use Satori-compatible CSS or switch to Chromium renderer

### Issue #4: Schema Validation Errors

**Error**: Invalid JSON-LD in page source
**Why It Happens**: Incorrect Schema.org structure
**Prevention**: Follow official Schema.org types and validate with Google's Rich Results Test

### Issue #5: Broken Internal Links

**Error**: 404 errors on internal links
**Why It Happens**: Links not updated after route changes
**Prevention**: Enable `nuxt-link-checker` during development

### Issue #6: Duplicate Meta Tags

**Error**: Multiple meta tags with same property
**Why It Happens**: Conflicting manual meta tags and module automation
**Prevention**: Let modules handle meta tags automatically

### Issue #7: Canonical URL Issues

**Error**: Wrong canonical URL in meta tags
**Why It Happens**: Incorrect `site.url` or missing trailing slash config
**Prevention**: Configure `site.url` and `trailingSlash` correctly

### Issue #8: Sitemap Index Errors

**Error**: Sitemap index XML malformed
**Why It Happens**: Too many URLs in single sitemap
**Prevention**: Use `chunksSize` option to split large sitemaps

### Issue #9: Crawling Staging Environment

**Error**: Staging site indexed by Google
**Why It Happens**: No robots.txt blocking
**Prevention**: Configure robots to block staging: `disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : []`

### Issue #10: Missing Social Sharing Images

**Error**: No preview image when sharing on social media
**Why It Happens**: OG image not defined or not accessible
**Prevention**: Use `defineOgImage()` on all important pages

---

## Configuration Files Reference

### nuxt.config.ts (Complete Example)

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://example.com',
    name: 'My Awesome Site',
    description: 'Building amazing web experiences',
    defaultLocale: 'en'
  },

  robots: {
    disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : ['/admin', '/private'],
    sitemap: `${process.env.NUXT_PUBLIC_SITE_URL}/sitemap.xml`,
    cleanParam: ['utm_source', 'utm_medium', 'utm_campaign']
  },

  sitemap: {
    strictNuxtContentPaths: true,
    sitemaps: {
      pages: {
        includeAppSources: true
      },
      blog: {
        sources: ['/api/__sitemap__/blog']
      },
      products: {
        sources: ['/api/__sitemap__/products']
      }
    },
    defaults: {
      changefreq: 'daily',
      priority: 0.7
    },
    exclude: ['/admin/**', '/private/**']
  },

  ogImage: {
    renderer: 'satori',
    format: 'png',
    fonts: [
      'Inter:400',
      'Inter:700'
    ]
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Company',
      url: process.env.NUXT_PUBLIC_SITE_URL,
      logo: `${process.env.NUXT_PUBLIC_SITE_URL}/logo.png`,
      sameAs: [
        'https://twitter.com/mycompany',
        'https://facebook.com/mycompany',
        'https://linkedin.com/company/mycompany'
      ]
    }
  },

  linkChecker: {
    enabled: process.env.NODE_ENV === 'development',
    showLiveInspections: true,
    failOnError: false,
    excludeLinks: ['/temp/*']
  },

  routeRules: {
    '/': { sitemap: { changefreq: 'daily', priority: 1.0 } },
    '/about': { sitemap: { changefreq: 'monthly', priority: 0.8 } },
    '/blog/**': { sitemap: { changefreq: 'weekly', priority: 0.9 } },
    '/admin/**': { sitemap: { exclude: true }, robots: 'noindex, nofollow' }
  }
})
```

**Why these settings:**
- Environment-based configuration for multi-environment setups
- Blocks staging from search engines
- Separate sitemaps for different content types
- Automatic robots.txt generation
- OG image optimization with Satori
- Link checking in development only
- Route-specific SEO rules

---

## Using Bundled Resources

### Scripts (scripts/)

**`init-nuxt-seo.sh`** - Quick setup script for new projects

```bash
./scripts/init-nuxt-seo.sh
```

Automatically:
- Installs @nuxtjs/seo module
- Creates basic nuxt.config.ts configuration
- Sets up example OG image component
- Creates sitemap API endpoint example

### References (references/)

**When Claude should load these**: When needing detailed API documentation or specific module configuration help.

- `references/modules-overview.md` - Detailed overview of all 8 modules
- `references/installation-guide.md` - Step-by-step installation patterns
- `references/api-reference.md` - Complete API documentation for all composables
- `references/common-patterns.md` - Real-world usage patterns and examples

### Assets (assets/)

- `assets/package-versions.json` - Current module versions for verification

---

## Best Practices

### 1. Always Set Site Config

```typescript
site: {
  url: process.env.NUXT_PUBLIC_SITE_URL,
  name: 'Your Site Name',
  description: 'Your site description',
  defaultLocale: 'en'
}
```

### 2. Use Environment Variables

```bash
# .env
NUXT_PUBLIC_SITE_URL=https://example.com
NUXT_PUBLIC_SITE_NAME=My Site
NUXT_PUBLIC_ENV=production
```

### 3. Configure Robots for Staging

```typescript
robots: {
  disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : []
}
```

### 4. Generate Dynamic Sitemaps

```typescript
// server/api/__sitemap__/posts.ts
export default defineSitemapEventHandler(async () => {
  const posts = await fetchAllPosts()
  return posts.map(post => ({
    loc: `/blog/${post.slug}`,
    lastmod: post.updatedAt
  }))
})
```

### 5. Optimize OG Images

```typescript
ogImage: {
  renderer: 'satori', // Faster, no runtime
  format: 'png',
  fonts: ['Inter:400', 'Inter:700']
}
```

### 6. Add Schema.org to All Pages

Every page should have appropriate structured data:
- **Home**: Organization/Person
- **Blog**: BlogPosting
- **Product**: Product
- **About**: Organization/Person
- **Contact**: ContactPage

### 7. Monitor Link Health

```typescript
linkChecker: {
  enabled: true,
  showLiveInspections: true
}
```

### 8. Use Breadcrumbs

```vue
<script setup>
const breadcrumbs = useBreadcrumbItems()

useSchemaOrg([
  {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.to
    }))
  }
])
</script>
```

---

## Troubleshooting

### Problem: Sitemap Not Generating

**Solution**:
1. Ensure `nuxt-sitemap` is installed
2. Set `site.url` in config
3. Restart dev server
4. Visit `http://localhost:3000/sitemap.xml`

### Problem: Robots.txt Not Working

**Solution**:
1. Ensure `nuxt-robots` is installed
2. Verify `site.url` is set
3. Clear `.nuxt` cache and restart

### Problem: OG Images Not Rendering

**Solution**:
1. Check if `nuxt-og-image` is installed
2. Verify fonts are accessible
3. For Satori: ensure CSS is compatible
4. For complex layouts: switch to Chromium renderer

### Problem: Schema.org Not Appearing

**Solution**:
1. Ensure `nuxt-schema-org` is installed
2. Check `useSchemaOrg()` is called in `<script setup>`
3. Inspect page source (View > Developer > View Source)

### Problem: Build Errors

**Solution**:
1. Update all modules to latest versions
2. Clear `.nuxt` and `node_modules/.cache`
3. Reinstall: `rm -rf node_modules && bun install`

---

## Package Versions (Verified 2025-11-10)

```json
{
  "dependencies": {
    "@nuxtjs/seo": "^3.2.2",
    "nuxt-robots": "^5.5.6",
    "nuxt-sitemap": "^7.4.7",
    "nuxt-og-image": "^5.1.12",
    "nuxt-schema-org": "^5.0.9",
    "nuxt-link-checker": "^4.3.6",
    "nuxt-seo-utils": "^7.0.18",
    "nuxt-site-config": "^3.2.11"
  }
}
```

---

## Complete Setup Checklist

Use this checklist to verify setup:

- [ ] Installed @nuxtjs/seo or individual modules
- [ ] Set `site.url` in nuxt.config.ts
- [ ] Configured `site.name` and `site.description`
- [ ] Set `defaultLocale` if using i18n
- [ ] Configured robots.txt to block admin/private pages
- [ ] Configured staging environment to block all crawling
- [ ] Created dynamic sitemap endpoints for content
- [ ] Added OG image to important pages
- [ ] Added Schema.org structured data to key pages
- [ ] Enabled link checker in development
- [ ] Tested `/robots.txt` endpoint
- [ ] Tested `/sitemap.xml` endpoint
- [ ] Verified OG images render correctly
- [ ] Submitted sitemap to Google Search Console
- [ ] Production build succeeds without errors

---

## Official Documentation

- **Nuxt SEO**: https://nuxtseo.com
- **@nuxtjs/seo**: https://nuxtseo.com/nuxt-seo/getting-started/installation
- **nuxt-robots**: https://nuxtseo.com/robots/getting-started/installation
- **nuxt-sitemap**: https://nuxtseo.com/sitemap/getting-started/installation
- **nuxt-og-image**: https://nuxtseo.com/og-image/getting-started/installation
- **nuxt-schema-org**: https://nuxtseo.com/schema-org/getting-started/installation
- **nuxt-link-checker**: https://nuxtseo.com/link-checker/getting-started/installation
- **GitHub**: https://github.com/harlan-zw

---

**Production Ready**: All patterns based on official documentation from https://nuxtseo.com/llms.txt | Last verified: 2025-11-10
