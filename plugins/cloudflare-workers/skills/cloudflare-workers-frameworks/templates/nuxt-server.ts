/**
 * Nuxt Server API Template for Cloudflare Workers
 *
 * Production-ready patterns for:
 * - Server API routes
 * - Cloudflare bindings access
 * - Error handling
 * - Validation
 *
 * Usage:
 * 1. Copy patterns to server/api/
 * 2. Configure nuxt.config.ts with cloudflare preset
 * 3. Set up wrangler.jsonc
 * 4. Run: bun run dev
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  ENVIRONMENT: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface CreateUserBody {
  name: string;
  email: string;
}

interface UpdateUserBody {
  name?: string;
  email?: string;
}

// ============================================
// CLOUDFLARE HELPER (server/utils/cloudflare.ts)
// ============================================

/*
// server/utils/cloudflare.ts
import { H3Event } from 'h3';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  ENVIRONMENT: string;
}

export function getCloudflare(event: H3Event): { env: Env; context: ExecutionContext } {
  return event.context.cloudflare as { env: Env; context: ExecutionContext };
}

export function getDB(event: H3Event): D1Database {
  return event.context.cloudflare.env.DB;
}

export function getKV(event: H3Event): KVNamespace {
  return event.context.cloudflare.env.KV;
}
*/

// ============================================
// GET USERS (server/api/users.get.ts)
// ============================================

/*
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare;

  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const [users, countResult] = await Promise.all([
    env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<User>(),
    env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>(),
  ]);

  const total = countResult?.count || 0;

  return {
    data: users.results,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
});
*/

// ============================================
// CREATE USER (server/api/users.post.ts)
// ============================================

/*
// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare;
  const body = await readBody<CreateUserBody>(event);

  // Validation
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Name is required',
    });
  }

  if (body.name.length > 100) {
    throw createError({
      statusCode: 400,
      message: 'Name must be less than 100 characters',
    });
  }

  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    throw createError({
      statusCode: 400,
      message: 'Valid email is required',
    });
  }

  // Check for existing email
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(body.email.toLowerCase())
    .first();

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Email already exists',
    });
  }

  // Create user
  const user = await env.DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
  )
    .bind(body.name.trim(), body.email.toLowerCase())
    .first<User>();

  setResponseStatus(event, 201);
  return user;
});
*/

// ============================================
// GET USER BY ID (server/api/users/[id].get.ts)
// ============================================

/*
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare;
  const id = getRouterParam(event, 'id');

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<User>();

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    });
  }

  return user;
});
*/

// ============================================
// UPDATE USER (server/api/users/[id].put.ts)
// ============================================

/*
// server/api/users/[id].put.ts
export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare;
  const id = getRouterParam(event, 'id');
  const body = await readBody<UpdateUserBody>(event);

  // Check if user exists
  const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<User>();

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    });
  }

  // Build update fields
  const updates: string[] = [];
  const values: any[] = [];

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid name',
      });
    }
    updates.push('name = ?');
    values.push(body.name.trim());
  }

  if (body.email !== undefined) {
    if (typeof body.email !== 'string' || !body.email.includes('@')) {
      throw createError({
        statusCode: 400,
        message: 'Invalid email',
      });
    }
    updates.push('email = ?');
    values.push(body.email.toLowerCase());
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id);

  const user = await env.DB.prepare(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ? RETURNING *`
  )
    .bind(...values)
    .first<User>();

  return user;
});
*/

// ============================================
// DELETE USER (server/api/users/[id].delete.ts)
// ============================================

/*
// server/api/users/[id].delete.ts
export default defineEventHandler(async (event) => {
  const { env } = event.context.cloudflare;
  const id = getRouterParam(event, 'id');

  const result = await env.DB.prepare('DELETE FROM users WHERE id = ?')
    .bind(id)
    .run();

  if (result.meta.changes === 0) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    });
  }

  setResponseStatus(event, 204);
  return null;
});
*/

// ============================================
// SERVER MIDDLEWARE (server/middleware/auth.ts)
// ============================================

/*
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

    try {
      const { env } = event.context.cloudflare;
      const user = await verifyToken(token, env);
      event.context.user = user;
    } catch {
      throw createError({
        statusCode: 401,
        message: 'Invalid token',
      });
    }
  }
});
*/

// ============================================
// CACHED EVENT HANDLER
// ============================================

/*
// server/api/cached-posts.get.ts
export default defineCachedEventHandler(
  async (event) => {
    const { env } = event.context.cloudflare;

    const { results } = await env.DB.prepare(
      'SELECT * FROM posts ORDER BY created_at DESC LIMIT 100'
    ).all();

    return results;
  },
  {
    maxAge: 60 * 60, // 1 hour
    staleMaxAge: 60 * 60 * 24, // 1 day stale-while-revalidate
    swr: true,
  }
);
*/

// ============================================
// VUE PAGE (pages/users/index.vue)
// ============================================

