---
name: sql-query-optimization
description: Optimizes database query performance through indexing, query rewriting, and execution plan analysis for PostgreSQL and MySQL. Use when debugging slow queries, improving database performance, or analyzing query execution plans.
---

# SQL Query Optimization

Analyze and improve database query performance systematically.

## Performance Analysis

```sql
-- PostgreSQL: Analyze query plan
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

-- Find slow queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

## Index Strategies

```sql
-- Single column index
CREATE INDEX idx_orders_user ON orders(user_id);

-- Composite index (order matters!)
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Partial index for common queries
CREATE INDEX idx_orders_pending ON orders(user_id)
WHERE status = 'pending';

-- Covering index (includes all needed columns)
CREATE INDEX idx_orders_cover ON orders(user_id, status)
INCLUDE (total, created_at);
```

## Query Rewrites

### Avoid SELECT *
```sql
-- Bad
SELECT * FROM users WHERE id = 1;

-- Good
SELECT id, name, email FROM users WHERE id = 1;
```

### Use JOINs instead of subqueries
```sql
-- Subquery (often slower)
SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE status = 'active');

-- JOIN (usually faster)
SELECT o.* FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.status = 'active';
```

### Batch operations
```sql
-- Instead of multiple INSERTs
INSERT INTO logs (message, level) VALUES
  ('msg1', 'info'),
  ('msg2', 'warn'),
  ('msg3', 'error');
```

## Optimization Checklist

- [ ] Run EXPLAIN ANALYZE on slow queries
- [ ] Index columns used in WHERE, JOIN, ORDER BY
- [ ] Avoid SELECT * in production
- [ ] Use LIMIT for large result sets
- [ ] Keep statistics updated (ANALYZE)
- [ ] Monitor pg_stat_statements

## Common Mistakes

- Adding indexes without measuring
- Leading wildcards in LIKE (`%search`)
- Missing indexes on foreign keys
- N+1 queries from ORM
- Not using connection pooling
