# Nuxt 4 - Comprehensive Framework Plugin

Production-ready Nuxt 4 development with 4 focused skills, 3 diagnostic agents, interactive setup wizard, and official Nuxt MCP integration.

## Plugin Overview

This plugin provides **complete Nuxt 4 coverage** through:

- **4 Focused Skills**: Core, Data, Server, Production
- **3 Diagnostic Agents**: Debugger, Migration Assistant, Performance Analyzer
- **1 Interactive Command**: Setup Wizard
- **MCP Integration**: Official Nuxt MCP server for real-time documentation

## Skills

### nuxt-core
Project setup, configuration, routing, SEO, and error handling.

**Use when**: Setting up new projects, configuring `nuxt.config.ts`, implementing file-based routing, adding middleware, using `useHead`/`useSeoMeta`, handling errors with `error.vue`.

### nuxt-data
Composables, data fetching, and state management.

**Use when**: Creating custom composables, fetching data with `useFetch`/`useAsyncData`, managing global state with `useState`, integrating Pinia, debugging reactive data issues.

### nuxt-server
Server routes, API patterns, and Nitro development.

**Use when**: Creating API endpoints, implementing server middleware, integrating databases (D1, PostgreSQL, Drizzle), handling file uploads, building WebSocket features.

### nuxt-production
Hydration, performance, testing, deployment, and migration.

**Use when**: Debugging hydration mismatches, optimizing Core Web Vitals, writing Vitest tests, deploying to Cloudflare/Vercel/Netlify, migrating from Nuxt 3 to Nuxt 4.

## Agents

### nuxt-debugger
**7-phase autonomous diagnostic agent** for troubleshooting Nuxt applications.

**Triggers**: Hydration mismatches, SSR errors, routing problems, data fetching issues, server route failures.

**Phases**:
1. Configuration Validation
2. Routing Analysis
3. Data Fetching Review
4. SSR/Hydration Check
5. Server Route Validation
6. Performance Baseline
7. Generate Diagnostic Report

### nuxt-migration-assistant
**6-phase autonomous migration agent** for upgrading from Nuxt 3 to Nuxt 4.

**Triggers**: "Migrate to Nuxt 4", "Upgrade from Nuxt 3", v3 compatibility issues.

**Phases**:
1. Version Detection & Assessment
2. Breaking Changes Analysis
3. Auto-Fixable Changes
4. Manual Fix Guidance
5. Verification
6. Migration Report

### nuxt-performance-analyzer
**6-phase autonomous performance agent** for optimizing Nuxt applications.

**Triggers**: Slow page loads, Core Web Vitals optimization, bundle size reduction.

**Phases**:
1. Bundle Analysis
2. Component Optimization
3. Data Fetching Efficiency
4. Rendering Strategy Optimization
5. Asset Optimization
6. Performance Report

## Commands

### /nuxt-setup
**Interactive 8-step wizard** for creating new Nuxt 4 projects.

**Questions Asked**:
1. Project Type (Full-Stack, Marketing Site, API, SPA)
2. UI Framework (Nuxt UI, Tailwind, shadcn-vue)
3. Features (Auth, Database, Content, Testing)
4. Database (D1, NuxtHub, PostgreSQL)
5. Deployment Target (Cloudflare, Vercel, Netlify)
6. Package Manager (bun, pnpm, npm)

**Output**: Fully configured project with selected features.

## MCP Integration

This plugin includes the official Nuxt MCP server for real-time documentation access.

**Provides**: Composable signatures, component examples, configuration options, and migration guides directly from Nuxt docs.

### Automatic Setup (Claude Code Plugin)

When you install this plugin, the MCP server is configured automatically via `.mcp.json`.

### Manual Setup by Client

Instructions below are from the [official Nuxt MCP documentation](https://nuxt.com/docs/4.x/guide/ai/mcp).

#### Claude Code (CLI)

Run this command:

```bash
claude mcp add --transport http nuxt https://nuxt.com/mcp
```

#### Claude Desktop

Add to your Claude Desktop configuration file:

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

#### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "nuxt": {
      "type": "http",
      "url": "https://nuxt.com/mcp"
    }
  }
}
```

#### Visual Studio Code (GitHub Copilot)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "nuxt": {
      "type": "http",
      "url": "https://nuxt.com/mcp"
    }
  }
}
```

#### Windsurf

Add to `.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "nuxt": {
      "type": "http",
      "url": "https://nuxt.com/mcp"
    }
  }
}
```

#### Zed

Add to your Zed settings:

```json
{
  "context_servers": {
    "nuxt": {
      "source": "custom",
      "command": "npx",
      "args": ["mcp-remote", "https://nuxt.com/mcp"],
      "env": {}
    }
  }
}
```

