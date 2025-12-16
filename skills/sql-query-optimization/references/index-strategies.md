# Index Strategies - When and How to Create Indexes

**Last Updated**: 2025-12-15
**Database Support**: PostgreSQL 9.6+, MySQL 8.0+

Comprehensive guide to index types, selection criteria, and best practices.

---

## Index Types

### B-Tree Index (Default)

**Best for**: Equality and range queries, sorting

```sql
CREATE INDEX idx_orders_created ON orders(created_at);

-- Supports:
SELECT * FROM orders WHERE created_at = '2025-01-01';  -- Equality
SELECT * FROM orders WHERE created_at > '2025-01-01';  -- Range
SELECT * FROM orders ORDER BY created_at;              -- Sort
SELECT * FROM orders WHERE created_at BETWEEN '2025-01-01' AND '2025-12-31';
```

**When to use**: Default choice for most columns

### Hash Index

**Best for**: Equality queries only (PostgreSQL 10+)

```sql
CREATE INDEX idx_users_email_hash ON users USING HASH(email);

-- Supports:
SELECT * FROM users WHERE email = 'user@example.com';  -- ✓ Fast

-- Does NOT support:
SELECT * FROM users WHERE email > 'a@example.com';     -- ✗ No range
SELECT * FROM users ORDER BY email;                    -- ✗ No sort
```

**When to use**: High-volume equality lookups, never need ranges
**Trade-off**: Faster equality, no range/sort support

### GIN Index (Generalized Inverted Index)

**Best for**: Full-text search, JSON, arrays (PostgreSQL)

```sql
-- Full-text search
CREATE INDEX idx_products_search ON products
USING GIN(to_tsvector('english', name || ' ' || description));

SELECT * FROM products
WHERE to_tsvector('english', name || ' ' || description)
      @@ to_tsquery('english', 'laptop & wireless');

-- JSONB queries
CREATE INDEX idx_metadata ON products USING GIN(metadata jsonb_path_ops);

SELECT * FROM products WHERE metadata @> '{"brand": "Apple"}';

-- Array containment
CREATE INDEX idx_tags ON posts USING GIN(tags);

SELECT * FROM posts WHERE tags @> ARRAY['postgresql', 'performance'];
```

**When to use**: Full-text search, JSON/JSONB queries, array operations

### GiST Index (Generalized Search Tree)

**Best for**: Geometric data, full-text, nearest-neighbor (PostgreSQL)

```sql
-- Trigram similarity search
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_products_name_gist ON products
USING GIST(name gist_trgm_ops);

SELECT * FROM products WHERE name % 'laptop';  -- Similarity
SELECT * FROM products ORDER BY name <-> 'laptop' LIMIT 10;  -- Distance

-- Geometric data
CREATE INDEX idx_locations ON stores USING GIST(location);

SELECT * FROM stores WHERE location && box '((0,0),(10,10))';
```

**When to use**: Fuzzy matching, spatial data, nearest-neighbor searches

---

## Composite Indexes

### Column Order Matters

```sql
-- Index: (user_id, created_at, status)
CREATE INDEX idx_orders_composite
ON orders(user_id, created_at, status);

-- ✓ Can use index (leftmost prefix rule)
SELECT * FROM orders WHERE user_id = 123;
SELECT * FROM orders WHERE user_id = 123 AND created_at > '2025-01-01';
SELECT * FROM orders WHERE user_id = 123 AND created_at > '2025-01-01' AND status = 'pending';

-- ✗ Cannot use index (skips leftmost column)
SELECT * FROM orders WHERE created_at > '2025-01-01';
SELECT * FROM orders WHERE status = 'pending';
SELECT * FROM orders WHERE created_at > '2025-01-01' AND status = 'pending';
```

### Ordering Rules

**Rule 1**: Most selective column first (if not using leftmost prefix)
```sql
-- status: 3 values (33% selectivity)
-- user_id: 10,000 values (0.01% selectivity)

-- Good: Most selective first
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Bad: Least selective first
CREATE INDEX idx_orders_status_user ON orders(status, user_id);
```

