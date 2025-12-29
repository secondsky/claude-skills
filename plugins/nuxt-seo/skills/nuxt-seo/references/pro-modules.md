# Nuxt SEO Pro Modules

Advanced modules for AI optimization, version skew protection, and MCP integration.

---

## Table of Contents

1. [Nuxt AI Ready](#nuxt-ai-ready)
2. [Nuxt Skew Protection](#nuxt-skew-protection)
3. [Nuxt SEO Pro MCP](#nuxt-seo-pro-mcp)
4. [Pro Module Comparison](#pro-module-comparison)

---

## Nuxt AI Ready

**Package**: `nuxt-ai-ready`
**Purpose**: Optimize your site for AI crawlers and language models

### What It Does

Generates `llms.txt` and `llms-full.txt` files that help AI systems understand your site content. This is the emerging standard for AI-friendly websites.

### Installation

```bash
bunx nuxi module add nuxt-ai-ready
# or: npx nuxi module add nuxt-ai-ready
```

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-ai-ready'],

  aiReady: {
    // Enable llms.txt generation
    enabled: true,

    // Site information for AI
    title: 'My Site',
    description: 'A comprehensive guide to...',

    // Content sources
    sources: [
      { path: '/docs/**', priority: 'high' },
      { path: '/blog/**', priority: 'medium' },
      { path: '/api/**', priority: 'low' }
    ],

    // Generate full content version
    generateFull: true,

    // Custom sections
    sections: [
      {
        title: 'Getting Started',
        content: 'Quick start guide...',
        links: ['/docs/installation', '/docs/quickstart']
      }
    ]
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

## Blog
- [Latest Updates](/blog)
```

**llms-full.txt** (Full Content):
Contains complete text content of all indexed pages for LLM training/context.

### Use Cases

1. **AI Search Optimization**: Help AI assistants find and cite your content
2. **LLM Training Data**: Provide structured content for AI models
3. **ChatGPT Plugins**: Enable AI tools to understand your site
4. **Documentation Sites**: Make docs AI-searchable

### API Endpoints

```typescript
// Automatically created
GET /llms.txt       // Summary file
GET /llms-full.txt  // Full content file
```

---

## Nuxt Skew Protection

**Package**: `nuxt-skew-protection`
**Purpose**: Prevent version mismatches between server and client during deployments

### The Problem

During deployments, users may have:
- Old JavaScript bundles cached
- New server responding to requests
- Version mismatch causes hydration errors or broken functionality

### Installation

```bash
bunx nuxi module add nuxt-skew-protection
# or: npx nuxi module add nuxt-skew-protection
```

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-skew-protection'],

  skewProtection: {
    // Enable protection
    enabled: true,

    // Version identifier (auto-generated if not set)
    version: process.env.DEPLOY_ID || 'auto',

    // Action when skew detected
    action: 'reload', // 'reload' | 'warn' | 'ignore'

    // Grace period after deployment (ms)
    gracePeriod: 60000, // 1 minute

    // Custom skew handler
    onSkew: (clientVersion, serverVersion) => {
      // Custom logic
      console.log(`Version mismatch: ${clientVersion} vs ${serverVersion}`)
    }
  }
})
```

### How It Works

1. **Version Embedding**: Embeds deployment version in both server responses and client bundles
2. **Version Checking**: Client checks version on each navigation/fetch
3. **Skew Detection**: Detects when versions don't match
4. **Recovery Action**: Triggers reload or custom action to sync versions

### Actions on Skew Detection

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  skewProtection: {
    // Automatic page reload (recommended)
    action: 'reload',

    // Just warn in console
    action: 'warn',

    // Ignore (not recommended)
    action: 'ignore',

    // Custom handler
    action: 'custom',
    onSkew: async (clientVersion, serverVersion) => {
      // Show user-friendly message
      showToast('New version available, refreshing...')

      // Wait a moment, then reload
      await sleep(1000)
      window.location.reload()
    }
  }
})
```

### Deployment Integration

```typescript
// nuxt.config.ts - with environment-based version
export default defineNuxtConfig({
  skewProtection: {
    // Use deployment-specific identifiers
    version: process.env.VERCEL_DEPLOYMENT_ID
          || process.env.CLOUDFLARE_DEPLOYMENT_ID
          || process.env.COMMIT_SHA
          || Date.now().toString()
  }
})
```

### Best Practices

1. **Always enable in production**: Essential for zero-downtime deployments
2. **Use deployment ID**: More reliable than timestamps
3. **Set grace period**: Allow time for CDN cache propagation
4. **Monitor skew events**: Track frequency of skew occurrences

---

## Nuxt SEO Pro MCP

**Package**: Part of `@nuxtjs/seo` Pro features
**Purpose**: AI-powered SEO tools via Model Context Protocol

### What is MCP?

Model Context Protocol (MCP) allows AI assistants like Claude to interact with external tools. Nuxt SEO Pro MCP exposes SEO tools that AI can use directly.

### Available MCP Tools

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `analyze-page` | SEO analysis of any URL | "Analyze the SEO of my homepage" |
| `suggest-meta` | Generate meta tag suggestions | "Suggest meta tags for my product page" |
| `check-schema` | Validate structured data | "Check if my schema.org is valid" |
| `audit-links` | Find broken links | "Find all broken links on my site" |
| `generate-sitemap` | Create sitemap entries | "Generate sitemap for new pages" |

### Claude Desktop Integration

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "nuxt-seo": {
      "command": "npx",
      "args": ["@nuxtjs/seo-mcp"],
      "env": {
        "SITE_URL": "https://your-site.com"
      }
    }
  }
}
```

### Using MCP Tools with Claude

Once configured, you can ask Claude:

- "Analyze the SEO of https://mysite.com/products"
- "Generate schema.org for my blog post about Vue.js"
- "Check if my site has any broken links"
- "Suggest improvements for my meta descriptions"

### API Access

```typescript
// Direct API usage (without MCP)
const seoTools = useSeoTools()

// Analyze page
const analysis = await seoTools.analyzePage('/products/123')

// Generate meta suggestions
const suggestions = await seoTools.suggestMeta({
  title: 'Product Name',
  content: 'Product description...'
})

// Validate schema
const validation = await seoTools.checkSchema('/products/123')
```

### MCP Server Implementation

```typescript
// server/mcp/seo-tools.ts
import { createMcpServer } from '@nuxtjs/seo-mcp'

export default createMcpServer({
  tools: {
    'analyze-page': {
      description: 'Analyze SEO of a page',
      parameters: {
        url: { type: 'string', required: true }
      },
      handler: async ({ url }) => {
        // Perform SEO analysis
        return analyzeSeo(url)
      }
    },

    'suggest-meta': {
      description: 'Suggest meta tags based on content',
      parameters: {
        content: { type: 'string', required: true },
        type: { type: 'string', enum: ['article', 'product', 'page'] }
      },
      handler: async ({ content, type }) => {
        return generateMetaSuggestions(content, type)
      }
    }
  }
})
```

---

## Pro Module Comparison

| Feature | AI Ready | Skew Protection | SEO Pro MCP |
|---------|----------|-----------------|-------------|
| **Purpose** | AI optimization | Deployment safety | AI-assisted SEO |
| **Output** | llms.txt files | Version headers | MCP tools |
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

**Nuxt SEO Pro MCP**:
- Development workflow
- SEO auditing
- Content teams
- Claude Desktop users

### Combined Configuration

```typescript
// nuxt.config.ts - Full Pro setup
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/seo',
    'nuxt-ai-ready',
    'nuxt-skew-protection'
  ],

  // Base SEO
  site: {
    url: 'https://example.com',
    name: 'My Site'
  },

  // AI optimization
  aiReady: {
    enabled: true,
    generateFull: true
  },

  // Deployment protection
  skewProtection: {
    enabled: true,
    action: 'reload',
    version: process.env.DEPLOY_ID
  }
})
```

---

**Last Updated**: 2025-12-28
**Source**: https://nuxtseo.com

