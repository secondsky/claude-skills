---
name: nuxt-seo
description: Nuxt SEO v5 modules (robots, sitemap, og-image, schema-org, link-checker, seo-utils, site-config). Use when implementing SEO, robots.txt, sitemaps, OG images, Schema.org, meta tags, or link checking in Nuxt applications.
license: MIT
metadata:
  version: 4.0.0
  last_updated: 2026-03-30
  module_versions:
    nuxtjs_seo: 5.1.0
    nuxt_robots: 6.0.6
    nuxt_sitemap: 8.0.11
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
    - Adding social share links with UTM tracking
    - Generating favicons from a source image
    - Setting up ESLint link checking rules
---

# Nuxt SEO v5 - Complete Guide to All 8 SEO Modules + Standalone Modules

**Status**: Production Ready (v5)
**Last Updated**: 2026-03-30
**Dependencies**: Nuxt >=3.0.0
**Latest Versions**: See module versions table below

Use this skill when building SEO-optimized Nuxt applications with any combination of the 8 official Nuxt SEO modules plus standalone modules. Covers the complete Nuxt SEO v5 ecosystem maintained by Harlan Wilton, including DevTools Unity, ESLint link checking, social share links, favicon generation, inline minification, and comprehensive migration guidance from v4.

---

## Nuxt SEO Ecosystem Overview

Nuxt SEO v5 consists of **8 core modules** plus **3 standalone modules** (2 now MIT licensed) that work together seamlessly:

### Core Modules

| Module | Version | Purpose |
|--------|---------|---------|
| **@nuxtjs/seo** | v5.1.0 | Primary SEO module (installs all 8 modules as bundle) |
| **@nuxtjs/robots** | v6.0.6 | Manages robots.txt and bot detection |
| **@nuxtjs/sitemap** | v8.0.11 | Generates XML sitemaps with advanced features |
| **nuxt-og-image** | v6.3.1 | Creates Open Graph images via Vue templates |
| **nuxt-schema-org** | v6.0.4 | Builds Schema.org structured data graphs |
| **nuxt-link-checker** | v5.0.6 | Finds and fixes broken links with ESLint integration |
| **nuxt-seo-utils** | v8.1.4 | SEO utilities, share links, favicons, inline minification |
| **nuxt-site-config** | v4.0.7 | Centralized site configuration management (v4 breaking) |

### Standalone Modules (MIT Licensed)

| Module | Version | Purpose |
|--------|---------|---------|
| **nuxt-ai-ready** | v1.1.0 (MIT) | Generate llms.txt for AI crawlers and LLM optimization |
| **nuxt-skew-protection** | v1.1.0 (MIT) | Prevent version mismatches during deployments |

### Pro Module (Paid)

| Module | Purpose |
|--------|---------|
| **Nuxt SEO Pro** | Search Console integration, Core Web Vitals, MCP server ($119 one-time) |

**Requirements**: Nuxt v3 or v4

---

## Quick Start (5 Minutes)

### 1. Install Complete SEO Bundle

Install all 8 modules at once:

```bash
# Recommended (new in v5)
npx nuxt module add seo

# Legacy command (still works)
npx nuxi module add @nuxtjs/seo
```

**Why this matters:**
- Installs all 8 modules with a single command
- Ensures compatible versions across modules
- Provides best-practice defaults automatically

### 2. Configure Site Settings

Add to `nuxt.config.ts`:

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
- `site.name` is NO LONGER auto-inferred from `package.json` — you MUST set it explicitly
- Set `site.url` to production URL (required for sitemaps and canonical URLs)
- Use environment variable for multi-environment setups
- Set `defaultLocale` if using i18n

### 3. Restart and Verify

```bash
npm run dev
```

Visit these URLs to verify:
- `http://localhost:3000/robots.txt` - Robots file
- `http://localhost:3000/sitemap.xml` - Sitemap
- `http://localhost:3000/__robots__/debug-production.json` - Debug (v5)
- `http://localhost:3000/__sitemap__/debug-production.json` - Debug (v5)

---

## Installation Options

### Option 1: Complete Bundle (Recommended)

```bash
npx nuxt module add seo
```

Configuration:

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo']
})
```

### Option 2: Individual Modules

Install only what's needed:

```bash
npx nuxt module add @nuxtjs/robots
npx nuxt module add @nuxtjs/sitemap
npx nuxt module add nuxt-og-image
```

Configuration:

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    'nuxt-og-image'
  ]
})
```

