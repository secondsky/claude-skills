# Remix on Cloudflare Workers

Full-stack React framework with server-side rendering on the edge.

## Why Remix on Workers?

- **Edge SSR**: Fast server rendering globally
- **Loaders/Actions**: Server-side data fetching
- **Progressive Enhancement**: Works without JS
- **Web Standards**: Uses native Request/Response
- **Cloudflare Bindings**: Access D1, KV, R2, etc.

## New Project Setup

```bash
# Create new Remix project
bunx create-remix@latest my-app

# Choose "Cloudflare Workers" template
# Or use:
bunx create-remix@latest my-app --template remix-run/remix/templates/cloudflare-workers

cd my-app
bun install
```

## Project Structure

```
my-app/
├── app/
│   ├── routes/
│   │   ├── _index.tsx        # Home page
│   │   ├── about.tsx         # /about
│   │   ├── users._index.tsx  # /users
│   │   ├── users.$id.tsx     # /users/:id
│   │   └── api.users.ts      # /api/users (resource route)
│   ├── components/
│   ├── lib/
│   ├── root.tsx              # Root layout
│   └── entry.server.tsx      # Server entry
├── public/
├── load-context.ts           # Cloudflare context
├── wrangler.jsonc
├── vite.config.ts
└── package.json
```

## Cloudflare Context Setup

```typescript
// load-context.ts
import { type PlatformProxy } from 'wrangler';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  ENVIRONMENT: string;
}

type Cloudflare = Omit<PlatformProxy<Env>, 'dispose'>;

declare module '@remix-run/cloudflare' {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}

export function getLoadContext({ context }: { context: { cloudflare: Cloudflare } }) {
  return { cloudflare: context.cloudflare };
}
```

```typescript
// vite.config.ts
import { vitePlugin as remix } from '@remix-run/dev';
import { cloudflareDevProxy } from '@remix-run/dev/vite/cloudflare';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { getLoadContext } from './load-context';

export default defineConfig({
  plugins: [
    cloudflareDevProxy({ getLoadContext }),
    remix(),
    tsconfigPaths(),
  ],
});
```

## Wrangler Configuration

```jsonc
// wrangler.jsonc
{
  "name": "remix-app",
  "main": "./build/server/index.js",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./build/client"
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

## Routes and Loaders

### Basic Route

```tsx
// app/routes/_index.tsx
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: 'My App' },
    { name: 'description', content: 'Welcome to my app' },
  ];
};

export async function loader({ context }: LoaderFunctionArgs) {
  const { DB } = context.cloudflare.env;

  const { results } = await DB.prepare(
    'SELECT * FROM posts ORDER BY created_at DESC LIMIT 10'
  ).all();

  return { posts: results };
}

export default function Index() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Latest Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Dynamic Route

```tsx
// app/routes/users.$id.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData, Form, useActionData } from '@remix-run/react';
import { json, redirect } from '@remix-run/cloudflare';

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { DB } = context.cloudflare.env;
  const { id } = params;

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ user });
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const { DB } = context.cloudflare.env;
  const formData = await request.formData();

  const intent = formData.get('intent');

  if (intent === 'update') {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    // Validate
    const errors: Record<string, string> = {};
    if (!name) errors.name = 'Name is required';
    if (!email) errors.email = 'Email is required';

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 });
    }

    await DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
      .bind(name, email, params.id)
      .run();

    return redirect(`/users/${params.id}`);
  }

  if (intent === 'delete') {
    await DB.prepare('DELETE FROM users WHERE id = ?')
      .bind(params.id)
      .run();

    return redirect('/users');
  }

  return null;
}

export default function UserDetail() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <h1>{user.name}</h1>

      <Form method="post">
        <input type="hidden" name="intent" value="update" />

        <div>
          <label>
            Name:
            <input name="name" defaultValue={user.name} />
            {actionData?.errors?.name && <span>{actionData.errors.name}</span>}
          </label>
        </div>

        <div>
          <label>
            Email:
            <input name="email" type="email" defaultValue={user.email} />
            {actionData?.errors?.email && <span>{actionData.errors.email}</span>}
          </label>
        </div>

        <button type="submit">Update</button>
      </Form>

      <Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <button type="submit">Delete</button>
      </Form>
    </div>
  );
}
```

### Resource Routes (API)

```tsx
// app/routes/api.users.ts
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export async function loader({ context }: LoaderFunctionArgs) {
  const { DB } = context.cloudflare.env;

  const { results } = await DB.prepare('SELECT * FROM users').all();

  return json(results);
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { DB } = context.cloudflare.env;

  if (request.method === 'POST') {
    const data = await request.json();

    const result = await DB.prepare(
      'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
    )
      .bind(data.name, data.email)
      .first();

    return json(result, { status: 201 });
  }

  return json({ error: 'Method not allowed' }, { status: 405 });
}
```

