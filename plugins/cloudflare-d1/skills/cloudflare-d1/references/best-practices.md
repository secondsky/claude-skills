# D1 Best Practices

**Production-ready patterns for Cloudflare D1**

---

## Table of Contents

1. [Security](#security)
2. [Performance](#performance)
3. [Migrations](#migrations)
4. [Error Handling](#error-handling)
5. [Data Modeling](#data-modeling)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## Security

### Always Use Prepared Statements

```typescript
// ❌ NEVER: SQL injection vulnerability
const email = c.req.query('email');
await env.DB.exec(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ ALWAYS: Safe prepared statement
const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first();
```

**Why?** User input like `'; DROP TABLE users; --` would execute in the first example!

### Use null Instead of undefined

```typescript
// ❌ WRONG: undefined causes D1_TYPE_ERROR
await env.DB.prepare('INSERT INTO users (email, bio) VALUES (?, ?)')
  .bind(email, undefined);

// ✅ CORRECT: Use null for optional values
await env.DB.prepare('INSERT INTO users (email, bio) VALUES (?, ?)')
  .bind(email, bio || null);
```

### Never Commit Sensitive IDs

```jsonc
// ❌ WRONG: Database ID in public repo
{
  "d1_databases": [
    {
      "database_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  // ❌
    }
  ]
}

// ✅ BETTER: Use environment variable or secret
{
  "d1_databases": [
    {
      "database_id": "$D1_DATABASE_ID"  // Reference env var
    }
  ]
}
```

Or use wrangler secrets:

```bash
npx wrangler secret put D1_DATABASE_ID
```

### Validate Input Before Binding

```typescript
// ✅ Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post('/api/users', async (c) => {
  const { email } = await c.req.json();

  if (!isValidEmail(email)) {
    return c.json({ error: 'Invalid email format' }, 400);
  }

  // Now safe to use
  const user = await c.env.DB.prepare('INSERT INTO users (email) VALUES (?)')
    .bind(email)
    .run();
});
```

---

## Performance

### Use Batch for Multiple Queries

```typescript
// ❌ BAD: 3 network round trips (~150ms)
const user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(1).first();
const posts = await env.DB.prepare('SELECT * FROM posts WHERE user_id = ?').bind(1).all();
const comments = await env.DB.prepare('SELECT * FROM comments WHERE user_id = ?').bind(1).all();

// ✅ GOOD: 1 network round trip (~50ms)
const [userResult, postsResult, commentsResult] = await env.DB.batch([
  env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(1),
  env.DB.prepare('SELECT * FROM posts WHERE user_id = ?').bind(1),
  env.DB.prepare('SELECT * FROM comments WHERE user_id = ?').bind(1)
]);

const user = userResult.results[0];
const posts = postsResult.results;
const comments = commentsResult.results;
```

**Performance win: 3x faster!**

### Create Indexes for WHERE Clauses

```sql
-- ❌ Slow: Full table scan
SELECT * FROM posts WHERE user_id = 123;

-- ✅ Fast: Create index first
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- Now this query is fast
SELECT * FROM posts WHERE user_id = 123;
```

**Verify index is being used:**

```sql
EXPLAIN QUERY PLAN SELECT * FROM posts WHERE user_id = 123;
-- Should see: SEARCH posts USING INDEX idx_posts_user_id
```

### Run PRAGMA optimize After Schema Changes

```sql
-- After creating indexes or altering schema
PRAGMA optimize;
```

This collects statistics that help the query planner choose the best execution plan.

### Select Only Needed Columns

```typescript
// ❌ Bad: Fetches all columns (wastes bandwidth)
const users = await env.DB.prepare('SELECT * FROM users').all();

// ✅ Good: Only fetch what you need
const users = await env.DB.prepare('SELECT user_id, email, username FROM users').all();
```

### Always Use LIMIT

```typescript
// ❌ Dangerous: Could return millions of rows
const posts = await env.DB.prepare('SELECT * FROM posts WHERE published = 1').all();

// ✅ Safe: Limit result set
const posts = await env.DB.prepare(
  'SELECT * FROM posts WHERE published = 1 LIMIT 100'
).all();
```

### Use Partial Indexes

```sql
-- Index only published posts (smaller index, faster writes)
CREATE INDEX idx_posts_published ON posts(created_at DESC)
  WHERE published = 1;

-- Index only active users (exclude deleted)
CREATE INDEX idx_users_active ON users(email)
  WHERE deleted_at IS NULL;
```

Benefits:
- ✅ Smaller indexes (faster queries)
- ✅ Fewer index updates (faster writes)
- ✅ Only index relevant data

---

## Read Replication (Beta)

**Status**: Beta (as of 2025-11-11)
**Reference**: See `read-replication.md` for complete guide
**Official Docs**: https://developers.cloudflare.com/d1/best-practices/read-replication/

### What It Is

D1 read replication creates asynchronously replicated read-only database copies across Cloudflare's global network (6 regions: ENAM, WNAM, WEUR, EEUR, APAC, OC). This reduces read latency and increases throughput by routing queries to replicas closer to users.

**Free feature** included with D1 at no additional cost.

### Enabling Read Replication

**Dashboard Method**:
1. Navigate to Workers & Pages > D1
2. Select your database > Settings
3. Enable Read Replication

**API Method**:
```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"read_replication": {"mode": "auto"}}'
```

### Sessions API Patterns

#### Unconstrained (Any Instance)

Use when slight staleness is acceptable:

```typescript
// Routes to nearest replica
const session = env.DB.withSession();
const products = await session
  .prepare('SELECT * FROM products WHERE category = ?')
  .bind('electronics')
  .all();
```

**Best for**: Product catalogs, blogs, public content

#### Primary-First (Latest Data)

Use when you need the most current data:

```typescript
// Always routes to primary
const session = env.DB.withSession('first-primary');
const user = await session
  .prepare('SELECT * FROM users WHERE user_id = ?')
  .bind(userId)
  .first();
```

**Best for**: User profiles, account settings, financial data

#### Bookmark-Based (Consistent Workflow)

Use for multi-step workflows:

```typescript
// Get bookmark from previous request
const bookmark = c.req.header('x-d1-bookmark') ?? 'first-unconstrained';
const session = env.DB.withSession(bookmark);

// Perform query
const result = await session.prepare(query).bind(...params).run();

// Return bookmark for next request
return c.json(data, 200, {
  'x-d1-bookmark': session.getBookmark() ?? ''
});
```

**Best for**: Checkout flows, wizards, shopping carts

### Monitoring

Track which instance served your query:

```typescript
const result = await session.prepare(query).run();
console.log({
  servedByRegion: result.meta.served_by_region,
  servedByPrimary: result.meta.served_by_primary,
  rowsRead: result.meta.rows_read
});
```

### When to Use

✅ **Use When**:
- Globally distributed users
- Read-heavy workload (reads >> writes)
- Read latency is a performance bottleneck
- Can integrate Sessions API
- Tolerate eventual consistency with bookmarks

❌ **Don't Use When**:
- Single-region application (no benefit)
- Requires strong consistency without Sessions API
- Write-heavy workload
- Cannot implement Sessions API

### Common Pitfalls

**❌ Forgetting Sessions API**:
```typescript
// Bad: Can read stale data after write
await env.DB.prepare('INSERT INTO posts VALUES (?)').bind('New').run();
const posts = await env.DB.prepare('SELECT * FROM posts').all();  // Might not see new post
```

**✅ Using Sessions API**:
```typescript
// Good: Guaranteed consistency
const session = env.DB.withSession('first-primary');
await session.prepare('INSERT INTO posts VALUES (?)').bind('New').run();
const posts = await session.prepare('SELECT * FROM posts').all();  // Always sees new post
```

**❌ Not Passing Bookmarks**:
```typescript
// Bad: Loses consistency across requests
app.post('/cart/add', async (c) => {
  const session = env.DB.withSession();
  // ... add to cart ...
  return c.json({ success: true });  // No bookmark returned!
});
```

**✅ Passing Bookmarks**:
```typescript
// Good: Maintains consistency
app.post('/cart/add', async (c) => {
  const bookmark = c.req.header('x-d1-bookmark') ?? 'first-unconstrained';
  const session = env.DB.withSession(bookmark);
  // ... add to cart ...
  return c.json({ success: true }, 200, {
    'x-d1-bookmark': session.getBookmark() ?? ''
  });
});
```

### Limitations (Beta)

⚠️ **Current Limitations**:
- Sessions API only via Worker Binding (not REST API yet)
- Disabling replication takes up to 24 hours to propagate
- All writes always route to primary instance
- Replica lag typically < 1 second (but not guaranteed)

### Best Practices Checklist

- [ ] Enable read replication via dashboard or API
- [ ] Update code to use Sessions API (`withSession()`)
- [ ] Implement bookmark passing for multi-step workflows
- [ ] Use `first-primary` after writes if immediate reads needed
- [ ] Monitor `served_by_region` and `served_by_primary` metrics
- [ ] Test with replication enabled in development
- [ ] Document which routes use which session pattern

**For complete examples and migration guide**: See `read-replication.md`

---

## Migrations

### Make Migrations Idempotent

```sql
-- ✅ ALWAYS use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ✅ Use IF EXISTS for drops
DROP TABLE IF EXISTS temp_table;
```

**Why?** Re-running a migration won't fail if it's already applied.

### Never Modify Applied Migrations

```bash
# ❌ WRONG: Editing applied migration
vim migrations/0001_create_users.sql  # Already applied!

# ✅ CORRECT: Create new migration
npx wrangler d1 migrations create my-database add_users_bio_column
```

**Why?** D1 tracks which migrations have been applied. Modifying them causes inconsistencies.

### Test Migrations Locally First

```bash
# 1. Apply to local database
npx wrangler d1 migrations apply my-database --local

# 2. Test queries locally
npx wrangler d1 execute my-database --local --command "SELECT * FROM users"

# 3. Only then apply to production
npx wrangler d1 migrations apply my-database --remote
```

### Handle Foreign Keys Carefully

```sql
-- Disable foreign key checks temporarily during schema changes
PRAGMA defer_foreign_keys = true;

-- Make schema changes that would violate foreign keys
ALTER TABLE posts DROP COLUMN old_user_id;
ALTER TABLE posts ADD COLUMN user_id INTEGER REFERENCES users(user_id);

-- Foreign keys re-enabled automatically at end of migration
```

### Break Large Data Migrations into Batches

```sql
-- ❌ BAD: Single massive INSERT (causes "statement too long")
INSERT INTO users (email) VALUES
  ('user1@example.com'),
  ('user2@example.com'),
  ... -- 10,000 more rows

-- ✅ GOOD: Split into batches of 100-250 rows
-- File: 0001_migrate_users_batch1.sql
INSERT INTO users (email) VALUES
  ('user1@example.com'),
  ... -- 100 rows

-- File: 0002_migrate_users_batch2.sql
INSERT INTO users (email) VALUES
  ('user101@example.com'),
  ... -- next 100 rows
```

---

## Error Handling

### Check for Errors After Every Query

```typescript
try {
  const result = await env.DB.prepare('INSERT INTO users (email) VALUES (?)')
    .bind(email)
    .run();

  if (!result.success) {
    console.error('Insert failed');
    return c.json({ error: 'Failed to create user' }, 500);
  }

  // Success!
  const userId = result.meta.last_row_id;

} catch (error: any) {
  console.error('Database error:', error.message);
  return c.json({ error: 'Database operation failed' }, 500);
}
```

### Implement Retry Logic for Transient Errors

```typescript
async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      const message = error.message;

      // Check if error is retryable
      const isRetryable =
        message.includes('Network connection lost') ||
        message.includes('storage caused object to be reset') ||
        message.includes('reset because its code was updated');

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage
const user = await queryWithRetry(() =>
  env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
    .bind(userId)
    .first()
);
```

### Handle Common D1 Errors

```typescript
try {
  await env.DB.prepare(query).bind(...params).run();
} catch (error: any) {
  const message = error.message;

  if (message.includes('D1_ERROR')) {
    // D1-specific error
    console.error('D1 error:', message);
  } else if (message.includes('UNIQUE constraint failed')) {
    // Duplicate key error
    return c.json({ error: 'Email already exists' }, 409);
  } else if (message.includes('FOREIGN KEY constraint failed')) {
    // Invalid foreign key
    return c.json({ error: 'Invalid user reference' }, 400);
  } else {
    // Unknown error
    console.error('Unknown database error:', message);
    return c.json({ error: 'Database operation failed' }, 500);
  }
}
```

---

## Automatic Query Retries (2025)

**Status**: Generally Available (September 2025)
**Official Docs**: https://developers.cloudflare.com/d1/best-practices/automatic-retries/

### What It Is

D1 automatically retries **read-only queries** (SELECT) up to 2 times on transient failures like network timeouts, connection resets, or temporary database unavailability. This feature improves reliability without requiring application-level retry logic.

**Scope**: Read queries only (SELECT statements)
**Retry Count**: Up to 2 automatic retries
**Backoff**: Exponential backoff (specific timing not published by Cloudflare)
**No Action Required**: Enabled automatically for all D1 databases

### How It Works

```typescript
// This query automatically retries on transient failures
const user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
  .bind(userId)
  .first();

// If first attempt fails with transient error:
// - D1 automatically retries with exponential backoff
// - Up to 2 additional attempts (3 total)
// - Throws error if all attempts fail
```

**Retryable Errors**:
- Network connection lost
- Database temporarily unavailable
- Connection reset by peer
- Timeout errors (execution > 30 seconds)

**Non-Retryable Errors** (fail immediately):
- SQL syntax errors
- Constraint violations (UNIQUE, FOREIGN KEY)
- Permission errors
- Query limit exceeded (50 queries/invocation on free tier)

### Write Operations (Manual Retry Required)

Write operations (INSERT, UPDATE, DELETE) do **NOT** automatically retry. Implement application-level retry logic for write queries:

```typescript
async function writeWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: unknown) {
      // D1 errors are Error objects, but validate to be safe
      if (!(error instanceof Error)) {
        throw error;
      }

      // Note: D1 does not publish specific error codes for transient errors.
      // We check error.message as recommended by Cloudflare documentation.
      // See: https://developers.cloudflare.com/d1/observability/debug-d1/
      const message = error.message || '';

      // Check if error is retryable (transient network/connection issues)
      const isRetryable =
        message.includes('Network connection lost') ||
        message.includes('storage caused object to be reset') ||
        message.includes('reset because its code was updated') ||
        message.includes('timeout') ||
        message.includes('D1_ERROR');

      // Don't retry on final attempt or non-retryable errors
      if (!isRetryable || attempt === maxRetries - 1) {
        // Log full error details before throwing
        console.error('D1 write failed:', {
          message: error.message,
          name: error.name,
          attempt: attempt + 1,
          retryable: isRetryable
        });
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s (application-level)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));

      console.log(`Retrying write operation (attempt ${attempt + 2}/${maxRetries})`);
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage
const result = await writeWithRetry(() =>
  env.DB.prepare('UPDATE users SET credits = credits - ? WHERE user_id = ?')
    .bind(amount, userId)
    .run()
);
```

### Idempotency Best Practices

When implementing manual retry logic for writes, ensure operations are **idempotent** (safe to execute multiple times):

```typescript
// ❌ NOT Idempotent: Repeated retries would deduct credits multiple times
await env.DB.prepare('UPDATE users SET credits = credits - 100 WHERE user_id = ?')
  .bind(userId)
  .run();

// ✅ Idempotent: Check current balance first, only deduct if sufficient
const user = await env.DB.prepare('SELECT credits FROM users WHERE user_id = ?')
  .bind(userId)
  .first();

if (user.credits >= 100) {
  await env.DB.prepare('UPDATE users SET credits = ? WHERE user_id = ?')
    .bind(user.credits - 100, userId)
    .run();
}
```

**Idempotency Patterns**:

1. **Check-Then-Set**:
   ```typescript
   // Verify state before writing
   const existing = await env.DB.prepare('SELECT * FROM orders WHERE order_id = ?')
     .bind(orderId)
     .first();

   if (!existing) {
     await env.DB.prepare('INSERT INTO orders (order_id, status) VALUES (?, ?)')
       .bind(orderId, 'pending')
       .run();
   }
   ```

2. **Unique Constraint**:
   ```sql
   CREATE TABLE orders (
     order_id TEXT PRIMARY KEY,  -- Unique constraint prevents duplicates
     status TEXT NOT NULL,
     created_at INTEGER DEFAULT (unixepoch())
   );
   ```

   ```typescript
   try {
     await env.DB.prepare('INSERT INTO orders (order_id, status) VALUES (?, ?)')
       .bind(orderId, 'pending')
       .run();
   } catch (error: any) {
     if (error.message.includes('UNIQUE constraint failed')) {
       // Order already exists, safe to continue
       console.log('Order already created');
     } else {
       throw error;
     }
   }
   ```

3. **Upsert Instead of Insert**:
   ```typescript
   // INSERT or UPDATE - safe to retry
   await env.DB.prepare(`
     INSERT INTO user_settings (user_id, theme)
     VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET theme = excluded.theme
   `).bind(userId, theme).run();
   ```

### Monitoring Retry Behavior

Track retry frequency to identify underlying issues:

```typescript
let retryCount = 0;

app.use('*', async (c, next) => {
  const start = Date.now();

  try {
    await next();
  } catch (error: any) {
    retryCount++;
    console.warn({
      retryCount,
      error: error.message,
      duration: Date.now() - start,
      endpoint: c.req.path
    });
    throw error;
  }
});

// Alert if retry rate exceeds threshold
if (retryCount > 10) {
  console.error('High retry rate detected - investigate database health');
}
```

---

## Data Modeling

### Use Appropriate Data Types

```sql
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Auto-incrementing ID
  email TEXT NOT NULL,                        -- String
  username TEXT NOT NULL,
  age INTEGER,                                 -- Number
  balance REAL,                                -- Decimal/float
  is_active INTEGER DEFAULT 1,                -- Boolean (0 or 1)
  metadata TEXT,                               -- JSON (stored as TEXT)
  created_at INTEGER NOT NULL                  -- Unix timestamp
);
```

**SQLite has 5 types**: NULL, INTEGER, REAL, TEXT, BLOB

### Store Timestamps as Unix Epoch

```sql
-- ✅ RECOMMENDED: Unix timestamp (INTEGER)
created_at INTEGER NOT NULL DEFAULT (unixepoch())

-- ❌ AVOID: ISO 8601 strings (harder to query/compare)
created_at TEXT NOT NULL DEFAULT (datetime('now'))
```

**Why?** Unix timestamps are easier to compare, filter, and work with in JavaScript:

```typescript
// Easy to work with
const timestamp = Date.now();  // 1698000000
const date = new Date(timestamp);

// Easy to query
const recentPosts = await env.DB.prepare(
  'SELECT * FROM posts WHERE created_at > ?'
).bind(Date.now() - 86400000).all();  // Last 24 hours
```

### Store JSON as TEXT

```sql
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  settings TEXT  -- Store JSON here
);
```

```typescript
// Insert JSON
const settings = { theme: 'dark', language: 'en' };
await env.DB.prepare('INSERT INTO users (email, settings) VALUES (?, ?)')
  .bind(email, JSON.stringify(settings))
  .run();

// Read JSON
const user = await env.DB.prepare('SELECT * FROM users WHERE user_id = ?')
  .bind(userId)
  .first();

const settings = JSON.parse(user.settings);
console.log(settings.theme);  // 'dark'
```

### Use Soft Deletes

```sql
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  deleted_at INTEGER  -- NULL = active, timestamp = deleted
);

-- Index for active users only
CREATE INDEX idx_users_active ON users(user_id)
  WHERE deleted_at IS NULL;
```

```typescript
// Soft delete
await env.DB.prepare('UPDATE users SET deleted_at = ? WHERE user_id = ?')
  .bind(Date.now(), userId)
  .run();

// Query only active users
const activeUsers = await env.DB.prepare(
  'SELECT * FROM users WHERE deleted_at IS NULL'
).all();
```

### Normalize Related Data

```sql
-- ✅ GOOD: Normalized (users in separate table)
CREATE TABLE posts (
  post_id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ❌ BAD: Denormalized (user data duplicated in every post)
CREATE TABLE posts (
  post_id INTEGER PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL
);
```

---

## Testing

### Test Migrations Locally

```bash
# 1. Create local database
npx wrangler d1 migrations apply my-database --local

# 2. Seed with test data
npx wrangler d1 execute my-database --local --file=seed.sql

# 3. Run test queries
npx wrangler d1 execute my-database --local --command "SELECT COUNT(*) FROM users"
```

### Use Separate Databases for Development

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-app-prod",
      "database_id": "<PROD_UUID>",
      "preview_database_id": "local-dev"  // Local only
    }
  ]
}
```

**Benefits:**
- ✅ Never accidentally modify production data
- ✅ Fast local development (no network latency)
- ✅ Can reset local DB anytime

### Backup Before Major Migrations

```bash
# Export current database
npx wrangler d1 export my-database --remote --output=backup-$(date +%Y%m%d).sql

# Apply migration
npx wrangler d1 migrations apply my-database --remote

# If something goes wrong, restore from backup
npx wrangler d1 execute my-database --remote --file=backup-20251021.sql
```

---

## Deployment

### Use Preview Databases for Testing

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-app-prod",
      "database_id": "<PROD_UUID>",
      "preview_database_id": "<PREVIEW_UUID>"  // Separate preview database
    }
  ]
}
```

Deploy preview:

```bash
npx wrangler deploy --env preview
```

### Apply Migrations Before Deploying Code

```bash
# 1. Apply migrations first
npx wrangler d1 migrations apply my-database --remote

# 2. Then deploy Worker code
npx wrangler deploy
```

**Why?** Ensures database schema is ready before code expects it.

### Monitor Query Performance

```typescript
app.get('/api/users', async (c) => {
  const start = Date.now();

  const { results, meta } = await c.env.DB.prepare('SELECT * FROM users LIMIT 100')
    .all();

  const duration = Date.now() - start;

  // Log slow queries
  if (duration > 100) {
    console.warn(`Slow query: ${duration}ms, rows_read: ${meta.rows_read}`);
  }

  return c.json({ users: results });
});
```

### Use Time Travel for Data Recovery

```bash
# View database state 2 hours ago
npx wrangler d1 time-travel info my-database --timestamp "2025-10-21T10:00:00Z"

# Restore database to 2 hours ago
npx wrangler d1 time-travel restore my-database --timestamp "2025-10-21T10:00:00Z"
```

**Note**: Time Travel available for last 30 days.

---

## Data Localization (2025)

**Status**: Generally Available (November 2025)
**Official Docs**: https://developers.cloudflare.com/d1/configuration/data-location/

### What It Is

Data localization allows you to specify which geographic region stores your D1 database's primary instance. This ensures compliance with data sovereignty regulations like GDPR (EU) or industry-specific requirements (financial services, government).

**Available Jurisdictions**:
- **eu**: European Union (GDPR compliant)
- **fedramp**: FedRAMP-compliant data centers (requires Enterprise plan)

**Important Notes**:
- Jurisdictions are **immutable** and can only be set at database creation
- Cannot be changed after the database is created
- If no jurisdiction is specified, D1 uses location hints for optimal placement
- For US placement without compliance requirements, use location hints (wnam/enam) instead of jurisdiction

**Cost**: Free feature (fedramp jurisdiction requires Enterprise plan)

### Configuration

#### Method 1: Wrangler CLI (Database Creation)

```bash
# Create database with EU jurisdiction
wrangler d1 create my-database --jurisdiction eu

# Create database with FedRAMP jurisdiction (requires Enterprise plan)
wrangler d1 create my-database --jurisdiction fedramp

# Create database without jurisdiction (uses location hints for optimal placement)
wrangler d1 create my-database
```

#### Method 2: wrangler.jsonc (Existing Database)

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database",
      "database_id": "abc123-def456-...",
      "jurisdiction": "eu"  // or "fedramp" (Enterprise only)
    }
  ]
}
```

**Critical**: Jurisdiction can only be set during database creation via CLI. Cannot be changed or added after creation. The wrangler.jsonc jurisdiction field is for reference only; it must match the jurisdiction set during `wrangler d1 create`.

### Use Cases

#### GDPR Compliance (EU Jurisdiction)

```jsonc
// Healthcare app serving EU users
{
  "d1_databases": [
    {
      "binding": "PATIENT_DB",
      "database_name": "patient-records",
      "database_id": "...",
      "jurisdiction": "eu"  // Ensures data stays in EU (GDPR compliant)
    }
  ]
}
```

**Benefits**:
- ✅ GDPR Article 44-50 compliance (data transfers)
- ✅ Data residency guarantee (EU only)
- ✅ Simplified regulatory audits

#### US-Based Compliance (HIPAA, GLBA, SOX)

**Important**: There is no "US" jurisdiction in Cloudflare D1. For US-based compliance:
- Use **location hints** (wnam/enam) for US regional placement (not a compliance guarantee)
- Use **fedramp** jurisdiction (Enterprise plan) for federal/government compliance requirements
- Consult legal counsel for specific compliance requirements

```jsonc
// Healthcare app serving US patients (using location hints)
{
  "d1_databases": [
    {
      "binding": "MEDICAL_DB",
      "database_name": "medical-records",
      "database_id": "...",
      // No jurisdiction - use location hints for US placement
      "location_hint": "wnam"  // Western North America
    }
  ]
}
```

**For FedRAMP Compliance (Enterprise Only)**:
```bash
wrangler d1 create medical-records --jurisdiction fedramp
```

**Benefits of Location Hints**:
- ✅ US regional placement (wnam/enam)
- ✅ Reduced latency for US users
- ⚠️ Not a compliance guarantee (consult legal counsel)

**Benefits of FedRAMP Jurisdiction** (Enterprise):
- ✅ Federal compliance certification
- ✅ Government-grade data security
- ✅ Strict data residency guarantees

#### Financial Services

**Note**: Use location hints for regional placement or fedramp for federal compliance.

```jsonc
// Banking app with regulatory requirements
{
  "d1_databases": [
    {
      "binding": "TRANSACTION_DB",
      "database_name": "transactions",
      "database_id": "...",
      "location_hint": "wnam"  // US placement (not jurisdiction)
    }
  ]
}
```

**For federal financial compliance**:
```bash
wrangler d1 create transactions --jurisdiction fedramp  # Enterprise only
```

**Regulations Addressed**:
- SOX (Sarbanes-Oxley Act)
- GLBA (Gramm-Leach-Bliley Act)
- PCI DSS (Payment Card Industry Data Security Standard)

### Performance Impact

**Latency Outside Jurisdiction** (~10-30ms):

| User Location | DB Jurisdiction | Expected P50 Latency | Impact |
|---------------|-----------------|---------------------|---------|
| Europe | eu | ~15ms | ✅ Optimal |
| Europe | (wnam hint) | ~40ms | ⚠️ +25ms cross-region |
| Europe | (no jurisdiction) | ~15ms | ✅ Optimal (location hints) |
| US East | (enam hint) | ~12ms | ✅ Optimal |
| US East | eu | ~35ms | ⚠️ +23ms cross-region |
| US East | (no jurisdiction) | ~12ms | ✅ Optimal (location hints) |

**Best Practice**: Use location hints (default) unless regulatory requirements mandate eu or fedramp jurisdiction.

### When to Use Each Jurisdiction

#### Use Location Hints (Default) When:
- ✅ No regulatory data residency requirements
- ✅ Users are globally distributed
- ✅ Performance is top priority
- ✅ Want Cloudflare to auto-optimize location based on traffic patterns

#### Use eu Jurisdiction When:
- ✅ GDPR compliance required (mandatory EU data residency)
- ✅ Majority of users in Europe
- ✅ Industry regulations mandate EU storage (healthcare, finance)
- ✅ Data processing agreements require EU residency guarantees

#### Use fedramp Jurisdiction When (Enterprise Only):
- ✅ Federal/government compliance required
- ✅ FedRAMP certification needed
- ✅ Serving US government agencies
- ✅ Strict federal data security requirements

#### For US Regional Placement (Without Jurisdiction):
- ✅ Use location hints: wnam (Western North America) or enam (Eastern North America)
- ⚠️ Not a compliance guarantee - consult legal counsel for HIPAA, SOX, GLBA
- ✅ Provides lower latency for US users without jurisdiction restrictions

### Verification

Check database jurisdiction via wrangler:

```bash
wrangler d1 info my-database
```

Output includes jurisdiction:
```plaintext
Database: my-database
UUID: abc123-def456-...
Location: EU  ← Jurisdiction
Version: ...
```

### Migration Considerations

**Cannot Change Jurisdiction After Creation**:

If jurisdiction needs to change, you must:
1. Create new database with desired jurisdiction
2. Export data from old database
3. Import data into new database
4. Update Worker bindings
5. Deploy updated Worker
6. Delete old database

```bash
# 1. Create new database with correct jurisdiction
wrangler d1 create my-database-eu --jurisdiction eu

