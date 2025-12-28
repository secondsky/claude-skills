# Cloudflare D1 Limits and Quotas

**Purpose**: Comprehensive D1 limits documentation for debugging and capacity planning

**Last Updated**: 2025-01-15

---

## Table of Contents

1. [Overview](#overview)
2. [Database Limits](#database-limits)
3. [Query Limits](#query-limits)
4. [Data Structure Constraints](#data-structure-constraints)
5. [Free Tier Enforcement (February 10, 2025)](#free-tier-enforcement-february-10-2025)
6. [Handling Limit Errors](#handling-limit-errors)
7. [Monitoring Limits](#monitoring-limits)
8. [Best Practices](#best-practices)

---

## Overview

D1 enforces limits based on account tier:
- **Free Plan**: Workers Free ($0/month)
- **Paid Plan**: Workers Paid ($5/month minimum)

**Critical Change**: Free tier hard limits enforced starting **February 10, 2025**. Previously warnings only; now returns errors.

---

## Database Limits

### Storage Quotas

| Limit | Free Tier | Paid Plan | Increasable? |
|-------|-----------|-----------|--------------|
| **Databases per account** | 10 | 50,000 | Yes (request increase) |
| **Maximum database size** | 500 MB | 10 GB | No (hard limit) |
| **Maximum account storage** | 5 GB | 1 TB | Yes (request increase) |
| **Maximum row size** | 2 MB | 2 MB | No |
| **String/BLOB size** | 2 MB | 2 MB | No |

**Important**:
- The 10 GB maximum database size **cannot be increased** (SQLite limitation)
- Account storage = sum of all database sizes
- Row size includes all columns combined (2 MB total)

### Time Travel Retention

| Tier | Retention | Restores per 10 min |
|------|-----------|---------------------|
| Free | 7 days | 10 |
| Paid | 30 days | 10 |

**Time Travel** allows point-in-time restore:
```bash
wrangler d1 time-travel restore my-database --timestamp=2025-01-15T14:30:00Z
```

---

## Query Limits

### Per-Invocation Limits

| Limit | Free Tier | Paid Plan |
|-------|-----------|-----------|
| **Queries per Worker invocation** | 50 | 1,000 |
| **Maximum SQL statement length** | 100 KB | 100 KB |
| **Maximum query duration** | 30 seconds | 30 seconds |
| **Bound parameters per query** | 100 | 100 |
| **SQL function arguments** | 32 | 32 |
| **Simultaneous connections** | 6 | 6 |

**Key Concepts**:

**Worker Invocation**: One execution of your Worker (one HTTP request = one invocation)
```typescript
// ❌ BAD: 55 queries in one invocation (exceeds free tier limit of 50)
export default {
  async fetch(request: Request, env: Env) {
    for (let i = 0; i < 55; i++) {
      await env.DB.prepare('INSERT INTO logs VALUES (?)').bind(i).run();
    }
  }
};
```

**Solution**: Use batch queries
```typescript
// ✅ GOOD: 1 batch query with 55 statements
export default {
  async fetch(request: Request, env: Env) {
    const statements = Array.from({ length: 55 }, (_, i) =>
      env.DB.prepare('INSERT INTO logs VALUES (?)').bind(i)
    );

    await env.DB.batch(statements);  // Counts as 1 query invocation
  }
};
```

### SQLite Variable Limit

**Critical**: SQLite has a hard limit of **999 variables** per statement:
```typescript
// ❌ FAILS: 1000+ bind parameters
const values = Array.from({ length: 500 }, (_, i) => `(?, ?)`).join(', ');
await env.DB.prepare(`INSERT INTO users (name, email) VALUES ${values}`).bind(...names, ...emails).run();
// Error: "too many SQL variables"
```

**Solution**: Batch in chunks of 100-400 rows
```typescript
// ✅ GOOD: Chunk into batches of 100 rows (200 variables)
const BATCH_SIZE = 100;
for (let i = 0; i < users.length; i += BATCH_SIZE) {
  const chunk = users.slice(i, i + BATCH_SIZE);
  const placeholders = chunk.map(() => '(?, ?)').join(', ');
  const values = chunk.flatMap(u => [u.name, u.email]);

  await env.DB.prepare(
    `INSERT INTO users (name, email) VALUES ${placeholders}`
  ).bind(...values).run();
}
```

---

## Data Structure Constraints

### Table Limits

| Limit | Value |
|-------|-------|
| **Columns per table** | 100 |
| **Rows per table** | Unlimited (subject to database size) |
| **LIKE/GLOB pattern length** | 50 bytes |

### Connection Limits

**Simultaneous connections**: 6 per Worker invocation

```typescript
// ✅ GOOD: Sequential queries (1 connection)
await env.DB.prepare('SELECT * FROM users').all();
await env.DB.prepare('SELECT * FROM posts').all();

// ✅ GOOD: Parallel queries (6 connections max)
await Promise.all([
  env.DB.prepare('SELECT * FROM users').all(),
  env.DB.prepare('SELECT * FROM posts').all(),
  env.DB.prepare('SELECT * FROM comments').all(),
  env.DB.prepare('SELECT * FROM likes').all(),
  env.DB.prepare('SELECT * FROM shares').all(),
  env.DB.prepare('SELECT * FROM follows').all(),
]);

// ⚠️ WARNING: 7+ parallel queries may hit connection limit
```

---

## Free Tier Enforcement (February 10, 2025)

### What Changed

**Before February 10, 2025**:
- Exceeding free tier limits → Warnings logged, queries still executed
- Soft enforcement (no hard errors)

**After February 10, 2025**:
- Exceeding free tier limits → **429 Too Many Requests** error
- Hard enforcement (queries fail)
- Daily reset at midnight UTC

### Limits Enforced

1. **Database count**: Maximum 10 databases
2. **Database size**: Maximum 500 MB per database
3. **Queries per invocation**: Maximum 50 queries per Worker execution

### Error Examples

**429 Error (Query Limit)**:
```typescript
// Request with 55 queries on free tier
// Error: D1_ERROR: Too many queries (50 per invocation on free plan)
```

**Database Full Error**:
```typescript
// Database at 501 MB on free tier
// Error: D1_ERROR: Database size limit exceeded (500 MB on free plan)
```

**Database Count Error**:
```bash
# Attempting to create 11th database on free tier
$ wrangler d1 create my-database-11
# Error: Account database limit reached (10 databases on free plan)
```

### Migration Guide

**If hitting limits**:

1. **Check current usage**:
   ```bash
   wrangler d1 list
   wrangler d1 info my-database
   ```

2. **Options**:
   - **Upgrade to paid plan** ($5/month) → 1,000 queries/invocation, 50,000 databases, 10 GB per database
   - **Optimize queries** → Use batching to reduce query count
   - **Archive old data** → Reduce database size
   - **Consolidate databases** → Merge databases if under 10 limit

3. **Implement query batching**:
   ```typescript
   // Before: 100 queries
   for (const user of users) {
     await env.DB.prepare('INSERT INTO users VALUES (?, ?)').bind(user.name, user.email).run();
   }

   // After: 1 batch query
   const statements = users.map(user =>
     env.DB.prepare('INSERT INTO users VALUES (?, ?)').bind(user.name, user.email)
   );
   await env.DB.batch(statements);
   ```

---

## Handling Limit Errors

### 429 Too Many Requests

**Error Message**: `D1_ERROR: Too many queries`

**Cause**: Exceeded 50 queries per invocation (free tier) or 1,000 queries (paid tier)

**Solutions**:

1. **Batch queries**:
   ```typescript
   // Instead of 100 separate queries, use 1 batch
   await env.DB.batch(statements);
   ```

2. **Implement query queue** (if upgrading to paid not feasible):
   ```typescript
   // Queue excess queries for next invocation
   const MAX_QUERIES = 50; // Free tier limit

   if (statements.length > MAX_QUERIES) {
     // Execute first batch
     await env.DB.batch(statements.slice(0, MAX_QUERIES));

     // Queue remaining for later (via Durable Objects or Queue)
     await queueForLater(statements.slice(MAX_QUERIES));
   } else {
     await env.DB.batch(statements);
   }
   ```

3. **Upgrade to paid plan**:
   ```bash
   # Increases limit from 50 → 1,000 queries per invocation
   # Visit Cloudflare dashboard → Workers & Pages → Plans
   ```

### Database Size Limit

**Error Message**: `D1_ERROR: Database size limit exceeded`

**Cause**: Database exceeds 500 MB (free) or 10 GB (paid)

**Solutions**:

1. **Archive old data**:
   ```sql
   -- Move old records to archive table (then export/delete)
   CREATE TABLE users_archive AS
   SELECT * FROM users WHERE created_at < unixepoch() - 31536000; -- 1 year ago

   DELETE FROM users WHERE created_at < unixepoch() - 31536000;

   PRAGMA optimize;
   ```

2. **Implement data retention policy**:
   ```typescript
   // Monthly cleanup job (via Cron Triggers)
   export default {
     async scheduled(event: ScheduledEvent, env: Env) {
       // Delete logs older than 90 days
       await env.DB.prepare(
         'DELETE FROM logs WHERE created_at < ?'
       ).bind(Date.now() - 90 * 24 * 60 * 60 * 1000).run();

       await env.DB.prepare('PRAGMA optimize').run();
     }
   };
   ```

3. **Split data across databases** (if under database count limit):
   ```typescript
   // Shard by time period
   // DB_2024: Historical data
   // DB_2025: Current data
   const year = new Date().getFullYear();
   const db = year === 2025 ? env.DB_2025 : env.DB_2024;
   ```

---

## Monitoring Limits

### Check Database Size

```bash
# View database info
wrangler d1 info my-database

# Output includes:
# - Total size (MB)
# - Number of tables
# - Last backup timestamp
```

### Monitor Query Usage

**Via Metrics Dashboard**:
1. Navigate to Cloudflare dashboard
2. Workers & Pages → D1
3. Select database → Metrics tab
4. View "Queries per Second" graph

**Via GraphQL API**:
```graphql
query GetD1Metrics($accountId: String!, $databaseId: String!) {
  viewer {
    accounts(filter: {accountTag: $accountId}) {
      d1AnalyticsAdaptiveGroups(
        filter: {databaseId: $databaseId}
        limit: 1000
      ) {
        dimensions { ts }
        sum { readQueries writeQueries }
      }
    }
  }
}
```

**Full monitoring guide**: Load `references/metrics-analytics.md`

### Track Approaching Limits

**Set up alerts**:
```typescript
// Example: Log warning if approaching query limit
let queryCount = 0;

export default {
  async fetch(request: Request, env: Env) {
    const MAX_QUERIES = 50; // Free tier
    const WARN_THRESHOLD = 40; // 80% of limit

    // Track query count
    queryCount++;

    if (queryCount > WARN_THRESHOLD) {
      console.warn(`Approaching query limit: ${queryCount}/${MAX_QUERIES}`);
    }

    if (queryCount > MAX_QUERIES) {
      return new Response('Query limit exceeded', { status: 429 });
    }

    // Execute query
    await env.DB.prepare('...').run();
  }
};
```

---

## Best Practices

### 1. Batch Operations

**Always batch multiple queries**:
```typescript
// ❌ BAD: 50 queries (hits free tier limit)
for (const user of users) {
  await env.DB.prepare('INSERT INTO users VALUES (?, ?)').bind(user.name, user.email).run();
}

// ✅ GOOD: 1 batch query
const statements = users.map(u =>
  env.DB.prepare('INSERT INTO users VALUES (?, ?)').bind(u.name, u.email)
);
await env.DB.batch(statements);
```

### 2. Use Pagination

**Avoid unbounded queries**:
```typescript
// ❌ BAD: Returns entire table (could be millions of rows)
const { results } = await env.DB.prepare('SELECT * FROM users').all();

// ✅ GOOD: Paginate with LIMIT and OFFSET
const page = parseInt(request.query('page') || '1');
const limit = 20;
const offset = (page - 1) * limit;

const { results } = await env.DB.prepare(
  'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
).bind(limit, offset).all();
```

### 3. Archive Old Data

**Implement retention policy**:
```sql
-- Monthly cleanup (via Cron Trigger)
DELETE FROM logs WHERE created_at < unixepoch() - 7776000; -- 90 days

PRAGMA optimize;
```

### 4. Monitor Metrics

**Check dashboard weekly**:
- Database size trending
- Query rate spikes
- Error rate (429 errors)

### 5. Plan for Growth

**Estimate when to upgrade**:
- **Query count**: If regularly exceeding 40 queries/invocation → upgrade soon
- **Database size**: If >400 MB on free tier → plan upgrade or archival
- **Database count**: If >8 databases → consider consolidation or upgrade

---

## Throughput Characteristics

**Key Insight**: Each D1 database is single-threaded and processes queries sequentially.

**Maximum throughput**:
- **1ms queries** → ~1,000 queries/second
- **10ms queries** → ~100 queries/second
- **100ms queries** → ~10 queries/second

**Optimization**:
- Optimize queries to reduce duration (see `references/query-patterns.md`)
- Use read replicas for read-heavy workloads (see `references/read-replication.md`)
- Consider caching frequently accessed data (KV, Durable Objects)

---

## References

- **Official Limits Documentation**: https://developers.cloudflare.com/d1/platform/limits/
- **Pricing**: https://developers.cloudflare.com/workers/platform/pricing/
- **Query Patterns**: `references/query-patterns.md`
- **Metrics & Analytics**: `references/metrics-analytics.md`
- **Best Practices**: `references/best-practices.md`

---

**Questions about limits?**

1. Check current usage: `wrangler d1 list` and `wrangler d1 info <database-name>`
2. Review metrics dashboard for query trends
3. If approaching limits, implement batching or plan upgrade
4. For quota increase requests, contact Cloudflare support
