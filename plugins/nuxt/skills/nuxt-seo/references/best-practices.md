# Nuxt SEO Best Practices

**Complete guide to SEO best practices for Nuxt applications**

---

## Table of Contents

1. [Always Set Site Config](#1-always-set-site-config)
2. [Use Environment Variables](#2-use-environment-variables)
3. [Configure Robots for Staging](#3-configure-robots-for-staging)
4. [Generate Dynamic Sitemaps](#4-generate-dynamic-sitemaps)
5. [Optimize OG Images](#5-optimize-og-images)
6. [Add Schema.org to All Pages](#6-add-schemaorg-to-all-pages)
7. [Monitor Link Health](#7-monitor-link-health)
8. [Use Breadcrumbs](#8-use-breadcrumbs)

---

## 1. Always Set Site Config

**Why**: Site configuration is the foundation for all SEO modules. Every module relies on `site.url`, `site.name`, and other core settings.

```typescript
site: {
  url: process.env.NUXT_PUBLIC_SITE_URL,
  name: 'Your Site Name',
  description: 'Your site description',
  defaultLocale: 'en'
}
```

**Critical**: Without `site.url`, sitemaps, OG images, and Schema.org will not work correctly.

---

## 2. Use Environment Variables

**Why**: Different environments (development, staging, production) need different configurations. Never hardcode URLs.

```bash
# .env
NUXT_PUBLIC_SITE_URL=https://example.com
NUXT_PUBLIC_SITE_NAME=My Site
NUXT_PUBLIC_ENV=production
```

**Then reference in config**:

```typescript
export default defineNuxtConfig({
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: process.env.NUXT_PUBLIC_SITE_NAME
  }
})
```

---

## 3. Configure Robots for Staging

**Why**: Prevent staging/development sites from appearing in search results. This is a critical mistake that can harm your production SEO.

```typescript
robots: {
  disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : []
}
```

**Production**: Allows crawling
**Staging**: Blocks all crawling
**Development**: Can block all (optional)

---

## 4. Generate Dynamic Sitemaps

**Why**: Static sitemaps become outdated. Dynamic sitemaps automatically include new content from your CMS/database.

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

**Configure in nuxt.config.ts**:

```typescript
sitemap: {
  sitemaps: {
    posts: {
      sources: ['/api/__sitemap__/posts']
    }
  }
}
```

---

## 5. Optimize OG Images

**Why**: Large OG images slow down social sharing. Choose the right renderer and format for your needs.

```typescript
ogImage: {
  renderer: 'satori', // Faster, no runtime
  format: 'png',
  fonts: ['Inter:400', 'Inter:700']
}
```

**Satori** (recommended):
- Fast, zero runtime overhead
- Good for text-heavy designs
- Limited CSS support

**Chromium**:
- Full CSS support
- Slower, requires runtime
- Use for complex layouts

---

## 6. Add Schema.org to All Pages

**Why**: Structured data improves search appearance with rich snippets, knowledge panels, and enhanced results.

Every page should have appropriate structured data:

| Page Type | Schema Type |
|-----------|-------------|
| **Home** | Organization/Person |
| **Blog Posts** | BlogPosting/Article |
| **Products** | Product |
| **About** | Organization/Person |
| **Contact** | ContactPage |
| **FAQ** | FAQPage |
| **Events** | Event |

**Example for blog posts**:

```vue
<script setup>
useSchemaOrg([
  {
    '@type': 'BlogPosting',
    headline: 'How to Build Amazing Apps',
    author: {
      '@type': 'Person',
      name: 'Jane Doe'
    },
    datePublished: '2025-01-10',
    dateModified: '2025-01-11'
  }
])
</script>
```

---

## 7. Monitor Link Health

**Why**: Broken links harm SEO and user experience. Link checker catches issues during development and build.

```typescript
linkChecker: {
  enabled: true,
  showLiveInspections: true
}
```

**Development**: Shows warnings in console
**Build**: Can fail build on errors (optional)
**Production**: Should be disabled for performance

---

## 8. Use Breadcrumbs

**Why**: Breadcrumbs improve navigation and provide structured data for search engines.

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

**Benefits**:
- Better user navigation
- Rich snippets in search results
- Improved crawling efficiency

---

## Additional Best Practices

### Multi-Language SEO

For i18n sites:

```typescript
site: {
  defaultLocale: 'en',
  locales: ['en', 'es', 'fr']
}
```

### Performance

- Use `satori` renderer for OG images (faster)
- Enable sitemap caching for large sites
- Disable link checker in production

### Testing Checklist

Before deploying:

- [ ] `site.url` is set to production URL
- [ ] Staging robots.txt blocks crawling
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] OG images render correctly (test with [OpenGraph.xyz](https://opengraph.xyz))
- [ ] Schema.org validates (use [Google Rich Results Test](https://search.google.com/test/rich-results))
- [ ] No broken links in build output
- [ ] Breadcrumbs work on all pages
- [ ] Meta tags correct on all pages

---

**Last Updated**: 2025-11-27
