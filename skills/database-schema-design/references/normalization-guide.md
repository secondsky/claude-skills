# Database Normalization Guide

**Last Updated**: 2025-12-15

Complete guide to database normalization from 1NF through 5NF with practical examples.

---

## First Normal Form (1NF)

**Rule**: No repeating groups, each cell contains atomic values

**Violation**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  product_ids TEXT  -- '123,456,789' - NOT ATOMIC!
);
```

**Fixed (1NF)**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY
);

CREATE TABLE order_items (
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
```

---

## Second Normal Form (2NF)

**Rule**: No partial dependencies (all non-key attributes depend on entire primary key)

**Violation**:
```sql
CREATE TABLE order_items (
  order_id UUID,
  product_id UUID,
  product_name VARCHAR(200),  -- Depends only on product_id!
  product_price DECIMAL(10,2), -- Depends only on product_id!
  quantity INT,
  PRIMARY KEY (order_id, product_id)
);
```

**Fixed (2NF)**:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_items (
  order_id UUID,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  PRIMARY KEY (order_id, product_id)
);
```

---

## Third Normal Form (3NF)

**Rule**: No transitive dependencies (non-key attributes don't depend on other non-key attributes)

**Violation**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  user_email VARCHAR(255),  -- Depends on user_id, not order id!
  user_city VARCHAR(100),   -- Transitive dependency!
  total DECIMAL(10,2)
);
```

**Fixed (3NF)**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  city VARCHAR(100)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total DECIMAL(10,2) NOT NULL
);
```

---

## Boyce-Codd Normal Form (BCNF)

**Rule**: Every determinant must be a candidate key

**Violation**:
```sql
CREATE TABLE course_instructors (
  course_id UUID,
  instructor_id UUID,
  department VARCHAR(100),  -- Instructor determines department!
  PRIMARY KEY (course_id, instructor_id)
);
```

**Fixed (BCNF)**:
```sql
CREATE TABLE instructors (
  id UUID PRIMARY KEY,
  department VARCHAR(100) NOT NULL
);

CREATE TABLE course_instructors (
  course_id UUID,
  instructor_id UUID REFERENCES instructors(id),
  PRIMARY KEY (course_id, instructor_id)
);
```

---

## Fourth Normal Form (4NF)

**Rule**: No multi-valued dependencies

**Violation**:
```sql
CREATE TABLE employee_skills_certs (
  employee_id UUID,
  skill VARCHAR(100),
  certification VARCHAR(100),
  PRIMARY KEY (employee_id, skill, certification)
);
-- Employee skills and certifications are independent!
```

**Fixed (4NF)**:
```sql
CREATE TABLE employee_skills (
  employee_id UUID,
  skill VARCHAR(100),
  PRIMARY KEY (employee_id, skill)
);

CREATE TABLE employee_certifications (
  employee_id UUID,
  certification VARCHAR(100),
  PRIMARY KEY (employee_id, certification)
);
```

---

## Fifth Normal Form (5NF)

**Rule**: No join dependencies (cannot be decomposed further without information loss)

Rarely needed in practice. Most applications stop at 3NF or BCNF.

---

## Practical Normalization Workflow

1. **Start**: Identify entities and attributes
2. **1NF**: Remove repeating groups, ensure atomic values
3. **2NF**: Remove partial dependencies
4. **3NF**: Remove transitive dependencies
5. **Stop**: Unless specific need for BCNF/4NF/5NF

**Target**: 3NF for most applications

---

## When to Denormalize

**Only after measuring**:
- Read:write ratio > 100:1
- Query performance inadequate
- Specific use case (reporting, caching)

**Denormalization Techniques**:
- Materialized views
- Computed columns
- Snapshot tables
- JSONB for flexible data

---

## Related Resources

- `error-catalog.md` - Common normalization mistakes
- `relationship-patterns.md` - Implementing relationships
- `schema-design-patterns.md` - Real-world patterns
