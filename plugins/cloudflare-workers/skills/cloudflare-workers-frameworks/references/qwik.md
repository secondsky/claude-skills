# Qwik on Cloudflare Workers

Resumable framework with instant loading and fine-grained lazy loading.

## Why Qwik on Workers?

- **Resumability**: No hydration, instant interactive
- **Fine-grained Lazy Loading**: Load only what's needed
- **O(1) Startup**: Constant time regardless of app size
- **Edge-First**: Built for edge deployment
- **Familiar JSX**: Similar to React

## New Project Setup

```bash
# Create new Qwik project
bun create qwik@latest my-app

# Select "Cloudflare Pages" adapter
cd my-app
bun install
```

## Project Structure

```
my-app/
├── src/
│   ├── routes/
│   │   ├── index.tsx            # Home page
│   │   ├── layout.tsx           # Root layout
│   │   ├── about/
│   │   │   └── index.tsx        # /about
│   │   ├── users/
│   │   │   ├── index.tsx        # /users
│   │   │   └── [id]/
│   │   │       └── index.tsx    # /users/:id
│   │   └── api/
│   │       └── users/
│   │           └── index.ts     # /api/users
│   ├── components/
│   │   └── Counter.tsx
│   └── entry.cloudflare-pages.tsx
├── public/
├── vite.config.ts
├── wrangler.jsonc
└── package.json
```

## Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';

