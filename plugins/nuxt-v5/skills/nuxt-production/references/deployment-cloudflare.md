# Cloudflare Deployment - Complete Guide

Comprehensive guide to deploying Nuxt 4 applications on Cloudflare Pages and Workers, including NuxtHub integration and all bindings.

## Table of Contents

- [Cloudflare Pages](#cloudflare-pages)
- [Cloudflare Workers](#cloudflare-workers)
- [NuxtHub Integration](#nuxthub-integration)
- [Bindings](#bindings)
- [Environment Variables](#environment-variables)
- [WebSocket Support](#websocket-support)
- [CI/CD Setup](#cicd-setup)
- [Domain Configuration](#domain-configuration)
- [Troubleshooting](#troubleshooting)

## Cloudflare Pages

### Automatic Deployment (Recommended)

**Via GitHub Integration:**

1. Push your Nuxt project to GitHub
2. Go to Cloudflare Dashboard → Pages
3. Create new project → Connect to Git
4. Select your repository
5. Cloudflare auto-detects Nuxt:
   - Build command: `npm run build`
   - Output directory: `.output/public`
6. Deploy!

**No configuration needed** - Cloudflare automatically detects and builds Nuxt applications.

### Manual Deployment

```bash
# Build for Pages
npm run build

# Deploy with wrangler
npx wrangler pages deploy .output/public --project-name my-nuxt-app
```

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages'
  }
})
```

### Environment Variables

Set in Cloudflare Dashboard → Pages → Settings → Environment Variables

Or use `.env` for local development:

```bash
# .env
DATABASE_URL=your-database-url
API_SECRET=your-secret
```

## Cloudflare Workers

**Requirements**: Compatibility date `2024-09-19` or later

### Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-module'  // or 'cloudflare-pages'
  }
})
```

### Build & Deploy

```bash
# Build
npm run build

# Deploy
npx wrangler deploy
```

### wrangler.toml

```toml
name = "my-nuxt-app"
main = ".output/server/index.mjs"
compatibility_date = "2024-09-19"
compatibility_flags = ["nodejs_compat"]

# Workers Assets (for static files)
[site]
bucket = ".output/public"

# Environment variables
[vars]
PUBLIC_API_URL = "https://api.example.com"

# Bindings (see below)
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "my-bucket"

[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"
script_name = "counter-worker"

[[queues.producers]]
binding = "QUEUE"
queue = "my-queue"
```

## NuxtHub Integration

NuxtHub provides zero-config Cloudflare integrations for Nuxt.

### Installation

```bash
npm install @nuxthub/core
```

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxthub/core'],

  hub: {
    database: true,  // D1 database
    kv: true,        // KV storage
    blob: true,      // R2 blob storage
    cache: true,     // Cache API
    ai: true         // Workers AI
  }
})
```

### Features

- **Zero-config bindings** - automatic setup
- **Local development** - works with `npm run dev`
- **Type safety** - full TypeScript support
- **Dashboard** - visual management at hub.nuxt.com
- **Deployment** - one-command deploys

### Usage

```typescript
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  // Database
  const db = hubDatabase()
  const users = await db.select().from(tables.users)

  // KV
  const kv = hubKV()
  await kv.set('users-count', users.length)

  // Blob
  const blob = hubBlob()
  const avatar = await blob.get('avatars/user-1.jpg')

  return { users, count: users.length, avatar }
})
```

## Bindings

### D1 Database

**Setup:**

```bash
# Create database
npx wrangler d1 create my-database

# Output: database_id

# Update wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"
```

**Usage with Drizzle:**

```typescript
// server/utils/db.ts
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export const useDB = (event: H3Event) => {
  const { cloudflare } = event.context

  if (!cloudflare?.env?.DB) {
    throw createError({
      statusCode: 500,
      message: 'Database not configured'
    })
  }

  return drizzle(cloudflare.env.DB, { schema })
}

// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const users = await db.select().from(schema.users)

  return users
})
```

**Local Development:**

```bash
# Install nitro-cloudflare-dev
npm install -D nitro-cloudflare-dev
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nitro-cloudflare-dev']
})
```

### KV Storage

**Setup:**

```bash
# Create KV namespace
npx wrangler kv:namespace create MY_KV

