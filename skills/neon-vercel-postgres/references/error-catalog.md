# Neon & Vercel Postgres Error Catalog

Complete catalog of 15 documented errors with solutions and troubleshooting guide.

---

## Error #1: Connection Pool Exhausted

**Error**: `Error: connection pool exhausted` or `too many connections for role`

**Source**: https://github.com/neondatabase/serverless/issues/12

**Why It Happens**: Using non-pooled connection string in high-concurrency serverless environment

**Solution**:
1. Verify you're using **pooled connection string** (ends with `-pooler.region.aws.neon.tech`)
2. Check current format: `postgresql://user:pass@ep-xyz-pooler.region.aws.neon.tech/db`
3. Check connection usage in Neon dashboard
4. Upgrade to higher tier if consistently hitting limits
5. Optimize queries to reduce connection hold time

---

## Error #2: TCP Connections Not Supported

**Error**: `Error: TCP connections are not supported in this environment`

**Source**: Cloudflare Workers documentation

**Why It Happens**: Traditional Postgres clients use TCP sockets, which aren't available in edge runtimes

**Solution**:
- Use `@neondatabase/serverless` (HTTP/WebSocket-based) instead of `pg` or `postgres.js` packages
- Verify you're not importing traditional Postgres clients
- Check bundle includes HTTP/WebSocket-based client

Example:
```typescript
// ❌ Wrong - TCP-based
import { Pool } from 'pg';

// ✅ Correct - HTTP-based
import { neon } from '@neondatabase/serverless';
```

---

## Error #3: SQL Injection from String Concatenation

**Error**: Successful SQL injection attack or unexpected query results

**Source**: OWASP SQL Injection Guide

**Why It Happens**: Concatenating user input into SQL strings

**Solution**:
Always use template tag syntax for automatic escaping:

```typescript
// ❌ DANGEROUS - SQL Injection Risk
const result = sql('SELECT * FROM users WHERE id = ' + userId);

// ✅ SAFE - Template tags prevent injection
const result = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

Template tags automatically:
- Escape special characters
- Parameterize queries
- Prevent SQL injection

---

## Error #4: Missing SSL Mode

**Error**: `Error: connection requires SSL` or `FATAL: no pg_hba.conf entry`

**Source**: https://neon.tech/docs/connect/connect-securely

**Why It Happens**: Connection string missing `?sslmode=require` parameter

**Solution**:
Always append `?sslmode=require` to connection string:

```bash
# ❌ Wrong
DATABASE_URL="postgresql://user:pass@ep-xyz-pooler.region.aws.neon.tech/db"

# ✅ Correct
DATABASE_URL="postgresql://user:pass@ep-xyz-pooler.region.aws.neon.tech/db?sslmode=require"
```

---

## Error #5: Connection Leak (Vercel Postgres)

**Error**: Gradually increasing memory usage, eventual timeout errors

**Source**: https://github.com/vercel/storage/issues/45

**Why It Happens**: Forgetting to call `client.release()` after manual transactions

**Solution**:
Always use try/finally block:

```typescript
const client = await sql.connect();
try {
  await client.sql`BEGIN`;
  // ... your queries
  await client.sql`COMMIT`;
} catch (e) {
  await client.sql`ROLLBACK`;
  throw e;
} finally {
  client.release(); // CRITICAL - prevents leak
}
```

---

## Error #6: Wrong Environment Variable (Vercel)

**Error**: `Error: Connection string is undefined` or `connect ECONNREFUSED`

**Source**: https://vercel.com/docs/storage/vercel-postgres/using-an-orm

**Why It Happens**: Using `DATABASE_URL` instead of `POSTGRES_URL`, or vice versa

**Solution**:
Use correct environment variables for Vercel Postgres:

```typescript
// ✅ For queries (pooled)
import { sql } from '@vercel/postgres'; // Uses POSTGRES_URL

