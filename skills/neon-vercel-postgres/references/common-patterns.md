# Neon & Vercel Postgres Common Patterns

5 production-tested patterns for serverless Postgres applications.

---

## Pattern 1: Cloudflare Worker with Neon

Complete REST API with Postgres database in Cloudflare Workers.

```typescript
// src/index.ts
import { neon } from '@neondatabase/serverless';

interface Env {
  DATABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const sql = neon(env.DATABASE_URL);

    // Parse request
    const url = new URL(request.url);

    if (url.pathname === '/api/users' && request.method === 'GET') {
      const users = await sql`SELECT id, name, email FROM users`;
      return Response.json(users);
    }

    if (url.pathname === '/api/users' && request.method === 'POST') {
      const { name, email } = await request.json();
      const [user] = await sql`
        INSERT INTO users (name, email)
        VALUES (${name}, ${email})
        RETURNING *
      `;
      return Response.json(user, { status: 201 });
    }

    return new Response('Not Found', { status: 404 });
  }
};
```

**When to use**: Cloudflare Workers deployment with Postgres database

**Key points**:
- Use `env.DATABASE_URL` (not `process.env` in Workers)
- Always use pooled connection string
- HTTP-based client (`@neondatabase/serverless`) works in V8 isolates
- No need for connection management (automatic)

---

## Pattern 2: Next.js Server Action with Vercel Postgres

Type-safe server actions with Postgres queries.

```typescript
// app/actions/users.ts
'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  const { rows } = await sql`SELECT id, name, email FROM users ORDER BY created_at DESC`;
  return rows;
}

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const { rows } = await sql`
    INSERT INTO users (name, email)
    VALUES (${name}, ${email})
    RETURNING *
  `;

  revalidatePath('/users');
  return rows[0];
}

export async function deleteUser(id: number) {
  await sql`DELETE FROM users WHERE id = ${id}`;
  revalidatePath('/users');
}
```

**When to use**: Next.js Server Actions with Vercel Postgres

**Key points**:
- `'use server'` directive required
- `revalidatePath()` clears Next.js cache after mutations
- Automatic error boundaries in Server Actions
- No client-side bundle size impact

---

## Pattern 3: Drizzle ORM with Type Safety

Fully type-safe queries with joins and relations.

```typescript
// db/schema.ts
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow()
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content'),
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

```typescript
// app/api/posts/route.ts
import { db } from '@/db';
import { posts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  // Type-safe query with joins
  const postsWithAuthors = await db
    .select({
      postId: posts.id,
      title: posts.title,
      content: posts.content,
      authorName: users.name
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id));

  return Response.json(postsWithAuthors);
}
```

**When to use**: Need type-safe queries, complex joins, edge-compatible ORM

**Key points**:
- Full TypeScript type inference
- Works in all runtimes (Cloudflare Workers, Vercel Edge, Node.js)
- Auto-completion for columns, tables, relations
- Schema-first approach (define once, use everywhere)

---

## Pattern 4: Database Transactions

Atomic operations that all succeed or all fail.

```typescript
// Neon Direct - Automatic Transaction
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const result = await sql.transaction(async (tx) => {
  // Deduct from sender
  const [sender] = await tx`
    UPDATE accounts
    SET balance = balance - ${amount}
    WHERE id = ${senderId} AND balance >= ${amount}
    RETURNING *
  `;

  if (!sender) {
    throw new Error('Insufficient funds');
  }

  // Add to recipient
  await tx`
    UPDATE accounts
    SET balance = balance + ${amount}
    WHERE id = ${recipientId}
  `;

  // Log transaction
  await tx`
    INSERT INTO transfers (from_id, to_id, amount)
    VALUES (${senderId}, ${recipientId}, ${amount})
  `;

  return sender;
});
```

**Vercel Postgres Version:**
```typescript
import { sql } from '@vercel/postgres';

