---
name: database-schema-design
description: Designs scalable, normalized database schemas for PostgreSQL and MySQL with proper relationships and constraints. Use when creating new databases, modeling complex domains, or optimizing existing schemas.
---

# Database Schema Design

Design scalable, normalized database schemas with proper relationships and constraints.

## Normalization Forms

| Form | Rule | Example Fix |
|------|------|-------------|
| 1NF | No repeating groups | Split arrays into tables |
| 2NF | No partial dependencies | Separate composite keys |
| 3NF | No transitive dependencies | Extract lookup tables |

## Relationship Patterns

### One-to-Many
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total DECIMAL(10,2) NOT NULL
);
```

### Many-to-Many
```sql
CREATE TABLE students (id UUID PRIMARY KEY);
CREATE TABLE courses (id UUID PRIMARY KEY);

CREATE TABLE enrollments (
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id)
);
```

## Constraints

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Data Types (PostgreSQL)

| Use Case | Type |
|----------|------|
| Primary key | UUID |
| Money | DECIMAL(10,2) |
| Flexible data | JSONB |
| Timestamps | TIMESTAMPTZ |
| Status/enum | VARCHAR with CHECK |

## Schema Checklist

- [ ] All tables have primary keys
- [ ] Foreign keys with appropriate ON DELETE
- [ ] NOT NULL on required fields
- [ ] Indexes on frequently queried columns
- [ ] CHECK constraints for valid ranges
- [ ] Audit columns (created_at, updated_at)

## Common Mistakes

- Skipping normalization for convenience
- Using VARCHAR(MAX) everywhere
- Missing foreign key constraints
- No indexes on join columns
