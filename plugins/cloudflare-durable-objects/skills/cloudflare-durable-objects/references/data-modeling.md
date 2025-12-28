# Data Modeling for Durable Objects

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27
**Official Docs**: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/

## Overview

Comprehensive guide to SQL schema design, indexing, and data modeling patterns for Durable Objects with SQLite storage.

**Storage Limits**:
- Maximum 1GB per Durable Object instance
- SQL API uses SQLite backend
- ACID transactions supported
- Full SQL features (JOINs, indexes, triggers, etc.)

---

## Schema Design Patterns

### Single-Table Pattern

Best for simple use cases with minimal relationships:

```typescript
export class Counter extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS counters (
          name TEXT PRIMARY KEY,
          value INTEGER NOT NULL DEFAULT 0,
          updated_at INTEGER NOT NULL
        )
      `);

      // Create index for timestamp queries
      ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_counters_updated
        ON counters(updated_at DESC)
      `);
    });
  }
}
```

### Multi-Table Normalized Pattern

For complex relationships:

```typescript
export class ChatRoom extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      // Users table
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          joined_at INTEGER NOT NULL,
          last_active INTEGER NOT NULL
        )
      `);

      // Messages table with foreign key
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          text TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Indexes
      ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_messages_timestamp
        ON messages(timestamp DESC)
      `);

      ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_messages_user
        ON messages(user_id, timestamp DESC)
      `);
    });
  }
}
```

### Denormalized Pattern for Performance

Trade storage for query speed:

```typescript
export class Analytics extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      // Denormalized: Store user data with each event
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          user_name TEXT NOT NULL,      -- Denormalized
          user_email TEXT NOT NULL,     -- Denormalized
          event_type TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          data TEXT
        )
      `);

      // Single index covers common queries
      ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_events_user_timestamp
        ON events(user_id, timestamp DESC)
      `);
    });
  }
}
```

---

## Index Strategies

### Covering Indexes

Create indexes that include all columns needed by queries:

```typescript
// Query: SELECT user_id, text FROM messages WHERE timestamp > ? ORDER BY timestamp
ctx.storage.sql.exec(`
  CREATE INDEX idx_messages_timestamp_covering
  ON messages(timestamp DESC, user_id, text)
`);

// This query uses index-only scan (faster)
const recent = ctx.storage.sql.exec(`
  SELECT user_id, text
  FROM messages
  WHERE timestamp > ?
  ORDER BY timestamp DESC
  LIMIT 100
`, cutoffTime).toArray();
```

### Composite Indexes for Multi-Column Queries

```typescript
// Bad: Separate indexes
ctx.storage.sql.exec(`CREATE INDEX idx_user ON events(user_id)`);
ctx.storage.sql.exec(`CREATE INDEX idx_type ON events(event_type)`);

// Good: Composite index
ctx.storage.sql.exec(`
  CREATE INDEX idx_user_type_timestamp
  ON events(user_id, event_type, timestamp DESC)
`);

// Efficient query using composite index
const userEvents = ctx.storage.sql.exec(`
  SELECT * FROM events
  WHERE user_id = ? AND event_type = ?
  ORDER BY timestamp DESC
`, userId, eventType).toArray();
```

### Partial Indexes for Filtered Queries

```typescript
// Only index active users
ctx.storage.sql.exec(`
  CREATE INDEX idx_active_users
  ON users(last_active DESC)
  WHERE active = 1
`);

