# Hono Complete Setup Guide

6-step guide to building type-safe APIs with Hono.

---

## Step 1: Install Hono

```bash
bun add hono@4.10.2  # preferred
# or: npm install hono@4.10.2
# or: pnpm add hono@4.10.2
```

**Why Hono:**
- **Fast**: Built on Web Standards, runs on any JavaScript runtime
- **Lightweight**: ~10KB, no dependencies
- **Type-safe**: Full TypeScript support with type inference
- **Flexible**: Works on Cloudflare Workers, Deno, Bun, Node.js, Vercel

---

## Step 2: Create Basic App

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'Hello Hono!' })
})

export default app
```

**CRITICAL:**
- Use `c.json()`, `c.text()`, `c.html()` for responses
- Return the response (don't use `res.send()` like Express)
- Export app for runtime (Cloudflare Workers, Deno, Bun, Node.js)

---

## Step 3: Add Request Validation

```bash
bun add zod@4.1.12 @hono/zod-validator@0.7.4  # preferred
# or: npm install zod@4.1.12 @hono/zod-validator@0.7.4
```

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  age: z.number(),
})

app.post('/user', zValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

**Why Validation:**
- Type-safe request data
- Automatic error responses
- Runtime validation, not just TypeScript

---

## Step 4: Add Middleware

```typescript
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}))

// Route-specific middleware
app.use('/api/*', async (c, next) => {
  const start = Date.now()
  await next()
  const end = Date.now()
  console.log(`${c.req.method} ${c.req.url} - ${end - start}ms`)
})

// Routes
app.get('/api/users', (c) => c.json({ users: [] }))
```

**Built-in Middleware:**
- `logger()` - Request logging
- `cors()` - CORS headers
- `jwt()` - JWT authentication
- `cache()` - Response caching
- `compress()` - Response compression
- `etag()` - ETag support

---

## Step 5: Error Handling

```typescript
import { HTTPException } from 'hono/http-exception'

app.post('/users', async (c) => {
  const data = await c.req.json()

  if (!data.email) {
    throw new HTTPException(400, {
      message: 'Email is required',
    })
  }

  // Create user...
  return c.json({ success: true })
})

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      { error: err.message },
      err.status
    )
  }

  console.error(err)
  return c.json(
    { error: 'Internal Server Error' },
    500
  )
})
```

**Error Handling Best Practices:**
- Use `HTTPException` for expected errors
- Return proper HTTP status codes
- Log unexpected errors
- Return consistent error format

---

## Step 6: Deploy

### Cloudflare Workers

**File**: `wrangler.toml`
```toml
name = "my-api"
compatibility_date = "2024-11-01"
main = "src/index.ts"
```

**File**: `src/index.ts`
```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.json({ message: 'Hello from Cloudflare!' }))

export default app
```

**Deploy:**
```bash
wrangler deploy
```

---

### Bun

```bash
bun run --hot src/index.ts
```

---

### Node.js

```bash
npm install @hono/node-server
```

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => c.json({ message: 'Hello from Node!' }))

serve(app, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})
```

---

### Deno

```typescript
import { Hono } from 'https://deno.land/x/hono/mod.ts'

const app = new Hono()

app.get('/', (c) => c.json({ message: 'Hello from Deno!' }))

Deno.serve(app.fetch)
```

---

## Complete Example: CRUD API with Validation

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).max(150),
})

const updateUserSchema = createUserSchema.partial()

// In-memory store (use database in production)
const users = new Map()
let nextId = 1

// Routes
app.get('/users', (c) => {
  return c.json(Array.from(users.values()))
})

app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  const user = users.get(id)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json(user)
})

app.post('/users', zValidator('json', createUserSchema), (c) => {
  const data = c.req.valid('json')
  const id = String(nextId++)
  const user = { id, ...data }

  users.set(id, user)

  return c.json(user, 201)
})

app.put('/users/:id', zValidator('json', updateUserSchema), (c) => {
  const id = c.req.param('id')
  const user = users.get(id)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  const data = c.req.valid('json')
  const updated = { ...user, ...data }

  users.set(id, updated)

  return c.json(updated)
})

app.delete('/users/:id', (c) => {
  const id = c.req.param('id')

  if (!users.has(id)) {
    return c.json({ error: 'User not found' }, 404)
  }

  users.delete(id)

  return c.json({ success: true })
})

export default app
```

---

## Alternative Validators

### Valibot

```bash
bun add valibot @hono/valibot-validator
```

```typescript
import { vValidator } from '@hono/valibot-validator'
import * as v from 'valibot'

const schema = v.object({
  name: v.string(),
  age: v.number(),
})

app.post('/user', vValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json(data)
})
```

### ArkType

```bash
bun add arktype @hono/arktype-validator
```

```typescript
import { aValidator } from '@hono/arktype-validator'
import { type } from 'arktype'

const schema = type({
  name: 'string',
  age: 'number',
})

app.post('/user', aValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json(data)
})
```

### Typia

```bash
bun add typia @hono/typia-validator
```

```typescript
import { tValidator } from '@hono/typia-validator'

interface User {
  name: string
  age: number
}

app.post('/user', tValidator('json', (data) => data as User), (c) => {
  const data = c.req.valid('json')
  return c.json(data)
})
```

---

**Official Documentation**:
- Hono: https://hono.dev
- Routing: https://hono.dev/docs/api/routing
- Validation: https://hono.dev/docs/guides/validation
- Middleware: https://hono.dev/docs/guides/middleware
