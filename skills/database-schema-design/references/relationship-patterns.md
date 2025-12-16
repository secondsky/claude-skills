# Database Relationship Patterns

**Last Updated**: 2025-12-15

Complete guide to implementing database relationships.

---

## One-to-One (1:1)

**Use Case**: Split large table or optional data

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url VARCHAR(500),
  birth_date DATE
);
```

**When to use**:
- Optional data (not all users have profiles)
- Separate security levels
- Split large tables

---

## One-to-Many (1:M)

**Use Case**: Parent-child relationship

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index foreign key for JOIN performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

**CASCADE Rules**:
- `ON DELETE CASCADE` - Delete orders when user deleted
- `ON DELETE SET NULL` - Keep orders, set user_id to NULL
- `ON DELETE RESTRICT` - Prevent user deletion if orders exist

---

## Many-to-Many (M:M)

**Use Case**: Students ↔ Courses, Tags ↔ Posts

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL
);

-- Junction table
CREATE TABLE enrollments (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  grade VARCHAR(2),
  PRIMARY KEY (student_id, course_id)
);

-- Indexes for both directions
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
```

---

## Self-Referencing

**Use Case**: Hierarchies (org chart, comments)

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL
);

-- Find all reports
WITH RECURSIVE reports AS (
  SELECT id, name, manager_id, 1 as level
  FROM employees WHERE id = 'manager-uuid'
  UNION ALL
  SELECT e.id, e.name, e.manager_id, r.level + 1
  FROM employees e
  JOIN reports r ON e.manager_id = r.id
)
SELECT * FROM reports;
```

---

## Polymorphic Associations

**Anti-Pattern**:
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  commentable_type VARCHAR(50),  -- 'Post' or 'Photo'
  commentable_id UUID,           -- No foreign key possible!
  content TEXT
);
```

**Better**: Separate tables
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

## Related Resources

- `error-catalog.md` - Relationship mistakes
- `normalization-guide.md` - When to split tables
- `constraints-catalog.md` - Foreign key options