# 2. Export data from old database
wrangler d1 export my-database --output=backup.sql

# 3. Import into new database
wrangler d1 execute my-database-eu --file=backup.sql

# 4. Update wrangler.jsonc with new database_id
# 5. Deploy Worker with new binding
wrangler deploy

# 6. After verifying, delete old database
wrangler d1 delete my-database
```

### Read Replication Interaction

Data localization works seamlessly with read replication:

- **Primary instance**: Stored in specified jurisdiction (eu/fedramp) or optimal location (if no jurisdiction set)
- **Read replicas**: Distributed globally across all 6 regions
- **Writes**: Always route to primary (in jurisdiction)
- **Reads**: Can route to nearest replica (regardless of jurisdiction)

**Example Configuration**:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database",
      "database_id": "...",
      "jurisdiction": "EU",            // Primary in EU
      "replicate": {
        "enabled": true                // Replicas in all 6 regions
      }
    }
  ]
}
```

**Result**:
- Writes stored in EU (compliant)
- Reads served from nearest replica globally (fast)
- Best of both: compliance + performance

---

## Summary Checklist

### Security ✅
- [ ] Always use `.prepare().bind()` for user input
- [ ] Use `null` instead of `undefined`
- [ ] Validate input before binding
- [ ] Never commit database IDs to public repos

