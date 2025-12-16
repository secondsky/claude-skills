# Database Schema Design - Error Catalog

**Last Updated**: 2025-12-15
**Errors Documented**: 12
**Production Tested**: PostgreSQL 14-17, MySQL 8.0+

This catalog documents common database schema design errors, their symptoms, root causes, and verified solutions.

---

## Error 1: Missing Primary Key

**Symptom**:
```sql
CREATE TABLE orders (
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INT
);
-- No primary key!
```

**Root Cause**:
- Table has no unique identifier for rows
- Cannot reliably update/delete specific records
- Foreign key references impossible
- ORMs fail or create incorrect queries

**Solution**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INT NOT NULL
);

-- Or use composite primary key
CREATE TABLE order_items (
  order_id UUID,
  product_id UUID,
  quantity INT NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
```

**Prevention**:
- Every table must have a primary key
- Use UUID or BIGSERIAL for single-column PKs
- Use composite PKs only for junction tables

---

## Error 2: No Foreign Key Constraints

**Symptom**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID  -- No foreign key constraint!
);

-- Orphaned records possible
INSERT INTO orders (id, user_id) VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000');
-- Succeeds even if user doesn't exist!
```

**Root Cause**:
- No referential integrity enforcement
- Orphaned records accumulate
- Data inconsistency
- Cannot rely on joins returning valid data

**Solution**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Now orphaned records are prevented
INSERT INTO orders (id, user_id) VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000');
-- ERROR: foreign key constraint violated
```

**Prevention**:
- Always add REFERENCES constraint for foreign keys
- Choose appropriate ON DELETE action (CASCADE, SET NULL, RESTRICT)
- Index all foreign key columns for JOIN performance

---

## Error 3: VARCHAR(MAX) Everywhere

**Symptom**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(65535),      -- Excessive!
  name VARCHAR(65535),        -- Excessive!
  address VARCHAR(65535)      -- Excessive!
);
```

**Root Cause**:
- Wasted storage space
- Slower index performance
- No validation of input length
- Implies lack of domain understanding

**Solution**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,     -- Industry standard
  name VARCHAR(100) NOT NULL,       -- Reasonable max
  address VARCHAR(500),             -- Generous but bounded
  bio TEXT                          -- Truly variable length
);
```

**Prevention**:
- Use appropriate VARCHAR lengths based on domain
- Email: VARCHAR(255)
- Names: VARCHAR(50-100)
- Codes/SKUs: VARCHAR(20-50)
- Use TEXT for truly unbounded content

---

## Error 4: Denormalization Without Justification

**Symptom**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  user_email VARCHAR(255),    -- Denormalized!
  user_name VARCHAR(100),     -- Denormalized!
  total DECIMAL(10,2)
);
```

**Root Cause**:
- Data duplication
- Update anomalies (email changes in users but not orders)
- Inconsistent data
- Premature optimization

**Solution**:
```sql
-- Normalized approach
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  total DECIMAL(10,2) NOT NULL
);

-- Denormalize ONLY when:
-- 1. Query performance measured and insufficient
-- 2. Data is truly immutable (e.g., snapshot at order time)
-- 3. Read:write ratio is 100:1 or higher
```

**Prevention**:
- Start normalized (3NF)
- Denormalize only with measurement
- Document why denormalization is needed
- Consider materialized views instead

---

## Error 5: Missing NOT NULL Constraints

**Symptom**:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200),      -- Nullable!
  price DECIMAL(10,2)     -- Nullable!
);

-- Invalid data accepted
INSERT INTO products (id) VALUES (gen_random_uuid());
-- Product with no name or price!
```

**Root Cause**:
- Application-level validation bypassed
- NULL handling complexity in queries
- Data quality issues
- Ambiguous semantics (missing vs. unknown)

**Solution**:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  description TEXT,           -- Explicitly nullable
  deleted_at TIMESTAMPTZ      -- Explicitly nullable for soft deletes
);
```

**Prevention**:
- Make columns NOT NULL by default
- Only allow NULL when absence is valid (optional fields)
- Use empty string, 0, or default values instead of NULL when appropriate

---

## Error 6: No Indexes on Foreign Keys

**Symptom**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id)
  -- No index on user_id!
);

