/**
 * Qwik Route Template for Cloudflare Workers
 *
 * Production-ready patterns for:
 * - Route loaders
 * - Route actions with validation
 * - API endpoints
 * - Cloudflare bindings
 *
 * Usage:
 * 1. Copy patterns to src/routes/
 * 2. Configure for Cloudflare Pages
 * 3. Set up wrangler.jsonc
 * 4. Run: bun run dev
 */

import { component$, useSignal } from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  zod$,
  z,
  Form,
  type RequestHandler,
} from '@builder.io/qwik-city';

// ============================================
// TYPE DEFINITIONS
// ============================================

/*
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
*/

// ============================================
// INTERFACES
// ============================================

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// ROUTE LOADERS
// ============================================

// Load users list
export const useUsers = routeLoader$<PaginatedUsers>(async ({ platform, url }) => {
  const { DB } = platform.env;

  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  const [usersResult, countResult] = await Promise.all([
    DB.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<User>(),
    DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>(),
  ]);

  return {
    users: usersResult.results,
    total: countResult?.count || 0,
    page,
    limit,
  };
});

// Load single user
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

// ============================================
// ROUTE ACTIONS
// ============================================

// Create user action with Zod validation
export const useCreateUser = routeAction$(
  async (data, { platform, redirect }) => {
    const { DB } = platform.env;

    // Check for existing email
    const existing = await DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(data.email.toLowerCase())
      .first();

    if (existing) {
      return {
        success: false,
        error: 'Email already exists',
      };
    }

    // Create user
    const user = await DB.prepare(
      'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
    )
      .bind(data.name.trim(), data.email.toLowerCase())
      .first<User>();

    throw redirect(303, `/users/${user!.id}`);
  },
  zod$({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().email('Invalid email address'),
  })
);

// Update user action
export const useUpdateUser = routeAction$(
  async (data, { params, platform }) => {
    const { DB } = platform.env;

    await DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
      .bind(data.name.trim(), data.email.toLowerCase(), params.id)
      .run();

    return { success: true };
  },
  zod$({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().email('Invalid email address'),
  })
);

// Delete user action
export const useDeleteUser = routeAction$(async (_, { params, platform, redirect }) => {
  const { DB } = platform.env;

  await DB.prepare('DELETE FROM users WHERE id = ?').bind(params.id).run();

  throw redirect(303, '/users');
});

// ============================================
// USERS LIST PAGE COMPONENT
// ============================================

export const UsersListPage = component$(() => {
  const users = useUsers();
  const createAction = useCreateUser();

  const showForm = useSignal(false);

  return (
    <div class="max-w-4xl mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Users</h1>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded"
          onClick$={() => (showForm.value = !showForm.value)}
        >
          {showForm.value ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showForm.value && (
        <div class="mb-6 p-4 border rounded">
          <h2 class="text-lg font-semibold mb-4">Create User</h2>

          <Form action={createAction} class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                class="mt-1 block w-full rounded border p-2"
                required
              />
              {createAction.value?.fieldErrors?.name && (
                <p class="text-red-600 text-sm mt-1">
                  {createAction.value.fieldErrors.name.join(', ')}
                </p>
              )}
            </div>

            <div>
              <label for="email" class="block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                class="mt-1 block w-full rounded border p-2"
                required
              />
              {createAction.value?.fieldErrors?.email && (
                <p class="text-red-600 text-sm mt-1">
                  {createAction.value.fieldErrors.email.join(', ')}
                </p>
              )}
            </div>

            {createAction.value?.error && (
              <p class="text-red-600">{createAction.value.error}</p>
            )}

            <button
              type="submit"
              class="px-4 py-2 bg-green-600 text-white rounded"
            >
              Create
            </button>
          </Form>
        </div>
      )}

      <div class="border rounded divide-y">
        {users.value.users.map((user) => (
          <a
            key={user.id}
            href={`/users/${user.id}`}
            class="block p-4 hover:bg-gray-50"
          >
            <h3 class="font-medium">{user.name}</h3>
            <p class="text-gray-600 text-sm">{user.email}</p>
          </a>
        ))}
      </div>

      {users.value.users.length === 0 && (
        <p class="text-gray-500 text-center py-8">No users found</p>
      )}

      <div class="mt-6 flex justify-between text-sm">
        <span>
          Showing {users.value.users.length} of {users.value.total}
        </span>
        <div class="space-x-2">
          {users.value.page > 1 && (
            <a
              href={`?page=${users.value.page - 1}`}
              class="text-blue-600 hover:underline"
            >
              Previous
            </a>
          )}
          {users.value.page * users.value.limit < users.value.total && (
            <a
              href={`?page=${users.value.page + 1}`}
              class="text-blue-600 hover:underline"
            >
              Next
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================
// USER DETAIL PAGE COMPONENT
// ============================================

export const UserDetailPage = component$(() => {
  const user = useUser();
  const updateAction = useUpdateUser();
  const deleteAction = useDeleteUser();

  if (!user.value) {
    return (
      <div class="max-w-2xl mx-auto p-6">
        <h1 class="text-2xl font-bold text-red-600">User Not Found</h1>
        <a href="/users" class="text-blue-600 hover:underline">
          ← Back to Users
        </a>
      </div>
    );
  }

  return (
    <div class="max-w-2xl mx-auto p-6">
      <a href="/users" class="text-blue-600 hover:underline mb-4 block">
        ← Back to Users
      </a>

      <h1 class="text-2xl font-bold mb-6">{user.value.name}</h1>

      {updateAction.value?.success && (
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          User updated successfully!
        </div>
      )}

      <Form action={updateAction} class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={user.value.name}
            class="mt-1 block w-full rounded border p-2"
            required
          />
          {updateAction.value?.fieldErrors?.name && (
            <p class="text-red-600 text-sm mt-1">
              {updateAction.value.fieldErrors.name.join(', ')}
            </p>
          )}
        </div>

        <div>
          <label for="email" class="block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={user.value.email}
            class="mt-1 block w-full rounded border p-2"
            required
          />
          {updateAction.value?.fieldErrors?.email && (
            <p class="text-red-600 text-sm mt-1">
              {updateAction.value.fieldErrors.email.join(', ')}
            </p>
          )}
        </div>

        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Update
        </button>
      </Form>

      <hr class="my-8" />

      <Form action={deleteAction}>
        <button
          type="submit"
          class="px-4 py-2 bg-red-600 text-white rounded"
          onClick$={(e) => {
            if (!confirm('Are you sure you want to delete this user?')) {
              e.preventDefault();
            }
          }}
        >
          Delete User
        </button>
      </Form>

      <div class="mt-8 text-sm text-gray-500">
        <p>Created: {new Date(user.value.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
});

// ============================================
// API ENDPOINTS
// ============================================

/*
// src/routes/api/users/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ platform, json, url }) => {
  const { DB } = platform.env;

  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const { results } = await DB.prepare(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all();

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
*/

/*
// src/routes/api/users/[id]/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ params, platform, json, status }) => {
  const { DB } = platform.env;

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(params.id)
    .first();

  if (!user) {
    status(404);
    json(404, { error: 'User not found' });
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
*/

export default UsersListPage;
