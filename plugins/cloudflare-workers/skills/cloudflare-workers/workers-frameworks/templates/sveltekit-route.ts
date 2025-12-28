/**
 * SvelteKit Route Template for Cloudflare Workers
 *
 * Production-ready patterns for:
 * - Server load functions
 * - Form actions
 * - API endpoints
 * - Cloudflare bindings
 *
 * Usage:
 * 1. Copy patterns to src/routes/
 * 2. Configure svelte.config.js with cloudflare adapter
 * 3. Set up wrangler.jsonc
 * 4. Run: bun run dev
 */

// ============================================
// TYPE DEFINITIONS (src/app.d.ts)
// ============================================

/*
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
*/

// ============================================
// SERVER LOAD FUNCTION (+page.server.ts)
// ============================================

import type { PageServerLoad, Actions } from './$types';
import { error, redirect, fail } from '@sveltejs/kit';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

// Load function - runs on server
export const load: PageServerLoad = async ({ params, platform, setHeaders }) => {
  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const { DB } = platform.env;

  // If we have an ID parameter, load single user
  if (params.id) {
    const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(params.id)
      .first<User>();

    if (!user) {
      throw error(404, 'User not found');
    }

    // Set caching headers
    setHeaders({
      'Cache-Control': 'private, max-age=60',
    });

    return { user };
  }

  // Otherwise load user list
  const { results: users } = await DB.prepare(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT 50'
  ).all<User>();

  setHeaders({
    'Cache-Control': 'private, max-age=30',
  });

  return { users };
};

// ============================================
// FORM ACTIONS (+page.server.ts)
// ============================================

export const actions: Actions = {
  // Create user action
  create: async ({ request, platform }) => {
    if (!platform?.env) {
      return fail(500, { error: 'Platform not available' });
    }

    const { DB } = platform.env;
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    // Validation
    const errors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }

    if (!email || email.trim().length === 0) {
      errors.email = 'Email is required';
    } else if (!email.includes('@')) {
      errors.email = 'Invalid email address';
    }

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, values: { name, email } });
    }

    try {
      // Check for existing email
      const existing = await DB.prepare('SELECT id FROM users WHERE email = ?')
        .bind(email.trim().toLowerCase())
        .first();

      if (existing) {
        return fail(409, {
          errors: { email: 'Email already exists' },
          values: { name, email },
        });
      }

      // Create user
      const user = await DB.prepare(
        'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
      )
        .bind(name.trim(), email.trim().toLowerCase())
        .first<User>();

      return { success: true, user };
    } catch (e) {
      console.error('Create user error:', e);
      return fail(500, { error: 'Failed to create user' });
    }
  },

  // Update user action
  update: async ({ request, params, platform }) => {
    if (!platform?.env) {
      return fail(500, { error: 'Platform not available' });
    }

    const { DB } = platform.env;
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    // Validation
    const errors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      errors.name = 'Name is required';
    }

    if (!email || !email.includes('@')) {
      errors.email = 'Valid email is required';
    }

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors });
    }

    try {
      await DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
        .bind(name.trim(), email.trim().toLowerCase(), params.id)
        .run();

      return { success: true };
    } catch (e) {
      console.error('Update user error:', e);
      return fail(500, { error: 'Failed to update user' });
    }
  },

  // Delete user action
  delete: async ({ params, platform }) => {
    if (!platform?.env) {
      return fail(500, { error: 'Platform not available' });
    }

    const { DB } = platform.env;

    try {
      await DB.prepare('DELETE FROM users WHERE id = ?').bind(params.id).run();

      throw redirect(303, '/users');
    } catch (e) {
      if (e instanceof Response) throw e; // Re-throw redirect
      console.error('Delete user error:', e);
      return fail(500, { error: 'Failed to delete user' });
    }
  },
};

// ============================================
// API ENDPOINT (+server.ts)
// ============================================

/*
// src/routes/api/users/+server.ts
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

interface User {
  id: number;
  name: string;
  email: string;
}

export const GET: RequestHandler = async ({ platform, url }) => {
  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const { DB } = platform.env;

  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const { results } = await DB.prepare(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all<User>();

  return json(results);
};

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const { DB } = platform.env;
  const data = await request.json();

  if (!data.name || !data.email) {
    throw error(400, 'Name and email required');
  }

  const result = await DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
  )
    .bind(data.name, data.email)
    .first<User>();

  return json(result, { status: 201 });
};
*/

// ============================================
// API ENDPOINT WITH ID (+server.ts)
// ============================================

/*
// src/routes/api/users/[id]/+server.ts
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, platform }) => {
  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const { DB } = platform.env;

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(params.id)
    .first();

  if (!user) {
    throw error(404, 'User not found');
  }

  return json(user);
};

export const PUT: RequestHandler = async ({ params, request, platform }) => {
  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const { DB } = platform.env;
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
  if (!platform?.env) {
    throw error(500, 'Platform not available');
  }

  const { DB } = platform.env;

  await DB.prepare('DELETE FROM users WHERE id = ?').bind(params.id).run();

  return new Response(null, { status: 204 });
};
*/

// ============================================
// SVELTE COMPONENT (+page.svelte)
// ============================================

/*
<!-- src/routes/users/[id]/+page.svelte -->
<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;

  $: user = data.user;
</script>

<svelte:head>
  <title>{user.name} | Users</title>
</svelte:head>

<div class="max-w-2xl mx-auto p-6">
  <h1 class="text-2xl font-bold mb-6">{user.name}</h1>

  {#if form?.success}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      User updated successfully!
    </div>
  {/if}

  {#if form?.error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {form.error}
    </div>
  {/if}

  <form method="POST" action="?/update" use:enhance class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium">Name</label>
      <input
        type="text"
        id="name"
        name="name"
        value={user.name}
        class="mt-1 block w-full rounded border p-2"
        required
      />
      {#if form?.errors?.name}
        <p class="text-red-600 text-sm mt-1">{form.errors.name}</p>
      {/if}
    </div>

    <div>
      <label for="email" class="block text-sm font-medium">Email</label>
      <input
        type="email"
        id="email"
        name="email"
        value={user.email}
        class="mt-1 block w-full rounded border p-2"
        required
      />
      {#if form?.errors?.email}
        <p class="text-red-600 text-sm mt-1">{form.errors.email}</p>
      {/if}
    </div>

    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">
      Update
    </button>
  </form>

  <hr class="my-8" />

  <form
    method="POST"
    action="?/delete"
    use:enhance={() => {
      return async ({ update }) => {
        if (confirm('Are you sure you want to delete this user?')) {
          await update();
        }
      };
    }}
  >
    <button type="submit" class="px-4 py-2 bg-red-600 text-white rounded">
      Delete User
    </button>
  </form>
</div>
*/

// ============================================
// SVELTE CONFIG
// ============================================

/*
// svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

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
*/