// Only index recent messages
ctx.storage.sql.exec(`
  CREATE INDEX idx_recent_messages
  ON messages(timestamp DESC)
  WHERE timestamp > 1704067200000  -- After 2024-01-01
`);
```

---

## Transaction Patterns

### Basic Transaction

```typescript
async updateBalance(userId: string, amount: number): Promise<void> {
  this.ctx.storage.sql.exec("BEGIN");

  try {
    // Get current balance
    const result = this.ctx.storage.sql.exec(
      "SELECT balance FROM accounts WHERE user_id = ?",
      userId
    ).one<{ balance: number }>();

    const newBalance = (result?.balance ?? 0) + amount;

    if (newBalance < 0) {
      throw new Error("Insufficient balance");
    }

    // Update balance
    this.ctx.storage.sql.exec(
      "UPDATE accounts SET balance = ? WHERE user_id = ?",
      newBalance,
      userId
    );

    // Log transaction
    this.ctx.storage.sql.exec(
      "INSERT INTO transactions (user_id, amount, timestamp) VALUES (?, ?, ?)",
      userId,
      amount,
      Date.now()
    );

    this.ctx.storage.sql.exec("COMMIT");
  } catch (error) {
    this.ctx.storage.sql.exec("ROLLBACK");
    throw error;
  }
}
```

### Optimistic Locking with Versions

```typescript
async updateDocument(docId: string, content: string): Promise<void> {
  this.ctx.storage.sql.exec("BEGIN");

  try {
    // Get current version
    const doc = this.ctx.storage.sql.exec(
      "SELECT version FROM documents WHERE id = ?",
      docId
    ).one<{ version: number }>();

    if (!doc) {
      throw new Error("Document not found");
    }

    const newVersion = doc.version + 1;

    // Update with version check
    const result = this.ctx.storage.sql.exec(
      "UPDATE documents SET content = ?, version = ? WHERE id = ? AND version = ?",
      content,
      newVersion,
      docId,
      doc.version
    );

    if (result.changes === 0) {
      throw new Error("Document was modified by another process");
    }

    this.ctx.storage.sql.exec("COMMIT");
  } catch (error) {
    this.ctx.storage.sql.exec("ROLLBACK");
    throw error;
  }
}
```

---

## State Size Optimization

### Pagination to Manage Large Datasets

```typescript
async getMessagesPaginated(
  limit: number = 100,
  cursor?: number
): Promise<{ messages: any[]; nextCursor?: number }> {
  const messages = this.ctx.storage.sql.exec(`
    SELECT id, user_id, text, timestamp
    FROM messages
    WHERE timestamp < ?
    ORDER BY timestamp DESC
    LIMIT ?
  `, cursor ?? Date.now(), limit + 1).toArray();

  const hasMore = messages.length > limit;
  const results = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: results,
    nextCursor: hasMore ? (results[results.length - 1] as any).timestamp : undefined,
  };
}
```

### Archiving Old Data

```typescript
async archiveOldMessages(cutoffDays: number): Promise<number> {
  const cutoffTime = Date.now() - (cutoffDays * 24 * 60 * 60 * 1000);

  // Copy to archive table
  this.ctx.storage.sql.exec(`
    INSERT INTO messages_archive
    SELECT * FROM messages
    WHERE timestamp < ?
  `, cutoffTime);

  // Delete from main table
  const result = this.ctx.storage.sql.exec(`
    DELETE FROM messages
    WHERE timestamp < ?
  `, cutoffTime);

  return result.changes;
}
```

### Data Compression

```typescript
async storeCompressedData(key: string, data: any): Promise<void> {
  const json = JSON.stringify(data);

  // Simple compression: store as base64 if large
  const compressed = json.length > 1000
    ? btoa(json)  // In real app, use actual compression
    : json;

  const isCompressed = compressed.length < json.length;

  this.ctx.storage.sql.exec(`
    INSERT OR REPLACE INTO data (key, value, compressed)
    VALUES (?, ?, ?)
  `, key, compressed, isCompressed ? 1 : 0);
}
```

---

## TTL Patterns with Alarms

### Automatic Expiration

```typescript
export class CacheDO extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER NOT NULL
        )
      `);

      ctx.storage.sql.exec(`
        CREATE INDEX idx_cache_expires
        ON cache(expires_at)
      `);

      // Schedule next cleanup
      this.scheduleCleanup();
    });
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000);

    this.ctx.storage.sql.exec(`
      INSERT OR REPLACE INTO cache (key, value, expires_at)
      VALUES (?, ?, ?)
    `, key, JSON.stringify(value), expiresAt);
  }

  async get(key: string): Promise<any | null> {
    const result = this.ctx.storage.sql.exec(`
      SELECT value FROM cache
      WHERE key = ? AND expires_at > ?
    `, key, Date.now()).one<{ value: string }>();

    return result ? JSON.parse(result.value) : null;
  }

  private async scheduleCleanup(): Promise<void> {
    // Run cleanup every hour
    await this.ctx.storage.setAlarm(Date.now() + 3600_000);
  }

  async alarm(): Promise<void> {
    // Delete expired entries
    const result = this.ctx.storage.sql.exec(`
      DELETE FROM cache WHERE expires_at < ?
    `, Date.now());

    console.log(`Cleaned up ${result.changes} expired entries`);

    // Schedule next cleanup
    await this.scheduleCleanup();
  }
}
```

