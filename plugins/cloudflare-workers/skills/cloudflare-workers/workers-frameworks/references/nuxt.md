# Nuxt on Cloudflare Workers

Vue 3 full-stack framework with Nitro engine for edge deployment.

## Why Nuxt on Workers?

- **Vue 3 Composition API**: Modern Vue patterns
- **Nitro Engine**: Universal deployment
- **Auto-imports**: Zero configuration imports
- **File-based Routing**: Intuitive structure
- **Server Routes**: Built-in API layer
- **Hybrid Rendering**: SSR, SSG, ISR per-route

## New Project Setup

```bash
# Create new Nuxt project
bunx nuxi@latest init my-app

# Configure for Cloudflare
cd my-app

# nuxt.config.ts already supports Cloudflare via Nitro
```

## Project Structure

```
my-app/
├── server/
│   ├── api/
│   │   ├── users.get.ts      # GET /api/users
│   │   ├── users.post.ts     # POST /api/users
│   │   └── users/
│   │       └── [id].ts       # /api/users/:id
│   ├── routes/
│   │   └── health.ts         # /health
│   ├── middleware/
│   │   └── auth.ts
│   └── utils/
│       └── db.ts
├── pages/
│   ├── index.vue             # Home page
│   ├── about.vue             # /about
│   └── users/
│       ├── index.vue         # /users
│       └── [id].vue          # /users/:id
├── components/
├── composables/
├── layouts/
├── nuxt.config.ts
├── wrangler.jsonc
└── package.json
```

## Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-12-01',
  devtools: { enabled: true },

  nitro: {
    preset: 'cloudflare-module',

    // Enable Cloudflare features
    cloudflare: {
      pages: {
        routes: {
          exclude: ['/api/_*'],
        },
      },
    },
  },

  // Environment variables
  runtimeConfig: {
    // Private (server only)
    dbId: '',

    // Public (client + server)
    public: {
      environment: 'development',
    },
  },
});
```

```jsonc
// wrangler.jsonc
{
  "name": "nuxt-app",
  "main": ".output/server/index.mjs",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".output/public"
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
// server/utils/cloudflare.ts
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  ENVIRONMENT: string;
}

export function useCloudflare(event: H3Event) {
  return event.context.cloudflare as {
    env: Env;
    context: ExecutionContext;
  };
}
```

## Server API Routes

```typescript
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare;

  const { results } = await env.DB.prepare(
    'SELECT * FROM users'
  ).all();

  return results;
});
```

```typescript
// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare;
  const body = await readBody(event);

  if (!body.name || !body.email) {
    throw createError({
      statusCode: 400,
      message: 'Name and email required',
    });
  }

  const result = await env.DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
  )
    .bind(body.name, body.email)
    .first();

  setResponseStatus(event, 201);
  return result;
});
```

```typescript
// server/api/users/[id].ts
export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare;
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (method === 'GET') {
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first();

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      });
    }

    return user;
  }

  if (method === 'PUT') {
    const body = await readBody(event);

    await env.DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
      .bind(body.name, body.email, id)
      .run();

    return env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first();
  }

  if (method === 'DELETE') {
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    setResponseStatus(event, 204);
    return null;
  }

  throw createError({
    statusCode: 405,
    message: 'Method not allowed',
  });
});
```

## Server Middleware

```typescript
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  // Skip for public routes
  if (event.path.startsWith('/api/public')) {
    return;
  }

  // Check auth for protected routes
  if (event.path.startsWith('/api/admin')) {
    const token = getHeader(event, 'Authorization');

    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }

    // Verify token
    try {
      const user = await verifyToken(token, event.context.cloudflare.env);
      event.context.user = user;
    } catch {
      throw createError({
        statusCode: 401,
        message: 'Invalid token',
      });
    }
  }
});
```

## Pages with Data Fetching

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
interface Post {
  id: number
  title: string
  content: string
}

const { data: posts } = await useFetch<Post[]>('/api/posts')
</script>

<template>
  <div>
    <h1>Latest Posts</h1>
    <ul>
      <li v-for="post in posts" :key="post.id">
        <NuxtLink :to="`/posts/${post.id}`">{{ post.title }}</NuxtLink>
      </li>
    </ul>
  </div>
</template>
```

