# Nuxt SEO v5 - Modules Overview

Detailed overview of all 8 Nuxt SEO modules.

---

## Table of Contents

1. [@nuxtjs/seo (Primary SEO Module)](#1-nuxtjsseo-primary-seo-module)
2. [@nuxtjs/robots (Robots.txt & Bot Detection)](#2-nuxt-robots-robotstxt--bot-detection)
3. [@nuxtjs/sitemap (XML Sitemap Generation)](#3-nuxt-sitemap-xml-sitemap-generation)
4. [nuxt-og-image (Open Graph Image Generation)](#4-nuxt-og-image-open-graph-image-generation)
5. [nuxt-schema-org (Schema.org Structured Data)](#5-nuxt-schema-org-schemaorg-structured-data)
6. [nuxt-link-checker (Link Validation)](#6-nuxt-link-checker-link-validation)
7. [nuxt-seo-utils (SEO Utilities)](#7-nuxt-seo-utils-seo-utilities)
8. [nuxt-site-config (Site Configuration)](#8-nuxt-site-config-site-configuration)
9. [Module Interactions](#module-interactions)
10. [Version Compatibility](#version-compatibility)
11. [Installation Patterns](#installation-patterns)

---


## 1. @nuxtjs/seo (Primary SEO Module)

**Version**: 5.1.0 | **Downloads**: 4.2M/month | **Stars**: 3,300

### What It Does
- Installs all 8 SEO modules as a bundle
- Provides unified configuration via `site` object
- Integrates with Nuxt Content for automatic SEO
- Manages meta tags, titles, and descriptions

### Key Features
- One-command installation of complete SEO stack
- Best-practice defaults out of the box
- Centralized configuration
- Zero-config for basic use cases

### When to Use
- New projects needing complete SEO
- Simplifying multi-module installation
- Want best-practice defaults
- Need integrated Nuxt Content SEO

---

## 2. @nuxtjs/robots (Robots.txt & Bot Detection)

**Version**: 6.0.6 | **Downloads**: 8.7M

### What It Does
- Generates robots.txt automatically
- Controls search engine crawling
- Detects bots server-side and client-side
- Manages page-level indexing rules

### Key Features
- Automatic robots.txt generation
- User-agent specific rules
- Sitemap URL inclusion
- Clean URL parameters (Yandex)
- Bot detection with fingerprinting
- Page-level noindex/nofollow
- Nuxt I18n integration
- Route-based rules

### APIs
- `useRobotsRule(rule)`
- `useBotDetection()`
- `getBotDetection(event)`
- `getPathRobotConfig(path)`
- `getSiteRobotConfig()`

### When to Use
- Block admin/private pages from crawlers
- Detect bots for analytics
- Configure per-search-engine rules
- Clean tracking parameters from URLs
- Multi-language robots.txt

---

## 3. @nuxtjs/sitemap (XML Sitemap Generation)

**Version**: 8.0.11 | **Downloads**: 10M

### What It Does
- Auto-generates XML sitemaps from routes
- Supports dynamic content sources
- Creates sitemap indexes for large sites
- Includes images, videos, and news metadata

### Key Features
- Automatic route detection
- Dynamic URL endpoints
- Multiple sitemap support
- Sitemap chunking (1000+ URLs)
- Image sitemap support
- Video sitemap support
- News sitemap support
- URL filtering
- Caching
- Nuxt Content integration
- i18n support

### v5 New Features
- `definePageMeta` sitemap config
- i18n multi-sitemap auto-expansion
- Debug production endpoint: `/__sitemap__/debug-production.json`

### APIs

### When to Use
- Automatic sitemap generation
- E-commerce with thousands of products
- Blog with dynamic content
- Multi-language sites
- Media-rich websites
- Large sites needing chunking

---

## 4. nuxt-og-image (Open Graph Image Generation)

**Version**: 6.3.1 | **Downloads**: 3.7M

### What It Does
- Generates Open Graph images dynamically
- Uses Vue templates for image design
- Creates social sharing previews
- Zero runtime overhead option

### Key Features
- Two rendering engines (Satori, Chromium)
- Vue component templates
- Screenshot mode
- Custom fonts support
- Emoji support (Twemoji)
- Icon support (UnoCSS)
- JPEG and PNG formats
- Quality control
- Multi-language fonts
- Error page OG images
- Zero runtime mode

### v5 New Features
- URL signing to prevent parameter tampering
- Prop whitelisting to prevent cache key DoS
- Strict mode, deprecated `html` prop

### Rendering Engines
- **Satori**: Fast, lightweight, HTML/CSS to image
- **Chromium**: Full browser, supports all features

### APIs
- `defineOgImage(options)`
- `defineOgImageComponent(component, props)`
- `defineOgImageScreenshot(options)`

### When to Use
- Social media sharing previews
- Dynamic blog post images
- Product page thumbnails
- Event promotional images
- Error page sharing
- Multi-language og:images

---

## 5. nuxt-schema-org (Schema.org Structured Data)

**Version**: v6.0.4 | **Downloads**: 3.9M

### What It Does
- Builds Schema.org JSON-LD graphs
- Enhances search results with rich snippets
- Provides knowledge panels
- Improves SEO visibility

### Key Features
- Type-safe schema generation
- Organization identity
- Person identity
- Article/BlogPosting
- Product schemas
- Local business
- Event schemas
- FAQ pages
- Breadcrumbs
- Reviews & ratings
- Nuxt I18n support

### APIs
- `useSchemaOrg(nodes)`

### Common Schema Types
- Organization
- Person
- Article/BlogPosting
- Product
- LocalBusiness
- Event
- FAQPage
- BreadcrumbList
- Review
- AggregateRating

### When to Use
- Rich search results
- Knowledge panels
- Product listings
- Blog posts
- Local businesses
- Events
- FAQs
- Breadcrumb navigation

---

## 6. nuxt-link-checker (Link Validation)

**Version**: v5.0.6 | **Downloads**: 2.8M

### What It Does
- Finds broken links automatically
- Validates internal and external links
- Detects redirect chains
- Reports link health

### v5 New Features
- ESLint integration with `link-checker/valid-route` and `link-checker/valid-sitemap-link` rules
- Scans Vue templates, TS/JS (`navigateTo`, `router.push`), and Markdown links
- `excludePages` config to skip link checking on specific pages

### Key Features
- 404 detection
- Redirect chain identification
- Malformed URL detection
- Anchor link validation
- DevTools integration
- Build-time scanning
- Live inspections
- Exclusion patterns
- External link skipping

### When to Use
- Development link validation
- Pre-deployment checks
- CI/CD pipeline integration
- Regular link audits
- Site migration validation

---

## 7. nuxt-seo-utils (SEO Utilities)

**Version**: v8.1.4 | **Downloads**: 2.2M

### What It Does
- Provides SEO utility functions
- Manages canonical URLs
- Generates breadcrumbs
- Handles app icons

### v5 New Features
- `useShareLinks()` composable for social sharing (8 platforms + UTM tracking)
- `nuxt-seo-utils icons` CLI for favicon generation from a single source image
- Inline script/style minification (enabled by default)
- Brand new DevTools client with Identity tab

### APIs
- `useBreadcrumbItems()`
- `useShareLinks(options)`

### When to Use
- Breadcrumb navigation
- Canonical URL enforcement
- App icon generation
- Template-based titles
- Route-specific SEO

---

## 8. nuxt-site-config (Site Configuration)

**Version**: v4.0.7 | **Downloads**: 7.9M

### What It Does
- Centralizes site-wide configuration
- Provides runtime config access
- Manages multi-tenancy
- Integrates with i18n

### v5 Breaking Changes
- Removed implicit site name inference (must explicitly set `site.name`)
- Removed server-side `useSiteConfig(event)` — use `getSiteConfig(event)` instead
- Removed `getSiteIndexable()` — use `{ indexable } = getSiteConfig(event)`
- Removed `SiteConfig` type — use `SiteConfigResolved`
- Removed legacy `siteUrl`/`siteName`/`siteDescription` runtime config keys
- Named priority constants: `SiteConfigPriority.runtime`, etc.

### Key Features
- Single source of truth
- Runtime configuration
- Multi-tenancy support
- Nuxt I18n integration
- Environment-based config
- Dynamic updates
- Path resolution
- Origin detection

### APIs
- `useSiteConfig()` (client-side, unchanged)
- `getSiteConfig(event)` (server-side, replaces `useSiteConfig(event)`)
- `updateSiteConfig(config)`
- `createSitePathResolver()`
- `useNitroOrigin()`

### Configuration Options
- `url` - Site URL
- `name` - Site name
- `description` - Site description
- `defaultLocale` - Default language
- `identity` - Organization/Person
- `twitter` - Twitter handle
- `trailingSlash` - URL format

### When to Use
- Site-wide SEO settings
- Multi-environment config
- Multi-tenancy setups
- Shared configuration
- Runtime config access

---

## Module Interactions

### How Modules Work Together

1. **nuxt-site-config** provides shared configuration
2. **@nuxtjs/seo** coordinates all modules
3. **nuxt-robots** references sitemap from nuxt-sitemap
4. **nuxt-sitemap** uses site.url from site-config
5. **nuxt-og-image** integrates with meta tags
6. **nuxt-schema-org** uses site identity
7. **nuxt-seo-utils** provides utilities for all
8. **nuxt-link-checker** validates generated sitemaps

### Recommended Combinations

**Blog Site**:
- @nuxtjs/seo (or robots + sitemap + og-image + schema-org)
- Link checker for content validation

**E-commerce**:
- @nuxtjs/seo (all modules)
- Heavy focus on schema-org for products
- Multiple sitemaps for categories/products

**Corporate Site**:
- robots + sitemap + og-image + schema-org
- Organization schema for brand
- Link checker for maintenance

**Multi-language**:
- @nuxtjs/seo + @nuxtjs/i18n
- All modules with i18n integration
- Locale-specific sitemaps

---

## Version Compatibility

All modules require:
- Nuxt >= 3.0.0
- Works with Nuxt 4.x

Package manager support:
- Bun (primary)
- npm (backup)
- pnpm (backup)

---

## Installation Patterns

### Full Stack
```bash
npx nuxt module add seo
```

### Custom Stack
```bash
npx nuxt module add nuxt-robots
npx nuxt module add nuxt-sitemap
npx nuxt module add nuxt-og-image
npx nuxt module add nuxt-schema-org
```

### Minimal
```bash
npx nuxt module add nuxt-robots
npx nuxt module add nuxt-sitemap
npx nuxt module add nuxt-site-config
```

---

**Last Updated**: 2026-03-30
**Source**: https://nuxtseo.com/llms-full.txt
