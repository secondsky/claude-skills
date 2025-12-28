# Performance Optimization for Durable Objects

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27
**Official Docs**: https://developers.cloudflare.com/durable-objects/

## Overview

Comprehensive guide to optimizing Durable Objects for performance, scalability, and cost efficiency.

**Key Topics**:
- Constructor optimization
- SQL query optimization
- WebSocket hibernation optimization
- Batch operation patterns
- Storage size management
- Cost optimization strategies

---

## Constructor Optimization

### Minimize blockConcurrencyWhile Work

```typescript
// ❌ BAD: Loading everything in constructor
export class HeavyDO extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      // Blocks all requests until complete!
      const allMessages = await ctx.storage.sql.exec(`
        SELECT * FROM messages
      `).toArray();

      const allUsers = await ctx.storage.sql.exec(`
        SELECT * FROM users
      `).toArray();

      // Heavy processing
      this.processData(allMessages, allUsers);
    });
  }
}

// ✅ GOOD: Load only critical data
export class OptimizedDO extends DurableObject {
  private initialized: boolean = false;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      // Load only metadata
      const config = await ctx.storage.get<any>("config");
      if (config) {
        this.applyConfig(config);
      }
      this.initialized = true;
    });
  }

  async getMessages(): Promise<any[]> {
    // Lazy load when actually needed
    return this.ctx.storage.sql.exec(`
      SELECT * FROM messages LIMIT 100
    `).toArray();
  }
}
```

### Lazy Initialization Pattern

```typescript
export class LazyDO extends DurableObject {
  private cache?: Map<string, any>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // No blockConcurrencyWhile - instant startup
  }

  private async ensureCache(): Promise<void> {
    if (this.cache) return;

    // Load cache on first access
    this.cache = new Map();
    const items = await this.ctx.storage.sql.exec(`
      SELECT key, value FROM cache
    `).toArray();

    for (const item of items) {
      this.cache.set((item as any).key, (item as any).value);
    }
  }

  async get(key: string): Promise<any> {
    await this.ensureCache();
    return this.cache?.get(key);
  }
}
```

---

## SQL Query Optimization

### Use Prepared Statements Pattern

```typescript
// ✅ GOOD: Reusable query pattern
export class MessagesDO extends DurableObject {
  async getRecentMessages(userId: string, limit: number): Promise<any[]> {
    // SQLite will cache the query plan
    return this.ctx.storage.sql.exec(`
      SELECT id, text, timestamp
      FROM messages
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `, userId, limit).toArray();
  }
}
```

### Index Usage

```typescript
// Check if index is being used
async analyzeQuery(userId: string): Promise<void> {
  const plan = this.ctx.storage.sql.exec(`
    EXPLAIN QUERY PLAN
    SELECT * FROM messages WHERE user_id = ? ORDER BY timestamp DESC
  `, userId).toArray();

  console.log("Query plan:", plan);
  // Look for "USING INDEX" in output
}

// Create covering index
this.ctx.storage.sql.exec(`
  CREATE INDEX IF NOT EXISTS idx_messages_user_time
  ON messages(user_id, timestamp DESC, id, text)
`);
```

### Batch Queries

```typescript
// ❌ BAD: Multiple individual queries
async getMultipleUsers(userIds: string[]): Promise<any[]> {
  const users = [];
  for (const id of userIds) {
    const user = this.ctx.storage.sql.exec(`
      SELECT * FROM users WHERE id = ?
    `, id).one();
    users.push(user);
  }
  return users;
}

// ✅ GOOD: Single batch query
async getMultipleUsers(userIds: string[]): Promise<any[]> {
  const placeholders = userIds.map(() => '?').join(',');
  return this.ctx.storage.sql.exec(`
    SELECT * FROM users WHERE id IN (${placeholders})
  `, ...userIds).toArray();
}
```

### Query Result Caching

