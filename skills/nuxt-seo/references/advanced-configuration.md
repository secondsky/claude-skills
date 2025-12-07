# Nuxt SEO Advanced Configuration

**Production-ready configuration examples for all Nuxt SEO modules**

---

## Table of Contents

1. [Complete nuxt.config.ts Example](#complete-nuxtconfigts-example)
2. [Multi-Environment Setup](#multi-environment-setup)
3. [Production Configuration](#production-configuration)
4. [Development Configuration](#development-configuration)
5. [Staging Configuration](#staging-configuration)

---

## Complete nuxt.config.ts Example

**Production-ready configuration with all 8 modules configured**:

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

### Why These Settings

- **Environment-based configuration** for multi-environment setups
- **Blocks staging from search engines** (critical for SEO)
- **Separate sitemaps** for different content types (blog, products, pages)
- **Automatic robots.txt generation** with sitemap reference
- **OG image optimization** with Satori renderer (fast, no runtime)
- **Link checking in development only** (prevents production overhead)
- **Route-specific SEO rules** for fine-grained control

---

## Multi-Environment Setup

### Environment Variables

Create `.env` files for each environment:

**.env (local development)**:
```bash
NUXT_PUBLIC_SITE_URL=http://localhost:3000
NUXT_PUBLIC_SITE_NAME=My Site (Dev)
NUXT_PUBLIC_ENV=development
```

**.env.staging**:
```bash
NUXT_PUBLIC_SITE_URL=https://staging.example.com
NUXT_PUBLIC_SITE_NAME=My Site (Staging)
NUXT_PUBLIC_ENV=staging
```

**.env.production**:
```bash
NUXT_PUBLIC_SITE_URL=https://example.com
NUXT_PUBLIC_SITE_NAME=My Site
NUXT_PUBLIC_ENV=production
```

### Dynamic Configuration Based on Environment

```typescript
// nuxt.config.ts
const isProduction = process.env.NUXT_PUBLIC_ENV === 'production'
const isStaging = process.env.NUXT_PUBLIC_ENV === 'staging'
const isDevelopment = process.env.NODE_ENV === 'development'

export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: process.env.NUXT_PUBLIC_SITE_NAME
  },

  robots: {
    // Block ALL crawling on staging
    disallow: isStaging ? ['/'] : ['/admin', '/private']
  },

  sitemap: {
    // Enable sitemap on production only
    enabled: isProduction,
    sitemaps: isProduction ? {
      pages: { includeAppSources: true },
      blog: { sources: ['/api/__sitemap__/blog'] }
    } : undefined
  },

  linkChecker: {
    // Enable link checking in development only
    enabled: isDevelopment,
    failOnError: false
  },

  ogImage: {
    // Use Chromium in development for full CSS support
    renderer: isDevelopment ? 'chromium' : 'satori'
  }
})
```

---

## Production Configuration

**Optimized for performance and SEO**:

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: 'https://example.com',
    name: 'My Awesome Site',
    description: 'Building amazing web experiences',
    defaultLocale: 'en',
    trailingSlash: false
  },

  robots: {
    disallow: ['/admin', '/private', '/api'],
    sitemap: 'https://example.com/sitemap.xml',
    cleanParam: ['utm_source', 'utm_medium', 'utm_campaign', 'ref']
  },

  sitemap: {
    strictNuxtContentPaths: true,
    sitemaps: {
      pages: { includeAppSources: true },
      blog: { sources: ['/api/__sitemap__/blog'] },
      products: { sources: ['/api/__sitemap__/products'] }
    },
    defaults: {
      changefreq: 'daily',
      priority: 0.7
    },
    exclude: ['/admin/**', '/private/**', '/api/**'],
    // For large sites: enable chunking
    chunksSize: 1000
  },

  ogImage: {
    renderer: 'satori', // Fast, no runtime
    format: 'png',
    quality: 90,
    fonts: ['Inter:400', 'Inter:700']
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Company',
      url: 'https://example.com',
      logo: 'https://example.com/logo.png',
      sameAs: [
        'https://twitter.com/mycompany',
        'https://facebook.com/mycompany'
      ]
    }
  },

  linkChecker: {
    enabled: false // Disable in production
  },

  routeRules: {
    '/': { sitemap: { changefreq: 'daily', priority: 1.0 } },
    '/blog/**': { sitemap: { changefreq: 'weekly', priority: 0.9 } },
    '/admin/**': { sitemap: { exclude: true }, robots: 'noindex, nofollow' }
  }
})
```

---

## Development Configuration

**Optimized for debugging and testing**:

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: 'http://localhost:3000',
    name: 'My Site (Dev)'
  },

  robots: {
    disallow: ['/'] // Block all in development
  },

  sitemap: {
    enabled: true,
    debug: true // Enable debug logging
  },

  ogImage: {
    renderer: 'chromium', // Full CSS support for testing
    debug: true
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Company (Dev)'
    }
  },

  linkChecker: {
    enabled: true,
    showLiveInspections: true,
    failOnError: false, // Warn but don't fail
    skipInspections: [] // Check all links
  }
})
```

---

## Staging Configuration

**Prevent search engine indexing while testing**:

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: 'https://staging.example.com',
    name: 'My Site (Staging)'
  },

  robots: {
    disallow: ['/'], // CRITICAL: Block all crawling
    sitemap: undefined // Don't expose sitemap on staging
  },

  sitemap: {
    enabled: false // Disable sitemap generation
  },

  ogImage: {
    renderer: 'satori',
    fonts: ['Inter:400', 'Inter:700']
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Company (Staging)'
    }
  },

  linkChecker: {
    enabled: true,
    failOnError: true // Catch broken links before production
  }
})
```

---

## Advanced Patterns

### Multi-Language Configuration

```typescript
site: {
  url: 'https://example.com',
  name: 'My Site',
  defaultLocale: 'en',
  locales: ['en', 'es', 'fr']
},

sitemap: {
  i18n: {
    locales: ['en', 'es', 'fr'],
    defaultLocale: 'en'
  }
}
```

### Custom Sitemap for Dynamic Routes

```typescript
// server/api/__sitemap__/blog.ts
export default defineSitemapEventHandler(async () => {
  const posts = await fetchAllPosts()

  return posts.map(post => ({
    loc: `/blog/${post.slug}`,
    lastmod: post.updatedAt,
    changefreq: 'weekly',
    priority: 0.9,
    images: post.images?.map(img => ({
      loc: img.url,
      caption: img.alt
    })),
    // Multi-language support
    alternatives: post.translations?.map(t => ({
      href: `/blog/${t.slug}`,
      hreflang: t.locale
    }))
  }))
})
```

### Route-Specific OG Images

```typescript
routeRules: {
  '/': {
    ogImage: {
      component: 'HomeOgImage'
    }
  },
  '/blog/**': {
    ogImage: {
      component: 'BlogOgImage'
    }
  },
  '/products/**': {
    ogImage: {
      component: 'ProductOgImage'
    }
  }
}
```

---

## Deployment Checklist

Before deploying to production:

- [ ] `NUXT_PUBLIC_SITE_URL` set to production URL
- [ ] `NUXT_PUBLIC_ENV` set to `production`
- [ ] Staging robots.txt blocks all crawling
- [ ] Sitemap enabled for production only
- [ ] Link checker disabled in production
- [ ] OG image renderer set to `satori` for performance
- [ ] Schema.org identity configured
- [ ] Test `/sitemap.xml` endpoint
- [ ] Test `/robots.txt` endpoint
- [ ] Verify OG images render correctly
- [ ] Submit sitemap to Google Search Console

---

**Last Updated**: 2025-11-27
