# Cloudflare Workers KV - Migration Guide

Complete guide for migrating to Workers KV from various storage solutions.

---

## Table of Contents

1. [From localStorage/sessionStorage](#from-localstoragesessionstorage)
2. [From Redis](#from-redis)
3. [From D1 Database](#from-d1-database)
4. [From R2 Object Storage](#from-r2-object-storage)
5. [From Other KV Solutions](#from-other-kv-solutions)
6. [Testing Migration](#testing-migration)
7. [Rollback Procedures](#rollback-procedures)
8. [Production Cutover](#production-cutover)

---

## From localStorage/sessionStorage

### Why Migrate?

**Current limitations**:
- Client-side only (not accessible from server)
- 5-10MB storage limit per domain
- No cross-device synchronization
- Browser-dependent (can be cleared)
- No server-side validation

**KV advantages**:
- Global edge storage
- Accessible from Workers (server-side)
- 25MB per value (unlimited total)
- Cross-device sync via Workers
- TTL-based expiration
- Server-side validation and security

### Migration Strategy

**1. Identify Data to Migrate**

```typescript
// Client-side analysis
const localStorageKeys = Object.keys(localStorage);
const sessionStorageKeys = Object.keys(sessionStorage);

console.log('localStorage items:', localStorageKeys.length);
console.log('sessionStorage items:', sessionStorageKeys.length);

// Analyze size
let totalSize = 0;
localStorageKeys.forEach(key => {
  totalSize += localStorage.getItem(key)?.length || 0;
});
console.log('Total localStorage size:', totalSize, 'bytes');
```

**2. Create Migration Worker**

```typescript
import { Hono } from 'hono';

type Bindings = {
  USER_DATA: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// Migration endpoint
app.post('/migrate', async (c) => {
  const { userId, data } = await c.req.json();

  // Validate data
  if (!userId || !data) {
    return c.json({ error: 'Missing userId or data' }, 400);
  }

  // Migrate each localStorage item to KV
  for (const [key, value] of Object.entries(data)) {
    await c.env.USER_DATA.put(
      `user:${userId}:${key}`,
      JSON.stringify(value),
      {
        expirationTtl: 86400 * 30, // 30 days
        metadata: {
          migratedAt: Date.now(),
          source: 'localStorage'
        }
      }
    );
  }

  return c.json({
    success: true,
    itemsMigrated: Object.keys(data).length
  });
});

// Read endpoint (replaces localStorage.getItem)
app.get('/data/:userId/:key', async (c) => {
  const { userId, key } = c.req.param();
  const value = await c.env.USER_DATA.get(`user:${userId}:${key}`, 'json');

  if (!value) {
    return c.json({ error: 'Not found' }, 404);
  }

  return c.json({ value });
});

export default app;
```

**3. Client-Side Migration Script**

```typescript
// Run once per user to migrate data
async function migrateToKV(userId: string) {
  // Collect all localStorage data
  const data: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '');
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }

  // Send to migration endpoint
  const response = await fetch('/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, data })
  });

  if (response.ok) {
    console.log('Migration successful!');
    // Optionally clear localStorage after successful migration
    // localStorage.clear();
  }
}
```

**4. Update Application Code**

```typescript
// Before (localStorage)
localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme');

// After (KV via Worker API)
await fetch('/data/user123/theme', {
  method: 'PUT',
  body: JSON.stringify({ value: 'dark' })
});

const response = await fetch('/data/user123/theme');
const { value: theme } = await response.json();
```

---

## From Redis

### Why Migrate?

**Redis strengths**:
- In-memory speed
- Complex data structures (sets, sorted sets, etc.)
- Pub/Sub
- Atomic operations
- Strong consistency

**When to use KV instead**:
- Read-heavy workloads (KV has cacheTtl)
- Global edge distribution needed
- Don't need atomic operations
- Don't need complex data structures
- Cost optimization (Redis hosting can be expensive)

**When NOT to migrate**:
- Need atomic operations (INCR, etc.)
- Need complex data structures (sorted sets, etc.)
- Need strong consistency
- Need Pub/Sub
- Write-heavy workloads

### Migration Strategy

**1. Analyze Redis Usage**

```bash
# Connect to Redis
redis-cli

# Check data types
KEYS *
TYPE user:123:preferences
TYPE counter:*

# Identify patterns
SCAN 0 MATCH user:* COUNT 1000
```

**2. Compatible Patterns**

```typescript
// ✅ Simple key-value (easy migration)
// Redis
await redis.set('config', JSON.stringify(config));
const config = JSON.parse(await redis.get('config'));

// KV
await env.KV.put('config', JSON.stringify(config));
const config = await env.KV.get('config', 'json');

// ✅ TTL expiration (easy migration)
// Redis
await redis.setex('session:123', 3600, sessionData);

// KV
await env.KV.put('session:123', sessionData, {
  expirationTtl: 3600
});

// ✅ Key prefix patterns (easy migration)
// Redis
await redis.keys('user:*');

// KV
await env.KV.list({ prefix: 'user:' });
```

**3. Incompatible Patterns (Need Workarounds)**

```typescript
// ❌ Atomic increment (use Durable Objects instead)
// Redis
await redis.incr('counter');

// KV workaround (not atomic, eventual consistency issues)
const count = parseInt(await env.KV.get('counter') || '0');
await env.KV.put('counter', String(count + 1));

// ✅ Better: Use Durable Objects for counters
export class Counter {
  state: DurableObjectState;
  count = 0;

  async increment() {
    this.count++;
    await this.state.storage.put('count', this.count);
    return this.count;
  }
}

// ❌ Sorted sets (use D1 instead)
// Redis
await redis.zadd('leaderboard', score, userId);

// D1
await env.DB.prepare(`
  INSERT INTO leaderboard (user_id, score)
  VALUES (?, ?)
  ON CONFLICT (user_id) DO UPDATE SET score = ?
`).bind(userId, score, score).run();

// ❌ Pub/Sub (use Queues or Durable Objects)
// Redis
redis.subscribe('notifications');

// Cloudflare Queues
await env.QUEUE.send({ type: 'notification', data });
```

**4. Migration Worker**

```typescript
import { Hono } from 'hono';
import { Redis } from '@upstash/redis';

type Bindings = {
  KV: KVNamespace;
  REDIS_URL: string;
  REDIS_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/migrate-redis', async (c) => {
  const redis = new Redis({
    url: c.env.REDIS_URL,
    token: c.env.REDIS_TOKEN
  });

  let cursor = '0';
  let migrated = 0;

  do {
    // Scan Redis keys
    const [newCursor, keys] = await redis.scan(cursor, {
      match: '*',
      count: 100
    });
    cursor = newCursor;

    // Migrate each key
    for (const key of keys) {
      const value = await redis.get(key);
      const ttl = await redis.ttl(key);

      if (value) {
        const options: any = {};
        if (ttl > 0) {
          options.expirationTtl = ttl;
        }

        await c.env.KV.put(key, value, options);
        migrated++;
      }
    }
  } while (cursor !== '0');

  return c.json({ migrated });
});

export default app;
```

---

## From D1 Database

### Why Migrate?

**D1 strengths**:
- SQL queries
- Relational data
- Transactions
- Strong consistency
- Joins

**When to use KV instead**:
- Simple key-value lookups
- No relational requirements
- Read-heavy workloads
- Don't need transactions
- Global edge caching needed

**When NOT to migrate**:
- Need SQL queries
- Need relationships/joins
- Need transactions
- Need strong consistency
- Need complex filtering

### Migration Strategy

**1. Identify Non-Relational Data**

```sql
-- Good candidates for KV
SELECT * FROM config WHERE key = ?;  -- Simple key-value
SELECT * FROM user_preferences WHERE user_id = ?;  -- User-specific data
SELECT * FROM cache WHERE key = ?;  -- Already cache-like

-- Bad candidates (keep in D1)
SELECT u.*, p.* FROM users u JOIN posts p ON u.id = p.user_id;  -- Relations
SELECT * FROM orders WHERE status = 'pending' AND created_at > ?;  -- Complex queries
```

**2. Extract Data from D1**

```typescript
// Export config table to KV
const configs = await env.DB.prepare('SELECT key, value FROM config').all();

for (const row of configs.results) {
  await env.KV.put(
    `config:${row.key}`,
    row.value,
    {
      metadata: { migratedFrom: 'd1', table: 'config' }
    }
  );
}
```

**3. Dual-Write Pattern (Safe Migration)**

```typescript
// During migration, write to both D1 and KV
async function setConfig(key: string, value: string) {
  // Write to D1 (source of truth during migration)
  await env.DB.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)')
    .bind(key, value)
    .run();

  // Also write to KV
  await env.KV.put(`config:${key}`, value);
}

// Read from KV, fallback to D1
async function getConfig(key: string) {
  // Try KV first (faster)
  let value = await env.KV.get(`config:${key}`);

  if (!value) {
    // Fallback to D1
    const result = await env.DB.prepare('SELECT value FROM config WHERE key = ?')
      .bind(key)
      .first();

    if (result) {
      value = result.value as string;
      // Backfill KV
      await env.KV.put(`config:${key}`, value);
    }
  }

  return value;
}
```

**4. Validate and Cutover**

```typescript
// Validation script
async function validateMigration() {
  const d1Configs = await env.DB.prepare('SELECT key, value FROM config').all();
  let mismatches = 0;

  for (const row of d1Configs.results) {
    const kvValue = await env.KV.get(`config:${row.key}`);
    if (kvValue !== row.value) {
      console.error(`Mismatch for ${row.key}: D1=${row.value}, KV=${kvValue}`);
      mismatches++;
    }
  }

  return { total: d1Configs.results.length, mismatches };
}
```

---

## From R2 Object Storage

### Why Migrate?

**R2 strengths**:
- Large files (up to 5 TB)
- S3-compatible API
- Multipart uploads
- No egress fees

**When to use KV instead**:
- Small values (<25 MB)
- Metadata-heavy operations
- Need TTL expiration
- Need list operations
- Read-heavy with edge caching

**When NOT to migrate**:
- Files >25 MB
- Need S3 compatibility
- Need multipart uploads
- Binary files (images, videos, PDFs)

### Migration Strategy

**Use KV for metadata, R2 for files**:

```typescript
// Store large file in R2
await env.R2.put('uploads/file.pdf', fileData);

// Store metadata in KV
await env.KV.put('file:metadata:file.pdf', JSON.stringify({
  r2Key: 'uploads/file.pdf',
  size: fileData.size,
  type: 'application/pdf',
  uploadedAt: Date.now()
}), {
  metadata: { source: 'r2-migration' }
});

// Retrieve
const metadata = await env.KV.get('file:metadata:file.pdf', 'json');
const file = await env.R2.get(metadata.r2Key);
```

---

## Testing Migration

### Pre-Migration Checklist

- [ ] Identify all data to migrate
- [ ] Map Redis/D1 patterns to KV equivalents
- [ ] Create migration scripts
- [ ] Set up dual-write if needed
- [ ] Create validation scripts
- [ ] Test in preview environment

### Validation Script

```typescript
async function validateMigration(env: Bindings) {
  const errors: string[] = [];

  // Test 1: Verify data integrity
  const sampleKeys = ['config:theme', 'user:123:preferences'];
  for (const key of sampleKeys) {
    const value = await env.KV.get(key);
    if (!value) {
      errors.push(`Missing key: ${key}`);
    }
  }

  // Test 2: Verify TTL
  const ttlKey = 'session:test';
  await env.KV.put(ttlKey, 'test', { expirationTtl: 60 });
  const ttlValue = await env.KV.get(ttlKey);
  if (!ttlValue) {
    errors.push('TTL test failed');
  }

  // Test 3: Verify metadata
  const { value, metadata } = await env.KV.getWithMetadata('config:theme');
  if (!metadata?.migratedFrom) {
    errors.push('Metadata missing on migrated keys');
  }

  return { success: errors.length === 0, errors };
}
```

---

## Rollback Procedures

### Immediate Rollback

If issues occur during migration:

```typescript
// Stop dual-write, revert to source
async function rollback() {
  // 1. Switch reads back to source (Redis/D1)
  // 2. Stop writing to KV
  // 3. Log rollback event

  console.log('Rolling back to source system');

  // Example: Revert to D1
  async function getConfig(key: string) {
    // Read from D1 only
    const result = await env.DB.prepare('SELECT value FROM config WHERE key = ?')
      .bind(key)
      .first();
    return result?.value;
  }
}
```

### Data Preservation

```typescript
// Before deleting source data, verify KV
async function safeDelete() {
  const d1Count = await env.DB.prepare('SELECT COUNT(*) as count FROM config').first();
  const kvCount = (await env.KV.list()).keys.length;

  if (kvCount < d1Count.count) {
    throw new Error('KV has fewer records than D1. Aborting deletion.');
  }

  console.log('Safe to delete source data');
}
```

---

## Production Cutover

### Cutover Checklist

**Pre-Cutover** (1 week before):
- [ ] Complete all data migration
- [ ] Validate data integrity
- [ ] Test application with KV
- [ ] Set up monitoring
- [ ] Document rollback procedure
- [ ] Schedule maintenance window

**During Cutover**:
- [ ] Enable dual-write mode
- [ ] Monitor error rates
- [ ] Verify read performance
- [ ] Check data consistency
- [ ] Monitor KV metrics in dashboard

**Post-Cutover** (1 week after):
- [ ] Disable dual-write (KV only)
- [ ] Monitor for issues
- [ ] Verify cost savings
- [ ] Archive source data
- [ ] Update documentation

### Monitoring During Cutover

```typescript
// Add logging to track migration
async function getConfigWithLogging(key: string) {
  const start = Date.now();

  // Try KV
  const kvValue = await env.KV.get(`config:${key}`);
  const kvTime = Date.now() - start;

  // Log performance
  console.log({
    key,
    source: kvValue ? 'kv' : 'fallback',
    latency: kvTime,
    timestamp: Date.now()
  });

  return kvValue;
}
```

### Success Metrics

Monitor these metrics:

- **Latency**: KV reads should be <50ms (with cacheTtl: <5ms)
- **Error rate**: Should be <0.1%
- **Cache hit rate**: >90% for frequently accessed keys
- **Cost**: Compare KV operations cost vs source system
- **Data consistency**: 100% match between source and KV

---

## Common Migration Patterns

### Pattern 1: User Preferences

```typescript
// Before (D1)
const prefs = await env.DB.prepare(
  'SELECT * FROM user_preferences WHERE user_id = ?'
).bind(userId).first();

// After (KV)
const prefs = await env.KV.get(`user:${userId}:preferences`, 'json');
```

### Pattern 2: Configuration

```typescript
// Before (Redis)
const config = await redis.get('app:config');

// After (KV with cacheTtl)
const config = await env.KV.get('app:config', {
  type: 'json',
  cacheTtl: 300 // Cache for 5 minutes
});
```

### Pattern 3: Session Management

```typescript
// Before (Redis with TTL)
await redis.setex(`session:${sessionId}`, 3600, sessionData);

// After (KV with expirationTtl)
await env.KV.put(`session:${sessionId}`, sessionData, {
  expirationTtl: 3600
});
```

---

**Last Updated**: 2025-12-27
**Related**: `troubleshooting.md`, `best-practices.md`, `limits-quotas.md`
