# Performance Monitoring Tools

**Last Updated**: 2025-12-15

Tools and queries for ongoing database performance monitoring.

---

## PostgreSQL Monitoring

### Slow Query Log

```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries >1s
SELECT pg_reload_conf();

-- Find log location
SHOW log_directory;
SHOW log_filename;
```

### pg_stat_statements

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries by total time
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  stddev_exec_time,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Find slowest queries by mean time
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE calls > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

### Index Usage

```sql
-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find most used indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
```

### Table Statistics

```sql
-- Find tables needing ANALYZE
SELECT
  schemaname,
  tablename,
  last_analyze,
  last_autoanalyze,
  n_mod_since_analyze
FROM pg_stat_user_tables
WHERE n_mod_since_analyze > 10000
ORDER BY n_mod_since_analyze DESC;

-- Find bloated tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_dead_tup,
  n_live_tup,
  round((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

### Cache Hit Ratio

```sql
-- Overall cache hit ratio (should be >99%)
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit)  as heap_hit,
  round(
    sum(heap_blks_hit)::numeric /
    NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100,
    2
  ) as cache_hit_ratio
FROM pg_statio_user_tables;

-- Per-table cache hit ratio
SELECT
  schemaname,
  tablename,
  heap_blks_read,
  heap_blks_hit,
  round(
    heap_blks_hit::numeric /
    NULLIF(heap_blks_hit + heap_blks_read, 0) * 100,
    2
  ) as hit_pct
FROM pg_statio_user_tables
WHERE heap_blks_read + heap_blks_hit > 0
ORDER BY heap_blks_read DESC;
```

---

## MySQL Monitoring

### Slow Query Log

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- Log queries >1s
SET GLOBAL log_queries_not_using_indexes = 'ON';

-- Find log location
SHOW VARIABLES LIKE 'slow_query_log_file';
```

### Performance Schema

```sql
-- Enable performance schema
SET GLOBAL performance_schema = ON;

-- Find slowest statements
SELECT
  DIGEST_TEXT,
  COUNT_STAR as executions,
  AVG_TIMER_WAIT / 1000000000 as avg_ms,
  SUM_TIMER_WAIT / 1000000000 as total_ms,
  SUM_ROWS_EXAMINED as rows_examined
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;

-- Find table scans
SELECT
  OBJECT_SCHEMA,
  OBJECT_NAME,
  COUNT_READ as reads,
  COUNT_WRITE as writes,
  SUM_TIMER_WAIT / 1000000000 as total_ms
FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_SCHEMA NOT IN ('mysql', 'performance_schema', 'information_schema')
ORDER BY SUM_TIMER_WAIT DESC;
```

### Index Usage

```sql
-- Find unused indexes
SELECT
  object_schema,
  object_name,
  index_name,
  count_star,
  count_read
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE index_name IS NOT NULL
  AND count_star = 0
  AND object_schema NOT IN ('mysql', 'performance_schema', 'information_schema')
ORDER BY object_schema, object_name;
```

---

## Monitoring Checklist

Daily:
- [ ] Check slow query log for new patterns
- [ ] Review pg_stat_statements top 20 queries
- [ ] Monitor cache hit ratio (should be >99%)
- [ ] Check for bloated tables (dead tuples)

Weekly:
- [ ] Identify unused indexes
- [ ] Review table statistics (ANALYZE status)
- [ ] Analyze query plan changes
- [ ] Check disk space and growth trends

Monthly:
- [ ] Review all indexes for usage
- [ ] VACUUM FULL on heavily updated tables
- [ ] Update performance baselines
- [ ] Review and archive slow query logs

---

## Related Resources

- `explain-analysis.md` - Analyzing individual queries
- `optimization-workflow.md` - Systematic optimization
- `error-catalog.md` - Common issues to watch for
