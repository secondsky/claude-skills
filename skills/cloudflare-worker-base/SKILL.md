---
name: cloudflare-worker-base
description: Cloudflare Workers with Hono, Vite, Static Assets. Use for new projects, deployment, or encountering export errors, routing conflicts, HMR crashes.

  Keywords: Cloudflare Workers, CF Workers, Hono, wrangler, Vite, Static Assets, @cloudflare/vite-plugin,
  wrangler.jsonc, ES Module, run_worker_first, SPA fallback, API routes, edge computing,
  "Cannot read properties of undefined", "Static Assets 404", "A hanging Promise was canceled",
  "Handler does not export", deployment fails, routing not working, HMR crashes, hot-module-replacement,
  scheduled-handlers, cron-triggers, environment-variables, bindings, wrangler-dev, local-development,
  module-workers, fetch-handler, service-worker-format, bindings-configuration, environment-secrets,
  wrangler-toml, TypeScript-workers, edge-runtime, serverless-functions
license: MIT
---

# Cloudflare Worker Base Stack

**Production-tested**: cloudflare-worker-base-test (https://cloudflare-worker-base-test.webfonts.workers.dev)
**Last Updated**: 2025-11-25
**Status**: Production Ready ✅

---

## Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [The Four-Step Setup Process](#the-four-step-setup-process)
3. [Known Issues Prevention](#known-issues-prevention)
4. [Configuration Files Reference](#configuration-files-reference)
5. [When to Load References](#when-to-load-references)

---

## Quick Start (5 Minutes)

### 1. Scaffold Project

```bash
npm create cloudflare@latest my-worker -- \
  --type hello-world \
  --ts \
  --git \
  --deploy false \
  --framework none
```

**Flags:** `--type hello-world` (clean start), `--ts` (TypeScript), `--git` (init repo), `--deploy false` (configure first), `--framework none` (add Vite manually)

### 2. Install Dependencies

```bash
cd my-worker
bun add hono@4.10.6  # preferred
# or: npm add hono@4.10.6
bun add -d @cloudflare/vite-plugin@1.15.2 vite@latest wrangler@4.50.0
# or: npm add -d @cloudflare/vite-plugin@1.15.2 vite@latest wrangler@4.50.0
```

**Version Notes:**
- `hono@4.10.6`: Minimum recommended version (verified 2025-11-20)
- `@cloudflare/vite-plugin@1.15.2`: Minimum recommended version, includes HMR fixes
- `wrangler@4.50.0`: Latest stable version (verified 2025-11-23)
- `vite`: Latest version compatible with Cloudflare plugin

### 3. Configure Wrangler

Create or update `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-worker",
  "main": "src/index.ts",
  "account_id": "YOUR_ACCOUNT_ID",
  "compatibility_date": "2025-10-11",
  "observability": {
    "enabled": true
  },
  "assets": {
    "directory": "./public/",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  }
}
```

**CRITICAL: `run_worker_first` Configuration**
- Without this, SPA fallback intercepts API routes
- API routes return `index.html` instead of JSON
- Source: [workers-sdk #8879](https://github.com/cloudflare/workers-sdk/issues/8879)

### 4. Configure Vite

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [
    cloudflare({
      // Optional: Configure the plugin if needed
    }),
  ],
})
```

**Why:** Official Cloudflare plugin with HMR support, local Miniflare development, v1.15.2+ fixes HMR crashes

---

## The Four-Step Setup Process

### Step 1: Create Hono App with API Routes

Create `src/index.ts`:

```typescript
/**
 * Cloudflare Worker with Hono
 *
 * CRITICAL: Export pattern to prevent build errors
 * ✅ CORRECT: export default app
 * ❌ WRONG:   export default { fetch: app.fetch }
 */

import { Hono } from 'hono'

// Type-safe environment bindings
type Bindings = {
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

/**
 * API Routes
 * Handled BEFORE static assets due to run_worker_first config
 */
app.get('/api/hello', (c) => {
  return c.json({
    message: 'Hello from Cloudflare Workers!',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    environment: c.env ? 'production' : 'development',
  })
})

/**
 * Fallback to Static Assets
 * Any route not matched above is served from public/ directory
 */
app.all('*', (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

/**
 * Export the Hono app directly (ES Module format)
 * This is the correct pattern for Cloudflare Workers with Hono + Vite
 */
export default app
```

**Why This Export Pattern:**
- Source: [honojs/hono #3955](https://github.com/honojs/hono/issues/3955)
- Using `{ fetch: app.fetch }` causes: "Cannot read properties of undefined (reading 'map')"
- Exception: If you need scheduled/tail handlers, use Module Worker format:
  ```typescript
  export default {
    fetch: app.fetch,
    scheduled: async (event, env, ctx) => { /* ... */ }
  }
  ```

### Step 2: Create Static Frontend

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Worker App</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="container">
    <h1>Cloudflare Worker + Static Assets</h1>
    <button onclick="testAPI()">Test API</button>
    <pre id="output"></pre>
  </div>
  <script src="/script.js"></script>
</body>
</html>
```

Create `public/script.js`:

```javascript
async function testAPI() {
  const response = await fetch('/api/hello')
  const data = await response.json()
  document.getElementById('output').textContent = JSON.stringify(data, null, 2)
}
```

Create `public/styles.css`:

```css
body {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
}

button {
  background: #0070f3;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
}

pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}
```

### Step 3: Update Package Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "cf-typegen": "wrangler types"
  }
}
```

### Step 4: Test & Deploy

```bash
# Generate TypeScript types for bindings
npm run cf-typegen

# Start local dev server (http://localhost:8787)
npm run dev

# Deploy to production
npm run deploy
```

---

## Known Issues Prevention

This skill prevents **6 documented issues**:

### Issue #1: Export Syntax Error
**Error**: "Cannot read properties of undefined (reading 'map')"
**Source**: [honojs/hono #3955](https://github.com/honojs/hono/issues/3955)
**Prevention**: Use `export default app` (NOT `{ fetch: app.fetch }`)

### Issue #2: Static Assets Routing Conflicts
**Error**: API routes return `index.html` instead of JSON
**Source**: [workers-sdk #8879](https://github.com/cloudflare/workers-sdk/issues/8879)
**Prevention**: Add `"run_worker_first": ["/api/*"]` to wrangler.jsonc

### Issue #3: Scheduled/Cron Not Exported
**Error**: "Handler does not export a scheduled() function"
**Source**: [honojs/vite-plugins #275](https://github.com/honojs/vite-plugins/issues/275)
**Prevention**: Use Module Worker format when needed:
```typescript
export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => { /* ... */ }
}
```

### Issue #4: HMR Race Condition
**Error**: "A hanging Promise was canceled" during development
**Source**: [workers-sdk #9518](https://github.com/cloudflare/workers-sdk/issues/9518)
**Prevention**: Use `@cloudflare/vite-plugin@1.15.2` or later

### Issue #5: Static Assets Upload Race
**Error**: Non-deterministic deployment failures in CI/CD
**Source**: [workers-sdk #7555](https://github.com/cloudflare/workers-sdk/issues/7555)
**Prevention**: Use Wrangler 4.x+ with retry logic (fixed in recent versions)

### Issue #6: Service Worker Format Confusion
**Error**: Using deprecated Service Worker format
**Source**: Cloudflare migration guide
**Prevention**: Always use ES Module format (shown in Step 1)

---

## Configuration Files Reference

**wrangler.jsonc** - Worker configuration (account_id, assets, bindings for KV/D1/R2)
```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "account_id": "YOUR_ACCOUNT_ID",
  "compatibility_date": "2025-10-11",
  "observability": { "enabled": true },
  "assets": {
    "directory": "./public/",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  }
}
```

**vite.config.ts** - Vite + Cloudflare plugin
```typescript
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig({
  plugins: [cloudflare({ persistState: true })],
  server: { port: 8787 },
})
```

**tsconfig.json** - TypeScript configuration (ES2022, bundler resolution, Workers types)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["es2022", "webworker"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

---

## API Route Patterns

Hono provides powerful routing and request handling. See `references/api-patterns.md` for comprehensive examples including:
- Basic JSON responses and POST handlers
- Route parameters (`/api/users/:id`) and query strings (`?q=search`)
- Error handling and input validation
- Using bindings (KV, D1, R2) in API routes
- Request/response headers and streaming

**Load `references/api-patterns.md` when:** Implementing specific API patterns beyond basic GET/POST.

---

## Static Assets Best Practices

**Directory:** `public/` contains all static files (HTML, CSS, JS, images)

**SPA Fallback:** `"not_found_handling": "single-page-application"` returns `index.html` for unknown routes (useful for React Router, Vue Router).

**Route Priority with `run_worker_first: ["/api/*"]`:**
1. `/api/*` → Worker handles (returns JSON)
2. `/` → Static Assets serve `index.html`
3. `/unknown` → SPA fallback returns `index.html`

**Cache Busting:** Use query strings: `<link href="/styles.css?v=1.0.0">`

---

## Development & Deployment

For complete workflow details, see `references/deployment.md` which covers:
- Local development with `npm run dev` (HMR, testing, type generation)
- Deployment commands (`wrangler deploy`, environment-specific deploys)
- CI/CD integration (GitHub Actions, GitLab CI/CD examples)
- Production monitoring (logs, analytics, error tracking)
- Rollback procedures and troubleshooting

**Load `references/deployment.md` when:** Setting up CI/CD, deploying to production, or monitoring deployed workers.

---

## Complete Setup Checklist

- [ ] Project scaffolded, dependencies installed (`hono@4.10.6`, `@cloudflare/vite-plugin@1.15.2`, `wrangler@4.50.0`)
- [ ] `wrangler.jsonc` configured (account_id, assets, run_worker_first, compatibility_date)
- [ ] `vite.config.ts` created with cloudflare plugin
- [ ] `src/index.ts` uses `export default app` (NOT `{ fetch: app.fetch }`)
- [ ] `public/` directory with static files
- [ ] `npm run cf-typegen` → types generated
- [ ] `npm run dev` → server starts without errors
- [ ] API routes and static assets tested
- [ ] Ready to deploy: `npm run deploy`

---

## Advanced Patterns

For advanced usage, see `references/advanced-patterns.md` which covers:
- Adding middleware (logger, CORS, auth, compression)
- Environment-specific configuration (staging, production environments)
- Custom error pages (global error handlers, 404 pages, validation errors)
- Testing with Vitest (@cloudflare/vitest-pool-workers integration)

**Load `references/advanced-patterns.md` when:** Implementing middleware, multi-environment setups, custom error handling, or test suites.

---

## File Templates

Templates in `templates/` directory: wrangler.jsonc, vite.config.ts, package.json, tsconfig.json, src/index.ts, public/index.html, public/styles.css, public/script.js

Copy to your project and customize as needed.

---

## When to Load References

This skill uses progressive disclosure. Load these references when needed:

### `references/api-patterns.md`
Load when implementing specific API patterns:
- POST handlers with body parsing
- Route parameters (`:id`) or query strings (`?q=`)
- Complex error handling or input validation
- Using KV, D1, R2 bindings in routes
- Request/response headers or streaming

### `references/advanced-patterns.md`
Load when implementing advanced features:
- Middleware (logging, CORS, authentication)
- Multi-environment configuration (staging/production)
- Custom error pages or validation
- Testing with Vitest

### `references/deployment.md`
Load when deploying or setting up automation:
- CI/CD pipelines (GitHub Actions, GitLab)
- Wrangler deployment commands
- Production monitoring and logs
- Rollback procedures
- Troubleshooting deployment issues

---

## Official Documentation

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Static Assets**: https://developers.cloudflare.com/workers/static-assets/
- **Vite Plugin**: https://developers.cloudflare.com/workers/vite-plugin/
- **Wrangler Configuration**: https://developers.cloudflare.com/workers/wrangler/configuration/
- **Hono**: https://hono.dev/docs/getting-started/cloudflare-workers
- **Context7 Library ID**: `/websites/developers_cloudflare-workers`

---

## Dependencies (Verified 2025-11-23)

```json
{
  "dependencies": {
    "hono": "^4.10.6"
  },
  "devDependencies": {
    "@cloudflare/vite-plugin": "^1.15.2",
    "@cloudflare/workers-types": "^4.20251011.0",
    "vite": "^7.0.0",
    "wrangler": "^4.50.0",
    "typescript": "^5.9.0"
  }
}
```

---

## Production Validation

**Live Example**: https://cloudflare-worker-base-test.webfonts.workers.dev
**Build Time**: ~45 minutes | **Errors Prevented**: 6/6 | **Status**: ✅ Production Ready

All patterns validated in production deployment.

**Troubleshooting Quick Checks:**
1. Use `export default app` (not `{ fetch: app.fetch }`)
2. Verify `run_worker_first: ["/api/*"]` in wrangler.jsonc
3. Check all 6 known issues prevention steps above
4. See official docs: https://developers.cloudflare.com/workers/
