-- Audit Column Templates

-- ===========================================
-- BASIC AUDIT COLUMNS
-- ===========================================

CREATE TABLE example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Your business columns here
  name VARCHAR(200) NOT NULL,

  -- Audit columns
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===========================================
-- FULL AUDIT COLUMNS (with user tracking)
-- ===========================================

CREATE TABLE example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Your business columns here
  name VARCHAR(200) NOT NULL,

  -- Full audit columns
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ===========================================
-- AUTO-UPDATE updated_at TRIGGER (PostgreSQL)
-- ===========================================

-- Create function (once per database)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to table
CREATE TRIGGER example_table_updated_at
BEFORE UPDATE ON example_table
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- SOFT DELETE PATTERN
-- ===========================================

CREATE TABLE example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Your business columns here
  name VARCHAR(200) NOT NULL,

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Standard audit columns
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Query only active records
SELECT * FROM example_table WHERE deleted_at IS NULL;

-- Soft delete
UPDATE example_table SET deleted_at = NOW() WHERE id = '...';

-- Partial unique index (PostgreSQL) - unique name among active records
CREATE UNIQUE INDEX idx_example_name_active
ON example_table(name) WHERE deleted_at IS NULL;

-- ===========================================
-- VERSION TRACKING
-- ===========================================

CREATE TABLE example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Your business columns here
  name VARCHAR(200) NOT NULL,

  -- Version tracking
  version INT NOT NULL DEFAULT 1,

  -- Audit columns
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- History table
CREATE TABLE example_table_history (
  id UUID,
  version INT,
  name VARCHAR(200),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES users(id),
  PRIMARY KEY (id, version)
);

-- ===========================================
-- COMPREHENSIVE AUDIT TABLE
-- ===========================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business columns
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',

  -- Full audit columns
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),

  -- Version tracking
  version INT NOT NULL DEFAULT 1
);

-- Trigger for auto-update
CREATE TRIGGER products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Index for soft deletes
CREATE INDEX idx_products_active ON products(id) WHERE deleted_at IS NULL;
