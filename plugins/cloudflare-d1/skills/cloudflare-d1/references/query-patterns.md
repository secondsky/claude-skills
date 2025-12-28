# D1 Query Patterns Reference

**Complete guide to all D1 Workers API methods with examples**

---

## Table of Contents

1. [D1 API Methods Overview](#d1-api-methods-overview)
2. [prepare() - Prepared Statements](#prepare---prepared-statements)
3. [Query Result Methods](#query-result-methods)
4. [batch() - Multiple Queries](#batch---multiple-queries)
5. [exec() - Raw SQL](#exec---raw-sql)
6. [Common Query Patterns](#common-query-patterns)
7. [Performance Tips](#performance-tips)

---

## D1 API Methods Overview

| Method | Use Case | Returns Results | Safe for User Input |
|--------|----------|-----------------|---------------------|
| `.prepare().bind()` | **Primary method** for queries | Yes | ✅ Yes (prevents SQL injection) |
| `.batch()` | Multiple queries in one round trip | Yes | ✅ Yes (if using prepare) |
| `.exec()` | Raw SQL execution | No | ❌ No (SQL injection risk) |

---

## prepare() - Prepared Statements

**Primary method for all queries with user input.**

### Basic Syntax

```typescript
const stmt = env.DB.prepare(sql);
const bound = stmt.bind(...parameters);
const result = await bound.all(); // or .first(), .run()
```

### Method Chaining (Most Common)

```typescript
const result = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
  .bind(userId)
  .first();
```

### Parameter Binding

```typescript
// Single parameter
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind('user@example.com')
  .first();

// Multiple parameters
const posts = await env.DB.prepare(
  'SELECT * FROM posts WHERE user_id = ? AND published = ? LIMIT ?'
)
.bind(userId, 1, 10)
.all();

// Use null for optional values (NEVER undefined)
const updated = await env.DB.prepare(
  'UPDATE users SET bio = ?, avatar_url = ? WHERE user_id = ?'
)
.bind(bio || null, avatarUrl || null, userId)
.run();
```

### Why use prepare()?

- ✅ **SQL injection protection** - Parameters are safely escaped
- ✅ **Performance** - Query plans can be cached
- ✅ **Reusability** - Same statement, different parameters
- ✅ **Type safety** - Works with TypeScript generics

---

## Query Result Methods

### .all() - Get All Rows

Returns all matching rows as an array.

```typescript
const { results, meta } = await env.DB.prepare('SELECT * FROM users')
  .all();

console.log(results);  // Array of row objects
console.log(meta);     // { duration, rows_read, rows_written }
```

**With Type Safety:**

```typescript
interface User {
  user_id: number;
  email: string;
  username: string;
}

const { results } = await env.DB.prepare('SELECT * FROM users')
  .all<User>();

// results is now typed as User[]
```

**Response Structure:**

```typescript
{
  success: true,
  results: [
    { user_id: 1, email: 'alice@example.com', username: 'alice' },
    { user_id: 2, email: 'bob@example.com', username: 'bob' }
  ],
  meta: {
    duration: 2.5,         // Milliseconds
    rows_read: 2,          // Rows scanned
    rows_written: 0        // Rows modified
  }
}
```

---

### .first() - Get First Row

Returns the first row or `null` if no results.

```typescript
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind('alice@example.com')
  .first();

if (!user) {
  return c.json({ error: 'User not found' }, 404);
}
```

**With Type Safety:**

```typescript
const user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
  .bind(userId)
  .first<User>();

// user is typed as User | null
```

**Note**: `.first()` doesn't add `LIMIT 1` automatically. For better performance:

```typescript
// ✅ Better: Add LIMIT 1 yourself
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? LIMIT 1')
  .bind(email)
  .first();
```

---

### .first(column) - Get Single Column Value

Returns the value of a specific column from the first row.

```typescript
// Get count
const total = await env.DB.prepare('SELECT COUNT(*) as total FROM users')
  .first('total');

console.log(total);  // 42 (just the number, not an object)

// Get specific field
const email = await env.DB.prepare('SELECT email FROM users WHERE user_id = ?')
  .bind(userId)
  .first('email');

console.log(email);  // 'user@example.com'
```

**Use Cases:**
- Counting rows
- Checking existence (SELECT 1)
- Getting single values (MAX, MIN, AVG)

---

### .run() - Execute Without Results

Used for INSERT, UPDATE, DELETE when you don't need the data back.

```typescript
const { success, meta } = await env.DB.prepare(
  'INSERT INTO users (email, username, created_at) VALUES (?, ?, ?)'
)
.bind(email, username, Date.now())
.run();

console.log(success);           // true/false
console.log(meta.last_row_id);  // ID of inserted row
console.log(meta.rows_written); // Number of rows affected
```

**Response Structure:**

```typescript
{
  success: true,
  meta: {
    duration: 1.2,
    rows_read: 0,
    rows_written: 1,
    last_row_id: 42     // Only for INSERT with AUTOINCREMENT
  }
}
```

**Check if rows were affected:**

```typescript
const result = await env.DB.prepare('DELETE FROM users WHERE user_id = ?')
  .bind(userId)
  .run();

if (result.meta.rows_written === 0) {
  return c.json({ error: 'User not found' }, 404);
}
```

---

## batch() - Multiple Queries

**CRITICAL FOR PERFORMANCE**: Execute multiple queries in one network round trip.

### Basic Batch

```typescript
const [users, posts, comments] = await env.DB.batch([
  env.DB.prepare('SELECT * FROM users LIMIT 10'),
  env.DB.prepare('SELECT * FROM posts LIMIT 10'),
  env.DB.prepare('SELECT * FROM comments LIMIT 10')
]);

console.log(users.results);     // User rows
console.log(posts.results);     // Post rows
console.log(comments.results);  // Comment rows
```

### Batch with Parameters

```typescript
const stmt1 = env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(1);
const stmt2 = env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(2);
const stmt3 = env.DB.prepare('SELECT * FROM posts WHERE user_id = ?').bind(1);

const results = await env.DB.batch([stmt1, stmt2, stmt3]);
```

### Bulk Insert with Batch

```typescript
const users = [
  { email: 'user1@example.com', username: 'user1' },
  { email: 'user2@example.com', username: 'user2' },
  { email: 'user3@example.com', username: 'user3' }
];

const inserts = users.map(u =>
  env.DB.prepare('INSERT INTO users (email, username, created_at) VALUES (?, ?, ?)')
    .bind(u.email, u.username, Date.now())
);

const results = await env.DB.batch(inserts);

const successCount = results.filter(r => r.success).length;
console.log(`Inserted ${successCount} users`);
```

### Transaction-like Behavior

```typescript
// All statements execute sequentially
// If one fails, remaining statements don't execute
await env.DB.batch([
  // Deduct credits from user 1
  env.DB.prepare('UPDATE users SET credits = credits - ? WHERE user_id = ?')
    .bind(100, userId1),

  // Add credits to user 2
  env.DB.prepare('UPDATE users SET credits = credits + ? WHERE user_id = ?')
    .bind(100, userId2),

  // Record transaction
  env.DB.prepare('INSERT INTO transactions (from_user, to_user, amount) VALUES (?, ?, ?)')
    .bind(userId1, userId2, 100)
]);
```

**Batch Behavior:**
- Executes statements **sequentially** (in order)
- Each statement commits individually (auto-commit mode)
- If one fails, **remaining statements don't execute**
- All statements in one **network round trip** (huge performance win)

### Batch Performance Comparison

```typescript
// ❌ BAD: 10 separate queries = 10 network round trips
for (let i = 0; i < 10; i++) {
  await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(i)
    .first();
}
// ~500ms total latency

// ✅ GOOD: 1 batch query = 1 network round trip
const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const queries = userIds.map(id =>
  env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(id)
);
const results = await env.DB.batch(queries);
// ~50ms total latency
```

---

## exec() - Raw SQL

**AVOID IN PRODUCTION**. Only use for migrations and one-off tasks.

### Basic Exec

```typescript
const result = await env.DB.exec('SELECT * FROM users');

console.log(result);
// { count: 1, duration: 2.5 }
```

**NOTE**: `exec()` does **not return data**, only count and duration!

### Multiple Statements

```typescript
const result = await env.DB.exec(`
  DROP TABLE IF EXISTS temp_users;
  CREATE TABLE temp_users (user_id INTEGER PRIMARY KEY);
  INSERT INTO temp_users VALUES (1), (2), (3);
`);

console.log(result);
// { count: 3, duration: 5.2 }
```

### ⚠️ NEVER Use exec() For:

```typescript
// ❌ NEVER: SQL injection vulnerability
const email = userInput;
await env.DB.exec(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ ALWAYS: Use prepared statements instead
await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first();
```

### ✅ ONLY Use exec() For:

- Running migration files locally
- One-off maintenance tasks (PRAGMA optimize)
- Database initialization scripts
- CLI tools (not production Workers)

---

## Common Query Patterns

### Existence Check

```typescript
// Check if email exists
const exists = await env.DB.prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1')
  .bind(email)
  .first();

if (exists) {
  return c.json({ error: 'Email already registered' }, 409);
}
```

### Get or Create

```typescript
// Try to find user
let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first<User>();

// Create if doesn't exist
if (!user) {
  const result = await env.DB.prepare(
    'INSERT INTO users (email, username, created_at) VALUES (?, ?, ?)'
  )
  .bind(email, username, Date.now())
  .run();

  const userId = result.meta.last_row_id;

  user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(userId)
    .first<User>();
}
```

### Pagination

```typescript
const page = 1;
const limit = 20;
const offset = (page - 1) * limit;

const [countResult, dataResult] = await env.DB.batch([
  env.DB.prepare('SELECT COUNT(*) as total FROM posts WHERE published = 1'),
  env.DB.prepare(
    'SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset)
]);

const total = countResult.results[0].total;
const posts = dataResult.results;

return {
  posts,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
};
```

### Upsert (INSERT or UPDATE)

```typescript
// SQLite 3.24.0+ supports UPSERT
await env.DB.prepare(`
  INSERT INTO user_settings (user_id, theme, language)
  VALUES (?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    theme = excluded.theme,
    language = excluded.language,
    updated_at = unixepoch()
`)
.bind(userId, theme, language)
.run();
```

### Bulk Upsert

```typescript
const settings = [
  { user_id: 1, theme: 'dark', language: 'en' },
  { user_id: 2, theme: 'light', language: 'es' }
];

const upserts = settings.map(s =>
  env.DB.prepare(`
    INSERT INTO user_settings (user_id, theme, language)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      theme = excluded.theme,
      language = excluded.language
  `).bind(s.user_id, s.theme, s.language)
);

await env.DB.batch(upserts);
```

---

## Performance Tips

### Use SELECT Column Names (Not SELECT *)

```typescript
// ❌ Bad: Fetches all columns
const users = await env.DB.prepare('SELECT * FROM users').all();

// ✅ Good: Only fetch needed columns
const users = await env.DB.prepare('SELECT user_id, email, username FROM users').all();
```

### Always Use LIMIT

```typescript
// ❌ Bad: Could return millions of rows
const posts = await env.DB.prepare('SELECT * FROM posts').all();

// ✅ Good: Limit result set
const posts = await env.DB.prepare('SELECT * FROM posts LIMIT 100').all();
```

### Use Indexes

```sql
-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_posts_published_created
  ON posts(published, created_at DESC)
  WHERE published = 1;
```

```typescript
// Query will use the index
const posts = await env.DB.prepare(
  'SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT 10'
).all();
```

### Check Index Usage

```sql
EXPLAIN QUERY PLAN SELECT * FROM posts WHERE published = 1;
-- Should see: SEARCH posts USING INDEX idx_posts_published_created
```

### Batch Instead of Loop

```typescript
// ❌ Bad: Multiple network round trips
for (const id of userIds) {
  const user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(id)
    .first();
}

// ✅ Good: One network round trip
const queries = userIds.map(id =>
  env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(id)
);
const results = await env.DB.batch(queries);
```

---

## Query Efficiency Analysis (2025)

**Available**: Post-January 2025 Performance Update
**Status**: Experimental (`wrangler d1 insights` command)

### What Is Query Efficiency?

Query efficiency measures how effectively your queries use database resources. It's calculated as the ratio of rows returned to rows scanned:

```
efficiency = rows_returned / rows_read
```

**Efficiency Values**:
- **1.0 (100%)** = Perfect - every row scanned is returned
- **0.5 (50%)** = Good - half the scanned rows are useful
- **0.1 (10%)** = Poor - reading 10x more data than needed
- **< 0.01 (1%)** = Critical - needs immediate index optimization

### Measuring Query Efficiency

Every D1 query returns metadata with `rows_read` and results count:

```typescript
const result = await env.DB.prepare('SELECT * FROM posts WHERE user_id = ?')
  .bind(userId)
  .all();

const efficiency = result.results.length / result.meta.rows_read;

console.log({
  rowsReturned: result.results.length,  // 50 posts
  rowsRead: result.meta.rows_read,      // 100,000 (full table scan!)
  efficiency: efficiency.toFixed(4),     // 0.0005 (0.05% - CRITICAL)
  duration: result.meta.duration         // 450ms (slow!)
});
```

**Red Flags**:
- Efficiency < 0.1 (10%) → Add index immediately
- Efficiency < 0.01 (1%) → Critical performance issue
- `rows_read` >> `rows_returned` → Missing or unused index

### Using wrangler d1 insights (Experimental)

**Command**:
```bash
wrangler d1 insights my-database
```

**What It Shows**:
- Slow queries (P95 latency > 200ms)
- Inefficient queries (efficiency < 0.1)
- Query frequency (executions/day)
- Suggested indexes

**Example Output**:
```
Top 5 Slow Queries (by P95 latency):

1. SELECT * FROM orders WHERE user_id = ?
   Executions: 850/day
   P50: 180ms | P95: 450ms | P99: 850ms
   Efficiency: 0.05 (5%)
   Rows Read: 100,000 | Rows Returned: ~50
   ⚠️ SUGGESTION: CREATE INDEX idx_orders_user_id ON orders(user_id);

2. SELECT COUNT(*) FROM users WHERE status = 'active'
   Executions: 600/day
   P50: 90ms | P95: 180ms | P99: 350ms
   Efficiency: 0.0001 (<0.01%)
   Rows Read: 120,000 | Rows Returned: 1
   ⚠️ SUGGESTION: CREATE INDEX idx_users_status ON users(status);
```

**Flags Available**:
```bash
# Show only slow queries (P95 > 200ms)
wrangler d1 insights my-database --slow

# Show queries with low efficiency (< 0.1)
wrangler d1 insights my-database --inefficient

# Limit results
wrangler d1 insights my-database --limit 10
```

### EXPLAIN QUERY PLAN Analysis

Use EXPLAIN to understand WHY a query is inefficient:

```sql
EXPLAIN QUERY PLAN SELECT * FROM posts WHERE user_id = 123;
```

**Without Index** (Inefficient):
```
SCAN TABLE posts
```
- Scans entire table (all rows)
- Efficiency: rows_returned / total_rows (typically < 0.01)

**With Index** (Efficient):
```
SEARCH TABLE posts USING INDEX idx_posts_user_id (user_id=?)
```
- Uses index to find matching rows
- Efficiency: ~1.0 (only scans matching rows)

### Before/After Index Optimization

#### Before Index (Inefficient)

```typescript
// Query without index
const result = await env.DB.prepare('SELECT * FROM orders WHERE user_id = ?')
  .bind(userId)
  .all();

console.log({
  rowsReturned: 50,
  rowsRead: 100000,      // Full table scan
  efficiency: 0.0005,     // 0.05% - CRITICAL
  duration: 450          // 450ms - SLOW
});
```

**EXPLAIN QUERY PLAN**:
```sql
EXPLAIN QUERY PLAN SELECT * FROM orders WHERE user_id = ?;
-- Output: SCAN TABLE orders
```

#### After Index (Efficient)

```sql
-- Create index
CREATE INDEX idx_orders_user_id ON orders(user_id);
PRAGMA optimize;
```

```typescript
// Same query, now using index
const result = await env.DB.prepare('SELECT * FROM orders WHERE user_id = ?')
  .bind(userId)
  .all();

console.log({
  rowsReturned: 50,
  rowsRead: 50,          // Index seek (exact match)
  efficiency: 1.0,        // 100% - PERFECT
  duration: 15           // 15ms - FAST (97% improvement!)
});
```

**EXPLAIN QUERY PLAN**:
```sql
EXPLAIN QUERY PLAN SELECT * FROM orders WHERE user_id = ?;
-- Output: SEARCH TABLE orders USING INDEX idx_orders_user_id (user_id=?)
```

### Efficiency Optimization Workflow

**Step 1: Identify Inefficient Queries**

```typescript
// Monitor all queries
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();

  // Log slow or inefficient queries
  if (c.get('queryMeta')) {
    const meta = c.get('queryMeta');
    const efficiency = meta.rowsReturned / meta.rows_read;

    if (efficiency < 0.1 || meta.duration > 100) {
      console.warn({
        endpoint: c.req.path,
        efficiency: efficiency.toFixed(4),
        duration: meta.duration,
        rowsRead: meta.rows_read,
        rowsReturned: meta.rowsReturned
      });
    }
  }
});
```

**Step 2: Run EXPLAIN QUERY PLAN**

```bash
# Check if index is being used
wrangler d1 execute my-database --command \
  "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE user_id = 123"
```

**Step 3: Create Index**

```bash
# Add missing index
wrangler d1 execute my-database --command \
  "CREATE INDEX idx_orders_user_id ON orders(user_id); PRAGMA optimize;"
```

**Step 4: Verify Improvement**

```bash
# Re-run EXPLAIN to confirm index usage
wrangler d1 execute my-database --command \
  "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE user_id = 123"

# Should now show: SEARCH TABLE orders USING INDEX idx_orders_user_id
```

### Composite Index Optimization

For queries with multiple filters or ORDER BY:

```typescript
// Query with WHERE + ORDER BY
const posts = await env.DB.prepare(
  'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
).bind(userId).all();

// Without composite index:
// Efficiency: 0.08 (8%), Duration: 220ms
// rows_read: 50,000, rows_returned: 10
```

**Create Composite Index**:
```sql
-- Index covers both WHERE and ORDER BY
CREATE INDEX idx_posts_user_created
  ON posts(user_id, created_at DESC);

PRAGMA optimize;
```

**EXPLAIN Analysis**:
```sql
EXPLAIN QUERY PLAN
SELECT * FROM posts
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 10;

-- Before: SCAN TABLE posts
--         USING TEMP B-TREE FOR ORDER BY

-- After:  SEARCH TABLE posts USING INDEX idx_posts_user_created (user_id=?)
```

**Result**:
```typescript
// With composite index:
// Efficiency: 1.0 (100%), Duration: 12ms
// rows_read: 10, rows_returned: 10
// 95% faster!
```

### Efficiency Best Practices

✅ **DO**:
- Monitor query efficiency in production
- Use `wrangler d1 insights` to find slow queries
- Run EXPLAIN QUERY PLAN before adding indexes
- Create indexes on WHERE, JOIN, and ORDER BY columns
- Use composite indexes for multi-column queries
- Run `PRAGMA optimize` after creating indexes

❌ **DON'T**:
- Ignore queries with efficiency < 0.1
- Add indexes without measuring impact
- Create too many indexes (slows writes)
- Use SELECT * without LIMIT
- Skip EXPLAIN QUERY PLAN analysis

### Efficiency Targets (Post-2025 Baselines)

Based on Cloudflare's January 2025 performance update:

| Query Type | Target Efficiency | Target P95 Latency |
|------------|-------------------|-------------------|
| Primary key lookup | > 0.95 | < 20ms |
| Indexed WHERE | > 0.80 | < 40ms |
| Indexed JOIN | > 0.50 | < 80ms |
| Aggregation (COUNT, SUM) | N/A | < 100ms |

If queries fall below these targets, investigate with EXPLAIN QUERY PLAN.

---

## Meta Object Reference

Every D1 query returns a `meta` object with execution details:

```typescript
{
  duration: 2.5,          // Query execution time in milliseconds
  rows_read: 100,         // Number of rows scanned
  rows_written: 1,        // Number of rows modified (INSERT/UPDATE/DELETE)
  last_row_id: 42,        // ID of last inserted row (INSERT only)
  changed: 1              // Rows affected (UPDATE/DELETE only)
}
```

### Using Meta for Debugging

```typescript
const result = await env.DB.prepare('SELECT * FROM large_table WHERE status = ?')
  .bind('active')
  .all();

console.log(`Query took ${result.meta.duration}ms`);
console.log(`Scanned ${result.meta.rows_read} rows`);
console.log(`Returned ${result.results.length} rows`);

// If rows_read is much higher than results.length, add an index!
if (result.meta.rows_read > result.results.length * 10) {
  console.warn('Query is inefficient - consider adding an index');
}
```

---

## Official Documentation

- **Workers API**: https://developers.cloudflare.com/d1/worker-api/
- **Prepared Statements**: https://developers.cloudflare.com/d1/worker-api/prepared-statements/
- **Return Object**: https://developers.cloudflare.com/d1/worker-api/return-object/
