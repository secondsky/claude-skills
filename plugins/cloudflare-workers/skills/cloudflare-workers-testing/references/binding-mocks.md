# Binding Mocks for Cloudflare Workers Testing

Complete guide for testing all Cloudflare Workers bindings with real mocked implementations.

## Overview

The `cloudflare:test` module provides automatic mocking for all Workers bindings. Each test gets isolated storage that's automatically reset between tests.

**Supported bindings**:
- D1 Database
- KV Namespace
- R2 Bucket
- Durable Objects
- Queues
- Workers AI
- Vectorize
- Service Bindings (worker-to-worker)
- Analytics Engine
- Rate Limiting

## D1 Database Testing

### Basic Queries

```typescript
import { env } from 'cloudflare:test';

describe('D1 Database', () => {
  it('inserts and queries data', async () => {
    // Insert
    await env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      .bind('Alice', 'alice@example.com')
      .run();

    // Query
    const result = await env.DB.prepare('SELECT * FROM users WHERE name = ?')
      .bind('Alice')
      .first();

    expect(result?.email).toBe('alice@example.com');
  });
});
```

### Schema Setup

**Option 1: beforeEach**
```typescript
describe('User API', () => {
  beforeEach(async () => {
    // Create schema for each test
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  it('creates user', async () => {
    await env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      .bind('Bob', 'bob@example.com')
      .run();

    const users = await env.DB.prepare('SELECT * FROM users').all();
    expect(users.results).toHaveLength(1);
  });
});
```

**Option 2: Load from file**
```typescript
import { readFile } from 'fs/promises';

beforeEach(async () => {
  const schema = await readFile('./migrations/schema.sql', 'utf-8');
  await env.DB.exec(schema);
});
```

### Batch Operations

```typescript
it('handles batch inserts', async () => {
  const batch = [
    env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)').bind('User1', 'u1@example.com'),
    env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)').bind('User2', 'u2@example.com'),
    env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)').bind('User3', 'u3@example.com')
  ];

  await env.DB.batch(batch);

  const count = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
  expect(count?.count).toBe(3);
});
```

### Transactions

```typescript
it('rolls back on error', async () => {
  await env.DB.exec(`
    CREATE TABLE accounts (
      id INTEGER PRIMARY KEY,
      balance REAL NOT NULL CHECK(balance >= 0)
    )
  `);

  await env.DB.prepare('INSERT INTO accounts (id, balance) VALUES (?, ?)').bind(1, 100).run();

  // This should fail (negative balance violates CHECK constraint)
  const batch = [
    env.DB.prepare('UPDATE accounts SET balance = balance - 150 WHERE id = ?').bind(1),
  ];

  await expect(env.DB.batch(batch)).rejects.toThrow();

  // Balance should still be 100 (transaction rolled back)
  const account = await env.DB.prepare('SELECT * FROM accounts WHERE id = ?').bind(1).first();
  expect(account?.balance).toBe(100);
});
```

## KV Namespace Testing

### Basic Operations

```typescript
describe('KV Namespace', () => {
  it('puts and gets values', async () => {
    await env.CACHE.put('key1', 'value1');
    const value = await env.CACHE.get('key1');
    expect(value).toBe('value1');
  });

  it('returns null for missing keys', async () => {
    const value = await env.CACHE.get('nonexistent');
    expect(value).toBeNull();
  });
});
```

### JSON Values

```typescript
it('stores JSON', async () => {
  const data = { name: 'Alice', age: 30 };
  await env.CACHE.put('user:1', JSON.stringify(data));

  const stored = await env.CACHE.get('user:1', 'json');
  expect(stored).toEqual(data);
});
```

### Metadata

```typescript
it('stores metadata', async () => {
  await env.CACHE.put('key1', 'value1', {
    metadata: { tags: ['important', 'user-data'] }
  });

  const { value, metadata } = await env.CACHE.getWithMetadata('key1');
  expect(value).toBe('value1');
  expect(metadata?.tags).toContain('important');
});
```

### Expiration

