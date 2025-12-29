---
name: cloudflare-d1:setup
description: Interactive wizard to set up Cloudflare D1 database with database creation, Worker binding configuration, schema generation, and first migration. Use when user wants to create first D1 database or add D1 to existing Worker.
---

# D1 Setup Wizard

## Overview

Interactive wizard for complete D1 setup: create database, configure bindings, generate schema, and run first migration.

## Prerequisites

Check before starting:
- Cloudflare account with wrangler authenticated (`wrangler whoami`)
- Existing Worker project or willingness to create one
- Write access to wrangler.jsonc/wrangler.toml

## Steps

### Step 1: Gather Requirements

Use AskUserQuestion to collect setup preferences.

**Question 1: Database Name**
- **Prompt**: "What should your database be named?"
- **Examples**: "my-app-db", "production-db", "users-db"
- **Validation**: Alphanumeric + hyphens only (validate before proceeding)
- **Store as**: `databaseName`

**Question 2: Binding Name**
- **Prompt**: "What binding name should be used in your Worker code?"
- **Default**: "DB"
- **Examples**: "DB", "DATABASE", "USERS_DB"
- **Validation**: Valid JavaScript identifier
- **Store as**: `bindingName`

**Question 3: Schema Source**
- **Prompt**: "Do you have an existing schema.sql file?"
- **Options**:
  - "Yes - I have schema.sql" → Ask for path
  - "No - Generate basic schema" → Ask for table names
- **Store as**: `hasSchema`, `schemaPath` or `tableNames`

**Question 4: Read Replication**
- **Prompt**: "Enable read replication? (Recommended for read-heavy apps, requires paid plan)"
- **Options**:
  - "Yes - Enable read replication"
  - "No - Single region only"
- **Store as**: `enableReplication`

**Question 5: Data Jurisdiction** (if user is on paid plan)
- **Prompt**: "Specify data jurisdiction for compliance? (Optional, paid plan only)"
- **Options**:
  - "GLOBAL - Best performance (default)"
  - "EU - European Union (GDPR compliance)"
  - "US - United States"
- **Store as**: `jurisdiction`

---

### Step 2: Create Database

Build and execute wrangler command based on user inputs:

```bash
# Base command
wrangler d1 create <databaseName>

# Add jurisdiction if specified and not GLOBAL
if [jurisdiction != "GLOBAL"]:
  wrangler d1 create <databaseName> --jurisdiction <jurisdiction>
```

**Execute**:
```bash
# Example
wrangler d1 create my-app-db --jurisdiction EU
```

**Capture Output**:
Extract `database_id` from output (36-character UUID)
```
✅ Successfully created DB 'my-app-db' (abc123-def456-ghi789-...)
```

Store `database_id` for next steps.

**Error Handling**:
- If "not authenticated" → Run `wrangler login` first
- If "database already exists" → Ask user if they want to use existing or choose different name
- If "limit reached" → Check free tier limit (10 databases), suggest upgrade or consolidation

---

### Step 3: Configure Wrangler

Check if wrangler.jsonc or wrangler.toml exists:
```bash
if [ -f "wrangler.jsonc" ]; then
  CONFIG_FILE="wrangler.jsonc"
elif [ -f "wrangler.toml" ]; then
  CONFIG_FILE="wrangler.toml"
else
  # Ask user which format to create
  CONFIG_FILE="wrangler.jsonc"  # Default to JSON
fi
```

**Add D1 Configuration**:

