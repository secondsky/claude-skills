# Nuxt SEO v4 to v5 Migration Guide

Complete guide for upgrading from Nuxt SEO v4 to v5.

---

## Table of Contents

1. [Overview](#overview)
2. [Module Version Changes](#module-version-changes)
3. [Step 1: Address Site Config v4 (Critical)](#step-1-address-site-config-v4-critical)
4. [Step 2: Update Content v3 Composables](#step-2-update-content-v3-composables)
5. [Step 3: Update Server-Side APIs](#step-3-update-server-side-apis)
6. [Step 4: Update Pro Modules](#step-4-update-pro-modules)
7. [Step 5: Run Upgrade](#step-5-run-upgrade)
8. [Step 6: Verify](#step-6-verify)
9. [Breaking Changes Reference](#breaking-changes-reference)
10. [New Features in v5](#new-features-in-v5)

---

## Overview

Nuxt SEO v5 bumps every sub-module to a new major version (except OG Image, which stays on v6). The common thread is the **Site Config v4** dependency. Address those changes first to make the rest of the migration smooth.

**Full migration guide**: https://nuxtseo.com/docs/nuxt-seo/migration-guide/v4-to-v5

---

## Module Version Changes

| Module | v4 | v5 |
|--------|----|----|
| `nuxt-site-config` | v3 | **v4** |
| `nuxt-seo-utils` | v7 | **v8** |
| `@nuxtjs/sitemap` | v7 | **v8** |
| `@nuxtjs/robots` | v5 | **v6** |
| `nuxt-schema-org` | v5 | **v6** |
| `nuxt-link-checker` | v4 | **v5** |
| `nuxt-og-image` | v6 | v6 (no major change) |

---

## Step 1: Address Site Config v4 (Critical)

Site Config v4 is the biggest breaking change and affects ALL modules. Address this first.

### 1.1 Explicitly Set `site.name`

Site name is NO LONGER auto-inferred from `package.json` or project directory.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  site: {
    url: 'https://example.com',
    name: 'My Website', // REQUIRED - no longer auto-inferred
  }
})
```

Or via environment variable:
```
NUXT_SITE_NAME="My Website"
```

### 1.2 Replace Legacy Runtime Config Keys

```typescript
// BEFORE (v4)
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      siteUrl: 'https://example.com',
      siteName: 'My Site',
      siteDescription: 'My description'
    }
  }
})

// AFTER (v5)
export default defineNuxtConfig({
  site: {
    url: 'https://example.com',
    name: 'My Site',
    description: 'My description'
  }
})
```

### 1.3 Replace Server-Side `useSiteConfig(event)`

```typescript
// BEFORE (v4)
export default defineEventHandler((event) => {
  const config = useSiteConfig(event)
})

// AFTER (v5)
export default defineEventHandler((event) => {
  const config = getSiteConfig(event)
})
```

**Note**: Client-side `useSiteConfig()` is UNCHANGED. Only server-side usage changes.

### 1.4 Replace `getSiteIndexable()`

```typescript
// BEFORE (v4)
const indexable = getSiteIndexable(event)

// AFTER (v5)
const { indexable } = getSiteConfig(event)
```

### 1.5 Update Types

```typescript
// BEFORE (v4)
import type { SiteConfig } from 'nuxt-site-config'

// AFTER (v5)
import type { SiteConfigResolved } from 'nuxt-site-config'
```

---

## Step 2: Update Content v3 Composables

If using Nuxt Content v3 integration, update renamed composables:

```typescript
// Sitemap
// BEFORE
import { asSitemapCollection } from '#sitemap/content'
// AFTER
import { defineSitemapSchema } from '#sitemap/content'

// Schema.org
// BEFORE
import { asSchemaOrgCollection } from '#schema-org/content'
// AFTER
import { defineSchemaOrgSchema } from '#schema-org/content'

// Robots
// BEFORE
import { asRobotsCollection } from '#robots/content'
// AFTER
import { defineRobotsSchema } from '#robots/content'
```

Also deprecated: `asSeoCollection()` — migrate to individual schema composables.

---

## Step 3: Update Server-Side APIs

### Robots v6

- `robots:config` hook context now includes `warnings: string[]` alongside `errors: string[]`

### Sitemap v8

- `definePageMeta` now supports sitemap config:
  ```typescript
  definePageMeta({
    sitemap: {
      changefreq: 'daily',
      priority: 0.8,
    },
  })
  ```
- Custom sitemaps with `includeAppSources: true` are now auto-expanded per locale in i18n mode

### Schema.org v6

- `@id` URLs now respect `app.baseURL`
- Fixed SSR memory leak (reactive scopes not being disposed)

---

## Step 4: Update Pro Modules

### AI Ready (now MIT, v1.1.0)

```bash
npx nuxt module add nuxt-ai-ready
```

Breaking changes:
- `mdreamOptions.preset` replaced by top-level flags (`{ minimal: true }`)
- `cacheMaxAgeSeconds` renamed to `llmsTxtCacheSeconds`
- `BulkDocument` type renamed to `PageDocument`
- Hook renamed: `ai-ready:markdown` → `ai-ready:page:markdown`
- Auth: `?secret=` query param → `Authorization: Bearer` header

### Skew Protection (now MIT, v1.1.0)

```bash
npx nuxt module add nuxt-skew-protection
```

Breaking changes:
- Hook renamed: `skew-protection:chunks-outdated` → `skew:chunks-outdated`
- Composable renamed: `isOutdated` → `isAppOutdated`
- Config renamed: `bundlePreviousDeploymentChunks` → `bundleAssets`
- Route prefix changed: `/_skew/` → `/__skew/`
- New server utilities: `getClientVersion(event)`, `isClientOutdated(event)`

---

## Step 5: Run Upgrade

```bash
# Upgrade with deduplication
npx nuxt upgrade --dedupe

# Or manually:
npx nuxt module add seo
```

---

## Step 6: Verify

1. **Restart dev server**: `npm run dev`
2. **Check site name renders**: Verify `<title>` and `og:site_name` in page source
3. **Verify sitemap**: Visit `/sitemap.xml`
4. **Verify robots.txt**: Visit `/robots.txt`
5. **Test SSR**: Check server-rendered pages for correct meta tags
6. **Check for console warnings**: Look for deprecated API usage warnings
7. **Run production build**: `npm run build && npm run preview`
8. **Use debug endpoints**:
   - `/__robots__/debug-production.json`
   - `/__sitemap__/debug-production.json`
   - `/__nuxt-seo-utils`

---

## Breaking Changes Reference

### Removed APIs

| What | Replacement |
|------|-------------|
| Implicit `site.name` inference | Set `site.name` explicitly |
| `runtimeConfig.public.siteUrl` | `site.url` |
| `runtimeConfig.public.siteName` | `site.name` |
| `runtimeConfig.public.siteDescription` | `site.description` |
| `useSiteConfig(event)` (server) | `getSiteConfig(event)` |
| `getSiteIndexable(event)` | `{ indexable } = getSiteConfig(event)` |
| `SiteConfig` type | `SiteConfigResolved` |
| `#internal/nuxt-site-config` | Use public APIs |
| `asSitemapCollection()` | `defineSitemapSchema()` |
| `asSchemaOrgCollection()` | `defineSchemaOrgSchema()` |
| `asRobotsCollection()` | `defineRobotsSchema()` |
| `asSeoCollection()` | Use individual schema composables |

### Bug Fixes in v5

- **SSR Memory Leaks**: Schema.org reactive scopes and Site Config computed refs now properly disposed
- **i18n Fixes**: Sitemap base URL in multi-sitemap redirect, exclude filters with base URL/i18n prefixes
- **Schema.org**: `@id` URLs now respect `app.baseURL`, Nuxt context preserved in computed refs
- **Robots**: `skipSiteIndexable` now skips `Disallow: /` rules
- **SEO Utils**: Error pages preserve user-defined titles, `useServerSeoMeta` takes precedence

---

## New Features in v5

### DevTools Unity
Every module now shares a single DevTools foundation via `nuxtseo-layer-devtools`:
- Consistent layout and navigation across all modules
- Setup checklist that validates configuration across modules
- Built-in troubleshooting and update indicators
- Module switcher to jump between modules

### ESLint Link Checking
```typescript
import linkChecker from 'nuxt-link-checker/eslint'
export default [linkChecker]
```
Rules: `link-checker/valid-route` (error), `link-checker/valid-sitemap-link` (warn)

### Social Share Links
```typescript
const links = useShareLinks({
  title: 'Page title',
  twitter: { via: 'username', hashtags: ['tag'] },
  utm: { campaign: 'launch' },
})
```

### Favicon Generation CLI
```bash
npx nuxt-seo-utils icons --source logo.svg
```

### Inline Minification
```typescript
export default defineNuxtConfig({
  seo: { minify: true } // default
})
```

### definePageMeta Sitemap Config
```typescript
definePageMeta({
  sitemap: { changefreq: 'daily', priority: 0.8 }
})
```

### Debug Production Endpoints
- `/__robots__/debug-production.json`
- `/__sitemap__/debug-production.json`
- `/__nuxt-seo-utils`

### Site Config Priority Constants
```typescript
import { SiteConfigPriority } from 'site-config-stack'
updateSiteConfig({
  name: 'My Site',
  _priority: SiteConfigPriority.runtime,
})
```

### OG Image Security
- URL signing to prevent parameter tampering
- Prop whitelisting to prevent cache key DoS
- Strict mode with deprecated `html` prop

---

**Source**: https://nuxtseo.com/docs/nuxt-seo/migration-guide/v4-to-v5
**Last Updated**: 2026-03-30
