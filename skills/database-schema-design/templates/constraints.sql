-- Database Constraint Examples

-- ===========================================
-- PRIMARY KEY CONSTRAINTS
-- ===========================================

-- Single column
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Composite primary key
CREATE TABLE order_items (
  order_id UUID,
  product_id UUID,
  PRIMARY KEY (order_id, product_id)
);

-- ===========================================
-- FOREIGN KEY CONSTRAINTS
-- ===========================================

CREATE TABLE orders (
  id UUID PRIMARY KEY,

  -- Cascade delete
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Set to null
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,

  -- Prevent deletion
  invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT
);

-- ===========================================
-- UNIQUE CONSTRAINTS
-- ===========================================

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,

  -- Composite unique
  UNIQUE (email, username)
);

-- ===========================================
-- NOT NULL CONSTRAINTS
-- ===========================================

CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT  -- Nullable (optional)
);

-- ===========================================
-- CHECK CONSTRAINTS
-- ===========================================

CREATE TABLE products (
  id UUID PRIMARY KEY,

  -- Range check
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL CHECK (stock >= 0),

  -- Enum check
  status VARCHAR(20) NOT NULL
    CHECK (status IN ('draft', 'active', 'archived')),

  -- Percentage check
  discount_pct DECIMAL(5,2)
    CHECK (discount_pct >= 0 AND discount_pct <= 100),

  -- Date range check
  start_date DATE,
  end_date DATE,
  CHECK (end_date IS NULL OR end_date >= start_date),

  -- Multi-column check
  min_quantity INT,
  max_quantity INT,
  CHECK (max_quantity IS NULL OR max_quantity >= min_quantity)
);

-- ===========================================
-- DEFAULT CONSTRAINTS
-- ===========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT true NOT NULL,
  role VARCHAR(20) DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===========================================
-- ADDING CONSTRAINTS AFTER TABLE CREATION
-- ===========================================

-- Add foreign key
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add unique constraint
ALTER TABLE users
ADD CONSTRAINT uq_users_email UNIQUE (email);

-- Add check constraint
ALTER TABLE products
ADD CONSTRAINT ck_products_price_positive CHECK (price >= 0);

-- Add not null
ALTER TABLE users
ALTER COLUMN email SET NOT NULL;

-- ===========================================
-- DROPPING CONSTRAINTS
-- ===========================================

-- Drop constraint by name
ALTER TABLE orders DROP CONSTRAINT fk_orders_user;

-- Remove not null
ALTER TABLE users ALTER COLUMN bio DROP NOT NULL;