```typescript
it('respects TTL', async () => {
  // Note: Expiration time cannot be fast-forwarded in tests
  // This test just verifies the API works, not actual expiration
  await env.CACHE.put('expiring', 'value', { expirationTtl: 60 }); // 60 seconds

  const value = await env.CACHE.get('expiring');
  expect(value).toBe('value'); // Still exists (time not advanced)
});
```

### List Operations

```typescript
it('lists keys', async () => {
  await env.CACHE.put('user:1', 'Alice');
  await env.CACHE.put('user:2', 'Bob');
  await env.CACHE.put('post:1', 'Hello');

  const users = await env.CACHE.list({ prefix: 'user:' });
  expect(users.keys).toHaveLength(2);
  expect(users.keys.map(k => k.name)).toContain('user:1');
});
```

## R2 Bucket Testing

### File Upload/Download

```typescript
describe('R2 Bucket', () => {
  it('uploads and downloads files', async () => {
    // Upload
    await env.BUCKET.put('test.txt', 'Hello World', {
      httpMetadata: {
        contentType: 'text/plain'
      }
    });

    // Download
    const object = await env.BUCKET.get('test.txt');
    expect(await object?.text()).toBe('Hello World');
    expect(object?.httpMetadata?.contentType).toBe('text/plain');
  });
});
```

### Multipart Upload

```typescript
it('handles large files with multipart', async () => {
  const upload = await env.BUCKET.createMultipartUpload('large-file.bin');

  // Upload parts (minimum 5MB per part, except last)
  const part1Data = new Uint8Array(5 * 1024 * 1024).fill(1); // 5MB
  const part1 = await upload.uploadPart(1, part1Data);

  const part2Data = new Uint8Array(2 * 1024 * 1024).fill(2); // 2MB (last part)
  const part2 = await upload.uploadPart(2, part2Data);

  // Complete upload
  await upload.complete([part1, part2]);

  // Verify
  const object = await env.BUCKET.get('large-file.bin');
  expect(object?.size).toBe(7 * 1024 * 1024);
});
```

### List Objects

```typescript
it('lists objects', async () => {
  await env.BUCKET.put('file1.txt', 'content1');
  await env.BUCKET.put('file2.txt', 'content2');
  await env.BUCKET.put('folder/file3.txt', 'content3');

  const listed = await env.BUCKET.list();
  expect(listed.objects).toHaveLength(3);

  // List with prefix
  const folder = await env.BUCKET.list({ prefix: 'folder/' });
  expect(folder.objects).toHaveLength(1);
});
```

### Custom Metadata

```typescript
it('stores custom metadata', async () => {
  await env.BUCKET.put('file.txt', 'content', {
    customMetadata: {
      'user-id': '123',
      'upload-source': 'web'
    }
  });

  const object = await env.BUCKET.get('file.txt');
  expect(object?.customMetadata?.['user-id']).toBe('123');
});
```

## Durable Objects Testing

### Basic DO Testing

```typescript
import { env } from 'cloudflare:test';

describe('Counter Durable Object', () => {
  it('increments counter', async () => {
    const id = env.COUNTER.idFromName('test-counter');
    const stub = env.COUNTER.get(id);

    // Call DO fetch handler
    const response = await stub.fetch('http://fake/increment');
    const data = await response.json();
    expect(data.count).toBe(1);

    // Call again - state persists
    const response2 = await stub.fetch('http://fake/increment');
    const data2 = await response2.json();
    expect(data2.count).toBe(2);
  });
});
```

### Testing DO State Persistence

```typescript
it('persists state across requests', async () => {
  const id = env.COUNTER.idFromName('persistent-counter');
  const stub = env.COUNTER.get(id);

  // Set value
  await stub.fetch('http://fake/set?value=100');

  // Get value (state persists)
  const response = await stub.fetch('http://fake/get');
  const data = await response.json();
  expect(data.count).toBe(100);
});
```

### Multiple DO Instances

```typescript
it('isolates state between instances', async () => {
  const id1 = env.COUNTER.idFromName('counter-1');
  const stub1 = env.COUNTER.get(id1);

  const id2 = env.COUNTER.idFromName('counter-2');
  const stub2 = env.COUNTER.get(id2);

  // Increment counter-1
  await stub1.fetch('http://fake/increment');

  // counter-2 should still be 0
  const response2 = await stub2.fetch('http://fake/get');
  const data2 = await response2.json();
  expect(data2.count).toBe(0);
});
```

