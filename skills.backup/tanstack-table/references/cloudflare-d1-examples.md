# Cloudflare D1 + TanStack Table Examples

Complete examples for integrating TanStack Table with Cloudflare D1 databases.

## Setup

### 1. Database Schema (schema.sql)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. Wrangler Configuration (wrangler.jsonc)

```jsonc
{
  "name": "table-d1-example",
  "compatibility_date": "2025-11-07",
  "pages_build_output_dir": "dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "users-db",
      "database_id": "your-database-id"
    }
  ]
}
```

### 3. TypeScript Types

```typescript
interface Env {
  DB: D1Database
}

interface User {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}
```

## Complete API Example

```typescript
// functions/api/users.ts
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 0
  const pageSize = Number(url.searchParams.get('pageSize')) || 20
  const sortBy = url.searchParams.get('sortBy') || 'created_at'
  const sortOrder = url.searchParams.get('sortOrder') || 'desc'
  const search = url.searchParams.get('search') || ''

  const offset = page * pageSize

  try {
    // Build query with filters
    let query = 'SELECT id, name, email, role, created_at FROM users'
    let countQuery = 'SELECT COUNT(*) as total FROM users'
    const params: (string | number)[] = []
    const countParams: string[] = []

    // Add search filter
    if (search) {
      const whereClause = ' WHERE name LIKE ? OR email LIKE ?'
      query += whereClause
      countQuery += whereClause
      params.push(`%${search}%`, `%${search}%`)
      countParams.push(`%${search}%`, `%${search}%`)
    }

    // Add sorting (validate!)
    const allowedColumns = ['id', 'name', 'email', 'role', 'created_at']
    if (allowedColumns.includes(sortBy)) {
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`
    }

    // Add pagination
    query += ' LIMIT ? OFFSET ?'
    params.push(pageSize, offset)

    // Execute queries
    const { results } = await env.DB.prepare(query).bind(...params).all()
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>()

    return Response.json({
      data: results,
      pagination: {
        page,
        pageSize,
        total: countResult?.total || 0,
        pageCount: Math.ceil((countResult?.total || 0) / pageSize),
      },
    })
  } catch (error) {
    console.error('D1 error:', error)
    return Response.json({ error: 'Database query failed' }, { status: 500 })
  }
}
```

## Client-Side Integration

See complete example in `templates/d1-database-example.tsx`

## Performance Tips

1. **Add indexes** for frequently sorted/filtered columns
2. **Use prepared statements** (already done with `.prepare()`)
3. **Limit SELECT columns** - only fetch what you need
4. **Use EXPLAIN** to analyze slow queries
5. **Consider caching** with KV for frequently accessed data

## Further Reading

- [Cloudflare D1 Skill](~/.claude/skills/cloudflare-d1/SKILL.md)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
