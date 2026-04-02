# Nuxt 5 - Comprehensive Framework Plugin

Production-ready Nuxt 5 development with 4 focused skills, 3 diagnostic agents, interactive setup wizard, and official Nuxt MCP integration.

## Plugin Overview

This plugin provides **complete Nuxt 5 coverage** through:

- **4 Focused Skills**: Core, Data, Server, Production
- **3 Diagnostic Agents**: Debugger, Migration Assistant, Performance Analyzer
- **1 Interactive Command**: Setup Wizard
- **MCP Integration**: Official Nuxt MCP server for real-time documentation

## What's New in Nuxt 5

Nuxt 5 brings major infrastructure upgrades:

| Area | Nuxt 4 | Nuxt 5 |
|------|--------|--------|
| Bundler | Vite 6 (esbuild + Rollup) | Vite 8 (Rolldown) |
| Server engine | Nitro v2 | Nitro v3 (h3 v2, Web Standard APIs) |
| Error handling | `createError({statusCode})` | `HTTPError({status})` (server) |
| Server API | `event.path`, `event.node.res` | `event.url`, `event.res` (Web Standard) |
| Vite config | Separate client/server configs | Vite Environment API |
| JS runtime | JSX plugin included by default | JSX plugin optional (on-demand) |
| Client-only placeholder | Empty `<div>` | HTML comment node |
| callHook | Always returns Promise | May return void (sync when possible) |
| clearNuxtState | Sets to `undefined` | Resets to initial default value |
| Page names | Auto-generated | Normalized to match route names |

## Skills

### nuxt-core
Project setup, configuration, routing, SEO, and error handling.

**Use when**: Setting up new projects, configuring `nuxt.config.ts`, implementing file-based routing, adding middleware, using `useHead`/`useSeoMeta`, handling errors with `error.vue`.

### nuxt-data
Composables, data fetching, and state management.

**Use when**: Creating custom composables, fetching data with `useFetch`/`useAsyncData`, managing global state with `useState`, debugging reactive data issues.

### nuxt-server
Server routes, API patterns, and Nitro v3 development.

**Use when**: Creating API endpoints, implementing server middleware, integrating databases (D1, PostgreSQL, Drizzle), handling file uploads, building WebSocket features.

### nuxt-production
Hydration, performance, testing, deployment, and migration.

**Use when**: Debugging hydration mismatches, optimizing Core Web Vitals, writing Vitest tests, deploying to Cloudflare/Vercel/Netlify, migrating from Nuxt 4 to Nuxt 5.

## Agents

### nuxt-debugger
**7-phase autonomous diagnostic agent** for troubleshooting Nuxt applications.

**Triggers**: Hydration mismatches, SSR errors, routing problems, data fetching issues, server route failures.

### nuxt-migration-assistant
**6-phase autonomous migration agent** for upgrading from Nuxt 4 to Nuxt 5.

**Triggers**: "Migrate to Nuxt 5", "Upgrade from Nuxt 4", v4 compatibility issues.

### nuxt-performance-analyzer
**6-phase autonomous performance agent** for optimizing Nuxt applications.

**Triggers**: Slow page loads, Core Web Vitals optimization, bundle size reduction.

## Commands

### /nuxt-setup
**Interactive wizard** for creating new Nuxt 5 projects.

**Questions Asked**:
1. Project Type (Full-Stack, Marketing Site, API, SPA)
2. UI Framework (Nuxt UI, Tailwind, shadcn-vue)
3. Features (Auth, Database, Content, Testing)
4. Database (D1, NuxtHub, PostgreSQL)
5. Deployment Target (Cloudflare, Vercel, Netlify)
6. Package Manager (bun, pnpm, npm)

## MCP Integration

This plugin includes the official Nuxt MCP server for real-time documentation access.

### Claude Code (CLI)

```bash
claude mcp add --transport http nuxt https://nuxt.com/mcp
```

### Claude Desktop

```json
{
  "mcpServers": {
    "nuxt": {
      "command": "npx",
      "args": ["mcp-remote", "https://nuxt.com/mcp"]
    }
  }
}
```

### Cursor / VS Code / Windsurf

Add to respective MCP config:
```json
{
  "mcpServers": {
    "nuxt": { "type": "http", "url": "https://nuxt.com/mcp" }
  }
}
```

## Key v5 Migration Points

### Server-side error handling changed
```typescript
// Nuxt 4
import { createError } from 'h3'
throw createError({ statusCode: 404, statusMessage: 'Not Found' })

// Nuxt 5
import { HTTPError } from 'nitro/h3'
throw new HTTPError({ status: 404, statusText: 'Not Found' })
```

### Server event API uses Web Standards
```typescript
// Nuxt 4
event.path
event.node.res.statusCode = 200
setResponseHeader(event, 'x-custom', 'value')

// Nuxt 5
event.url.pathname
event.res.status = 200
event.res.headers.set('x-custom', 'value')
```

### Vite config uses Environment API
```typescript
// Nuxt 5 - use configEnvironment + applyToEnvironment
addVitePlugin(() => ({
  name: 'my-plugin',
  configEnvironment(name, config) {
    if (name === 'client') {
      config.optimizeDeps ||= {}
      config.optimizeDeps.include ||= []
      config.optimizeDeps.include.push('my-package')
    }
  },
  applyToEnvironment(env) { return env.name === 'client' },
}))
```

### useRuntimeConfig() no longer accepts event
```typescript
// Nuxt 4
const config = useRuntimeConfig(event)

// Nuxt 5
const config = useRuntimeConfig()
```

## Version Requirements

| Package | Minimum | Recommended |
|---------|---------|-------------|
| nuxt | 5.0.0 | 5.x |
| vue | 3.5.0 | 3.5.x |
| nitro | 3.0.0 | 3.x |
| vite | 8.0.0 | 8.x |
| typescript | 5.0.0 | 5.x |

## Related Plugins

- **nuxt-ui-v4**: Nuxt UI component library
- **cloudflare-d1**: D1 database patterns
- **cloudflare-kv**: KV storage patterns
- **cloudflare-r2**: R2 object storage
- **better-auth**: Authentication patterns
- **pinia-v3**: State management

## Installation

```bash
/plugin install nuxt-v5@claude-skills
```

## License

MIT

---

**Version**: 5.0.0 | **Last Updated**: 2026-03-30 | **Maintainer**: Claude Skills Maintainers