-- Slow JOIN queries
SELECT * FROM orders o
JOIN users u ON o.user_id = u.id;
-- Sequential scan on orders table
```

**Root Cause**:
- PostgreSQL/MySQL don't auto-index foreign keys
- JOIN operations require full table scan
- Cascading deletes are slow

**Solution**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Always index foreign keys
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Now JOINs are fast
EXPLAIN SELECT * FROM orders o JOIN users u ON o.user_id = u.id;
-- Index Scan using idx_orders_user_id
```

**Prevention**:
- Create index on every foreign key column
- Use naming convention: `idx_{table}_{column}`
- Include in migration templates

---

## Error 7: Wrong Data Types (Dates as Strings)

**Symptom**:
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  event_date VARCHAR(50)  -- Storing '2025-01-15' as string!
);

-- Cannot use date functions
SELECT * FROM events WHERE event_date > NOW();  -- ERROR!
SELECT * FROM events WHERE event_date > '2025-01-01';  -- Lexical comparison!
-- '2025-02-01' < '2025-12-01' ✗ Wrong!
```

**Root Cause**:
- Prevents date arithmetic
- String sorting not chronological
- Wastes storage (50 bytes vs. 8 bytes)
- Cannot validate date validity

**Solution**:
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now date operations work
SELECT * FROM events WHERE event_date > NOW();  -- ✓
SELECT * FROM events WHERE event_date > CURRENT_DATE - INTERVAL '30 days';  -- ✓
```

**Common Type Mistakes**:
- Dates → Use DATE, TIMESTAMP, TIMESTAMPTZ
- Money → Use DECIMAL(10,2), not FLOAT
- Booleans → Use BOOLEAN, not VARCHAR/INT
- JSON → Use JSONB (PostgreSQL), not TEXT
- Enums → Use VARCHAR with CHECK, not INT

---

## Error 8: Missing CHECK Constraints

**Symptom**:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  price DECIMAL(10,2),
  stock INT
);

-- Invalid data accepted
INSERT INTO products VALUES (gen_random_uuid(), -50.00, -100);
-- Negative price and stock!
```

**Root Cause**:
- No database-level validation
- Application bugs can corrupt data
- Data quality issues
- Business rule violations

**Solution**:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL CHECK (stock >= 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'archived')),
  discount_pct DECIMAL(5,2) CHECK (discount_pct >= 0 AND discount_pct <= 100)
);

-- Now invalid data is rejected
INSERT INTO products (id, name, price, stock, status)
VALUES (gen_random_uuid(), 'Test', -50, 10, 'active');
-- ERROR: check constraint violated
```

**Prevention**:
- Add CHECK for numeric ranges (price >= 0)
- Use CHECK for enum values
- Validate relationships (start_date < end_date)
- Document business rules in constraints

---

## Error 9: No Audit Columns

**Symptom**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total DECIMAL(10,2)
  -- No created_at, updated_at!
);

-- Cannot answer:
-- - When was this order created?
-- - When was it last modified?
-- - Who modified it?
```

**Root Cause**:
- No temporal tracking
- Debugging issues difficult
- Compliance requirements unmet
- Cannot identify stale data

**Solution**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  total DECIMAL(10,2) NOT NULL,

  -- Audit columns
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Trigger to auto-update updated_at (PostgreSQL)
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Prevention**:
- Always include created_at, updated_at
- Consider created_by, updated_by for user tracking
- Use TIMESTAMPTZ for timezone awareness
- Add soft delete column: deleted_at TIMESTAMPTZ

---

## Error 10: Circular Dependencies

**Symptom**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  default_address_id UUID REFERENCES addresses(id)  -- Forward reference!
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id)  -- Circular!
);

-- ERROR: relation "addresses" does not exist
```

**Root Cause**:
- Cannot create either table first
- Chicken-and-egg problem
- Poor schema design

**Solution**:
```sql
-- Option 1: Remove circular reference
CREATE TABLE users (
  id UUID PRIMARY KEY
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  is_default BOOLEAN DEFAULT false
);

-- Option 2: Add foreign key after both tables exist
CREATE TABLE users (
  id UUID PRIMARY KEY,
  default_address_id UUID  -- No constraint yet
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id)
);

-- Now add the circular reference
ALTER TABLE users
ADD CONSTRAINT fk_users_default_address
FOREIGN KEY (default_address_id) REFERENCES addresses(id);
```

**Prevention**:
- Avoid circular references when possible
- Use boolean flags (is_default) instead
- If necessary, add constraint after table creation
- Document the dependency

