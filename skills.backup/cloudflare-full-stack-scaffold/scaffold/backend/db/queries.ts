/**
 * Typed D1 Query Helpers
 *
 * Reusable database query functions for the users table.
 * Provides type-safe database operations.
 *
 * Usage in routes:
 * import { getUserById, createUser } from '../db/queries'
 * const user = await getUserById(db, userId)
 */

// ============================================
// Type Definitions
// ============================================

export interface User {
  id: string
  email: string
  name: string | null
  created_at: number
  updated_at: number
}

export interface CreateUserInput {
  email: string
  name?: string | null
}

export interface UpdateUserInput {
  name?: string | null
}

// ============================================
// Query Helpers
// ============================================

/**
 * Get all users (limited to 100 for safety)
 */
export async function getAllUsers(
  db: D1Database,
  limit = 100
): Promise<User[]> {
  const { results } = await db
    .prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ?')
    .bind(limit)
    .all<User>()

  return results
}

/**
 * Get user by ID
 */
export async function getUserById(
  db: D1Database,
  id: string
): Promise<User | null> {
  const user = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<User>()

  return user
}

/**
 * Get user by email
 */
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  const user = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<User>()

  return user
}

/**
 * Create a new user
 * @throws Error if email already exists
 */
export async function createUser(
  db: D1Database,
  input: CreateUserInput
): Promise<User> {
  const { email, name } = input

  // Check if email already exists
  const existing = await getUserByEmail(db, email)
  if (existing) {
    throw new Error('Email already exists')
  }

  // Generate UUID and timestamps
  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  // Insert user
  await db
    .prepare(
      'INSERT INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, email, name || null, now, now)
    .run()

  // Fetch and return the created user
  const user = await getUserById(db, id)

  if (!user) {
    throw new Error('Failed to create user')
  }

  return user
}

/**
 * Update user by ID
 * @throws Error if user not found
 */
export async function updateUser(
  db: D1Database,
  id: string,
  input: UpdateUserInput
): Promise<User> {
  const { name } = input
  const now = Math.floor(Date.now() / 1000)

  // Update user
  const result = await db
    .prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?')
    .bind(name, now, id)
    .run()

  if (result.meta.changes === 0) {
    throw new Error('User not found')
  }

  // Fetch and return updated user
  const user = await getUserById(db, id)

  if (!user) {
    throw new Error('Failed to fetch updated user')
  }

  return user
}

/**
 * Delete user by ID
 * @throws Error if user not found
 */
export async function deleteUser(
  db: D1Database,
  id: string
): Promise<boolean> {
  const result = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()

  if (result.meta.changes === 0) {
    throw new Error('User not found')
  }

  return true
}

/**
 * Check if email exists
 */
export async function emailExists(
  db: D1Database,
  email: string
): Promise<boolean> {
  const result = await db
    .prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1')
    .bind(email)
    .first()

  return result !== null
}

/**
 * Count total users
 */
export async function countUsers(db: D1Database): Promise<number> {
  const count = await db
    .prepare('SELECT COUNT(*) as total FROM users')
    .first<{ total: number }>('total')

  return count || 0
}

// ============================================
// Batch Operations
// ============================================

/**
 * Get multiple users by IDs in one batch query
 */
export async function getUsersByIds(
  db: D1Database,
  ids: string[]
): Promise<User[]> {
  if (ids.length === 0) {
    return []
  }

  // Create batch of queries
  const queries = ids.map((id) =>
    db.prepare('SELECT * FROM users WHERE id = ?').bind(id)
  )

  // Execute all queries in one batch
  const results = await db.batch(queries)

  // Extract users from results
  const users = results
    .map((result) => result.results[0] as User | undefined)
    .filter((user): user is User => user !== undefined)

  return users
}

/**
 * Create multiple users in one batch
 * Note: Does not check for duplicate emails - use with caution
 */
export async function createUsersBatch(
  db: D1Database,
  inputs: CreateUserInput[]
): Promise<number> {
  if (inputs.length === 0) {
    return 0
  }

  const now = Math.floor(Date.now() / 1000)

  // Create batch of insert statements
  const inserts = inputs.map((input) =>
    db
      .prepare(
        'INSERT INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(crypto.randomUUID(), input.email, input.name || null, now, now)
  )

  // Execute all inserts in one batch
  const results = await db.batch(inserts)

  // Count successful inserts
  const insertedCount = results.filter((r) => r.success).length

  return insertedCount
}
