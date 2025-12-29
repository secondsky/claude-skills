# Bun Plugin for Claude Code

Comprehensive Claude Code plugin for the Bun JavaScript runtime. Covers runtime, package manager, bundler, testing, servers, databases, frameworks, and deployment.

## Installation

```bash
/plugin install bun@claude-skills
```

## Features

### 27 Skills

**Core (3 skills)**
- `bun-runtime` - Runtime execution, CLI, environment, module resolution
- `bun-package-manager` - Dependencies, workspaces, lockfiles, migrations
- `bun-bundler` - Code bundling, tree shaking, code splitting

**Testing (5 skills)**
- `bun-test-basics` - Writing tests, assertions, describe/it blocks
- `bun-test-mocking` - Mock functions, spyOn, module mocking
- `bun-test-lifecycle` - beforeAll, afterAll, setup/teardown
- `bun-test-coverage` - Code coverage reports, thresholds, CI integration
- `bun-jest-migration` - Migrate Jest tests to Bun

**Servers & APIs (3 skills)**
- `bun-http-server` - Bun.serve(), request handling, routing
- `bun-websocket-server` - WebSocket connections, pub/sub, broadcasting
- `bun-hono-integration` - Hono framework, middleware, RPC

**Databases (4 skills)**
- `bun-sqlite` - Built-in SQLite, prepared statements, transactions
- `bun-drizzle-integration` - Drizzle ORM, schema, migrations
- `bun-redis` - Redis caching, pub/sub, ioredis/Upstash
- `bun-file-io` - File operations, Bun.file(), streaming

**Frameworks (6 skills)**
- `bun-nextjs` - Next.js with Bun runtime
- `bun-nuxt` - Nuxt 3 with Bun preset
- `bun-sveltekit` - SvelteKit with svelte-adapter-bun
- `bun-tanstack-start` - TanStack Start full-stack React
- `bun-react-ssr` - Custom React SSR without frameworks
- `bun-hot-reloading` - --watch, --hot, HMR

**Advanced (4 skills)**
- `bun-macros` - Compile-time code execution
- `bun-ffi` - Foreign function interface for native code
- `bun-workers` - Web Workers, worker_threads
- `bun-shell` - Bun.$, shell scripting, subprocess

**Deployment (2 skills)**
- `bun-cloudflare-workers` - Deploy to Cloudflare Workers
- `bun-docker` - Docker containers with oven/bun images

### 6 Commands

| Command | Description |
|---------|-------------|
| `/bun-init` | Initialize new Bun project with optional framework |
| `/bun-migrate` | Migrate from Node.js/npm to Bun |
| `/bun-debug` | Debug runtime, test, or build issues |
| `/bun-optimize` | Optimize performance and bundle size |
| `/bun-deploy` | Deploy to Docker, Cloudflare, Vercel, etc. |
| `/bun-upgrade` | Upgrade Bun runtime and dependencies |

### 3 Agents

| Agent | Purpose |
|-------|---------|
| `bun-troubleshooter` | Diagnose and fix errors, crashes, failures |
| `bun-performance-analyzer` | Profile and optimize performance |
| `bun-migration-assistant` | Migrate from Node.js/Jest to Bun |

### 2 Hooks

**PreToolUse (validate-bun-command.sh)**
- Suggests Bun equivalents for npm/yarn/pnpm commands
- Warns about deprecated patterns

**PostToolUse (bun-suggestions.sh)**
- Provides tips after bun install, test, build
- Suggests fixes for common errors

## Usage Examples

### Start a New Project

```
/bun-init my-app hono
```

### Migrate from npm

```
/bun-migrate npm
```

### Debug Issues

Ask: "My Bun server keeps crashing" - triggers `bun-troubleshooter` agent

### Optimize Performance

```
/bun-optimize bundle
```

### Deploy

```
/bun-deploy docker
```

## Skill Triggers

Skills trigger automatically based on context:

- "How do I write tests in Bun?" → `bun-test-basics`
- "Help me set up Drizzle ORM" → `bun-drizzle-integration`
- "I want to build a WebSocket server" → `bun-websocket-server`
- "Deploy my app to Cloudflare Workers" → `bun-cloudflare-workers`

## Requirements

- Bun 1.0+ installed
- Claude Code CLI

## License

MIT

## Links

- [Bun Documentation](https://bun.sh/docs)
- [Bun GitHub](https://github.com/oven-sh/bun)
- [Claude Skills Repository](https://github.com/secondsky/claude-skills)