---

## Module Overview (Brief)

The Nuxt SEO v5 ecosystem consists of **8 specialized modules** that work together seamlessly. Each module serves a specific purpose and can be installed individually or as a complete bundle.

### Module 1: @nuxtjs/seo
Primary SEO module that installs all 8 modules as a bundle. Provides unified configuration through the `site` object and integrates with Nuxt Content for automatic SEO.

### Module 2: @nuxtjs/robots (v6)
Manages robots.txt and bot detection. Controls which pages search engines can crawl with site-wide and page-level rules. Includes server-side and client-side bot detection.

### Module 3: @nuxtjs/sitemap (v8)
Generates XML sitemaps automatically from routes with support for dynamic URLs, multiple sitemaps, media, and advanced optimization. New in v5: `definePageMeta` sitemap config, i18n multi-sitemap improvements, debug production endpoints.

### Module 4: nuxt-og-image (v6.3)
Creates Open Graph images dynamically using Vue templates. New in v5: URL signing for security, prop whitelisting, strict mode.

### Module 5: nuxt-schema-org (v6)
Builds Schema.org structured data for enhanced search results with rich snippets, knowledge panels, and better SEO. Fixed SSR memory leaks.

### Module 6: nuxt-link-checker (v5)
Finds and fixes links that may negatively affect SEO. New in v5: ESLint integration with `link-checker/valid-route` and `link-checker/valid-sitemap-link` rules.

### Module 7: nuxt-seo-utils (v8)
SEO utilities for discoverability and shareability. New in v5: `useShareLinks()` composable, favicon generation CLI (`nuxt-seo-utils icons`), inline script/style minification.

### Module 8: nuxt-site-config (v4)
Centralized site configuration management. Breaking in v5: removed implicit site name inference, removed server-side `useSiteConfig(event)` (use `getSiteConfig(event)`), removed `getSiteIndexable`, named priority constants.

**For complete module documentation with configurations, APIs, and examples:**  
Load `references/module-details.md` when you need:
- Detailed configuration options for a specific module
- Complete API documentation
- Code examples and usage patterns
- Module-specific troubleshooting
---

## Integration Patterns

### Basic Example

```typescript
// nuxt.config.ts - Complete SEO setup
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: 'https://example.com',
    name: 'My Awesome Site',
    defaultLocale: 'en'
  },

  robots: {
    disallow: ['/admin']
  },

  sitemap: {
    sitemaps: {
      blog: { sources: ['/api/__sitemap__/blog'] }
    }
  }
})
```

**For complete integration examples:**  
Load `references/common-patterns.md` when you need:
- Blog page SEO implementation
- E-commerce product page examples
- Multi-language SEO patterns
- Integration with Nuxt Content
## Critical Rules

### Always Do

✅ Set `site.url` AND `site.name` explicitly in nuxt.config.ts (v5: name no longer auto-inferred)
✅ Use environment variables for multi-environment setups
✅ Configure robots.txt to block admin/private pages
✅ Add Schema.org structured data to all important pages
✅ Generate OG images for social sharing
✅ Test all SEO features before deploying to production
✅ Submit sitemap to Google Search Console after deployment
✅ Enable link checker during development
✅ Use `getSiteConfig(event)` on server side (v5: `useSiteConfig(event)` removed)
✅ Use `defineSitemapSchema()` for Content v3 (v5: `asSitemapCollection()` deprecated)

### Never Do

❌ Forget to set `site.url` and `site.name` (breaks sitemaps, canonical URLs, and titles)
❌ Allow crawling of staging environments
❌ Skip Schema.org for key pages (products, articles, events)
❌ Deploy without testing OG images
❌ Use outdated module versions
❌ Ignore broken links found by link checker
❌ Forget to exclude admin/private routes from sitemap
❌ Use `useSiteConfig(event)` on server side (v5: use `getSiteConfig(event)`)
❌ Use `asSitemapCollection()` (v5: use `defineSitemapSchema()`)
❌ Use `getSiteIndexable()` (v5: use `{ indexable } = getSiteConfig(event)`)

---

## Known Issues Prevention

This skill prevents **14** documented common SEO mistakes:

