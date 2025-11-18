# Drizzle ORM D1 - Complete Error Catalog

All 12 documented errors with detailed solutions and sources.

---

## Error 1: D1 Transaction Errors

**Error:**
```
D1_ERROR: Cannot use BEGIN TRANSACTION
```

**Source**: https://github.com/drizzle-team/drizzle-orm/issues/4212

**Cause:**
Drizzle tries to use SQL `BEGIN TRANSACTION` statements, but Cloudflare D1 raises a D1_ERROR requiring use of `state.storage.transaction()` APIs instead. Users cannot work around this error as Drizzle attempts to use `BEGIN TRANSACTION` when using bindings in Workers.

**Solution:**
Use D1's batch API instead of Drizzle's transaction API:

```typescript
// ❌ DON'T: Use traditional transactions
await db.transaction(async (tx) => {
  await tx.insert(users).values({ email: 'test@example.com', name: 'Test' });
  await tx.insert(posts).values({ title: 'Post', content: 'Content', authorId: 1 });
});

// ✅ DO: Use D1 batch API
await db.batch([
  db.insert(users).values({ email: 'test@example.com', name: 'Test' }),
  db.insert(posts).values({ title: 'Post', content: 'Content', authorId: 1 }),
]);
```

---

## Error 2: Foreign Key Constraint Failures

**Error:**
```
FOREIGN KEY constraint failed: SQLITE_CONSTRAINT
```

**Source**: https://github.com/drizzle-team/drizzle-orm/issues/4089

**Cause:**
When generating migrations for Cloudflare D1, Drizzle-ORM uses the statement `PRAGMA foreign_keys = OFF;` which causes migrations to fail when executed. If tables have data and new migrations are generated, they fail with foreign key errors.

**Solution:**
1. Always define foreign keys in schema with proper cascading:

```typescript
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // ← Cascading deletes
});
```

2. Ensure correct migration order (parent tables before child tables)
3. Test migrations locally before production

---

## Error 3: Module Import Errors in Production

**Error:**
```
Error: No such module "wrangler"
```

**Source**: https://github.com/drizzle-team/drizzle-orm/issues/4257

**Cause:**
When using OpenNext, Drizzle, and D1, users encounter "Error: No such module 'wrangler'" which works locally but fails when deployed to Cloudflare Workers. This affects Next.js projects deployed to Cloudflare.

**Solution:**
1. Don't import from `wrangler` package in runtime code
2. Use correct D1 import: `import { drizzle } from 'drizzle-orm/d1'`
3. Configure bundler to externalize Wrangler if needed

---

## Error 4: D1 Binding Not Found

**Error:**
```
TypeError: Cannot read property 'prepare' of undefined
env.DB is undefined
```

**Cause:**
Missing or incorrect `wrangler.jsonc` configuration. The binding name in code doesn't match the binding name in config.

**Solution:**
Ensure binding names match exactly:

```jsonc
// wrangler.jsonc
{
  "d1_databases": [
    {
      "binding": "DB",  // ← Must match env.DB in code
      "database_name": "my-database",
      "database_id": "your-db-id"
    }
  ]
}
```

```typescript
// src/index.ts
export interface Env {
  DB: D1Database;  // ← Must match binding name
}

export default {
  async fetch(request: Request, env: Env) {
    const db = drizzle(env.DB);  // ← Accessing the binding
    // ...
  },
};
```

---

## Error 5: Migration Apply Failures

**Error:**
```
Migration failed to apply: near "...": syntax error
```

**Cause:**
Syntax errors in generated SQL, conflicting migrations, or applying migrations out of order.

**Solution:**
1. Always test migrations locally first:
```bash
npx wrangler d1 migrations apply my-database --local
```

2. Review generated SQL in `./migrations` before applying

3. If migration fails, delete it and regenerate:
```bash
rm -rf migrations/
npx drizzle-kit generate
```

---

## Error 6: Schema TypeScript Inference Errors

