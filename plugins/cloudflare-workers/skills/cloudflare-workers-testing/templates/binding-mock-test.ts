/**
 * Binding Mock Test Template for Cloudflare Workers
 *
 * This template demonstrates testing with all Workers bindings:
 * - D1 Database
 * - KV Namespace
 * - R2 Bucket
 * - Durable Objects
 * - Queues
 * - Workers AI
 *
 * Each binding is automatically mocked with isolated storage per test.
 *
 * Usage:
 * 1. Ensure bindings are configured in wrangler.jsonc
 * 2. Copy relevant tests to your test file
 * 3. Update binding names to match your wrangler config
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';

describe('D1 Database Tests', () => {
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

  it('inserts and queries data', async () => {
    // Insert
    const result = await env.DB.prepare(
      'INSERT INTO users (name, email) VALUES (?, ?)'
    )
      .bind('Alice', 'alice@example.com')
      .run();

    expect(result.success).toBe(true);

    // Query
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE name = ?'
    )
      .bind('Alice')
      .first();

    expect(user?.email).toBe('alice@example.com');
  });

  it('handles batch operations', async () => {
    const batch = [
      env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)').bind('User1', 'u1@example.com'),
      env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)').bind('User2', 'u2@example.com'),
      env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)').bind('User3', 'u3@example.com')
    ];

    await env.DB.batch(batch);

    const count = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    expect(count?.count).toBe(3);
  });

  it('enforces unique constraints', async () => {
    await env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      .bind('Bob', 'bob@example.com')
      .run();

    // Duplicate email should fail
    await expect(
      env.DB.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
        .bind('Robert', 'bob@example.com')
        .run()
    ).rejects.toThrow();
  });
});

describe('KV Namespace Tests', () => {
  it('puts and gets string values', async () => {
    await env.CACHE.put('key1', 'value1');
    const value = await env.CACHE.get('key1');
    expect(value).toBe('value1');
  });

  it('handles JSON values', async () => {
    const data = { name: 'Alice', age: 30 };
    await env.CACHE.put('user:1', JSON.stringify(data));

    const stored = await env.CACHE.get('user:1', 'json');
    expect(stored).toEqual(data);
  });

  it('stores metadata', async () => {
    await env.CACHE.put('key1', 'value1', {
      metadata: { tags: ['important', 'user-data'], version: 2 }
    });

    const { value, metadata } = await env.CACHE.getWithMetadata('key1');
    expect(value).toBe('value1');
    expect(metadata?.tags).toContain('important');
    expect(metadata?.version).toBe(2);
  });

  it('lists keys with prefix', async () => {
    await env.CACHE.put('user:1', 'Alice');
    await env.CACHE.put('user:2', 'Bob');
    await env.CACHE.put('post:1', 'Hello');

    const users = await env.CACHE.list({ prefix: 'user:' });
    expect(users.keys).toHaveLength(2);
    expect(users.keys.map(k => k.name)).toContain('user:1');
    expect(users.keys.map(k => k.name)).toContain('user:2');
  });

  it('deletes keys', async () => {
    await env.CACHE.put('temp', 'value');
    await env.CACHE.delete('temp');

    const value = await env.CACHE.get('temp');
    expect(value).toBeNull();
  });
});

describe('R2 Bucket Tests', () => {
  it('uploads and downloads files', async () => {
    await env.BUCKET.put('test.txt', 'Hello World', {
      httpMetadata: {
        contentType: 'text/plain'
      }
    });

    const object = await env.BUCKET.get('test.txt');
    expect(await object?.text()).toBe('Hello World');
    expect(object?.httpMetadata?.contentType).toBe('text/plain');
  });

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

  it('deletes objects', async () => {
    await env.BUCKET.put('temp.txt', 'content');
    await env.BUCKET.delete('temp.txt');

    const object = await env.BUCKET.get('temp.txt');
    expect(object).toBeNull();
  });
});

describe('Durable Objects Tests', () => {
  it('creates and interacts with DO instance', async () => {
    const id = env.COUNTER.idFromName('test-counter');
    const stub = env.COUNTER.get(id);

    // Call DO fetch handler
    const response = await stub.fetch('http://fake/increment');
    const data = await response.json();

    expect(data.count).toBe(1);
  });

  it('persists state across requests', async () => {
    const id = env.COUNTER.idFromName('persistent-counter');
    const stub = env.COUNTER.get(id);

    // Increment twice
    await stub.fetch('http://fake/increment');
    await stub.fetch('http://fake/increment');

    // Verify state persisted
    const response = await stub.fetch('http://fake/get');
    const data = await response.json();
    expect(data.count).toBe(2);
  });

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
});

describe('Queue Tests', () => {
  it('sends messages to queue', async () => {
    // Send single message
    await env.MY_QUEUE.send({ action: 'process', id: '123' });

    // Send batch
    await env.MY_QUEUE.sendBatch([
      { body: { action: 'email', to: 'user1@example.com' } },
      { body: { action: 'email', to: 'user2@example.com' } }
    ]);

    // Note: Queue messages are processed by worker.queue() handler
    // Test the handler separately (see integration-testing.md)
  });
});

describe('Workers AI Tests', () => {
  it('generates text', async () => {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: 'Say hello in one word'
    });

    expect(response).toHaveProperty('response');
    expect(typeof response.response).toBe('string');
  });

  it('classifies images', async () => {
    // Mock image data (in real test, use actual image buffer)
    const mockImageBuffer = new Uint8Array(100).fill(0);

    const response = await env.AI.run('@cf/microsoft/resnet-50', {
      image: [...mockImageBuffer]
    });

    expect(response).toHaveProperty('label');
  });
});

/**
 * Testing Multiple Bindings Together
 */
describe('Multi-Binding Integration', () => {
  beforeEach(async () => {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        r2_key TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  it('coordinates D1, R2, and KV', async () => {
    // Upload file to R2
    const fileContent = 'File content';
    const filename = 'test.txt';
    const r2Key = `uploads/${Date.now()}-${filename}`;

    await env.BUCKET.put(r2Key, fileContent);

    // Store metadata in D1
    const result = await env.DB.prepare(
      'INSERT INTO uploads (filename, r2_key) VALUES (?, ?)'
    )
      .bind(filename, r2Key)
      .run();

    const uploadId = result.meta.last_row_id;

    // Cache upload URL in KV
    const cacheKey = `upload:${uploadId}`;
    await env.CACHE.put(cacheKey, r2Key, { expirationTtl: 3600 });

    // Verify all bindings
    const upload = await env.DB.prepare('SELECT * FROM uploads WHERE id = ?')
      .bind(uploadId)
      .first();
    expect(upload?.r2_key).toBe(r2Key);

    const cachedKey = await env.CACHE.get(cacheKey);
    expect(cachedKey).toBe(r2Key);

    const object = await env.BUCKET.get(r2Key);
    expect(await object?.text()).toBe(fileContent);
  });
});
