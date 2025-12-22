/**
 * Complete Drizzle Schema Template for Neon/Vercel Postgres
 *
 * Usage:
 *   1. Copy this file to your project: cp assets/drizzle-schema.ts db/schema.ts
 *   2. Customize tables to match your app's data model
 *   3. Generate migrations: npx drizzle-kit generate
 *   4. Apply migrations: npx drizzle-kit migrate
 */

import { pgTable, serial, text, timestamp, integer, boolean, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Indexes for common queries
  emailIdx: index('users_email_idx').on(table.email),
}));

// ============================================================================
// POSTS TABLE
// ============================================================================

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  slug: text('slug').notNull().unique(),
  metadata: jsonb('metadata').$type<{
    views?: number;
    likes?: number;
    tags?: string[];
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Indexes for common queries
  userIdIdx: index('posts_user_id_idx').on(table.userId),
  slugIdx: index('posts_slug_idx').on(table.slug),
  publishedIdx: index('posts_published_idx').on(table.published),
}));

// ============================================================================
// COMMENTS TABLE
// ============================================================================

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Indexes for common queries
  postIdIdx: index('comments_post_id_idx').on(table.postId),
  userIdIdx: index('comments_user_id_idx').on(table.userId),
}));

// ============================================================================
// RELATIONS (for Drizzle query API)
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS (for TypeScript)
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * db/index.ts:
 *
 * import { drizzle } from 'drizzle-orm/neon-http';
 * import { neon } from '@neondatabase/serverless';
 * import * as schema from './schema';
 *
 * const sql = neon(process.env.DATABASE_URL!);
 * export const db = drizzle(sql, { schema });
 */

/**
 * drizzle.config.ts:
 *
 * import { defineConfig } from 'drizzle-kit';
 *
 * export default defineConfig({
 *   schema: './db/schema.ts',
 *   out: './db/migrations',
 *   dialect: 'postgresql',
 *   dbCredentials: {
 *     url: process.env.DATABASE_URL!
 *   }
 * });
 */

/**
 * Query Examples:
 *
 * // SELECT with joins
 * const postsWithAuthors = await db.query.posts.findMany({
 *   with: {
 *     author: true,
 *     comments: {
 *       with: {
 *         author: true
 *       }
 *     }
 *   }
 * });
 *
 * // INSERT
 * const newUser = await db.insert(users).values({
 *   email: 'alice@example.com',
 *   name: 'Alice'
 * }).returning();
 *
 * // UPDATE
 * await db.update(posts).set({
 *   published: true,
 *   updatedAt: new Date()
 * }).where(eq(posts.id, postId));
 *
 * // DELETE
 * await db.delete(comments).where(eq(comments.id, commentId));
 *
 * // Transaction
 * await db.transaction(async (tx) => {
 *   const [user] = await tx.insert(users).values({ email, name }).returning();
 *   await tx.insert(posts).values({ userId: user.id, title, content });
 * });
 */
