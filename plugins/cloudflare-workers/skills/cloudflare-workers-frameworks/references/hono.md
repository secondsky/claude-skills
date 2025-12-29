# Hono Framework on Cloudflare Workers

Hono is a lightweight, ultrafast web framework designed for edge environments.

## Why Hono for Workers?

- **Tiny**: ~14KB minified
- **Fast**: Optimized for edge runtime
- **Native**: Built for Workers from the start
- **Type-safe**: Full TypeScript support
- **Familiar**: Express-like API

## Installation

```bash
# New project
bun create hono my-app
cd my-app

# Choose cloudflare-workers template
# Or add to existing project
bun add hono
```

## Project Structure

```
my-app/
├── src/
│   ├── index.ts          # Main app
│   ├── routes/
│   │   ├── api.ts        # API routes
│   │   └── pages.ts      # Page routes
│   ├── middleware/
│   │   ├── auth.ts       # Auth middleware
│   │   └── logging.ts    # Logging
│   └── lib/
│       └── db.ts         # Database helpers
├── wrangler.jsonc
├── tsconfig.json
└── package.json
```

## Basic App Setup

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';
import { timing } from 'hono/timing';

// Type bindings
interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  AI: Ai;
  ENVIRONMENT: string;
}

// Create app with typed bindings
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', timing());
app.use('*', prettyJSON());

// CORS for API
app.use('/api/*', cors({
  origin: ['https://app.example.com'],
  credentials: true,
}));

// Routes
app.get('/', (c) => c.text('Hello Hono!'));
app.route('/api', apiRoutes);

// Error handling
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// 404 handler
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

export default app;
```

## Routing

### Basic Routes

```typescript
import { Hono } from 'hono';

const app = new Hono();

// HTTP methods
app.get('/users', handler);
app.post('/users', handler);
app.put('/users/:id', handler);
app.patch('/users/:id', handler);
app.delete('/users/:id', handler);

// All methods
app.all('/webhook', handler);

// Path parameters
app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ id });
});

// Optional parameters
app.get('/posts/:id?', (c) => {
  const id = c.req.param('id') || 'all';
  return c.json({ id });
});

// Wildcards
app.get('/files/*', (c) => {
  const path = c.req.path; // /files/images/photo.jpg
  return c.text(path);
});

// Regex patterns
app.get('/user/:id{[0-9]+}', (c) => {
  const id = c.req.param('id'); // Only numeric
  return c.json({ id });
});
```

### Route Groups

```typescript
// src/routes/api.ts
import { Hono } from 'hono';

const api = new Hono<{ Bindings: Env }>();

// User routes
const users = new Hono<{ Bindings: Env }>();
users.get('/', listUsers);
users.get('/:id', getUser);
users.post('/', createUser);
users.put('/:id', updateUser);
users.delete('/:id', deleteUser);

// Post routes
const posts = new Hono<{ Bindings: Env }>();
posts.get('/', listPosts);
posts.get('/:id', getPost);
posts.post('/', createPost);

// Mount
api.route('/users', users);
api.route('/posts', posts);

export default api;

// src/index.ts
import api from './routes/api';
app.route('/api/v1', api);
```

### Base Path

```typescript
// API with base path
const app = new Hono().basePath('/api/v1');

app.get('/users', handler); // /api/v1/users
```

## Request Handling

### Request Data

```typescript
// Query parameters
app.get('/search', (c) => {
  const query = c.req.query('q');
  const page = c.req.query('page') || '1';
  const queries = c.req.queries('tag'); // Multiple values
  return c.json({ query, page, tags: queries });
});

// Path parameters
app.get('/users/:id/posts/:postId', (c) => {
  const { id, postId } = c.req.param();
  return c.json({ userId: id, postId });
});

// Request body
app.post('/users', async (c) => {
  // JSON
  const json = await c.req.json();

  // Form data
  const formData = await c.req.formData();

  // Text
  const text = await c.req.text();

  // ArrayBuffer
  const buffer = await c.req.arrayBuffer();

  return c.json({ received: true });
});