export default defineConfig(() => {
  return {
    plugins: [qwikCity(), qwikVite()],
  };
});
```

```jsonc
// wrangler.jsonc
{
  "name": "qwik-app",
  "main": "dist/_worker.js",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "dist"
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
// src/entry.cloudflare-pages.tsx
import {
  createQwikCity,
  type PlatformCloudflarePages,
} from '@builder.io/qwik-city/middleware/cloudflare-pages';
import qwikCityPlan from '@qwik-city-plan';
import { manifest } from '@qwik-client-manifest';
import render from './entry.ssr';

declare global {
  interface QwikCityPlatform extends PlatformCloudflarePages {
    env: {
      DB: D1Database;
      KV: KVNamespace;
      R2: R2Bucket;
      ENVIRONMENT: string;
    };
  }
}

const fetch = createQwikCity({ render, qwikCityPlan, manifest });

export default { fetch };
```

## Route Data Loading

```tsx
// src/routes/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

interface Post {
  id: number;
  title: string;
  content: string;
}

export const usePosts = routeLoader$<Post[]>(async ({ platform }) => {
  const { DB } = platform.env;

  const { results } = await DB.prepare(
    'SELECT * FROM posts ORDER BY created_at DESC LIMIT 10'
  ).all<Post>();

  return results;
});

export default component$(() => {
  const posts = usePosts();

  return (
    <div>
      <h1>Latest Posts</h1>
      <ul>
        {posts.value.map((post) => (
          <li key={post.id}>
            <a href={`/posts/${post.id}`}>{post.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
});
```

## Dynamic Routes

```tsx
// src/routes/users/[id]/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, zod$, z } from '@builder.io/qwik-city';

interface User {
  id: number;
  name: string;
  email: string;
}

export const useUser = routeLoader$<User | null>(async ({ params, platform, status }) => {
  const { DB } = platform.env;

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(params.id)
    .first<User>();

  if (!user) {
    status(404);
    return null;
  }

  return user;
});

export const useUpdateUser = routeAction$(
  async (data, { params, platform }) => {
    const { DB } = platform.env;

    await DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
      .bind(data.name, data.email, params.id)
      .run();

    return { success: true };
  },
  zod$({
    name: z.string().min(1),
    email: z.string().email(),
  })
);

export const useDeleteUser = routeAction$(
  async (_, { params, platform, redirect }) => {
    const { DB } = platform.env;

    await DB.prepare('DELETE FROM users WHERE id = ?')
      .bind(params.id)
      .run();

    throw redirect(303, '/users');
  }
);

export default component$(() => {
  const user = useUser();
  const updateAction = useUpdateUser();
  const deleteAction = useDeleteUser();

  if (!user.value) {
    return <h1>User not found</h1>;
  }

  return (
    <div>
      <h1>{user.value.name}</h1>

      <Form action={updateAction}>
        <label>
          Name:
          <input name="name" value={user.value.name} />
        </label>

        <label>
          Email:
          <input name="email" type="email" value={user.value.email} />
        </label>

        <button type="submit">Update</button>
      </Form>

      {updateAction.value?.fieldErrors && (
        <ul>
          {Object.entries(updateAction.value.fieldErrors).map(([field, errors]) => (
            <li key={field}>{field}: {errors?.join(', ')}</li>
          ))}
        </ul>
      )}

      <Form action={deleteAction}>
        <button type="submit">Delete</button>
      </Form>
    </div>
  );
});
```

## API Endpoints

```typescript
// src/routes/api/users/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ platform, json }) => {
  const { DB } = platform.env;

  const { results } = await DB.prepare('SELECT * FROM users').all();

  json(200, results);
};

export const onPost: RequestHandler = async ({ platform, json, request }) => {
  const { DB } = platform.env;
  const data = await request.json();

  if (!data.name || !data.email) {
    json(400, { error: 'Name and email required' });
    return;
  }

  const result = await DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
  )
    .bind(data.name, data.email)
    .first();

  json(201, result);
};
```

```typescript
// src/routes/api/users/[id]/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ params, platform, json, status }) => {
  const { DB } = platform.env;

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(params.id)
    .first();

  if (!user) {
    status(404);
    json(404, { error: 'Not found' });
    return;
  }

  json(200, user);
};

export const onPut: RequestHandler = async ({ params, platform, json, request }) => {
  const { DB } = platform.env;
  const data = await request.json();

  await DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
    .bind(data.name, data.email, params.id)
    .run();

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(params.id)
    .first();

  json(200, user);
};

export const onDelete: RequestHandler = async ({ params, platform }) => {
  const { DB } = platform.env;

  await DB.prepare('DELETE FROM users WHERE id = ?').bind(params.id).run();

  return new Response(null, { status: 204 });
};
```

## Components with Signals

```tsx
// src/components/Counter.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';

export const Counter = component$<{ initial?: number }>((props) => {
  const count = useSignal(props.initial ?? 0);

  const increment = $(() => {
    count.value++;
  });

  const decrement = $(() => {
    count.value--;
  });

  return (
    <div>
      <button onClick$={decrement}>-</button>
      <span>{count.value}</span>
      <button onClick$={increment}>+</button>
    </div>
  );
});
```

## Layout

```tsx
// src/routes/layout.tsx
import { component$, Slot } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

export const useEnv = routeLoader$(async ({ platform }) => {
  return {
    environment: platform.env.ENVIRONMENT,
  };
});

export default component$(() => {
  const env = useEnv();

  return (
    <>
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/users">Users</a>
        </nav>
      </header>

      <main>
        <Slot />
      </main>

      <footer>
        <p>Environment: {env.value.environment}</p>
      </footer>
    </>
  );
});
```

## Middleware

```typescript
// src/routes/plugin@auth.ts
import type { RequestHandler } from '@builder.io/qwik-city';

export const onRequest: RequestHandler = async ({ cookie, redirect, url }) => {
  // Skip for public routes
  if (url.pathname.startsWith('/api/public')) {
    return;
  }

  // Auth check
  if (url.pathname.startsWith('/admin')) {
    const session = cookie.get('session');
    if (!session) {
      throw redirect(303, '/login');
    }
  }
};
```

## Caching

```typescript
// src/routes/cached/index.tsx
import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

export const useCachedData = routeLoader$(async ({ platform, cacheControl }) => {
  // Cache for 1 hour
  cacheControl({
    public: true,
    maxAge: 3600,
    staleWhileRevalidate: 86400,
  });

  const { DB } = platform.env;
  const { results } = await DB.prepare('SELECT * FROM posts').all();

  return results;
});

export default component$(() => {
  const data = useCachedData();

  return (
    <ul>
      {data.value.map((item: any) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
});
```

## Lazy Loading

```tsx
// Lazy load component
import { component$, useVisibleTask$ } from '@builder.io/qwik';

export default component$(() => {
  // Only runs on client when visible
  useVisibleTask$(() => {
    console.log('Component is visible');
  });

  return <div>Lazy loaded content</div>;
});
```

## Build and Deploy

```bash
# Development
bun run dev

# Build
bun run build

# Preview
bun run preview

# Deploy
bunx wrangler deploy
```

## Best Practices

1. **Use Signals**: Prefer `useSignal` over `useState`
2. **Route Loaders**: Fetch data with `routeLoader$`
3. **Route Actions**: Handle forms with `routeAction$`
4. **Lazy Functions**: Use `$()` for lazy-loaded event handlers
5. **Type Platform**: Define `QwikCityPlatform` interface
6. **Cache Control**: Set caching in route loaders
