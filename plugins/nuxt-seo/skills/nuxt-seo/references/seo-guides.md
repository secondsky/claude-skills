# Nuxt SEO - Comprehensive SEO Guides

Essential SEO implementation guides for Nuxt applications. Load this reference when implementing specific SEO features beyond basic module configuration.

---

## Table of Contents

1. [Rendering Modes for SEO](#rendering-modes-for-seo)
2. [JSON-LD Structured Data](#json-ld-structured-data)
3. [Canonical URLs](#canonical-urls)
4. [IndexNow & Indexing APIs](#indexnow--indexing-apis)
5. [Twitter Cards](#twitter-cards)
6. [Social Sharing & Open Graph](#social-sharing--open-graph)
7. [Meta Robots Tags](#meta-robots-tags)
8. [URL Structure Best Practices](#url-structure-best-practices)
9. [Rich Results & Search Features](#rich-results--search-features)
10. [Debugging Vue SEO Issues](#debugging-vue-seo-issues)

---

## Rendering Modes for SEO

### Overview

Search engines need HTML content to index pages. Different rendering modes affect SEO differently.

### Rendering Mode Comparison

| Mode | SEO Rating | Use Case | Configuration |
|------|-----------|----------|---------------|
| **SSR** (Server-Side Rendering) | Excellent | Dynamic content, personalization | Default in Nuxt |
| **SSG** (Static Site Generation) | Excellent | Content sites, blogs | `nuxt generate` |
| **SPA** (Single Page Application) | Poor | Admin panels, internal apps | `ssr: false` |
| **Hybrid** | Optimal | Mixed content types | `routeRules` |
| **ISR** (Incremental Static Regeneration) | Excellent | High-traffic dynamic sites | `swr` or `isr` |

### SSR Configuration (Default)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // SSR is enabled by default
  ssr: true
})
```

**Pros**: Full SEO support, dynamic content, personalization
**Cons**: Server load, TTFB varies

### SSG Configuration

```bash
# Generate static site
bun run generate
# or: npx nuxt generate
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true
    }
  }
})
```

**Pros**: Best performance, CDN-cacheable, no server needed
**Cons**: Build time for large sites, stale content

### Hybrid Rendering with routeRules

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Static pages - pre-rendered at build
    '/': { prerender: true },
    '/about': { prerender: true },
    '/blog/**': { prerender: true },

    // ISR - regenerate every hour
    '/products/**': { swr: 3600 },

    // SSR - always fresh
    '/dashboard/**': { ssr: true },
    '/api/**': { cors: true },

    // SPA - client-only (no SEO needed)
    '/admin/**': { ssr: false }
  }
})
```

### ISR (Incremental Static Regeneration)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Stale-While-Revalidate: serve stale, regenerate in background
    '/products/**': {
      swr: 3600,  // Revalidate after 1 hour
      cache: {
        maxAge: 60,
        staleMaxAge: 3600
      }
    },

    // ISR with specific TTL
    '/blog/**': {
      isr: 600  // Regenerate every 10 minutes
    }
  }
})
```

### SPA Mode (Avoid for Public Pages)

```typescript
// nuxt.config.ts - Only for internal apps
export default defineNuxtConfig({
  ssr: false  // Disables SSR completely
})
```

**Warning**: SPA mode means search engines see empty HTML. Only use for:
- Admin dashboards
- Internal tools
- Apps behind authentication

---

## JSON-LD Structured Data

### What is JSON-LD?

JSON-LD (JavaScript Object Notation for Linked Data) is Google's preferred format for structured data. It enables rich results in search.

### Using nuxt-schema-org

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-schema-org'],

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Company',
      url: 'https://example.com',
      logo: 'https://example.com/logo.png',
      sameAs: [
        'https://twitter.com/mycompany',
        'https://linkedin.com/company/mycompany'
      ]
    }
  }
})
```

### Article Schema

```vue
<script setup>
// pages/blog/[slug].vue
const { data: article } = await useAsyncData(() =>
  queryContent(`/blog/${route.params.slug}`).findOne()
)

useSchemaOrg([
  defineArticle({
    '@type': 'BlogPosting',
    headline: article.value.title,
    description: article.value.description,
    image: article.value.image,
    datePublished: article.value.createdAt,
    dateModified: article.value.updatedAt,
    author: {
      '@type': 'Person',
      name: article.value.author.name,
      url: article.value.author.url
    }
  })
])
</script>
```

### Product Schema (E-commerce)

```vue
<script setup>
// pages/products/[id].vue
useSchemaOrg([
  defineProduct({
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'My Store'
      }
    },
    aggregateRating: product.reviews?.length ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviews.length
    } : undefined
  })
])
</script>
```

### FAQ Schema

```vue
<script setup>
// pages/faq.vue
const faqs = [
  { question: 'How do I...?', answer: 'You can...' },
  { question: 'What is...?', answer: 'It is...' }
]

useSchemaOrg([
  defineFAQPage({
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  })
])
</script>
```

### Local Business Schema

```vue
<script setup>
useSchemaOrg([
  defineLocalBusiness({
    '@type': 'Restaurant', // or Store, Dentist, etc.
    name: 'My Restaurant',
    image: 'https://example.com/photo.jpg',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Main St',
      addressLocality: 'City',
      addressRegion: 'State',
      postalCode: '12345',
      addressCountry: 'US'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 40.7128,
      longitude: -74.0060
    },
    telephone: '+1-555-555-5555',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00'
      }
    ],
    priceRange: '$$'
  })
])
</script>
```

### Breadcrumb Schema

```vue
<script setup>
const breadcrumbs = useBreadcrumbItems()

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.to
    }))
  })
])
</script>
```

---

## Canonical URLs

### Why Canonical URLs Matter

Canonical URLs tell search engines which version of a page is the "master" copy. This prevents duplicate content issues from:
- URL parameters (`?utm_source=...`)
- Trailing slashes (`/page` vs `/page/`)
- Protocol differences (`http` vs `https`)
- Case variations (`/Page` vs `/page`)

### Automatic Canonical with nuxt-seo

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: 'https://example.com',
    trailingSlash: false  // Consistent URL format
  }
})
```

### Manual Canonical Override

```vue
<script setup>
// For paginated content - point to first page
useHead({
  link: [
    { rel: 'canonical', href: 'https://example.com/products' }
  ]
})

