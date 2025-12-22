# Database Data Types Guide

**Last Updated**: 2025-12-15

Complete guide to choosing correct data types for PostgreSQL and MySQL.

---

## Primary Keys

### UUID (Recommended)
```sql
-- PostgreSQL
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- Pros: Globally unique, no sequence conflicts, merge-friendly
-- Cons: 16 bytes (vs 8), slightly slower indexing
```

### BIGSERIAL / BIGINT AUTO_INCREMENT
```sql
-- PostgreSQL
id BIGSERIAL PRIMARY KEY

-- MySQL
id BIGINT AUTO_INCREMENT PRIMARY KEY

-- Pros: 8 bytes, sequential, fast indexing
-- Cons: Predictable, not globally unique
```

---

## Text & Strings

| Use Case | PostgreSQL | MySQL | Example |
|----------|------------|-------|---------|
| Email | VARCHAR(255) | VARCHAR(255) | user@example.com |
| Name | VARCHAR(100) | VARCHAR(100) | John Doe |
| Short code | VARCHAR(20) | VARCHAR(20) | SKU-123 |
| Unlimited text | TEXT | TEXT | Blog post content |
| Fixed length | CHAR(2) | CHAR(2) | US (country code) |

**Rules**:
- Use VARCHAR for variable length
- Use TEXT for unlimited content
- Never use VARCHAR(MAX)
- CHAR only for fixed-length (country codes, etc.)

---

## Numbers

### Integers
```sql
-- Small numbers (-32,768 to 32,767)
SMALLINT  -- 2 bytes

-- Standard integers (-2B to 2B)
INTEGER   -- 4 bytes

-- Large numbers
BIGINT    -- 8 bytes

-- Auto-increment
SERIAL, BIGSERIAL  -- PostgreSQL
AUTO_INCREMENT     -- MySQL
```

### Decimals
```sql
-- Money (ALWAYS use DECIMAL, never FLOAT)
price DECIMAL(10, 2)  -- $99,999,999.99

-- Percentages
discount DECIMAL(5, 2)  -- 0.00 to 999.99

-- Scientific (only when precision not critical)
FLOAT, DOUBLE PRECISION
```

**Never use FLOAT for money!**

---

## Dates & Times

```sql
-- Date only (2025-01-15)
event_date DATE

-- Timestamp without timezone
created_at TIMESTAMP DEFAULT NOW()

-- Timestamp with timezone (RECOMMENDED)
created_at TIMESTAMPTZ DEFAULT NOW()  -- PostgreSQL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- MySQL 8.0+

-- Time only
business_hours TIME
```

**Always use TIMESTAMPTZ** (PostgreSQL) for timezone awareness.

---

## Boolean

```sql
-- PostgreSQL
is_active BOOLEAN DEFAULT true

-- MySQL
is_active BOOLEAN  -- Stored as TINYINT(1)
```

---

## JSON

```sql
-- PostgreSQL (ALWAYS use JSONB, not JSON)
metadata JSONB

-- Index JSONB fields
CREATE INDEX idx_metadata_brand ON products ((metadata->>'brand'));

-- MySQL 8.0+
metadata JSON
```

**PostgreSQL**: Use JSONB (binary, faster, indexable)
**MySQL**: Use JSON (native support in 8.0+)

---

## Enumerations

**Don't use ENUM type!** Use VARCHAR with CHECK:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'canceled'))
);
```

**Why not ENUM**:
- Cannot modify values without migration
- Ordering is implicit
- Limited to 64KB total
- CHECK is more flexible

---

## Arrays (PostgreSQL Only)

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  tags TEXT[]  -- Array of strings
);

-- Query arrays
SELECT * FROM posts WHERE 'postgresql' = ANY(tags);

-- Index arrays
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
```

**Alternative**: Many-to-many junction table (more normalized)

---

## Binary Data

```sql
-- Small files (<1MB)
avatar BYTEA  -- PostgreSQL
avatar BLOB   -- MySQL

-- Large files
-- DON'T store in database!
-- Use object storage (S3, R2) and store URL
avatar_url VARCHAR(500)
```

---

## Quick Reference

| Data | PostgreSQL | MySQL | Size |
|------|------------|-------|------|
| Primary Key | UUID | BINARY(16) | 16 bytes |
| Auto-increment | BIGSERIAL | BIGINT AUTO_INCREMENT | 8 bytes |
| Email | VARCHAR(255) | VARCHAR(255) | Variable |
| Name | VARCHAR(100) | VARCHAR(100) | Variable |
| Money | DECIMAL(10,2) | DECIMAL(10,2) | Variable |
| Yes/No | BOOLEAN | BOOLEAN | 1 byte |
| Date | DATE | DATE | 4 bytes |
| Timestamp | TIMESTAMPTZ | TIMESTAMP | 8 bytes |
| JSON | JSONB | JSON | Variable |
| Text | TEXT | TEXT | Variable |
| Enum | VARCHAR + CHECK | VARCHAR + CHECK | Variable |

---

## Common Mistakes

❌ Using FLOAT for money
✅ Use DECIMAL(10,2)

❌ Using VARCHAR for dates
✅ Use DATE or TIMESTAMPTZ

❌ Using INT for boolean
✅ Use BOOLEAN

❌ Using TEXT for everything
✅ Use VARCHAR with appropriate length

❌ Storing files in database
✅ Store URLs, files in object storage

---

## Related Resources

- `error-catalog.md` - Wrong data type errors
- `constraints-catalog.md` - Type-related constraints
- `schema-design-patterns.md` - Best practices