### Issue #1: Sitemap Not Generating

**Error**: `/sitemap.xml` returns 404
**Why It Happens**: Missing `site.url` configuration
**Prevention**: Always set `site.url` in nuxt.config.ts

### Issue #2: robots.txt Missing

**Error**: `/robots.txt` not accessible
**Why It Happens**: Module not installed or misconfigured
**Prevention**: Install `@nuxtjs/robots` and set `site.url`

### Issue #3: OG Images Not Rendering

**Error**: `/__og-image__/og.png` returns error
**Why It Happens**: Incompatible CSS with Satori renderer
**Prevention**: Use Satori-compatible CSS or switch to Chromium renderer

### Issue #4: Schema Validation Errors

**Error**: Invalid JSON-LD in page source
**Why It Happens**: Incorrect Schema.org structure
**Prevention**: Follow official Schema.org types and validate with Google's Rich Results Test

### Issue #5: Broken Internal Links

**Error**: 404 errors on internal links
**Why It Happens**: Links not updated after route changes
**Prevention**: Enable `nuxt-link-checker` with ESLint rules during development

### Issue #6: Duplicate Meta Tags

**Error**: Multiple meta tags with same property
**Why It Happens**: Conflicting manual meta tags and module automation
**Prevention**: Let modules handle meta tags automatically

### Issue #7: Canonical URL Issues

**Error**: Wrong canonical URL in meta tags
**Why It Happens**: Incorrect `site.url` or missing trailing slash config
**Prevention**: Configure `site.url` and `trailingSlash` correctly

### Issue #8: Sitemap Index Errors

**Error**: Sitemap index XML malformed
**Why It Happens**: Too many URLs in single sitemap
**Prevention**: Use `chunkSize` option to split large sitemaps

### Issue #9: Crawling Staging Environment

**Error**: Staging site indexed by Google
**Why It Happens**: No robots.txt blocking
**Prevention**: Configure robots to block staging: `disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : []`

### Issue #10: Missing Social Sharing Images

**Error**: No preview image when sharing on social media
**Why It Happens**: OG image not defined or not accessible
**Prevention**: Use `defineOgImage()` on all important pages

### Issue #11: Missing Site Name (v5 Breaking)

**Error**: Site title/og:site_name missing, titles not appearing correctly
**Why It Happens**: v5 removed implicit site name inference from `package.json`
**Prevention**: Explicitly set `site.name` in nuxt.config.ts or `NUXT_SITE_NAME` env var

### Issue #12: Server-Side useSiteConfig Error (v5 Breaking)

**Error**: `useSiteConfig is not a function` or `useSiteConfig(event)` fails on server
**Why It Happens**: v5 removed server-side `useSiteConfig(event)` composable
**Prevention**: Use `getSiteConfig(event)` on server side

### Issue #13: Deprecated Content Composables (v5 Breaking)

**Error**: `asSitemapCollection is not defined` or similar
**Why It Happens**: v5 renamed Content v3 composables
**Prevention**: Use `defineSitemapSchema()` instead of `asSitemapCollection()`, `defineSchemaOrgSchema()` instead of `asSchemaOrgCollection()`, `defineRobotsSchema()` instead of `asRobotsCollection()`

### Issue #14: OG Image Security Errors (v5)

**Error**: OG image requests return 403 or signature errors
**Why It Happens**: v5 added URL signing for OG images to prevent parameter tampering
**Prevention**: Use the `defineOgImage()` composable properly; avoid manually constructing OG image URLs

---

## Configuration Example

### Basic Production Config

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
    name: 'My Site', // Required in v5 - no longer auto-inferred
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

#### Social Share Links with UTM Tracking

```typescript
const links = useShareLinks({
  title: 'Check out Nuxt SEO v5!',
  twitter: { via: 'harlodev', hashtags: ['nuxt', 'seo'] },
  utm: { campaign: 'v5-launch' },
})
```

#### Favicon Generation

```bash
npx nuxt-seo-utils icons --source logo.svg
```

#### ESLint Link Checking

```typescript
import linkChecker from 'nuxt-link-checker/eslint'

export default [
  linkChecker,
]
```

#### definePageMeta Sitemap Config

```typescript
definePageMeta({
  sitemap: {
    changefreq: 'daily',
    priority: 0.8,
  },
})
```

#### Inline Minification