```vue
<!-- pages/users/[id].vue -->
<script setup lang="ts">
const route = useRoute()

interface User {
  id: number
  name: string
  email: string
}

const { data: user, error } = await useFetch<User>(`/api/users/${route.params.id}`)

if (error.value) {
  throw createError({
    statusCode: 404,
    message: 'User not found'
  })
}

const form = reactive({
  name: user.value?.name || '',
  email: user.value?.email || ''
})

async function updateUser() {
  await $fetch(`/api/users/${route.params.id}`, {
    method: 'PUT',
    body: form
  })

  refreshNuxtData()
}

async function deleteUser() {
  await $fetch(`/api/users/${route.params.id}`, {
    method: 'DELETE'
  })

  navigateTo('/users')
}
</script>

<template>
  <div v-if="user">
    <h1>{{ user.name }}</h1>

    <form @submit.prevent="updateUser">
      <div>
        <label>Name:</label>
        <input v-model="form.name" />
      </div>

      <div>
        <label>Email:</label>
        <input v-model="form.email" type="email" />
      </div>

      <button type="submit">Update</button>
    </form>

    <button @click="deleteUser">Delete</button>
  </div>
</template>
```

## Composables

```typescript
// composables/useUsers.ts
interface User {
  id: number
  name: string
  email: string
}

export function useUsers() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchUsers() {
    loading.value = true
    try {
      users.value = await $fetch<User[]>('/api/users')
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  async function createUser(data: { name: string; email: string }) {
    const user = await $fetch<User>('/api/users', {
      method: 'POST',
      body: data
    })
    users.value.push(user)
    return user
  }

  return {
    users: readonly(users),
    loading: readonly(loading),
    error: readonly(error),
    fetchUsers,
    createUser
  }
}
```

## Layouts

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <header>
      <nav>
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/about">About</NuxtLink>
        <NuxtLink to="/users">Users</NuxtLink>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer>
      <p>Built with Nuxt on Cloudflare Workers</p>
    </footer>
  </div>
</template>
```

```vue
<!-- pages/admin.vue -->
<script setup>
definePageMeta({
  layout: 'admin'
})
</script>

<template>
  <div>Admin page</div>
</template>
```

## Hybrid Rendering

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Static at build time
    '/': { prerender: true },
    '/about': { prerender: true },

    // SSR with caching
    '/posts/**': { swr: 3600 },

    // SSR no caching
    '/admin/**': { ssr: true },

    // Client-side only
    '/dashboard/**': { ssr: false },

    // ISR
    '/blog/**': { isr: 60 },
  },
});
```

## Caching

```typescript
// server/api/cached.get.ts
export default defineCachedEventHandler(async (event) => {
  const { env } = event.context.cloudflare;

  const { results } = await env.DB.prepare('SELECT * FROM posts').all();

  return results;
}, {
  maxAge: 3600, // 1 hour
  staleMaxAge: 86400, // 1 day stale-while-revalidate
  swr: true,
});
```

## Environment Variables

```typescript
// Access in server
export default defineEventHandler((event) => {
  const config = useRuntimeConfig();

  // Private
  const dbId = config.dbId;

  // Public
  const env = config.public.environment;

  // Cloudflare bindings
  const { DB, KV } = event.context.cloudflare.env;
});
```

```vue
<!-- Access in client -->
<script setup>
const config = useRuntimeConfig()

// Only public available
console.log(config.public.environment)
</script>
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

1. **Use Composables**: Extract reusable logic
2. **Type Cloudflare**: Define `Env` interface
3. **Route Rules**: Configure rendering per-route
4. **Cached Handlers**: Use for expensive queries
5. **Server Utils**: Share database helpers
6. **Auto-imports**: Leverage Nuxt auto-imports
