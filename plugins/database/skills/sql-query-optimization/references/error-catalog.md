# SQL Query Optimization - Error Catalog

**Last Updated**: 2025-12-15
**Errors Documented**: 12
**Production Tested**: PostgreSQL 14-17, MySQL 8.0+

This catalog documents common SQL query optimization errors, their symptoms, root causes, and verified solutions.

---

## Error 1: Sequential Scan on Large Table

**Symptom**:
```
Seq Scan on orders  (cost=0.00..150000.00 rows=1000000 width=120)
  Filter: (user_id = 123)
Planning Time: 0.123 ms
Execution Time: 2500.456 ms  <- SLOW!
```

**Root Cause**:
- No index on `user_id` column
- Query must scan every row to find matches
- Performance degrades linearly with table size

**Solution**:
```sql
-- Create index on filtered column
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Verify index is used
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 123;

-- Expected output:
-- Index Scan using idx_orders_user_id on orders
--   (cost=0.42..150.00 rows=100 width=120)
--   Execution Time: 1.234 ms  <- FAST!
```

**Prevention**:
- Index all columns used in WHERE clauses
- Monitor `pg_stat_user_tables` for sequential scans
- Run EXPLAIN ANALYZE before deploying to production

---

## Error 2: Missing Index on Foreign Key

**Symptom**:
```sql
SELECT o.*, u.name
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.status = 'active';

-- Slow execution (5+ seconds on 100k rows)
```

**Root Cause**:
- Foreign key columns (`user_id`) not indexed
- JOIN operation requires full table scan
- PostgreSQL/MySQL don't auto-index foreign keys

**Solution**:
```sql
-- Index the foreign key column
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- For bidirectional queries, index both sides
CREATE INDEX idx_users_status ON users(status);

-- Composite index for common patterns
CREATE INDEX idx_orders_user_status
ON orders(user_id, status);
```

**Prevention**:
- Always index foreign key columns
- Use migration templates that include FK indexes
- Add to schema design checklist

---

## Error 3: N+1 Query Problem

**Symptom**:
```javascript
// Fetches 1 + N queries for N users
const users = await db.select().from(users);
for (const user of users) {
  const orders = await db.select()
    .from(orders)
    .where(eq(orders.userId, user.id)); // N queries!
}
// Total: 1 + 1000 queries for 1000 users
```

**Root Cause**:
- ORM lazy loading triggers separate query per record
- Loop executes one query per iteration
- Network latency multiplied by N

**Solution**:
```javascript
// Use JOIN or eager loading
const usersWithOrders = await db
  .select()
  .from(users)
  .leftJoin(orders, eq(users.id, orders.userId));
// Total: 1 query for all data

// Alternative: Batch load with IN clause
const userIds = users.map(u => u.id);
const allOrders = await db.select()
  .from(orders)
  .where(inArray(orders.userId, userIds));
// Total: 2 queries (1 for users, 1 for all orders)
```

**Prevention**:
- Use `EXPLAIN ANALYZE` to count queries
- Enable query logging in development
- Use DataLoader pattern for batching
- Prefer JOIN over multiple SELECT queries

---

## Error 4: Leading Wildcard LIKE Query

**Symptom**:
```sql
SELECT * FROM products
WHERE name LIKE '%laptop%';  -- Cannot use index

-- Sequential scan on 1M rows = 3+ seconds
```

**Root Cause**:
- Leading wildcard (`%search`) prevents index usage
- Database must scan entire column
- PostgreSQL/MySQL indexes can't match middle of string

**Solution**:
```sql
-- Option 1: Use full-text search (PostgreSQL)
ALTER TABLE products ADD COLUMN search_vector tsvector;
CREATE INDEX idx_products_fts ON products
USING GIN(search_vector);

UPDATE products
SET search_vector = to_tsvector('english', name);

SELECT * FROM products
WHERE search_vector @@ to_tsquery('english', 'laptop');

-- Option 2: Use trailing wildcard (if acceptable)
SELECT * FROM products
WHERE name LIKE 'laptop%';  -- CAN use index

-- Option 3: Use trigram index (PostgreSQL)
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_products_name_trgm ON products
USING GIN(name gin_trgm_ops);

SELECT * FROM products
WHERE name % 'laptop';  -- Similarity search
```

**Prevention**:
- Avoid leading wildcards in high-traffic queries
- Use full-text search for text matching
- Consider Elasticsearch/Meilisearch for complex search

---

## Error 5: SELECT * in Production

**Symptom**:
```sql
SELECT * FROM users WHERE id = 123;

-- Fetches 50 columns (2KB per row)
-- Only need 3 columns (200 bytes)
-- 10x unnecessary data transfer
```

