# Nuxt SEO - Modules Overview

Detailed overview of all 8 Nuxt SEO modules.

---

## Table of Contents

1. [@nuxtjs/seo (Primary SEO Module)](#1-nuxtjsseo-primary-seo-module)
2. [nuxt-robots (Robots.txt & Bot Detection)](#2-nuxt-robots-robotstxt--bot-detection)
3. [nuxt-sitemap (XML Sitemap Generation)](#3-nuxt-sitemap-xml-sitemap-generation)
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

**Version**: 3.2.2 | **Downloads**: 1.8M | **Stars**: 1,296

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

## 2. nuxt-robots (Robots.txt & Bot Detection)

**Version**: 5.5.6 | **Downloads**: 7.1M | **Stars**: 497

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

## 3. nuxt-sitemap (XML Sitemap Generation)

**Version**: 7.4.7 | **Downloads**: 8.6M | **Stars**: 398

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

### APIs
- `defineSitemapEventHandler(handler)`
- Route rules configuration
- Dynamic sources

### When to Use
- Automatic sitemap generation
- E-commerce with thousands of products
- Blog with dynamic content
- Multi-language sites
- Media-rich websites
- Large sites needing chunking

---

## 4. nuxt-og-image (Open Graph Image Generation)

**Version**: 5.1.12 | **Downloads**: 2.5M | **Stars**: 481

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

**Version**: v5.0.9 | **Downloads**: 2.9M | **Stars**: 176

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

**Version**: v4.3.6 | **Downloads**: 2M | **Stars**: 95

### What It Does
- Finds broken links automatically
- Validates internal and external links
- Detects redirect chains
- Reports link health

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

**Version**: v7.0.18 | **Downloads**: 1.1M | **Stars**: 113

### What It Does
- Provides SEO utility functions
- Manages canonical URLs
- Generates breadcrumbs
- Handles app icons

### Key Features
- Canonical URL automation
- Breadcrumb generation
- App icon management
- Open Graph automation
- Enhanced title templates
- Site name appending
- Route rules integration

### APIs
- `useBreadcrumbItems()`

### When to Use
- Breadcrumb navigation
- Canonical URL enforcement
- App icon generation
- Template-based titles
- Route-specific SEO

---

## 8. nuxt-site-config (Site Configuration)

**Version**: v3.2.11 | **Downloads**: 7.9M | **Stars**: 75

### What It Does
- Centralizes site-wide configuration
- Provides runtime config access
- Manages multi-tenancy
- Integrates with i18n

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
- `useSiteConfig()`
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
bunx nuxi module add @nuxtjs/seo
```

### Custom Stack
```bash
bunx nuxi module add nuxt-robots
bunx nuxi module add nuxt-sitemap
bunx nuxi module add nuxt-og-image
bunx nuxi module add nuxt-schema-org
```

### Minimal
```bash
bunx nuxi module add nuxt-robots
bunx nuxi module add nuxt-sitemap
bunx nuxi module add nuxt-site-config
```

---

**Last Updated**: 2025-11-10
**Source**: https://nuxtseo.com/llms.txt
