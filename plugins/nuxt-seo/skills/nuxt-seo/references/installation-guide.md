# Nuxt SEO - Installation Guide

Step-by-step installation patterns for all package managers.

---

## Table of Contents

1. [Quick Install (Recommended)](#quick-install-recommended)
2. [Individual Modules](#individual-modules)
3. [Scenario-Based Installation](#scenario-based-installation)
4. [Multi-Language Installation](#multi-language-installation)
5. [Environment-Based Installation](#environment-based-installation)
6. [Manual Package Installation](#manual-package-installation)
7. [Verification Steps](#verification-steps)
8. [Troubleshooting](#troubleshooting)
9. [Migration from Individual Modules](#migration-from-individual-modules)

---


## Quick Install (Recommended)

### Complete Bundle

Install all 8 modules at once:

```bash
# Recommended (v5)
npx nuxt module add seo

# Legacy command (still works)
npx nuxi module add @nuxtjs/seo
```

Add to `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo']
})
```

---

## Individual Modules

Install only what you need:

### Install Each Module

```bash
npx nuxt module add @nuxtjs/robots
npx nuxt module add @nuxtjs/sitemap
npx nuxt module add nuxt-og-image
npx nuxt module add nuxt-schema-org
npx nuxt module add nuxt-link-checker
npx nuxt module add nuxt-seo-utils
npx nuxt module add nuxt-site-config
```

### Configure in nuxt.config.ts

```typescript
export default defineNuxtConfig({
  modules: [
    'nuxt-site-config', // Base config (install first)
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    'nuxt-og-image',
    'nuxt-schema-org',
    'nuxt-link-checker',
    'nuxt-seo-utils'
  ]
})
```

---

## Scenario-Based Installation

### Blog Site

```bash
npx nuxt module add @nuxtjs/seo

# Or individually
npx nuxt module add @nuxtjs/robots
npx nuxt module add @nuxtjs/sitemap
npx nuxt module add nuxt-og-image
npx nuxt module add nuxt-schema-org
npx nuxt module add nuxt-site-config
```

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: 'My Blog', // Required in v5 - no longer auto-inferred
  },

  robots: {
    disallow: ['/admin', '/drafts']
  },

  sitemap: {
    sources: ['/api/__sitemap__/posts']
  },

  ogImage: {
    fonts: ['Inter:400', 'Inter:700']
  },

  schemaOrg: {
    identity: {
      type: 'Person',
      name: 'Your Name'
    }
  }
})
```

### E-commerce Site

```bash
npx nuxt module add @nuxtjs/seo
```

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: 'My Store'
  },

  sitemap: {
    sitemaps: {
      pages: { includeAppSources: true },
      products: { sources: ['/api/__sitemap__/products'] },
      categories: { sources: ['/api/__sitemap__/categories'] }
    }
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Company'
    }
  }
})
```

### Corporate Site

```bash
npx nuxt module add @nuxtjs/robots
npx nuxt module add @nuxtjs/sitemap
npx nuxt module add nuxt-og-image
npx nuxt module add nuxt-schema-org
npx nuxt module add nuxt-site-config
```

```typescript
export default defineNuxtConfig({
  modules: [
    'nuxt-site-config',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    'nuxt-og-image',
    'nuxt-schema-org'
  ],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: 'My Company'
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'My Company',
      logo: `${process.env.NUXT_PUBLIC_SITE_URL}/logo.png`,
      sameAs: [
        'https://twitter.com/mycompany',
        'https://linkedin.com/company/mycompany'
      ]
    }
  }
})
```

---

## Multi-Language Installation

```bash
npx nuxt module add @nuxtjs/seo
npx nuxt module add @nuxtjs/i18n
```

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo', '@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français' },
      { code: 'es', name: 'Español' }
    ],
    defaultLocale: 'en'
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    defaultLocale: 'en'
  }
})
```

---

## Environment-Based Installation

### Development

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  robots: {
    // Block all in development
    disallow: process.env.NODE_ENV === 'development' ? ['/'] : []
  },

  linkChecker: {
    // Enable in development only
    enabled: process.env.NODE_ENV === 'development',
    showLiveInspections: true
  }
})
```

### Staging

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  robots: {
    // Block staging from search engines
    disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : []
  },

  sitemap: {
    // Don't index staging in sitemap
    enabled: process.env.NUXT_PUBLIC_ENV !== 'staging'
  }
})
```

### Production

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL // Production URL
  },

  robots: {
    disallow: ['/admin'] // Only block admin
  },

  linkChecker: {
    enabled: false // Disable in production
  }
})
```

---

## Manual Package Installation

If `nuxi module add` doesn't work:

```bash
# Bun
bun add @nuxtjs/seo

# npm
npm install @nuxtjs/seo

# pnpm
pnpm add @nuxtjs/seo
```

Then add to `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo']
})
```

---

## Verification Steps

After installation:

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Verify robots.txt**:
   - Visit: `http://localhost:3000/robots.txt`
   - Should see generated robots.txt

3. **Verify sitemap**:
   - Visit: `http://localhost:3000/sitemap.xml`
   - Should see XML sitemap

4. **Check module loading**:
   ```bash
   # Should list all SEO modules
   npx nuxt info
   ```

5. **Test OG image**:
   - Add `defineOgImage()` to a page
   - Visit: `http://localhost:3000/__og-image__/og.png`

---

## Troubleshooting

### Module not found

```bash
# Clear cache and reinstall
rm -rf .nuxt node_modules/.cache
npm install
```

### robots.txt not generating

1. Check `site.url` is set in config
2. Verify `@nuxtjs/robots` is in modules array
3. Clear `.nuxt` cache

### Sitemap not generating

1. Check `site.url` is set
2. Verify `@nuxtjs/sitemap` is installed
3. Restart dev server

### Build errors

1. Update to latest versions:
   ```bash
   npm update @nuxtjs/seo
   ```

2. Clear cache:
   ```bash
   rm -rf .nuxt node_modules/.cache
   ```

3. Reinstall:
   ```bash
   rm -rf node_modules
npm install
   ```

---

## Migration from Individual Modules

If you have individual modules installed:

### Before
```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    'nuxt-og-image',
    'nuxt-schema-org'
  ]
})
```

### After (Recommended)
```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo']
})
```

Remove individual packages:
```bash
# Bun
bun remove @nuxtjs/robots @nuxtjs/sitemap nuxt-og-image nuxt-schema-org

# npm
npm uninstall @nuxtjs/robots @nuxtjs/sitemap nuxt-og-image nuxt-schema-org
```

Install bundle:
```bash
npx nuxt module add @nuxtjs/seo
```

---

**Last Updated**: 2026-03-30
**Package Manager**: npm (primary)
**Nuxt Version**: >= 3.0.0 or Nuxt 4.x
**v5 Install**: `npx nuxt module add seo`
