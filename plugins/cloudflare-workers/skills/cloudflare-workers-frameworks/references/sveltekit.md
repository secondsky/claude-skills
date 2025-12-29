# SvelteKit on Cloudflare Workers

Full-stack Svelte framework with SSR on the edge.

## Why SvelteKit on Workers?

- **No Virtual DOM**: Compiled to minimal JS
- **Built-in SSR**: Server-side rendering
- **File-based Routing**: Intuitive structure
- **Form Actions**: Progressive enhancement
- **Small Bundle**: Optimized output

## New Project Setup

```bash
# Create new SvelteKit project
bunx sv create my-app
cd my-app

# Add Cloudflare adapter
bun add -D @sveltejs/adapter-cloudflare
```

## Project Structure

```
my-app/
├── src/
│   ├── routes/
│   │   ├── +page.svelte          # Home page
│   │   ├── +page.server.ts       # Server load/actions
│   │   ├── +layout.svelte        # Root layout
│   │   ├── about/
│   │   │   └── +page.svelte      # /about
│   │   ├── users/
│   │   │   ├── +page.svelte      # /users
│   │   │   ├── +page.server.ts   # Load data
│   │   │   └── [id]/
│   │   │       ├── +page.svelte  # /users/:id
│   │   │       └── +page.server.ts
│   │   └── api/
│   │       └── users/
│   │           └── +server.ts    # /api/users
│   ├── lib/
│   │   └── db.ts
│   └── app.d.ts
├── static/
├── svelte.config.js
├── wrangler.jsonc
└── package.json
```

## Configuration

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<all>'],
      },
      platformProxy: {
        configPath: 'wrangler.jsonc',
        experimentalJsonConfig: true,
        persist: '.wrangler/state',
      },
    }),
  },
};

export default config;
```

```jsonc
// wrangler.jsonc
{
  "name": "sveltekit-app",
  "main": ".svelte-kit/cloudflare/_worker.js",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".svelte-kit/cloudflare"
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

## TypeScript Configuration

```typescript
// src/app.d.ts
declare global {
  namespace App {
    interface Locals {}
    interface PageData {}
    interface PageState {}
    interface Platform {
      env: {
        DB: D1Database;
        KV: KVNamespace;
        R2: R2Bucket;
        ENVIRONMENT: string;
      };
      context: ExecutionContext;
      caches: CacheStorage;
    }
    interface Error {}
  }
}

export {};
```

## Server Load Functions

```typescript
// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';

interface Post {
  id: number;
  title: string;
  content: string;
}

export const load: PageServerLoad = async ({ platform }) => {
  const { DB } = platform!.env;

  const { results: posts } = await DB.prepare(
    'SELECT * FROM posts ORDER BY created_at DESC LIMIT 10'
  ).all<Post>();

  return {
    posts,
  };
};
```

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<h1>Latest Posts</h1>

<ul>
  {#each data.posts as post}
    <li>
      <a href="/posts/{post.id}">{post.title}</a>
    </li>
  {/each}
</ul>
```

## Dynamic Routes

```typescript
// src/routes/users/[id]/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';

interface User {
  id: number;
  name: string;
  email: string;
}

export const load: PageServerLoad = async ({ params, platform }) => {
  const { DB } = platform!.env;

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(params.id)
    .first<User>();

  if (!user) {
    throw error(404, 'User not found');
  }

  return { user };
};

export const actions: Actions = {
  update: async ({ params, request, platform }) => {
    const { DB } = platform!.env;
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    // Validate
    if (!name || !email) {
      return { success: false, error: 'Name and email required' };
    }

    await DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
      .bind(name, email, params.id)
      .run();

    return { success: true };
  },

  delete: async ({ params, platform }) => {
    const { DB } = platform!.env;

    await DB.prepare('DELETE FROM users WHERE id = ?')
      .bind(params.id)
      .run();

    throw redirect(303, '/users');
  },
};
```

```svelte
<!-- src/routes/users/[id]/+page.svelte -->
<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;
</script>

<h1>{data.user.name}</h1>

{#if form?.error}
  <p class="error">{form.error}</p>
{/if}

<form method="POST" action="?/update" use:enhance>
  <label>
    Name:
    <input name="name" value={data.user.name} />
  </label>

  <label>
    Email:
    <input name="email" type="email" value={data.user.email} />
  </label>

  <button type="submit">Update</button>
</form>

<form method="POST" action="?/delete" use:enhance>
  <button type="submit">Delete</button>
</form>
```

## API Routes

```typescript
// src/routes/api/users/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform, url }) => {
  const { DB } = platform!.env;

  const limit = parseInt(url.searchParams.get('limit') || '10');

  const { results } = await DB.prepare(
    'SELECT * FROM users LIMIT ?'
  ).bind(limit).all();

  return json(results);
};

export const POST: RequestHandler = async ({ request, platform }) => {
  const { DB } = platform!.env;
  const data = await request.json();

  if (!data.name || !data.email) {
    return json({ error: 'Name and email required' }, { status: 400 });
  }

  const result = await DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
  )
    .bind(data.name, data.email)
    .first();

  return json(result, { status: 201 });
};
```

```typescript
// src/routes/api/users/[id]/+server.ts
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, platform }) => {
  const { DB } = platform!.env;

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(params.id)
    .first();

  if (!user) {
    throw error(404, 'User not found');
  }

  return json(user);
};

