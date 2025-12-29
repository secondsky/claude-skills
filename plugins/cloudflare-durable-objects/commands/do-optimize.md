---
name: cloudflare-durable-objects:optimize
description: Interactive Durable Objects performance optimization assistant. Analyzes existing DO code and provides specific optimization recommendations with implementation guidance.
---

# /do-optimize - Performance Optimization Assistant

Interactive assistant that analyzes your Durable Objects code and provides targeted performance optimizations.

## Overview

This command:
1. Analyzes existing DO implementations
2. Identifies performance bottlenecks
3. Provides specific optimization recommendations
4. Generates optimized code
5. Measures potential performance improvements

## Step 1: Identify Optimization Area

Use AskUserQuestion tool:

### Question 1: Performance Issue
**header**: "Issue Type"
**question**: "What performance issue are you experiencing?"
**multiSelect**: false
**options**:
- label: "Slow cold starts / initialization"
  description: "DO takes too long to start up or respond to first request"
- label: "Slow query performance"
  description: "SQL queries are taking too long"
- label: "High memory usage"
  description: "DO is using too much memory or hitting limits"
- label: "WebSocket latency"
  description: "WebSocket messages have high latency or dropped connections"
- label: "Alarm execution issues"
  description: "Alarms are slow, failing, or not executing"
- label: "General optimization"
  description: "Want to improve overall performance"

### Question 2: Current Scale
**header**: "Scale"
**question**: "What is your current scale?"
**multiSelect**: false
**options**:
- label: "Development / Testing"
  description: "Local testing, small dataset"
- label: "Small production (<1K DOs)"
  description: "Early production, limited users"
- label: "Medium production (1K-100K DOs)"
  description: "Growing user base"
- label: "Large production (>100K DOs)"
  description: "High traffic, many active instances"

### Question 3: Optimization Priority
**header**: "Priority"
**question**: "What is most important to optimize?"
**multiSelect**: false
**options**:
- label: "Latency (response time)"
  description: "Reduce time to first response"
- label: "Throughput (requests/second)"
  description: "Handle more concurrent requests"
- label: "Cost (compute time)"
  description: "Reduce CPU time and costs"
- label: "Memory efficiency"
  description: "Reduce memory usage"

## Step 2: Analyze Current Implementation

Read and analyze DO class files:

### Constructor Analysis
Check for common anti-patterns:

❌ **Bad Pattern**: Expensive operations in constructor
```typescript
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);
  this.ctx.blockConcurrencyWhile(async () => {
    // ❌ Multiple slow operations block all requests
    this.config = await this.loadConfigFromAPI();
    this.cache = await this.buildLargeCache();
    this.data = await this.loadAllData();
  });
}
```

✅ **Optimized Pattern**: Minimal constructor, lazy initialization
```typescript
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);
  // ✅ Only initialize synchronously
  this.config = null;
  this.cache = new Map();
  this.initialized = false;
}

private async ensureInitialized() {
  if (!this.initialized) {
    // ✅ Load on demand, only once
    this.config = await this.loadConfig();
    this.initialized = true;
  }
}

async handleRequest(request: Request) {
  await this.ensureInitialized();
  // Process request...
}
```

### SQL Query Analysis
Check for inefficient queries:

❌ **Bad Pattern**: Missing indexes, N+1 queries
```typescript
// ❌ No index on user_id - full table scan
const messages = await this.ctx.storage.sql.exec(
  'SELECT * FROM messages WHERE user_id = ?',
  userId
);

// ❌ N+1 query pattern
for (const message of messages.rows) {
  const user = await this.ctx.storage.sql.exec(
    'SELECT * FROM users WHERE id = ?',
    message.user_id
  );
}
```

✅ **Optimized Pattern**: Proper indexes, batch queries
```typescript
// ✅ Create index for common queries
await this.ctx.storage.sql.exec(`
  CREATE INDEX IF NOT EXISTS idx_user_messages
  ON messages(user_id, created_at DESC)
`);

// ✅ Single query with JOIN
const result = await this.ctx.storage.sql.exec(`
  SELECT
    m.*,
    u.username,
    u.avatar
  FROM messages m
  JOIN users u ON m.user_id = u.id
  WHERE m.user_id = ?
  ORDER BY m.created_at DESC
  LIMIT 50
