# Hono Common Patterns

7 production-tested patterns for building APIs with Hono.

---

## Pattern 1: Route Grouping with Sub-Apps

Organize routes into logical modules.

```typescript
import { Hono } from 'hono'

// Users sub-app
const users = new Hono()

users.get('/', (c) => c.json({ users: [] }))
users.post('/', (c) => c.json({ created: true }))
users.get('/:id', (c) => c.json({ user: {} }))
users.put('/:id', (c) => c.json({ updated: true }))
users.delete('/:id', (c) => c.json({ deleted: true }))

// Posts sub-app
const posts = new Hono()

posts.get('/', (c) => c.json({ posts: [] }))
posts.post('/', (c) => c.json({ created: true }))

// Main app
const app = new Hono()

app.route('/users', users)
app.route('/posts', posts)

// Result: /users, /users/:id, /posts, etc.
```

**When to use**: Large APIs with multiple resource types

---

## Pattern 2: Middleware Composition

Chain multiple middleware for complex logic.

```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// Authentication middleware
const auth = jwt({
  secret: process.env.JWT_SECRET!,
})

// Authorization middleware
const requireAdmin = async (c, next) => {
  const payload = c.get('jwtPayload')

  if (payload.role !== 'admin') {
    throw new HTTPException(403, {
      message: 'Admin access required',
    })
  }

  await next()
}

// Rate limiting middleware
const rateLimit = (limit: number) => {
  const requests = new Map()

  return async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') || 'unknown'
    const count = requests.get(ip) || 0

    if (count >= limit) {
      throw new HTTPException(429, {
        message: 'Too many requests',
      })
    }

    requests.set(ip, count + 1)

    setTimeout(() => {
      requests.delete(ip)
    }, 60000) // 1 minute

    await next()
  }
}

// Apply middleware chain
app.use('/api/*', auth, rateLimit(100))
app.use('/api/admin/*', requireAdmin)

// Protected routes
app.get('/api/users', (c) => c.json({ users: [] }))
app.post('/api/admin/users', (c) => c.json({ created: true }))
```

**When to use**: Need authentication, authorization, rate limiting

---

## Pattern 3: Type-Safe RPC Client/Server

Create type-safe API client automatically.

**Server**:
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const routes = app
  .get('/users', (c) => {
    return c.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
  })
  .post(
    '/users',
    zValidator('json', z.object({
      name: z.string(),
      age: z.number(),
    })),
    (c) => {
      const data = c.req.valid('json')
      return c.json({ id: 3, ...data })
    }
  )

export type AppType = typeof routes
export default app
```

**Client**:
```typescript
import { hc } from 'hono/client'
import type { AppType } from './server'

const client = hc<AppType>('http://localhost:8787')

// Fully type-safe!
const users = await client.users.$get()
const data = await users.json() // Typed as { id: number; name: string }[]

const newUser = await client.users.$post({
  json: {
    name: 'Charlie',
    age: 30,
  },
})
```

**When to use**: Full-stack TypeScript apps, shared types between client/server

---

## Pattern 4: Context Extension (Custom Variables)

Add custom data to Hono context.

```typescript
import { Hono } from 'hono'

type Variables = {
  user: { id: string; name: string }
  requestId: string
}

const app = new Hono<{ Variables: Variables }>()

// Middleware to set variables
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})

app.use('/api/*', async (c, next) => {
  // Mock auth - replace with real auth
  c.set('user', {
    id: '123',
    name: 'Alice',
  })
  await next()
})

