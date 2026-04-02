---
name: nuxt-seo
description: Nuxt SEO v5 modules (robots, sitemap, og-image, schema-org, link-checker, seo-utils, site-config). Use when implementing SEO, robots.txt, sitemaps, Schema.org, or meta tags in Nuxt apps.
license: MIT
metadata:
  version: 4.0.0
  last_updated: 2026-04-02
  module_versions:
    nuxtjs_seo: 5.1.0
    @nuxtjs/robots: 6.0.6
    @nuxtjs/sitemap: 8.0.11
    nuxt_og_image: 6.3.1
    nuxt_schema_org: 6.0.4
    nuxt_link_checker: 5.0.6
    nuxt_seo_utils: 8.1.4
    nuxt_site_config: 4.0.7
  nuxt_compatibility: ">=3.0.0"
  auto_trigger_scenarios:
    - Setting up SEO in Nuxt project
    - Configuring robots.txt or sitemap
    - Generating Open Graph images
    - Adding Schema.org structured data
    - Managing meta tags and social sharing
    - Checking and fixing broken links
    - Implementing site-wide SEO configuration
    - Implementing Twitter Cards or Open Graph
    - Setting up canonical URLs
    - Configuring rendering modes (SSR/SSG/ISR)
    - Using IndexNow for instant indexing
    - Implementing rich results with JSON-LD
    - Setting up multilanguage/i18n SEO
    - Configuring SEO route rules
    - Migrating from Nuxt SEO v4 to v5
---

# Nuxt SEO v5

**Status**: Production Ready | **Dependencies**: Nuxt >=3.0.0

Use this skill when building SEO-optimized Nuxt applications with any combination of the 8 official Nuxt SEO modules plus standalone modules.

---

## Quick Start (5 Minutes)

### 1. Install Complete SEO Bundle

```bash
# Recommended (v5)
npx nuxt module add @nuxtjs/seo
```

### 2. Configure Site Settings

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

**CRITICAL (v5 Breaking Change):**
- `site.name` is NO LONGER auto-inferred from `package.json` — set it explicitly
- Set `site.url` to production URL (required for sitemaps and canonical URLs)
- Set `defaultLocale` if using i18n

### 3. Restart and Verify

Visit these URLs to verify:
- `/robots.txt` - Robots file
- `/sitemap.xml` - Sitemap
- `/__robots__/debug-production.json` - Debug (v5)
- `/__sitemap__/debug-production.json` - Debug (v5)

### Individual Module Install

```bash
npx nuxt module add @nuxtjs/robots
npx nuxt module add @nuxtjs/sitemap
npx nuxt module add nuxt-og-image
```

---

## Module Overview

| Module | Version | Purpose |
|--------|---------|---------|
| **@nuxtjs/seo** | v5.1.0 | Primary SEO module (installs all 8 as bundle) |
| **@nuxtjs/robots** | v6.0.6 | Manages robots.txt and bot detection |
| **@nuxtjs/sitemap** | v8.0.11 | Generates XML sitemaps with advanced features |
| **nuxt-og-image** | v6.3.1 | Creates Open Graph images via Vue templates |
| **nuxt-schema-org** | v6.0.4 | Builds Schema.org structured data graphs |
| **nuxt-link-checker** | v5.0.6 | Finds and fixes broken links with ESLint integration |
| **nuxt-seo-utils** | v8.1.4 | SEO utilities, share links, favicons, inline minification |
| **nuxt-site-config** | v4.0.7 | Centralized site configuration management |

**Standalone (MIT)**: `nuxt-ai-ready` (llms.txt), `nuxt-skew-protection` (version safety)
**Pro (Paid)**: Nuxt SEO Pro — Search Console, Core Web Vitals, MCP server

**For detailed module docs:** Load `references/module-details.md`

---

## Critical Rules

### Always Do

