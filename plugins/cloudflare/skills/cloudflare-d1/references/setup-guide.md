# Cloudflare D1 Complete Setup Guide

Complete setup for Cloudflare D1 serverless SQLite database.

---

## Step 1: Create D1 Database

```bash
npx wrangler d1 create my-database
```

**Output:**
```
✅ Successfully created DB 'my-database'

[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "<UUID>"
```

Save the `database_id`!

---

## Step 2: Configure D1 Binding

Add to `wrangler.jsonc`:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "d1_databases": [
    {
      "binding": "DB",                    // env.DB in code
      "database_name": "my-database",     // From Step 1
      "database_id": "<UUID>",            // From Step 1
      "preview_database_id": "local-db"   // For local dev
    }
  ]
}
```

---

## Step 3: Create Migration

```bash
npx wrangler d1 migrations create my-database create_users_table
```

Creates: `migrations/0001_create_users_table.sql`

---

## Step 4: Write Schema

Edit `migrations/0001_create_users_table.sql`:

```sql
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

PRAGMA optimize;
```

---

## Step 5: Apply Migration

### Local:

```bash
npx wrangler d1 migrations apply my-database --local
```

### Production:

```bash
npx wrangler d1 migrations apply my-database --remote
```

---

## Step 6: Query from Worker

```typescript
import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/users/:email', async (c) => {
  const email = c.req.param('email');

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  )
    .bind(email)
    .all();

  return c.json(results);
});

app.post('/users', async (c) => {
  const { email, username } = await c.req.json();

  const { results } = await c.env.DB.prepare(
    'INSERT INTO users (email, username, created_at) VALUES (?, ?, ?) RETURNING *'
  )
    .bind(email, username, Date.now())
    .all();

  return c.json(results[0]);
});

export default app;
```

---

## Step 7: Deploy

```bash
npx wrangler deploy
```

Test:

```bash
curl https://my-worker.workers.dev/users/test@example.com
```

---

## Production Checklist

- [ ] Database created with descriptive name
- [ ] Bindings configured in wrangler.jsonc
- [ ] Migrations applied to production
- [ ] Indexes created for common queries
- [ ] Prepared statements used (never string concatenation)
- [ ] Error handling implemented
- [ ] Read replication configured (if needed)
- [ ] Batch queries for multiple operations
- [ ] Schema optimized with PRAGMA optimize
- [ ] Database ID stored securely (not in public repos)

---

**Load `references/query-patterns.md` for advanced query patterns.**
**Load `references/read-replication.md` for global read replicas.**
**Load `references/best-practices.md` for optimization techniques.**