// Access variables in routes (fully typed!)
app.get('/api/profile', (c) => {
  const user = c.get('user') // Typed!
  const requestId = c.get('requestId') // Typed!

  return c.json({ user, requestId })
})
```

**When to use**: Need to share data between middleware and routes

---

## Pattern 5: Error Handling with Custom Errors

Standardized error responses.

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// Custom error classes
class NotFoundError extends HTTPException {
  constructor(message: string = 'Resource not found') {
    super(404, { message })
  }
}

class ValidationError extends HTTPException {
  constructor(message: string) {
    super(400, { message })
  }
}

class UnauthorizedError extends HTTPException {
  constructor(message: string = 'Unauthorized') {
    super(401, { message })
  }
}

// Routes
app.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await findUser(id)

  if (!user) {
    throw new NotFoundError(`User ${id} not found`)
  }

  return c.json(user)
})

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message,
        status: err.status,
      },
      err.status
    )
  }

  console.error('Unexpected error:', err)

  return c.json(
    {
      error: 'Internal Server Error',
      status: 500,
    },
    500
  )
})
```

**When to use**: Need consistent error responses across API

---

## Pattern 6: Validation with Multiple Sources

Validate different request parts (body, query, params, headers).

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

app.get(
  '/users/:id/posts',
  zValidator('param', z.object({
    id: z.string().uuid(),
  })),
  zValidator('query', z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
    sort: z.enum(['asc', 'desc']).default('asc'),
  })),
  zValidator('header', z.object({
    authorization: z.string().startsWith('Bearer '),
  })),
  (c) => {
    const { id } = c.req.valid('param')
    const { page, limit, sort } = c.req.valid('query')
    const { authorization } = c.req.valid('header')

    // All validated and typed!
    return c.json({ id, page, limit, sort, token: authorization })
  }
)

app.post(
  '/users/:id',
  zValidator('param', z.object({ id: z.string() })),
  zValidator('json', z.object({
    name: z.string().min(1),
    email: z.string().email(),
  })),
  (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')

    return c.json({ id, ...body })
  }
)
```

**When to use**: Need to validate multiple parts of request

---

## Pattern 7: File Upload Handling

Handle file uploads with validation.

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

app.post('/upload', async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']

  if (!file || !(file instanceof File)) {
    throw new HTTPException(400, {
      message: 'File is required',
    })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new HTTPException(400, {
      message: 'Invalid file type. Only JPEG, PNG, and WebP allowed.',
    })
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new HTTPException(400, {
      message: 'File too large. Max size: 5MB',
    })
  }

  // Process file (upload to R2, S3, etc.)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload to storage...
  const url = await uploadToR2(buffer, file.name)

  return c.json({
    success: true,
    url,
    size: file.size,
    type: file.type,
  })
})

// Helper function (example)
async function uploadToR2(buffer: Buffer, filename: string) {
  // Upload to Cloudflare R2 or similar
  return `https://cdn.example.com/${filename}`
}
```

**When to use**: File upload endpoints

---

## Additional Patterns

### Streaming Responses

```typescript
app.get('/stream', (c) => {
  return c.streamText(async (stream) => {
    for (let i = 0; i < 10; i++) {
      await stream.writeln(`Message ${i}`)
      await stream.sleep(1000) // 1 second delay
    }
  })
})
```

### WebSocket Support

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/ws', (c) => {
  const upgradeHeader = c.req.header('Upgrade')

  if (upgradeHeader !== 'websocket') {
    return c.text('Expected websocket', 400)
  }

  const { 0: client, 1: server } = new WebSocketPair()

  server.accept()

  server.addEventListener('message', (event) => {
    server.send(`Echo: ${event.data}`)
  })

  return new Response(null, {
    status: 101,
    webSocket: client,
  })
})
```

### Pagination Helper

```typescript
function paginate<T>(items: T[], page: number, limit: number) {
  const offset = (page - 1) * limit
  const paginatedItems = items.slice(offset, offset + limit)

  return {
    data: paginatedItems,
    pagination: {
      page,
      limit,
      total: items.length,
      pages: Math.ceil(items.length / limit),
    },
  }
}

app.get('/users', (c) => {
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 10)

  const result = paginate(users, page, limit)

  return c.json(result)
})
```

---

**Official Examples**:
- Hono Examples: https://github.com/honojs/hono/tree/main/examples
- RPC Pattern: https://hono.dev/docs/guides/rpc
- Validation: https://hono.dev/docs/guides/validation