# Output: id

# Update wrangler.toml
[[kv_namespaces]]
binding = "KV"
id = "your-kv-id"
```

**Usage:**

```typescript
// server/utils/kv.ts
export const useKV = (event: H3Event) => {
  const { cloudflare } = event.context

  if (!cloudflare?.env?.KV) {
    throw createError({
      statusCode: 500,
      message: 'KV not configured'
    })
  }

  return cloudflare.env.KV
}

// server/api/cache/[key].get.ts
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  const kv = useKV(event)

  const value = await kv.get(key)

  if (!value) {
    throw createError({
      statusCode: 404,
      message: 'Key not found'
    })
  }

  return { key, value }
})

// server/api/cache/[key].put.ts
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  const { value, ttl } = await readBody(event)

  const kv = useKV(event)

  await kv.put(key, value, {
    expirationTtl: ttl || 3600
  })

  return { success: true }
})
```

### R2 Storage

**Setup:**

```bash
# Create R2 bucket
npx wrangler r2 bucket create my-bucket

# Update wrangler.toml
[[r2_buckets]]
binding = "R2"
bucket_name = "my-bucket"
```

**Usage:**

```typescript
// server/utils/r2.ts
export const useR2 = (event: H3Event) => {
  const { cloudflare } = event.context

  if (!cloudflare?.env?.R2) {
    throw createError({
      statusCode: 500,
      message: 'R2 not configured'
    })
  }

  return cloudflare.env.R2
}

// server/api/upload.post.ts
export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  const file = formData?.find((item) => item.name === 'file')

  if (!file) {
    throw createError({
      statusCode: 400,
      message: 'No file provided'
    })
  }

  const r2 = useR2(event)

  // Upload to R2
  await r2.put(file.filename, file.data, {
    httpMetadata: {
      contentType: file.type
    }
  })

  return {
    success: true,
    filename: file.filename,
    url: `https://your-bucket.r2.dev/${file.filename}`
  }
})

// server/api/files/[key].get.ts
export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  const r2 = useR2(event)

  const object = await r2.get(key)

  if (!object) {
    throw createError({
      statusCode: 404,
      message: 'File not found'
    })
  }

  return object
})
```

### Durable Objects

**Setup:**

```toml
# wrangler.toml
[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"
script_name = "counter-worker"
```

**Usage:**

```typescript
// server/api/counter.ts
export default defineEventHandler(async (event) => {
  const { cloudflare } = event.context

  // Get Durable Object stub
  const id = cloudflare.env.COUNTER.idFromName('global')
  const stub = cloudflare.env.COUNTER.get(id)

  // Call Durable Object
  const count = await stub.fetch('https://fake-host/increment')

  return { count }
})
```

### Queues

**Setup:**

```bash
# Create queue
npx wrangler queues create my-queue

# Update wrangler.toml
[[queues.producers]]
binding = "QUEUE"
queue = "my-queue"

[[queues.consumers]]
queue = "my-queue"
```

**Usage:**

```typescript
// server/api/queue-job.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { cloudflare } = event.context

  // Send message to queue
  await cloudflare.env.QUEUE.send({
    type: 'process-user',
    userId: body.userId
  })

  return { queued: true }
})

// Consumer (separate worker or route)
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      const { type, userId } = message.body

      if (type === 'process-user') {
        // Process user
        await processUser(userId)
      }

      message.ack()
    }
  }
}
```

### Workers AI

**Setup:**

```toml
# wrangler.toml
[ai]
binding = "AI"
```

**Usage:**

```typescript
// server/api/ai/generate.post.ts
export default defineEventHandler(async (event) => {
  const { prompt } = await readBody(event)

  const { cloudflare } = event.context

  const response = await cloudflare.env.AI.run(
    '@cf/meta/llama-2-7b-chat-int8',
    {
      prompt
    }
  )

  return response
})
```

## Environment Variables

### Development (.dev.vars)

```bash
# .dev.vars (local development)
API_SECRET=your-secret
DATABASE_URL=your-db-url
```

### Production (Wrangler Secrets)

```bash
# Set secrets
npx wrangler secret put API_SECRET
npx wrangler secret put DATABASE_URL
```

### Usage in Code

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    apiSecret: process.env.API_SECRET,
    public: {
      apiUrl: process.env.PUBLIC_API_URL
    }
  }
})

// In server routes
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const secret = config.apiSecret

  return { secret }
})
```

