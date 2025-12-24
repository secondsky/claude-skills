# database-schema-design

Comprehensive database schema design patterns for PostgreSQL and MySQL with normalization, relationships, constraints, and anti-pattern prevention.

## Auto-Trigger Keywords

This skill automatically loads when Claude detects:

**Schema Design**: database schema, schema design, table design, create table, database structure, entity relationship, ER diagram, database modeling

**Normalization**: normalization, 1NF, 2NF, 3NF, BCNF, normal form, normalize schema, data duplication, denormalization

**Relationships**: one-to-one, one-to-many, many-to-many, foreign key, primary key, composite key, junction table, association table, relationship mapping

**Data Types**: data types, column types, VARCHAR vs TEXT, UUID vs BIGSERIAL, TIMESTAMPTZ, DECIMAL, JSONB, choosing data types

**Constraints**: constraints, CHECK constraint, UNIQUE constraint, NOT NULL, foreign key constraint, ON DELETE CASCADE, referential integrity

**Audit Patterns**: audit columns, created_at, updated_at, soft delete, deleted_at, versioning, change tracking, audit trail

**Common Errors**: missing primary key, no foreign key, VARCHAR(MAX), dates as strings, missing indexes, EAV pattern, polymorphic associations, circular dependencies

**Database Systems**: PostgreSQL schema, MySQL schema, database migration, schema review, schema optimization

## What This Skill Provides

### Quick Start Templates
- Basic CRUD schema (users, products, orders)
- All relationship patterns (1:1, 1:M, M:M, hierarchical)
- Comprehensive constraint examples
- Audit column patterns with auto-update triggers

### Reference Documentation
- **Normalization Guide**: 1NF through 5NF with before/after examples
- **Relationship Patterns**: All relationship types with SQL examples
- **Data Types Guide**: PostgreSQL vs MySQL type selection
- **Constraints Catalog**: All constraint types with use cases
- **Schema Design Patterns**: Production patterns (soft delete, versioning, multi-tenancy)
- **Error Catalog**: 12 common schema design errors with fixes

### Error Prevention

Prevents 12 documented schema design issues:
1. Missing primary keys
2. No foreign key constraints
3. VARCHAR(MAX) everywhere
4. Premature denormalization
5. Missing NOT NULL constraints
6. Missing indexes on foreign keys
7. Wrong data types (dates as strings)
8. Missing CHECK constraints
9. No audit columns
10. Circular dependencies
11. Missing ON DELETE/UPDATE cascade rules
12. EAV anti-pattern

## Usage Examples

### New Database Design
```sql
-- Start with basic schema template
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  status VARCHAR(20) NOT NULL
    CHECK (status IN ('pending', 'processing', 'shipped', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
```

### Schema Review
Load `references/error-catalog.md` to check for:
- Missing primary keys
- Foreign keys without indexes
- Inappropriate data types
- Missing validation constraints

### Normalization
Load `references/normalization-guide.md` when:
- Schema has data duplication
- Unsure what normal form achieved
- Need to refactor existing schema

## Production Benefits

- ✅ **Referential Integrity**: All foreign keys enforced
- ✅ **Data Validation**: CHECK constraints prevent invalid data
- ✅ **Query Performance**: Proper indexing on foreign keys
- ✅ **Auditability**: Track created/updated timestamps
- ✅ **Type Safety**: Appropriate data types enforced
- ✅ **Maintainability**: Normalized structure prevents anomalies

## When to Use

- **Starting new database**: Use templates for foundation
- **Reviewing existing schema**: Use error catalog to identify issues
- **Planning migration**: Use normalization guide to restructure
- **Choosing data types**: Use data types guide for decisions
- **Defining relationships**: Use relationship patterns for examples
- **Implementing audit trails**: Use audit patterns with triggers

## Installation

```bash
# Clone the repository
git clone https://github.com/secondsky/claude-skills.git

# Symlink to Claude's skills directory
ln -s "$(pwd)/claude-skills/skills/database-schema-design" ~/.claude/skills/

# Verify installation
ls -la ~/.claude/skills/database-schema-design
```

## Quality Standards

- **Production-tested**: All patterns verified in production
- **Error prevention**: 12 documented issues prevented
- **Cross-database**: PostgreSQL and MySQL compatible
- **Best practices**: Follows industry standards
- **Progressive disclosure**: Quick Start + detailed references

## License

MIT License - See LICENSE file for details

## Resources

**Official Documentation**:
- PostgreSQL: https://www.postgresql.org/docs/current/
- MySQL: https://dev.mysql.com/doc/

**Standards**:
- Database normalization theory
- Referential integrity best practices
- SQL:2016 standard compliance

---

**Production-ready** | **12 errors prevented** | **PostgreSQL & MySQL**
