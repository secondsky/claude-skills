# Nuxt Content Integration - Complete Guide

Comprehensive guide for integrating Nuxt SEO modules with @nuxt/content v2 and v3.

---

## Table of Contents

1. [Overview](#overview)
2. [Module Load Order](#module-load-order)
3. [Content v3 Collections](#content-v3-collections)
4. [Content v2 Integration](#content-v2-integration)
5. [Sitemap Integration](#sitemap-integration)
6. [Schema.org Integration](#schemaorg-integration)
7. [OG Image Integration](#og-image-integration)
8. [Robots Integration](#robots-integration)
9. [Frontmatter Reference](#frontmatter-reference)
10. [Best Practices](#best-practices)

---

## Overview

Nuxt SEO modules integrate seamlessly with @nuxt/content, enabling frontmatter-based SEO configuration for markdown content.

### Key Benefits

- Define SEO metadata directly in content files
- Automatic sitemap generation from content
- Schema.org structured data from frontmatter
- OG images generated per content page
- Robots directives per content file

### Supported Versions

- **Content v3**: Full support with collection utilities
- **Content v2**: Full support with frontmatter keys

---

## Module Load Order

**CRITICAL**: SEO modules must be loaded BEFORE @nuxt/content.

```typescript
// nuxt.config.ts - CORRECT ORDER
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/seo',      // or individual SEO modules
    '@nuxt/content'     // MUST come after SEO modules
  ]
})

// Individual modules order
export default defineNuxtConfig({
  modules: [
    'nuxt-site-config',
    'nuxt-robots',
    'nuxt-sitemap',
    'nuxt-og-image',
    'nuxt-schema-org',
    'nuxt-seo-utils',
    '@nuxt/content'     // Always last
  ]
})
```

**Why Order Matters**: SEO modules need to register their content transformers before @nuxt/content initializes.

---

## Content v3 Collections

Content v3 introduced collections with dedicated SEO utilities.

### asSeoCollection()

Enables all SEO features for a collection:

```typescript
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { asSeoCollection } from '@nuxtjs/seo/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection(
      asSeoCollection({
        type: 'page',
        source: 'blog/**/*.md'
      })
    )
  }
})
```

**What it enables**:
- Sitemap entries for all collection pages
- Schema.org structured data
- OG image generation
- Robots directives
- SEO meta tags

### Individual Collection Utilities

Use specific utilities for granular control:

```typescript
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import {
  asSitemapCollection,
  asSchemaOrgCollection,
  asOgImageCollection,
  asRobotsCollection
} from '@nuxtjs/seo/content'

export default defineContentConfig({
  collections: {
    // Sitemap only
    pages: defineCollection(
      asSitemapCollection({
        type: 'page',
        source: 'pages/**/*.md'
      })
    ),

    // Schema.org only
    articles: defineCollection(
      asSchemaOrgCollection({
        type: 'page',
        source: 'articles/**/*.md'
      })
    ),

    // OG Image only
    products: defineCollection(
      asOgImageCollection({
        type: 'page',
        source: 'products/**/*.md'
      })
    ),

    // Robots only
    private: defineCollection(
      asRobotsCollection({
        type: 'page',
        source: 'private/**/*.md'
      })
    )
  }
})
```

---

## Content v2 Integration

Content v2 uses frontmatter keys directly in markdown files.

### Basic Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/seo',
    '@nuxt/content'
  ],

  site: {
    url: 'https://example.com'
  }
})
```

### Frontmatter Example

```markdown
---
title: My Blog Post
description: A comprehensive guide to Nuxt SEO
sitemap:
  lastmod: 2025-01-15
  changefreq: weekly
  priority: 0.8
schemaOrg:
  type: BlogPosting
  author:
    name: John Doe
ogImage:
  component: BlogPost
  props:
    author: John Doe
robots:
  index: true
  follow: true
---

# My Blog Post

Content here...
```

---

## Sitemap Integration

### Content v3 with asSitemapCollection

```typescript
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { asSitemapCollection } from '@nuxtjs/seo/content'

export default defineContentConfig({
  collections: {
    content: defineCollection(
      asSitemapCollection({
        type: 'page',
        source: '**/*.md'
      })
    )
  }
})
```

### Frontmatter Keys

```markdown
---
title: My Page
sitemap:
  loc: /custom-url        # Override URL
  lastmod: 2025-01-15     # Last modified date
  changefreq: weekly      # Change frequency
  priority: 0.8           # Priority (0.0-1.0)
  images:                 # Image sitemaps
    - loc: /images/hero.jpg
      title: Hero Image
  videos:                 # Video sitemaps
    - content_loc: /videos/intro.mp4
      title: Introduction
      thumbnail_loc: /images/thumb.jpg
---
```

### Exclude from Sitemap

```markdown
---
title: Private Page
sitemap: false
---
```

### Dynamic Sitemap Data

```typescript
// In page component
const { data: page } = await useAsyncData('page', () =>
  queryCollection('blog').path('/my-post').first()
)

// Sitemap data is automatically extracted from frontmatter
```

---

## Schema.org Integration

### Content v3 with asSchemaOrgCollection

```typescript
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { asSchemaOrgCollection } from '@nuxtjs/seo/content'

export default defineContentConfig({
  collections: {
    articles: defineCollection(
      asSchemaOrgCollection({
        type: 'page',
        source: 'articles/**/*.md'
      })
    )
  }
})
```

### Schema.org Frontmatter

```markdown
---
title: Product Review
schemaOrg:
  type: Article
  headline: Complete Product Review
  datePublished: 2025-01-15
  dateModified: 2025-01-20
  author:
    type: Person
    name: Jane Smith
    url: https://example.com/authors/jane
  publisher:
    type: Organization
    name: My Company
    logo: https://example.com/logo.png
---
```

### Schema.org Recipes

Pre-built schema configurations for common content types:

#### BlogPosting Recipe

```markdown
---
title: My Blog Post
schemaOrg:
  type: BlogPosting
  headline: My Blog Post Title
  description: Post description
  datePublished: 2025-01-15
  author:
    name: John Doe
  image: /images/blog-hero.jpg
---
```

#### Product Recipe

```markdown
---
title: Amazing Product
schemaOrg:
  type: Product
  name: Amazing Product
  description: Product description
  image: /images/product.jpg
  brand:
    name: My Brand
  offers:
    type: Offer
    price: 99.99
    priceCurrency: USD
    availability: InStock
  aggregateRating:
    ratingValue: 4.5
    reviewCount: 100
---
```

#### FAQ Recipe

```markdown
---
title: Frequently Asked Questions
schemaOrg:
  type: FAQPage
  mainEntity:
    - type: Question
      name: What is Nuxt SEO?
      acceptedAnswer:
        type: Answer
        text: Nuxt SEO is a collection of modules...
    - type: Question
      name: How do I install it?
      acceptedAnswer:
        type: Answer
        text: Run bunx nuxi module add @nuxtjs/seo
---
```

#### Event Recipe

```markdown
---
title: Tech Conference 2025
schemaOrg:
  type: Event
  name: Tech Conference 2025
  startDate: 2025-06-15T09:00:00
  endDate: 2025-06-17T18:00:00
  location:
    type: Place
    name: Convention Center
    address: 123 Main St, City
  offers:
    type: Offer
    price: 299
    priceCurrency: USD
    availability: InStock
    validFrom: 2025-01-01
---
```

### Using Schema in Templates

```vue
<script setup lang="ts">
const { data: article } = await useAsyncData('article', () =>
  queryCollection('articles').path('/my-article').first()
)

// Schema.org is automatically applied from frontmatter
// Or use useSchemaOrg for additional schema
useSchemaOrg([
  defineArticle({
    headline: article.value?.title,
    datePublished: article.value?.schemaOrg?.datePublished
  })
])
</script>
```

---

## OG Image Integration

### Content v3 with asOgImageCollection

```typescript
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { asOgImageCollection } from '@nuxtjs/seo/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection(
      asOgImageCollection({
        type: 'page',
        source: 'blog/**/*.md'
      })
    )
  }
})
```

### OG Image Frontmatter

```markdown
---
title: My Article
ogImage:
  component: BlogPost
  props:
    title: My Custom OG Title
    author: John Doe
    date: January 15, 2025
    coverImage: /images/cover.jpg
---
```

### Using Default Template

```markdown
---
title: Simple Page
description: Page description for OG image
ogImage: true
---
```

### Custom Component per Page

```markdown
---
title: Product Page
ogImage:
  component: ProductOgImage
  props:
    name: Amazing Product
    price: $99.99
    rating: 4.5
---
```

### Disable OG Image

```markdown
---
title: No OG Image Page
ogImage: false
---
```

### Static OG Image

```markdown
---
title: Page with Static Image
ogImage:
  url: /images/static-og.png
  width: 1200
  height: 630
  alt: Static OG Image
---
```

---

## Robots Integration

### Content v3 with asRobotsCollection

```typescript
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { asRobotsCollection } from '@nuxtjs/seo/content'

export default defineContentConfig({
  collections: {
    pages: defineCollection(
      asRobotsCollection({
        type: 'page',
        source: 'pages/**/*.md'
      })
    )
  }
})
```

### Robots Frontmatter

```markdown
---
title: Public Page
robots:
  index: true
  follow: true
---
```

### Noindex Page

```markdown
---
title: Private Page
robots:
  index: false
  follow: false
---
```

### Shorthand Syntax

```markdown
---
title: Noindex Page
robots: noindex, nofollow
---
```

### Additional Directives

```markdown
---
title: Advanced Robots
robots:
  index: true
  follow: true
  noarchive: true
  nosnippet: true
  noimageindex: true
  max-snippet: 150
  max-image-preview: large
  max-video-preview: -1
---
```

---

## Frontmatter Reference

### Complete Frontmatter Schema

```markdown
---
# Basic SEO
title: Page Title
description: Page description for meta tags

# Sitemap
sitemap:
  loc: /custom-url
  lastmod: 2025-01-15
  changefreq: daily | weekly | monthly | yearly | always | hourly | never
  priority: 0.8
  images:
    - loc: /image.jpg
      title: Image Title
      caption: Image Caption
      geo_location: New York, USA
      license: https://example.com/license
  videos:
    - content_loc: /video.mp4
      title: Video Title
      description: Video Description
      thumbnail_loc: /thumb.jpg
      duration: 600
      publication_date: 2025-01-15
      family_friendly: yes
      live: no

# Schema.org
schemaOrg:
  type: Article | BlogPosting | Product | FAQPage | Event | Recipe | etc.
  # Type-specific properties...

# OG Image
ogImage:
  component: ComponentName
  props:
    key: value
  # Or static image
  url: /static-image.png
  width: 1200
  height: 630
  alt: Alt text

# Robots
robots:
  index: true | false
  follow: true | false
  noarchive: true | false
  nosnippet: true | false
  noimageindex: true | false
  max-snippet: number
  max-image-preview: none | standard | large
  max-video-preview: number | -1
---
```

---

## Best Practices

### 1. Use asSeoCollection for Most Cases

```typescript
// Enables all SEO features with one utility
export default defineContentConfig({
  collections: {
    blog: defineCollection(
      asSeoCollection({
        type: 'page',
        source: 'blog/**/*.md'
      })
    )
  }
})
```

### 2. Set Defaults in Config

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ogImage: {
    defaults: {
      component: 'DefaultOgImage'
    }
  },

  sitemap: {
    defaults: {
      changefreq: 'weekly',
      priority: 0.7
    }
  }
})
```

### 3. Use Type-Safe Frontmatter

```typescript
// types/content.d.ts
declare module '@nuxt/content' {
  interface ContentFrontmatter {
    sitemap?: {
      lastmod?: string
      changefreq?: string
      priority?: number
    }
    schemaOrg?: {
      type: string
      [key: string]: any
    }
    ogImage?: {
      component?: string
      props?: Record<string, any>
    } | boolean
    robots?: {
      index?: boolean
      follow?: boolean
    } | string
  }
}
```

### 4. Organize Content by Type

```
content/
├── blog/           # Blog posts with BlogPosting schema
├── products/       # Product pages with Product schema
├── docs/           # Documentation (no schema)
└── pages/          # General pages
```

### 5. Handle Missing Frontmatter

```vue
<script setup lang="ts">
const { data: page } = await useAsyncData('page', () =>
  queryCollection('pages').path(route.path).first()
)

// Provide fallbacks
useSeoMeta({
  title: page.value?.title || 'Default Title',
  description: page.value?.description || 'Default description'
})
</script>
```

### 6. Preview OG Images in Dev

Use Nuxt DevTools OG Image Playground to preview generated images for content pages.

---

## Troubleshooting

### Module Order Error

**Symptom**: Frontmatter SEO keys not working

**Solution**: Ensure SEO modules load before @nuxt/content

### Collection Not Found

**Symptom**: asSeoCollection not available

**Solution**:
1. Update to latest @nuxtjs/seo
2. Import from correct path: `@nuxtjs/seo/content`

### Sitemap Missing Content Pages

**Symptom**: Content pages not in sitemap

**Solution**:
1. Use asSitemapCollection or asSeoCollection
2. Check `sitemap: false` not set in frontmatter
3. Verify module order

### Schema.org Not Generated

**Symptom**: No structured data in page source

**Solution**:
1. Use asSchemaOrgCollection or asSeoCollection
2. Verify schemaOrg frontmatter syntax
3. Check for schema validation errors in DevTools

---

## Official Documentation

- **Nuxt Content**: https://content.nuxt.com
- **Nuxt SEO + Content**: https://nuxtseo.com/docs/nuxt-seo/guides/nuxt-content
- **Sitemap + Content**: https://nuxtseo.com/docs/sitemap/guides/content
- **Schema.org + Content**: https://nuxtseo.com/docs/schema-org/guides/content
- **OG Image + Content**: https://nuxtseo.com/docs/og-image/integrations/content
- **Robots + Content**: https://nuxtseo.com/docs/robots/advanced/content