// Or use useSeoMeta
useSeoMeta({
  canonicalUrl: 'https://example.com/products'
})
</script>
```

### Handling URL Parameters

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Ignore tracking parameters for canonical
    '/products/**': {
      seoMeta: {
        // Canonical will strip query params by default
      }
    }
  }
})
```

### Self-Referencing Canonicals

Every page should have a canonical that points to itself:

```vue
<script setup>
const route = useRoute()
const siteConfig = useSiteConfig()

// Self-referencing canonical
useHead({
  link: [
    {
      rel: 'canonical',
      href: `${siteConfig.url}${route.path}`
    }
  ]
})
</script>
```

### Cross-Domain Canonical

For syndicated content:

```vue
<script setup>
// When republishing content from another site
useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://original-source.com/original-article'
    }
  ]
})
</script>
```

---

## IndexNow & Indexing APIs

### What is IndexNow?

IndexNow is a protocol for instantly notifying search engines (Bing, Yandex) about content changes. Supported by:
- Bing
- Yandex
- Seznam
- Naver
- **NOT Google** (Google has its own Indexing API)

### Setup with nuxt-seo

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  // IndexNow is auto-configured with sitemap
  sitemap: {
    enabled: true
  }
})
```

### Manual IndexNow Implementation

```typescript
// server/utils/indexnow.ts
const INDEXNOW_KEY = process.env.INDEXNOW_KEY

export async function notifyIndexNow(urls: string[]) {
  const host = 'https://example.com'

  await $fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${host}/${INDEXNOW_KEY}.txt`,
      urlList: urls
    }
  })
}
```

```typescript
// server/api/publish.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Save content...

  // Notify search engines
  await notifyIndexNow([`https://example.com/blog/${body.slug}`])

  return { success: true }
})
```

### Google Indexing API

Google requires OAuth2 and only works for:
- Job postings
- Livestream videos
- (Limited to specific content types)

```typescript
// server/utils/google-indexing.ts
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/indexing']
})

export async function requestGoogleIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED') {
  const indexing = google.indexing({ version: 'v3', auth })

  await indexing.urlNotifications.publish({
    requestBody: {
      url,
      type
    }
  })
}
```

### Best Practices

1. **Batch requests**: Don't notify for every small change
2. **Rate limits**: IndexNow allows 10,000 URLs/day
3. **Sitemap first**: Ensure sitemap is submitted to search consoles
4. **Monitor**: Check indexing status in Google/Bing webmaster tools

---

## Twitter Cards

### Important: Twitter Cards Don't Inherit from OG

Twitter requires its own meta tags. Unlike Facebook, Twitter does NOT fall back to Open Graph for all properties.

### Required Twitter Card Meta Tags

```vue
<script setup>
useSeoMeta({
  // Required
  twitterCard: 'summary_large_image',
  twitterTitle: 'Page Title',
  twitterDescription: 'Page description',
  twitterImage: 'https://example.com/image.jpg',

  // Optional but recommended
  twitterSite: '@yourhandle',      // Your site's Twitter
  twitterCreator: '@authorhandle', // Content creator's Twitter

  // For apps
  // twitterAppIdIphone: '...',
  // twitterAppIdGoogleplay: '...'
})
</script>
```

### Card Types

| Type | Image Size | Use Case |
|------|-----------|----------|
| `summary` | 120x120 min | Short content, profiles |
| `summary_large_image` | 300x157 min, 4096x4096 max | Articles, products |
| `player` | - | Video/audio content |
| `app` | - | Mobile app promotion |

### Twitter Card with OG Fallback Pattern

```vue
<script setup>
const title = 'My Page Title'
const description = 'My page description'
const image = 'https://example.com/og-image.jpg'