// Headers
app.get('/headers', (c) => {
  const auth = c.req.header('Authorization');
  const contentType = c.req.header('Content-Type');
  return c.json({ auth, contentType });
});

// Raw request
app.get('/raw', (c) => {
  const request = c.req.raw; // Native Request object
  return c.json({ url: request.url });
});
```

### Validated Body with Zod

```typescript
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

app.post(
  '/users',
  zValidator('json', UserSchema),
  async (c) => {
    const user = c.req.valid('json');
    // user is typed: { name: string; email: string; age?: number }
    return c.json(user, 201);
  }
);

// Query validation
const QuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

app.get(
  '/users',
  zValidator('query', QuerySchema),
  async (c) => {
    const { page, limit } = c.req.valid('query');
    return c.json({ page, limit });
  }
);
```

## Response Helpers

```typescript
// Text
app.get('/text', (c) => c.text('Hello'));

// JSON
app.get('/json', (c) => c.json({ message: 'Hello' }));

// HTML
app.get('/html', (c) => c.html('<h1>Hello</h1>'));

// Redirect
app.get('/old', (c) => c.redirect('/new'));
app.get('/external', (c) => c.redirect('https://example.com', 301));

// Status codes
app.get('/created', (c) => c.json({ id: 1 }, 201));
app.get('/error', (c) => c.json({ error: 'Bad Request' }, 400));

// Headers
app.get('/headers', (c) => {
  c.header('X-Custom', 'value');
  c.header('Cache-Control', 'max-age=3600');
  return c.json({ ok: true });
});

// Cookies
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';

app.get('/cookie', (c) => {
  setCookie(c, 'session', 'abc123', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 86400,
  });
  return c.json({ ok: true });
});

app.get('/read-cookie', (c) => {
  const session = getCookie(c, 'session');
  return c.json({ session });
});

// Streaming
app.get('/stream', (c) => {
  return c.streamText(async (stream) => {
    for (let i = 0; i < 10; i++) {
      await stream.write(`Line ${i}\n`);
      await stream.sleep(100);
    }
  });
});

