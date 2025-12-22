# EXPLAIN ANALYZE - Reading Query Plans

**Last Updated**: 2025-12-15
**Database Support**: PostgreSQL 9.6+, MySQL 8.0+

Complete guide to understanding and using EXPLAIN ANALYZE for query optimization.

---

## PostgreSQL EXPLAIN Syntax

### Basic Usage

```sql
EXPLAIN
SELECT * FROM orders WHERE user_id = 123;

-- Output: Query plan (estimated)
-- Seq Scan on orders  (cost=0.00..150000.00 rows=1000 width=120)
--   Filter: (user_id = 123)
```

### ANALYZE - Actual Execution

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 123;

-- Output: Query plan + actual execution stats
-- Seq Scan on orders  (cost=0.00..150000.00 rows=1000 width=120)
--                      (actual time=0.123..2500.456 rows=100 loops=1)
--   Filter: (user_id = 123)
--   Rows Removed by Filter: 999900
-- Planning Time: 0.543 ms
-- Execution Time: 2500.789 ms
```

### Advanced Options

```sql
-- Most useful combination for optimization
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT * FROM orders WHERE user_id = 123;

-- Options:
-- ANALYZE: Execute query and show actual times
-- BUFFERS: Show I/O statistics (cache hits/misses)
-- VERBOSE: Show output columns and schema
-- FORMAT: TEXT (default), JSON, YAML, XML
```

---

## Reading EXPLAIN Output

### Cost Numbers

```
cost=0.42..150.00 rows=1000 width=120
```

- **0.42**: Startup cost (time to get first row)
- **150.00**: Total cost (time to get all rows)
- **rows=1000**: Estimated rows returned
- **width=120**: Average row size in bytes

**Units**: PostgreSQL "cost units" (not milliseconds). Compare relative costs.

### Actual vs Estimated

```
(cost=0.42..150.00 rows=1000 width=120)
(actual time=0.123..45.678 rows=980 loops=1)
```

- **actual time**: Real execution time in milliseconds
- **rows mismatch**: Estimated 1000, actual 980 (good!)
- **Large mismatch**: Update statistics with `ANALYZE table_name`

### Loops

```
(actual time=0.123..45.678 rows=100 loops=5)
```

- **loops=5**: Node executed 5 times (nested loop)
- **Total time**: 45.678 ms × 5 = 228.39 ms
- **Total rows**: 100 × 5 = 500 rows

---

## Common Node Types

### Sequential Scan

```
Seq Scan on orders  (cost=0.00..150000.00 rows=1000000)
  Filter: (user_id = 123)
  Rows Removed by Filter: 999900
```

**Meaning**: Full table scan, checking every row
**When OK**: Small tables (<1000 rows), queries returning most rows
**When BAD**: Large tables with selective filters
**Fix**: Add index on filter columns

### Index Scan

```
Index Scan using idx_orders_user on orders
  (cost=0.42..150.00 rows=100)
  Index Cond: (user_id = 123)
```

**Meaning**: Uses index to find rows, then fetches from table
**Good for**: Selective queries returning few rows
**Cost**: Index lookup + table access

### Index Only Scan

```
Index Only Scan using idx_orders_user_status on orders
  (cost=0.42..50.00 rows=100)
  Index Cond: ((user_id = 123) AND (status = 'pending'))
  Heap Fetches: 0
```

**Meaning**: All needed columns in index (covering index)
**Best performance**: No table access needed
**Heap Fetches**: 0 is ideal (all data from index)

### Bitmap Index Scan

```
Bitmap Heap Scan on orders  (cost=45.00..1500.00 rows=1000)
  Recheck Cond: (user_id = 123)
  ->  Bitmap Index Scan on idx_orders_user  (cost=0.00..44.75)
        Index Cond: (user_id = 123)