### TTL with Grace Period

```typescript
async set(key: string, value: any, ttlSeconds: number): Promise<void> {
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  const gracePeriodEnds = expiresAt + (300 * 1000); // +5 minutes

  this.ctx.storage.sql.exec(`
    INSERT OR REPLACE INTO cache (key, value, expires_at, grace_period_ends)
    VALUES (?, ?, ?, ?)
  `, key, JSON.stringify(value), expiresAt, gracePeriodEnds);
}

async get(key: string, allowGracePeriod: boolean = false): Promise<any | null> {
  const now = Date.now();

  const query = allowGracePeriod
    ? `SELECT value, expires_at < ? as expired FROM cache WHERE key = ? AND grace_period_ends > ?`
    : `SELECT value FROM cache WHERE key = ? AND expires_at > ?`;

  const result = this.ctx.storage.sql.exec(
    query,
    ...(allowGracePeriod ? [now, key, now] : [key, now])
  ).one();

  if (!result) return null;

  if (allowGracePeriod && (result as any).expired) {
    // Trigger background refresh
    this.ctx.waitUntil(this.refreshKey(key));
  }

  return JSON.parse((result as any).value);
}
```

---

## Cursor-Based Pagination

### Efficient Pagination Pattern

```typescript
interface PaginationOptions {
  limit?: number;
  cursor?: string;
  direction?: 'forward' | 'backward';
}

async getMessages(options: PaginationOptions = {}): Promise<{
  messages: any[];
  nextCursor?: string;
  prevCursor?: string;
}> {
  const limit = options.limit ?? 50;
  const direction = options.direction ?? 'forward';

  let query: string;
  let params: any[];

  if (!options.cursor) {
    // First page
    query = `
      SELECT id, user_id, text, timestamp
      FROM messages
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    params = [limit + 1];
  } else {
    const cursorTimestamp = parseInt(options.cursor, 10);

    if (direction === 'forward') {
      query = `
        SELECT id, user_id, text, timestamp
        FROM messages
        WHERE timestamp < ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;
      params = [cursorTimestamp, limit + 1];
    } else {
      query = `
        SELECT id, user_id, text, timestamp
        FROM messages
        WHERE timestamp > ?
        ORDER BY timestamp ASC
        LIMIT ?
      `;
      params = [cursorTimestamp, limit + 1];
    }
  }

  const results = this.ctx.storage.sql.exec(query, ...params).toArray();

  const hasMore = results.length > limit;
  const messages = hasMore ? results.slice(0, limit) : results;

  if (direction === 'backward') {
    messages.reverse();
  }

  return {
    messages,
    nextCursor: hasMore && messages.length > 0
      ? (messages[messages.length - 1] as any).timestamp.toString()
      : undefined,
    prevCursor: messages.length > 0
      ? (messages[0] as any).timestamp.toString()
      : undefined,
  };
}
```

---

## Schema Migration Patterns

### Versioned Migrations

```typescript
export class VersionedDO extends DurableObject {
  private readonly CURRENT_VERSION = 3;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      await this.runMigrations();
    });
  }

  private async runMigrations(): Promise<void> {
    // Get current version
    const versionResult = this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      )
    `);

    const currentVersion = this.ctx.storage.sql.exec(`
      SELECT MAX(version) as version FROM schema_version
    `).one<{ version: number }>();

    const version = currentVersion?.version ?? 0;

    // Run migrations sequentially
    if (version < 1) {
      await this.migration_v1();
    }
    if (version < 2) {
      await this.migration_v2();
    }
    if (version < 3) {
      await this.migration_v3();
    }
  }

  private async migration_v1(): Promise<void> {
    this.ctx.storage.sql.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);

    this.ctx.storage.sql.exec(`
      INSERT INTO schema_version (version, applied_at)
      VALUES (1, ?)
    `, Date.now());
  }

  private async migration_v2(): Promise<void> {
    // Add email column
    this.ctx.storage.sql.exec(`
      ALTER TABLE users ADD COLUMN email TEXT
    `);

    this.ctx.storage.sql.exec(`
      INSERT INTO schema_version (version, applied_at)
      VALUES (2, ?)
    `, Date.now());
  }

  private async migration_v3(): Promise<void> {
    // Add index on email
    this.ctx.storage.sql.exec(`
      CREATE INDEX idx_users_email ON users(email)
    `);

    this.ctx.storage.sql.exec(`
      INSERT INTO schema_version (version, applied_at)
      VALUES (3, ?)
    `, Date.now());
  }
}
```

---

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: No Indexes

```typescript
// BAD: No index on frequently queried column
ctx.storage.sql.exec(`
  CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )
`);

