# Neon & Vercel Postgres - Complete Setup Guide

7-step process to set up serverless Postgres with Neon or Vercel.

---

## Step 1: Install Package

Choose based on your deployment platform:

**Neon Direct** (Cloudflare Workers, multi-cloud, direct Neon access):
```bash
npm install @neondatabase/serverless
```

**Vercel Postgres** (Vercel-specific, zero-config):
```bash
npm install @vercel/postgres
```

**With ORM**:
```bash
# Drizzle ORM (recommended)
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Prisma (alternative)
npm install prisma @prisma/client @prisma/adapter-neon @neondatabase/serverless
```

**Key Points:**
- Both packages use HTTP/WebSocket (no TCP required)
- Edge-compatible (works in Cloudflare Workers, Vercel Edge Runtime)
- Connection pooling is built-in when using pooled connection strings
- No need for separate connection pool libraries

---

## Step 2: Create Neon Database

**Option A: Neon Dashboard**
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the **pooled connection string** (important!)
4. Format: `postgresql://user:pass@ep-xyz-pooler.region.aws.neon.tech/db?sslmode=require`

**Option B: Vercel Dashboard**
1. Go to your Vercel project → Storage → Create Database → Postgres
2. Vercel automatically creates a Neon database
3. Run `vercel env pull` to get environment variables locally

**Option C: Neon CLI** (neonctl)
```bash
# Install CLI
npm install -g neonctl

# Authenticate
neonctl auth

# Create project
neonctl projects create --name my-app

# Get connection string
neonctl connection-string main
```

**CRITICAL:**
- Always use the **pooled connection string** (ends with `-pooler.region.aws.neon.tech`)
- Non-pooled connections are for direct connections (not serverless)
- Include `?sslmode=require` in connection string

---

## Step 3: Configure Environment Variables

**For Neon Direct:**
```bash
# .env or .env.local
DATABASE_URL="postgresql://user:password@ep-xyz-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**For Vercel Postgres:**
```bash
# Automatically created by `vercel env pull`
POSTGRES_URL="..."               # Pooled connection (use this for queries)
POSTGRES_PRISMA_URL="..."        # For Prisma migrations
POSTGRES_URL_NON_POOLING="..."   # Direct connection (avoid in serverless)
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."
```

**For Cloudflare Workers** (wrangler.jsonc):
```json
{
  "vars": {
    "DATABASE_URL": "postgresql://user:password@ep-xyz-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
  }
}
```

**Key Points:**
- Use `POSTGRES_URL` (pooled) for queries
- Use `POSTGRES_PRISMA_URL` for Prisma migrations
- Never use `POSTGRES_URL_NON_POOLING` in serverless functions
- Store secrets securely (Vercel env, Cloudflare secrets, etc.)

---

## Step 4: Create Database Schema

**Option A: Raw SQL**
```typescript
// scripts/migrate.ts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`;
```

**Option B: Drizzle ORM** (recommended)
```typescript
// db/schema.ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow()
});
```

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

```bash
# Run migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

**Option C: Prisma**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

```bash
npx prisma migrate dev --name init
```

