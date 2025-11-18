# Neon & Vercel Postgres Advanced Topics

Deep dive into branching, connection pooling, performance optimization, and security.

---

## Database Branching Workflows

Neon's branching feature allows git-like workflows for databases.

### Branch Types

- **Main branch**: Production database
- **Dev branch**: Long-lived development database
- **PR branches**: Ephemeral branches for preview deployments
- **Test branches**: Isolated testing environments

### Branch Creation

```bash
# Create from main
neonctl branches create --name dev --parent main

# Create from specific point in time (PITR)
neonctl branches create --name restore-point --parent main --timestamp "2025-10-28T10:00:00Z"

# Create from another branch
neonctl branches create --name feature --parent dev
```

### Branch Management

```bash
# List branches
neonctl branches list

# Get connection string
neonctl connection-string dev

# Delete branch
neonctl branches delete feature

# Reset branch to match parent
neonctl branches reset dev --parent main
```

### Use Cases

**Preview Deployments:**
- Create branch per PR
- Deploy preview with isolated database
- Delete on merge

**Testing:**
- Create branch
- Run tests with real data
- Delete after tests complete

**Debugging:**
- Create branch from production at specific timestamp
- Debug without affecting production
- Delete when done

**Development:**
- Separate dev/staging/prod branches
- Test schema changes safely
- Merge changes when ready

### Important Notes

- Branches share compute limits on free tier
- Each branch can have independent compute settings (paid plans)
- Data changes are copy-on-write (instant, no copying)
- Retention period applies to all branches
- Branches created from PITR consume retention period

---

## Connection Pooling Deep Dive

### How Pooling Works

1. Client requests a connection
2. Pooler assigns an existing idle connection or creates new one
3. Client uses connection for query
4. Connection returns to pool (reusable)

### Pooled vs Non-Pooled Comparison

| Feature | Pooled (`-pooler.`) | Non-Pooled |
|---------|---------------------|------------|
| **Use Case** | Serverless, edge functions | Long-running servers |
| **Max Connections** | ~10,000 (shared) | ~100 (per database) |
| **Connection Reuse** | Yes | No |
| **Latency** | +1-2ms overhead | Direct |
| **Idle Timeout** | 60s | Configurable |
| **Best For** | High-concurrency, short queries | Long-running transactions, migrations |

### When Connection Pool Fills

**Error:**
```
Error: connection pool exhausted
```

**Solutions:**
1. **Use pooled connection string** (most common fix)
   - Verify hostname ends with `-pooler.region.aws.neon.tech`
2. **Upgrade to higher tier** (more connection slots)
3. **Optimize queries** (reduce connection hold time)
4. **Implement connection retry logic**
5. **Use read replicas** (distribute load)

### Monitoring Connection Usage

**In Neon Dashboard:**
- Navigate to your project
- Check "Monitoring" tab
- View "Active connections" graph
- Set up alerts for >80% usage

**Programmatically:**
```typescript
// Check active connections
const result = await sql`
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE datname = current_database()
`;

console.log(`Active connections: ${result[0].active_connections}`);
```

### Connection Pool Best Practices

✅ **Do:**
- Use pooled connection strings in serverless
- Monitor connection usage regularly
- Set up alerts for high usage
- Close connections promptly
- Use connection pooling for high-concurrency

❌ **Don't:**
- Use non-pooled connections in serverless
- Hold connections for long periods
- Create new connections per request
- Ignore connection pool exhausted errors
- Disable pooling without good reason

---

## Optimizing Query Performance

### 1. Use EXPLAIN ANALYZE

Understand query execution plan:

```typescript
const result = await sql`
  EXPLAIN ANALYZE
  SELECT * FROM users WHERE email = ${email}
`;

console.log(result);
// Shows:
// - Execution time
// - Rows scanned
// - Index usage
// - Join strategies
```

### 2. Create Indexes

**Raw SQL:**
```typescript
// Index frequently queried columns
await sql`CREATE INDEX idx_users_email ON users(email)`;
await sql`CREATE INDEX idx_posts_user_id ON posts(user_id)`;
await sql`CREATE INDEX idx_posts_created_at ON posts(created_at DESC)`;
```

**Drizzle ORM:**
```typescript
import { pgTable, serial, text, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique()
}, (table) => ({
  emailIdx: index('email_idx').on(table.email)
}));
```

### 3. Avoid N+1 Queries

**❌ Bad - N+1 Problem:**
```typescript
const users = await sql`SELECT * FROM users`;

for (const user of users) {
  const posts = await sql`SELECT * FROM posts WHERE user_id = ${user.id}`;
  user.posts = posts;
}
// Makes 1 + N queries (1 for users, N for posts)
```

**✅ Good - Single Query with JOIN:**
```typescript
const result = await sql`
  SELECT
    users.*,
    json_agg(posts.*) as posts
  FROM users
  LEFT JOIN posts ON posts.user_id = users.id
  GROUP BY users.id
`;
// Makes 1 query total
```

### 4. Use Prepared Statements (Drizzle)

Reuse query plans for better performance:

```typescript
import { db } from './db';
import { users } from './schema';
import { eq, sql } from 'drizzle-orm';

// Prepare statement once
const getUserByEmail = db
  .select()
  .from(users)
  .where(eq(users.email, sql.placeholder('email')))
  .prepare('get_user_by_email');

// Reuse prepared statement
const user1 = await getUserByEmail.execute({ email: 'alice@example.com' });
const user2 = await getUserByEmail.execute({ email: 'bob@example.com' });
```

### 5. Batch Operations