- Set `site.url` AND `site.name` explicitly in nuxt.config.ts (v5: name no longer auto-inferred)
- Use environment variables for multi-environment setups
- Configure robots.txt to block admin/private pages
- Add Schema.org structured data to all important pages
- Generate OG images for social sharing
- Use `getSiteConfig(event)` on server side (v5: `useSiteConfig(event)` removed)
- Use `defineSitemapSchema()` for Content v3 (v5: `asSitemapCollection()` deprecated)

### Never Do

- Forget to set `site.url` and `site.name` (breaks sitemaps, canonical URLs, titles)
- Allow crawling of staging environments
- Use `useSiteConfig(event)` on server side (v5: use `getSiteConfig(event)`)
- Use `asSitemapCollection()` (v5: use `defineSitemapSchema()`)
- Use `getSiteIndexable()` (v5: use `{ indexable } = getSiteConfig(event)`)

---

## Known Issues Prevention

### Issue #1: Sitemap Not Generating

**Error**: `/sitemap.xml` returns 404 | **Fix**: Set `site.url` in nuxt.config.ts

### Issue #2: robots.txt Missing

**Error**: `/robots.txt` not accessible | **Fix**: Install `@nuxtjs/robots` and set `site.url`

### Issue #3: OG Images Not Rendering

**Error**: `/__og-image__/og.png` returns error | **Fix**: Use Satori-compatible CSS or switch to Chromium renderer

### Issue #4: Schema Validation Errors

**Error**: Invalid JSON-LD | **Fix**: Follow official Schema.org types, validate with Google Rich Results Test

### Issue #5: Broken Internal Links

**Error**: 404 on internal links | **Fix**: Enable `nuxt-link-checker` with ESLint rules during development

### Issue #6: Duplicate Meta Tags

**Error**: Multiple meta tags with same property | **Fix**: Let modules handle meta tags automatically

### Issue #7: Canonical URL Issues

**Error**: Wrong canonical URL | **Fix**: Configure `site.url` and `trailingSlash` correctly

### Issue #8: Sitemap Index Errors

**Error**: Sitemap index XML malformed | **Fix**: Use `chunkSize` option to split large sitemaps

### Issue #9: Crawling Staging Environment

**Error**: Staging indexed by Google | **Fix**: `disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : []`

### Issue #10: Missing Social Sharing Images

**Error**: No preview on social media | **Fix**: Use `defineOgImage()` on all important pages

### Issue #11: Missing Site Name (v5 Breaking)

**Error**: Site title/og:site_name missing | **Fix**: Set `site.name` in nuxt.config.ts or `NUXT_SITE_NAME` env var
**Ref**: https://nuxtseo.com/docs/nuxt-seo/migration-guide/v4-to-v5

### Issue #12: Server-Side useSiteConfig Error (v5 Breaking)

**Error**: `useSiteConfig is not a function` on server | **Fix**: Use `getSiteConfig(event)` on server side
**Ref**: https://github.com/harlan-zw/nuxt-site-config/releases

### Issue #13: Deprecated Content Composables (v5 Breaking)

**Error**: `asSitemapCollection is not defined` | **Fix**: Use `defineSitemapSchema()`, `defineSchemaOrgSchema()`, `defineRobotsSchema()`
**Ref**: https://nuxtseo.com/docs/nuxt-seo/migration-guide/v4-to-v5

### Issue #14: OG Image Security Errors (v5)

**Error**: OG image requests return 403 or signature errors | **Fix**: Use `defineOgImage()` properly; don't manually construct OG image URLs
**Ref**: https://nuxtseo.com/docs/og-image/getting-started/introduction

---

