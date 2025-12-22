// Basic Neon Postgres Queries
// Template for raw SQL queries using @neondatabase/serverless

import { neon } from '@neondatabase/serverless';

// Initialize connection (in Cloudflare Workers, get from env.DATABASE_URL)
const sql = neon(process.env.DATABASE_URL!);

// ============================================================================
// SELECT QUERIES
// ============================================================================

// Simple select
export async function getUser(id: number) {
  const users = await sql`
    SELECT id, name, email, created_at
    FROM users
    WHERE id = ${id}
  `;
  return users[0] || null;
}

// Select with multiple conditions
export async function searchUsers(searchTerm: string, limit: number = 10) {
  const users = await sql`
    SELECT id, name, email
    FROM users
    WHERE name ILIKE ${'%' + searchTerm + '%'}
       OR email ILIKE ${'%' + searchTerm + '%'}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return users;
}

// Select with join
export async function getPostsWithAuthors(userId?: number) {
  if (userId) {
    return await sql`
      SELECT
        posts.id,
        posts.title,
        posts.content,
        posts.created_at,
        users.name as author_name,
        users.email as author_email
      FROM posts
      INNER JOIN users ON posts.user_id = users.id
      WHERE posts.user_id = ${userId}
      ORDER BY posts.created_at DESC
    `;
  }

  return await sql`
    SELECT
      posts.id,
      posts.title,
      posts.content,
      posts.created_at,
      users.name as author_name,
      users.email as author_email
    FROM posts
    INNER JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
    LIMIT 50
  `;
}

// Aggregation query
export async function getUserStats(userId: number) {
  const stats = await sql`
    SELECT
      COUNT(*)::int as post_count,
      MAX(created_at) as last_post_at
    FROM posts
    WHERE user_id = ${userId}
  `;
  return stats[0];
}

// ============================================================================
// INSERT QUERIES
// ============================================================================

// Simple insert with RETURNING
export async function createUser(name: string, email: string) {
  const [user] = await sql`
    INSERT INTO users (name, email)
    VALUES (${name}, ${email})
    RETURNING id, name, email, created_at
  `;
  return user;
}

// Batch insert
export async function createUsers(users: Array<{ name: string; email: string }>) {
  // Note: For large batches, consider inserting in chunks
  const values = users.map((user) => [user.name, user.email]);

  const inserted = await sql`
    INSERT INTO users (name, email)
    SELECT * FROM UNNEST(
      ${values.map(v => v[0])}::text[],
      ${values.map(v => v[1])}::text[]
    )
    RETURNING id, name, email
  `;
  return inserted;
}

// ============================================================================
// UPDATE QUERIES
// ============================================================================

// Simple update
export async function updateUser(id: number, name: string, email: string) {
  const [updated] = await sql`
    UPDATE users
    SET name = ${name}, email = ${email}
    WHERE id = ${id}
    RETURNING id, name, email, created_at
  `;
  return updated || null;
}

// Partial update
export async function updateUserPartial(id: number, updates: { name?: string; email?: string }) {
  // Only update provided fields
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push(`name = $${values.length + 1}`);
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    setClauses.push(`email = $${values.length + 1}`);
    values.push(updates.email);
  }

  if (setClauses.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  // Note: Template literals don't support dynamic SET clauses well
  // Use Drizzle ORM for more complex partial updates
  const [updated] = await sql`
    UPDATE users
    SET ${sql(setClauses.join(', '))}
    WHERE id = ${id}
    RETURNING *
  `;
  return updated || null;
}

// ============================================================================
// DELETE QUERIES
// ============================================================================

// Simple delete
export async function deleteUser(id: number) {
  const [deleted] = await sql`
    DELETE FROM users
    WHERE id = ${id}
    RETURNING id
  `;
  return deleted ? true : false;
}

// Delete with condition
export async function deleteOldPosts(daysAgo: number) {
  const deleted = await sql`
    DELETE FROM posts
    WHERE created_at < NOW() - INTERVAL '${daysAgo} days'
    RETURNING id
  `;
  return deleted.length;
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

// Automatic transaction (recommended)
export async function transferCredits(fromUserId: number, toUserId: number, amount: number) {
  const result = await sql.transaction(async (tx) => {
    // Deduct from sender
    const [sender] = await tx`
      UPDATE accounts
      SET balance = balance - ${amount}
      WHERE user_id = ${fromUserId} AND balance >= ${amount}
      RETURNING *
    `;

    if (!sender) {
      throw new Error('Insufficient balance');
    }

    // Add to recipient
    const [recipient] = await tx`
      UPDATE accounts
      SET balance = balance + ${amount}
      WHERE user_id = ${toUserId}
      RETURNING *
    `;

    // Log transaction
    await tx`
      INSERT INTO transfers (from_user_id, to_user_id, amount)
      VALUES (${fromUserId}, ${toUserId}, ${amount})
    `;

    return { sender, recipient };
  });

  return result;
}

// ============================================================================
// PAGINATION
// ============================================================================

export async function getPaginatedPosts(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;

  // Get total count
  const [{ total }] = await sql`
    SELECT COUNT(*)::int as total FROM posts
  `;

  // Get page data
  const posts = await sql`
    SELECT id, title, content, user_id, created_at
    FROM posts
    ORDER BY created_at DESC
    LIMIT ${pageSize}
    OFFSET ${offset}
  `;

  return {
    posts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page * pageSize < total,
      hasPrev: page > 1
    }
  };
}

// ============================================================================
// FULL-TEXT SEARCH (Postgres-specific)
// ============================================================================

export async function searchPosts(query: string, limit: number = 10) {
  const posts = await sql`
    SELECT
      id,
      title,
      content,
      ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', ${query})) as rank
    FROM posts
    WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT ${limit}
  `;
  return posts;
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example: Cloudflare Worker
/*
import { neon } from '@neondatabase/serverless';

interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const sql = neon(env.DATABASE_URL);

    const url = new URL(request.url);

    if (url.pathname === '/users' && request.method === 'GET') {
      const users = await sql`SELECT * FROM users LIMIT 10`;
      return Response.json(users);
    }

    if (url.pathname === '/users' && request.method === 'POST') {
      const { name, email } = await request.json();
      const [user] = await sql`
        INSERT INTO users (name, email)
        VALUES (${name}, ${email})
        RETURNING *
      `;
      return Response.json(user, { status: 201 });
    }

    return new Response('Not Found', { status: 404 });
  }
};
*/

// Example: Next.js Server Action
/*
'use server';

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function getUsers() {
  const users = await sql`SELECT * FROM users ORDER BY created_at DESC`;
  return users;
}

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const [user] = await sql`
    INSERT INTO users (name, email)
    VALUES (${name}, ${email})
    RETURNING *
  `;

  revalidatePath('/users');
  return user;
}
*/