**Insert multiple rows:**
```typescript
// ❌ Bad - Multiple queries
for (const user of users) {
  await sql`INSERT INTO users (name, email) VALUES (${user.name}, ${user.email})`;
}

// ✅ Good - Single query
await sql`
  INSERT INTO users (name, email)
  VALUES ${sql(users.map(u => [u.name, u.email]))}
`;
```

**Drizzle batch insert:**
```typescript
await db.insert(users).values([
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  { name: 'Charlie', email: 'charlie@example.com' }
]);
```

### 6. Limit Query Results

Always paginate large result sets:

```typescript
const page = Math.max(1, parseInt(request.query.page || '1'));
const limit = 50;
const offset = (page - 1) * limit;

const users = await sql`
  SELECT * FROM users
  ORDER BY created_at DESC
  LIMIT ${limit} OFFSET ${offset}
`;
```

### 7. Use Materialized Views

For expensive queries run frequently:

```sql
-- Create materialized view
CREATE MATERIALIZED VIEW user_post_counts AS
  SELECT
    users.id,
    users.name,
    COUNT(posts.id) as post_count
  FROM users
  LEFT JOIN posts ON posts.user_id = users.id
  GROUP BY users.id, users.name;

-- Create index on materialized view
CREATE INDEX idx_user_post_counts_id ON user_post_counts(id);

-- Refresh periodically (e.g., nightly cron job)
REFRESH MATERIALIZED VIEW user_post_counts;
```

---

## Security Best Practices

### 1. Never Expose Connection Strings

**❌ Bad:**
```typescript
const sql = neon('postgresql://user:pass@host/db?sslmode=require');
```

**✅ Good:**
```typescript
const sql = neon(process.env.DATABASE_URL!);
```

### 2. Use Row-Level Security (RLS)

Postgres built-in security for multi-tenant apps:

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy - users can only see their own posts
CREATE POLICY "Users can only see their own posts"
  ON posts
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::int);

-- Create policy - users can only insert their own posts
CREATE POLICY "Users can only insert their own posts"
  ON posts
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::int);
```

**Set current user in application:**
```typescript
export async function getUserPosts(userId: number) {
  // Set session variable
  await sql`SET LOCAL app.current_user_id = ${userId}`;

  // Query automatically filtered by RLS
  const posts = await sql`SELECT * FROM posts`;
  return posts;
}
```

### 3. Validate Input with Zod

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function createUser(input: unknown) {
  // Validate input
  const { name, email } = createUserSchema.parse(input);

  // Safe to query - validated
  const [user] = await sql`
    INSERT INTO users (name, email)
    VALUES (${name}, ${email})
    RETURNING *
  `;

  return user;
}
```

### 4. Use Read-Only Roles for Analytics

```sql
-- Create read-only role
CREATE ROLE readonly;
GRANT CONNECT ON DATABASE mydb TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Create read-only user
CREATE USER analytics_user WITH PASSWORD 'secure-password';
GRANT readonly TO analytics_user;
```

**Use in application:**
```typescript
// Separate connection for analytics (read-only)
const analyticsSQL = neon(process.env.ANALYTICS_DATABASE_URL!);

// Can only SELECT, cannot INSERT/UPDATE/DELETE
const stats = await analyticsSQL`
  SELECT COUNT(*) as total_users FROM users
`;
```

### 5. Audit Logging

Track all data changes:

```sql
-- Create audit log table
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (table_name, operation, old_data)
    VALUES (TG_TABLE_NAME, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (table_name, operation, old_data, new_data)
    VALUES (TG_TABLE_NAME, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (table_name, operation, new_data)
    VALUES (TG_TABLE_NAME, 'INSERT', row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tables
CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### 6. Encrypt Sensitive Data

```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex')
  };
}

function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Store encrypted data
const { encrypted, iv, tag } = encrypt('sensitive data');
await sql`
  INSERT INTO secrets (data, iv, tag)
  VALUES (${encrypted}, ${iv}, ${tag})
`;

// Retrieve and decrypt
const [secret] = await sql`SELECT data, iv, tag FROM secrets WHERE id = ${id}`;
const decrypted = decrypt(secret.data, secret.iv, secret.tag);
```

---

## Backup and Disaster Recovery

### Point-in-Time Restore (PITR)

Neon automatically maintains continuous backups:

```bash
# Restore to specific timestamp
neonctl branches create \
  --name recovery \
  --parent main \
  --timestamp "2025-10-28T14:30:00Z"

# Retention periods:
# Free tier: 7 days
# Paid plans: 14-30 days
```

### Manual Backups

```bash
# Export database to SQL file
pg_dump $DATABASE_URL > backup.sql

# Restore from SQL file
psql $DATABASE_URL < backup.sql
```

### Automated Backup Script

```typescript
// scripts/backup.ts
import { neon } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';

const sql = neon(process.env.DATABASE_URL!);

async function backup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-');

  // Get all table names
  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
  `;

  // Export each table to JSON
  for (const { tablename } of tables) {
    const data = await sql`SELECT * FROM ${sql(tablename)}`;
    writeFileSync(
      `backups/${tablename}-${timestamp}.json`,
      JSON.stringify(data, null, 2)
    );
  }

  console.log(`Backup completed: ${timestamp}`);
}

backup();
```

---

## Official Resources

- **Neon Branching**: https://neon.tech/docs/guides/branching
- **Connection Pooling**: https://neon.tech/docs/connect/connection-pooling
- **Performance**: https://neon.tech/docs/introduction/architecture#performance
- **Security**: https://neon.tech/docs/security/security-overview
- **Postgres RLS**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
