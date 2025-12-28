# Express/Node.js to Cloudflare Workers Migration

Comprehensive guide for migrating Express and Node.js applications to Cloudflare Workers.

## Express vs Workers Concepts

| Express Concept | Workers Equivalent | Notes |
|----------------|-------------------|-------|
| `app` | Hono app | Similar API |
| `req` | `Request` | Web standard |
| `res` | `Response` | Web standard |
| `next()` | `await next()` | Async middleware |
| `app.use()` | `app.use()` | Nearly identical |
| `express.json()` | Built-in | Use `request.json()` |
| `express.static()` | Static Assets | Workers static serving |
| `req.params` | `c.req.param()` | Hono pattern |
| `req.query` | `c.req.query()` | Hono pattern |
| `req.body` | `await c.req.json()` | Async in Workers |

## Basic Migration

### Hello World

```typescript
// Express
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000);

// Hono (Workers)
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('Hello World'));

export default app;
```

### JSON Response

```typescript
// Express
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

// Hono
app.get('/api/users', (c) => c.json({ users: [] }));
```

### Request Body

```typescript
// Express
app.use(express.json());

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ name, email });
});

// Hono (no middleware needed)
app.post('/api/users', async (c) => {
  const { name, email } = await c.req.json();
  return c.json({ name, email }, 201);
});
```

## Middleware Migration

### Basic Middleware

```typescript
// Express
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Hono
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});
```

### Authentication Middleware

```typescript
// Express
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.use('/api', authMiddleware);

// Hono
import { jwt } from 'hono/jwt';

// Option 1: Built-in JWT middleware
app.use('/api/*', jwt({ secret: env.JWT_SECRET }));

app.get('/api/protected', (c) => {
  const payload = c.get('jwtPayload');
  return c.json({ user: payload });
});

// Option 2: Custom middleware
const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

app.use('/api/*', authMiddleware);
```

### Error Handling Middleware

```typescript
// Express
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Hono
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Or with detailed error handling
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error(err);
  return c.json(
    {
      error: 'Internal server error',
      message: c.env.ENVIRONMENT === 'development' ? err.message : undefined,
    },
    500
  );
});
```

### CORS Middleware

```typescript
// Express
import cors from 'cors';

app.use(cors({
  origin: 'https://example.com',
  methods: ['GET', 'POST'],
}));

// Hono
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: 'https://example.com',
  allowMethods: ['GET', 'POST'],
}));
```

## Route Parameters

```typescript
// Express
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ id });
});

app.get('/posts/:postId/comments/:commentId', (req, res) => {
  const { postId, commentId } = req.params;
  res.json({ postId, commentId });
});

// Hono
app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ id });
});

app.get('/posts/:postId/comments/:commentId', (c) => {
  const postId = c.req.param('postId');
  const commentId = c.req.param('commentId');
  return c.json({ postId, commentId });
});
```

## Query Parameters

```typescript
// Express
app.get('/search', (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  res.json({ q, page, limit });
});

// Hono
app.get('/search', (c) => {
  const q = c.req.query('q');
  const page = c.req.query('page') || '1';
  const limit = c.req.query('limit') || '10';
  return c.json({ q, page: parseInt(page), limit: parseInt(limit) });
});

// Or get all at once
app.get('/search', (c) => {
  const { q, page = '1', limit = '10' } = c.req.query();
  return c.json({ q, page: parseInt(page), limit: parseInt(limit) });
});
```

## Request Validation

```typescript
// Express with express-validator
import { body, validationResult } from 'express-validator';

app.post('/users',
  body('email').isEmail(),
  body('name').isLength({ min: 2 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Create user...
  }
);

// Hono with Zod
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

app.post('/users', zValidator('json', createUserSchema), (c) => {
  const { email, name } = c.req.valid('json');
  // Create user...
});
```

## Database Integration

### MongoDB → D1/KV

```typescript
// Express with MongoDB
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

app.get('/users', async (req, res) => {
  const db = client.db('myapp');
  const users = await db.collection('users').find().toArray();
  res.json(users);
});

// Hono with D1
interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/users', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM users').all();
  return c.json(results);
});
```

### Prisma → Drizzle

```typescript
// Express with Prisma
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

app.get('/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { posts: true },
  });
  res.json(user);
});

// Hono with Drizzle + D1
import { drizzle } from 'drizzle-orm/d1';
import { users, posts } from './schema';

app.get('/users/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .leftJoin(posts, eq(posts.userId, users.id));

  return c.json(user);
});
```

## Session Management

