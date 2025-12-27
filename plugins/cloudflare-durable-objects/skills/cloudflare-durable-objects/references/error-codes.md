# Durable Objects Error Codes Catalog

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27

Comprehensive catalog of Durable Objects errors with solutions.

---

## Deployment Errors

### E001: Class Not Found

**Error**: `Durable Object binding 'COUNTER' class 'Counter' not found`

**Cause**: Class not exported or wrong name

**Solution**:
```typescript
// Ensure export at end of file
export { Counter };
// Or
export default Counter;
```

### E002: Missing Migration

**Error**: `Durable Object class 'Counter' must be declared in migrations`

**Solution**:
```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["Counter"]
    }
  ]
}
```

### E003: Binding Name Mismatch

**Error**: `Cannot find binding 'COUNTER'`

**Cause**: Binding name in wrangler.jsonc doesn't match code

**Solution**:
```jsonc
// wrangler.jsonc
{"bindings": [{"name": "COUNTER", ...}]}

// src/index.ts
env.COUNTER.idFromName(...)  // Must match
```

---

## Runtime Errors

### E004: Constructor Timeout

**Error**: `Durable Object constructor exceeded CPU time limit`

**Cause**: Too much work in `blockConcurrencyWhile()`

**Solution**:
```typescript
// ❌ Bad
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);
  this.ctx.blockConcurrencyWhile(async () => {
    await this.loadHeavyData();  // Slow
  });
}

// ✅ Good
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);
  this.ctx.blockConcurrencyWhile(async () => {
    await this.initSchema();  // Fast
  });
}
```

### E005: SQL Syntax Error

**Error**: `SQL error: near "'text'": syntax error`

**Cause**: Using single quotes for identifiers

**Solution**:
```typescript
// ❌ Bad
await this.ctx.storage.sql.exec(
  "SELECT * FROM 'messages' WHERE 'user_id' = ?"
);

// ✅ Good
await this.ctx.storage.sql.exec(
  'SELECT * FROM messages WHERE user_id = ?'
);
// Or double quotes for identifiers
await this.ctx.storage.sql.exec(
  'SELECT * FROM "messages" WHERE "user_id" = ?'
);
```

### E006: Transaction Nesting

**Error**: `Cannot start a transaction within a transaction`

**Cause**: Nested `BEGIN`/`COMMIT` statements

**Solution**:
```typescript
// ❌ Bad
await this.ctx.storage.sql.exec('BEGIN');
await this.someMethod();  // Also calls BEGIN
await this.ctx.storage.sql.exec('COMMIT');

// ✅ Good
await this.ctx.storage.sql.exec(`
  BEGIN;
  INSERT INTO ...;
  UPDATE ...;
  COMMIT;
`);
```

---

## WebSocket Errors

### E007: Hibernation Blocked

**Error**: WebSocket connections not hibernating (high costs)

**Cause**: `setTimeout` or `setInterval` usage

**Solution**:
```typescript
// ❌ Bad
setTimeout(() => this.cleanup(), 60000);

// ✅ Good
async alarm() {
  await this.cleanup();
  await this.ctx.storage.setAlarm(Date.now() + 60000);
}
```

### E008: WebSocket Accept Failed

**Error**: `Cannot call acceptWebSocket() after response sent`

**Cause**: Trying to accept WebSocket after returning response

**Solution**:
```typescript
// ✅ Must accept before returning
async fetch(request: Request): Promise<Response> {
  if (request.headers.get('Upgrade') === 'websocket') {
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  return new Response('Not Found', { status: 404 });
}
```

---

## Storage Errors

### E009: Storage Limit Exceeded

**Error**: `Durable Object storage limit exceeded (1GB for SQL, 128MB for KV)`

**Solution**:
```typescript
// Implement TTL cleanup
async alarm() {
  await this.ctx.storage.sql.exec(
    'DELETE FROM messages WHERE expires_at <= ?',
    Date.now()
  );
}

// Or partition data across multiple DOs
const shardId = hashUserId(userId) % 10;
const id = env.COUNTER.idFromName(`shard-${shardId}`);
```

### E010: deleteAll() Partial Completion (KV only)

**Error**: `deleteAll()` doesn't delete all keys in one operation

**Cause**: KV deleteAll() is not atomic