`, userId);
```

### WebSocket Optimization Analysis
Check for hibernation blockers:

❌ **Bad Pattern**: Synchronous processing, setTimeout usage
```typescript
async webSocketMessage(ws: WebSocket, message: string) {
  // ❌ Blocks hibernation with heavy processing
  const result = await this.heavyProcessing(message);
  await this.saveToDatabase(result);
  ws.send(JSON.stringify(result));
}

// ❌ setTimeout prevents hibernation
setTimeout(() => {
  this.cleanup();
}, 60000);
```

✅ **Optimized Pattern**: Fast wake, async processing, alarms
```typescript
async webSocketMessage(ws: WebSocket, message: string) {
  // ✅ Minimal processing, queue for async
  this.messageQueue.push({ ws, message });

  // ✅ Process asynchronously, doesn't block hibernation
  this.ctx.waitUntil(this.processQueue());
}

private async processQueue() {
  while (this.messageQueue.length > 0) {
    const { ws, message } = this.messageQueue.shift()!;
    const result = await this.heavyProcessing(message);
    await this.saveToDatabase(result);
    ws.send(JSON.stringify(result));
  }
}

// ✅ Use alarms instead of setTimeout
async alarm() {
  await this.cleanup();
  await this.ctx.storage.setAlarm(Date.now() + 60000);
}
```

### Memory Usage Analysis
Check for memory leaks:

❌ **Bad Pattern**: Unbounded growth, large in-memory cache
```typescript
class MyDO extends DurableObject {
  // ❌ Grows unbounded
  private allMessages: any[] = [];
  private userCache: Map<string, any> = new Map();

  async addMessage(message: any) {
    this.allMessages.push(message); // ❌ Never cleaned up
    this.userCache.set(message.userId, message.user); // ❌ Unbounded
  }
}
```

✅ **Optimized Pattern**: Bounded caches, LRU eviction
```typescript
class MyDO extends DurableObject {
  private recentMessages: any[] = []; // ✅ Bounded to 100
  private readonly MAX_RECENT = 100;

  private userCache: Map<string, any> = new Map();
  private readonly MAX_CACHE = 1000;
  private cacheAccess: Map<string, number> = new Map();

  async addMessage(message: any) {
    this.recentMessages.push(message);

    // ✅ Keep only last 100
    if (this.recentMessages.length > this.MAX_RECENT) {
      this.recentMessages.shift();
    }

    // ✅ LRU cache eviction
    this.userCache.set(message.userId, message.user);
    this.cacheAccess.set(message.userId, Date.now());

    if (this.userCache.size > this.MAX_CACHE) {
      // Evict least recently used
      let oldestKey: string | null = null;
      let oldestTime = Date.now();

      for (const [key, time] of this.cacheAccess) {
        if (time < oldestTime) {
          oldestTime = time;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.userCache.delete(oldestKey);
        this.cacheAccess.delete(oldestKey);
      }
    }
  }
}
```

## Step 3: Provide Specific Optimizations

Based on identified issues, provide targeted fixes:

### Optimization 1: Constructor Optimization

**Problem**: Slow cold starts (>500ms)

**Solution**: Minimize blockConcurrencyWhile usage

**Implementation**:
```typescript
// Before: 800ms cold start
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);
  this.ctx.blockConcurrencyWhile(async () => {
    await this.initializeSchema(); // 200ms
    await this.loadConfig(); // 300ms
    await this.buildCache(); // 300ms
  });
}

// After: 150ms cold start
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);
  this.ctx.blockConcurrencyWhile(async () => {
    // ✅ Only schema creation (required for SQL)
    await this.initializeSchema(); // 200ms
  });
  // ✅ Defer other initialization
  this.configPromise = null;
  this.cacheReady = false;
}

private async getConfig() {
  if (!this.configPromise) {
    this.configPromise = this.loadConfig();
  }
  return this.configPromise;
}
```

**Expected Improvement**: 80% reduction in cold start time (800ms → 150ms)

### Optimization 2: Query Performance

**Problem**: Slow queries (>100ms per query)

**Solution**: Add indexes, use covering indexes

**Implementation**:
```typescript
// Before: 250ms query time
await this.ctx.storage.sql.exec(`
  SELECT * FROM messages
  WHERE user_id = ?
  ORDER BY created_at DESC
  LIMIT 50