useSeoMeta({
  // Open Graph (Facebook, LinkedIn, etc.)
  ogTitle: title,
  ogDescription: description,
  ogImage: image,

  // Twitter (explicit, no inheritance)
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: image
})
</script>
```

### Testing Twitter Cards

1. Use Twitter Card Validator: https://cards-dev.twitter.com/validator
2. Check that image loads (HTTPS required)
3. Verify no robots blocking (`noindex` blocks card preview)

---

## Social Sharing & Open Graph

### Open Graph Basics

Open Graph (OG) is the standard for social media previews on Facebook, LinkedIn, Discord, Slack, and more.

### Essential OG Tags

```vue
<script setup>
useSeoMeta({
  // Required
  ogTitle: 'Page Title',
  ogDescription: 'Compelling description',
  ogImage: 'https://example.com/og-image.jpg',
  ogUrl: 'https://example.com/page',
  ogType: 'website', // or 'article', 'product'

  // Recommended
  ogSiteName: 'My Site',
  ogLocale: 'en_US'
})
</script>
```

### Image Requirements

| Platform | Minimum | Recommended | Max File Size |
|----------|---------|-------------|---------------|
| Facebook | 200x200 | 1200x630 | 8MB |
| LinkedIn | 1200x627 | 1200x627 | 5MB |
| Twitter | 300x157 | 1200x600 | 5MB |
| Discord | 256x256 | 1200x630 | 8MB |

### Dynamic OG Images with nuxt-og-image

```vue
<script setup>
// pages/blog/[slug].vue
const { data: article } = await useAsyncData(...)

defineOgImage({
  component: 'BlogPost',
  title: article.value.title,
  description: article.value.description,
  backgroundImage: article.value.coverImage
})
</script>
```

### Article-Specific OG Tags

```vue
<script setup>
useSeoMeta({
  ogType: 'article',
  ogTitle: article.title,
  ogDescription: article.excerpt,
  ogImage: article.coverImage,

  // Article-specific
  articlePublishedTime: article.publishedAt,
  articleModifiedTime: article.updatedAt,
  articleAuthor: article.author.name,
  articleSection: article.category,
  articleTag: article.tags.join(', ')
})
</script>
```

### Platform Cache Times

| Platform | Cache Duration | Force Refresh |
|----------|---------------|---------------|
| Facebook | ~24 hours | Facebook Sharing Debugger |
| LinkedIn | ~7 days | LinkedIn Post Inspector |
| Twitter | ~7 days | Twitter Card Validator |
| Discord | Varies | Change URL or wait |

### Debugging Tools

- **Facebook**: https://developers.facebook.com/tools/debug/
- **LinkedIn**: https://www.linkedin.com/post-inspector/
- **Twitter**: https://cards-dev.twitter.com/validator
- **General**: https://metatags.io/

---

## Meta Robots Tags

### Understanding Robots Directives

```vue
<script setup>
useSeoMeta({
  // Common combinations
  robots: 'index, follow',        // Default - index and follow links
  robots: 'noindex, follow',      // Don't index, but follow links
  robots: 'index, nofollow',      // Index, but don't follow links
  robots: 'noindex, nofollow',    // Don't index or follow
  robots: 'none',                 // Same as noindex, nofollow

  // Advanced directives
  robots: 'noarchive',            // Don't show cached version
  robots: 'nosnippet',            // Don't show snippet in results
  robots: 'max-snippet:150',      // Limit snippet length
  robots: 'max-image-preview:large', // Control image preview size
  robots: 'max-video-preview:-1'  // Allow full video preview
})
</script>
```

### Using nuxt-robots Module

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-robots'],

  robots: {
    // Global rules
    disallow: ['/admin', '/api', '/private'],
    allow: ['/api/public'],

    // User-agent specific
    groups: [
      {
        userAgent: ['Googlebot', 'Bingbot'],
        allow: ['/'],
        disallow: ['/admin']
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/']  // Block AI crawlers
      }
    ]
  }
})
```

