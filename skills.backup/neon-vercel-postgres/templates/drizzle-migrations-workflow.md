# Drizzle Migrations Workflow for Neon Postgres

This guide shows the complete workflow for managing database migrations with Drizzle ORM and Neon Postgres.

## Initial Setup

### 1. Install Dependencies

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

### 2. Create Configuration File

Create `drizzle.config.ts` in your project root:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
});
```

### 3. Add Scripts to package.json

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"
  }
}
```

---

## Schema Definition

Create your schema in `db/schema.ts`:

```typescript
import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Migration Workflow

### Step 1: Generate Migration

After creating or modifying your schema, generate a migration:

```bash
npm run db:generate
```

This creates a new migration file in `db/migrations/` directory:
- `db/migrations/0000_initial.sql` - First migration
- `db/migrations/0001_add_published_column.sql` - Second migration
- etc.

**What happens:**
- Drizzle compares your schema with the database
- Generates SQL migration file with CREATE/ALTER/DROP statements
- Creates snapshot in `db/migrations/meta/` for future comparisons

### Step 2: Review Migration

**ALWAYS review generated SQL before applying!**

Example generated migration (`db/migrations/0000_initial.sql`):

```sql
CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "avatar_url" text,
    "created_at" timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "posts" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "title" text NOT NULL,
    "content" text,
    "published" boolean DEFAULT false,
    "created_at" timestamp DEFAULT NOW(),
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "comments" (
    "id" serial PRIMARY KEY NOT NULL,
    "post_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp DEFAULT NOW(),
    FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
);
```

### Step 3: Apply Migration

Apply the migration to your database:

```bash
npm run db:migrate
```

**What happens:**
- Drizzle connects to your Neon database
- Runs all pending migrations in order
- Records applied migrations in `__drizzle_migrations` table

**Output:**
```
✅ Applying migration: 0000_initial.sql
✅ Migration applied successfully
```

### Step 4: Verify Migration

Use Drizzle Studio to verify your schema:

```bash
npm run db:studio
```

Opens a web UI at `https://local.drizzle.studio` where you can:
- View tables and relationships
- Run queries
- Edit data

---

## Common Scenarios

### Scenario 1: Add New Column

1. **Update schema** (`db/schema.ts`):

```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),  // ← New column
  createdAt: timestamp('created_at').defaultNow(),
});
```

2. **Generate migration**:

```bash
npm run db:generate
```

Generated SQL (`db/migrations/0001_add_bio.sql`):

```sql
ALTER TABLE "users" ADD COLUMN "bio" text;
```

3. **Apply migration**:

```bash
npm run db:migrate
```

### Scenario 2: Add Index

1. **Update schema** with index:

```typescript
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));
```

2. **Generate and apply**:

```bash
npm run db:generate
npm run db:migrate
```

### Scenario 3: Rename Column

**⚠️ WARNING**: Drizzle treats renames as DROP + ADD (data loss!)

**Safe approach:**

1. Add new column
2. Migrate data (manually)
3. Drop old column

**Example:**

```typescript
// Step 1: Add new column
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),  // Old
  fullName: text('full_name').notNull(),  // New
  email: text('email').notNull().unique(),
});
```

```bash
npm run db:generate
npm run db:migrate
```

```sql
-- Step 2: Migrate data manually
UPDATE users SET full_name = name WHERE full_name IS NULL;
```

```typescript
// Step 3: Remove old column
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
});
```

```bash
npm run db:generate
npm run db:migrate
```

### Scenario 4: Production Deployment

For production, use a separate migration script:

Create `scripts/migrate.ts`:

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';

async function runMigrations() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './db/migrations' });
  console.log('Migrations completed!');

  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

Add to `package.json`:

```json
{
  "scripts": {
    "db:migrate:prod": "tsx scripts/migrate.ts"
  }
}
```

Run in CI/CD:

```bash
# Before deployment
npm run db:migrate:prod
```

---

## Alternative: Push (Schema Sync)

For **development only**, you can use `db:push` to sync schema without migrations:

```bash
npm run db:push
```

**What it does:**
- Compares schema with database
- Applies changes directly
- **No migration files created**

**When to use:**
- ✅ Local development (rapid iteration)
- ✅ Prototyping

**When NOT to use:**
- ❌ Production
- ❌ Shared databases
- ❌ Need migration history

---

## Best Practices

### 1. Always Review Generated SQL

```bash
# Generate migration
npm run db:generate

# Review file before applying
cat db/migrations/0001_*.sql

# Apply only if safe
npm run db:migrate
```

### 2. Test Migrations on Development Database First

```bash
# Create Neon branch for testing
neonctl branches create --name test-migration --parent main

# Get branch connection string
export DATABASE_URL=$(neonctl connection-string test-migration)

# Test migration
npm run db:migrate

# If successful, apply to main
neonctl branches delete test-migration
export DATABASE_URL=$(neonctl connection-string main)
npm run db:migrate
```

### 3. Commit Migration Files to Git

```bash
git add db/migrations/
git add db/schema.ts
git commit -m "feat: add bio column to users table"
```

### 4. Use Transactions for Multi-Step Migrations

Drizzle migrations run in transactions by default. If any step fails, all changes roll back.

### 5. Handle Data Migrations Separately

For complex data transformations, create custom migration scripts:

```typescript
// db/migrations/custom/0001_migrate_user_data.ts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Custom data migration
await sql`UPDATE users SET status = 'active' WHERE status IS NULL`;
```

---

## Troubleshooting

### Problem: "No schema changes detected"

**Solution**: Drizzle uses snapshots. If out of sync:

```bash
# Delete snapshot
rm -rf db/migrations/meta

# Regenerate
npm run db:generate
```

### Problem: "Relation already exists"

**Solution**: Migration already applied. Check `__drizzle_migrations` table:

```sql
SELECT * FROM __drizzle_migrations;
```

### Problem: "Cannot drop column with data"

**Solution**: Set column nullable first, then drop:

```sql
ALTER TABLE users ALTER COLUMN old_column DROP NOT NULL;
ALTER TABLE users DROP COLUMN old_column;
```

---

## Complete Checklist

- [ ] `drizzle.config.ts` configured
- [ ] Schema defined in `db/schema.ts`
- [ ] Scripts added to `package.json`
- [ ] `DATABASE_URL` environment variable set
- [ ] Initial migration generated (`npm run db:generate`)
- [ ] Migration reviewed
- [ ] Migration applied (`npm run db:migrate`)
- [ ] Schema verified in Drizzle Studio
- [ ] Migration files committed to git

---

## Resources

- **Drizzle ORM Docs**: https://orm.drizzle.team/docs/overview
- **Drizzle Kit Docs**: https://orm.drizzle.team/docs/kit-overview
- **Neon + Drizzle Guide**: https://orm.drizzle.team/docs/quick-postgresql/neon
- **Migration Best Practices**: https://orm.drizzle.team/docs/migrations