## Configuration Example

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: 'My Site',
    defaultLocale: 'en'
  },

  robots: {
    disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : []
  },

  sitemap: {
    sitemaps: {
      blog: { sources: ['/api/__sitemap__/blog'] }
    }
  }
})
```

### New v5 Features

- **Social Share Links**: `useShareLinks({ title, twitter, utm })` with UTM tracking
- **Favicon Generation**: `npx nuxt-seo-utils icons --source logo.svg`
- **ESLint Link Checking**: `import linkChecker from 'nuxt-link-checker/eslint'`
- **definePageMeta Sitemap**: `definePageMeta({ sitemap: { changefreq: 'daily', priority: 0.8 } })`
- **Inline Minification**: `seo: { minify: true }`

---

## When to Load References

Load reference files based on the user's specific needs:

| Load When | Reference File |
|-----------|---------------|
| Upgrading v4→v5, breaking changes | `references/v5-migration-guide.md` |
| Rendering modes, JSON-LD, canonical URLs, IndexNow | `references/seo-guides.md` |
| AI optimization, llms.txt, MCP tools | `references/pro-modules.md` |
| I18n SEO, route rules, link checker rules | `references/advanced-seo-guides.md` |
| OG image templates, Satori/Chromium, fonts | `references/og-image-guide.md` |
| Nuxt Content integration, asSeoCollection | `references/nuxt-content-integration.md` |
| Dynamic sitemaps, multi-sitemaps, chunking | `references/sitemap-advanced.md` |
| Server-side hooks, Nitro plugins | `references/nitro-api-reference.md` |
| llms.txt, AI crawlers, content signals | `references/ai-seo-tools.md` |
| Module capabilities overview | `references/modules-overview.md` |
| First-time setup, package manager specifics | `references/installation-guide.md` |
| Composable API docs, parameter lists | `references/api-reference.md` |
| Blog, e-commerce, multi-language patterns | `references/common-patterns.md` |
| Specific module configuration | `references/module-details.md` |
| Production SEO guidelines | `references/best-practices.md` |
| Error resolution, module conflicts | `references/troubleshooting.md` |
| Multi-environment, advanced features | `references/advanced-configuration.md` |

## Bundled Resources

### Agents

| Agent | Purpose |
|-------|---------|
| `seo-auditor.md` | Comprehensive SEO audit |
| `schema-generator.md` | Generate Schema.org structured data |
| `og-image-generator.md` | Create custom OG image templates |
| `link-checker.md` | Analyze internal/external links |
| `sitemap-builder.md` | Design optimal sitemap strategies |

### Commands

| Command | Purpose |
|---------|---------|
| `/seo-audit` | Run comprehensive SEO audit |
| `/seo-setup` | Quick Nuxt SEO project setup |
| `/og-preview` | Preview OG image generation |
| `/check-links` | Run link checker analysis |
| `/validate-sitemap` | Validate sitemap configuration |
| `/check-schema` | Validate Schema.org implementation |

### Assets

- `assets/package-versions.json` — Current module versions for verification

---

## Package Versions (Verified 2026-04-02)

```json
{
  "dependencies": {
    "@nuxtjs/seo": "^5.1.0",
    "@nuxtjs/robots": "^6.0.6",
    "@nuxtjs/sitemap": "^8.0.11",
    "nuxt-og-image": "^6.3.1",
    "nuxt-schema-org": "^6.0.4",
    "nuxt-link-checker": "^5.0.6",
    "nuxt-seo-utils": "^8.1.4",
    "nuxt-site-config": "^4.0.7"
  }
}
```

---

## Official Documentation

- **Nuxt SEO**: https://nuxtseo.com
- **v5 Migration**: https://nuxtseo.com/docs/nuxt-seo/migration-guide/v4-to-v5
- **@nuxtjs/robots**: https://nuxtseo.com/docs/robots/getting-started/introduction
- **@nuxtjs/sitemap**: https://nuxtseo.com/docs/sitemap/getting-started/introduction
- **nuxt-og-image**: https://nuxtseo.com/docs/og-image/getting-started/introduction
- **nuxt-schema-org**: https://nuxtseo.com/docs/schema-org/getting-started/introduction
- **nuxt-link-checker**: https://nuxtseo.com/docs/link-checker/getting-started/introduction
- **GitHub**: https://github.com/harlan-zw

**Production Ready**: All patterns based on official documentation from https://nuxtseo.com/llms-full.txt | Last verified: 2026-04-02
