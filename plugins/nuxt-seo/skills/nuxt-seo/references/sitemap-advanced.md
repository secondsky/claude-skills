# Nuxt Sitemap - Advanced Guide

Comprehensive guide to advanced sitemap features including dynamic URLs, multi-sitemaps, images/videos, i18n, and performance optimization.

---

## Table of Contents

1. [Dynamic URL Endpoints](#dynamic-url-endpoints)
2. [Multi Sitemaps](#multi-sitemaps)
3. [Images, Videos, and News](#images-videos-and-news)
4. [I18n Integration](#i18n-integration)
5. [Prerendering](#prerendering)
6. [Performance Optimization](#performance-optimization)
7. [Caching Strategies](#caching-strategies)
8. [Zero Runtime Mode](#zero-runtime-mode)

---

## Dynamic URL Endpoints

Generate sitemap URLs dynamically from APIs or CMS at runtime.

### External XML Sitemaps

Reference existing XML sitemaps directly:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sources: [
      'https://example.com/sitemap.xml'
    ]
  }
})
```

### API Sources with Authentication

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sources: [
      // Unauthenticated endpoint
      'https://api.example.com/pages/urls',
      // Authenticated endpoint with headers
      [
        'https://authenticated-api.example.com/pages/urls',
        { headers: { Authorization: 'Bearer <token>' } }
      ]
    ]
  }
})
```

### Custom Sitemap Event Handler

Create type-safe sitemap endpoints using `defineSitemapEventHandler`:

```typescript
// server/api/__sitemap__/urls.ts
import { defineSitemapEventHandler } from '#imports'
import type { SitemapUrlInput } from '#sitemap/types'

export default defineSitemapEventHandler(() => {
  return [
    {
      loc: '/about-us',
      _sitemap: 'pages',  // Assign to specific sitemap
    },
  ] satisfies SitemapUrlInput[]
})
```

### WordPress Integration Example

```typescript
// server/api/__sitemap__/wordpress.ts
import { defineSitemapEventHandler } from '#imports'

export default defineSitemapEventHandler(async () => {
  const posts = await $fetch('https://api.example.com/wp-json/wp/v2/posts')

  return posts.map(post => ({
    // Transform external URL to your domain
    loc: `/blog/${post.slug}`,  // NOT post.link
    lastmod: post.modified,
    changefreq: 'weekly',
    priority: 0.7,
  }))
})
```

### Dynamic i18n URLs

```typescript
// server/api/__sitemap__/urls.ts
import { defineSitemapEventHandler } from '#imports'
import type { SitemapUrl } from '#sitemap/types'

export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig()
  const locales = config.public.i18n.locales.map(locale => locale.code)
  const isoLocales = Object.fromEntries(
    config.public.i18n.locales.map(locale => ([locale.code, locale.iso]))
  )

  const apiQueries = locales.map(locale =>
    $fetch(`${config.public.apiEndpoint}/sitemap/${locale}/products`)
  )

  const sitemaps = await Promise.all(apiQueries)

  return sitemaps.flat().map(entry => ({
    _sitemap: isoLocales[entry.locale],
    loc: `${config.public.siteUrl}/${entry.locale}/product/${entry.url}`,
    alternatives: entry.alternates?.map(alt => ({
      hreflang: isoLocales[alt.locale],
      href: `${config.public.siteUrl}/${alt.locale}/product/${alt.url}`
    }))
  } satisfies SitemapUrl))
})
```

### Pre-Encoded URLs

If your API returns already-encoded URLs:

```typescript
// server/api/__sitemap__/urls.ts
import { defineSitemapEventHandler } from '#imports'

export default defineSitemapEventHandler(async () => {
  const urls = await $fetch<{ path: string }[]>('https://api.example.com/pages')
  // e.g. [{ path: '/products/%24pecial-offer' }]

  return urls.map(url => ({
    loc: url.path,
    _encoded: true,  // Prevent double-encoding
  }))
})
```

### Register Custom Endpoint

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sources: [
      '/api/__sitemap__/urls'
    ]
  }
})
```

---

## Multi Sitemaps

Split your sitemap into multiple files for better organization and performance.

### Manual Chunking

Best for sites with clear content types:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sitemaps: {
      posts: {
        include: ['/blog/**'],
        defaults: { priority: 0.7 },
      },
      pages: {
        exclude: ['/blog/**']
      },
    },
  },
})
```

### Automatic Chunking

Best for sites with 1000+ URLs without clear types:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sitemaps: true,
    defaultSitemapsChunkSize: 2000  // default: 1000
  },
})
```

### Custom Sitemap URLs

Remove the `/__sitemap__/` prefix:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sitemapsPathPrefix: '/',  // or false
    sitemaps: {
      ['sitemap-foo']: {
        // Available at /sitemap-foo.xml
      }
    }
  }
})
```

### Extending App Sources