**If wrangler.jsonc**:
Use Edit tool to add to `d1_databases` array (or create array if doesn't exist):
```jsonc
{
  "d1_databases": [
    {
      "binding": "<bindingName>",
      "database_name": "<databaseName>",
      "database_id": "<databaseId>",
      "preview_database_id": "local"
      // Conditional fields:
      // "replicate": { "enabled": true },  // if enableReplication
      // "jurisdiction": "EU"  // if jurisdiction != "GLOBAL"
    }
  ]
}
```

**If wrangler.toml**:
```toml
[[d1_databases]]
binding = "<bindingName>"
database_name = "<databaseName>"
database_id = "<databaseId>"
```

**Verify**:
```bash
# Show configuration to user
cat wrangler.jsonc | grep -A 10 "d1_databases"
```

**Error Handling**:
- If wrangler config has syntax errors → Show error, offer to create fresh config
- If binding name conflicts → Warn user, suggest unique name

---

### Step 4: Setup Migrations Directory

Create migrations directory structure:
```bash
mkdir -p migrations
```

Confirm directory created:
```bash
ls -la migrations
```

---

### Step 5: Generate Schema

**If user has existing schema** (`hasSchema == true`):
```bash
cp <schemaPath> migrations/0001_initial_schema.sql
```

**If generating schema** (`hasSchema == false`):

Ask for table details using AskUserQuestion:
- **Prompt**: "What tables do you need? (comma-separated)"
- **Examples**: "users, posts, comments"
- **Store as**: `tableNames` (array)

Generate basic schema for each table:
```sql
-- migrations/0001_initial_schema.sql

-- Example for "users" table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Example for "posts" table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- Optimize query planner
PRAGMA optimize;
```

**Best Practices Applied**:
- Always use `IF NOT EXISTS`
- INTEGER PRIMARY KEY AUTOINCREMENT for IDs
- INTEGER for timestamps (unixepoch())
- Indexes on foreign keys
- PRAGMA optimize at end

**Write Schema File**:
```bash
# Use Write tool to create migrations/0001_initial_schema.sql
```

---

### Step 6: Apply First Migration

**Test Locally First** (recommended):
```bash
wrangler d1 migrations apply <databaseName> --local
```

Check for errors. If successful, proceed to remote.

**Apply to Remote**:
```bash
wrangler d1 migrations apply <databaseName> --remote
```

**Verify**:
```bash
# List applied migrations
wrangler d1 migrations list <databaseName>

# Show schema
wrangler d1 execute <databaseName> --command ".schema"
```

**Error Handling**:
- If SQL syntax error → Show error, offer to edit schema file
- If migration fails → Check error message, provide fix guidance
- Offer Time Travel restore if needed

---

### Step 7: Generate TypeScript Types (Optional)

**Ask User**:
- **Prompt**: "Generate TypeScript types for your schema?"
- **Options**:
  - "Yes - Install d1-orm and generate types"
  - "No - Skip type generation"

**If yes**:
```bash
# Install d1-orm (if not present)
bun add -d drizzle-orm drizzle-kit

# Note: Type generation varies by tooling
# Provide manual type example for now
```

Create basic TypeScript interface:
```typescript
// src/types/db.ts
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string | null;
  created_at: number;
}
```

---

### Step 8: Provide Next Steps

**Success Message**:
```
✅ D1 Database Setup Complete!

Database Configuration:
- Name: <databaseName> (<databaseId>)
- Binding: env.<bindingName>
- Replication: <Enabled/Disabled>
- Jurisdiction: <jurisdiction>
- Migrations Applied: 1

Next Steps:

1. Start querying your database:
   ```typescript
   import { Hono } from 'hono';

   type Bindings = {
     <bindingName>: D1Database;
   };

   const app = new Hono<{ Bindings: Bindings }>();

   app.get('/users', async (c) => {
     const { results } = await c.env.<bindingName>.prepare(
       'SELECT * FROM users LIMIT 10'
     ).all();

     return c.json(results);
   });

   export default app;
   ```

2. Create additional migrations:
   ```bash
   wrangler d1 migrations create <databaseName> add_posts_table
   ```

3. View database info:
   ```bash
   wrangler d1 info <databaseName>
   ```

4. Monitor performance:
   ```bash
   wrangler d1 insights <databaseName>
   ```

📚 Helpful Resources:
- Query patterns: Load `references/query-patterns.md`
- Best practices: Load `references/best-practices.md`
- Limits & quotas: Load `references/limits.md`
- Metrics & monitoring: Load `references/metrics-analytics.md`

💡 Tips:
- Always use prepared statements with .bind() (prevent SQL injection)
- Create indexes on columns used in WHERE/JOIN/ORDER BY
- Use batch queries (env.<bindingName>.batch()) to reduce query count
- Run PRAGMA optimize after schema changes
```

---

## Error Handling

### Wrangler Not Authenticated
```
❌ Error: Not authenticated

Solution:
1. Run: wrangler login
2. Follow authentication flow
3. Re-run setup command
```

### Database Limit Reached
```
❌ Error: Account database limit reached (10 databases on free plan)

Solutions:
1. Upgrade to Workers Paid ($5/month) → 50,000 databases
2. Delete unused databases: wrangler d1 delete <database-name>
3. Consolidate databases if possible

Check current databases:
wrangler d1 list
```

### Migration Failed
```
❌ Error: Migration failed with SQL syntax error

Solution:
1. Review error message for specific issue
2. Edit migrations/0001_initial_schema.sql
3. Test locally first: wrangler d1 migrations apply <db> --local
4. Reapply to remote: wrangler d1 migrations apply <db> --remote
```

### Invalid Configuration
```
❌ Error: Invalid wrangler.jsonc syntax

Solution:
1. Check JSON syntax (missing commas, brackets)
2. Validate with: jq . wrangler.jsonc
3. Fix syntax errors
4. Re-run setup
```

---

## Example Full Workflow

**User Input**:
- Database name: "my-app-db"
- Binding: "DB"
- Schema: Generate basic (tables: users, posts)
- Replication: Yes
- Jurisdiction: EU

**Executed Commands**:
```bash
# 1. Create database
wrangler d1 create my-app-db --jurisdiction EU
# Output: database_id = abc123-def456-...

# 2. Configure wrangler.jsonc (Edit tool)
# Added d1_databases configuration

# 3. Create migrations directory
mkdir -p migrations

# 4. Generate schema (Write tool)
# Created migrations/0001_initial_schema.sql with users and posts tables

# 5. Apply migration
wrangler d1 migrations apply my-app-db --local  # Test first
wrangler d1 migrations apply my-app-db --remote  # Then production

# 6. Verify
wrangler d1 migrations list my-app-db
wrangler d1 execute my-app-db --command ".schema"
```

**Result**:
```
✅ Setup complete!
- Database: my-app-db (EU jurisdiction)
- Binding: env.DB
- Tables: users (5 columns), posts (5 columns)
- Indexes: 2 created
- Replication: Enabled
```

---

## Summary

This command provides **interactive D1 setup** through 8 guided steps:
1. Gather requirements (via AskUserQuestion)
2. Create database (wrangler d1 create)
3. Configure bindings (Edit wrangler.jsonc)
4. Setup migrations directory
5. Generate schema (basic or from existing)
6. Apply first migration
7. Generate TypeScript types (optional)
8. Provide next steps and examples

**Output**: Fully configured D1 database ready for queries, with helpful next steps and code examples.

**When to Use**: First-time D1 setup or adding D1 to existing Worker project.
