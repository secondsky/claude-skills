# Nuxt AI Ready - Complete Guide

Make your Nuxt site discoverable by AI agents through llms.txt, MCP servers, and markdown APIs.

**Note:** Nuxt AI Ready is a [Nuxt SEO Pro](https://nuxtseo.com/pro) module requiring a license.

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [llms.txt Generation](#llmstxt-generation)
4. [On-Demand Markdown](#on-demand-markdown)
5. [Model Context Protocol (MCP)](#model-context-protocol-mcp)
6. [Content Signals](#content-signals)
7. [Hooks Reference](#hooks-reference)
8. [Configuration](#configuration)

---

## Overview

Users increasingly ask AI assistants questions your site could answer—but LLMs only cite sources they can parse. Two standards are emerging to solve this:

- **[llms.txt](https://llmstxt.org/)** — AI-readable site summaries
- **[MCP](https://modelcontextprotocol.io/)** — Protocol for agents to query your content directly

### Features

- **llms.txt Generation**: Automatic `/llms.txt` and `/llms-full.txt` files at build time
- **On-Demand Markdown**: Any route available as `.md` (e.g., `/about` → `/about.md`)
- **MCP Server**: Tools for AI agent integration (`list_pages`, `search_pages_fuzzy`)
- **Content Signals**: Configure AI training/search permissions via robots.txt

---

## Installation

```bash
# Install the module
bunx nuxi module add nuxt-ai-ready

# Requires sitemap module
bunx nuxi module add @nuxtjs/sitemap
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/sitemap',
    'nuxt-ai-ready'
  ],

  site: {
    url: 'https://example.com'
  }
})
```

---

## llms.txt Generation

### /llms.txt

Site overview with page links. Built from page metadata collected during prerender.

**Format:**
```txt
# <Site Title>

> <Site Description>

## Pages

- [Page Title](/page-link): Meta Description
  ...

## <Section Title>

- [Link Title](/link): Description
  ...

<Notes>
```

**Live example:** [nuxtseo.com/llms.txt](https://nuxtseo.com/llms.txt)

### /llms-full.txt

Full markdown content for all pages. Streamed during prerender—each page appended as processed.

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  aiReady: {
    llmsTxt: {
      sections: [
        {
          title: 'API Reference',
          links: [
            { title: 'REST API', href: '/docs/api', description: 'API documentation' }
          ]
        }
      ],
      notes: 'Built with Nuxt AI Ready'
    }
  }
})
```

### Modify with Hook

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  hooks: {
    'ai-ready:llms-txt': (payload) => {
      payload.sections.push({
        title: 'Custom APIs',
        links: [{ title: 'Search', href: '/api/search', description: 'Search endpoint' }]
      })
      payload.notes.push('Custom note')
    }
  }
})
```

### Page Discovery Flow

```
Phase 1 (Prerender)     Phase 2 (Sitemap)       Runtime
─────────────────────   ─────────────────────   ─────────────────────
app:rendered            sitemap:prerender:done  GET /llms.txt
    ↓                       ↓                       ↓
Queue .md routes        Parse sitemap.xml       fetchSitemapUrls()
    ↓                       ↓                       ↓
HTML → Markdown         Fetch .md for SSR       Combine prerendered
    ↓                   pages                   + sitemap URLs
Write JSONL +               ↓                       ↓
llms-full.txt           Add to JSONL only       Generate llms.txt
```

---

## On-Demand Markdown

Any route can be accessed as `.md` for AI consumption.

**Example:** `/about` → `/about.md`

### Customizing Conversion

```typescript
// server/plugins/mdream.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('ai-ready:mdreamConfig', (config) => {
    // Skip navigation elements
    config.ignoreSelectors = ['nav', '.sidebar', '.footer']

    // Preserve code blocks
    config.preserveCodeBlocks = true
  })
})
```

### Post-Process Markdown

```typescript
// server/plugins/markdown.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('ai-ready:markdown', (ctx) => {
    // Add source link
    ctx.markdown += `\n\n---\nSource: ${ctx.route}`
  })
})
```

---

## Model Context Protocol (MCP)

Connect AI agents like Claude to your Nuxt site.

### Installation

```bash
npx nuxi module add @nuxtjs/mcp-toolkit
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    'nuxt-ai-ready',
    '@nuxtjs/mcp-toolkit',
  ],
})
```

### Connect Claude Desktop

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "my-site": {
      "command": "npx",
      "args": ["-y", "@nuxtjs/mcp-client", "https://example.com/mcp"]
    }
  }
}
```

### Available Tools

#### list_pages

Returns page metadata as JSON. Cached 1 hour.

**Response:**
```json
[
  {
    "route": "/docs/getting-started",
    "title": "Getting Started",
    "description": "Quick start guide",
    "headings": "h1:Getting Started|h2:Installation",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
]
```

#### search_pages_fuzzy

Fuzzy search across pages via Fuse.js. Searches title, description, and route. Cached 5 minutes.

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `query` | `string` | Search query |
| `limit` | `number` | Max results (default: 10) |

**Response:**
```json
[
  {
    "route": "/docs/installation",
    "title": "Installation",
    "description": "Install the module",
    "score": 0.15
  }
]
```

### Available Resources

#### resource://nuxt-ai-ready/pages

Page listing as JSON. Same data as `list_pages` tool. Cached 1 hour.

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  aiReady: {
    mcp: {
      tools: false,     // Disable all tools
      resources: false, // Disable all resources
    },
  }
})
```

---

## Content Signals

Control how AI systems interact with your content through robots.txt directives.

### Standards

**Content-Usage** (values: `y`/`n`)
- `train-ai` — foundation model training

**Content-Signal** (values: `yes`/`no`)
- `search` — indexing/snippets
- `ai-input` — RAG, grounding, AI search
- `ai-train` — model training/fine-tuning

### Enable Content Signals

Disabled by default. Enable to allow AI training and indexing:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  aiReady: {
    contentSignal: {
      aiTrain: true,
      search: true,
      aiInput: true
    }
  }
})
```

**Produces in robots.txt:**
```txt
# Nuxt AI Ready Content Signals
Content-Usage: train-ai=y
Content-Signal: ai-train=yes, search=yes, ai-input=yes
```

### Selective Permissions

Allow search indexing but block training:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  aiReady: {
    contentSignal: {
      search: true,
      aiInput: false,
      aiTrain: false
    }
  }
})
```

Set `contentSignal: false` to disable entirely (default).

---

## Hooks Reference

### Nuxt Hooks (Build-time)

#### ai-ready:llms-txt

Modify llms.txt sections before generation.

```typescript
export default defineNuxtConfig({
  hooks: {
    'ai-ready:llms-txt': (payload) => {
      payload.sections.push({
        title: 'Custom Section',
        links: [/* ... */]
      })
      payload.notes.push('Custom note')
    }
  }
})
```

#### ai-ready:page:markdown

Modify or filter pages during prerender.

```typescript
export default defineNuxtConfig({
  hooks: {
    'ai-ready:page:markdown': (ctx) => {
      // Skip draft pages
      if (ctx.route.startsWith('/drafts/')) {
        ctx.markdown = ''  // Empty = excluded
        return
      }

      // Add frontmatter
      ctx.markdown = `---
route: ${ctx.route}
title: ${ctx.title}
---

${ctx.markdown}`
    }
  }
})
```

**Context properties:**
- `route`: Page path (e.g., `/about`)
- `markdown`: Converted content (mutable)
- `title`: Extracted `<title>`
- `description`: Extracted meta description
- `headings`: Array of `{ level, text }` objects

### Nitro Hooks (Runtime)

#### ai-ready:mdreamConfig

Customize HTML → markdown conversion.

```typescript
// server/plugins/mdream.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('ai-ready:mdreamConfig', (config) => {
    config.ignoreSelectors = ['nav', '.sidebar', '.footer']
    config.preserveCodeBlocks = true
  })
})
```

#### ai-ready:markdown

Post-process markdown at runtime for `.md` requests.

```typescript
// server/plugins/markdown.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('ai-ready:markdown', (ctx) => {
    ctx.markdown += `\n\n---\nSource: ${ctx.route}`
  })
})
```

---

## Configuration

### Full Configuration Reference

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  aiReady: {
    // llms.txt configuration
    llmsTxt: {
      enabled: true,
      sections: [
        {
          title: 'Section Title',
          links: [
            { title: 'Link', href: '/path', description: 'Description' }
          ]
        }
      ],
      notes: 'Footer notes'
    },

    // Content signals for robots.txt
    contentSignal: {
      aiTrain: false,  // Allow AI training
      search: false,   // Allow search indexing
      aiInput: false   // Allow RAG/grounding
    },

    // MCP configuration
    mcp: {
      tools: true,     // Enable MCP tools
      resources: true  // Enable MCP resources
    },

    // Markdown conversion
    markdown: {
      enabled: true    // Enable .md routes
    }
  }
})
```

### Environment-Based Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  aiReady: {
    // Only enable in production
    contentSignal: process.env.NODE_ENV === 'production'
      ? { aiTrain: true, search: true, aiInput: true }
      : false
  }
})
```

---

## Sitemap Requirements

The module requires `@nuxtjs/sitemap` for page discovery:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/sitemap', 'nuxt-ai-ready']
})
```

### Excluding Pages

Pages excluded from sitemap are automatically excluded from llms.txt:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    exclude: ['/admin/**', '/api/**', '/drafts/**']
  }
})
```

---

## Dev Mode Notes

In development:
- llms.txt returns a notice about missing data
- Page data only available after `nuxi generate` or `nuxi build --prerender`
- Runtime `.md` routes still work for testing markdown conversion

For full functionality, test with a production build.

---

## Official Documentation

- **Nuxt AI Ready**: https://nuxtseo.com/docs/ai-ready/getting-started/introduction
- **llms.txt Standard**: https://llmstxt.org/
- **Model Context Protocol**: https://modelcontextprotocol.io/
- **Content Signals**: https://contentsignals.org/
- **GitHub**: https://github.com/nuxt-seo-pro/nuxt-ai-ready
