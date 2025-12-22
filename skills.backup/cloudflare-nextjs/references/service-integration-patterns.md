# Cloudflare Next.js - Service Integration Patterns

**Complete Integration Reference** - Load this file when integrating Cloudflare services (D1, R2, KV, Workers AI) with Next.js on Workers.

This guide provides detailed patterns for accessing Cloudflare bindings from Next.js route handlers, API routes, and server components.

---

## General Pattern: Accessing Cloudflare Bindings

All Cloudflare bindings are accessed via `process.env` in Next.js route handlers:

```typescript
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Access Cloudflare environment bindings
  const env = process.env as any;

  // Use bindings: env.DB, env.BUCKET, env.KV, env.AI, etc.
}
```

**Important**: Bindings must be defined in `wrangler.jsonc` before they can be accessed.

---

## D1 Database (SQL) - Complete Patterns

### Basic Query (SELECT)

```typescript
// app/api/users/route.ts
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const env = process.env as any;

  const result = await env.DB.prepare(
    'SELECT * FROM users WHERE active = ?'
  ).bind(true).all();

  return Response.json(result.results);
}
```

### Insert Data

```typescript
export async function POST(request: NextRequest) {
  const env = process.env as any;
  const { name, email } = await request.json();

  const result = await env.DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?)'
  ).bind(name, email).run();

  return Response.json({ id: result.meta.last_row_id });
}
```

### Transaction Example

```typescript
export async function POST(request: NextRequest) {
  const env = process.env as any;
  const { userId, amount } = await request.json();

  // D1 transactions
  const result = await env.DB.batch([
    env.DB.prepare('UPDATE accounts SET balance = balance - ? WHERE user_id = ?').bind(amount, userId),
    env.DB.prepare('INSERT INTO transactions (user_id, amount) VALUES (?, ?)').bind(userId, amount)
  ]);

  return Response.json({ success: true });
}
```

### Wrangler Configuration for D1

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "production-db",
      "database_id": "your-database-id"
    }
  ]
}
```

**Related Skills**:
- `cloudflare-d1` - Complete D1 patterns including migrations, schema design, and query optimization
- `cloudflare-worker-base` - Database client patterns specific to reference file

**Database Client Note**: External database clients (PostgreSQL, MySQL) MUST be request-scoped in Workers. See `references/database-client-example.ts` for proper patterns.

---

## R2 Storage (Object Storage) - Complete Patterns

### Upload File

```typescript
// app/api/upload/route.ts
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const env = process.env as any;
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Upload to R2
  await env.BUCKET.put(file.name, file.stream(), {
    httpMetadata: {
      contentType: file.type
    }
  });

  return Response.json({ success: true, filename: file.name });
}
```

### Download File

```typescript
export async function GET(request: NextRequest) {
  const env = process.env as any;
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file');

  const object = await env.BUCKET.get(filename);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream'
    }
  });
}
```

### List Objects

```typescript
export async function GET(request: NextRequest) {
  const env = process.env as any;

  const list = await env.BUCKET.list({
    limit: 100,
    prefix: 'uploads/'
  });

  return Response.json({
    objects: list.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded
    }))
  });
}
```

### Delete Object

```typescript
export async function DELETE(request: NextRequest) {
  const env = process.env as any;
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file');

  await env.BUCKET.delete(filename);

  return Response.json({ success: true });
}
```

### Wrangler Configuration for R2

```jsonc
{
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "your-bucket"
    }
  ]
}
```

**Related Skills**:
- `cloudflare-r2` - Complete R2 patterns including CORS, multipart uploads, and presigned URLs

---

## KV Storage (Key-Value) - Complete Patterns

### Get Value

```typescript
// app/api/cache/route.ts
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const env = process.env as any;
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  const value = await env.KV.get(key);
  return Response.json({ key, value });
}
```

### Set Value with TTL

```typescript
export async function PUT(request: NextRequest) {
  const env = process.env as any;
  const { key, value, ttl } = await request.json();

  await env.KV.put(key, value, {
    expirationTtl: ttl // Time in seconds
  });

  return Response.json({ success: true });
}
```

### Delete Value

```typescript
export async function DELETE(request: NextRequest) {
  const env = process.env as any;
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  await env.KV.delete(key);

  return Response.json({ success: true });
}
```

### List Keys

```typescript
export async function GET(request: NextRequest) {
  const env = process.env as any;

  const list = await env.KV.list({
    prefix: 'session:',
    limit: 100
  });

  return Response.json({
    keys: list.keys.map(k => k.name)
  });
}
```

### Wrangler Configuration for KV

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "your-kv-namespace-id"
    }
  ]
}
```

