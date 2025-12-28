# Vercel/Next.js to Cloudflare Workers Migration

Comprehensive guide for migrating from Vercel and Next.js to Cloudflare Workers.

## Migration Paths

| Source | Target | Complexity | Approach |
|--------|--------|------------|----------|
| API Routes | Workers + Hono | Low | Direct conversion |
| Full Next.js | Workers + OpenNext | Medium | Adapter-based |
| Edge Middleware | Workers | Low | Direct conversion |
| Edge Functions | Workers | Low | Nearly identical |

## API Routes Migration

### Basic API Route

```typescript
// Vercel: pages/api/hello.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name = 'World' } = req.query;
  res.status(200).json({ message: `Hello ${name}` });
}

// Workers: src/index.ts
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') || 'World';
    return Response.json({ message: `Hello ${name}` });
  },
};
```

### API Route with Methods

```typescript
// Vercel: pages/api/users/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      const user = await getUser(id as string);
      return res.status(200).json(user);

    case 'PUT':
      const updated = await updateUser(id as string, req.body);
      return res.status(200).json(updated);

    case 'DELETE':
      await deleteUser(id as string);
      return res.status(204).end();

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end();
  }
}

// Workers with Hono: src/index.ts
import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = await getUser(c.env.DB, id);
  return c.json(user);
});

app.put('/api/users/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = await updateUser(c.env.DB, id, body);
  return c.json(updated);
});

app.delete('/api/users/:id', async (c) => {
  const id = c.req.param('id');
  await deleteUser(c.env.DB, id);
  return c.body(null, 204);
});

export default app;
```

### API Route with Database

```typescript
// Vercel: pages/api/posts.ts
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await sql`SELECT * FROM posts ORDER BY created_at DESC LIMIT 10`;
    return res.json(rows);
  }

  if (req.method === 'POST') {
    const { title, content } = req.body;
    const { rows } = await sql`
      INSERT INTO posts (title, content)
      VALUES (${title}, ${content})
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }
}

// Workers with D1: src/index.ts
interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/posts') {
      if (request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM posts ORDER BY created_at DESC LIMIT 10'
        ).all();
        return Response.json(results);
      }

      if (request.method === 'POST') {
        const { title, content } = await request.json();
        const result = await env.DB.prepare(
          'INSERT INTO posts (title, content) VALUES (?, ?) RETURNING *'
        )
          .bind(title, content)
          .first();
        return Response.json(result, { status: 201 });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
```

## Edge Middleware Migration

```typescript
// Vercel: middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check auth
  const token = request.cookies.get('token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add headers
  const response = NextResponse.next();
  response.headers.set('X-Request-Id', crypto.randomUUID());

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};

// Workers: src/middleware.ts
interface Env {
  JWT_SECRET: string;
}

export async function handleMiddleware(
  request: Request,
  env: Env
): Promise<Response | null> {
  const url = new URL(request.url);

  // Check auth for dashboard routes
  if (url.pathname.startsWith('/dashboard')) {
    const token = getCookie(request, 'token');

    if (!token) {
      return Response.redirect(new URL('/login', request.url));
    }

    try {
      await verifyToken(token, env.JWT_SECRET);
    } catch {
      return Response.redirect(new URL('/login', request.url));
    }
  }

  // Continue with request, add headers to response later
  return null;
}

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie');
  if (!cookies) return null;

  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}
```

## Full Next.js Migration (OpenNext)

For complete Next.js apps, use the OpenNext adapter:

```bash
# Install OpenNext
npm install @opennextjs/cloudflare

# Add to package.json
# "build": "npx opennextjs-cloudflare"
```

```typescript
// app/api/users/route.ts (App Router)
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
  const { env } = await getCloudflareContext();

  const { results } = await env.DB.prepare('SELECT * FROM users').all();

  return Response.json(results);
}

export async function POST(request: Request) {
  const { env } = await getCloudflareContext();
  const body = await request.json();

  const result = await env.DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
  )
    .bind(body.name, body.email)
    .first();

  return Response.json(result, { status: 201 });
}
```

```typescript
// wrangler.jsonc
{
  "name": "my-nextjs-app",
  "main": ".open-next/worker.js",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat_v2"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "my-db", "database_id": "xxx" }
  ]
}
```

## Server Actions Migration

```typescript
// Vercel: app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@vercel/postgres';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await sql`INSERT INTO posts (title, content) VALUES (${title}, ${content})`;

  revalidatePath('/posts');
}

