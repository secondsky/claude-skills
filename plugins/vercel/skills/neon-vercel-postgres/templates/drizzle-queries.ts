// Drizzle ORM Query Patterns for Neon Postgres
// Type-safe queries with full TypeScript support

import { db } from './db';  // Assuming you have db/index.ts set up
import { users, posts, comments } from './db/schema';  // Assuming you have db/schema.ts
import { eq, and, or, gt, lt, gte, lte, like, inArray, isNull, isNotNull, desc, asc } from 'drizzle-orm';

// ============================================================================
// SELECT QUERIES
// ============================================================================

// Simple select all
export async function getAllUsers() {
  const allUsers = await db.select().from(users);
  return allUsers;
}

// Select specific columns
export async function getUserEmails() {
  const emails = await db
    .select({
      id: users.id,
      email: users.email
    })
    .from(users);
  return emails;
}

// Select with WHERE clause
export async function getUserById(id: number) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));

  return user || null;
}

// Select with multiple conditions (AND)
export async function getActiveUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, email),
        eq(users.active, true)
      )
    );

  return user || null;
}

// Select with OR conditions
export async function searchUsers(searchTerm: string) {
  const results = await db
    .select()
    .from(users)
    .where(
      or(
        like(users.name, `%${searchTerm}%`),
        like(users.email, `%${searchTerm}%`)
      )
    );

  return results;
}

// Select with comparison operators
export async function getRecentPosts(daysAgo: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  const recentPosts = await db
    .select()
    .from(posts)
    .where(gte(posts.createdAt, cutoffDate))
    .orderBy(desc(posts.createdAt));

  return recentPosts;
}

// Select with IN clause
export async function getUsersByIds(ids: number[]) {
  const selectedUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, ids));

  return selectedUsers;
}

// Select with NULL checks
export async function getUsersWithoutAvatar() {
  const usersNoAvatar = await db
    .select()
    .from(users)
    .where(isNull(users.avatarUrl));

  return usersNoAvatar;
}

// ============================================================================
// JOINS
// ============================================================================

// Inner join
export async function getPostsWithAuthors() {
  const postsWithAuthors = await db
    .select({
      postId: posts.id,
      postTitle: posts.title,
      postContent: posts.content,
      authorId: users.id,
      authorName: users.name,
      authorEmail: users.email
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt));

  return postsWithAuthors;
}

// Left join (get all posts, even without authors)
export async function getAllPostsWithOptionalAuthors() {
  const allPosts = await db
    .select({
      postId: posts.id,
      postTitle: posts.title,
      authorName: users.name  // Will be null if no author
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id));

  return allPosts;
}

// Multiple joins
export async function getPostsWithAuthorsAndComments() {
  const data = await db
    .select({
      postId: posts.id,
      postTitle: posts.title,
      authorName: users.name,
      commentCount: comments.id  // Will need aggregation for actual count
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .leftJoin(comments, eq(comments.postId, posts.id));

  return data;
}

// ============================================================================
// INSERT QUERIES
// ============================================================================

// Simple insert
export async function createUser(name: string, email: string) {
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email
    })
    .returning();

  return newUser;
}

// Insert multiple rows
export async function createMultipleUsers(userData: Array<{ name: string; email: string }>) {
  const newUsers = await db
    .insert(users)
    .values(userData)
    .returning();

  return newUsers;
}

// Insert with default values
export async function createPost(userId: number, title: string, content: string) {
  const [newPost] = await db
    .insert(posts)
    .values({
      userId,
      title,
      content
      // createdAt will use default NOW()
    })
    .returning();

  return newPost;
}

// ============================================================================
// UPDATE QUERIES
// ============================================================================

// Simple update
export async function updateUserName(id: number, newName: string) {
  const [updated] = await db
    .update(users)
    .set({ name: newName })
    .where(eq(users.id, id))
    .returning();

  return updated || null;
}

// Update multiple fields
export async function updateUser(id: number, updates: { name?: string; email?: string; avatarUrl?: string }) {
  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning();

  return updated || null;
}

// Conditional update
export async function publishPost(postId: number, userId: number) {
  // Only allow user to publish their own post
  const [published] = await db
    .update(posts)
    .set({ published: true, publishedAt: new Date() })
    .where(
      and(
        eq(posts.id, postId),
        eq(posts.userId, userId)
      )
    )
    .returning();

  return published || null;
}

// ============================================================================
// DELETE QUERIES
// ============================================================================

// Simple delete
export async function deleteUser(id: number) {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });

  return deleted ? true : false;
}

// Conditional delete
export async function deleteOldPosts(daysAgo: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  const deleted = await db
    .delete(posts)
    .where(lt(posts.createdAt, cutoffDate))
    .returning({ id: posts.id });

  return deleted.length;
}