**Related Skills**:
- `cloudflare-kv` - Complete KV patterns including bulk operations and cache strategies

---

## Workers AI (Model Inference) - Complete Patterns

### Text Generation

```typescript
// app/api/ai/route.ts
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const env = process.env as any;
  const { prompt } = await request.json();

  const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    prompt
  });

  return Response.json(response);
}
```

### Text Embeddings

```typescript
export async function POST(request: NextRequest) {
  const env = process.env as any;
  const { text } = await request.json();

  const embeddings = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text
  });

  return Response.json(embeddings);
}
```

### Image Classification

```typescript
export async function POST(request: NextRequest) {
  const env = process.env as any;
  const formData = await request.formData();
  const image = formData.get('image') as File;

  const result = await env.AI.run('@cf/microsoft/resnet-50', {
    image: await image.arrayBuffer()
  });

  return Response.json(result);
}
```

### Wrangler Configuration for Workers AI

```jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

**Related Skills**:
- `cloudflare-workers-ai` - Complete Workers AI patterns including all model types and streaming
- `cloudflare-vectorize` - Vector database for RAG applications with Workers AI

---

## Multi-Service Integration Example

Complete example combining D1, R2, and Workers AI:

```typescript
// app/api/analyze-upload/route.ts
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const env = process.env as any;
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // 1. Upload to R2
  const filename = `${Date.now()}-${file.name}`;
  await env.BUCKET.put(filename, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  // 2. Analyze with Workers AI (if image)
  let analysis = null;
  if (file.type.startsWith('image/')) {
    analysis = await env.AI.run('@cf/microsoft/resnet-50', {
      image: await file.arrayBuffer()
    });
  }

  // 3. Store metadata in D1
  const result = await env.DB.prepare(
    'INSERT INTO uploads (filename, size, type, analysis) VALUES (?, ?, ?, ?)'
  ).bind(filename, file.size, file.type, JSON.stringify(analysis)).run();

  return Response.json({
    id: result.meta.last_row_id,
    filename,
    analysis
  });
}
```

---

## TypeScript Types for Bindings

Generate types for all your bindings:

```bash
npm run cf-typegen
```

This creates `cloudflare-env.d.ts`:

```typescript
// cloudflare-env.d.ts (auto-generated)
interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;
  AI: Ai;
}

// Use in route handlers
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const env = process.env as CloudflareEnv;
  // Now env.DB, env.BUCKET, etc. are fully typed
}
```

---

## Best Practices

1. **Always Type Your Environment**: Use `cf-typegen` to generate types
2. **Request-Scoped Clients**: Never create global database clients
3. **Error Handling**: Always wrap binding access in try/catch
4. **Test in Preview**: Use `npm run preview` to test bindings before deployment
5. **Use D1 for Databases**: Prefer D1 over external databases for Workers compatibility

---

## Related References

- `references/database-client-example.ts` - External database client patterns (request-scoped)
- `references/wrangler.jsonc` - Complete wrangler configuration template
- `references/troubleshooting.md` - Error solutions for binding issues

---

**Last Updated**: 2025-12-04
**Services Covered**: D1, R2, KV, Workers AI
**Sources**: All patterns verified against official Cloudflare documentation