```typescript
export default defineNuxtConfig({
  seo: {
    minify: true, // default - minifies inline scripts/styles
  },
})
```

**For complete configuration examples:**  
Load `references/advanced-configuration.md` when you need:
- Production-ready multi-environment setup
- Development and staging configurations
- Advanced sitemap patterns
- Dynamic route rules
- Multi-language configuration
## Using Bundled Resources

### Scripts (scripts/)

**`init-nuxt-seo.sh`** - Quick setup script for new projects

```bash
./scripts/init-nuxt-seo.sh
```

Automatically:
- Installs @nuxtjs/seo module
- Creates basic nuxt.config.ts configuration
- Sets up example OG image component
- Creates sitemap API endpoint example

### References (references/)

#### When to Load References

Load the appropriate reference file based on the user's specific needs:

**Load `references/v5-migration-guide.md` when:**
- User is upgrading from Nuxt SEO v4 to v5
- Encountering breaking changes after upgrade (missing site name, `useSiteConfig(event)` errors, deprecated composables)
- Need step-by-step migration instructions
- Want to understand Site Config v4 changes

**Load `references/seo-guides.md` when:**
- User asks about rendering modes (SSR, SSG, ISR, Hybrid)
- Need JSON-LD structured data implementation
- Setting up canonical URLs
- Implementing Twitter Cards or Open Graph
- Configuring meta robots tags
- Using IndexNow for instant indexing
- URL structure best practices
- Debugging SEO issues
- Rich results implementation

**Load `references/pro-modules.md` when:**
- User asks about AI optimization (llms.txt)
- Need deployment version skew protection
- Setting up MCP tools for AI-assisted SEO
- Advanced Pro module features

**Load `references/advanced-seo-guides.md` when:**
- User asks about I18n/multilanguage SEO
- Need hreflang or locale-specific sitemaps
- Configuring SEO route rules (routeRules)
- Enhanced title configuration (templates, fallbacks)
- Deep dive into nuxt-seo-utils features
- Link checker inspection rules
- Prerendering Vue SPA for SEO
- Hydration mismatch debugging
- Protecting from malicious crawlers/bots
- Creating SEO-friendly 404 pages

**Load `references/modules-overview.md` when:**
- User asks "what modules are available?" or "which module should I use?"
- Need overview of module capabilities and use cases
- Comparing modules to choose the right one
- Understanding how modules work together

**Load `references/installation-guide.md` when:**
- User is setting up Nuxt SEO for the first time
- Package manager specific questions (Bun vs npm vs pnpm)
- Installation troubleshooting or dependency conflicts
- Need step-by-step installation instructions

**Load `references/api-reference.md` when:**
- User asks about specific composable APIs (e.g., "how to use useSchemaOrg?")
- Need complete parameter lists or return types
- Troubleshooting API method signatures
- Looking for specific configuration options

**Load `references/common-patterns.md` when:**
- User wants real-world implementation examples
- Need blog, e-commerce, or multi-language SEO patterns
- Integrating with Nuxt Content or other modules
- Production-ready configuration examples

**Load `references/module-details.md` when:**
- User asks about specific module configuration
- Need detailed documentation for one of the 8 modules
- Troubleshooting module-specific issues

**Load `references/best-practices.md` when:**
- Setting up production SEO configuration
- Need SEO optimization guidelines
- Following Nuxt SEO best practices

**Load `references/troubleshooting.md` when:**
- User experiencing specific errors
- Sitemap, robots.txt, or OG image issues
- Build problems or module conflicts

**Load `references/advanced-configuration.md` when:**
- Need production-ready configurations
- Multi-environment setup (dev/staging/production)
- Advanced features (multiple sitemaps, custom OG templates)

**Load `references/og-image-guide.md` when:**
- User asks about OG image generation, Satori vs Chromium
- Need custom OG image templates or Vue components
- Configuring fonts, emojis, or caching for OG images
- Troubleshooting OG image rendering issues
- Implementing custom props or dynamic OG images

**Load `references/nuxt-content-integration.md` when:**
- User is using @nuxt/content with SEO modules
- Need asSeoCollection, asSitemapCollection, asSchemaOrgCollection patterns
- Content v2 vs v3 integration differences
- Module load order issues with content
- Automatic SEO from content frontmatter

