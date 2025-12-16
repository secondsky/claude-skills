-- Query Optimization Templates
-- Before/After patterns

-- ============================================
-- Pattern 1: SELECT * → SELECT specific columns
-- ============================================

-- Before (bad)
SELECT * FROM users WHERE id = 123;

-- After (good)
SELECT id, name, email FROM users WHERE id = 123;

-- ============================================
-- Pattern 2: Subquery → JOIN
-- ============================================

-- Before (slow)
SELECT * FROM orders
WHERE user_id IN (SELECT id FROM users WHERE status = 'active');

-- After (fast)
SELECT o.* FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.status = 'active';

-- ============================================
-- Pattern 3: N+1 Queries → Single JOIN
-- ============================================

-- Before (1 + N queries)
-- SELECT * FROM users;
-- For each user:
--   SELECT * FROM orders WHERE user_id = ?;

-- After (1 query)
SELECT u.*, o.id as order_id, o.total, o.created_at
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- ============================================
-- Pattern 4: Leading wildcard → Full-text search
-- ============================================

-- Before (cannot use index)
SELECT * FROM products WHERE name LIKE '%laptop%';

-- After (uses index)
SELECT * FROM products
WHERE to_tsvector('english', name) @@ to_tsquery('english', 'laptop');

-- ============================================
-- Pattern 5: Multiple INSERTs → Batch INSERT
-- ============================================

-- Before (slow)
INSERT INTO logs (message, level) VALUES ('msg1', 'info');
INSERT INTO logs (message, level) VALUES ('msg2', 'warn');

-- After (fast)
INSERT INTO logs (message, level) VALUES
  ('msg1', 'info'),
  ('msg2', 'warn'),
  ('msg3', 'error');

-- ============================================
-- Pattern 6: OFFSET pagination → Cursor pagination
-- ============================================

-- Before (slow for large offsets)
SELECT * FROM posts ORDER BY created_at OFFSET 10000 LIMIT 100;

-- After (constant time)
SELECT * FROM posts
WHERE created_at < '2025-01-01 12:00:00'
ORDER BY created_at DESC
LIMIT 100;

-- ============================================
-- Pattern 7: OR → UNION ALL (for indexes)
-- ============================================

-- Before (cannot use both indexes)
SELECT * FROM products
WHERE category_id = 5 OR brand_id = 10;

-- After (uses both indexes)
SELECT * FROM products WHERE category_id = 5
UNION ALL
SELECT * FROM products WHERE brand_id = 10 AND category_id <> 5;