#### Opencode

Add to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "nuxt": {
      "type": "remote",
      "url": "https://nuxt.com/mcp",
      "enabled": true
    }
  }
}
```

#### ChatGPT

Use this URL in ChatGPT's MCP integration:

```
https://nuxt.com/mcp
```

#### Le Chat Mistral

Use this URL in Le Chat's MCP settings:

```
https://nuxt.com/mcp
```

### Verify MCP Connection

After configuration, verify the MCP server is connected:

```
"What composables are available in Nuxt?"
→ Should return live data from Nuxt MCP
```

### MCP Capabilities

The Nuxt MCP provides:
- **Composable Documentation**: `useFetch`, `useAsyncData`, `useState`, etc.
- **Component Examples**: NuxtPage, NuxtLayout, ClientOnly, etc.
- **Configuration Reference**: `nuxt.config.ts` options
- **Migration Guides**: Nuxt 3 → 4 breaking changes
- **Module Documentation**: Official Nuxt modules

## Directory Structure

```
nuxt-v4/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── README.md
├── agents/
│   ├── nuxt-debugger.md
│   ├── nuxt-migration-assistant.md
│   └── nuxt-performance-analyzer.md
├── commands/
│   └── nuxt-setup.md
└── skills/
    ├── nuxt-core/
    │   ├── SKILL.md
    │   ├── references/
    │   └── templates/
    ├── nuxt-data/
    │   ├── SKILL.md
    │   ├── references/
    │   │   ├── composables.md
    │   │   └── data-fetching.md
    │   └── templates/
    ├── nuxt-server/
    │   ├── SKILL.md
    │   ├── references/
    │   │   └── server.md
    │   └── templates/
    └── nuxt-production/
        ├── SKILL.md
        ├── references/
        │   ├── deployment-cloudflare.md
        │   ├── hydration.md
        │   ├── performance.md
        │   └── testing-vitest.md
        └── templates/
```

## When to Use This Plugin

| Scenario | Skill/Agent |
|----------|-------------|
| New Nuxt 4 project | `/nuxt-setup` command |
| Configure nuxt.config.ts | `nuxt-core` skill |
| Set up routing/middleware | `nuxt-core` skill |
| Create composables | `nuxt-data` skill |
| Implement useFetch/useAsyncData | `nuxt-data` skill |
| Build API routes | `nuxt-server` skill |
| Integrate D1 database | `nuxt-server` skill |
| Debug hydration errors | `nuxt-debugger` agent |
| Fix SSR issues | `nuxt-debugger` agent |
| Upgrade from Nuxt 3 | `nuxt-migration-assistant` agent |
| Optimize performance | `nuxt-performance-analyzer` agent |
| Deploy to Cloudflare | `nuxt-production` skill |
| Write Vitest tests | `nuxt-production` skill |

## Quick Start

### Create New Project
```bash
# Use the setup wizard
/nuxt-setup
```

### Debug Issues
```
"I'm getting hydration mismatch errors"
→ nuxt-debugger agent activates automatically
```

### Migrate from Nuxt 3
```
"I want to upgrade my Nuxt 3 project to Nuxt 4"
→ nuxt-migration-assistant agent activates
```

### Optimize Performance
```
"My Nuxt app is slow, can you analyze performance?"
→ nuxt-performance-analyzer agent activates
```

## Key Patterns

### useState for Shared State
```typescript
// ✅ Shared across components
const user = useState('user', () => null)

// ❌ Local to component only
const count = ref(0)
```

### Data Fetching
```typescript
// Simple API call
const { data } = await useFetch('/api/users')

// With reactive params (auto-refetch)
const page = ref(1)
const { data } = await useFetch('/api/users', { query: { page } })
```

### Server Routes
```typescript
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  return { users: await db.select().from(users) }
})
```

## Version Requirements

| Package | Minimum | Recommended |
|---------|---------|-------------|
| nuxt | 4.0.0 | 4.2.x |
| vue | 3.5.0 | 3.5.x |
| nitro | 2.10.0 | 2.10.x |
| vite | 6.0.0 | 6.0.x |

## Related Plugins

- **nuxt-ui-v4**: Nuxt UI component library
- **cloudflare-d1**: D1 database patterns
- **cloudflare-kv**: KV storage patterns
- **cloudflare-r2**: R2 object storage
- **better-auth**: Authentication patterns
- **pinia-v3**: State management

## Installation

```bash
# From marketplace
/plugin install nuxt-v4@claude-skills

# Or clone manually
cd ~/.claude/plugins
git clone https://github.com/secondsky/claude-skills
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT

---

**Version**: 4.0.0 | **Last Updated**: 2025-12-28 | **Maintainer**: Claude Skills Maintainers
