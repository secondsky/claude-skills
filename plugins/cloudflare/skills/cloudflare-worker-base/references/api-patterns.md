# API Route Patterns for Cloudflare Workers with Hono

This reference provides common patterns for building APIs with Hono on Cloudflare Workers.

**Load this reference when:** Users need to implement specific API patterns like POST handlers, route parameters, query strings, error handling, or binding usage.

---

## Table of Contents

1. [Basic JSON Response](#basic-json-response)
2. [POST with Request Body](#post-with-request-body)
3. [Route Parameters](#route-parameters)
4. [Query Parameters](#query-parameters)
5. [Error Handling](#error-handling)
6. [Using Bindings (KV, D1, R2)](#using-bindings-kv-d1-r2)
7. [Request Headers](#request-headers)
8. [Response Headers](#response-headers)
9. [Streaming Responses](#streaming-responses)

---

## Basic JSON Response

The simplest API route returns JSON data.

```typescript
app.get('/api/users', (c) => {
  return c.json({
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ],
    total: 2
  })
})
```

**Response:**
```json
{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@example.com" },
    { "id": 2, "name": "Bob", "email": "bob@example.com" }
  ],
  "total": 2
}
```

---

## POST with Request Body

Handle POST requests and parse JSON bodies.

```typescript
app.post('/api/users', async (c) => {
  const body = await c.req.json()

  // Validate body (basic example)
  if (!body.name || !body.email) {
    return c.json({ error: 'Name and email are required' }, 400)
  }

  // Process data (e.g., save to database)
  const newUser = {
    id: Date.now(),
    name: body.name,
    email: body.email,
    createdAt: new Date().toISOString()
  }

  return c.json({ success: true, data: newUser }, 201)
})
```

**Request:**
```bash
curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1700000000000,
    "name": "Charlie",
    "email": "charlie@example.com",
    "createdAt": "2025-11-20T12:00:00.000Z"
  }
}
```

---

## Route Parameters

Extract dynamic segments from the URL path.

```typescript
app.get('/api/users/:id', (c) => {
  const id = c.req.param('id')

  // Fetch user by ID (example)
  return c.json({
    id: parseInt(id),
    name: 'User Name',
    email: 'user@example.com'
  })
})
```

**Multiple Parameters:**

```typescript
app.get('/api/posts/:postId/comments/:commentId', (c) => {
  const postId = c.req.param('postId')
  const commentId = c.req.param('commentId')

  return c.json({ postId, commentId })
})
```

**Request:**
```bash
curl http://localhost:8787/api/users/123
```

---

## Query Parameters

Extract query string parameters from the URL.

```typescript
app.get('/api/search', (c) => {
  const query = c.req.query('q')
  const page = c.req.query('page') || '1'
  const limit = c.req.query('limit') || '10'

  return c.json({
    query,
    page: parseInt(page),
    limit: parseInt(limit),
    results: []  // Your search results here
  })
})
```

**Request:**
```bash
curl "http://localhost:8787/api/search?q=cloudflare&page=2&limit=20"
```

**Response:**
```json
{
  "query": "cloudflare",
  "page": 2,
  "limit": 20,
  "results": []
}
```

---

## Error Handling

Gracefully handle errors in route handlers.

### Try-Catch Pattern

```typescript
app.get('/api/data', async (c) => {
  try {
    // Your logic here
    const data = await fetchDataFromAPI()

    return c.json({ success: true, data })
  } catch (error) {
    console.error('API Error:', error)

    return c.json({
      success: false,
      error: error.message || 'An error occurred'
    }, 500)
  }
})
```

### Conditional Error Returns

```typescript
app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id')

  const user = await fetchUser(id)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json(user)
})
```

### Input Validation

```typescript
app.post('/api/users', async (c) => {
  const body = await c.req.json()

  // Validation
  const errors = []
  if (!body.email) errors.push('Email is required')
  if (!body.name) errors.push('Name is required')
  if (body.email && !body.email.includes('@')) {
    errors.push('Invalid email format')
  }

  if (errors.length > 0) {
    return c.json({ error: 'Validation failed', errors }, 400)
  }

  // Process valid data
  return c.json({ success: true })
})
```

---

## Using Bindings (KV, D1, R2)

Access Cloudflare bindings through the context environment.

### Type Definitions

```typescript
type Bindings = {
  ASSETS: Fetcher
  MY_KV: KVNamespace
  DB: D1Database
  MY_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()
```

### KV Namespace

```typescript
app.get('/api/cache/:key', async (c) => {
  const key = c.req.param('key')
  const value = await c.env.MY_KV.get(key)

  if (!value) {
    return c.json({ error: 'Key not found' }, 404)
  }

  return c.json({ key, value })
})

app.put('/api/cache/:key', async (c) => {
  const key = c.req.param('key')
  const { value, ttl } = await c.req.json()

  await c.env.MY_KV.put(key, value, { expirationTtl: ttl })

  return c.json({ success: true })
})
```

### D1 Database

```typescript
app.get('/api/users', async (c) => {
  const result = await c.env.DB
    .prepare('SELECT * FROM users LIMIT 10')
    .all()

  return c.json({
    users: result.results,
    success: result.success
  })
})

app.post('/api/users', async (c) => {
  const { name, email } = await c.req.json()

  const result = await c.env.DB
    .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
    .bind(name, email)
    .run()

  return c.json({ success: result.success }, 201)
})
```

### R2 Bucket

```typescript
app.get('/api/files/:filename', async (c) => {
  const filename = c.req.param('filename')
  const object = await c.env.MY_BUCKET.get(filename)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    },
  })
})

app.put('/api/files/:filename', async (c) => {
  const filename = c.req.param('filename')
  const body = await c.req.arrayBuffer()

  await c.env.MY_BUCKET.put(filename, body)

  return c.json({ success: true })
})
```

---

## Request Headers

Access and validate request headers.

```typescript
app.get('/api/protected', (c) => {
  const token = c.req.header('Authorization')

  if (!token || !token.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const bearerToken = token.substring(7)

  // Validate token...

  return c.json({ message: 'Access granted' })
})
```

**Custom Headers:**

```typescript
app.get('/api/data', (c) => {
  const clientId = c.req.header('X-Client-ID')
  const userAgent = c.req.header('User-Agent')

  return c.json({ clientId, userAgent })
})
```

---

## Response Headers

Set custom response headers.

```typescript
app.get('/api/data', (c) => {
  const data = { message: 'Hello' }

  return c.json(data, 200, {
    'X-Custom-Header': 'value',
    'Cache-Control': 'public, max-age=3600',
  })
})
```

**CORS Headers:**

```typescript
app.get('/api/public', (c) => {
  return c.json({ data: 'public' }, 200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
})
```

---

## Streaming Responses

Stream data for large responses or server-sent events.

### Streaming JSON

```typescript
app.get('/api/stream', (c) => {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(
          new TextEncoder().encode(JSON.stringify({ count: i }) + '\n')
        )
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' }
  })
})
```

### Server-Sent Events (SSE)

```typescript
app.get('/api/events', (c) => {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 5; i++) {
        const data = `data: ${JSON.stringify({ event: i })}\n\n`
        controller.enqueue(new TextEncoder().encode(data))
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
})
```

---

## Additional Resources

- **Hono Routing**: https://hono.dev/docs/api/routing
- **Hono Context**: https://hono.dev/docs/api/context
- **KV API**: https://developers.cloudflare.com/kv/api/
- **D1 API**: https://developers.cloudflare.com/d1/platform/client-api/
- **R2 API**: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/

---

**Last Updated**: 2025-11-20