Filter existing URLs into different sitemaps:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sitemaps: {
      pages: {
        includeAppSources: true,
        exclude: ['/blog/**'],
      },
      posts: {
        includeAppSources: true,
        include: ['/blog/**'],
      },
    },
  },
})
```

### Using _sitemap Key

Direct URLs to specific sitemaps:

```typescript
// server/api/sitemap-urls.ts
export default defineSitemapEventHandler(() => {
  return [
    {
      loc: '/about-us',
      _sitemap: 'pages',  // Goes to pages sitemap
    }
  ]
})
```

### Chunking Large Sources

Split large sources automatically:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sitemaps: {
      posts: {
        sources: ['/api/posts'],  // Returns 10,000 posts
        chunks: true,  // Default chunk size: 1000
      },
      products: {
        sources: ['/api/products'],  // Returns 50,000 products
        chunks: 5000,  // Custom chunk size
      },
    }
  },
})
```

**Generated files:**
- `/sitemap_index.xml`
- `/posts-0.xml`, `/posts-1.xml`, ...
- `/products-0.xml`, `/products-1.xml`, ...

### External Sitemaps in Index

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sitemaps: {
      posts: { /* ... */ },
      pages: { /* ... */ },
      // Add external sitemap to index
      index: [
        { sitemap: 'https://www.google.com/sitemap-pages.xml' }
      ]
    }
  }
})
```

---

## Images, Videos, and News

Add rich media to sitemap entries for enhanced search visibility.

### Sitemap Images

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    urls: [
      {
        loc: '/blog/my-post',
        images: [
          {
            loc: 'https://example.com/image.jpg',
            caption: 'My image caption',
            geo_location: 'New York, USA',
            title: 'My image title',
            license: 'https://example.com/license',
          }
        ]
      }
    ]
  }
})
```

### Automatic Image Discovery

Images are discovered automatically when:
- Page is prerendered
- Images are inside `<main>` tag

```typescript
// Disable if not needed
export default defineNuxtConfig({
  sitemap: {
    discoverImages: false
  }
})
```

### Sitemap Videos

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    urls: [
      {
        loc: '/blog/my-post',
        videos: [
          {
            title: 'My video title',
            thumbnail_loc: 'https://example.com/video.jpg',
            description: 'My video description',
            content_loc: 'https://example.com/video.mp4',
            player_loc: 'https://example.com/player',
            duration: 600,
            expiration_date: '2025-12-31',
            rating: 4.2,
            view_count: 1000,
            publication_date: '2025-01-15',
            family_friendly: true,
            restriction: {
              relationship: 'allow',
              country: 'US',
            },
            platform: {
              relationship: 'allow',
              platform: 'web',
            },
            price: [
              {
                price: 1.99,
                currency: 'USD',
                type: 'rent',
              }
            ],
            requires_subscription: false,
            uploader: {
              uploader: 'Channel Name',
              info: 'https://example.com/channel',
            },
            live: false,
            tag: ['tutorial', 'nuxt'],
          }
        ]
      }
    ]
  }
})
```

### Automatic Video Discovery

Videos inside `<main>` with data attributes:

```html
<video
  controls
  poster="https://example.com/thumb.jpg"
  width="620"
  data-title="Video Title"
  data-description="Video description for sitemap"
  data-rating="4.5"
  data-view-count="1000"
  data-publication-date="2025-01-15"
  data-family-friendly="yes"
>
  <source src="https://example.com/video.mp4" type="video/mp4" />
</video>
```

### News Sitemaps

For Google News:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    urls: [
      {
        loc: '/news/nuxt-sitemap-turns-6',
        news: [
          {
            title: 'Nuxt Sitemap Turns 6',
            publication_date: '2025-01-15',
            publication: {
              name: 'Nuxt SEO News',
              language: 'en',
            },
          }
        ]
      }
    ]
  }
})
```

---

## I18n Integration

Automatic integration with @nuxtjs/i18n and nuxt-i18n-micro.

### Automatic Multi Sitemap

Generated automatically when:
- Not using `no_prefix` strategy
- Or using Different Domains
- Haven't manually configured `sitemaps`

```
./sitemap_index.xml
./en-sitemap.xml
./fr-sitemap.xml
```

### _i18nTransform

Automatically generate URLs for all locales:

```typescript
// server/api/__sitemap__/urls.ts
export default defineSitemapEventHandler(() => {
  return [
    {
      loc: '/about-us',
      _i18nTransform: true,  // Creates /en/about-us, /fr/about-us, etc.
    }
  ]
})
```

### Custom Path Translations

If using i18n pages configuration:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  i18n: {
    pages: {
      'about': {
        en: '/about',
        fr: '/a-propos',
        es: '/acerca-de',
      },
    },
  },
})
```

With `_i18nTransform: true`:
- `/about` (en)
- `/fr/a-propos` (fr)
- `/es/acerca-de` (es)

### Specific Locale Assignment

```typescript
export default defineSitemapEventHandler(() => {
  return [
    {
      loc: '/about-us',
      _sitemap: 'en',  // Only in English sitemap
    }
  ]
})
```

### Debug Hreflang

Show hreflang counts in UI:

```typescript
// nuxt.config.ts
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

## Prerendering

Extract sitemap data from prerendered HTML.

### Extracted Data