---

## Error 11: Missing ON DELETE/ON UPDATE Cascades

**Symptom**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id)  -- No ON DELETE specified!
);

-- Cannot delete user with orders
DELETE FROM users WHERE id = '123...';
-- ERROR: foreign key constraint violated
-- Orders still reference this user
```

**Root Cause**:
- Default is RESTRICT (prevent deletion)
- Forces manual cleanup
- Business logic unclear
- Data integrity ambiguous

**Solution**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Now deleting user also deletes their orders
DELETE FROM users WHERE id = '123...';
-- Success! All associated orders also deleted

-- Other options:
-- ON DELETE SET NULL - for optional relationships
-- ON DELETE RESTRICT - prevent deletion (default)
-- ON DELETE NO ACTION - same as RESTRICT
-- ON UPDATE CASCADE - update references when PK changes
```

**Common Patterns**:
- **CASCADE**: Orders, comments, sessions (dependent data)
- **SET NULL**: Last login device, optional references
- **RESTRICT**: Prevent deletion of referenced data (invoices, audit logs)

---

## Error 12: EAV Anti-Pattern

**Symptom**:
```sql
-- Entity-Attribute-Value (EAV) anti-pattern
CREATE TABLE entity_attributes (
  entity_id UUID,
  attribute_name VARCHAR(100),
  attribute_value TEXT
);

-- Storing product data as key-value pairs
INSERT INTO entity_attributes VALUES
  ('prod-1', 'name', 'Laptop'),
  ('prod-1', 'price', '999.99'),
  ('prod-1', 'color', 'Silver');

-- Queries are complex and slow
SELECT
  e1.attribute_value as name,
  e2.attribute_value as price,
  e3.attribute_value as color
FROM entity_attributes e1
JOIN entity_attributes e2 ON e1.entity_id = e2.entity_id AND e2.attribute_name = 'price'
JOIN entity_attributes e3 ON e1.entity_id = e3.entity_id AND e3.attribute_name = 'color'
WHERE e1.attribute_name = 'name';
```

**Root Cause**:
- Over-generalization
- No type safety (everything is TEXT)
- Cannot enforce constraints
- Terrible query performance
- No indexing possible

**Solution**:
```sql
-- Proper schema design
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category_id UUID NOT NULL REFERENCES categories(id)
);

-- For truly dynamic attributes, use JSONB
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  attributes JSONB  -- For flexible, optional attributes
);

-- Index JSONB fields
CREATE INDEX idx_products_attributes_color
ON products ((attributes->>'color'));

-- Query is simple and fast
SELECT * FROM products WHERE attributes->>'color' = 'Silver';
```

**When EAV is Acceptable**:
- Configuration settings (low volume)
- Metadata/tags (non-critical)
- Admin-defined custom fields
- Temporary data transformations

**Prevention**:
- Design proper normalized tables
- Use JSONB for truly dynamic data
- Combine: structured columns + JSONB for extensions

---

## Quick Reference Table

| Error | Symptom | Fix |
|-------|---------|-----|
| No primary key | Cannot uniquely identify rows | Add `id UUID PRIMARY KEY` |
| No foreign keys | Orphaned records | Add `REFERENCES table(id)` |
| VARCHAR(MAX) | Wasted storage | Use appropriate lengths |
| Premature denormalization | Update anomalies | Start with 3NF |
| Missing NOT NULL | Invalid NULL values | Add `NOT NULL` to required fields |
| No FK indexes | Slow JOINs | `CREATE INDEX idx_table_fk ON table(fk)` |
| Wrong types | Cannot use proper functions | Use DATE not VARCHAR |
| No CHECK constraints | Invalid data accepted | Add `CHECK (price >= 0)` |
| No audit columns | Cannot track changes | Add created_at, updated_at |
| Circular dependencies | Cannot create tables | Redesign or defer constraint |
| No cascade rules | Cannot delete parents | Add `ON DELETE CASCADE` |
| EAV anti-pattern | Complex queries, no types | Use proper columns or JSONB |

---

## Related Resources

- `normalization-guide.md` - 1NF through 5NF with examples
- `relationship-patterns.md` - Modeling 1:1, 1:M, M:M
- `data-types-guide.md` - Choosing correct types
- `constraints-catalog.md` - All constraint types
- `schema-design-patterns.md` - Best practices and patterns
