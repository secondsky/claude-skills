# Advanced Patterns for Cloudflare Workers

This reference covers advanced topics for production Cloudflare Workers with Hono.

**Load this reference when:** Users need middleware, environment-specific config, custom error pages, or testing setup.

---

## Table of Contents

1. [Adding Middleware](#adding-middleware)
2. [Environment-Specific Configuration](#environment-specific-configuration)
3. [Custom Error Pages](#custom-error-pages)
4. [Testing with Vitest](#testing-with-vitest)

---

## Adding Middleware

Hono provides a powerful middleware system for cross-cutting concerns.

### Global Middleware

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

const app = new Hono<{ Bindings: Bindings }>()

// Apply to all routes
app.use('*', logger())
app.use('/api/*', cors())
```

### Route-Specific Middleware

```typescript
app.use('/admin/*', async (c, next) => {
  // Custom auth check
  const token = c.req.header('Authorization')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Continue to route handler
  await next()
})

app.get('/admin/dashboard', (c) => {
  return c.json({ message: 'Admin dashboard' })
})
```

### Built-in Middleware

Common Hono middleware:
- `logger()` - Request logging
- `cors()` - CORS headers
- `basicAuth()` - Basic authentication
- `bearerAuth()` - Bearer token auth
- `compress()` - Response compression
- `etag()` - ETag generation

---

## Environment-Specific Configuration

Wrangler supports multiple environments for staging, production, etc.

### wrangler.jsonc Configuration

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "account_id": "YOUR_ACCOUNT_ID",
  "compatibility_date": "2025-10-11",

  // Default environment (development)
  "vars": {
    "ENVIRONMENT": "development",
    "API_URL": "https://api-dev.example.com"
  },

  // Named environments
  "env": {
    "staging": {
      "name": "my-worker-staging",
      "vars": {
        "ENVIRONMENT": "staging",
        "API_URL": "https://api-staging.example.com"
      },
      "d1_databases": [
        { "binding": "DB", "database_id": "STAGING_DB_ID" }
      ]
    },
    "production": {
      "name": "my-worker-production",
      "vars": {
        "ENVIRONMENT": "production",
        "API_URL": "https://api.example.com"
      },
      "d1_databases": [
        { "binding": "DB", "database_id": "PRODUCTION_DB_ID" }
      ]
    }
  }
}
```

### Deployment Commands

```bash
# Deploy to default (development)
wrangler deploy

# Deploy to staging
wrangler deploy --env staging

# Deploy to production
wrangler deploy --env production

# Run locally with specific environment
wrangler dev --env staging
```

### Using Environment Variables

```typescript
type Bindings = {
  ENVIRONMENT: string
  API_URL: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/config', (c) => {
  return c.json({
    environment: c.env.ENVIRONMENT,
    apiUrl: c.env.API_URL,
  })
})
```

---

## Custom Error Pages

Handle errors gracefully with custom error handlers.

### Global Error Handler

```typescript
app.onError((err, c) => {
  console.error(`Error: ${err.message}`, err)

  // Return custom error response
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString(),
  }, 500)
})
```

### Custom 404 Handler

```typescript
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    path: c.req.path,
    message: 'The requested resource was not found',
  }, 404)
})
```

### HTML Error Pages

```typescript
app.onError((err, c) => {
  console.error(err)

  return c.html(`
    <!DOCTYPE html>
    <html>
      <head><title>Error</title></head>
      <body>
        <h1>Something went wrong</h1>
        <p>${err.message}</p>
      </body>
    </html>
  `, 500)
})
```

### Validation Errors

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

app.post('/api/users',
  zValidator('json', schema),
  async (c) => {
    const data = c.req.valid('json')

    // data is now typed and validated
    return c.json({ success: true, data })
  }
)
```

---

## Testing with Vitest

Test your Workers with Vitest and `@cloudflare/vitest-pool-workers`.

### Installation

```bash
bun add -d vitest @cloudflare/vitest-pool-workers
# or: npm add -d vitest @cloudflare/vitest-pool-workers
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          // Miniflare options
          compatibilityDate: '2025-10-11',
        },
      },
    },
  },
})
```

### Example Test

Create `src/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import app from './index'

describe('Worker', () => {
  it('responds to /api/hello', async () => {
    const res = await app.request('/api/hello')

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('message')
    expect(data.message).toBe('Hello from Cloudflare Workers!')
  })

  it('responds to /api/health', async () => {
    const res = await app.request('/api/health')

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe('ok')
  })

  it('handles POST requests', async () => {
    const res = await app.request('/api/echo', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
      headers: { 'Content-Type': 'application/json' },
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.test).toBe('data')
  })
})
```

### Testing with Bindings

```typescript
import { env } from 'cloudflare:test'

it('uses KV namespace', async () => {
  // Set test data
  await env.MY_KV.put('test-key', 'test-value')

  const res = await app.request('/api/data')
  const data = await res.json()

  expect(data.value).toBe('test-value')
})
```

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Additional Resources

- **Hono Middleware**: https://hono.dev/docs/middleware/builtin/overview
- **Vitest**: https://vitest.dev/
- **Cloudflare Vitest Pool**: https://developers.cloudflare.com/workers/testing/vitest-integration/
- **Zod Validation**: https://zod.dev/

---

**Last Updated**: 2025-11-20
