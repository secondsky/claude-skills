---
name: cloudflare-d1:create-migration
description: Guided migration creation for Cloudflare D1 with schema change validation, SQL generation, and testing workflow. Use when user wants to create migration, modify schema, add tables/indexes, or change database structure.
---

# D1 Create Migration Command

## Overview

Guided migration creation with validation, SQL generation, and safe testing workflow.

## Prerequisites

- Existing D1 database configured in wrangler.jsonc
- migrations/ directory exists (created during setup)
- wrangler CLI available

## Steps

### Step 1: Migration Type

Use AskUserQuestion to determine what kind of migration to create.

**Prompt**: "What type of migration are you creating?"

**Options**:
1. "Add new table"
2. "Modify existing table (add/remove columns)"
3. "Add indexes"
4. "Data migration (update existing records)"
5. "Custom SQL"

**Store as**: `migrationType`

---

### Step 2: Gather Migration Details

Based on `migrationType`, collect specific details:

#### If "Add new table":

**Ask**:
- Table name: `tableName`
- Columns (comma-separated): `columnsList`
  - Example: "id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE"
- Add foreign keys? (yes/no): `hasForeignKeys`
  - If yes, ask: "Which table.column?" → `foreignKeyReferences`

#### If "Modify existing table":

**Ask**:
- Table name: `tableName`
- Change type:
  - "Add column"
  - "Drop column"
  - "Rename column"
  - Store as: `changeType`
- Column details: `columnDetails`

#### If "Add indexes":

**Ask**:
- Table name: `tableName`
- Columns to index (comma-separated): `indexColumns`
- Index type:
  - "Single column index"
  - "Composite index (multiple columns)"
  - "Unique index"
  - Store as: `indexType`

#### If "Data migration":

**Ask**:
- Description of data change: `description`
- **Warning**: "Data migrations should be idempotent and tested in staging first. Proceed?"

#### If "Custom SQL":

**Ask**:
- "Provide SQL file path or paste SQL directly"
- Store as: `customSQL`

---

### Step 3: Generate Migration File

Create migration file with timestamp:

```bash
# Generate timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Create migration filename
MIGRATION_FILE="migrations/${TIMESTAMP}_<description>.sql"
```

**Generate SQL based on migration type**:

#### Add Table Example:
```sql
-- Migration: Add <tableName> table
-- Created: <timestamp>

CREATE TABLE IF NOT EXISTS <tableName> (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  <columnsList>,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for foreign keys and commonly queried columns
<for each indexed column>
CREATE INDEX IF NOT EXISTS idx_<tableName>_<column> ON <tableName>(<column>);
</for each>

-- Optimize query planner
PRAGMA optimize;
```

#### Add Column Example:
```sql
-- Migration: Add column <columnName> to <tableName>
-- Created: <timestamp>

-- SQLite doesn't support ADD COLUMN IF NOT EXISTS
-- Check if column exists first (defensive)
ALTER TABLE <tableName> ADD COLUMN <columnName> <type> <constraints>;

PRAGMA optimize;
```

#### Add Index Example:
```sql
-- Migration: Add index on <tableName>(<columns>)
-- Created: <timestamp>

CREATE INDEX IF NOT EXISTS idx_<tableName>_<columns> ON <tableName>(<columns>);

PRAGMA optimize;
```

#### Data Migration Example:
```sql
-- Migration: <description>
-- Created: <timestamp>
-- WARNING: Test in staging first!

-- Example: Update all users' status
UPDATE users
SET status = 'active'
WHERE status IS NULL;

PRAGMA optimize;
```

**Write Migration File**:
Use Write tool to create the SQL file in migrations/

---

### Step 4: Validation

Run automated checks on generated migration:

**1. Syntax Validation** (dry-run):
```bash
# Note: Dry-run not directly supported, but can test locally
wrangler d1 execute <database-name> --local --file=<migration-file>
```

