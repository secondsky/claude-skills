# Nuxt SEO Standalone Modules

Standalone modules for AI optimization and version skew protection. Both are now MIT licensed and free to use.

---

## Table of Contents

1. [Nuxt AI Ready (MIT)](#nuxt-ai-ready)
2. [Nuxt Skew Protection (MIT)](#nuxt-skew-protection)
3. [Nuxt SEO Pro (Paid)](#nuxt-seo-pro)
4. [Module Comparison](#module-comparison)

---

## Nuxt AI Ready

**Package**: `nuxt-ai-ready`
**Version**: v1.1.0
**License**: MIT (free and open-source, was proprietary)
**Purpose**: Optimize your site for AI crawlers and language models

### What It Does

Generates `llms.txt` and `llms-full.txt` files that help AI systems understand your site content. This is the emerging standard for AI-friendly websites.

### Installation

```bash
npx nuxt module add nuxt-ai-ready
```

### v1 New Features

- **Mdream v1**: Native Rust HTML-to-markdown engine (up to 8x faster), WebAssembly for edge runtimes
- **Enhanced CLI Status**: `nuxt-ai-ready status` shows richer diagnostics
- **Shared Auth Utility**: `requireAuth()` consolidates endpoint auth
- **MCP Pages Resource**: Exposes pages via MCP with pagination
- **IndexNow Integration**: Automatic search engine notification on content changes

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-ai-ready'],

  aiReady: {
    enabled: true,
    title: 'My Site',
    description: 'A comprehensive guide to...',

    sources: [
      { path: '/docs/**', priority: 'high' },
      { path: '/blog/**', priority: 'medium' },
      { path: '/api/**', priority: 'low' }
    ],

    generateFull: true,
  }
})
```

### Generated Files

**llms.txt** (Summary):
```
# My Site

> A comprehensive guide to building modern web applications

## Documentation
- [Installation](/docs/installation)
- [Quick Start](/docs/quickstart)
- [API Reference](/docs/api)
```

**llms-full.txt** (Full Content):
Contains complete text content of all indexed pages for LLM training/context.

### v1 Breaking Changes

| Before | After |
|--------|-------|
| `mdreamOptions.preset` | Top-level flags (`{ minimal: true }`) |
| `cacheMaxAgeSeconds` | `llmsTxtCacheSeconds` |
| `BulkDocument` type | `PageDocument` |
| `ai-ready:markdown` hook | `ai-ready:page:markdown` |
| `?secret=` query auth | `Authorization: Bearer` header |

### Use Cases

1. **AI Search Optimization**: Help AI assistants find and cite your content
2. **LLM Training Data**: Provide structured content for AI models
3. **Documentation Sites**: Make docs AI-searchable
4. **IndexNow**: Automatic search engine notification on content changes

---

## Nuxt Skew Protection

**Package**: `nuxt-skew-protection`
**Version**: v1.1.0
**License**: MIT (free and open-source, was proprietary)
**Purpose**: Prevent version mismatches between server and client during deployments

### The Problem

During deployments, users may have:
- Old JavaScript bundles cached
- New server responding to requests
- Version mismatch causes hydration errors or broken functionality

### Installation

```bash
npx nuxt module add nuxt-skew-protection
```

### v1 New Features

#### Server Version Awareness

Every incoming request carries `event.context.skewVersion`:

```typescript
export default defineEventHandler((event) => {
  if (isClientOutdated(event)) {
    // return stale-safe response or set cache headers
  }
})
```

Utilities: `getClientVersion(event)`, `isClientOutdated(event)`

#### Rollback Detection

The composable exposes `isRollback` computed ref (true when server is OLDER than client).

#### DevTools Panel

Four tabs: Overview, Versions, Connections, Docs.

- **Overview**: Resolved module config, real-time health status
- **Versions**: Stored deployment versions with build timestamps
- **Connections**: Version distribution across active users (requires `connectionTracking: true`)
- **Docs**: Module documentation

#### Reload Strategies

- `prompt` (default) - Shows update prompt to user
- `immediate` - Reloads immediately
- `idle` - Waits for browser idle
- `false` - Disables auto-reload

### Configuration

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-skew-protection'],

  skewProtection: {
    enabled: true,
    version: process.env.DEPLOY_ID || 'auto',
    reloadStrategy: 'prompt',
    connectionTracking: true,
    bundleAssets: true,
  }
})
```

### v1 Breaking Changes

| Before | After |
|--------|-------|
| `bundlePreviousDeploymentChunks` | `bundleAssets` |
| `isOutdated` composable | `isAppOutdated` |
| `skew-protection:chunks-outdated` hook | `skew:chunks-outdated` |
| `/_skew/` route prefix | `/__skew/` |
| Default cookie name changed | Updated cookie defaults |

### Deployment Integration

```typescript
export default defineNuxtConfig({
  skewProtection: {
    version: process.env.VERCEL_DEPLOYMENT_ID
           || process.env.CLOUDFLARE_DEPLOYMENT_ID
           || process.env.COMMIT_SHA
           || Date.now().toString()
  }
})
```

### Migration

```bash
npx nuxt-skew-protection migrate
```

---

## Nuxt SEO Pro

**Package**: Part of Nuxt SEO Pro
**Price**: $119 one-time
**Purpose**: Professional SEO dashboard with Search Console integration

### Features

- **Search Console Integration**: Clicks, impressions, CTR, position data
- **Indexing Diagnostics**: See which pages are indexed and troubleshoot issues
- **Core Web Vitals**: Live CrUX data for your pages
- **Competitor Tracking**: Up to 10 competitors
- **AI Content Briefs**: Generate SEO-optimized content outlines
- **MCP Server**: GSC data exposed via MCP for Claude Code, Cursor, Windsurf

---

## Module Comparison

| Feature | AI Ready | Skew Protection | SEO Pro |
|---------|----------|-----------------|---------|
| **License** | MIT | MIT | Paid ($119) |
| **Purpose** | AI optimization | Deployment safety | SEO analytics |
| **Output** | llms.txt files | Version headers | Dashboard + MCP |
| **Target** | AI crawlers | End users | Developers |
| **Runtime** | Build time | Runtime | Both |
| **Required** | Optional | Recommended | Optional |

### When to Use Each

**Nuxt AI Ready**:
- Documentation sites
- Content-heavy sites
- Sites wanting AI discoverability
- Open source projects

**Nuxt Skew Protection**:
- Production applications
- Frequently deployed sites
- Sites with long user sessions
- E-commerce (prevent checkout issues)

**Nuxt SEO Pro**:
- Need Search Console data in DevTools
- Want Core Web Vitals monitoring
- Competitor analysis
- Content teams with AI-assisted writing

### Combined Configuration

```typescript
// nuxt.config.ts - Full setup
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/seo',
    'nuxt-ai-ready',
    'nuxt-skew-protection'
  ],

  site: {
    url: 'https://example.com',
    name: 'My Site'
  },

  aiReady: {
    enabled: true,
    generateFull: true
  },

  skewProtection: {
    enabled: true,
    reloadStrategy: 'prompt',
    version: process.env.DEPLOY_ID
  }
})
```

---

**Last Updated**: 2026-03-30
**Source**: https://nuxtseo.com
