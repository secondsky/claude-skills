# Cloudflare Hyperdrive Complete Setup

Quick setup for connecting Workers to PostgreSQL/MySQL databases.

---

## Step 1: Create Hyperdrive Configuration

```bash
# PostgreSQL
npx wrangler hyperdrive create my-postgres-db \
  --connection-string="postgres://user:password@host:5432/database"

# MySQL
npx wrangler hyperdrive create my-mysql-db \
  --connection-string="mysql://user:password@host:3306/database"
```

Save the `id` from output!

---

## Step 2: Configure Binding

Add to `wrangler.jsonc`:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],  // REQUIRED!
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "<ID_FROM_STEP_1>"
    }
  ]
}
```

---

## Step 3: Install Database Driver

```bash
# PostgreSQL (choose one)
bun add pg               # node-postgres
bun add postgres         # postgres.js

# MySQL
bun add mysql2
```

---

## Step 4: Query Database

### PostgreSQL (node-postgres)

```typescript
import { Client } from 'pg';

export default {
  async fetch(request, env, ctx) {
    const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
    await client.connect();

    const result = await client.query('SELECT * FROM users LIMIT 10');
    await client.end();

    return Response.json(result.rows);
  }
};
```

### PostgreSQL (postgres.js)

```typescript
import postgres from 'postgres';

export default {
  async fetch(request, env, ctx) {
    const sql = postgres(env.HYPERDRIVE.connectionString);

    const users = await sql`SELECT * FROM users LIMIT 10`;

    return Response.json(users);
  }
};
```

### MySQL

```typescript
import mysql from 'mysql2/promise';

export default {
  async fetch(request, env, ctx) {
    const connection = await mysql.createConnection(env.HYPERDRIVE.connectionString);

    const [rows] = await connection.execute('SELECT * FROM users LIMIT 10');
    await connection.end();

    return Response.json(rows);
  }
};
```

---

## Step 5: Deploy

```bash
npx wrangler deploy
```

---

## Production Checklist

- [ ] Hyperdrive configuration created
- [ ] Binding configured in wrangler.jsonc
- [ ] nodejs_compat flag enabled
- [ ] Database driver installed
- [ ] Connection properly closed after queries
- [ ] Error handling implemented
- [ ] Query caching considered
- [ ] Connection pooling verified

---

## Official Documentation

- **Hyperdrive Overview**: https://developers.cloudflare.com/hyperdrive/
- **Get Started**: https://developers.cloudflare.com/hyperdrive/get-started/
- **Configuration**: https://developers.cloudflare.com/hyperdrive/configuration/