// Query will be slow
const messages = ctx.storage.sql.exec(`
  SELECT * FROM messages WHERE user_id = ?
`, userId).toArray();

// GOOD: Add index
ctx.storage.sql.exec(`
  CREATE INDEX idx_messages_user ON messages(user_id)
`);
```

### ❌ Anti-Pattern 2: SELECT * When Not Needed

```typescript
// BAD: Fetches all columns
const messages = ctx.storage.sql.exec(`
  SELECT * FROM messages WHERE user_id = ?
`, userId).toArray();

// GOOD: Fetch only needed columns
const messages = ctx.storage.sql.exec(`
  SELECT id, text, timestamp FROM messages WHERE user_id = ?
`, userId).toArray();
```

### ❌ Anti-Pattern 3: N+1 Queries

```typescript
// BAD: N+1 query pattern
const users = ctx.storage.sql.exec(`SELECT id FROM users`).toArray();

for (const user of users) {
  const messages = ctx.storage.sql.exec(`
    SELECT * FROM messages WHERE user_id = ?
  `, (user as any).id).toArray();
  // Process messages
}

// GOOD: Single JOIN query
const results = ctx.storage.sql.exec(`
  SELECT u.id, u.name, m.id as message_id, m.text
  FROM users u
  LEFT JOIN messages m ON u.id = m.user_id
`).toArray();
```

### ❌ Anti-Pattern 4: Unbounded Queries

```typescript
// BAD: No LIMIT (could return millions of rows)
const messages = ctx.storage.sql.exec(`
  SELECT * FROM messages ORDER BY timestamp DESC
`).toArray();

// GOOD: Always use LIMIT
const messages = ctx.storage.sql.exec(`
  SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100
`).toArray();
```

---

## Best Practices Summary

✅ **DO**:
- Create indexes for all foreign keys
- Use composite indexes for multi-column queries
- Implement pagination for large result sets
- Use transactions for multi-step updates
- Schedule alarms for TTL/cleanup
- Version your schema migrations
- Fetch only needed columns
- Use LIMIT on all queries

❌ **DON'T**:
- SELECT * without LIMIT
- Create indexes on every column
- Store large blobs in SQL (use R2/KV instead)
- Skip transaction rollback handling
- Forget to schedule next alarm
- Use unbounded WHERE IN clauses
- Nest transactions

---

## Sources

- [SQLite Storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/)
- [Storage API](https://developers.cloudflare.com/durable-objects/api/storage-api/)
- [Alarms API](https://developers.cloudflare.com/durable-objects/api/alarms/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