```typescript
// Express with express-session
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.post('/login', (req, res) => {
  req.session.userId = user.id;
  res.json({ success: true });
});

// Hono with KV sessions
import { getCookie, setCookie } from 'hono/cookie';

const SESSION_TTL = 60 * 60 * 24; // 24 hours

interface Env {
  SESSIONS: KVNamespace;
}

const sessionMiddleware = async (c, next) => {
  const sessionId = getCookie(c, 'session_id');

  if (sessionId) {
    const sessionData = await c.env.SESSIONS.get(sessionId, 'json');
    if (sessionData) {
      c.set('session', sessionData);
    }
  }

  await next();

  // Save session after handler
  const session = c.get('session');
  if (session) {
    const id = sessionId || crypto.randomUUID();
    await c.env.SESSIONS.put(id, JSON.stringify(session), {
      expirationTtl: SESSION_TTL,
    });
    setCookie(c, 'session_id', id, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: SESSION_TTL,
    });
  }
};

app.use('*', sessionMiddleware);

app.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  const user = await authenticate(email, password);

  c.set('session', { userId: user.id });
  return c.json({ success: true });
});
```

## File Uploads

```typescript
// Express with multer
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  // Save to S3...
  res.json({ url: uploadedUrl });
});

// Hono with R2
interface Env {
  BUCKET: R2Bucket;
}

app.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  const key = `uploads/${crypto.randomUUID()}-${file.name}`;
  const content = await file.arrayBuffer();

  await c.env.BUCKET.put(key, content, {
    httpMetadata: { contentType: file.type },
  });

  return c.json({ url: `https://cdn.example.com/${key}` });
});
```

## WebSocket Migration

```typescript
// Express with ws
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    ws.send(`Echo: ${data}`);
  });
});

// Workers with Durable Objects
export class WebSocketRoom implements DurableObject {
  private sessions: Set<WebSocket> = new Set();

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.sessions.add(server);

    server.addEventListener('message', (event) => {
      server.send(`Echo: ${event.data}`);
    });

    server.addEventListener('close', () => {
      this.sessions.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
}
```

## Static Files

```typescript
// Express
app.use(express.static('public'));

// Workers with Static Assets
// wrangler.jsonc
{
  "assets": {
    "directory": "./public"
  }
}

// Or manual serving
app.get('/static/*', async (c) => {
  const path = c.req.path.replace('/static/', '');
  const object = await c.env.ASSETS.get(path);

  if (!object) {
    return c.notFound();
  }

  return new Response(object.body, {
    headers: { 'Content-Type': object.httpMetadata?.contentType || 'text/plain' },
  });
});
```

## Express Adapter (Gradual Migration)

For complex apps, use an adapter pattern:

```typescript
// express-adapter.ts
type ExpressHandler = (
  req: ExpressRequest,
  res: ExpressResponse,
  next?: () => void
) => void | Promise<void>;

interface ExpressRequest {
  method: string;
  url: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: any;
  get(name: string): string | undefined;
}

class ExpressResponse {
  private statusCode = 200;
  private headers = new Headers();
  private body: any = null;
  private sent = false;

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  set(name: string, value: string): this {
    this.headers.set(name, value);
    return this;
  }

  json(data: any): this {
    this.headers.set('Content-Type', 'application/json');
    this.body = JSON.stringify(data);
    this.sent = true;
    return this;
  }

  send(data: string): this {
    this.body = data;
    this.sent = true;
    return this;
  }

  end(): this {
    this.sent = true;
    return this;
  }

  toResponse(): Response {
    return new Response(this.body, {
      status: this.statusCode,
      headers: this.headers,
    });
  }
}

export function adaptExpressHandler(handler: ExpressHandler) {
  return async (c: Context) => {
    const url = new URL(c.req.url);

    const req: ExpressRequest = {
      method: c.req.method,
      url: c.req.url,
      path: url.pathname,
      params: c.req.param() as Record<string, string>,
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(c.req.raw.headers),
      body: c.req.method !== 'GET' ? await c.req.json().catch(() => ({})) : {},
      get(name: string) {
        return c.req.header(name);
      },
    };

    const res = new ExpressResponse();

    await handler(req, res);

    return res.toResponse();
  };
}

// Usage
import { existingHandler } from './existing-express-code';

app.get('/api/legacy', adaptExpressHandler(existingHandler));
```

## Migration Checklist

1. [ ] Replace Express with Hono
2. [ ] Convert `require()` to `import`
3. [ ] Replace `process.env` with `env` parameter
4. [ ] Convert sync middleware to async
5. [ ] Replace `req.body` with `await c.req.json()`
6. [ ] Replace `res.json()` with `c.json()`
7. [ ] Migrate database to D1/KV
8. [ ] Migrate file storage to R2
9. [ ] Replace sessions with KV-based sessions
10. [ ] Update WebSocket to Durable Objects