**Solution**:
```typescript
// Use SQL backend for atomic operations
{
  "migrations": [
    {"tag": "v1", "new_sqlite_classes": ["MyDO"]}
  ]
}

// Or manually delete with SQL
await this.ctx.storage.sql.exec('DELETE FROM table_name');
```

---

## Alarm Errors

### E011: Alarm Not Executing

**Error**: Alarm scheduled but not running

**Cause**: Missing `alarm()` method or incorrect scheduling

**Solution**:
```typescript
// Must implement alarm() method
async alarm(): Promise<void> {
  await this.doWork();
  await this.ctx.storage.setAlarm(Date.now() + 60000);
}

// Schedule correctly
await this.ctx.storage.setAlarm(Date.now() + 60000);  // ✅
// NOT: await this.ctx.storage.setAlarm(60000);  // ❌ Wrong
```

### E012: Alarm Retry Failures

**Error**: Alarm retries exhausted

**Cause**: alarm() method throwing errors repeatedly

**Solution**:
```typescript
async alarm(): Promise<void> {
  try {
    await this.riskyOperation();
  } catch (error) {
    console.error('Alarm error:', error);
    // Don't throw - prevents retry exhaustion
  }

  // Always reschedule
  await this.ctx.storage.setAlarm(Date.now() + 60000);
}
```

---

## Migration Errors

### E013: Migration Tag Conflict

**Error**: `Migration tag 'v1' already exists`

**Cause**: Duplicate migration tags

**Solution**:
```jsonc
{
  "migrations": [
    {"tag": "v1", ...},
    {"tag": "v2", ...},  // ✅ Unique tags
    {"tag": "v3", ...}
  ]
}
```

### E014: Cannot Modify Past Migration

**Error**: `Cannot modify deployed migration`

**Cause**: Trying to change already-deployed migration

**Solution**:
```jsonc
// ❌ Don't modify v1 after deployment
// ✅ Add new migration
{
  "migrations": [
    {"tag": "v1", "new_sqlite_classes": ["Counter"]},
    {"tag": "v2", "new_sqlite_classes": ["ChatRoom"]}  // New
  ]
}
```

---

## RPC Errors

### E015: ctx.id.name Returns Empty String

**Error**: `this.ctx.id.name` returns "" inside DO methods

**Cause**: RPC calls don't preserve ID name

**Solution**: Use RpcTarget pattern
```typescript
export class MyDORpc extends RpcTarget {
  constructor(private mainDo: MyDO, private doName: string) {
    super();
  }

  async method(): Promise<void> {
    return this.mainDo.method(this.doName);  // Pass name
  }
}

export class MyDO extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const doName = this.ctx.id.toString();
    return Response.json(new MyDORpc(this, doName));
  }
}
```

---

## Performance Errors

### E016: Slow Queries

**Error**: Queries taking >100ms

**Cause**: Missing indexes

**Solution**:
```typescript
// Add indexes
await this.ctx.storage.sql.exec(`
  CREATE INDEX IF NOT EXISTS idx_user_messages
  ON messages(user_id, created_at DESC)
`);
```

### E017: Memory Exhaustion

**Error**: `Out of memory`

**Cause**: Unbounded cache growth

**Solution**:
```typescript
// Implement LRU cache with max size
private cache = new Map();
private readonly MAX_CACHE = 1000;

set(key: string, value: any) {
  if (this.cache.size >= this.MAX_CACHE) {
    const firstKey = this.cache.keys().next().value;
    this.cache.delete(firstKey);
  }
  this.cache.set(key, value);
}
```

---

## Testing Errors

### E018: Vitest Pool Not Found

**Error**: `Cannot find module '@cloudflare/vitest-pool-workers'`

**Solution**:
```bash
npm install -D @cloudflare/vitest-pool-workers
```

### E019: DO State Not Isolated

**Error**: Tests interfering with each other

**Cause**: Not using unique DO IDs per test

**Solution**:
```typescript
test('counter increments', async () => {
  const id = env.COUNTER.idFromName(`test-${crypto.randomUUID()}`);
  const stub = env.COUNTER.get(id);
  // Test with isolated DO instance
});
```

---

## Quick Diagnostic

```bash
# Check logs
wrangler tail

# Test locally
wrangler dev

# Validate config
./scripts/validate-do-config.sh

# Run tests
npm test
```

---

**Last Updated**: 2025-12-27
