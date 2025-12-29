/**
 * Next.js API Route Template for Cloudflare Workers (OpenNext)
 *
 * Production-ready patterns for:
 * - Server Components with data fetching
 * - API routes with full CRUD
 * - Server Actions
 * - Cloudflare bindings access
 *
 * Usage:
 * 1. Copy patterns to your app/ directory
 * 2. Install @opennextjs/cloudflare
 * 3. Configure open-next.config.ts
 * 4. Run: bun run dev
 */

// ============================================
// CLOUDFLARE HELPER (lib/cloudflare.ts)
// ============================================

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

export async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  return env.DB;
}

// ============================================
// TYPES
// ============================================

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================
// API ROUTE: app/api/users/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    const { DB } = await getEnv();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const [users, countResult] = await Promise.all([
      DB.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?')
        .bind(limit, offset)
        .all<User>(),
      DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>(),
    ]);

    const total = countResult?.count || 0;

    return NextResponse.json<PaginatedResponse<User>>({
      data: users.results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const { DB } = await getEnv();
    const body = await request.json();

    // Validation
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check for existing email
    const existing = await DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(body.email)
      .first();

    if (existing) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = await DB.prepare(
      'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
    )
      .bind(body.name.trim(), body.email.trim().toLowerCase())
      .first<User>();

    return NextResponse.json<ApiResponse<User>>(
      { data: user! },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// ============================================
// API ROUTE: app/api/users/[id]/route.ts
// ============================================

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/users/:id
export async function GET_BY_ID(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { DB } = await getEnv();

    const user = await DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<User>>({ data: user });
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/:id
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { DB } = await getEnv();
    const body = await request.json();

    // Check if user exists
    const existing = await DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();

    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build update
    const updates: { name?: string; email?: string } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json<ApiResponse<null>>(
          { error: 'Invalid name' },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }

    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || !body.email.includes('@')) {
        return NextResponse.json<ApiResponse<null>>(
          { error: 'Invalid email' },
          { status: 400 }
        );
      }
      updates.email = body.email.trim().toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse<User>>({ data: existing });
    }

    // Update
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    const user = await DB.prepare(
      `UPDATE users SET ${fields} WHERE id = ? RETURNING *`
    )
      .bind(...values)
      .first<User>();

    return NextResponse.json<ApiResponse<User>>({ data: user! });
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/:id
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { DB } = await getEnv();

    const result = await DB.prepare('DELETE FROM users WHERE id = ?')
      .bind(id)
      .run();

    if (result.meta.changes === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// ============================================
// SERVER COMPONENT: app/users/page.tsx
// ============================================

/*
// app/users/page.tsx
import { getEnv } from '@/lib/cloudflare';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
}

export const revalidate = 60; // ISR: Revalidate every 60 seconds

async function getUsers(): Promise<User[]> {
  const { DB } = await getEnv();
  const { results } = await DB.prepare(
    'SELECT * FROM users ORDER BY created_at DESC LIMIT 50'
  ).all<User>();
  return results;
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <Link
        href="/users/new"
        className="inline-block mb-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Add User
      </Link>

      <ul className="divide-y">
        {users.map((user) => (
          <li key={user.id} className="py-4">
            <Link href={`/users/${user.id}`} className="hover:underline">
              <h2 className="font-medium">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
*/

// ============================================
// SERVER ACTION: app/users/new/page.tsx
// ============================================

/*
// app/users/new/page.tsx
import { getEnv } from '@/lib/cloudflare';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function createUser(formData: FormData) {
  'use server';

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!name || !email) {
    throw new Error('Name and email required');
  }

  const { DB } = await getEnv();

  await DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
    .bind(name.trim(), email.trim().toLowerCase())
    .run();

  revalidatePath('/users');
  redirect('/users');
}

export default function NewUserPage() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create User</h1>

      <form action={createUser} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded border p-2"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full rounded border p-2"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded"
        >
          Create User
        </button>
      </form>
    </div>
  );
}
*/
