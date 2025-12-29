/**
 * Remix Loader/Action Template for Cloudflare Workers
 *
 * Production-ready patterns for:
 * - Data loading with loaders
 * - Form handling with actions
 * - Cloudflare bindings access
 * - Error handling
 * - Caching
 *
 * Usage:
 * 1. Copy patterns to your routes
 * 2. Configure load-context.ts
 * 3. Run: bun run dev
 */

// ============================================
// LOAD CONTEXT SETUP (load-context.ts)
// ============================================

/*
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

export function getLoadContext({
  context,
}: {
  context: { cloudflare: Cloudflare };
}) {
  return { cloudflare: context.cloudflare };
}
*/

// ============================================
// EXAMPLE ROUTE: users.$id.tsx
// ============================================

import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import {
  useLoaderData,
  useActionData,
  Form,
  useNavigation,
  isRouteErrorResponse,
  useRouteError,
} from '@remix-run/react';

// ============================================
// TYPES
// ============================================

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface LoaderData {
  user: User;
}

interface ActionData {
  success?: boolean;
  errors?: {
    name?: string;
    email?: string;
    form?: string;
  };
}

// ============================================
// META
// ============================================

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.user) {
    return [{ title: 'User Not Found' }];
  }
  return [
    { title: `${data.user.name} - Profile` },
    { name: 'description', content: `Profile page for ${data.user.name}` },
  ];
};

// ============================================
// LOADER
// ============================================

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { DB } = context.cloudflare.env;
  const { id } = params;

  const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<User>();

  if (!user) {
    throw new Response('User not found', {
      status: 404,
      statusText: 'Not Found',
    });
  }

  // Add caching headers
  return json<LoaderData>(
    { user },
    {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    }
  );
}

// ============================================
// ACTION
// ============================================

export async function action({ request, params, context }: ActionFunctionArgs) {
  const { DB } = context.cloudflare.env;
  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get('intent');

  // Handle different intents
  switch (intent) {
    case 'update': {
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;

      // Validation
      const errors: ActionData['errors'] = {};

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
        return json<ActionData>({ errors }, { status: 400 });
      }

      try {
        await DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
          .bind(name.trim(), email.trim(), id)
          .run();

        return json<ActionData>({ success: true });
      } catch (error) {
        console.error('Update error:', error);
        return json<ActionData>(
          { errors: { form: 'Failed to update user. Please try again.' } },
          { status: 500 }
        );
      }
    }

    case 'delete': {
      try {
        await DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
        return redirect('/users');
      } catch (error) {
        console.error('Delete error:', error);
        return json<ActionData>(
          { errors: { form: 'Failed to delete user. Please try again.' } },
          { status: 500 }
        );
      }
    }

    default: {
      return json<ActionData>(
        { errors: { form: 'Invalid action' } },
        { status: 400 }
      );
    }
  }
}

// ============================================
// COMPONENT
// ============================================

export default function UserProfile() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';
  const isUpdating =
    isSubmitting && navigation.formData?.get('intent') === 'update';
  const isDeleting =
    isSubmitting && navigation.formData?.get('intent') === 'delete';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{user.name}</h1>

      {actionData?.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Profile updated successfully!
        </div>
      )}

      {actionData?.errors?.form && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {actionData.errors.form}
        </div>
      )}

      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value="update" />

        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={user.name}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            disabled={isSubmitting}
          />
          {actionData?.errors?.name && (
            <p className="mt-1 text-sm text-red-600">{actionData.errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={user.email}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            disabled={isSubmitting}
          />
          {actionData?.errors?.email && (
            <p className="mt-1 text-sm text-red-600">
              {actionData.errors.email}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Form>

      <hr className="my-8" />

      <Form method="post">
        <input type="hidden" name="intent" value="delete" />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
          onClick={(e) => {
            if (!confirm('Are you sure you want to delete this user?')) {
              e.preventDefault();
            }
          }}
        >
          {isDeleting ? 'Deleting...' : 'Delete User'}
        </button>
      </Form>

      <div className="mt-8 text-sm text-gray-500">
        <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

// ============================================
// ERROR BOUNDARY
// ============================================

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          {error.status} {error.statusText}
        </h1>
        <p className="text-gray-600">{error.data}</p>
        <a href="/users" className="text-blue-600 hover:underline mt-4 block">
          ← Back to Users
        </a>
      </div>
    );
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
      <p className="text-gray-600">{errorMessage}</p>
      <a href="/users" className="text-blue-600 hover:underline mt-4 block">
        ← Back to Users
      </a>
    </div>
  );
}

// ============================================
// RESOURCE ROUTE EXAMPLE (api.users.ts)
// ============================================

/*
// app/routes/api.users.ts
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { DB } = context.cloudflare.env;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const { results } = await DB.prepare(
    'SELECT * FROM users LIMIT ? OFFSET ?'
  ).bind(limit, offset).all();

  return json(results);
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { DB } = context.cloudflare.env;

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const data = await request.json();

  const result = await DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
  ).bind(data.name, data.email).first();

  return json(result, { status: 201 });
}
*/