// Delete with complex conditions
export async function deleteUnpublishedDrafts(userId: number, daysOld: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const deleted = await db
    .delete(posts)
    .where(
      and(
        eq(posts.userId, userId),
        eq(posts.published, false),
        lt(posts.createdAt, cutoffDate)
      )
    )
    .returning({ id: posts.id });

  return deleted;
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

// Transaction example: Transfer credits between users
export async function transferCredits(fromUserId: number, toUserId: number, amount: number) {
  const result = await db.transaction(async (tx) => {
    // Get sender's balance
    const [sender] = await tx
      .select()
      .from(users)
      .where(eq(users.id, fromUserId))
      .for('update');  // Lock row

    if (!sender || sender.credits < amount) {
      throw new Error('Insufficient credits');
    }

    // Deduct from sender
    const [updatedSender] = await tx
      .update(users)
      .set({ credits: sender.credits - amount })
      .where(eq(users.id, fromUserId))
      .returning();

    // Add to recipient
    const [updatedRecipient] = await tx
      .update(users)
      .set({ credits: tx.sql`${users.credits} + ${amount}` })
      .where(eq(users.id, toUserId))
      .returning();

    // Log transaction
    await tx.insert(creditTransfers).values({
      fromUserId,
      toUserId,
      amount
    });

    return { sender: updatedSender, recipient: updatedRecipient };
  });

  return result;
}

// Transaction with rollback
export async function createUserWithProfile(userData: {
  name: string;
  email: string;
  bio?: string;
}) {
  try {
    const result = await db.transaction(async (tx) => {
      // Create user
      const [user] = await tx
        .insert(users)
        .values({
          name: userData.name,
          email: userData.email
        })
        .returning();

      // Create profile
      const [profile] = await tx
        .insert(profiles)
        .values({
          userId: user.id,
          bio: userData.bio || ''
        })
        .returning();

      return { user, profile };
    });

    return result;
  } catch (error) {
    // Transaction automatically rolls back on error
    console.error('Failed to create user with profile:', error);
    throw error;
  }
}

// ============================================================================
// AGGREGATIONS
// ============================================================================

// Count
export async function countUsers() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  return count;
}

// Group by
export async function getPostCountByUser() {
  const counts = await db
    .select({
      userId: posts.userId,
      userName: users.name,
      postCount: sql<number>`count(${posts.id})`
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .groupBy(posts.userId, users.name);

  return counts;
}

// Having clause
export async function getUsersWithMultiplePosts(minPosts: number) {
  const users = await db
    .select({
      userId: posts.userId,
      userName: users.name,
      postCount: sql<number>`count(${posts.id})`
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .groupBy(posts.userId, users.name)
    .having(sql`count(${posts.id}) >= ${minPosts}`);

  return users;
}

// ============================================================================
// PAGINATION
// ============================================================================

export async function getPaginatedPosts(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;

  // Get total count
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(posts);

  // Get page data
  const postsData = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    posts: postsData,
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
// ADVANCED QUERIES
// ============================================================================

// Subquery
export async function getUsersWithNoPosts() {
  const usersWithoutPosts = await db
    .select()
    .from(users)
    .where(
      sql`${users.id} NOT IN (SELECT DISTINCT user_id FROM posts)`
    );

  return usersWithoutPosts;
}

// Raw SQL with Drizzle (when needed)
export async function customQuery(userId: number) {
  const result = await db.execute(
    sql`
      SELECT u.*, COUNT(p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON p.user_id = u.id
      WHERE u.id = ${userId}
      GROUP BY u.id
    `
  );

  return result.rows[0];
}

// Prepared statement (performance optimization)
const getUserByEmailPrepared = db
  .select()
  .from(users)
  .where(eq(users.email, sql.placeholder('email')))
  .prepare('get_user_by_email');

export async function getUserByEmail(email: string) {
  const [user] = await getUserByEmailPrepared.execute({ email });
  return user || null;
}

// ============================================================================
// USAGE EXAMPLE: Cloudflare Worker with Drizzle
// ============================================================================

/*
// db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

export function getDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

// src/index.ts
import { getDb } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const db = getDb(env.DATABASE_URL);

    const url = new URL(request.url);

    if (url.pathname === '/users' && request.method === 'GET') {
      const allUsers = await db.select().from(users);
      return Response.json(allUsers);
    }

    if (url.pathname.startsWith('/users/') && request.method === 'GET') {
      const id = parseInt(url.pathname.split('/')[2]);
      const [user] = await db.select().from(users).where(eq(users.id, id));

      if (!user) {
        return new Response('User not found', { status: 404 });
      }

      return Response.json(user);
    }

    if (url.pathname === '/users' && request.method === 'POST') {
      const { name, email } = await request.json();
      const [user] = await db.insert(users).values({ name, email }).returning();
      return Response.json(user, { status: 201 });
    }

    return new Response('Not Found', { status: 404 });
  }
};
*/