**Load `references/sitemap-advanced.md` when:**
- User needs dynamic sitemap URLs from API/database
- Implementing multi-sitemaps with chunking
- Image or video sitemaps
- I18n sitemap with _i18nTransform
- Performance optimization (caching, zero runtime)
- defineSitemapEventHandler patterns

**Load `references/nitro-api-reference.md` when:**
- User needs server-side SEO hooks
- Implementing sitemap:input, sitemap:resolved, sitemap:output hooks
- OG image hooks (nuxt-og-image:context, nuxt-og-image:satori:vnodes)
- Robots composables (getSiteRobotConfig, getPathRobotConfig)
- Nitro plugin integration for SEO

**Load `references/ai-seo-tools.md` when:**
- User asks about llms.txt or AI discoverability
- Implementing Nuxt AI Ready module
- MCP server for AI-powered SEO
- Content signals for AI crawlers
- LLM optimization techniques

**Available references:**
- `references/v5-migration-guide.md` - Complete v4 to v5 migration guide (Site Config v4, renamed composables, removed APIs, upgrade steps)
- `references/seo-guides.md` - Comprehensive SEO implementation guides (rendering, JSON-LD, canonical URLs, IndexNow, Twitter Cards, Open Graph, meta robots, URL structure)
- `references/pro-modules.md` - Pro modules (AI Ready, Skew Protection, SEO Pro MCP)
- `references/advanced-seo-guides.md` - Advanced SEO topics (I18n multilanguage, route rules, enhanced titles, link checker rules, SPA prerendering, hydration, crawler protection, 404 pages)
- `references/og-image-guide.md` - OG image generation (Satori/Chromium, fonts, emojis, caching, custom templates)
- `references/nuxt-content-integration.md` - Nuxt Content v2/v3 integration (asSeoCollection, module order, auto-SEO)
- `references/sitemap-advanced.md` - Advanced sitemap patterns (dynamic URLs, multi-sitemaps, chunking, i18n, performance)
- `references/nitro-api-reference.md` - Server-side SEO hooks and composables (Nitro plugins, sitemap hooks, robots composables)
- `references/ai-seo-tools.md` - AI SEO tools (llms.txt, Nuxt AI Ready, MCP, content signals)
- `references/modules-overview.md` - Detailed overview of all 8 core modules
- `references/installation-guide.md` - Step-by-step installation patterns
- `references/api-reference.md` - Complete API documentation for all composables
- `references/common-patterns.md` - Real-world usage patterns and examples
- `references/module-details.md` - Detailed module configurations
- `references/best-practices.md` - Production SEO best practices
- `references/troubleshooting.md` - Error resolution guides
- `references/advanced-configuration.md` - Advanced configuration patterns

### Assets (assets/)

- `assets/package-versions.json` - Current module versions for verification

### Agents (agents/)

Autonomous agents for complex SEO tasks:

| Agent | Purpose |
|-------|---------|
| `seo-auditor.md` | Comprehensive SEO audit of Nuxt projects |
| `schema-generator.md` | Generate Schema.org structured data |
| `og-image-generator.md` | Create custom OG image Vue templates |
| `link-checker.md` | Analyze internal/external links |
| `sitemap-builder.md` | Design optimal sitemap strategies |

### Commands (commands/)

Slash commands for quick SEO tasks:

| Command | Purpose |
|---------|---------|
| `/seo-audit` | Run comprehensive SEO audit |
| `/seo-setup` | Quick Nuxt SEO project setup |
| `/og-preview` | Preview OG image generation |
| `/check-links` | Run link checker analysis |
| `/validate-sitemap` | Validate sitemap configuration |
| `/check-schema` | Validate Schema.org implementation |

### Hooks (hooks/)

SEO validation hooks that run automatically:

| Hook | Event | Purpose |
|------|-------|---------|
| SEO Config Validator | PreToolUse | Validates SEO configuration in file edits |
| Post-Write Checker | PostToolUse | Checks SEO config after file writes |
| Completion Validator | Stop | Ensures SEO validation before task completion |
| Project Detector | SessionStart | Detects Nuxt SEO modules on session start |

---

## Best Practices

### Top 3 Critical Practices

**1. Always Set Site Config**
```typescript
site: {
  url: process.env.NUXT_PUBLIC_SITE_URL,
  name: 'Your Site Name'
}
```