**2. Best Practices Check**:
- ✓ Uses `IF NOT EXISTS` for CREATE statements?
- ✓ Has `PRAGMA optimize` at end?
- ✓ Includes indexes for foreign keys?
- ✓ Uses INTEGER for timestamps?
- ⚠ Has ALTER TABLE without IF NOT EXISTS? (warn user)
- ⚠ Has DROP operations? (destructive, warn user)

**3. Warn if Destructive**:
```
⚠️ Warning: This migration contains destructive operations:
- DROP TABLE <table>
- DROP COLUMN <column>

Recommendations:
1. Backup data first (Time Travel: wrangler d1 time-travel...)
2. Test in staging environment
3. Ensure data is no longer needed
4. Consider archiving instead of dropping
```

**Output Example**:
```
✓ Migration validation passed
  - Uses IF NOT EXISTS
  - Includes PRAGMA optimize
  - Indexes created for foreign keys

⚠️ Recommendation: Test in local database first
```

---

### Step 5: Test in Local Database (Optional)

**Ask User**: "Test migration in local development database first? (Recommended)"

**If yes**:
```bash
# Apply to local D1
wrangler d1 migrations apply <database-name> --local

# Verify schema
wrangler d1 execute <database-name> --local --command ".schema <tableName>"

# Test query
wrangler d1 execute <database-name> --local --command "SELECT * FROM <tableName>"
```

**Show Results**:
```
✓ Local migration applied successfully

Schema after migration:
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  ← New column
  created_at INTEGER DEFAULT (unixepoch())
);

Indexes:
- idx_users_email
- idx_users_status  ← New index
```

**Error Handling**:
```
❌ Local migration failed:
Error: UNIQUE constraint failed: users.email

Possible causes:
1. Duplicate emails exist in data
2. Column constraint conflicts with existing data

Solution:
1. Edit migration file to handle duplicates
2. Clean data first, then reapply migration
```

---

### Step 6: Apply to Remote (Production)

**Warning Prompt**:
```
⚠️ Apply migration to remote (production) database?

This will modify your production database:
- Database: <database-name>
- Migration: <migration-file>

Ensure you have:
✓ Tested locally
✓ Reviewed SQL carefully
✓ Time Travel backup available (retention: 7-30 days)

Proceed?
```

**If user confirms**:
```bash
wrangler d1 migrations apply <database-name> --remote
```

**Monitor Application**:
```
✓ Migration applied successfully

⚠️ Important: Monitor your application for 10-15 minutes
- Check error logs: wrangler tail <worker-name>
- Watch metrics: wrangler d1 insights <database-name>
- Verify queries still work as expected

Rollback available via Time Travel (if needed):
wrangler d1 time-travel restore <database-name> --timestamp=<before-migration>
```

---

### Step 7: Verification

Verify migration was applied successfully:

```bash
# 1. List applied migrations
wrangler d1 migrations list <database-name>

# 2. Verify schema changes
wrangler d1 execute <database-name> --command ".schema <tableName>"

# 3. Test query with new structure
wrangler d1 execute <database-name> --command "SELECT * FROM <tableName> LIMIT 1"
```

**Output Example**:
```
✓ Migration Verification Complete

Applied Migrations:
- 0001_initial_schema.sql (2025-01-10)
- 0002_add_status_column.sql (2025-01-15) ← New

Schema:
- Table: users (6 columns)
- Indexes: 2
- Foreign Keys: 0

Test Query:
[
  {
    "id": 1,
    "email": "user@example.com",
    "name": "Test User",
    "status": "pending",
    "created_at": 1705334400
  }
]
```

---

### Step 8: Next Steps