**Rule 2**: Match query filter order
```sql
-- Common query pattern
SELECT * FROM orders
WHERE user_id = 123 AND status = 'pending'
ORDER BY created_at DESC;

-- Optimal index
CREATE INDEX idx_orders_user_status_created
ON orders(user_id, status, created_at DESC);
```

---

## Covering Indexes

### Include Non-Key Columns (PostgreSQL 11+)

```sql
-- Query needing id, user_id, status, total, created_at
SELECT id, total, created_at FROM orders
WHERE user_id = 123 AND status = 'pending';

-- Covering index (PostgreSQL INCLUDE clause)
CREATE INDEX idx_orders_cover ON orders(user_id, status)
INCLUDE (id, total, created_at);

-- Result: Index Only Scan (no table access!)
EXPLAIN (ANALYZE, BUFFERS)
-- Index Only Scan using idx_orders_cover
-- Heap Fetches: 0  ← No table access needed
```

### Benefits
- Eliminates table lookups (heap fetches)
- All needed data in index
- 2-5x faster for selective queries

### Trade-offs
- Larger index size
- Slower INSERT/UPDATE/DELETE
- Only beneficial if query is read-heavy

---

## Partial Indexes

### Index Subset of Rows

```sql
-- Only index active users
CREATE INDEX idx_users_active
ON users(email)
WHERE status = 'active';

-- Smaller, faster index
-- Query must include filter:
SELECT * FROM users
WHERE email = 'user@example.com' AND status = 'active';
-- Uses idx_users_active

SELECT * FROM users
WHERE email = 'user@example.com';
-- Cannot use idx_users_active (missing WHERE status = 'active')
```

### Common Use Cases

```sql
-- Index only unprocessed jobs
CREATE INDEX idx_jobs_pending
ON jobs(created_at)
WHERE status = 'pending';

-- Index only non-deleted records
CREATE INDEX idx_posts_active
ON posts(user_id, created_at)
WHERE deleted_at IS NULL;

-- Index only recent records
CREATE INDEX idx_logs_recent
ON logs(level, created_at)
WHERE created_at > CURRENT_DATE - INTERVAL '30 days';
```

### Benefits
- 50-90% smaller index size
- Faster index operations
- Better cache utilization

---

## Expression Indexes

### Index Computed Values

```sql
-- Index lowercase email for case-insensitive search
CREATE INDEX idx_users_email_lower
ON users(LOWER(email));

SELECT * FROM users WHERE LOWER(email) = 'user@example.com';
-- Uses idx_users_email_lower

-- Index date part
CREATE INDEX idx_orders_month
ON orders(DATE_TRUNC('month', created_at));

SELECT * FROM orders
WHERE DATE_TRUNC('month', created_at) = '2025-01-01';

-- Index JSON field
CREATE INDEX idx_metadata_brand
ON products((metadata->>'brand'));

SELECT * FROM products WHERE metadata->>'brand' = 'Apple';
```

### Important: Query must match expression exactly

```sql
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- ✓ Uses index
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- ✗ Does not use index (different expression)
SELECT * FROM users WHERE email = 'USER@EXAMPLE.COM';
SELECT * FROM users WHERE UPPER(email) = 'USER@EXAMPLE.COM';
```

---

## Index Maintenance

### Monitor Index Usage

```sql
-- PostgreSQL: Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid NOT IN (
    SELECT indexrelid FROM pg_index WHERE indisunique
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- MySQL: Check index usage
SELECT
  object_schema,
  object_name,
  index_name,
  count_star,
  count_read,
  count_write
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE index_name IS NOT NULL
  AND count_star = 0
ORDER BY object_schema, object_name;
```

### Rebuild Bloated Indexes

```sql
-- PostgreSQL: Rebuild with REINDEX
REINDEX INDEX CONCURRENTLY idx_orders_user_id;

-- Or rebuild all table indexes
REINDEX TABLE CONCURRENTLY orders;

-- MySQL: Rebuild with OPTIMIZE
OPTIMIZE TABLE orders;
```

### Drop Unused Indexes