**2. Block Staging from Search Engines**
```typescript
robots: {
  disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : []
}
```

**3. Add Schema.org to All Pages**
Every page should have appropriate structured data (Organization, BlogPosting, Product, etc.).

**For complete best practices guide:**  
Load `references/best-practices.md` when you need:
- All 8 SEO best practices
- Environment variable configuration
- Dynamic sitemap generation
- OG image optimization
- Multi-language SEO setup
## Troubleshooting

### Top 3 Common Issues

**1. Sitemap Not Generating**
- Ensure `nuxt-sitemap` is installed
- Set `site.url` in config  
- Restart dev server and visit `/sitemap.xml`

**2. OG Images Not Rendering**
- Check if `nuxt-og-image` is installed
- Verify fonts are accessible
- For complex layouts, switch to Chromium renderer

**3. Build Errors**
- Update all modules to latest versions
- Clear `.nuxt` and `node_modules/.cache`
- Reinstall: `rm -rf node_modules && bun install`

**For complete troubleshooting guide:**  
Load `references/troubleshooting.md` when you need:
- Detailed solutions for all 5 common problems
- Advanced debugging techniques
- Module-specific error resolution
- Build and deployment issues
## Package Versions (Verified 2026-03-30)

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

## Complete Setup Checklist

Use this checklist to verify setup:

- [ ] Installed @nuxtjs/seo or individual modules
- [ ] Set `site.url` in nuxt.config.ts
- [ ] Configured `site.name` and `site.description`
- [ ] Set `defaultLocale` if using i18n
- [ ] Configured robots.txt to block admin/private pages
- [ ] Configured staging environment to block all crawling
- [ ] Created dynamic sitemap endpoints for content
- [ ] Added OG image to important pages
- [ ] Added Schema.org structured data to key pages
- [ ] Enabled link checker in development
- [ ] Tested `/robots.txt` endpoint
- [ ] Tested `/sitemap.xml` endpoint
- [ ] Verified OG images render correctly
- [ ] Submitted sitemap to Google Search Console
- [ ] Production build succeeds without errors

---

## Official Documentation

- **Nuxt SEO**: https://nuxtseo.com
- **v5 Migration Guide**: https://nuxtseo.com/docs/nuxt-seo/migration-guide/v4-to-v5
- **@nuxtjs/seo**: https://nuxtseo.com/docs/nuxt-seo/getting-started/introduction
- **nuxt-robots**: https://nuxtseo.com/docs/robots/getting-started/introduction
- **nuxt-sitemap**: https://nuxtseo.com/docs/sitemap/getting-started/introduction
- **nuxt-og-image**: https://nuxtseo.com/docs/og-image/getting-started/introduction
- **nuxt-schema-org**: https://nuxtseo.com/docs/schema-org/getting-started/introduction
- **nuxt-link-checker**: https://nuxtseo.com/docs/link-checker/getting-started/introduction
- **nuxt-ai-ready**: https://nuxtseo.com/docs/ai-ready/getting-started/introduction
- **nuxt-skew-protection**: https://nuxtseo.com/docs/skew-protection/getting-started/introduction
- **GitHub**: https://github.com/harlan-zw

---

**Production Ready**: All patterns based on official documentation from https://nuxtseo.com/llms-full.txt | Last verified: 2026-03-30

---

## Version History

**v4.0.0** (2026-03-30)
- Major update to Nuxt SEO v5 ecosystem
- Updated all module versions to v5 line
- Added v5 breaking changes and migration guidance:
  - Site Config v4: removed implicit site name, server-side `useSiteConfig(event)`, `getSiteIndexable`
  - Content v3 composable renames: `defineSitemapSchema`, `defineSchemaOrgSchema`, `defineRobotsSchema`
  - New server API: `getSiteConfig(event)` replaces `useSiteConfig(event)`
- Documented new v5 features:
  - DevTools Unity (shared DevTools layer across all modules)
  - ESLint link checking (`link-checker/valid-route`, `link-checker/valid-sitemap-link`)
  - `useShareLinks()` composable for social sharing with UTM tracking
  - Favicon generation CLI (`nuxt-seo-utils icons --source`)
  - Inline script/style minification
  - `definePageMeta` sitemap config
  - Debug production endpoints
  - OG Image security (URL signing, prop whitelisting)
  - Site Config priority constants
