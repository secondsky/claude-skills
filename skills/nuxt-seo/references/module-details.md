
# Nuxt SEO Module Details

**Complete documentation for all 8 Nuxt SEO modules**

---

## Table of Contents

1. [Module 1: @nuxtjs/seo (Primary SEO Module)](#module-1-nuxtjsseo-primary-seo-module)
2. [Module 2: nuxt-robots (Robots.txt & Bot Detection)](#module-2-nuxt-robots-robotstxt--bot-detection)
3. [Module 3: nuxt-sitemap (XML Sitemap Generation)](#module-3-nuxt-sitemap-xml-sitemap-generation)
4. [Module 4: nuxt-og-image (Open Graph Image Generation)](#module-4-nuxt-og-image-open-graph-image-generation)
5. [Module 5: nuxt-schema-org (Schema.org Structured Data)](#module-5-nuxt-schema-org-schemaorg-structured-data)
6. [Module 6: nuxt-link-checker (Link Validation)](#module-6-nuxt-link-checker-link-validation)
7. [Module 7: nuxt-seo-utils (SEO Utilities)](#module-7-nuxt-seo-utils-seo-utilities)
8. [Module 8: nuxt-site-config (Site Configuration)](#module-8-nuxt-site-config-site-configuration)

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

**Last Updated**: 2025-11-27
