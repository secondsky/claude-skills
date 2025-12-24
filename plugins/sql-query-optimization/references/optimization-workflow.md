# SQL Query Optimization Workflow

**Last Updated**: 2025-12-15

Systematic 6-step process for optimizing database queries.

---

## Step 1: Identify Slow Queries

### PostgreSQL
```sql
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time,
  stddev_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### MySQL
```sql
SELECT
  DIGEST_TEXT,
  COUNT_STAR,
  AVG_TIMER_WAIT / 1000000000 as avg_ms,
  SUM_TIMER_WAIT / 1000000000 as total_ms
FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 20;
```

### Prioritize by Impact
- **High**: mean_time > 100ms AND calls > 1000
- **Medium**: mean_time > 500ms OR calls > 10000
- **Low**: Everything else

---

## Step 2: Analyze with EXPLAIN

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
<your slow query>;
```

### Red Flags to Look For

1. **Seq Scan on large table**
   - Add index on filter columns

2. **Rows mismatch** (estimated vs actual)
   - Run `ANALYZE table_name`

3. **Nested Loop with high loops**
   - Add filter or index to reduce loops

4. **High "Rows Removed by Filter"**
   - Improve index selectivity

5. **Temp read/written**
   - Increase `work_mem`

6. **Low buffer cache hits**
   - Add index or increase `shared_buffers`

---

## Step 3: Create Optimization Hypothesis

Examples:
- "Adding index on user_id will eliminate sequential scan"
- "Rewriting subquery as JOIN will use hash join"
- "Increasing work_mem will prevent sort spill to disk"

---

## Step 4: Implement Change

### Add Index
```sql
-- Non-blocking in PostgreSQL
CREATE INDEX CONCURRENTLY idx_table_column ON table_name(column);

-- Verify index created
\d table_name
```

### Rewrite Query
```sql
-- Before
SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE status = 'active');

-- After
SELECT o.* FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.status = 'active';
```

### Update Statistics
```sql
ANALYZE table_name;
```

---

## Step 5: Measure Improvement

```sql
EXPLAIN (ANALYZE, BUFFERS)
<optimized query>;
```

### Compare Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Execution time | 2500ms | 45ms | 98% ↓ |
| Planning time | 0.5ms | 0.8ms | +60% (acceptable) |
| Rows scanned | 1M | 100 | 99.99% ↓ |
| Buffer reads | 10000 | 150 | 98.5% ↓ |
| Cache hit % | 50% | 95% | +90% |

### Success Criteria
- **Good**: 50%+ execution time reduction
- **Great**: 90%+ execution time reduction
- **Excellent**: 99%+ execution time reduction

---

## Step 6: Monitor Long-Term

### Track Index Usage (PostgreSQL)
```sql
SELECT idx_scan FROM pg_stat_user_indexes
WHERE indexrelname = 'idx_table_column';
```

If `idx_scan = 0` after 30 days, consider dropping.

### Track Query Performance
```sql
-- Set up monitoring query
SELECT
  query,
  mean_exec_time,
  stddev_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%your query pattern%'
ORDER BY queryid;
```

### Set Alerts
- Mean execution time > 100ms
- Standard deviation > 2x mean
- Cache hit ratio < 95%

---

## Common Optimization Patterns

### Pattern 1: Add Missing Index
**Symptom**: Seq Scan on large table
**Fix**: `CREATE INDEX idx ON table(column);`
**Impact**: 10-100x faster

### Pattern 2: Use Composite Index
**Symptom**: Multiple WHERE columns, index not used
**Fix**: `CREATE INDEX idx ON table(col1, col2);`
**Impact**: 5-50x faster

### Pattern 3: Covering Index
**Symptom**: Index Scan + many heap fetches
**Fix**: `CREATE INDEX idx ON table(col1) INCLUDE (col2, col3);`
**Impact**: 2-10x faster

### Pattern 4: Rewrite Subquery as JOIN
**Symptom**: Slow IN (SELECT...) subquery
**Fix**: Rewrite as `INNER JOIN`
**Impact**: 5-20x faster

### Pattern 5: Batch Operations
**Symptom**: N individual INSERTs
**Fix**: Single INSERT with multiple VALUES
**Impact**: 10-100x faster

### Pattern 6: Cursor Pagination
**Symptom**: Large OFFSET slow
**Fix**: WHERE id > last_id LIMIT 100
**Impact**: Constant time vs O(n)

---

## Decision Tree

```
Is query slow?
├─ No → Monitor, done
└─ Yes → Run EXPLAIN ANALYZE
    ├─ Seq Scan on large table?
    │   └─ Add index on filter columns
    ├─ Rows mismatch (est vs actual)?
    │   └─ Run ANALYZE table
    ├─ Nested Loop with high loops?
    │   └─ Add filter or index
    ├─ High Rows Removed by Filter?
    │   └─ Improve index selectivity
    ├─ Temp read/written?
    │   └─ Increase work_mem
    └─ Low cache hit ratio?
        └─ Add index or increase shared_buffers
```

---

## Quick Wins Checklist

- [ ] Index all foreign key columns
- [ ] Index columns in WHERE, JOIN, ORDER BY
- [ ] Replace SELECT * with specific columns
- [ ] Add LIMIT to unbounded queries
- [ ] Batch INSERT/UPDATE operations
- [ ] Use prepared statements
- [ ] Enable connection pooling
- [ ] Run ANALYZE after bulk changes
- [ ] Monitor pg_stat_statements daily
- [ ] Review and drop unused indexes monthly

---

## Related Resources

- `error-catalog.md` - Common errors and fixes
- `explain-analysis.md` - Reading EXPLAIN output
- `index-strategies.md` - Index selection guide
- `query-rewrites.md` - Before/after examples