- Updated pro modules: AI Ready and Skew Protection now MIT licensed
- Updated install command to `npx nuxt module add seo`
- Added 4 new known issues (#11-#14) for v5 breaking changes
- Added `references/v5-migration-guide.md` with complete upgrade instructions

**v2.2.0** (2025-12-28)
- Full expansion with comprehensive coverage of all topics from nuxtseo.com/llms.txt
- Added 5 new reference files:
  - `references/og-image-guide.md` - Complete OG image guide (Satori/Chromium, fonts, emojis, caching)
  - `references/nuxt-content-integration.md` - Nuxt Content v2/v3 integration patterns
  - `references/sitemap-advanced.md` - Advanced sitemap patterns (dynamic URLs, multi-sitemaps, chunking)
  - `references/nitro-api-reference.md` - Server-side SEO hooks and composables
  - `references/ai-seo-tools.md` - Nuxt AI Ready, llms.txt, MCP server, content signals
- Added 3 new agents:
  - `agents/og-image-generator.md` - Creates custom OG image Vue templates
  - `agents/link-checker.md` - Analyzes internal/external links
  - `agents/sitemap-builder.md` - Designs optimal sitemap strategies
- Added 4 new commands:
  - `/og-preview` - Preview OG image generation
  - `/check-links` - Run link checker analysis
  - `/validate-sitemap` - Validate sitemap configuration
  - `/check-schema` - Validate Schema.org implementation
- Added SEO validation hooks:
  - PreToolUse hook for SEO config validation
  - PostToolUse hook for post-write checks
  - Stop hook for completion validation
  - SessionStart hook for project detection
- Enhanced keywords with 20+ new terms for better discoverability
- Total: 16 reference files, 5 agents, 6 commands, 4 hooks

**v2.1.0** (2025-12-28)
- Added `references/advanced-seo-guides.md` with 9 advanced topics:
  - I18n Multilanguage SEO (robots + sitemap integration)
  - SEO Route Rules (routeRules configuration)
  - Enhanced Titles (templates, fallbacks)
  - Nuxt SEO Utils Deep Dive
  - Nuxt Link Checker Rules (14 inspection rules)
  - Prerendering Vue SPA for SEO
  - Hydration Mismatches (causes, fixes, SEO impact)
  - Protecting from Malicious Crawlers
  - SEO-Friendly 404 Pages
- Added 5 new auto-trigger scenarios
- Enhanced keywords with 25+ new terms

**v2.0.0** (2025-12-28)
- Major update with comprehensive SEO guides and Pro modules
- Added `references/seo-guides.md` - Complete SEO implementation guides:
  - Rendering modes (SSR, SSG, ISR, Hybrid)
  - JSON-LD Structured Data
  - Canonical URLs
  - IndexNow & Indexing APIs
  - Twitter Cards
  - Social Sharing & Open Graph
  - Meta Robots Tags
  - URL Structure Best Practices
  - Rich Results
  - Debugging Vue SEO Issues
- Added `references/pro-modules.md` - Pro module documentation:
  - Nuxt AI Ready (llms.txt generation)
  - Nuxt Skew Protection (deployment version safety)
  - Nuxt SEO Pro MCP (AI-powered SEO tools)
- Created `agents/seo-auditor.md` - Autonomous SEO audit agent
- Created `agents/schema-generator.md` - Schema.org code generator
- Created `commands/seo-audit.md` - SEO audit slash command
- Created `commands/seo-setup.md` - Quick SEO setup command
- Updated all package versions to latest (2025-12-28)
- Enhanced keywords for better skill discovery
- Added 5 new auto-trigger scenarios

**v1.1.0** (2025-11-27)
- Refactored SKILL.md from 1505 to 628 lines (58% reduction)
- Extracted module details to references/module-details.md
- Extracted best practices to references/best-practices.md
- Extracted troubleshooting to references/troubleshooting.md
- Extracted advanced config to references/advanced-configuration.md
- Added "When to Load References" section for progressive disclosure
- Added TOCs to all 8 reference files
- All content preserved, just reorganized for optimal token efficiency
- Phases 6-7, 13-14 complete per skill-review process

**v1.0.0** (2025-11-10)
- Initial release
- Complete documentation for all 8 Nuxt SEO modules
- 10 documented error patterns
- Production-tested patterns