// Body streaming
app.get('/stream-json', (c) => {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue('{"items":[');
      for (let i = 0; i < 100; i++) {
        const comma = i > 0 ? ',' : '';
        controller.enqueue(`${comma}{"id":${i}}`);
      }
      controller.enqueue(']}');
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## Middleware

### Built-in Middleware

```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { etag } from 'hono/etag';
import { compress } from 'hono/compress';
import { cache } from 'hono/cache';
import { basicAuth } from 'hono/basic-auth';
import { bearerAuth } from 'hono/bearer-auth';
import { jwt } from 'hono/jwt';
import { timing, startTime, endTime } from 'hono/timing';
import { requestId } from 'hono/request-id';
import { bodyLimit } from 'hono/body-limit';

const app = new Hono();

// Logging
app.use('*', logger());

// CORS
app.use('/api/*', cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));

// Security headers
app.use('*', secureHeaders());

// ETag for caching
app.use('/static/*', etag());

// Compression
app.use('*', compress());

// Cache (Cloudflare)
app.use('/public/*', cache({
  cacheName: 'my-app',
  cacheControl: 'max-age=3600',
}));

// Basic auth
app.use('/admin/*', basicAuth({
  username: 'admin',
  password: 'secret',
}));

// Bearer token
app.use('/api/*', bearerAuth({
  token: 'my-secret-token',
}));

// JWT
app.use('/api/*', jwt({
  secret: 'my-jwt-secret',
}));

// Request timing
app.use('*', timing());

// Request ID
app.use('*', requestId());

// Body size limit
app.use('/upload/*', bodyLimit({
  maxSize: 10 * 1024 * 1024, // 10MB
}));
```

### Custom Middleware

```typescript
// Middleware with variables
interface Variables {
  user: { id: string; email: string } | null;
  requestId: string;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Auth middleware
const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    c.set('user', null);
    return next();
  }

  try {
    const user = await verifyToken(token, c.env.JWT_SECRET);
    c.set('user', user);
  } catch {
    c.set('user', null);
  }

  await next();
};

// Request ID middleware
const requestIdMiddleware = async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
};

// Apply middleware
app.use('*', requestIdMiddleware);
app.use('/api/*', authMiddleware);

// Access in handler
app.get('/api/me', (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ user });
});
```

### Conditional Middleware

```typescript
import { every, some } from 'hono/combine';

// Apply only if all conditions met
app.use('/api/*', every(
  authMiddleware,
  rateLimitMiddleware
));

// Apply if any condition met (short-circuit)
app.use('/admin/*', some(
  apiKeyAuth,
  jwtAuth
));
```

## D1 Database Integration

```typescript
// src/lib/db.ts
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export async function getUsers(db: D1Database): Promise<User[]> {
  const { results } = await db.prepare('SELECT * FROM users').all<User>();
  return results;
}

export async function getUserById(db: D1Database, id: number): Promise<User | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
}

export async function createUser(
  db: D1Database,
  data: { name: string; email: string }
): Promise<User> {
  const result = await db
    .prepare('INSERT INTO users (name, email) VALUES (?, ?) RETURNING *')
    .bind(data.name, data.email)
    .first<User>();
  return result!;
}

// src/routes/users.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getUsers, getUserById, createUser } from '../lib/db';

const users = new Hono<{ Bindings: Env }>();

users.get('/', async (c) => {
  const users = await getUsers(c.env.DB);
  return c.json(users);
});

users.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = await getUserById(c.env.DB, id);
  if (!user) return c.json({ error: 'Not found' }, 404);
  return c.json(user);
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

users.post('/', zValidator('json', CreateUserSchema), async (c) => {
  const data = c.req.valid('json');
  const user = await createUser(c.env.DB, data);
  return c.json(user, 201);
});

export default users;
```

## Static Assets

```typescript
// With assets binding
interface Env {
  ASSETS: Fetcher;
}

const app = new Hono<{ Bindings: Env }>();

// API routes first
app.route('/api', apiRoutes);

// Static assets fallback
app.get('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// Or serve specific paths
app.get('/static/*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// SPA fallback
app.get('*', async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  if (res.status === 404) {
    // Return index.html for SPA routing
    return c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url)));
  }
  return res;
});
```

## RPC Client (Type-Safe API Calls)

```typescript
// server/index.ts
import { Hono } from 'hono';
import { hc } from 'hono/client';

const app = new Hono()
  .get('/api/users', async (c) => {
    return c.json([{ id: 1, name: 'Alice' }]);
  })
  .post('/api/users', async (c) => {
    const body = await c.req.json();
    return c.json({ id: 2, ...body }, 201);
  })
  .get('/api/users/:id', async (c) => {
    const id = c.req.param('id');
    return c.json({ id, name: 'User' });
  });

export type AppType = typeof app;
export default app;

// client/index.ts
import { hc } from 'hono/client';
import type { AppType } from '../server';

const client = hc<AppType>('https://api.example.com');

// Type-safe API calls
const users = await client.api.users.$get();
const data = await users.json(); // Typed!

const newUser = await client.api.users.$post({
  json: { name: 'Bob' },
});

const user = await client.api.users[':id'].$get({
  param: { id: '123' },
});
```

## Testing

```typescript
// src/index.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import app from './index';

describe('API', () => {
  it('GET / returns hello', async () => {
    const res = await app.request('/', {}, env);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Hello Hono!');
  });

  it('GET /api/users returns users', async () => {
    const res = await app.request('/api/users', {}, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('POST /api/users creates user', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.com' }),
    }, env);
    expect(res.status).toBe(201);
  });

  it('validates request body', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }), // Invalid
    }, env);
    expect(res.status).toBe(400);
  });
});
```

## Best Practices

1. **Use typed bindings**: Always define `Env` interface
2. **Route organization**: Group related routes in separate files
3. **Validation**: Use Zod validators for all input
4. **Error handling**: Set up global error handler
5. **Middleware order**: Logger → Security → Auth → Routes
6. **Keep handlers thin**: Extract business logic to services
7. **Type-safe responses**: Use RPC client for frontend
