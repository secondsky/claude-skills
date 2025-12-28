# Next.js on Cloudflare Workers (OpenNext)

Deploy Next.js App Router applications to Cloudflare Workers using OpenNext.

## Why Next.js on Workers?

- **React Ecosystem**: Use familiar Next.js patterns
- **App Router**: Server Components, Streaming
- **Edge Performance**: Global distribution
- **Cloudflare Bindings**: Access D1, KV, R2

## Important: OpenNext Required

Next.js doesn't natively support Workers. Use **OpenNext** adapter:

```bash
# New project
bunx create-next-app@latest my-app --typescript --tailwind --app
cd my-app

# Add OpenNext Cloudflare adapter
bun add @opennextjs/cloudflare
```

## Project Structure

```
my-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── api/
│   │   └── users/
│   │       └── route.ts
│   └── users/
│       ├── page.tsx
│       └── [id]/
│           └── page.tsx
├── lib/
│   └── cloudflare.ts
├── public/
├── next.config.ts
├── wrangler.jsonc
├── open-next.config.ts
└── package.json
```

## Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for Workers
  experimental: {
    // Enable if using server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
```

```typescript
// open-next.config.ts
import type { OpenNextConfig } from '@opennextjs/cloudflare';

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare-node',
      converter: 'edge',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },
};

export default config;
```

```jsonc
// wrangler.jsonc
{
  "name": "nextjs-app",
  "main": ".open-next/worker.js",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-db",
      "database_id": "xxx"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "xxx"
    }
  ],
  "vars": {
    "ENVIRONMENT": "development"
  }
}
```

## Accessing Cloudflare Bindings

```typescript
// lib/cloudflare.ts
import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  ENVIRONMENT: string;
}

export async function getEnv(): Promise<Env> {
  const { env } = await getCloudflareContext();
  return env as Env;
}

// Or use the context directly
export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  return env.DB;
}
```

## Server Components

```tsx
// app/page.tsx
import { getEnv } from '@/lib/cloudflare';

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

async function getPosts(): Promise<Post[]> {
  const { DB } = await getEnv();
  const { results } = await DB.prepare(
    'SELECT * FROM posts ORDER BY created_at DESC LIMIT 10'
  ).all<Post>();
  return results;
}

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <main>
      <h1>Latest Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

// Caching
export const revalidate = 60; // ISR: Revalidate every 60 seconds
```

## Dynamic Routes

```tsx
// app/users/[id]/page.tsx
import { getEnv } from '@/lib/cloudflare';
import { notFound } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

async function getUser(id: string): Promise<User | null> {
  const { DB } = await getEnv();
  return DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<User>();
}

export default async function UserPage({ params }: Props) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Generate static params (optional)
export async function generateStaticParams() {
  const { DB } = await getEnv();
  const { results } = await DB.prepare('SELECT id FROM users LIMIT 100').all();
  return results.map((user: { id: number }) => ({
    id: user.id.toString(),
  }));
}
```

## API Routes

```typescript
// app/api/users/route.ts
import { getEnv } from '@/lib/cloudflare';
import { NextRequest, NextResponse } from 'next/server';

interface User {
  id: number;
  name: string;
  email: string;
}

export async function GET(request: NextRequest) {
  const { DB } = await getEnv();

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  const { results } = await DB.prepare(
    'SELECT * FROM users LIMIT ?'
  ).bind(limit).all<User>();

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const { DB } = await getEnv();
  const body = await request.json();

  // Validate
  if (!body.name || !body.email) {
    return NextResponse.json(
      { error: 'Name and email required' },
      { status: 400 }
    );
  }

  const result = await DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
  )
    .bind(body.name, body.email)
    .first<User>();

  return NextResponse.json(result, { status: 201 });
}
```

```typescript
// app/api/users/[id]/route.ts
import { getEnv } from '@/lib/cloudflare';
import { NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const { DB } = await getEnv();

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();

  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const { DB } = await getEnv();
  const body = await request.json();

  await DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
    .bind(body.name, body.email, id)
    .run();

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();

  return NextResponse.json(user);
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const { DB } = await getEnv();

  await DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

  return new NextResponse(null, { status: 204 });
}
```

## Server Actions

```tsx
// app/users/new/page.tsx
import { getEnv } from '@/lib/cloudflare';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function createUser(formData: FormData) {
  'use server';

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const { DB } = await getEnv();

  await DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
    .bind(name, email)
    .run();

  revalidatePath('/users');
  redirect('/users');
}

export default function NewUserPage() {
  return (
    <form action={createUser}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit">Create User</button>
    </form>
  );
}
```

## Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Auth check
  const token = request.cookies.get('token');
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Streaming and Suspense

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { getEnv } from '@/lib/cloudflare';

async function SlowStats() {
  const { DB } = await getEnv();

  // Simulate slow query
  const stats = await DB.prepare(`
    SELECT COUNT(*) as count FROM analytics
    WHERE date > datetime('now', '-30 days')
  `).first();

  return <div>Total events: {stats?.count}</div>;
}

async function FastData() {
  const { DB } = await getEnv();
  const user = await DB.prepare('SELECT * FROM users WHERE id = 1').first();
  return <div>Welcome, {user?.name}</div>;
}

export default async function DashboardPage() {
  return (
    <div>
      {/* Fast content loads immediately */}
      <FastData />

      {/* Slow content streams in */}
      <Suspense fallback={<div>Loading stats...</div>}>
        <SlowStats />
      </Suspense>
    </div>
  );
}
```

## Environment Variables

```typescript
// .dev.vars (local development)
ENVIRONMENT=development
JWT_SECRET=local-secret

// wrangler.jsonc
{
  "vars": {
    "ENVIRONMENT": "development"
  }
}

// Production secrets
// bunx wrangler secret put JWT_SECRET
```

## Build and Deploy

```bash
# Development
bun run dev

# Build for production
bun run build
bunx @opennextjs/cloudflare build

# Preview locally
bunx wrangler dev

# Deploy
bunx wrangler deploy
```

## Limitations

1. **No Edge Runtime**: OpenNext uses Node.js compatibility mode
2. **ISR Limited**: Full ISR requires additional setup
3. **Image Optimization**: Use Cloudflare Images or external service
4. **Bundle Size**: Keep under 25MB compressed
5. **Cold Starts**: Minimize dependencies

## Best Practices

1. **Use Server Components**: Default to RSC for data fetching
2. **Stream Long Operations**: Use Suspense for slow data
3. **Cache Aggressively**: Set `revalidate` on pages
4. **Minimize Bundle**: Tree-shake unused code
5. **Type Bindings**: Create typed `getEnv()` helper
6. **Test Locally**: Use `wrangler dev` before deploying