**Error:**
```
Type instantiation is excessively deep and possibly infinite
```

**Cause:**
Complex circular references in relations cause TypeScript to fail type inference.

**Solution:**
Use explicit type annotations in relations:

```typescript
import { InferSelectModel } from 'drizzle-orm';

// Define types explicitly
export type User = InferSelectModel<typeof users>;
export type Post = InferSelectModel<typeof posts>;

// Use explicit types in relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
```

---

## Error 7: Prepared Statement Caching Issues

**Error:**
Stale or incorrect results from queries

**Cause:**
Developers expect D1 to cache prepared statements like traditional SQLite, but D1 doesn't maintain statement caches between requests.

**Solution:**
Always use `.all()`, `.get()`, or `.run()` methods correctly:

```typescript
// ✅ Correct: Use .all() for arrays
const users = await db.select().from(users).all();

// ✅ Correct: Use .get() for single result
const user = await db.select().from(users).where(eq(users.id, 1)).get();

// ❌ Wrong: Don't rely on caching behavior
const stmt = db.select().from(users); // Don't reuse across requests
```

---

## Error 8: Transaction Rollback Patterns

**Error:**
Transaction doesn't roll back on error

**Cause:**
D1 batch API doesn't support traditional transaction rollback. If one statement in a batch fails, others may still succeed.

**Solution:**
Implement error handling with manual cleanup:

```typescript
try {
  const results = await db.batch([
    db.insert(users).values({ email: 'test@example.com', name: 'Test' }),
    db.insert(posts).values({ title: 'Post', content: 'Content', authorId: 1 }),
  ]);
  // Both succeeded
} catch (error) {
  // Manual cleanup if needed
  console.error('Batch failed:', error);
  // Potentially delete partially created records
}
```

---

## Error 9: TypeScript Strict Mode Errors

**Error:**
Type errors with `strict: true` in tsconfig.json

**Cause:**
Drizzle types can be loose, and TypeScript strict mode catches potential issues.

**Solution:**
Use explicit return types and assertions:

```typescript
// ✅ Explicit return type
async function getUser(id: number): Promise<User | undefined> {
  return await db.select().from(users).where(eq(users.id, id)).get();
}

// ✅ Type assertion when needed
const user = await db.select().from(users).where(eq(users.id, 1)).get() as User;
```

---

## Error 10: Drizzle Config Not Found

**Error:**
```
Cannot find drizzle.config.ts
```

**Cause:**
Wrong file location or incorrect file name. Drizzle Kit looks for `drizzle.config.ts` in the project root.

**Solution:**
1. File must be named exactly `drizzle.config.ts` (not `drizzle.config.js` or `drizzle-config.ts`)
2. File must be in project root (not in `src/` or subdirectory)
3. If using a different name, specify with `--config` flag:
```bash
npx drizzle-kit generate --config=custom.config.ts
```

---

## Error 11: Remote vs Local D1 Confusion

**Error:**
Changes not appearing in local development or production

**Cause:**
Applying migrations to the wrong database. Forgetting to use `--local` flag during development or using it in production.

**Solution:**
Use consistent flags:

```bash
# Development: Always use --local
npx wrangler d1 migrations apply my-database --local
npx wrangler dev  # Uses local database

# Production: Use --remote
npx wrangler d1 migrations apply my-database --remote
npx wrangler deploy  # Uses remote database
```

---

## Error 12: wrangler.toml vs wrangler.jsonc

**Error:**
Configuration not recognized or comments causing errors

**Cause:**
Mixing TOML and JSON config formats. TOML doesn't support comments the same way, and JSON doesn't support TOML syntax.

**Solution:**
Use `wrangler.jsonc` consistently:

```jsonc
// wrangler.jsonc (supports comments!)
{
  "name": "my-worker",
  // This is a comment
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database"
    }
  ]
}
```

Not:
```toml
# wrangler.toml (old format)
name = "my-worker"
```

---

**All errors documented with sources and solutions.**