/*
<!-- pages/users/index.vue -->
<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
}

interface UsersResponse {
  data: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const { data, refresh } = await useFetch<UsersResponse>('/api/users')

const newUser = reactive({
  name: '',
  email: '',
})

const isCreating = ref(false)
const error = ref<string | null>(null)

async function createUser() {
  error.value = null
  isCreating.value = true

  try {
    await $fetch('/api/users', {
      method: 'POST',
      body: newUser,
    })

    newUser.name = ''
    newUser.email = ''
    await refresh()
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to create user'
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Users</h1>

    <div class="mb-6 p-4 border rounded">
      <h2 class="text-lg font-semibold mb-4">Create User</h2>

      <form @submit.prevent="createUser" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium">Name</label>
          <input
            v-model="newUser.name"
            type="text"
            id="name"
            class="mt-1 block w-full rounded border p-2"
            required
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium">Email</label>
          <input
            v-model="newUser.email"
            type="email"
            id="email"
            class="mt-1 block w-full rounded border p-2"
            required
          />
        </div>

        <p v-if="error" class="text-red-600">{{ error }}</p>

        <button
          type="submit"
          :disabled="isCreating"
          class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {{ isCreating ? 'Creating...' : 'Create User' }}
        </button>
      </form>
    </div>

    <div class="border rounded divide-y">
      <NuxtLink
        v-for="user in data?.data"
        :key="user.id"
        :to="`/users/${user.id}`"
        class="block p-4 hover:bg-gray-50"
      >
        <h3 class="font-medium">{{ user.name }}</h3>
        <p class="text-gray-600 text-sm">{{ user.email }}</p>
      </NuxtLink>
    </div>

    <p v-if="data?.data.length === 0" class="text-gray-500 text-center py-8">
      No users found
    </p>

    <div v-if="data?.pagination" class="mt-4 text-sm text-gray-600">
      Showing {{ data.data.length }} of {{ data.pagination.total }} users
    </div>
  </div>
</template>
*/

// ============================================
// VUE PAGE WITH COMPOSABLE (pages/users/[id].vue)
// ============================================

/*
<!-- pages/users/[id].vue -->
<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
}

const route = useRoute()

const { data: user, error: loadError } = await useFetch<User>(
  `/api/users/${route.params.id}`
)

if (loadError.value) {
  throw createError({
    statusCode: 404,
    message: 'User not found',
  })
}

const form = reactive({
  name: user.value?.name || '',
  email: user.value?.email || '',
})

const isUpdating = ref(false)
const isDeleting = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

async function updateUser() {
  error.value = null
  success.value = false
  isUpdating.value = true

  try {
    await $fetch(`/api/users/${route.params.id}`, {
      method: 'PUT',
      body: form,
    })
    success.value = true
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to update user'
  } finally {
    isUpdating.value = false
  }
}

async function deleteUser() {
  if (!confirm('Are you sure you want to delete this user?')) return

  isDeleting.value = true

  try {
    await $fetch(`/api/users/${route.params.id}`, {
      method: 'DELETE',
    })
    await navigateTo('/users')
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to delete user'
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <NuxtLink to="/users" class="text-blue-600 hover:underline mb-4 block">
      ← Back to Users
    </NuxtLink>

    <h1 class="text-2xl font-bold mb-6">{{ user?.name }}</h1>

    <div
      v-if="success"
      class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
    >
      User updated successfully!
    </div>

    <div
      v-if="error"
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
    >
      {{ error }}
    </div>

    <form @submit.prevent="updateUser" class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium">Name</label>
        <input
          v-model="form.name"
          type="text"
          id="name"
          class="mt-1 block w-full rounded border p-2"
          required
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <input
          v-model="form.email"
          type="email"
          id="email"
          class="mt-1 block w-full rounded border p-2"
          required
        />
      </div>

      <button
        type="submit"
        :disabled="isUpdating"
        class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {{ isUpdating ? 'Updating...' : 'Update' }}
      </button>
    </form>

    <hr class="my-8" />

    <button
      @click="deleteUser"
      :disabled="isDeleting"
      class="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
    >
      {{ isDeleting ? 'Deleting...' : 'Delete User' }}
    </button>
  </div>
</template>
*/

// ============================================
// NUXT CONFIG
// ============================================

/*
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-12-01',
  devtools: { enabled: true },

  nitro: {
    preset: 'cloudflare-module',
  },

  runtimeConfig: {
    // Private (server only)
    dbId: '',

    // Public (client + server)
    public: {
      environment: 'development',
    },
  },

  routeRules: {
    // Static pages
    '/': { prerender: true },
    '/about': { prerender: true },

    // SSR with caching
    '/users/**': { swr: 60 },

    // API caching
    '/api/cached/**': {
      headers: { 'Cache-Control': 'max-age=3600' },
    },
  },
});
*/

export {};
