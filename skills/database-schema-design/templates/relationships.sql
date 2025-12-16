-- Database Relationship Templates

-- ===========================================
-- ONE-TO-ONE RELATIONSHIP
-- ===========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url VARCHAR(500),
  birth_date DATE
);

-- ===========================================
-- ONE-TO-MANY RELATIONSHIP
-- ===========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_orders_user_id ON orders(user_id);

-- ===========================================
-- MANY-TO-MANY RELATIONSHIP
-- ===========================================

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- ===========================================
-- SELF-REFERENCING (HIERARCHY)
-- ===========================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX idx_employees_manager ON employees(manager_id);

-- Query hierarchy
WITH RECURSIVE reports AS (
  SELECT id, name, manager_id, 1 as level
  FROM employees WHERE id = 'manager-uuid'
  UNION ALL
  SELECT e.id, e.name, e.manager_id, r.level + 1
  FROM employees e
  JOIN reports r ON e.manager_id = r.id
)
SELECT * FROM reports ORDER BY level;
