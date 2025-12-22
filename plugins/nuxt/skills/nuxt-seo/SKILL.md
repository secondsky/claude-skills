---
name: nuxt-seo
description: |
  Comprehensive guide for all 8 Nuxt SEO modules: @nuxtjs/seo, nuxt-robots, nuxt-sitemap, nuxt-og-image, nuxt-schema-org, nuxt-link-checker, nuxt-seo-utils, and nuxt-site-config. Use when building SEO-optimized Nuxt applications, implementing robots.txt and sitemaps, generating Open Graph images, adding Schema.org structured data, managing meta tags, checking links, or configuring site-wide SEO settings.

  Keywords: nuxt-seo, nuxt, seo, nuxt 3, nuxt 4, nuxt seo, vue, vue 3, search engine optimization, @nuxtjs/seo, nuxt-robots, nuxt-sitemap, nuxt-og-image, nuxt-schema-org, nuxt-link-checker, nuxt-seo-utils, nuxt-site-config, robots.txt, sitemap, sitemap.xml, og image, open graph, social sharing, meta tags, schema.org, structured data, json-ld, canonical urls, breadcrumbs, bot detection, crawling, indexing, noindex, nofollow, xml sitemap, multiple sitemaps, sitemap index, dynamic sitemap, og image generation, satori, chromium rendering, vue templates, seo setup, seo configuration, meta management, social media preview, search optimization, link checking, broken links, site config, multi-language seo, i18n seo, sitemap not generated, robots.txt missing, og image not rendering, schema validation errors, duplicate meta tags, canonical url issues, sitemap index errors
license: MIT
metadata:
  version: 1.1.0
  last_updated: 2025-11-27
  module_versions:
    nuxtjs_seo: 3.2.2
    nuxt_robots: 5.5.6
    nuxt_sitemap: 7.4.7
    nuxt_og_image: 5.1.12
    nuxt_schema_org: 5.0.9
    nuxt_link_checker: 4.3.6
    nuxt_seo_utils: 7.0.18
    nuxt_site_config: 3.2.11
  nuxt_compatibility: ">=3.0.0"
  auto_trigger_scenarios:
    - Setting up SEO in Nuxt project
    - Configuring robots.txt or sitemap
    - Generating Open Graph images
    - Adding Schema.org structured data
    - Managing meta tags and social sharing
    - Checking and fixing broken links
    - Implementing site-wide SEO configuration
---

# Nuxt SEO - Complete Guide to All 8 SEO Modules

**Status**: Production Ready
**Last Updated**: 2025-11-27
**Dependencies**: Nuxt >=3.0.0
**Latest Versions**: See module versions table below

Use this skill when building SEO-optimized Nuxt applications with any combination of the 8 official Nuxt SEO modules. This skill covers the complete Nuxt SEO ecosystem maintained by Harlan Wilton.

---

## Nuxt SEO Ecosystem Overview

Nuxt SEO consists of **8 specialized modules** that work together seamlessly:

| Module | Version | Downloads | Purpose |
|--------|---------|-----------|---------|
| **@nuxtjs/seo** | v3.2.2 | 1.8M | Primary SEO module (installs all 8 modules as bundle) |
| **nuxt-robots** | v5.5.6 | 7.1M | Manages robots.txt and bot detection |
| **nuxt-sitemap** | v7.4.7 | 8.6M | Generates XML sitemaps with advanced features |
| **nuxt-og-image** | v5.1.12 | 2.5M | Creates Open Graph images via Vue templates |
| **nuxt-schema-org** | v5.0.9 | 2.9M | Builds Schema.org structured data graphs |
| **nuxt-link-checker** | v4.3.6 | 2M | Finds and fixes broken links |
| **nuxt-seo-utils** | v7.0.18 | 1.1M | SEO utilities for discoverability & shareability |
| **nuxt-site-config** | v3.2.11 | 7.9M | Centralized site configuration management |

**Requirements**: Nuxt v3 or v4

---

## Quick Start (5 Minutes)

### 1. Install Complete SEO Bundle

Install all 8 modules at once:

```bash
# Using Bun (primary)
bunx nuxi module add @nuxtjs/seo

# Using npm (backup)
npx nuxi module add @nuxtjs/seo

# Using pnpm (backup)
pnpm dlx nuxi module add @nuxtjs/seo
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

**CRITICAL:**
- Set `site.url` to production URL (required for sitemaps and canonical URLs)
- Use environment variable for multi-environment setups
- Set `defaultLocale` if using i18n

### 3. Restart and Verify

```bash
bun run dev
# or
npm run dev
```

Visit these URLs to verify:
- `http://localhost:3000/robots.txt` - Robots file
- `http://localhost:3000/sitemap.xml` - Sitemap

---

## Installation Options

### Option 1: Complete Bundle (Recommended)

```bash
bunx nuxi module add @nuxtjs/seo
# or: npx nuxi module add @nuxtjs/seo
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
# Bun
bunx nuxi module add nuxt-robots
bunx nuxi module add nuxt-sitemap
bunx nuxi module add nuxt-og-image

# npm
npx nuxi module add nuxt-robots
npx nuxi module add nuxt-sitemap
npx nuxi module add nuxt-og-image

# pnpm (backup)
pnpm dlx nuxi module add nuxt-robots
pnpm dlx nuxi module add nuxt-sitemap
pnpm dlx nuxi module add nuxt-og-image
```