```

**Meaning**: Two-phase scan for moderate selectivity
1. Bitmap Index Scan: Build bitmap of matching pages
2. Bitmap Heap Scan: Fetch pages in physical order

**When used**: Returning 1-15% of table rows
**Benefit**: Reduces random I/O

### Nested Loop

```
Nested Loop  (cost=0.42..300.00 rows=100)
  ->  Seq Scan on users  (cost=0.00..50.00 rows=10)
        Filter: (status = 'active')
  ->  Index Scan using idx_orders_user on orders
        (cost=0.42..25.00 rows=10)
        Index Cond: (user_id = users.id)
```

**Meaning**: For each row from outer table, find matches in inner table
**Good for**: Small outer table (10-100 rows)
**Bad for**: Large outer table (sequential scan × loops)
**Fix**: Add index on join column, filter outer table

### Hash Join

```
Hash Join  (cost=150.00..500.00 rows=1000)
  Hash Cond: (orders.user_id = users.id)
  ->  Seq Scan on orders  (cost=0.00..300.00 rows=10000)
  ->  Hash  (cost=50.00..50.00 rows=100)
        ->  Seq Scan on users  (cost=0.00..50.00 rows=100)
              Filter: (status = 'active')
```

**Meaning**: Build hash table from inner table, probe with outer
**Good for**: Large tables, equality joins
**Memory**: Requires `work_mem` for hash table
**Fast**: O(n + m) complexity

### Merge Join

```
Merge Join  (cost=100.00..400.00 rows=1000)
  Merge Cond: (orders.user_id = users.id)
  ->  Index Scan using idx_orders_user on orders
  ->  Index Scan using users_pkey on users
```

**Meaning**: Both inputs pre-sorted, merge like zipper
**Good for**: Large sorted inputs, range joins
**Requires**: Both inputs sorted on join key

---

## Buffer Statistics

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 123;
```

### Example Output

```
Index Scan using idx_orders_user on orders
  (cost=0.42..150.00 rows=100)
  Buffers: shared hit=15 read=5
Planning:
  Buffers: shared hit=10
Planning Time: 0.543 ms
Execution Time: 45.678 ms
```

### Buffer Types

- **shared hit**: Pages found in shared buffer cache (fast!)
- **shared read**: Pages read from disk (slow!)
- **temp read/written**: Temporary files (sort/hash spills)
- **local hit/read**: Local buffers (temp tables)

### What to Look For

```
Buffers: shared hit=1000 read=10
```
- **Good**: 99% cache hit rate (1000/(1000+10))
- **Warm cache**: Most data in memory

```
Buffers: shared hit=100 read=10000
```
- **Bad**: 1% cache hit rate (100/(100+10000))
- **Cold cache** or data doesn't fit in memory
- **Fix**: Increase `shared_buffers`, add indexes to reduce data read

```
Buffers: temp read=5000 written=5000
```
- **Warning**: Sorts/hashes spilling to disk
- **Fix**: Increase `work_mem`, optimize query to reduce data

---

## Optimization Workflow

### 1. Identify Slow Query

```sql
-- Find slowest queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 2. Analyze Query Plan

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
<your slow query here>;
```

### 3. Look for Red Flags

- [ ] **Seq Scan on large tables** → Add index
- [ ] **Rows mismatch** (estimated vs actual) → Run `ANALYZE`
- [ ] **Nested Loop with large outer** → Add filter or index
- [ ] **High "Rows Removed by Filter"** → Improve filter selectivity
- [ ] **Temp read/written** → Increase `work_mem`
- [ ] **Low shared hit ratio** → Add index or increase `shared_buffers`

### 4. Make Changes

```sql
-- Add index
CREATE INDEX idx_orders_user ON orders(user_id);

-- Update statistics
ANALYZE orders;

-- Adjust configuration
SET work_mem = '256MB';
```

### 5. Re-analyze

```sql
EXPLAIN (ANALYZE, BUFFERS)
<your slow query here>;

-- Compare:
-- - Execution time decreased?
-- - Node types improved (Index Scan vs Seq Scan)?
-- - Buffer cache hits increased?
```

---

## MySQL EXPLAIN Syntax

### Basic Usage

