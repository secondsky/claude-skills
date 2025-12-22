# Cross-Shard Query Patterns

**Last Updated**: 2025-12-15

Patterns for executing queries across multiple shards: scatter-gather, aggregations, joins, and pagination.

---

## Scatter-Gather Pattern

Query all shards in parallel and combine results.

```typescript
async function scatterGather(router: ShardRouter, sql: string, params: any[]) {
  // Execute on all shards in parallel
  const shardResults = await Promise.all(
    router.getAllShards().map(shard =>
      shard.query(sql, params).catch(err => ({ error: err, rows: [] }))
    )
  );

  // Filter errors and combine results
  const errors = shardResults.filter(r => r.error);
  if (errors.length > 0) {
    console.error('Shard errors:', errors);
  }

  return shardResults.flatMap(r => r.rows || []);
}

// Usage
const allActiveUsers = await scatterGather(
  router,
  'SELECT * FROM users WHERE status = $1',
  ['active']
);
```

---

## Cross-Shard Aggregations

**⚠️ SECURITY WARNING**: The examples below use string interpolation for table/column names for readability. In production code, **always validate identifiers** against a whitelist before using them in SQL queries. Never pass user-controlled strings directly to these parameters without validation.

```typescript
/**
 * Validate SQL identifiers to prevent injection attacks.
 * Only allows alphanumeric characters and underscores.
 */
function validateIdentifier(name: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return name;
}

/**
 * Quote SQL identifiers using driver-specific quoting.
 * Example for PostgreSQL - use your driver's built-in method in production.
 */
function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
```

### COUNT Across Shards

```typescript
async function countAcrossShards(router: ShardRouter, table: string, where: string, params: any[]) {
  // Validate table name to prevent SQL injection
  const safeTable = quoteIdentifier(validateIdentifier(table));

  // Note: 'where' should be a parameterized clause, not user-controlled SQL
  // For production, use a query builder that handles WHERE clause construction safely
  const counts = await Promise.all(
    router.getAllShards().map(shard =>
      shard.query(`SELECT COUNT(*) as count FROM ${safeTable} WHERE ${where}`, params)
    )
  );

  return counts.reduce((total, result) => total + parseInt(result.rows[0].count), 0);
}

// Usage
const totalActiveUsers = await countAcrossShards(router, 'users', 'status = $1', ['active']);
```

### SUM/AVG Across Shards

```typescript
async function sumAcrossShards(router: ShardRouter, table: string, column: string, where: string, params: any[]) {
  // Validate identifiers to prevent SQL injection
  const safeTable = quoteIdentifier(validateIdentifier(table));
  const safeColumn = quoteIdentifier(validateIdentifier(column));

  const sums = await Promise.all(
    router.getAllShards().map(shard =>
      shard.query(`SELECT SUM(${safeColumn}) as sum, COUNT(*) as count FROM ${safeTable} WHERE ${where}`, params)
    )
  );

  const totalSum = sums.reduce((total, result) => total + parseFloat(result.rows[0].sum || 0), 0);
  const totalCount = sums.reduce((total, result) => total + parseInt(result.rows[0].count), 0);

  return {
    sum: totalSum,
    avg: totalCount > 0 ? totalSum / totalCount : 0,
    count: totalCount
  };
}

// Usage
const orderStats = await sumAcrossShards(router, 'orders', 'total', 'status = $1', ['completed']);
// { sum: 1500000, avg: 75, count: 20000 }
```

### GROUP BY Across Shards

```typescript
async function groupByAcrossShards(router: ShardRouter, sql: string, params: any[], groupKey: string) {
  // Validate groupKey identifier (used in result object construction)
  const safeGroupKey = validateIdentifier(groupKey);

  // Note: sql parameter should be a pre-constructed safe query, not user input
  // Consider using a query builder for constructing the GROUP BY query

  // Execute GROUP BY on each shard
  const shardResults = await Promise.all(
    router.getAllShards().map(shard => shard.query(sql, params))
  );

  // Merge groups
  const merged = new Map<string, number>();
  for (const result of shardResults) {
    for (const row of result.rows) {
      const key = row[safeGroupKey];
      const count = parseInt(row.count);
      merged.set(key, (merged.get(key) || 0) + count);
    }
  }

  return Array.from(merged.entries()).map(([key, count]) => ({ [safeGroupKey]: key, count }));
}

// Usage
const usersByCountry = await groupByAcrossShards(
  router,
  'SELECT country, COUNT(*) as count FROM users GROUP BY country',
  [],
  'country'
);
// [{ country: 'US', count: 50000 }, { country: 'UK', count: 15000 }, ...]
```

