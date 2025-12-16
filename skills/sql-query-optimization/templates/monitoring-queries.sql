-- Database Performance Monitoring Queries
-- PostgreSQL & MySQL

-- ============================================
-- PostgreSQL: Find Slow Queries
-- ============================================

-- Requires: CREATE EXTENSION pg_stat_statements;

SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  stddev_exec_time,
  max_exec_time,
  rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ============================================
-- PostgreSQL: Find Unused Indexes
-- ============================================

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid NOT IN (
    SELECT indexrelid FROM pg_index WHERE indisunique
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- PostgreSQL: Cache Hit Ratio
-- ============================================

SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit)  as heap_hit,
  round(
    sum(heap_blks_hit)::numeric /
    NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100,
    2
  ) as cache_hit_ratio_pct
FROM pg_statio_user_tables;

-- Should be >99%

-- ============================================
-- PostgreSQL: Tables Needing ANALYZE
-- ============================================

SELECT
  schemaname,
  tablename,
  last_analyze,
  last_autoanalyze,
  n_mod_since_analyze,
  n_live_tup
FROM pg_stat_user_tables
WHERE n_mod_since_analyze > 10000
ORDER BY n_mod_since_analyze DESC;

-- ============================================
-- PostgreSQL: Bloated Tables
-- ============================================

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

-- ============================================
-- MySQL: Find Slow Statements
-- ============================================

SELECT
  DIGEST_TEXT,
  COUNT_STAR as executions,
  AVG_TIMER_WAIT / 1000000000 as avg_ms,
  MAX_TIMER_WAIT / 1000000000 as max_ms,
  SUM_TIMER_WAIT / 1000000000 as total_ms,
  SUM_ROWS_EXAMINED as rows_examined
FROM performance_schema.events_statements_summary_by_digest
WHERE DIGEST_TEXT IS NOT NULL
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;

-- ============================================
-- MySQL: Find Unused Indexes
-- ============================================

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
  AND object_schema NOT IN ('mysql', 'performance_schema', 'information_schema')
ORDER BY object_schema, object_name;

-- ============================================
-- MySQL: Table Scan Summary
-- ============================================

SELECT
  OBJECT_SCHEMA,
  OBJECT_NAME,
  COUNT_READ as total_reads,
  COUNT_WRITE as total_writes,
  SUM_TIMER_WAIT / 1000000000 as total_ms
FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_SCHEMA NOT IN ('mysql', 'performance_schema', 'information_schema')
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;