// ✅ For Prisma migrations (non-pooled)
// Use POSTGRES_PRISMA_URL in schema.prisma
```

Environment variables Vercel creates:
- `POSTGRES_URL` - Use for queries (pooled)
- `POSTGRES_PRISMA_URL` - Use for Prisma migrations
- `POSTGRES_URL_NON_POOLING` - **Never use in serverless**

---

## Error #7: Transaction Timeout in Edge Functions

**Error**: `Error: Query timeout` or `Error: transaction timeout`

**Source**: https://neon.tech/docs/introduction/limits

**Why It Happens**: Long-running transactions exceed edge function timeout (typically 30s)

**Solution**:
1. Keep transactions short (<5s)
2. Batch operations where possible
3. Move complex transactions to background workers
4. Set appropriate timeout in query options

```typescript
// Set timeout for slow queries
const result = await sql`SELECT * FROM large_table`, {
  queryTimeout: 30000 // 30 seconds
};
```

---

## Error #8: Prisma in Cloudflare Workers

**Error**: `Error: PrismaClient is unable to be run in the browser` or module resolution errors

**Source**: https://github.com/prisma/prisma/issues/18765

**Why It Happens**: Prisma requires Node.js runtime with filesystem access

**Solution**:
- Use **Drizzle ORM** for Cloudflare Workers (fully edge-compatible)
- Prisma works in Vercel Edge/Node.js runtimes only with `@prisma/adapter-neon`
- Never use Prisma in V8 isolates (Cloudflare Workers)

```typescript
// ❌ Won't work in Cloudflare Workers
import { PrismaClient } from '@prisma/client';

// ✅ Works in Cloudflare Workers
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
```

---

## Error #9: Branch API Authentication Error

**Error**: `Error: Unauthorized` when calling Neon API

**Source**: https://neon.tech/docs/api/authentication

**Why It Happens**: Missing or invalid `NEON_API_KEY` environment variable

**Solution**:
1. Create API key in Neon dashboard → Account Settings → API Keys
2. Set as environment variable
3. Use in API calls

```bash
# Generate API key
export NEON_API_KEY="your-api-key"

# Use in neonctl
neonctl auth
```

---

## Error #10: Stale Connection After Branch Delete

**Error**: `Error: database "xyz" does not exist` after deleting a branch

**Source**: https://neon.tech/docs/guides/branching

**Why It Happens**: Application still using connection string from deleted branch

**Solution**:
1. Update `DATABASE_URL` when switching branches
2. Restart application after branch changes
3. Verify branch exists before using connection string

```bash
# List existing branches
neonctl branches list

# Update environment variable to new branch
export DATABASE_URL=$(neonctl connection-string main)
```

---

## Error #11: Query Timeout on Cold Start

**Error**: `Error: Query timeout` on first request after idle period

**Source**: https://neon.tech/docs/introduction/auto-suspend

**Why It Happens**: Neon auto-suspends compute after inactivity (~5 min), takes ~1-2s to wake up

**Solution**:
1. Expect cold starts (normal behavior)
2. Set query timeout >= 10s to account for wake-up time
3. Disable auto-suspend on paid plans for always-on databases
4. Consider warming queries for critical paths

```typescript
// Set appropriate timeout for first query
const result = await sql`SELECT * FROM users`, {
  queryTimeout: 10000 // 10 seconds (accounts for cold start)
};
```

---

## Error #12: Drizzle Schema Mismatch

**Error**: TypeScript errors like `Property 'x' does not exist on type 'User'`

**Source**: https://orm.drizzle.team/docs/generate

**Why It Happens**: Database schema changed but Drizzle types not regenerated

**Solution**:
1. Run `npx drizzle-kit generate` after any schema changes
2. Commit generated migration files
3. Run migrations: `npx drizzle-kit migrate`

```bash
# After changing schema.ts
npx drizzle-kit generate  # Generates migration SQL
npx drizzle-kit migrate   # Applies migration to database
```

---

## Error #13: Migration Conflicts Across Branches

**Error**: `Error: relation "xyz" already exists` or migration version conflicts

**Source**: https://neon.tech/docs/guides/branching#schema-migrations

**Why It Happens**: Multiple branches with different migration histories

**Solution**:
1. Create branches AFTER running migrations on main
2. Or reset branch schema before merging
3. Maintain single source of truth for migrations

```bash
# Reset branch to match main
neonctl branches reset feature --parent main