### Performance ✅
- [ ] Use `.batch()` for multiple queries
- [ ] Create indexes on filtered columns
- [ ] Run `PRAGMA optimize` after schema changes
- [ ] Select only needed columns
- [ ] Always use `LIMIT`

### Migrations ✅
- [ ] Make migrations idempotent (IF NOT EXISTS)
- [ ] Never modify applied migrations
- [ ] Test locally before production
- [ ] Break large data migrations into batches

### Error Handling ✅
- [ ] Wrap queries in try/catch
- [ ] Implement retry logic for transient errors
- [ ] Check `result.success` and `meta.rows_written`
- [ ] Log errors with context

### Data Modeling ✅
- [ ] Use appropriate SQLite data types
- [ ] Store timestamps as Unix epoch (INTEGER)
- [ ] Use soft deletes (deleted_at column)
- [ ] Normalize related data with foreign keys

### Testing ✅
- [ ] Test migrations locally first
- [ ] Use separate development/production databases
- [ ] Backup before major migrations

### Deployment ✅
- [ ] Apply migrations before deploying code
- [ ] Use preview databases for testing
- [ ] Monitor query performance
- [ ] Use Time Travel for recovery

---

## Official Documentation

- **Best Practices**: https://developers.cloudflare.com/d1/best-practices/
- **Indexes**: https://developers.cloudflare.com/d1/best-practices/use-indexes/
- **Local Development**: https://developers.cloudflare.com/d1/best-practices/local-development/
- **Retry Queries**: https://developers.cloudflare.com/d1/best-practices/retry-queries/
- **Time Travel**: https://developers.cloudflare.com/d1/reference/time-travel/
