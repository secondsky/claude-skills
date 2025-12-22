# Schema Design Patterns & Best Practices

**Last Updated**: 2025-12-15

Production-tested patterns for database schema design.

---

## Pattern: Audit Columns

**Every table should track when and who**

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,

  -- Audit columns
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Auto-update updated_at trigger (PostgreSQL)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## Pattern: Soft Deletes

**Mark as deleted instead of removing**

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,  -- NULL = active

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query only active records
SELECT * FROM posts WHERE deleted_at IS NULL;

-- Soft delete
UPDATE posts SET deleted_at = NOW() WHERE id = '...';

-- Partial unique index (PostgreSQL) - unique title among active posts only
CREATE UNIQUE INDEX idx_posts_title_active
ON posts(title) WHERE deleted_at IS NULL;
```

---

## Pattern: Versioning / History

**Track changes over time**

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  version INT NOT NULL DEFAULT 1
);

CREATE TABLE products_history (
  id UUID,
  version INT,
  name VARCHAR(200),
  price DECIMAL(10,2),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES users(id),
  PRIMARY KEY (id, version)
);

-- Trigger to save history on update
CREATE TRIGGER products_history_trigger
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION save_product_history();
```

---

## Pattern: Polymorphic Ownership (Avoid!)

**Anti-pattern**:
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  commentable_type VARCHAR(50),  -- 'Post' or 'Photo'
  commentable_id UUID,           -- No foreign key!
  content TEXT
);
```

**Better: Separate tables**:
```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id),
  content TEXT NOT NULL
);

CREATE TABLE photo_comments (
  id UUID PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES photos(id),
  content TEXT NOT NULL
);
```

---

## Pattern: Flexible Attributes (JSONB)

**When you need dynamic fields**

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),

  -- Structured required fields above
  -- Flexible optional attributes below
  attributes JSONB
);

-- Index JSONB fields
CREATE INDEX idx_products_brand
ON products ((attributes->>'brand'));

CREATE INDEX idx_products_attributes
ON products USING GIN(attributes);

-- Query
SELECT * FROM products
WHERE attributes->>'color' = 'Red'
  AND (attributes->>'size')::int > 10;
```

---

## Pattern: Status Machine

**State transitions with validation**

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'processing', 'shipped',
      'delivered', 'canceled', 'refunded'
    )),
  status_changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track status history
CREATE TABLE order_status_history (
  order_id UUID REFERENCES orders(id),
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES users(id),
  notes TEXT
);
```

---

## Pattern: Hierarchical Data

**Option 1: Adjacency List (simple)**:
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id)
);

-- Query with recursive CTE
WITH RECURSIVE tree AS (
  SELECT id, name, parent_id, 1 as level
  FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.name, c.parent_id, t.level + 1
  FROM categories c
  JOIN tree t ON c.parent_id = t.id
)
SELECT * FROM tree ORDER BY level, name;
```

**Option 2: Materialized Path (faster reads)**:
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  path TEXT NOT NULL  -- '/electronics/computers/laptops/'
);

-- Find all descendants
SELECT * FROM categories WHERE path LIKE '/electronics/%';

-- Index for fast lookups
CREATE INDEX idx_categories_path ON categories(path);
```

---

## Pattern: Multi-Tenancy

**Option 1: Shared schema with tenant_id**:
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  UNIQUE (organization_id, email)
);

-- Row Level Security (PostgreSQL)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_isolation ON users
  USING (organization_id = current_setting('app.current_org')::uuid);
```

**Option 2: Separate schemas per tenant** (PostgreSQL):
```sql
CREATE SCHEMA org_abc;
CREATE TABLE org_abc.users (...);

CREATE SCHEMA org_xyz;
CREATE TABLE org_xyz.users (...);
```

---

## Pattern: UUID vs BIGSERIAL

**UUID Pros**:
- Globally unique
- No coordination needed
- Merge-friendly
- Cannot guess next ID

**UUID Cons**:
- 16 bytes (vs 8)
- Slower indexing
- Less human-readable

**BIGSERIAL Pros**:
- 8 bytes
- Sequential (better B-tree)
- Fast
- Human-readable

**BIGSERIAL Cons**:
- Predictable
- Coordination needed
- Not globally unique

**Recommendation**: Use UUID unless strong performance requirement

---

## Pattern: Naming Conventions

**Tables**:
- Plural nouns: `users`, `products`, `orders`
- Lowercase with underscores: `order_items`

**Columns**:
- Singular: `user_id`, `product_name`
- Foreign keys: `{table}_id` (e.g., `user_id`)
- Booleans: `is_active`, `has_shipped`
- Timestamps: `created_at`, `updated_at`, `deleted_at`

**Indexes**:
- `idx_{table}_{column(s)}`: `idx_users_email`
- `idx_{table}_{purpose}`: `idx_users_active`

**Constraints**:
- `pk_{table}`: Primary key
- `fk_{table}_{ref_table}`: Foreign key
- `uq_{table}_{column}`: Unique
- `ck_{table}_{purpose}`: Check

---

## Anti-Patterns to Avoid

❌ **God Tables** (100+ columns)
✅ Split into related tables

❌ **EAV (Entity-Attribute-Value)**
✅ Use proper columns or JSONB

❌ **Polymorphic associations**
✅ Separate junction tables

❌ **Premature denormalization**
✅ Start normalized, denormalize with data

❌ **VARCHAR(MAX) everywhere**
✅ Use appropriate lengths

❌ **Missing foreign keys**
✅ Always define relationships

❌ **No indexes on foreign keys**
✅ Index all foreign keys

❌ **Missing audit columns**
✅ Always track created_at, updated_at

---

## Schema Review Checklist

Before deploying:
- [ ] All tables have primary keys
- [ ] All relationships have foreign keys
- [ ] Foreign keys have indexes
- [ ] All required fields are NOT NULL
- [ ] Appropriate CHECK constraints added
- [ ] Audit columns present (created_at, updated_at)
- [ ] Proper data types chosen
- [ ] Naming conventions followed
- [ ] Normalized to at least 3NF
- [ ] ON DELETE/UPDATE actions specified
- [ ] Unique constraints where needed
- [ ] Indexes on frequently queried columns

---

## Related Resources

- `error-catalog.md` - Common schema mistakes
- `normalization-guide.md` - Normalization levels
- `relationship-patterns.md` - Relationship types
- `data-types-guide.md` - Choosing types
- `constraints-catalog.md` - All constraints
