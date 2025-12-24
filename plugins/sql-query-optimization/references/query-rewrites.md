# Query Rewrites - Before/After Optimizations

**Last Updated**: 2025-12-15

Common SQL anti-patterns and their optimized rewrites.

---

## SELECT * → SELECT Specific Columns

**Before** (Bad):
```sql
SELECT * FROM users WHERE id = 123;
-- Fetches 50 columns, 2KB per row
```

**After** (Good):
```sql
SELECT id, name, email FROM users WHERE id = 123;
-- Fetches 3 columns, 200 bytes per row
-- 90% less data transfer
-- Enables covering indexes
```

---

## Subquery → JOIN

**Before** (Slow):
```sql
SELECT * FROM orders
WHERE user_id IN (SELECT id FROM users WHERE status = 'active');
-- 2+ seconds on 100k rows
```

**After** (Fast):
```sql
SELECT o.* FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.status = 'active';
-- 0.2 seconds (10x faster)
```

---

## N+1 Queries → Single JOIN

**Before** (Bad):
```javascript
// 1 + N queries
const users = await db.select().from(users);
for (const user of users) {
  const orders = await db.select()
    .from(orders)
    .where(eq(orders.userId, user.id));
}
```

**After** (Good):
```javascript
// 1 query
const usersWithOrders = await db.select()
  .from(users)
  .leftJoin(orders, eq(users.id, orders.userId));
```

---

## Leading Wildcard → Full-Text Search

**Before** (Slow):
```sql
SELECT * FROM products WHERE name LIKE '%laptop%';
-- Cannot use index, sequential scan
```

**After** (Fast):
```sql
-- PostgreSQL full-text search
CREATE INDEX idx_products_fts ON products
USING GIN(to_tsvector('english', name));

SELECT * FROM products
WHERE to_tsvector('english', name) @@ to_tsquery('english', 'laptop');
-- Uses index, 100x faster
```

---

## Multiple INSERTs → Batch INSERT

**Before** (Slow):
```sql
INSERT INTO logs (message, level) VALUES ('msg1', 'info');
INSERT INTO logs (message, level) VALUES ('msg2', 'warn');
INSERT INTO logs (message, level) VALUES ('msg3', 'error');
-- 3 round trips
```

**After** (Fast):
```sql
INSERT INTO logs (message, level) VALUES
  ('msg1', 'info'),
  ('msg2', 'warn'),
  ('msg3', 'error');
-- 1 round trip, 3x faster
```

---

## OR → UNION ALL (for indexed columns)

**Before** (Slow):
```sql
SELECT * FROM products
WHERE category_id = 5 OR brand_id = 10;
-- Cannot use both indexes
```

**After** (Fast):
```sql
SELECT * FROM products WHERE category_id = 5
UNION ALL
SELECT * FROM products WHERE brand_id = 10 AND category_id <> 5;
-- Uses both indexes
```

---

## COUNT(*) on Whole Table → Approximate Count

**Before** (Slow):
```sql
SELECT COUNT(*) FROM orders;
-- Sequential scan on 10M rows = 30 seconds
```

**After** (Fast):
```sql
-- PostgreSQL approximate count
SELECT reltuples::bigint AS estimate
FROM pg_class
WHERE relname = 'orders';
-- Instant, accurate within 1-2%
```

---

## Inefficient Pagination → Cursor-Based

**Before** (Slow):
```sql
SELECT * FROM posts ORDER BY created_at OFFSET 10000 LIMIT 100;
-- Must scan and skip 10,000 rows every time
```

**After** (Fast):
```sql
SELECT * FROM posts
WHERE created_at < '2025-01-01 12:00:00'
ORDER BY created_at DESC
LIMIT 100;
-- Uses index, constant time
```

---

## Related Resources

- `error-catalog.md` - Full error documentation
- `index-strategies.md` - Supporting indexes
- `optimization-workflow.md` - Systematic process
