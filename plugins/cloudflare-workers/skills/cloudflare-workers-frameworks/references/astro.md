# Astro on Cloudflare Workers

Content-focused framework with optional interactivity islands.

## Why Astro on Workers?

- **Zero JS by Default**: Ship minimal JavaScript
- **Islands Architecture**: Interactive components where needed
- **Content Collections**: Type-safe content management
- **SSR/SSG/Hybrid**: Choose per-route rendering
- **Multi-Framework**: Use React, Vue, Svelte components

## New Project Setup

```bash
# Create new Astro project
bun create astro@latest my-app

# Add Cloudflare adapter
cd my-app
bunx astro add cloudflare

# This adds:
# - @astrojs/cloudflare adapter
# - Updates astro.config.mjs
```

## Project Structure

```
my-app/
├── src/
│   ├── pages/
│   │   ├── index.astro       # Home page
│   │   ├── about.astro       # /about
│   │   ├── posts/
│   │   │   ├── index.astro   # /posts
│   │   │   └── [slug].astro  # /posts/:slug
│   │   └── api/
│   │       └── users.ts      # /api/users
│   ├── components/
│   │   ├── Header.astro
│   │   └── Counter.tsx       # React island
│   ├── layouts/
│   │   └── Base.astro
│   └── content/
│       └── posts/
│           └── hello.md
├── public/
├── astro.config.mjs
├── wrangler.jsonc
└── package.json
```

## Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server', // or 'hybrid' for mixed SSR/SSG
  adapter: cloudflare({
    imageService: 'cloudflare',
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [
    react(),
    tailwind(),
  ],
});
```

```jsonc
// wrangler.jsonc
{
  "name": "astro-app",
  "main": "./dist/_worker.js",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
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
  ]
}
```

## TypeScript Configuration

```typescript
// src/env.d.ts
/// <reference types="astro/client" />

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  ENVIRONMENT: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
```

## Accessing Cloudflare Bindings

```astro
---
// src/pages/index.astro
const runtime = Astro.locals.runtime;
const { DB, KV } = runtime.env;

interface Post {
  id: number;
  title: string;
  content: string;
}

const { results: posts } = await DB.prepare(
  'SELECT * FROM posts ORDER BY created_at DESC LIMIT 10'
).all<Post>();
---

<html>
<head>
  <title>My Blog</title>
</head>
<body>
  <h1>Latest Posts</h1>
  <ul>
    {posts.map((post) => (
      <li>
        <a href={`/posts/${post.id}`}>{post.title}</a>
      </li>
    ))}
  </ul>
</body>
</html>
```

## Dynamic Routes

```astro
---
// src/pages/posts/[slug].astro
import Layout from '../../layouts/Base.astro';

export const prerender = false; // SSR

const { slug } = Astro.params;
const { DB } = Astro.locals.runtime.env;

const post = await DB.prepare(
  'SELECT * FROM posts WHERE slug = ?'
).bind(slug).first();

if (!post) {
  return Astro.redirect('/404');
}
---

<Layout title={post.title}>
  <article>
    <h1>{post.title}</h1>
    <div set:html={post.content} />
  </article>
</Layout>
```

## API Routes

```typescript
// src/pages/api/users.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const { DB } = locals.runtime.env;

  const { results } = await DB.prepare('SELECT * FROM users').all();

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const { DB } = locals.runtime.env;
  const data = await request.json();

  if (!data.name || !data.email) {
    return new Response(
      JSON.stringify({ error: 'Name and email required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = await DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
  )
    .bind(data.name, data.email)
    .first();

  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

## Content Collections

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    author: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
```

```markdown
---
# src/content/posts/hello-world.md
title: Hello World
description: My first blog post
publishDate: 2024-01-15
author: John Doe
tags: [astro, cloudflare]
---

# Hello World

This is my first blog post built with Astro on Cloudflare Workers!
```

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Base.astro';

const posts = await getCollection('posts', ({ data }) => !data.draft);
posts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
---

<Layout title="Blog">
  <h1>Blog</h1>
  <ul>
    {posts.map((post) => (
      <li>
        <a href={`/blog/${post.slug}`}>{post.data.title}</a>
        <time datetime={post.data.publishDate.toISOString()}>
          {post.data.publishDate.toLocaleDateString()}
        </time>
      </li>
    ))}
  </ul>
</Layout>
```

## Islands (Interactive Components)

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

export default function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial);

  return (
    <div>
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

```astro
---
// src/pages/interactive.astro
import Counter from '../components/Counter';
import Layout from '../layouts/Base.astro';
---

<Layout title="Interactive">
  <h1>Interactive Page</h1>

  <!-- Only hydrates on client load -->
  <Counter client:load initial={5} />

  <!-- Hydrates when visible -->
  <Counter client:visible />

  <!-- Hydrates on idle -->
  <Counter client:idle />

  <!-- Hydrates on media query -->
  <Counter client:media="(max-width: 768px)" />
</Layout>
```

## Hybrid Rendering

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'hybrid', // Mix of static and SSR
  adapter: cloudflare(),
});
```

```astro
---
// src/pages/static-page.astro
export const prerender = true; // Static at build time
---

<h1>This page is static</h1>
```

```astro
---
// src/pages/dynamic-page.astro
export const prerender = false; // SSR at runtime

const data = await fetch('https://api.example.com/data').then(r => r.json());
---

<h1>Dynamic: {data.title}</h1>
```

## Middleware

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // Add timing header
  const start = Date.now();

  // Auth check
  if (context.url.pathname.startsWith('/admin')) {
    const token = context.cookies.get('token');
    if (!token) {
      return context.redirect('/login');
    }
  }

  const response = await next();

  // Add headers
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);

  return response;
});
```

## Caching

```astro
---
// src/pages/cached.astro
// Cache for 1 hour, serve stale for 1 day
Astro.response.headers.set(
  'Cache-Control',
  'public, max-age=3600, stale-while-revalidate=86400'
);

const data = await fetchData();
---

<h1>{data.title}</h1>
```

## Build and Deploy

```bash
# Development
bun run dev

# Build
bun run build

# Preview locally with Wrangler
bunx wrangler dev

# Deploy
bunx wrangler deploy
```

## Best Practices

1. **Prefer Static**: Use `prerender = true` for content pages
2. **Islands Sparingly**: Only hydrate what needs interactivity
3. **Content Collections**: Use for type-safe markdown/MDX
4. **Cache Headers**: Set Cache-Control on SSR pages
5. **Image Optimization**: Use Cloudflare Images service
6. **Type Bindings**: Define `Env` interface in `env.d.ts`