Configuration:

```typescript
export default defineNuxtConfig({
  modules: [
    'nuxt-robots',
    'nuxt-sitemap',
    'nuxt-og-image'
  ]
})
```

---

## Module Overview (Brief)

The Nuxt SEO ecosystem consists of **8 specialized modules** that work together seamlessly. Each module serves a specific purpose and can be installed individually or as a complete bundle.

### Module 1: @nuxtjs/seo
Primary SEO module that installs all 8 modules as a bundle. Provides unified configuration through the `site` object and integrates with Nuxt Content for automatic SEO.

### Module 2: nuxt-robots
Manages robots.txt and bot detection. Controls which pages search engines can crawl with site-wide and page-level rules. Includes server-side and client-side bot detection.

### Module 3: nuxt-sitemap
Generates XML sitemaps automatically from routes with support for dynamic URLs, multiple sitemaps, media, and advanced optimization. Perfect for large sites with thousands of pages.

### Module 4: nuxt-og-image
Creates Open Graph images dynamically using Vue templates. Zero runtime overhead with Satori renderer or full CSS support with Chromium renderer.

### Module 5: nuxt-schema-org
Builds Schema.org structured data for enhanced search results with rich snippets, knowledge panels, and better SEO.

### Module 6: nuxt-link-checker
Finds and fixes links that may negatively affect SEO. Detects broken links, redirects, and issues during development and build.

### Module 7: nuxt-seo-utils
SEO utilities for discoverability and shareability including canonical URLs, breadcrumbs, app icons, and Open Graph automation.

### Module 8: nuxt-site-config
Centralized site configuration management for all SEO modules. Single source of truth for site-wide settings like URL, name, and locale.

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

✅ Set `site.url` in nuxt.config.ts (required for sitemaps and canonical URLs)
✅ Use environment variables for multi-environment setups
✅ Configure robots.txt to block admin/private pages
✅ Add Schema.org structured data to all important pages
✅ Generate OG images for social sharing
✅ Test all SEO features before deploying to production
✅ Submit sitemap to Google Search Console after deployment
✅ Enable link checker during development

### Never Do

❌ Forget to set `site.url` (breaks sitemaps and canonical URLs)
❌ Allow crawling of staging environments
❌ Skip Schema.org for key pages (products, articles, events)
❌ Deploy without testing OG images
❌ Use outdated module versions
❌ Ignore broken links found by link checker
❌ Forget to exclude admin/private routes from sitemap
❌ Use wrong rendering engine for OG images (Chromium vs Satori)

---

## Known Issues Prevention

This skill prevents **10** documented common SEO mistakes:

### Issue #1: Sitemap Not Generating

**Error**: `/sitemap.xml` returns 404
**Why It Happens**: Missing `site.url` configuration
**Prevention**: Always set `site.url` in nuxt.config.ts

### Issue #2: robots.txt Missing

**Error**: `/robots.txt` not accessible
**Why It Happens**: Module not installed or misconfigured
**Prevention**: Install `nuxt-robots` and set `site.url`

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
**Prevention**: Enable `nuxt-link-checker` during development

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
**Prevention**: Use `chunksSize` option to split large sitemaps

### Issue #9: Crawling Staging Environment

**Error**: Staging site indexed by Google
**Why It Happens**: No robots.txt blocking
**Prevention**: Configure robots to block staging: `disallow: process.env.NUXT_PUBLIC_ENV === 'staging' ? ['/'] : []`

### Issue #10: Missing Social Sharing Images

**Error**: No preview image when sharing on social media
**Why It Happens**: OG image not defined or not accessible
**Prevention**: Use `defineOgImage()` on all important pages

---

## Configuration Example

### Basic Production Config

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

**New references (to be created in Phase 13):**

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

**Current references:**
- `references/modules-overview.md` - Detailed overview of all 8 modules
- `references/installation-guide.md` - Step-by-step installation patterns
- `references/api-reference.md` - Complete API documentation for all composables
- `references/common-patterns.md` - Real-world usage patterns and examples

### Assets (assets/)

- `assets/package-versions.json` - Current module versions for verification

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
## Package Versions (Verified 2025-11-10)

```json
{
  "dependencies": {
    "@nuxtjs/seo": "^3.2.2",
    "nuxt-robots": "^5.5.6",
    "nuxt-sitemap": "^7.4.7",
    "nuxt-og-image": "^5.1.12",
    "nuxt-schema-org": "^5.0.9",
    "nuxt-link-checker": "^4.3.6",
    "nuxt-seo-utils": "^7.0.18",
    "nuxt-site-config": "^3.2.11"
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
- **@nuxtjs/seo**: https://nuxtseo.com/nuxt-seo/getting-started/installation
- **nuxt-robots**: https://nuxtseo.com/robots/getting-started/installation
- **nuxt-sitemap**: https://nuxtseo.com/sitemap/getting-started/installation
- **nuxt-og-image**: https://nuxtseo.com/og-image/getting-started/installation
- **nuxt-schema-org**: https://nuxtseo.com/schema-org/getting-started/installation
- **nuxt-link-checker**: https://nuxtseo.com/link-checker/getting-started/installation
- **GitHub**: https://github.com/harlan-zw

---

**Production Ready**: All patterns based on official documentation from https://nuxtseo.com/llms.txt | Last verified: 2025-11-10

---

## Version History

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