```sql
-- Safely drop unused index
DROP INDEX CONCURRENTLY idx_orders_old;

-- Before dropping, verify:
-- 1. idx_scan = 0 in pg_stat_user_indexes
-- 2. Not supporting unique constraint
-- 3. Test in staging first!
```

---

## Index Best Practices

### DO

✅ Index all foreign key columns
```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

✅ Index columns in WHERE, JOIN, ORDER BY
```sql
-- Query pattern
SELECT * FROM orders
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Index to support
CREATE INDEX idx_orders_status_created
ON orders(status, created_at DESC);
```

✅ Use composite indexes for multi-column queries
```sql
CREATE INDEX idx_orders_user_status
ON orders(user_id, status);
```

✅ Include columns in index for covering
```sql
CREATE INDEX idx_orders_cover
ON orders(user_id, status)
INCLUDE (total, created_at);
```

✅ Use partial indexes for filtered queries
```sql
CREATE INDEX idx_orders_active
ON orders(created_at)
WHERE status IN ('pending', 'processing');
```

### DON'T

❌ Index every column
```sql
-- Too many indexes slow INSERT/UPDATE/DELETE
-- Only index columns actually used in queries
```

❌ Create redundant indexes
```sql
-- Redundant: (user_id, status) covers (user_id)
CREATE INDEX idx_orders_user ON orders(user_id);           -- Redundant
CREATE INDEX idx_orders_user_status ON orders(user_id, status);  -- Keep this
```

❌ Index low-cardinality columns alone
```sql
-- Bad: status has only 3 values
CREATE INDEX idx_orders_status ON orders(status);

-- Better: Combine with selective column
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
```

❌ Index without measuring
```sql
-- Always verify index helps:
EXPLAIN (ANALYZE, BUFFERS)
<your query>;

-- Before and after creating index
-- Compare execution time
```

---

## Index Selection Workflow

### 1. Identify Slow Queries

```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- >100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 2. Analyze Query Plan

```sql
EXPLAIN (ANALYZE, BUFFERS)
<slow query>;

-- Look for:
-- - Seq Scan on large tables
-- - High "Rows Removed by Filter"
-- - Nested Loop with many loops
```

### 3. Identify Missing Indexes

```sql
-- Check columns in:
-- - WHERE clause
-- - JOIN conditions
-- - ORDER BY clause
-- - GROUP BY clause
```

### 4. Create Index

```sql
-- Start with single-column index
CREATE INDEX CONCURRENTLY idx_table_column
ON table_name(column_name);

-- Upgrade to composite if needed
CREATE INDEX CONCURRENTLY idx_table_multi
ON table_name(col1, col2, col3);
```

### 5. Verify Improvement

```sql
EXPLAIN (ANALYZE, BUFFERS)
<slow query>;

-- Check:
-- - Index Scan instead of Seq Scan
-- - Execution time reduced
-- - Buffer reads reduced
```

### 6. Monitor Long-Term

```sql
-- Check if index is actually used
SELECT idx_scan FROM pg_stat_user_indexes
WHERE indexrelname = 'idx_table_column';

-- If idx_scan = 0 after 30 days, consider dropping
```

---

## Quick Reference

| Index Type | Use Case | Example |
|------------|----------|---------|
| B-Tree | Default, equality, range, sort | `CREATE INDEX idx ON t(col)` |
| Hash | Equality only, faster lookup | `CREATE INDEX idx ON t USING HASH(col)` |
| GIN | Full-text, JSON, arrays | `CREATE INDEX idx ON t USING GIN(col)` |
| GiST | Fuzzy match, spatial | `CREATE INDEX idx ON t USING GIST(col)` |
| Composite | Multi-column queries | `CREATE INDEX idx ON t(c1, c2, c3)` |
| Covering | Include non-key columns | `CREATE INDEX idx ON t(c1) INCLUDE (c2, c3)` |
| Partial | Subset of rows | `CREATE INDEX idx ON t(col) WHERE condition` |
| Expression | Computed values | `CREATE INDEX idx ON t(LOWER(col))` |

## Related Resources

- `error-catalog.md` - Common indexing mistakes
- `explain-analysis.md` - Reading EXPLAIN output
- `query-rewrites.md` - Optimizing queries