# Or create branch after migrations
npx drizzle-kit migrate  # On main first
neonctl branches create --name feature --parent main
```

---

## Error #14: PITR Timestamp Out of Range

**Error**: `Error: timestamp is outside retention window`

**Source**: https://neon.tech/docs/introduction/point-in-time-restore

**Why It Happens**: Trying to restore from a timestamp older than retention period

**Solution**:
- **Free tier**: 7-day retention
- **Paid plans**: 14-30 day retention
- Restore within allowed window

```bash
# Check retention period in dashboard
# Create branch from specific timestamp (within retention)
neonctl branches create --name restore-point --parent main \
  --timestamp "2025-10-28T10:00:00Z"
```

---

## Error #15: Wrong Adapter for Prisma

**Error**: `Error: Invalid connection string` or slow query performance

**Source**: https://www.prisma.io/docs/orm/overview/databases/neon

**Why It Happens**: Not using `@prisma/adapter-neon` for serverless environments

**Solution**:
Install and configure Neon adapter for Prisma:

```bash
npm install @prisma/adapter-neon @neondatabase/serverless
```

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaNeon(pool)
const prisma = new PrismaClient({ adapter })
```

---

## Troubleshooting Guide

### Problem: `Error: connection pool exhausted`
**Solution**:
1. Verify you're using pooled connection string (ends with `-pooler.region.aws.neon.tech`)
2. Check connection usage in Neon dashboard
3. Upgrade to higher tier if consistently hitting limits
4. Optimize queries to reduce connection hold time

### Problem: `Error: TCP connections are not supported`
**Solution**:
- Use `@neondatabase/serverless` instead of `pg` or `postgres.js`
- Verify you're not importing traditional Postgres clients
- Check bundle includes HTTP/WebSocket-based client

### Problem: `Error: database "xyz" does not exist`
**Solution**:
- Verify `DATABASE_URL` points to correct database
- If using Neon branching, ensure branch still exists
- Check connection string format (no typos)

### Problem: Slow queries on cold start
**Solution**:
- Neon auto-suspends after 5 minutes of inactivity (free tier)
- First query after wake takes ~1-2 seconds
- Set query timeout >= 10s to account for cold starts
- Disable auto-suspend on paid plans for always-on databases

### Problem: `PrismaClient is unable to be run in the browser`
**Solution**:
- Prisma doesn't work in Cloudflare Workers (V8 isolates)
- Use Drizzle ORM for edge-compatible ORM
- Prisma works in Vercel Edge/Node.js runtimes with `@prisma/adapter-neon`

### Problem: Migration version conflicts across branches
**Solution**:
- Run migrations on main branch first
- Create feature branches AFTER migrations
- Or reset branch schema before merging: `neonctl branches reset feature --parent main`

---

## Prevention Checklist

Use this to avoid all 15 errors:

- [ ] Using **pooled connection string** (ends with `-pooler.`)
- [ ] Connection string includes `?sslmode=require`
- [ ] Using template tag syntax (`` sql`...` ``) for queries
- [ ] Using `@neondatabase/serverless` (not `pg` or `postgres.js`)
- [ ] Calling `client.release()` in finally blocks (Vercel Postgres)
- [ ] Using correct env vars (`POSTGRES_URL` for queries, not `POSTGRES_URL_NON_POOLING`)
- [ ] Transactions kept short (<5s)
- [ ] Using Drizzle ORM for Cloudflare Workers (not Prisma)
- [ ] API key set for Neon API calls
- [ ] Updating `DATABASE_URL` when switching branches
- [ ] Setting query timeout >= 10s for cold starts
- [ ] Running `drizzle-kit generate` after schema changes
- [ ] Creating branches AFTER running migrations
- [ ] Restoring from timestamps within retention period
- [ ] Using `@prisma/adapter-neon` with Prisma (if not using Drizzle)

---

**Official Resources**:
- Neon Troubleshooting: https://neon.tech/docs/connect/connection-errors
- Vercel Postgres Troubleshooting: https://vercel.com/docs/storage/vercel-postgres/troubleshooting