```typescript
export class CachedDO extends DurableObject {
  private queryCache: Map<string, { result: any; expires: number }> = new Map();

  async getCachedQuery<T>(
    cacheKey: string,
    ttlMs: number,
    query: () => T
  ): Promise<T> {
    const cached = this.queryCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }

    const result = query();
    this.queryCache.set(cacheKey, {
      result,
      expires: Date.now() + ttlMs,
    });

    return result;
  }

  async getPopularMessages(): Promise<any[]> {
    return this.getCachedQuery(
      "popular_messages",
      60_000, // 1 minute cache
      () => this.ctx.storage.sql.exec(`
        SELECT * FROM messages
        ORDER BY likes DESC
        LIMIT 10
      `).toArray()
    );
  }
}
```

---

## WebSocket Hibernation Optimization

### Minimize Constructor Work for Fast Wake

```typescript
export class ChatRoom extends DurableObject {
  // ✅ Store state in-memory for fast access after wake
  private userCount: number = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      // Load only critical metadata
      this.userCount = await ctx.storage.get<number>("userCount") ?? 0;
    });
  }

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
    // Fast wake from hibernation - no DB queries in critical path
    const data = JSON.parse(message);

    // Broadcast immediately
    const sockets = await this.ctx.getWebSockets();
    for (const socket of sockets) {
      socket.send(message);
    }

    // Persist asynchronously
    this.ctx.waitUntil(
      this.persistMessage(data)
    );
  }

  private async persistMessage(data: any): Promise<void> {
    await this.ctx.storage.sql.exec(`
      INSERT INTO messages (user_id, text, timestamp)
      VALUES (?, ?, ?)
    `, data.userId, data.text, Date.now());
  }
}
```

### Efficient Attachment Serialization

```typescript
// ❌ BAD: Large attachment data
this.ctx.acceptWebSocket(ws, {
  userId: user.id,
  profile: user.fullProfile, // 10KB of data!
  history: user.messageHistory, // Another 50KB!
});

// ✅ GOOD: Minimal attachment data
this.ctx.acceptWebSocket(ws, {
  userId: user.id,
  joinedAt: Date.now(),
});

// Load full data only when needed
async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
  const attachment = await ws.deserializeAttachment<{ userId: string }>();

  // Load profile on-demand
  const profile = await this.getUserProfile(attachment.userId);
}
```

### Batch WebSocket Sends

```typescript
// ❌ BAD: Send messages one by one
async broadcastMessages(messages: string[]): Promise<void> {
  const sockets = await this.ctx.getWebSockets();
  for (const message of messages) {
    for (const socket of sockets) {
      socket.send(message);
    }
  }
}

// ✅ GOOD: Batch into single message
async broadcastMessages(messages: string[]): Promise<void> {
  const batch = JSON.stringify({ type: "batch", messages });
  const sockets = await this.ctx.getWebSockets();

  for (const socket of sockets) {
    socket.send(batch);
  }
}
```

---

## Batch Operation Patterns

### Batch Inserts

```typescript
// ❌ BAD: Individual inserts
async addMessages(messages: Array<{ userId: string; text: string }>): Promise<void> {
  for (const msg of messages) {
    await this.ctx.storage.sql.exec(`
      INSERT INTO messages (user_id, text, timestamp)
      VALUES (?, ?, ?)
    `, msg.userId, msg.text, Date.now());
  }
}

// ✅ GOOD: Single batch insert
async addMessages(messages: Array<{ userId: string; text: string }>): Promise<void> {
  const values = messages.map(() => "(?, ?, ?)").join(",");
  const params = messages.flatMap(m => [m.userId, m.text, Date.now()]);

  this.ctx.storage.sql.exec(`
    INSERT INTO messages (user_id, text, timestamp)
    VALUES ${values}
  `, ...params);
}
```

### Batch Updates with Transactions

```typescript
async batchUpdate(updates: Array<{ id: string; value: number }>): Promise<void> {
  this.ctx.storage.sql.exec("BEGIN");

  try {
    for (const update of updates) {
      this.ctx.storage.sql.exec(`
        UPDATE counters SET value = ? WHERE id = ?
      `, update.value, update.id);
    }

    this.ctx.storage.sql.exec("COMMIT");
  } catch (error) {
    this.ctx.storage.sql.exec("ROLLBACK");
    throw error;
  }
}
```