`, userId);

// After: Add covering index
await this.ctx.storage.sql.exec(`
  CREATE INDEX IF NOT EXISTS idx_user_messages_cover
  ON messages(user_id, created_at DESC)
  INCLUDE (content, metadata)
`);

// Query now: 15ms
await this.ctx.storage.sql.exec(`
  SELECT user_id, created_at, content, metadata
  FROM messages
  WHERE user_id = ?
  ORDER BY created_at DESC
  LIMIT 50
`, userId);
```

**Expected Improvement**: 94% reduction in query time (250ms → 15ms)

### Optimization 3: Batch Operations

**Problem**: N+1 query pattern causing high latency

**Solution**: Batch queries with JOINs or IN clauses

**Implementation**:
```typescript
// Before: N+1 queries (50ms × 20 = 1000ms)
const messageIds = [id1, id2, id3, ...]; // 20 IDs
const messages = [];
for (const id of messageIds) {
  const result = await this.ctx.storage.sql.exec(
    'SELECT * FROM messages WHERE id = ?',
    id
  );
  messages.push(result.rows[0]);
}

// After: Single batch query (60ms)
const placeholders = messageIds.map(() => '?').join(',');
const result = await this.ctx.storage.sql.exec(
  `SELECT * FROM messages WHERE id IN (${placeholders})`,
  ...messageIds
);
const messages = result.rows;
```

**Expected Improvement**: 94% reduction in total time (1000ms → 60ms)

### Optimization 4: Prepared Statements

**Problem**: Query parsing overhead on repeated queries

**Solution**: Use bind parameters consistently

**Implementation**:
```typescript
// Before: Query parsed every time
for (let i = 0; i < 1000; i++) {
  await this.ctx.storage.sql.exec(
    `SELECT * FROM users WHERE id = ${i}` // ❌ No bind parameter
  );
}

// After: Prepared statement reused
for (let i = 0; i < 1000; i++) {
  await this.ctx.storage.sql.exec(
    'SELECT * FROM users WHERE id = ?', // ✅ Bind parameter
    i
  );
}
```

**Expected Improvement**: 30% reduction in query execution time

### Optimization 5: WebSocket Hibernation

**Problem**: High costs from non-hibernating WebSockets

**Solution**: Implement fast wake pattern

**Implementation**:
```typescript
// Before: Blocks hibernation (high costs)
async webSocketMessage(ws: WebSocket, message: string) {
  const parsed = JSON.parse(message);
  const validated = await this.validateMessage(parsed); // 50ms
  const processed = await this.processMessage(validated); // 200ms
  await this.saveToDatabase(processed); // 100ms
  ws.send(JSON.stringify(processed));
}

// After: Fast wake, async processing (enables hibernation)
async webSocketMessage(ws: WebSocket, message: string) {
  // ✅ Minimal synchronous work (<1ms)
  this.messageQueue.push({ ws, message, timestamp: Date.now() });

  // ✅ Async processing doesn't block hibernation
  this.ctx.waitUntil(this.processMessageQueue());
}

private async processMessageQueue() {
  while (this.messageQueue.length > 0) {
    const { ws, message } = this.messageQueue.shift()!;
    const parsed = JSON.parse(message);
    const validated = await this.validateMessage(parsed);
    const processed = await this.processMessage(validated);
    await this.saveToDatabase(processed);
    ws.send(JSON.stringify(processed));
  }
}
```

**Expected Improvement**: 90%+ cost reduction through hibernation

### Optimization 6: Memory Management

**Problem**: Hitting 128MB memory limit

**Solution**: Implement LRU cache with bounded growth

**Implementation**:
```typescript
class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private access: Map<K, number> = new Map();

  constructor(private maxSize: number) {}

  set(key: K, value: V): void {
    this.cache.set(key, value);
    this.access.set(key, Date.now());

    if (this.cache.size > this.maxSize) {
      this.evictOldest();
    }
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.access.set(key, Date.now());
    }
    return value;
  }

  private evictOldest(): void {
    let oldestKey: K | null = null;
    let oldestTime = Date.now();

    for (const [key, time] of this.access) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      this.cache.delete(oldestKey);
      this.access.delete(oldestKey);
    }
  }
}

// Usage in DO
class MyDO extends DurableObject {
  private userCache = new LRUCache<string, User>(1000); // Max 1K users
}
```