// Workers + Next.js (OpenNext): app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function createPost(formData: FormData) {
  const { env } = await getCloudflareContext();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await env.DB.prepare('INSERT INTO posts (title, content) VALUES (?, ?)')
    .bind(title, content)
    .run();

  revalidatePath('/posts');
}
```

## Storage Migration

### Vercel Blob → R2

```typescript
// Vercel: pages/api/upload.ts
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  const file = req.body;
  const blob = await put('my-file.txt', file, { access: 'public' });
  res.json({ url: blob.url });
}

// Workers: src/upload.ts
interface Env {
  BUCKET: R2Bucket;
}

export async function handleUpload(request: Request, env: Env): Promise<Response> {
  const file = await request.arrayBuffer();
  const key = 'my-file.txt';

  await env.BUCKET.put(key, file, {
    httpMetadata: {
      contentType: request.headers.get('Content-Type') || 'application/octet-stream',
    },
  });

  // Return public URL (configure R2 custom domain)
  return Response.json({ url: `https://cdn.example.com/${key}` });
}
```

### Vercel KV → Cloudflare KV

```typescript
// Vercel: pages/api/cache.ts
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const value = await kv.get('my-key');
    return res.json({ value });
  }

  if (req.method === 'POST') {
    await kv.set('my-key', req.body.value, { ex: 3600 });
    return res.json({ success: true });
  }
}

// Workers: src/cache.ts
interface Env {
  KV: KVNamespace;
}

export async function handleCache(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const value = await env.KV.get('my-key');
    return Response.json({ value });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    await env.KV.put('my-key', body.value, { expirationTtl: 3600 });
    return Response.json({ success: true });
  }

  return new Response('Method not allowed', { status: 405 });
}
```

## ISR/SSG Migration

```typescript
// Vercel: pages/posts/[id].tsx
export async function getStaticProps({ params }) {
  const post = await getPost(params.id);
  return {
    props: { post },
    revalidate: 60, // ISR: revalidate every 60 seconds
  };
}

export async function getStaticPaths() {
  const posts = await getAllPosts();
  return {
    paths: posts.map((p) => ({ params: { id: p.id } })),
    fallback: 'blocking',
  };
}

// Workers + Next.js (OpenNext handles ISR automatically)
// Or manual implementation:

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/posts\/(\w+)$/);

    if (!match) {
      return new Response('Not found', { status: 404 });
    }

    const id = match[1];
    const cacheKey = `post:${id}`;

    // Check cache
    const cached = await env.KV.get(cacheKey, 'json');
    if (cached) {
      // Return cached, but revalidate in background
      const response = Response.json(cached);

      // Background revalidation
      // (Simplified - real implementation uses stale-while-revalidate)
      return response;
    }

    // Fetch from database
    const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?')
      .bind(id)
      .first();

    if (!post) {
      return new Response('Not found', { status: 404 });
    }

    // Cache for 60 seconds
    await env.KV.put(cacheKey, JSON.stringify(post), { expirationTtl: 60 });

    return Response.json(post);
  },
};
```

## Environment Variables

```typescript
// Vercel: vercel.json
{
  "env": {
    "DATABASE_URL": "@database_url",
    "API_KEY": "@api_key"
  }
}

// Vercel: usage
const dbUrl = process.env.DATABASE_URL;

// Workers: wrangler.jsonc
{
  "vars": {
    "DATABASE_URL": "postgres://..."
  }
}

// Workers: secrets (via CLI)
// npx wrangler secret put API_KEY

// Workers: usage
interface Env {
  DATABASE_URL: string;
  API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const dbUrl = env.DATABASE_URL;
    const apiKey = env.API_KEY;
    // ...
  },
};
```

## Migration Checklist

1. [ ] Identify API routes to migrate
2. [ ] Choose approach: Hono (API only) or OpenNext (full Next.js)
3. [ ] Replace `@vercel/postgres` with D1
4. [ ] Replace `@vercel/kv` with Cloudflare KV
5. [ ] Replace `@vercel/blob` with R2
6. [ ] Update middleware to Workers format
7. [ ] Configure wrangler.jsonc with bindings
8. [ ] Migrate environment variables and secrets
9. [ ] Update Server Actions to use Cloudflare context
10. [ ] Test ISR/SSG behavior with caching