**Root Cause**:
- Fetches all columns including large TEXT/BLOB fields
- Wastes network bandwidth and memory
- Prevents covering indexes
- Breaks when schema changes

**Solution**:
```sql
-- Select only needed columns
SELECT id, name, email FROM users WHERE id = 123;

-- Benefits:
-- - 90% less data transfer
-- - Enables covering indexes
-- - Explicit column contract
-- - Faster query execution
```

**Prevention**:
- Never use `SELECT *` in production code
- Use linter rules to catch `SELECT *`
- Define explicit column lists in ORM schemas

---

## Error 6: Missing LIMIT on Large Results

**Symptom**:
```sql
SELECT * FROM logs
WHERE created_at > '2025-01-01';

-- Returns 5 million rows
-- Server runs out of memory
-- Query timeout after 60 seconds
```

**Root Cause**:
- No pagination or result limiting
- Database attempts to return entire result set
- Memory exhaustion on server/client

**Solution**:
```sql
-- Add LIMIT for bounded result sets
SELECT * FROM logs
WHERE created_at > '2025-01-01'
ORDER BY created_at DESC
LIMIT 100;

-- Use cursor-based pagination for large sets
SELECT * FROM logs
WHERE created_at > '2025-01-01'
  AND id > 12345  -- cursor
ORDER BY id
LIMIT 100;

-- Use window functions for total count
SELECT *, COUNT(*) OVER() as total_count
FROM logs
WHERE created_at > '2025-01-01'
LIMIT 100;
```

**Prevention**:
- Always use LIMIT in queries
- Implement pagination from day one
- Set database-level limits (PostgreSQL `statement_timeout`)

---

## Error 7: Subquery Instead of JOIN

**Symptom**:
```sql
-- Subquery approach (slow)
SELECT * FROM orders
WHERE user_id IN (
  SELECT id FROM users WHERE status = 'active'
);

-- Execution: 2+ seconds on 100k rows
```

**Root Cause**:
- Subquery executed for each outer row
- No optimization for IN clause
- Multiple passes over data

**Solution**:
```sql
-- JOIN approach (fast)
SELECT o.*
FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.status = 'active';

-- Execution: 0.2 seconds on 100k rows (10x faster)

-- Or use EXISTS for better optimization
SELECT o.*
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM users u
  WHERE u.id = o.user_id AND u.status = 'active'
);
```

**Prevention**:
- Prefer JOIN over IN subqueries
- Use EXISTS for "does it exist?" checks
- Profile both approaches with EXPLAIN

---

## Error 8: No Statistics Update After Bulk Load

**Symptom**:
```sql
-- Bulk insert 1M rows
COPY orders FROM '/data/orders.csv';

-- Query uses wrong plan
SELECT * FROM orders WHERE status = 'pending';
-- Sequential scan despite having index!
```

**Root Cause**:
- PostgreSQL statistics outdated
- Query planner uses old row counts
- Chooses sequential scan over index scan

**Solution**:
```sql
-- Always update statistics after bulk operations
ANALYZE orders;

-- Or analyze entire database
ANALYZE;

-- For PostgreSQL, enable auto-analyze
ALTER TABLE orders SET (autovacuum_analyze_scale_factor = 0.05);

-- Verify statistics are current
SELECT schemaname, tablename, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'orders';
```

**Prevention**:
- Run ANALYZE after bulk inserts/updates/deletes
- Enable autovacuum (default in PostgreSQL)
- Monitor statistics freshness

---

## Error 9: Missing Composite Index

**Symptom**:
```sql
SELECT * FROM orders
WHERE user_id = 123 AND status = 'pending';

-- Has indexes on user_id and status separately
-- But query is still slow
```

**Root Cause**:
- Multiple single-column indexes not optimal
- Database can only use one index
- Missing composite index for query pattern

**Solution**:
```sql
-- Create composite index matching query pattern
CREATE INDEX idx_orders_user_status
ON orders(user_id, status);

-- Order matters! Put most selective column first
-- If querying by user_id alone:
SELECT * FROM orders WHERE user_id = 123;
-- Can use idx_orders_user_status (leftmost prefix)

-- If querying by status alone:
SELECT * FROM orders WHERE status = 'pending';
-- Cannot use idx_orders_user_status
-- Need separate index: CREATE INDEX idx_orders_status ON orders(status);
```

**Prevention**:
- Create composite indexes for common query patterns
- Order index columns by selectivity (most selective first)
- Use `EXPLAIN` to verify index usage

---

## Error 10: Wrong Index Column Order

