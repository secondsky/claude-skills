-- EXPLAIN Query Templates
-- Copy and modify for your queries

-- Basic EXPLAIN (shows estimated plan)
EXPLAIN
SELECT * FROM orders WHERE user_id = 123;

-- EXPLAIN ANALYZE (shows actual execution)
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 123;

-- Full analysis with buffer stats (recommended)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM orders WHERE user_id = 123;

-- JSON format for programmatic analysis
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM orders WHERE user_id = 123;

-- MySQL EXPLAIN (8.0.18+)
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 123\G

-- Compare before/after optimization
-- Save before output:
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE status = 'pending';

-- Create index
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);

-- Run again and compare
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE status = 'pending';