---

## Storage Size Management

### Archive Old Data

```typescript
export class ArchivingDO extends DurableObject {
  async alarm(): Promise<void> {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days

    // Count before archiving
    const count = this.ctx.storage.sql.exec(`
      SELECT COUNT(*) as count FROM messages WHERE timestamp < ?
    `, cutoff).one<{ count: number }>();

    if (!count || count.count === 0) {
      await this.ctx.storage.setAlarm(Date.now() + 3600_000);
      return;
    }

    // Archive to external storage (R2/KV)
    const oldMessages = this.ctx.storage.sql.exec(`
      SELECT * FROM messages WHERE timestamp < ? LIMIT 1000
    `, cutoff).toArray();

    await this.archiveToR2(oldMessages);

    // Delete archived messages
    this.ctx.storage.sql.exec(`
      DELETE FROM messages WHERE timestamp < ?
    `, cutoff);

    // Schedule next cleanup
    await this.ctx.storage.setAlarm(Date.now() + 3600_000);
  }

  private async archiveToR2(messages: any[]): Promise<void> {
    // Store in R2 bucket
    const key = `archive-${Date.now()}.json`;
    // await env.ARCHIVE_BUCKET.put(key, JSON.stringify(messages));
  }
}
```

### Monitor Storage Size

```typescript
async checkStorageSize(): Promise<{
  sizeBytes: number;
  sizeMB: number;
  percentUsed: number;
}> {
  const result = this.ctx.storage.sql.exec(`
    SELECT page_count * page_size as size
    FROM pragma_page_count(), pragma_page_size()
  `).one<{ size: number }>();

  const sizeBytes = result?.size ?? 0;
  const sizeMB = sizeBytes / (1024 * 1024);
  const percentUsed = (sizeMB / 1024) * 100; // 1GB limit

  console.log(JSON.stringify({
    event: "storage_check",
    size_mb: sizeMB.toFixed(2),
    percent_used: percentUsed.toFixed(2),
  }));

  if (percentUsed > 80) {
    console.warn("Storage usage above 80%! Consider archiving.");
  }

  return { sizeBytes, sizeMB, percentUsed };
}
```

---

## Location Hints for Lower Latency

### Geographic Routing

```typescript
interface Env {
  CHAT_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Get user's region from header
    const region = request.headers.get("CF-IPCountry") ?? "US";

    // Create DO with location hint
    const id = env.CHAT_ROOM.idFromName(`room-${roomId}`);
    const stub = env.CHAT_ROOM.get(id, {
      locationHint: region === "US" ? "wnam" : "eeur",
    });

    return stub.fetch(request);
  }
};
```

### Jurisdiction Compliance

```typescript
// EU users must use EU jurisdiction
const id = env.USER_DATA.idFromName(userId);
const stub = env.USER_DATA.get(id, {
  jurisdiction: user.region === "EU" ? "eu" : undefined,
});
```

---

## Cost Optimization

### Minimize Request Count

```typescript
// ❌ BAD: Multiple RPC calls
const name = await stub.getName();
const email = await stub.getEmail();
const age = await stub.getAge();

// ✅ GOOD: Single RPC call
const user = await stub.getUserData();
// Returns { name, email, age }
```

### Use Alarms for Background Work

```typescript
// ❌ BAD: Process on every request
async addMessage(text: string): Promise<void> {
  await this.ctx.storage.sql.exec(`
    INSERT INTO messages (text) VALUES (?)
  `, text);

  // Expensive analytics on every message!
  await this.updateAnalytics();
}

// ✅ GOOD: Batch analytics with alarms
async addMessage(text: string): Promise<void> {
  await this.ctx.storage.sql.exec(`
    INSERT INTO messages (text, processed) VALUES (?, 0)
  `, text);

  // Schedule alarm if not already scheduled
  const alarm = await this.ctx.storage.getAlarm();
  if (!alarm) {
    await this.ctx.storage.setAlarm(Date.now() + 60_000); // 1 minute
  }
}

async alarm(): Promise<void> {
  // Process all unprocessed messages in batch
  const messages = this.ctx.storage.sql.exec(`
    SELECT * FROM messages WHERE processed = 0
  `).toArray();

  await this.batchUpdateAnalytics(messages);

  this.ctx.storage.sql.exec(`
    UPDATE messages SET processed = 1 WHERE processed = 0
  `);
}
```

