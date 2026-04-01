# Server Routes (Nitro v3) - Complete Guide

Comprehensive guide to Nitro v3 server routes, API endpoints, and server-side patterns in Nuxt 5.

## Nuxt 5 Migration Notes

Key changes from Nitro v2 (Nuxt 4) to Nitro v3 (Nuxt 5):

| Area | Nuxt 4 | Nuxt 5 |
|------|--------|--------|
| Package | `nitropack` | `nitro` |
| h3 imports | `from 'h3'` | `from 'nitro/h3'` |
| Error handling | `createError({statusCode})` | `new HTTPError({status})` |
| Event path | `event.path` | `event.url.pathname` |
| Event method | `event.method` | `event.req.method` |
| Response status | `event.node.res.statusCode` | `event.res.status` |
| Response headers | `setResponseHeader(event, ...)` | `event.res.headers.set(...)` |
| Runtime config | `useRuntimeConfig(event)` | `useRuntimeConfig()` |
| Route rules redirect | `statusCode` | `status` |

## Table of Contents

- [File-Based Routing](#file-based-routing)
- [Event Handlers](#event-handlers)
- [Web Standard Event API](#web-standard-event-api)
- [Request Utilities](#request-utilities)
- [Response Utilities](#response-utilities)
- [Database Integration](#database-integration)
- [Authentication Patterns](#authentication-patterns)
- [Middleware](#middleware)
- [Error Handling](#error-handling)
- [Validation](#validation)
- [WebSocket Support](#websocket-support)

## File-Based Routing

### Route Structure

```
server/
├── api/                      # API routes (/api/*)
│   ├── auth/
│   │   ├── login.post.ts     → POST /api/auth/login
│   │   ├── logout.post.ts    → POST /api/auth/logout
│   │   └── session.get.ts    → GET /api/auth/session
│   ├── users/
│   │   ├── index.get.ts      → GET /api/users
│   │   ├── index.post.ts     → POST /api/users
│   │   ├── [id].get.ts       → GET /api/users/:id
│   │   ├── [id].patch.ts     → PATCH /api/users/:id
│   │   └── [id].delete.ts    → DELETE /api/users/:id
│   └── health.get.ts         → GET /api/health
│
├── routes/                   # Non-API routes
│   ├── rss.xml.ts            → GET /rss.xml
│   └── sitemap.xml.ts        → GET /sitemap.xml
│
├── middleware/               # Server middleware
│   ├── auth.ts
│   └── cors.ts
│
├── plugins/                  # Nitro plugins
│   └── database.ts
│
└── utils/                    # Server utilities
    ├── db.ts
    └── auth.ts
```

### Dynamic Routes

```typescript
// File: server/api/users/[id].get.ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  return { id }
})
// GET /api/users/123 → { id: '123' }
```

### Catch-All Routes

```typescript
// File: server/api/proxy/[...path].ts
export default defineEventHandler((event) => {
  const path = getRouterParam(event, 'path')
  return { path }
})
```

## Event Handlers

### Basic Handler

```typescript
export default defineEventHandler((event) => {
  return {
    message: 'Hello World',
    timestamp: new Date().toISOString()
  }
})
```

### Async Handler

```typescript
export default defineEventHandler(async (event) => {
  const users = await db.users.findMany()

  return {
    data: users,
    count: users.length
  }
})
```

### Typed Handler

```typescript
interface User {
  id: string
  name: string
  email: string
}

export default defineEventHandler(async (event): Promise<User[]> => {
  const users = await db.users.findMany()
  return users
})
```

## Web Standard Event API

### Request Properties (v5)

```typescript
export default defineEventHandler((event) => {
  // Path (v5)
  const pathname = event.url.pathname    // was: event.path
  const search = event.url.search        // URLSearchParams object

  // Method (v5)
  const method = event.req.method        // was: event.method

  // Headers - Web Headers API (v5)
  const auth = event.req.headers.get('authorization')
  // was: getHeader(event, 'authorization')

  return { pathname, search, method, auth }
})
```

### Response Properties (v5)

```typescript
export default defineEventHandler((event) => {
  // Set status (v5)
  event.res.status = 201
  // was: setResponseStatus(event, 201)

  // Set headers - Web Headers API (v5)
  event.res.headers.set('X-Custom-Header', 'value')
  // was: setHeader(event, 'X-Custom-Header', 'value')

  event.res.headers.append('Set-Cookie', 'session=abc')
  // was: appendResponseHeader(event, 'Set-Cookie', 'session=abc')

  return { message: 'Created' }
})
```

### Legacy Helpers (Still Auto-Imported)

These continue to work via auto-import:

```typescript
getRouterParam(event, 'id')
getQuery(event)
readBody(event)
getHeader(event, 'authorization')
getCookie(event, 'sessionId')
getMethod(event)
getRequestURL(event)
```

## Request Utilities

### getRouterParam

```typescript
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const params = getRouterParams(event)
  return { id, params }
})
```

### getQuery

```typescript
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  return { page, limit }
})
```

### readBody

```typescript
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { received: body }
})

// With type safety
interface CreateUserBody {
  name: string
  email: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateUserBody>(event)
})
```

## Response Utilities

### setCookie / deleteCookie

```typescript
export default defineEventHandler((event) => {
  setCookie(event, 'sessionId', '123', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  })

  deleteCookie(event, 'old_cookie')

  return { message: 'Cookie set' }
})
```

### Redirects

```typescript
export default defineEventHandler((event) => {
  return sendRedirect(event, '/login', 302)
})
```

## Error Handling (v5)

### Server-Side: HTTPError

In server routes, use `HTTPError` instead of `createError`:

```typescript
import { HTTPError } from 'nitro/h3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw new HTTPError({ status: 400, statusText: 'User ID is required' })
  }

  const user = await findUser(id)

  if (!user) {
    throw new HTTPError({ status: 404, statusText: 'User not found' })
  }

  return user
})
```

**Note**: In the Vue part of your app (`app/` directory), `createError` continues to work as before.

### Structured Error Responses

```typescript
import { HTTPError } from 'nitro/h3'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const user = await findUser(id)

    if (!user) {
      throw new HTTPError({ status: 404, statusText: `User with ID ${id} not found` })
    }

    return user
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error
    }

    console.error('Unexpected error:', error)
    throw new HTTPError({ status: 500, statusText: 'Internal server error' })
  }
})
```

## Validation

### Zod Validation

```typescript
import { z } from 'zod'
import { HTTPError } from 'nitro/h3'

const CreatePostSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(10),
  published: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = CreatePostSchema.safeParse(body)

  if (!result.success) {
    throw new HTTPError({
      status: 400,
      statusText: 'Validation failed',
    })
  }

  return { success: true, data: result.data }
})
```

## Database Integration

### D1 with Drizzle ORM

```typescript
// server/utils/db.ts
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'
import { HTTPError } from 'nitro/h3'

export const useDB = (event: H3Event) => {
  const { cloudflare } = event.context

  if (!cloudflare?.env?.DB) {
    throw new HTTPError({ status: 500, statusText: 'Database not configured' })
  }

  return drizzle(cloudflare.env.DB, { schema })
}

// server/api/users/index.get.ts
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const allUsers = await db.select().from(schema.users)
  return allUsers
})

// server/api/users/[id].get.ts
import { eq } from 'drizzle-orm'
import { users } from '~/server/database/schema'
import { HTTPError } from 'nitro/h3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB(event)

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (!user) {
    throw new HTTPError({ status: 404, statusText: 'User not found' })
  }

  return user
})
```

## Authentication Patterns

### Session-Based Auth

```typescript
// server/utils/session.ts
import { nanoid } from 'nanoid'
import { HTTPError } from 'nitro/h3'

interface Session {
  userId: string
  createdAt: number
  expiresAt: number
}

export const createSession = async (
  event: H3Event,
  userId: string
): Promise<string> => {
  const sessionId = nanoid()
  const session: Session = {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
  }

  const { cloudflare } = event.context
  await cloudflare.env.KV.put(
    `session:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: 60 * 60 * 24 * 7 }
  )

  setCookie(event, 'sessionId', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  })

  return sessionId
}

export const getSession = async (event: H3Event): Promise<Session | null> => {
  const sessionId = getCookie(event, 'sessionId')

  if (!sessionId) return null

  const { cloudflare } = event.context
  const session = await cloudflare.env.KV.get(`session:${sessionId}`, 'json')

  if (!session || session.expiresAt < Date.now()) {
    return null
  }

  return session
}

export const deleteSession = async (event: H3Event): Promise<void> => {
  const sessionId = getCookie(event, 'sessionId')

  if (sessionId) {
    const { cloudflare } = event.context
    await cloudflare.env.KV.delete(`session:${sessionId}`)
    deleteCookie(event, 'sessionId')
  }
}
```

### Require Auth Middleware

```typescript
// server/utils/requireAuth.ts
import { eq } from 'drizzle-orm'
import { users } from '~/server/database/schema'
import { HTTPError } from 'nitro/h3'

export const requireAuth = async (event: H3Event) => {
  const session = await getSession(event)

  if (!session) {
    throw new HTTPError({ status: 401, statusText: 'Authentication required' })
  }

  const db = useDB(event)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  if (!user) {
    throw new HTTPError({ status: 401, statusText: 'User not found' })
  }

  event.context.user = user

  return user
}
```

## Middleware

### Server Middleware (v5)

```typescript
// server/middleware/cors.ts
export default defineEventHandler((event) => {
  // v5: Use Web Standard headers API
  event.res.headers.set('Access-Control-Allow-Origin', '*')
  event.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  event.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (getMethod(event) === 'OPTIONS') {
    event.res.status = 204
    return ''
  }
})

// server/middleware/auth.ts
import { HTTPError } from 'nitro/h3'

export default defineEventHandler(async (event) => {
  // v5: Use event.url.pathname instead of event.path
  if (event.url.pathname.startsWith('/api/public/')) {
    return
  }

  const session = await getSession(event)

  if (!session) {
    throw new HTTPError({ status: 401, statusText: 'Authentication required' })
  }

  event.context.session = session
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
    peer.send({ type: 'echo', data: message })
    peer.publish('chat', message)
  },

  close(peer) {
    console.log('Client disconnected:', peer.id)
  },

  error(peer, error) {
    console.error('WebSocket error:', error)
  }
})
```

## Import Path Migration

```typescript
// Nuxt 4 (deprecated in v5)
import { defineEventHandler, getQuery } from 'h3'

// Nuxt 5
import { defineEventHandler, getQuery } from 'nitro/h3'
// Or just use auto-imports (no import needed)
```

For type augmentations (module authors):

```typescript
// Nuxt 4
declare module 'nitropack/types' {
  interface NitroRouteRules { myModule?: { /* ... */ } }
}

// Nuxt 5
declare module 'nitro/types' {
  interface NitroRouteRules { myModule?: { /* ... */ } }
}
```

## Best Practices

1. Use file-based routing with method suffixes
2. Use `HTTPError` for server-side errors (not `createError`)
3. Use `event.url.pathname` instead of `event.path`
4. Use `event.res.status` / `event.res.headers` (Web Standard API)
5. Use `useRuntimeConfig()` without event argument
6. Validate all inputs with Zod
7. Use TypeScript for type safety
8. Import from `nitro/h3` (or rely on auto-imports)

---

**Last Updated**: 2026-03-30