**Symptom**:
```sql
-- Index created as (status, user_id)
CREATE INDEX idx_orders_status_user ON orders(status, user_id);

-- Query filters by user_id first
SELECT * FROM orders
WHERE user_id = 123 AND status = 'pending';

-- Index not used! Sequential scan instead.
```

**Root Cause**:
- Index column order doesn't match query pattern
- Index is (status, user_id) but query needs (user_id, status)
- PostgreSQL can't use index efficiently

**Solution**:
```sql
-- Drop wrong index
DROP INDEX idx_orders_status_user;

-- Create correctly ordered index
CREATE INDEX idx_orders_user_status
ON orders(user_id, status);

-- Rule: Index columns should match WHERE clause order
-- or most selective column first
```

**Prevention**:
- Analyze actual query patterns before creating indexes
- Use EXPLAIN to verify index is used
- Order by selectivity: most selective → least selective

---

## Error 11: Not Using Prepared Statements

**Symptom**:
```javascript
// Vulnerable to SQL injection + slow
const userId = req.params.id;
const query = `SELECT * FROM users WHERE id = ${userId}`;
await db.query(query);

// Each query is parsed and planned separately
// No query plan caching
```

**Root Cause**:
- String concatenation creates new query each time
- No plan caching
- SQL injection vulnerability
- Parser/planner overhead on every execution

**Solution**:
```javascript
// Use parameterized queries (Drizzle ORM)
const users = await db.select()
  .from(users)
  .where(eq(users.id, userId));

// Or native prepared statements
const query = 'SELECT * FROM users WHERE id = $1';
await db.query(query, [userId]);

// Benefits:
// - Query plan cached and reused
// - SQL injection prevented
// - Faster execution (skip parse/plan)
```

**Prevention**:
- Always use parameterized queries
- Use ORM with prepared statements
- Never concatenate user input into SQL

---

## Error 12: Missing Connection Pooling

**Symptom**:
```javascript
// Creates new connection for each request
app.get('/api/users', async (req, res) => {
  const client = await pg.connect();  // Slow!
  const result = await client.query('SELECT * FROM users');
  await client.end();
  res.json(result.rows);
});

// Connection overhead: 20-50ms per request
// Max 100 concurrent requests = 100 connections
// Database rejects new connections
```

**Root Cause**:
- No connection pooling
- Connection establishment overhead
- Resource exhaustion under load

**Solution**:
```javascript
// Use connection pool (pg library)
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  max: 20,              // Max 20 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

app.get('/api/users', async (req, res) => {
  const client = await pool.connect();  // Fast! Reuses connection
  try {
    const result = await client.query('SELECT * FROM users');
    res.json(result.rows);
  } finally {
    client.release();  // Return to pool
  }
});

// Or use Drizzle with connection pool
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({ /* config */ });
const db = drizzle(pool);
```

**Prevention**:
- Always use connection pooling in production
- Set appropriate pool size (start with 20-50)
- Monitor pool utilization with metrics
- Use Cloudflare Workers for serverless (no pooling needed)

---

## Quick Reference Table

| Error | Symptom | Solution | Detection |
|-------|---------|----------|-----------|
| Sequential Scan | EXPLAIN shows `Seq Scan` | Add index on filter columns | `EXPLAIN ANALYZE` |
| Missing FK Index | Slow JOINs | Index all foreign keys | Monitor JOIN performance |
| N+1 Queries | Many identical queries | Use JOIN or batch loading | Enable query logging |
| Leading Wildcard | `LIKE '%term%'` slow | Use full-text search or trigrams | `EXPLAIN` shows Seq Scan |
| SELECT * | Large data transfer | Select specific columns | Monitor network bytes |
| No LIMIT | Memory exhaustion | Add LIMIT + pagination | Monitor query result size |
| Subquery over JOIN | Slow IN clauses | Rewrite as JOIN or EXISTS | `EXPLAIN` comparison |
| Stale Statistics | Wrong query plans | Run ANALYZE after bulk ops | Check `pg_stat_user_tables` |
| Missing Composite | Multiple WHERE columns | Create composite index | `EXPLAIN` shows index not used |
| Wrong Index Order | Index exists but not used | Reorder index columns | `EXPLAIN` + query pattern |
| No Prepared Statements | Slow + SQL injection risk | Use parameterized queries | Review code for string concat |
| No Connection Pool | High connection overhead | Implement pooling | Monitor connection count |

---

## Related Resources

- `explain-analysis.md` - Deep dive into EXPLAIN output
- `index-strategies.md` - When and how to create indexes
- `query-rewrites.md` - Before/after optimization examples
- `performance-monitoring.md` - Tools and metrics
- `optimization-workflow.md` - Systematic optimization process