## WebSocket Support

### Enable WebSockets

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    experimental: {
      websocket: true
    }
  }
})
```

### WebSocket Route

```typescript
// server/api/ws.ts
export default defineWebSocketHandler({
  open(peer) {
    console.log('Client connected:', peer.id)
    peer.send({ type: 'connected', message: 'Welcome!' })
  },

  message(peer, message) {
    console.log('Received:', message)

    // Echo back
    peer.send({ type: 'echo', data: message })

    // Broadcast to all
    peer.publish('chat', message)
  },

  close(peer) {
    console.log('Client disconnected:', peer.id)
  }
})
```

### Client Usage

```vue
<script setup>
const ws = ref<WebSocket | null>(null)

onMounted(() => {
  ws.value = new WebSocket('wss://your-app.pages.dev/api/ws')

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('Received:', data)
  }
})

onUnmounted(() => {
  ws.value?.close()
})

const sendMessage = (message: string) => {
  ws.value?.send(JSON.stringify({ message }))
}
</script>
```

## CI/CD Setup

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install

      - run: npm run build

      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: my-nuxt-app
          directory: .output/public
```

### GitLab CI

```yaml
# .gitlab-ci.yml
deploy:
  image: node:20
  script:
    - npm install
    - npm run build
    - npx wrangler pages deploy .output/public --project-name my-nuxt-app
  only:
    - main
```

## Domain Configuration

### Custom Domain (Pages)

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Custom Domains → Add Domain
3. Enter your domain (e.g., `app.example.com`)
4. Add DNS record (automatic if domain is on Cloudflare)

### Custom Domain (Workers)

```toml
# wrangler.toml
routes = [
  { pattern = "app.example.com", zone_name = "example.com" }
]
```

Then deploy:

```bash
npx wrangler deploy
```

## Troubleshooting

### Build Fails

**Issue**: Build command not found

**Solution**:
```toml
# wrangler.toml
[build]
command = "npm run build"
```

### Missing Bindings

**Issue**: Binding not available in development

**Solution**: Install `nitro-cloudflare-dev`

```bash
npm install -D nitro-cloudflare-dev
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nitro-cloudflare-dev']
})
```

### WebSocket Not Working

**Issue**: WebSocket connections fail

**Solution**:
1. Ensure `websocket: true` in config
2. Use `wss://` protocol
3. Check compatibility date >= `2024-09-19`

### Environment Variables Not Working

**Issue**: Env vars undefined in production

**Solution**:
1. Use `wrangler secret put` for sensitive values
2. Use `[vars]` in `wrangler.toml` for public values
3. Access via `useRuntimeConfig()`

### Database Connection Error

**Issue**: `Database not configured`

**Solution**:
1. Verify binding in `wrangler.toml`
2. Check database ID is correct
3. Ensure `nitro-cloudflare-dev` installed for local dev

## Best Practices

1. **Use NuxtHub** for zero-config bindings
2. **Enable compression** in Nitro config
3. **Use route rules** for caching
4. **Set up CI/CD** for automatic deployments
5. **Use secrets** for sensitive data
6. **Enable WebSockets** for real-time features
7. **Monitor performance** with Analytics
8. **Use custom domains** for production
9. **Test locally** with nitro-cloudflare-dev
10. **Keep compatibility date** current

## Related Skills

- **cloudflare-d1**: Deep dive into D1 patterns
- **cloudflare-kv**: Advanced KV usage
- **cloudflare-r2**: R2 best practices
- **cloudflare-workers-ai**: AI integration
- **cloudflare-durable-objects**: Stateful patterns
- **cloudflare-queues**: Queue patterns

---

**Last Updated**: 2025-11-09