export const PUT: RequestHandler = async ({ params, request, platform }) => {
  const { DB } = platform!.env;
  const data = await request.json();

  await DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
    .bind(data.name, data.email, params.id)
    .run();

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(params.id)
    .first();

  return json(user);
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
  const { DB } = platform!.env;

  await DB.prepare('DELETE FROM users WHERE id = ?').bind(params.id).run();

  return new Response(null, { status: 204 });
};
```

## Layouts

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import type { LayoutData } from './$types';
  import '../app.css';

  export let data: LayoutData;
</script>

<header>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/users">Users</a>
  </nav>
</header>

<main>
  <slot />
</main>

<footer>
  <p>Built with SvelteKit on Cloudflare Workers</p>
</footer>
```

```typescript
// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ platform }) => {
  return {
    environment: platform!.env.ENVIRONMENT,
  };
};
```

## Hooks

```typescript
// src/hooks.server.ts
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const start = Date.now();

  // Auth check
  if (event.url.pathname.startsWith('/admin')) {
    const session = event.cookies.get('session');
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const response = await resolve(event);

  // Add timing header
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);

  return response;
};

export const handleError: HandleServerError = async ({ error, event }) => {
  console.error('Error:', error);

  return {
    message: 'Internal Error',
  };
};
```

## Caching

```typescript
// src/routes/cached/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  // Cache for 1 hour
  setHeaders({
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  });

  const { DB } = platform!.env;
  const { results } = await DB.prepare('SELECT * FROM posts').all();

  return { posts: results };
};
```

## Prerendering

```typescript
// src/routes/about/+page.ts
export const prerender = true; // Static at build time
```

```typescript
// src/routes/+layout.server.ts
export const prerender = false; // Ensure SSR
```

## Stores and Reactivity

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';

  const count = writable(0);
  let users: any[] = [];

  onMount(async () => {
    const res = await fetch('/api/users');
    users = await res.json();
  });

  function increment() {
    count.update(n => n + 1);
  }
</script>

<button on:click={increment}>
  Count: {$count}
</button>

<ul>
  {#each users as user}
    <li>{user.name}</li>
  {/each}
</ul>
```

## Build and Deploy

```bash
# Development
bun run dev

# Build
bun run build

# Preview with Wrangler
bunx wrangler dev

# Deploy
bunx wrangler deploy
```

## Best Practices

1. **Use Form Actions**: Progressive enhancement
2. **Type Platform**: Define `App.Platform` in `app.d.ts`
3. **Server Load**: Fetch data in `+page.server.ts`
4. **Cache Headers**: Set on static content
5. **Error Handling**: Use `error()` helper
6. **Enhance Forms**: Use `use:enhance` for smooth UX