---

## Cross-Shard Joins

### Application-Level Join

```typescript
async function crossShardJoin(router: ShardRouter, userIds: string[]) {
  // Step 1: Get users (sharded by user_id)
  const users = await Promise.all(
    userIds.map(userId =>
      router.query(userId, 'SELECT * FROM users WHERE id = $1', [userId])
    )
  );

  // Step 2: Get orders for each user (also sharded by user_id - same shard!)
  const ordersPromises = userIds.map(userId =>
    router.query(userId, 'SELECT * FROM orders WHERE user_id = $1', [userId])
  );
  const ordersResults = await Promise.all(ordersPromises);

  // Step 3: Combine in application
  return users.map((userResult, index) => ({
    user: userResult.rows[0],
    orders: ordersResults[index].rows
  }));
}
```

### Denormalization for Joins

```sql
-- Instead of cross-shard join, denormalize
-- orders table (sharded by user_id)
CREATE TABLE orders (
  id UUID,
  user_id UUID, -- Shard key
  product_id UUID,
  product_name VARCHAR(200), -- Denormalized!
  product_price DECIMAL(10,2), -- Denormalized!
  ...
);

-- Now "orders with product info" is single-shard query
SELECT * FROM orders WHERE user_id = 'user_123';
```

---

## Cross-Shard Pagination

### Offset-Based (Not Recommended)

```typescript
async function paginateAcrossShards(router: ShardRouter, limit: number, offset: number) {
  // Get limit + offset from each shard
  const results = await Promise.all(
    router.getAllShards().map(shard =>
      shard.query('SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit + offset, 0])
    )
  );

  // Merge and sort
  const merged = results.flatMap(r => r.rows)
    .sort((a, b) => b.created_at - a.created_at);

  // Apply pagination
  return merged.slice(offset, offset + limit);
}

// Problem: Gets too much data from each shard!
// 100 shards × (limit=10 + offset=1000) = 101K rows fetched, only 10 returned
```

### Cursor-Based (Recommended)

```typescript
async function cursorPaginateAcrossShards(router: ShardRouter, limit: number, cursor?: string) {
  const cursorDate = cursor ? new Date(cursor) : new Date();

  // Get limit from each shard
  const results = await Promise.all(
    router.getAllShards().map(shard =>
      shard.query(
        'SELECT * FROM users WHERE created_at < $1 ORDER BY created_at DESC LIMIT $2',
        [cursorDate, limit]
      )
    )
  );

  // Merge and sort
  const merged = results.flatMap(r => r.rows)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);

  return {
    data: merged,
    next_cursor: merged.length > 0 ? merged[merged.length - 1].created_at.toISOString() : null
  };
}

// Better: Only fetches limit per shard
// 100 shards × limit=10 = 1K rows fetched
```

---

## Sorted Queries Across Shards

```typescript
async function topNAcrossShards(router: ShardRouter, n: number) {
  // Get top N from each shard
  const results = await Promise.all(
    router.getAllShards().map(shard =>
      shard.query('SELECT * FROM products ORDER BY sales DESC LIMIT $1', [n])
    )
  );

  // Merge and re-sort
  return results.flatMap(r => r.rows)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, n);
}

// Get top 10 products globally
const top10 = await topNAcrossShards(router, 10);
// Fetches 10 per shard, merges, returns top 10
```

---

## Summary

**Avoid cross-shard queries when possible** - design shard key to keep related data together.

When unavoidable:
- ✅ **Scatter-gather**: Parallel execution
- ✅ **Aggregations**: Combine in application
- ✅ **Cursor pagination**: Better than offset
- ✅ **Denormalization**: Avoid joins

Load `templates/cross-shard-aggregation.ts` for full implementations.
