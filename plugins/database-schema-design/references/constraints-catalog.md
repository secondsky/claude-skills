# Database Constraints Catalog

**Last Updated**: 2025-12-15

Complete guide to all constraint types in PostgreSQL and MySQL.

---

## PRIMARY KEY

**Uniquely identifies each row**

```sql
-- Single column
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Composite (multiple columns)
CREATE TABLE order_items (
  order_id UUID,
  product_id UUID,
  PRIMARY KEY (order_id, product_id)
);

-- Named constraint
CREATE TABLE users (
  id UUID,
  CONSTRAINT pk_users PRIMARY KEY (id)
);
```

---

## FOREIGN KEY

**Referential integrity**

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- With explicit name
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);
```

### CASCADE Actions

```sql
-- Delete child when parent deleted
ON DELETE CASCADE

-- Set to NULL when parent deleted
ON DELETE SET NULL

-- Prevent parent deletion (default)
ON DELETE RESTRICT

-- Update references when parent key changes
ON UPDATE CASCADE
```

---

## UNIQUE

**No duplicate values**

```sql
-- Single column
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);

-- Multiple columns (composite unique)
CREATE TABLE user_settings (
  user_id UUID,
  setting_key VARCHAR(100),
  setting_value TEXT,
  UNIQUE (user_id, setting_key)
);

-- Partial unique (PostgreSQL)
CREATE UNIQUE INDEX idx_active_emails
ON users(email) WHERE deleted_at IS NULL;
```

---

## NOT NULL

**Require value**

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT  -- Nullable (optional)
);
```

---

## CHECK

**Validate data**

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,

  -- Range check
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL CHECK (stock >= 0),

  -- Enum check
  status VARCHAR(20) NOT NULL
    CHECK (status IN ('draft', 'active', 'archived')),

  -- Percentage check
  discount DECIMAL(5,2)
    CHECK (discount >= 0 AND discount <= 100),

  -- Date range
  start_date DATE,
  end_date DATE,
  CHECK (end_date IS NULL OR end_date >= start_date)
);
```

---

## DEFAULT

**Default value**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## GENERATED / COMPUTED

**Auto-calculated columns**

```sql
-- PostgreSQL GENERATED ALWAYS
CREATE TABLE products (
  id UUID PRIMARY KEY,
  price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0825,
  total_with_tax DECIMAL(10,2)
    GENERATED ALWAYS AS (price * (1 + tax_rate)) STORED
);

-- MySQL GENERATED
CREATE TABLE products (
  id BINARY(16) PRIMARY KEY,
  price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0825,
  total_with_tax DECIMAL(10,2)
    AS (price * (1 + tax_rate)) STORED
);
```

**STORED**: Physically stored, faster queries
**VIRTUAL**: Calculated on-the-fly, less storage

---

## EXCLUSION (PostgreSQL Only)

**Prevent overlapping ranges**

```sql
CREATE TABLE room_bookings (
  room_id UUID,
  during TSTZRANGE,  -- Timestamp range
  EXCLUDE USING GIST (
    room_id WITH =,
    during WITH &&  -- No overlapping ranges
  )
);

-- Prevents double-booking a room
```

---

## Constraint Naming Convention

```sql
-- Primary key
pk_{table}

-- Foreign key
fk_{table}_{referenced_table}

-- Unique
uq_{table}_{column}

-- Check
ck_{table}_{column}_{description}

-- Example
CREATE TABLE orders (
  id UUID,
  user_id UUID,
  total DECIMAL(10,2),

  CONSTRAINT pk_orders PRIMARY KEY (id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
    REFERENCES users(id),
  CONSTRAINT ck_orders_total_positive
    CHECK (total >= 0)
);
```

---

## Adding Constraints After Table Creation

```sql
-- Add primary key
ALTER TABLE users ADD PRIMARY KEY (id);

-- Add foreign key
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add unique
ALTER TABLE users ADD UNIQUE (email);

-- Add check
ALTER TABLE products
ADD CONSTRAINT ck_products_price_positive
CHECK (price >= 0);

-- Add not null
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

---

## Dropping Constraints

```sql
-- Drop by name
ALTER TABLE orders DROP CONSTRAINT fk_orders_user;

-- Drop primary key
ALTER TABLE users DROP CONSTRAINT pk_users;

-- Remove not null
ALTER TABLE users ALTER COLUMN bio DROP NOT NULL;
```

---

## Constraint Validation

```sql
-- Disable constraint checking (PostgreSQL)
ALTER TABLE orders DISABLE TRIGGER ALL;
-- ... bulk load data ...
ALTER TABLE orders ENABLE TRIGGER ALL;

-- Validate without blocking (PostgreSQL)
ALTER TABLE orders
VALIDATE CONSTRAINT fk_orders_user;
```

---

## Best Practices

✅ **Always name constraints explicitly**
```sql
CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
```

✅ **Use CHECK for enums instead of ENUM type**
```sql
status VARCHAR(20) CHECK (status IN ('pending', 'active'))
```

✅ **Add NOT NULL to required fields**
```sql
email VARCHAR(255) NOT NULL
```

✅ **Use appropriate CASCADE rules**
```sql
ON DELETE CASCADE  -- For dependent data
ON DELETE SET NULL  -- For optional references
ON DELETE RESTRICT  -- For critical references
```

✅ **Index all foreign keys**
```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

---

## Related Resources

- `error-catalog.md` - Constraint-related errors
- `relationship-patterns.md` - Foreign key patterns
- `schema-design-patterns.md` - Best practices
