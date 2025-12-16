-- Index Creation Templates
-- Replace table_name and column names

-- Single column index
CREATE INDEX idx_table_column ON table_name(column_name);

-- Composite index (2-3 columns)
CREATE INDEX idx_table_multi ON table_name(col1, col2, col3);

-- Covering index (PostgreSQL 11+)
CREATE INDEX idx_table_covering ON table_name(col1, col2)
INCLUDE (col3, col4, col5);

-- Partial index (filtered)
CREATE INDEX idx_table_partial ON table_name(column_name)
WHERE status = 'active' AND deleted_at IS NULL;

-- Expression index
CREATE INDEX idx_table_lower_email ON table_name(LOWER(email));

-- Unique index
CREATE UNIQUE INDEX idx_table_unique ON table_name(email);

-- GIN index for full-text search (PostgreSQL)
CREATE INDEX idx_table_fts ON table_name
USING GIN(to_tsvector('english', column_name));

-- Concurrent index creation (non-blocking)
CREATE INDEX CONCURRENTLY idx_table_column ON table_name(column_name);

-- Drop index
DROP INDEX CONCURRENTLY idx_table_column;

-- Rebuild index (PostgreSQL)
REINDEX INDEX CONCURRENTLY idx_table_column;