When pages are prerendered:
- **images**: From `<img>` tags inside `<main>`
- **videos**: From `<video>` tags inside `<main>`
- **lastmod**: From `article:modified_time` and `article:published_time` meta tags

### Enable Prerendering

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  }
})
```

Or with route rules:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true }
  }
})
```

### Prerender Sitemap on Build

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/sitemap.xml']
    }
  }
})
```

### Custom Prerender Data

Extract YouTube videos from iframes:

```typescript
// nuxt.config.ts
import type { ResolvedSitemapUrl } from '#sitemap/types'

export default defineNuxtConfig({
  modules: [
    (_, nuxt) => {
      nuxt.hooks.hook('nitro:init', async (nitro) => {
        nitro.hooks.hook('prerender:generate', async (route) => {
          const html = route.contents
          const matches = html.match(/<iframe.*?youtube.com\/embed\/(.*?)".*?<\/iframe>/g)

          if (matches) {
            const sitemap = route._sitemap || {} as ResolvedSitemapUrl
            sitemap.videos = sitemap.videos || []

            for (const match of matches) {
              const videoId = match.match(/youtube.com\/embed\/(.*?)"/)[1]
              sitemap.videos.push({
                title: 'YouTube Video',
                description: 'A video from YouTube',
                content_loc: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail_loc: `https://img.youtube.com/vi/${videoId}/0.jpg`,
              })
            }
            route._sitemap = sitemap
          }
        })
      })
    },
  ],
})
```

---

## Performance Optimization

Optimize sitemap generation for large sites.

### Named Sitemap Chunks

Split by content type for parallel generation:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sitemaps: {
      posts: {
        sources: ['https://api.example.com/urls']
      },
    },
  },
})
```

### Paginated Sources

For very large datasets:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    sitemaps: {
      posts2020: {
        sources: ['https://api.example.com/urls?filter[yearCreated]=2020']
      },
      posts2021: {
        sources: ['https://api.example.com/urls?filter[yearCreated]=2021']
      },
      posts2022: {
        sources: ['https://api.example.com/urls?filter[yearCreated]=2022']
      },
    },
  },
})
```

### Experimental Options

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    experimentalCompression: true,  // Gzip and stream sitemap
    experimentalWarmUp: true,       // Create sitemaps on Nitro start
  }
})
```

---

## Caching Strategies

### Default Caching

SWR caching enabled in production (10 minutes default).

### Custom Cache Time

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    cacheMaxAgeSeconds: 3600  // 1 hour
  }
})
```

### Disable Caching

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    cacheMaxAgeSeconds: 0
  }
})
```

### Custom Cache Driver

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    runtimeCacheStorage: {
      driver: 'cloudflare-kv-binding',
      binding: 'SITEMAP_CACHE'
    }
  }
})
```

---

## Zero Runtime Mode

Generate sitemaps at build time for zero server overhead.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    zeroRuntime: true
  }
})
```

**Benefits:**
- ~50KB reduction in server bundle
- Static file serving
- No runtime generation

**Requirements:**
- URLs only change on deploy
- All pages must be prerenderable

---

## TypeScript Interfaces

### SitemapUrl

```typescript
interface SitemapUrl {
  loc: string
  lastmod?: string | Date
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  images?: ImageEntry[]
  videos?: VideoEntry[]
  news?: GoogleNewsEntry[]
  alternatives?: AlternativeEntry[]
  _sitemap?: string
  _i18nTransform?: boolean
  _encoded?: boolean
}

interface ImageEntry {
  loc: string
  caption?: string
  geo_location?: string
  title?: string
  license?: string
}

interface VideoEntry {
  title: string
  thumbnail_loc: string
  description: string
  content_loc?: string
  player_loc?: string
  duration?: number
  expiration_date?: Date | string
  rating?: number
  view_count?: number
  publication_date?: Date | string
  family_friendly?: boolean | 'yes' | 'no'
  restriction?: { relationship: 'allow' | 'deny', country: string }
  platform?: { relationship: 'allow' | 'deny', platform: string }
  price?: { price: number | string, currency: string, type: string }[]
  requires_subscription?: boolean | 'yes' | 'no'
  uploader?: { uploader: string, info?: string }
  live?: boolean | 'yes' | 'no'
  tag?: string | string[]
}

interface GoogleNewsEntry {
  title: string
  publication_date: Date | string
  publication: {
    name: string
    language: string
  }
}
```

---

## Official Documentation

- **Sitemap Module**: https://nuxtseo.com/docs/sitemap/getting-started/introduction
- **Dynamic URLs**: https://nuxtseo.com/docs/sitemap/guides/dynamic-urls
- **Multi Sitemaps**: https://nuxtseo.com/docs/sitemap/guides/multi-sitemaps
- **Images/Videos**: https://nuxtseo.com/docs/sitemap/advanced/images-videos
- **I18n**: https://nuxtseo.com/docs/sitemap/guides/i18n
- **Performance**: https://nuxtseo.com/docs/sitemap/advanced/performance
- **GitHub**: https://github.com/nuxt-modules/sitemap