### WebSocket Testing

```typescript
it('handles WebSocket connections', async () => {
  const id = env.CHAT_ROOM.idFromName('room-1');
  const stub = env.CHAT_ROOM.get(id);

  // Upgrade to WebSocket
  const response = await stub.fetch('http://fake/ws', {
    headers: { Upgrade: 'websocket' }
  });

  expect(response.status).toBe(101);
  expect(response.headers.get('Upgrade')).toBe('websocket');
});
```

## Queue Testing

### Sending Messages

```typescript
it('sends messages to queue', async () => {
  await env.MY_QUEUE.send({ action: 'process', id: '123' });

  // Note: Queue consumer runs separately
  // Use queue() handler to test processing
});
```

### Testing Queue Consumer

```typescript
import worker from '../src/index';

it('processes queue messages', async () => {
  const messages = [
    {
      id: 'msg-1',
      timestamp: new Date(),
      body: { action: 'email', to: 'user@example.com' }
    }
  ];

  await worker.queue(
    {
      queue: 'my-queue',
      messages,
      retryAll: () => {},
      ackAll: () => {}
    },
    env
  );

  // Verify processing (check DB, logs, etc.)
  const log = await env.DB.prepare('SELECT * FROM queue_log WHERE message_id = ?')
    .bind('msg-1')
    .first();
  expect(log?.status).toBe('processed');
});
```

### Batch Processing

```typescript
it('handles batch of messages', async () => {
  const messages = Array(10).fill(null).map((_, i) => ({
    id: `msg-${i}`,
    timestamp: new Date(),
    body: { value: i }
  }));

  await worker.queue(
    {
      queue: 'my-queue',
      messages,
      retryAll: () => {},
      ackAll: () => {}
    },
    env
  );

  // Verify all processed
  const count = await env.DB.prepare('SELECT COUNT(*) as count FROM processed').first();
  expect(count?.count).toBe(10);
});
```

## Workers AI Testing

### Text Generation

```typescript
it('generates text with AI', async () => {
  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    prompt: 'Tell me a joke'
  });

  expect(response).toHaveProperty('response');
  expect(typeof response.response).toBe('string');
});
```

### Image Classification

```typescript
it('classifies images', async () => {
  const imageBuffer = await fetch('https://example.com/cat.jpg').then(r => r.arrayBuffer());

  const response = await env.AI.run('@cf/microsoft/resnet-50', {
    image: [...new Uint8Array(imageBuffer)]
  });

  expect(response).toHaveProperty('label');
});
```

## Service Bindings (Worker-to-Worker)

### Testing Service Calls

```typescript
it('calls another worker', async () => {
  // Assuming API_SERVICE binding is configured in wrangler.jsonc
  const response = await env.API_SERVICE.fetch('http://fake/users/1');
  const user = await response.json();

  expect(user.id).toBe(1);
});
```

## Vectorize Testing

### Insert and Query Vectors

```typescript
it('stores and queries vectors', async () => {
  // Insert vectors
  await env.VECTORIZE.insert([
    { id: 'vec-1', values: [0.1, 0.2, 0.3], metadata: { text: 'Hello' } },
    { id: 'vec-2', values: [0.4, 0.5, 0.6], metadata: { text: 'World' } }
  ]);

  // Query
  const results = await env.VECTORIZE.query([0.15, 0.25, 0.35], { topK: 1 });
  expect(results.matches[0].id).toBe('vec-1'); // Closest match
});
```

## Best Practices

1. **Use isolated storage**: Each test gets fresh bindings automatically
2. **Seed schema in beforeEach**: Ensure consistent test state
3. **Test realistic scenarios**: Use actual production data patterns
4. **Don't mock time**: Cannot fast-forward TTL/expiration in tests
5. **Test error cases**: Verify constraint violations, validation errors

## Resources

- D1 Docs: https://developers.cloudflare.com/d1/
- KV Docs: https://developers.cloudflare.com/kv/
- R2 Docs: https://developers.cloudflare.com/r2/
- Durable Objects: https://developers.cloudflare.com/durable-objects/
- Queues: https://developers.cloudflare.com/queues/