**Success Message**:
```
✅ Migration Applied Successfully!

Migration Details:
- File: <migration-file>
- Database: <database-name>
- Type: <migrationType>
- Applied: Local ✓ | Remote ✓

Next Steps:

1. Update your code to use new schema:
   ```typescript
   // Example: Query with new column
   const { results } = await env.DB.prepare(
     'SELECT * FROM users WHERE status = ?'
   ).bind('active').all();
   ```

2. Monitor performance impact:
   ```bash
   wrangler d1 insights <database-name>
   ```

3. If new indexes added, check query efficiency:
   ```bash
   wrangler d1 execute <database-name> --command \
     "EXPLAIN QUERY PLAN SELECT * FROM <tableName> WHERE <indexed-column> = ?"
   ```

Rollback Strategy:
- Time Travel restore available for <retention> days
- Restore command:
  wrangler d1 time-travel restore <database-name> \
    --timestamp=<timestamp-before-migration>
- Backup timestamp: <current-timestamp>

📚 References:
- Migration best practices: Load `references/best-practices.md`
- Query optimization: Load `references/query-patterns.md`
```

---

## Safety Features

### Destructive Operations Warning

**Before executing DROP operations**:
```
🚨 DESTRUCTIVE OPERATION DETECTED

This migration will permanently delete data:
- DROP TABLE <table> (deletes all rows)
- DROP COLUMN <column> (deletes column data)

⚠️ Actions Required:
1. Backup data via Time Travel:
   Current retention: <7 or 30> days
   Restore point: <current-timestamp>

2. Export data if needed:
   wrangler d1 execute <database> --command "SELECT * FROM <table>" > backup.json

3. Confirm understanding of data loss

Proceed only if certain data is no longer needed.
```

### Data Migration Safeguards

**For UPDATE/DELETE operations**:
```
⚠️ Data Migration Detected

Best Practices:
1. Test with LIMIT first:
   UPDATE users SET status = 'active' WHERE status IS NULL LIMIT 10;

2. Use transactions (batch):
   -- All succeed or all fail
   env.DB.batch([...updates])

3. Make it idempotent:
   -- Safe to run multiple times
   UPDATE users SET status = 'active'
   WHERE status IS NULL AND status != 'active';

4. Check affected rows:
   SELECT COUNT(*) FROM users WHERE status IS NULL;
   -- Verify count matches expectations before UPDATE
```

---

## Common Migration Patterns

### Add Column with Default

```sql
-- Migration: Add status column with default value
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending';

-- Create index if column will be filtered
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

PRAGMA optimize;
```

### Add Foreign Key (via new table)

```sql
-- Note: SQLite doesn't support ADD FOREIGN KEY after table creation
-- Must recreate table or create new table with FK

-- Migration: Add orders table with foreign key
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total REAL NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

PRAGMA optimize;
```

### Rename Column (SQLite 3.25+)

```sql
-- Migration: Rename column email_address to email
ALTER TABLE users RENAME COLUMN email_address TO email;

PRAGMA optimize;
```

### Backfill Data

```sql
-- Migration: Backfill timestamps for existing records
UPDATE users
SET created_at = unixepoch()
WHERE created_at IS NULL;

PRAGMA optimize;
```

---

## Error Handling

### Migration File Already Exists

```
❌ Error: Migration file already exists with same timestamp

Solution:
Wait 1 second and retry (timestamps are second-precision)
Or manually specify migration name
```

### Syntax Error in SQL

```
❌ Error: SQL syntax error at line 5

Solution:
1. Review generated SQL in migrations/<file>
2. Fix syntax error
3. Test locally: wrangler d1 migrations apply <db> --local
4. Reapply to remote
```

### Constraint Violation

```
❌ Error: UNIQUE constraint failed: users.email

Cause: Adding UNIQUE constraint on column with duplicate values

Solution:
1. Find duplicates:
   SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

2. Clean duplicates first (separate migration)
3. Then apply UNIQUE constraint
```

---

## Summary

This command provides **guided migration creation** through 8 steps:
1. Determine migration type (via AskUserQuestion)
2. Gather migration details
3. Generate migration SQL file
4. Validate syntax and best practices
5. Test in local database (optional)
6. Apply to remote/production
7. Verify schema changes
8. Provide next steps and rollback info

**Output**: Safe, tested migration with validation checks, rollback strategy, and next steps.

**When to Use**: Any schema change - add table/column/index, modify structure, or data migration.