const client = await sql.connect();
try {
  await client.sql`BEGIN`;

  const { rows: [sender] } = await client.sql`
    UPDATE accounts
    SET balance = balance - ${amount}
    WHERE id = ${senderId} AND balance >= ${amount}
    RETURNING *
  `;

  if (!sender) throw new Error('Insufficient funds');

  await client.sql`
    UPDATE accounts
    SET balance = balance + ${amount}
    WHERE id = ${recipientId}
  `;

  await client.sql`
    INSERT INTO transfers (from_id, to_id, amount)
    VALUES (${senderId}, ${recipientId}, ${amount})
  `;

  await client.sql`COMMIT`;
} catch (e) {
  await client.sql`ROLLBACK`;
  throw e;
} finally {
  client.release(); // CRITICAL
}
```

**When to use**: Multiple related database operations that must all succeed or all fail

**Key points**:
- Transactions are atomic (ACID guarantees)
- Any error rolls back all changes
- Keep transactions short (<5s) to avoid timeouts
- Always release connections (Vercel Postgres)

---

## Pattern 5: Neon Branching for Preview Environments

Git-like database branches for each pull request.

**CLI Workflow:**
```bash
# Create branch for PR
neonctl branches create --project-id my-project --name pr-123 --parent main

# Get connection string for branch
BRANCH_URL=$(neonctl connection-string pr-123)

# Use in Vercel preview deployment
vercel env add DATABASE_URL preview
# Paste $BRANCH_URL

# Delete branch when PR is merged
neonctl branches delete pr-123
```

**GitHub Actions Workflow:**
```yaml
# .github/workflows/preview.yml
name: Create Preview Database
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - name: Install Neon CLI
        run: npm install -g neonctl

      - name: Create Neon Branch
        id: branch
        run: |
          BRANCH_NAME="pr-${{ github.event.pull_request.number }}"
          neonctl branches create \
            --project-id ${{ secrets.NEON_PROJECT_ID }} \
            --name $BRANCH_NAME \
            --parent main

          BRANCH_URL=$(neonctl connection-string $BRANCH_NAME)
          echo "url=$BRANCH_URL" >> $GITHUB_OUTPUT

      - name: Deploy to Vercel
        env:
          DATABASE_URL: ${{ steps.branch.outputs.url }}
        run: vercel deploy --env DATABASE_URL=$DATABASE_URL
```

**Cleanup Workflow:**
```yaml
# .github/workflows/cleanup.yml
name: Delete Preview Database
on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Delete Neon Branch
        run: |
          BRANCH_NAME="pr-${{ github.event.pull_request.number }}"
          neonctl branches delete $BRANCH_NAME --project-id ${{ secrets.NEON_PROJECT_ID }}
```

**When to use**: Want isolated database for each PR/preview deployment

**Key points**:
- Instant branch creation (copy-on-write, no data copying)
- Each branch has independent data
- Branches share compute limits on free tier
- Auto-delete branches when PR closes (save costs)
- Can create from any point in time (PITR)

**Use cases**:
- Preview deployments (one branch per PR)
- Testing (create, test, delete)
- Debugging (branch from production at specific timestamp)
- Development (separate dev/staging/prod branches)

---

## Additional Patterns

### Pattern 6: Pagination

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function getUsers(page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit;

  const users = await sql`
    SELECT * FROM users
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const [{ count }] = await sql`SELECT COUNT(*) as count FROM users`;

  return {
    users,
    pagination: {
      page,
      limit,
      total: Number(count),
      pages: Math.ceil(Number(count) / limit)
    }
  };
}
```

### Pattern 7: Search with Full-Text

```typescript
// Create search index
await sql`
  CREATE INDEX users_search_idx ON users
  USING GIN (to_tsvector('english', name || ' ' || email))
`;

// Search users
export async function searchUsers(query: string) {
  return await sql`
    SELECT * FROM users
    WHERE to_tsvector('english', name || ' ' || email)
      @@ plainto_tsquery('english', ${query})
    ORDER BY ts_rank(
      to_tsvector('english', name || ' ' || email),
      plainto_tsquery('english', ${query})
    ) DESC
  `;
}
```

### Pattern 8: Upsert (Insert or Update)

```typescript
export async function upsertUser(email: string, name: string) {
  const [user] = await sql`
    INSERT INTO users (email, name)
    VALUES (${email}, ${name})
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = NOW()
    RETURNING *
  `;
  return user;
}
```

---

**Official Resources**:
- Neon Examples: https://github.com/neondatabase/examples
- Drizzle Recipes: https://orm.drizzle.team/docs/recipes
- Vercel Postgres Examples: https://vercel.com/templates?search=postgres