**Expected Improvement**: Controlled memory usage, no OOM errors

## Step 4: Measure Performance Impact

Provide benchmarking guidance:

### Before Optimization
```bash
# Measure baseline
wrangler tail --format json | jq '.outcome.cpuTime' > baseline.txt

# Calculate average
awk '{sum+=$1} END {print sum/NR}' baseline.txt
# Result: 45ms average CPU time
```

### After Optimization
```bash
# Measure optimized
wrangler tail --format json | jq '.outcome.cpuTime' > optimized.txt

# Calculate average
awk '{sum+=$1} END {print sum/NR}' optimized.txt
# Result: 12ms average CPU time
```

### Performance Improvement
- **CPU Time**: 45ms → 12ms (73% reduction)
- **Latency**: 250ms → 50ms (80% reduction)
- **Cost**: $0.50/million → $0.13/million (74% reduction)

## Step 5: Provide Monitoring

Add performance monitoring:

### Structured Logging
```typescript
class MyDO extends DurableObject {
  async handleRequest(request: Request) {
    const startTime = Date.now();

    try {
      const result = await this.processRequest(request);

      // ✅ Log performance metrics
      console.log(JSON.stringify({
        doId: this.ctx.id.toString(),
        event: 'request-complete',
        duration: Date.now() - startTime,
        success: true
      }));

      return result;
    } catch (error) {
      console.log(JSON.stringify({
        doId: this.ctx.id.toString(),
        event: 'request-error',
        duration: Date.now() - startTime,
        success: false,
        error: (error as Error).message
      }));

      throw error;
    }
  }
}
```

### Performance Dashboards
```bash
# Monitor average request duration
wrangler tail --format json | \
  jq -r 'select(.logs[].message | contains("request-complete")) | .logs[].message' | \
  jq -r '.duration' | \
  awk '{sum+=$1; count++} END {print "Average:", sum/count, "ms"}'

# Monitor error rate
wrangler tail --format json | \
  jq -r 'select(.logs[].message | contains("request-")) | .logs[].message' | \
  jq -r '.success' | \
  awk '{total++; if($1=="false") errors++} END {print "Error rate:", (errors/total)*100, "%"}'
```

## Step 6: Next Steps

Provide optimization roadmap:

### Immediate Actions
1. Apply recommended optimizations
2. Deploy with gradual rollout (5% → 25% → 100%)
3. Monitor performance metrics
4. Validate improvements

### Short-term Improvements
1. Load `references/performance-optimization.md` for advanced techniques
2. Implement caching strategies
3. Optimize SQL schema further
4. Review alarm patterns

### Long-term Optimization
1. Consider data sharding for very large scale
2. Implement read replicas if needed
3. Optimize for specific access patterns
4. Regular performance audits

## Common Optimizations by Use Case

### WebSocket Chat
- Fast wake pattern
- Message batching
- Connection pooling
- Alarm-based cleanup

### Rate Limiter
- Sliding window algorithm
- TTL-based cleanup
- Efficient timestamp queries
- Minimal state storage

### User Sessions
- Lazy loading
- TTL with alarms
- LRU cache for hot data
- Batch session updates

### Analytics/Counters
- Batch insertions
- Prepared statements
- Time-based bucketing
- Periodic aggregation

## Advanced Optimizations

For more advanced scenarios, consult:
- **`references/performance-optimization.md`** - Comprehensive optimization guide
- **`references/data-modeling.md`** - Schema optimization
- **`references/monitoring-debugging.md`** - Production monitoring
- **`templates/ttl-cleanup-do.ts`** - Efficient cleanup patterns

## Troubleshooting

If optimizations don't help:
1. Use `/do-debug` for runtime issues
2. Check `references/top-errors.md` for known problems
3. Review SQL execution plans
4. Profile with wrangler tail
5. Contact Cloudflare support for platform issues

---

**Optimization Priority Order**:
1. Constructor (biggest impact on cold starts)
2. Query indexes (biggest impact on latency)
3. WebSocket hibernation (biggest cost savings)
4. Memory management (prevents failures)
5. Batch operations (moderate latency improvement)

Apply optimizations incrementally and measure impact at each step.
