# Integration Testing for Cloudflare Workers

Guide for writing comprehensive integration tests that verify full request/response flows.

## Full Request/Response Testing

### GET Request with Query Params

```typescript
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index';

it('handles query parameters', async () => {
  const request = new Request('http://example.com/search?q=test&limit=10');
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.query).toBe('test');
  expect(data.limit).toBe(10);
});
```

### POST Request with JSON Body

```typescript
it('creates resource via POST', async () => {
  const request = new Request('http://example.com/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alice',
      email: 'alice@example.com'
    })
  });

  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(201);
  const user = await response.json();
  expect(user.id).toBeDefined();
  expect(user.name).toBe('Alice');

  // Verify DB insert
  const dbUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(user.id)
    .first();
  expect(dbUser?.email).toBe('alice@example.com');
});
```

### File Upload with FormData

```typescript
it('handles file upload', async () => {
  const formData = new FormData();
  formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
  formData.append('description', 'Test file');

  const request = new Request('http://example.com/upload', {
    method: 'POST',
    body: formData
  });

  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(200);

  // Verify R2 upload
  const object = await env.BUCKET.get('test.txt');
  expect(await object?.text()).toBe('test content');
});
```

## Multi-Step Workflows

### Create → Update → Delete Flow

```typescript
describe('User CRUD', () => {
  let userId: number;

  it('creates user', async () => {
    const request = new Request('http://example.com/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob' })
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(201);
    const user = await response.json();
    userId = user.id;
  });

  it('updates user', async () => {
    const request = new Request(`http://example.com/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Robert' })
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const user = await response.json();
    expect(user.name).toBe('Robert');
  });

  it('deletes user', async () => {
    const request = new Request(`http://example.com/api/users/${userId}`, {
      method: 'DELETE'
    });

    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(204);

    // Verify deletion
    const dbUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first();
    expect(dbUser).toBeNull();
  });
});
```

## Authentication Testing

### JWT Authentication

```typescript
import { SignJWT } from 'jose';

async function createTestToken(userId: number, secret: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));
}

it('requires authentication', async () => {
  const request = new Request('http://example.com/api/protected');

  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(401);
});

it('allows authenticated requests', async () => {
  const token = await createTestToken(1, env.JWT_SECRET);

  const request = new Request('http://example.com/api/protected', {
    headers: { Authorization: `Bearer ${token}` }
  });

  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(200);
});
```

## Error Handling Testing

### 404 Not Found

```typescript
it('returns 404 for unknown routes', async () => {
  const request = new Request('http://example.com/nonexistent');
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(404);
  const error = await response.json();
  expect(error.message).toContain('Not found');
});
```

### 400 Bad Request (Invalid Input)

```typescript
it('validates input', async () => {
  const request = new Request('http://example.com/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '' }) // Invalid: empty name
  });

  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(400);
  const error = await response.json();
  expect(error.errors).toContain('Name is required');
});
```

### 500 Internal Server Error

```typescript
it('handles database errors gracefully', async () => {
  // Trigger error (e.g., constraint violation)
  const request = new Request('http://example.com/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'duplicate@example.com' }) // Already exists
  });

  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(500);
  const error = await response.json();
  expect(error.message).toBeDefined();
});
```

## Streaming Response Testing

### Text Streaming

```typescript
it('streams response', async () => {
  const request = new Request('http://example.com/stream');
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);

  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toContain('text/event-stream');

  // Read stream
  const reader = response.body?.getReader();
  const { value, done } = await reader!.read();
  expect(done).toBe(false);
  expect(value).toBeDefined();
});
```

## Caching Integration Tests

### Cache Hit/Miss

```typescript
describe('Caching', () => {
  it('caches responses', async () => {
    const url = 'http://example.com/api/cached-data';

    // First request (cache miss)
    const req1 = new Request(url);
    const ctx1 = createExecutionContext();
    const res1 = await worker.fetch(req1, env, ctx1);
    await waitOnExecutionContext(ctx1);

    expect(res1.headers.get('X-Cache-Status')).toBe('MISS');

    // Second request (cache hit)
    const req2 = new Request(url);
    const ctx2 = createExecutionContext();
    const res2 = await worker.fetch(req2, env, ctx2);
    await waitOnExecutionContext(ctx2);

    expect(res2.headers.get('X-Cache-Status')).toBe('HIT');
  });
});
```

## Concurrent Request Testing

```typescript
it('handles concurrent requests', async () => {
  const requests = Array(100).fill(null).map((_, i) =>
    new Request(`http://example.com/api/process?id=${i}`)
  );

  const promises = requests.map(req => {
    const ctx = createExecutionContext();
    return worker.fetch(req, env, ctx).then(async res => {
      await waitOnExecutionContext(ctx);
      return res;
    });
  });

  const responses = await Promise.all(promises);

  // All should succeed
  expect(responses.every(r => r.status === 200)).toBe(true);
});
```

## Best Practices

1. **Test full request/response cycle**: Verify headers, status codes, body
2. **Test authentication flows**: Ensure security is enforced
3. **Test error cases**: 400, 401, 403, 404, 500 responses
4. **Verify side effects**: Check database, KV, R2 after operations
5. **Use realistic data**: Production-like request/response patterns
6. **Test concurrent operations**: Ensure thread safety
7. **Clean up after tests**: Each test gets isolated storage automatically

## Resources

- Workers Runtime API: https://developers.cloudflare.com/workers/runtime-apis/
- Request/Response: https://developer.mozilla.org/en-US/docs/Web/API/Request
- FormData: https://developer.mozilla.org/en-US/docs/Web/API/FormData
