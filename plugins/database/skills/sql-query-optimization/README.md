# SQL Query Optimization Skill

Comprehensive SQL query performance optimization for PostgreSQL and MySQL.

## What This Skill Does

Provides systematic optimization patterns for:
- **Debugging slow queries** using EXPLAIN ANALYZE
- **Creating optimal indexes** (B-Tree, composite, covering, partial)
- **Rewriting inefficient queries** (N+1, subqueries, pagination)
- **Monitoring database performance** with pg_stat_statements

## Auto-Trigger Keywords

This skill activates when Claude detects:
- slow query, slow queries, query performance
- sequential scan, seq scan, missing index
- N+1 problem, N+1 queries
- EXPLAIN ANALYZE, query plan
- database optimization, sql optimization
- index strategy, composite index, covering index
- connection pooling, prepared statements
- LIKE performance, full-text search
- pagination, OFFSET LIMIT
- cache hit ratio, buffer cache

## Prevents 12 Common Errors

1. Sequential scans on large tables
2. Missing indexes on foreign keys
3. N+1 query problems from ORMs
4. Leading wildcard LIKE queries (`%search`)
5. SELECT * in production code
6. Missing LIMIT on large result sets
7. Inefficient subqueries vs JOINs
8. Stale statistics after bulk loads
9. Missing composite indexes
10. Wrong index column order
11. SQL injection from non-parameterized queries
12. Missing connection pooling

## Quick Start

```sql
-- 1. Find slow queries
SELECT query, mean_exec_time FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

-- 2. Analyze query plan
EXPLAIN (ANALYZE, BUFFERS) <your query>;

-- 3. Add missing index
CREATE INDEX CONCURRENTLY idx_table_column ON table_name(column);
```

## Resources

- **6 Reference Files**: Error catalog, EXPLAIN analysis, index strategies, query rewrites, monitoring, workflow
- **4 SQL Templates**: EXPLAIN queries, index examples, query rewrites, monitoring queries
- **Production Tested**: PostgreSQL 14-17, MySQL 8.0+

## License

MIT