### Page-Level Robots Control

```vue
<script setup>
// Block specific page from indexing
useRobotsRule('noindex, nofollow')

// Or with useSeoMeta
useSeoMeta({
  robots: 'noindex, nofollow'
})
</script>
```

### Route-Based Robots Rules

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/admin/**': {
      robots: 'noindex, nofollow'
    },
    '/search': {
      robots: 'noindex, follow'  // Don't index search results
    },
    '/user/**': {
      robots: 'noindex'  // User profiles
    }
  }
})
```

### X-Robots-Tag for Non-HTML Files

```typescript
// server/middleware/robots-headers.ts
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  // Block indexing of PDFs in certain directories
  if (path.startsWith('/private/') && path.endsWith('.pdf')) {
    setHeader(event, 'X-Robots-Tag', 'noindex')
  }
})
```

### Common Patterns

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Staging environment - block all
    ...(process.env.NODE_ENV !== 'production' && {
      '/**': { robots: 'noindex, nofollow' }
    }),

    // Paginated content - noindex after page 1
    '/blog/page/**': { robots: 'noindex, follow' },

    // Filter/facet pages - noindex
    '/products': { robots: 'index, follow' },
    '/products?*': { robots: 'noindex, follow' },

    // Thank you / confirmation pages
    '/thank-you': { robots: 'noindex' },
    '/order-confirmation': { robots: 'noindex' }
  }
})
```

---

## URL Structure Best Practices

### Key Principles

1. **Use hyphens, not underscores**: `/my-page` not `/my_page`
2. **Lowercase only**: `/products` not `/Products`
3. **Keep URLs short**: Under 60 characters ideal
4. **Be descriptive**: `/blue-running-shoes` not `/product-123`
5. **Use path segments**: `/category/subcategory/item` not `/item?cat=...`

### URL Structure Examples

```
Good URLs:
/products/running-shoes
/blog/2024/seo-best-practices
/services/web-development

Bad URLs:
/products?id=123&color=blue
/p/123
/blog/post.php?id=456
/Services/Web_Development
```

### Nuxt Route Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  site: {
    url: 'https://example.com',
    trailingSlash: false  // Consistent: /page not /page/
  },

  // Redirects for URL changes
  routeRules: {
    '/old-page': { redirect: '/new-page' },
    '/blog/old-slug': { redirect: '/blog/new-slug' },

    // Redirect patterns
    '/products/:id': { redirect: '/shop/:id' }
  }
})
```

### Dynamic Route Slugs

```vue
<!-- pages/blog/[slug].vue -->
<script setup>
// Ensure slug is URL-friendly
const route = useRoute()
const slug = route.params.slug

// Validate slug format
if (!/^[a-z0-9-]+$/.test(slug)) {
  throw createError({ statusCode: 404, message: 'Page not found' })
}
</script>
```

### Generating SEO-Friendly Slugs

```typescript
// utils/slug.ts
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
    .replace(/\s+/g, '-')             // Spaces to hyphens
    .replace(/-+/g, '-')              // Multiple hyphens to single
    .replace(/^-|-$/g, '')            // Trim hyphens
    .slice(0, 60)                     // Limit length
}
```

### Handling URL Changes (301 Redirects)

```typescript
// server/middleware/redirects.ts
const redirects: Record<string, string> = {
  '/old-url': '/new-url',
  '/products/old-product': '/products/new-product'
}

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  if (redirects[path]) {
    return sendRedirect(event, redirects[path], 301)
  }
})
```

---

## Rich Results & Search Features

### Types of Rich Results

| Type | Schema Required | Benefit |
|------|----------------|---------|
| **FAQ** | FAQPage | Expandable Q&A in results |
| **How-to** | HowTo | Step-by-step with images |
| **Recipe** | Recipe | Cooking time, ratings, image |
| **Product** | Product | Price, availability, reviews |
| **Review** | Review | Star ratings in results |
| **Event** | Event | Date, location, tickets |
| **Job Posting** | JobPosting | Salary, location, apply button |
| **Video** | VideoObject | Thumbnail, duration in results |
| **Breadcrumb** | BreadcrumbList | Navigation path in results |

### Testing Rich Results

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema Markup Validator**: https://validator.schema.org/

### Recipe Rich Result Example

```vue
<script setup>
useSchemaOrg([
  defineRecipe({
    name: 'Chocolate Chip Cookies',
    description: 'Classic homemade chocolate chip cookies',
    image: 'https://example.com/cookies.jpg',
    author: {
      '@type': 'Person',
      name: 'Chef Name'
    },
    prepTime: 'PT15M',
    cookTime: 'PT12M',
    totalTime: 'PT27M',
    recipeYield: '24 cookies',
    recipeCategory: 'Dessert',
    recipeCuisine: 'American',
    recipeIngredient: [
      '2 cups flour',
      '1 cup sugar',
      '1 cup chocolate chips'
    ],
    recipeInstructions: [
      {
        '@type': 'HowToStep',
        text: 'Preheat oven to 375°F'
      },
      {
        '@type': 'HowToStep',
        text: 'Mix dry ingredients'
      }
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      ratingCount: 127
    }
  })
])
</script>
```

### Event Rich Result Example

```vue
<script setup>
useSchemaOrg([
  defineEvent({
    name: 'Tech Conference 2024',
    description: 'Annual technology conference',
    startDate: '2024-06-15T09:00',
    endDate: '2024-06-17T18:00',
    location: {
      '@type': 'Place',
      name: 'Convention Center',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Main St',
        addressLocality: 'San Francisco',
        addressRegion: 'CA',
        postalCode: '94102'
      }
    },
    image: 'https://example.com/event.jpg',
    offers: {
      '@type': 'Offer',
      price: '299',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: '2024-01-01',
      url: 'https://example.com/tickets'
    },
    performer: {
      '@type': 'Person',
      name: 'Keynote Speaker'
    },
    organizer: {
      '@type': 'Organization',
      name: 'Tech Events Inc',
      url: 'https://example.com'
    }
  })
])
</script>
```

---

## Debugging Vue SEO Issues

### Common Issues and Solutions

#### 1. Meta Tags Not Rendering

**Problem**: SEO meta tags appear in Vue DevTools but not in page source.

**Solution**: Ensure SSR is enabled and use proper composables.

```vue
<script setup>
// Correct - runs on server
useSeoMeta({
  title: 'Page Title',
  description: 'Description'
})

// Wrong - only runs on client
onMounted(() => {
  document.title = 'Page Title'  // Don't do this!
})
</script>
```

#### 2. Async Data in Meta Tags

**Problem**: Meta tags show loading state or undefined.

**Solution**: Use `useAsyncData` with proper await.

```vue
<script setup>
// Correct
const { data } = await useAsyncData('page', () => fetchPage())

useSeoMeta({
  title: data.value?.title,
  description: data.value?.description
})

// Wrong - data might not be ready
const data = ref(null)
fetchPage().then(d => data.value = d)

useSeoMeta({
  title: data.value?.title  // Could be null!
})
</script>
```

#### 3. Duplicate Meta Tags

**Problem**: Same meta tag appears multiple times.

**Solution**: Use `key` or consistent naming.

```vue
<script setup>
// In app.vue or layout
useHead({
  title: 'Default Title',
  meta: [
    { name: 'description', content: 'Default description' }
  ]
})

// In page - will override, not duplicate
useSeoMeta({
  title: 'Page Title',
  description: 'Page description'
})
</script>
```

#### 4. OG Image Not Showing

**Problem**: Social media preview shows no image.

**Debugging Steps**:
1. Check image URL is absolute (includes domain)
2. Verify image is accessible (no auth required)
3. Image must be HTTPS
4. Check image dimensions (min 200x200)
5. Clear platform cache (use debugger tools)

```vue
<script setup>
const config = useSiteConfig()

// Always use absolute URLs for OG images
useSeoMeta({
  ogImage: `${config.url}/images/og-image.jpg`
})
</script>
```

#### 5. Schema.org Validation Errors

**Problem**: Rich results test shows errors.

**Solution**: Ensure required fields are present.

```vue
<script setup>
// Product schema - common missing fields
useSchemaOrg([
  defineProduct({
    name: product.name,         // Required
    image: product.image,       // Required - must be absolute URL
    description: product.desc,  // Recommended
    offers: {
      '@type': 'Offer',
      price: product.price,     // Required
      priceCurrency: 'USD',     // Required
      availability: 'https://schema.org/InStock'  // Required
    }
  })
])
</script>
```

### Debugging Tools

```bash
# View rendered HTML
curl -s https://your-site.com | grep -A5 '<title>'

# Check meta tags
curl -s https://your-site.com | grep -E '<meta'

# Validate structured data
# Use: https://search.google.com/test/rich-results
```

### Vue DevTools SEO Tab

Install Vue DevTools browser extension to inspect:
- `useHead()` values
- `useSeoMeta()` values
- `useSchemaOrg()` output

---

**Last Updated**: 2025-12-28
**Source**: https://nuxtseo.com/learn-seo