**CRITICAL:**
- Use Drizzle for edge-compatible ORM (works in Cloudflare Workers)
- Prisma requires Node.js runtime (won't work in Cloudflare Workers)
- Run migrations from Node.js environment, not from edge functions

---

## Step 5: Query Patterns

**Simple Queries (Neon Direct):**
```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// SELECT
const users = await sql`SELECT * FROM users WHERE email = ${email}`;

// INSERT
const newUser = await sql`
  INSERT INTO users (name, email)
  VALUES (${name}, ${email})
  RETURNING *
`;

// UPDATE
await sql`UPDATE users SET name = ${newName} WHERE id = ${id}`;

// DELETE
await sql`DELETE FROM users WHERE id = ${id}`;
```

**Simple Queries (Vercel Postgres):**
```typescript
import { sql } from '@vercel/postgres';

// SELECT
const { rows } = await sql`SELECT * FROM users WHERE email = ${email}`;

// INSERT
const { rows: newUser } = await sql`
  INSERT INTO users (name, email)
  VALUES (${name}, ${email})
  RETURNING *
`;
```

**Transactions (Neon Direct):**
```typescript
// Automatic transaction
const results = await sql.transaction([
  sql`INSERT INTO users (name) VALUES (${name})`,
  sql`UPDATE accounts SET balance = balance - ${amount} WHERE id = ${accountId}`
]);

// Manual transaction (for complex logic)
const result = await sql.transaction(async (sql) => {
  const [user] = await sql`INSERT INTO users (name) VALUES (${name}) RETURNING id`;
  await sql`INSERT INTO profiles (user_id) VALUES (${user.id})`;
  return user;
});
```

**Transactions (Vercel Postgres):**
```typescript
import { sql } from '@vercel/postgres';

const client = await sql.connect();
try {
  await client.sql`BEGIN`;
  const { rows } = await client.sql`INSERT INTO users (name) VALUES (${name}) RETURNING id`;
  await client.sql`INSERT INTO profiles (user_id) VALUES (${rows[0].id})`;
  await client.sql`COMMIT`;
} catch (e) {
  await client.sql`ROLLBACK`;
  throw e;
} finally {
  client.release();
}
```

**Drizzle ORM Queries:**
```typescript
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

// SELECT
const allUsers = await db.select().from(users);
const user = await db.select().from(users).where(eq(users.email, email));

// INSERT
const newUser = await db.insert(users).values({ name, email }).returning();

// UPDATE
await db.update(users).set({ name: newName }).where(eq(users.id, id));

// DELETE
await db.delete(users).where(eq(users.id, id));

// Transactions
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name, email });
  await tx.insert(profiles).values({ userId: user.id });
});
```

**Key Points:**
- Always use template tag syntax (`` sql`...` ``) for SQL injection protection
- Transactions are atomic (all succeed or all fail)
- Release connections after use (Vercel Postgres manual transactions)
- Drizzle is fully type-safe and edge-compatible

---

## Step 6: Handle Connection Pooling

**Connection String Format:**
```
Pooled (serverless):     postgresql://user:pass@ep-xyz-pooler.region.aws.neon.tech/db
Non-pooled (direct):     postgresql://user:pass@ep-xyz.region.aws.neon.tech/db
```

**When to Use Each:**
- **Pooled** (`-pooler.`): Serverless functions, edge functions, high-concurrency
- **Non-pooled**: Long-running servers, migrations, admin tasks, connection limits not a concern

**Automatic Pooling (Neon/Vercel):**
```typescript
// Both packages handle pooling automatically when using pooled connection string
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!); // Pooling is automatic
```

**Connection Limits:**
- **Neon Free Tier**: 100 concurrent connections
- **Pooled Connection**: Shares connections across requests
- **Non-Pooled**: Each request gets a new connection (exhausts quickly)

**CRITICAL:**
- Always use pooled connection strings in serverless environments
- Non-pooled connections will cause "connection pool exhausted" errors
- Monitor connection usage in Neon dashboard

---

## Step 7: Deploy and Test

**Cloudflare Workers:**
```typescript
// src/index.ts
import { neon } from '@neondatabase/serverless';

export default {
  async fetch(request: Request, env: Env) {
    const sql = neon(env.DATABASE_URL);
    const users = await sql`SELECT * FROM users`;
    return Response.json(users);
  }
};
```

```bash
# Deploy
npx wrangler deploy
```

**Vercel (Next.js API Route):**
```typescript
// app/api/users/route.ts
import { sql } from '@vercel/postgres';

export async function GET() {
  const { rows } = await sql`SELECT * FROM users`;
  return Response.json(rows);
}
```

```bash
# Deploy
vercel deploy --prod
```

**Test Queries:**
```bash
# Local test
curl http://localhost:8787/api/users

# Production test
curl https://your-app.workers.dev/api/users
```

**Key Points:**
- Test locally before deploying
- Monitor query performance in Neon dashboard
- Set up alerts for connection pool exhaustion
- Use Neon's query history for debugging

---

**Official Documentation**:
- Neon Setup: https://neon.tech/docs/get-started-with-neon/signing-up
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres/quickstart
- Drizzle + Neon: https://orm.drizzle.team/docs/quick-postgresql/neon