### Hibernation for Cost Savings

```typescript
// WebSocket connections automatically hibernate after ~10s idle
// No code changes needed - just ensure:

// ✅ DO: Use acceptWebSocket with proper tags
this.ctx.acceptWebSocket(ws, tags);

// ✅ DO: Implement hibernation handlers
async webSocketMessage(ws: WebSocket, message: string) {
  // Wakes from hibernation automatically
}

async webSocketClose(ws: WebSocket, code: number, reason: string) {
  // Clean up connection
}

// ❌ DON'T: Use setTimeout (prevents hibernation!)
setTimeout(() => {
  ws.send("ping");
}, 30000);

// ✅ DO: Use alarms instead
await this.ctx.storage.setAlarm(Date.now() + 30000);

async alarm() {
  const sockets = await this.ctx.getWebSockets();
  for (const socket of sockets) {
    socket.send("ping");
  }
  await this.ctx.storage.setAlarm(Date.now() + 30000);
}
```

---

## Performance Monitoring

### Measure Operation Duration

```typescript
export class MonitoredDO extends DurableObject {
  private async measureOperation<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - start;

      console.log(JSON.stringify({
        event: "operation",
        name,
        duration_ms: duration,
        success: true,
      }));

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      console.error(JSON.stringify({
        event: "operation",
        name,
        duration_ms: duration,
        success: false,
        error: error.message,
      }));

      throw error;
    }
  }

  async getMessages(userId: string): Promise<any[]> {
    return this.measureOperation("getMessages", async () => {
      return this.ctx.storage.sql.exec(`
        SELECT * FROM messages WHERE user_id = ? LIMIT 100
      `, userId).toArray();
    });
  }
}
```

### Track DO Lifecycle Events

```typescript
export class LifecycleDO extends DurableObject {
  private createdAt: number;
  private requestCount: number = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.createdAt = Date.now();

    console.log(JSON.stringify({
      event: "do_created",
      do_id: ctx.id.toString(),
    }));

    ctx.blockConcurrencyWhile(async () => {
      this.requestCount = await ctx.storage.get<number>("requestCount") ?? 0;
    });
  }

  async handleRequest(): Promise<void> {
    this.requestCount++;

    const uptimeMs = Date.now() - this.createdAt;

    console.log(JSON.stringify({
      event: "request",
      request_count: this.requestCount,
      uptime_ms: uptimeMs,
      uptime_hours: (uptimeMs / (1000 * 60 * 60)).toFixed(2),
    }));

    await this.ctx.storage.put("requestCount", this.requestCount);
  }
}
```

---

## Best Practices Summary

### Constructor

✅ Minimize work in `blockConcurrencyWhile`
✅ Load only critical metadata
✅ Use lazy initialization for heavy data
❌ Don't load entire datasets in constructor

### Queries

✅ Use covering indexes
✅ Batch operations when possible
✅ Cache frequently-accessed data
✅ Always use LIMIT
❌ Don't run N+1 queries
❌ Don't SELECT * without LIMIT

### WebSockets

✅ Keep attachments small
✅ Batch broadcasts
✅ Use alarms instead of setTimeout
❌ Don't block hibernation with timers

### Storage

✅ Archive old data with alarms
✅ Monitor storage size
✅ Use pagination for large datasets
❌ Don't let storage grow unbounded

### Cost

✅ Minimize RPC calls
✅ Use alarms for background work
✅ Enable hibernation
✅ Batch operations
❌ Don't poll/refresh unnecessarily

---

## Sources

- [Best practices](https://developers.cloudflare.com/durable-objects/best-practices/)
- [SQLite Storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/)
- [WebSocket Hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