## Authentication

```tsx
// app/lib/auth.server.ts
import { createCookieSessionStorage, redirect } from '@remix-run/cloudflare';

interface User {
  id: string;
  email: string;
  name: string;
}

export function createAuthSession(env: Env) {
  const sessionStorage = createCookieSessionStorage({
    cookie: {
      name: '__session',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secrets: [env.SESSION_SECRET],
      secure: env.ENVIRONMENT === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });

  async function getSession(request: Request) {
    return sessionStorage.getSession(request.headers.get('Cookie'));
  }

  async function createUserSession(userId: string, redirectTo: string) {
    const session = await sessionStorage.getSession();
    session.set('userId', userId);

    return redirect(redirectTo, {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  }

  async function getUserId(request: Request): Promise<string | undefined> {
    const session = await getSession(request);
    return session.get('userId');
  }

  async function requireUserId(request: Request): Promise<string> {
    const userId = await getUserId(request);
    if (!userId) {
      throw redirect('/login');
    }
    return userId;
  }

  async function logout(request: Request) {
    const session = await getSession(request);

    return redirect('/login', {
      headers: {
        'Set-Cookie': await sessionStorage.destroySession(session),
      },
    });
  }

  return {
    getSession,
    createUserSession,
    getUserId,
    requireUserId,
    logout,
  };
}

// app/routes/login.tsx
import { ActionFunctionArgs, json, redirect } from '@remix-run/cloudflare';
import { Form, useActionData } from '@remix-run/react';
import { createAuthSession } from '~/lib/auth.server';

export async function action({ request, context }: ActionFunctionArgs) {
  const { DB, SESSION_SECRET } = context.cloudflare.env;
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Verify credentials
  const user = await DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (!user || !await verifyPassword(password, user.password_hash)) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const auth = createAuthSession(context.cloudflare.env);
  return auth.createUserSession(user.id, '/dashboard');
}

export default function Login() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      {actionData?.error && <p>{actionData.error}</p>}
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </Form>
  );
}
```

## Error Handling

```tsx
// app/root.tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useRouteError } from '@remix-run/react';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <html>
        <head>
          <title>{error.status} {error.statusText}</title>
          <Meta />
          <Links />
        </head>
        <body>
          <h1>{error.status} {error.statusText}</h1>
          <p>{error.data}</p>
          <Scripts />
        </body>
      </html>
    );
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  return (
    <html>
      <head>
        <title>Error</title>
        <Meta />
        <Links />
      </head>
      <body>
        <h1>Something went wrong</h1>
        <p>{errorMessage}</p>
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

## Caching

```tsx
// app/routes/posts._index.tsx
import { json } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ context }: LoaderFunctionArgs) {
  const { DB } = context.cloudflare.env;

  const { results } = await DB.prepare('SELECT * FROM posts').all();

  return json(
    { posts: results },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    }
  );
}
```

## Streaming

```tsx
// app/routes/stream.tsx
import { defer } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Await, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';

export async function loader({ context }: LoaderFunctionArgs) {
  const { DB } = context.cloudflare.env;

  // Start slow query without awaiting
  const slowDataPromise = DB.prepare('SELECT * FROM analytics').all();

  // Fast data we can return immediately
  const fastData = await DB.prepare('SELECT * FROM users LIMIT 5').all();

  return defer({
    fastData: fastData.results,
    slowData: slowDataPromise.then(r => r.results),
  });
}

export default function StreamingPage() {
  const { fastData, slowData } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {fastData.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>

      <h2>Analytics</h2>
      <Suspense fallback={<p>Loading analytics...</p>}>
        <Await resolve={slowData} errorElement={<p>Error loading analytics</p>}>
          {(data) => (
            <ul>
              {data.map(item => <li key={item.id}>{item.metric}</li>)}
            </ul>
          )}
        </Await>
      </Suspense>
    </div>
  );
}
```

## Deployment

```bash
# Build
bun run build

# Deploy
bunx wrangler deploy

# Deploy with D1 migrations
bunx wrangler d1 migrations apply my-db --remote
bunx wrangler deploy
```

## Best Practices

1. **Type your context**: Define `Env` interface in `load-context.ts`
2. **Use resource routes for APIs**: Keep UI routes separate
3. **Validate in actions**: Always validate form data server-side
4. **Handle errors**: Use `ErrorBoundary` at route level
5. **Cache responses**: Set appropriate Cache-Control headers
6. **Defer slow data**: Use `defer` for non-critical data
7. **Progressive enhancement**: Forms work without JavaScript