```sql
EXPLAIN
SELECT * FROM orders WHERE user_id = 123;

-- Output: Table-based format
+----+-------------+--------+------+---------------+------+---------+------+------+-------------+
| id | select_type | table  | type | possible_keys | key  | key_len | ref  | rows | Extra       |
+----+-------------+--------+------+---------------+------+---------+------+------+-------------+
|  1 | SIMPLE      | orders | ALL  | NULL          | NULL | NULL    | NULL | 1000 | Using where |
+----+-------------+--------+------+---------------+------+---------+------+------+-------------+
```

### EXPLAIN ANALYZE (MySQL 8.0.18+)

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 123\G

-- Output: Tree format with actual times
-> Filter: (orders.user_id = 123)  (cost=101.00 rows=100)
   (actual time=0.123..45.678 rows=100 loops=1)
   -> Table scan on orders  (cost=101.00 rows=1000)
      (actual time=0.050..40.123 rows=1000 loops=1)
```

### Key Columns

- **type**: Access method (const > eq_ref > ref > range > index > ALL)
  - `const`: Single row (primary key/unique lookup)
  - `eq_ref`: One match per previous row (unique index JOIN)
  - `ref`: Multiple matches (non-unique index)
  - `range`: Index range scan (BETWEEN, >, <)
  - `index`: Full index scan
  - `ALL`: Full table scan (worst!)

- **possible_keys**: Indexes MySQL considers
- **key**: Index actually used (NULL = no index)
- **rows**: Estimated rows examined
- **Extra**:
  - `Using index`: Covering index (good!)
  - `Using where`: Filter applied after fetch
  - `Using filesort`: Expensive sort operation
  - `Using temporary`: Temporary table created

---

## Common EXPLAIN Patterns

### Pattern: Index Not Used Despite Existing

```sql
-- Index exists but not used
CREATE INDEX idx_orders_status ON orders(status);

EXPLAIN SELECT * FROM orders WHERE status = 'pending';
-- Shows: Seq Scan (not using index!)
```

**Cause**: Too many matching rows (>15% of table)
**Fix**: Index not selective enough, sequential scan is actually faster
**Solution**: Accept seq scan or add composite index with more selective column

### Pattern: Index Scan vs Bitmap Scan

```sql
-- Returns 10 rows → Index Scan
EXPLAIN SELECT * FROM orders WHERE user_id = 123;
-- Index Scan using idx_orders_user

-- Returns 1000 rows → Bitmap Scan
EXPLAIN SELECT * FROM orders WHERE status = 'pending';
-- Bitmap Heap Scan using idx_orders_status
```

**When**: PostgreSQL chooses based on selectivity
- **<1% of rows**: Index Scan (random I/O acceptable)
- **1-15% of rows**: Bitmap Scan (reduce random I/O)
- **>15% of rows**: Seq Scan (sequential I/O fastest)

### Pattern: Join Order Matters

```sql
-- Small table first (better)
EXPLAIN
SELECT * FROM small_table s
JOIN large_table l ON s.id = l.small_id
WHERE s.status = 'active';
-- Nested Loop: 10 rows × index lookup

-- Large table first (worse)
EXPLAIN
SELECT * FROM large_table l
JOIN small_table s ON l.small_id = s.id
WHERE s.status = 'active';
-- Hash Join: Build hash table from large table
```

**Tip**: Filter to smallest result set first

---

## Quick Reference

| Goal | Command |
|------|---------|
| View plan only | `EXPLAIN <query>` |
| View plan + actual execution | `EXPLAIN ANALYZE <query>` |
| Include buffer stats | `EXPLAIN (ANALYZE, BUFFERS) <query>` |
| Full verbose output | `EXPLAIN (ANALYZE, BUFFERS, VERBOSE) <query>` |
| JSON format | `EXPLAIN (ANALYZE, FORMAT JSON) <query>` |
| MySQL actual execution | `EXPLAIN ANALYZE <query>` (8.0.18+) |

## Related Resources

- `error-catalog.md` - Common optimization errors
- `index-strategies.md` - When to create indexes
- `performance-monitoring.md` - Long-term monitoring tools
