---
name: cloudflare-durable-objects:patterns
description: Interactive Durable Objects pattern selection wizard. Helps choose the right DO pattern for your use case and generates implementation code with best practices.
---

# /do-patterns - Pattern Selection Wizard

Interactive wizard to help select and implement the optimal Durable Objects pattern for your specific use case.

## Overview

This command guides you through:
1. Understanding your requirements
2. Recommending appropriate DO patterns
3. Generating pattern-specific implementation
4. Providing testing and deployment guidance

## Step 1: Understand Use Case

Use AskUserQuestion tool:

### Question 1: Primary Use Case
**header**: "Use Case"
**question**: "What is your primary use case for Durable Objects?"
**multiSelect**: false
**options**:
- label: "Real-time communication (WebSocket)"
  description: "Chat rooms, collaborative editing, multiplayer games, live updates"
- label: "State coordination"
  description: "Leader election, distributed locking, workflow orchestration"
- label: "Per-user/per-entity state"
  description: "User sessions, shopping carts, user profiles, device state"
- label: "Rate limiting / throttling"
  description: "API rate limiting, DDoS prevention, quota management"
- label: "Data aggregation"
  description: "Analytics, counters, leaderboards, metrics collection"
- label: "Caching with consistency"
  description: "Distributed cache, cache-aside pattern, write-through cache"

### Question 2: Scale Requirements
**header**: "Scale"
**question**: "What scale do you expect?"
**multiSelect**: false
**options**:
- label: "Small (<1K instances)"
  description: "Prototype, small app, specific use case"
- label: "Medium (1K-100K instances)"
  description: "Growing app, moderate traffic"
- label: "Large (100K-1M instances)"
  description: "High traffic app, many users"
- label: "Very Large (>1M instances)"
  description: "Enterprise scale, global application"

### Question 3: Data Persistence
**header**: "Persistence"
**question**: "What are your data persistence requirements?"
**multiSelect**: false
**options**:
- label: "Ephemeral (in-memory only)"
  description: "Data can be lost, rebuilt from external sources"
- label: "Session-based (TTL cleanup)"
  description: "Data expires after period of inactivity"
- label: "Permanent (long-term storage)"
  description: "Data must persist indefinitely"
- label: "Hybrid (mix of ephemeral and permanent)"
  description: "Some data temporary, some permanent"

### Question 4: Query Complexity
**header**: "Queries"
**question**: "What type of data queries do you need?"
**multiSelect**: false
**options**:
- label: "Simple key-value lookups"
  description: "Get/set by key, no complex queries"
- label: "Basic filtering and sorting"
  description: "Filter by single field, simple WHERE clauses"
- label: "Complex queries with joins"
  description: "Multi-table queries, aggregations, GROUP BY"
- label: "Full-text search"
  description: "Search across text fields"

## Step 2: Pattern Recommendation

Based on answers, recommend appropriate pattern:

### WebSocket Chat Room Pattern

**When**: Real-time communication + Medium-Large scale
**Storage**: Hybrid (connection state ephemeral, messages permanent)
**Queries**: Basic filtering

**Key Features**:
- WebSocket Hibernation API for cost efficiency
- Broadcast to all connected clients
- Message history with SQL storage
- Automatic connection cleanup

**Template**: Load `templates/websocket-hibernation-do.ts`

**Implementation**:
```typescript
import { DurableObject } from 'cloudflare:workers';

export class ChatRoom extends DurableObject {
  private sessions: Map<WebSocket, { userId: string }> = new Map();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Initialize SQL schema
    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);

      await this.ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_created
        ON messages(created_at DESC)
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    // Handle HTTP requests (message history, etc.)
    const url = new URL(request.url);

    if (url.pathname === '/messages') {
      const messages = await this.ctx.storage.sql.exec(
        'SELECT * FROM messages ORDER BY created_at DESC LIMIT 50'
      );
      return Response.json(messages.rows);
    }

    return new Response('Not found', { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    const data = JSON.parse(message);
    const session = this.sessions.get(ws);

    if (!session) return;

    // Store message
    await this.ctx.storage.sql.exec(
      'INSERT INTO messages (user_id, content, created_at) VALUES (?, ?, ?)',
      session.userId,
      data.content,
      Date.now()
    );

    // Broadcast to all connections
    const broadcast = JSON.stringify({
      userId: session.userId,
      content: data.content,
      timestamp: Date.now()
    });

    for (const [client] of this.sessions) {
      client.send(broadcast);
    }
  }

  async webSocketOpen(ws: WebSocket) {
    const userId = crypto.randomUUID(); // Or from auth
    this.sessions.set(ws, { userId });
  }

  async webSocketClose(ws: WebSocket) {
    this.sessions.delete(ws);
  }
}
```

**wrangler.jsonc**:
```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "CHAT_ROOM",
        "class_name": "ChatRoom"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["ChatRoom"]
    }
  ]
}
```

### Rate Limiter Pattern

**When**: Rate limiting + Any scale
**Storage**: Session-based (TTL cleanup)
**Queries**: Simple key-value

**Key Features**:
- Sliding window algorithm
- Per-user/per-IP rate limiting
- Automatic cleanup with alarms
- Configurable limits

**Implementation**:
```typescript
import { DurableObject } from 'cloudflare:workers';

export class RateLimiter extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          endpoint TEXT NOT NULL
        )
      `);

      await this.ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_client_time
        ON requests(client_id, timestamp DESC)
      `);

      // Schedule cleanup
      await this.scheduleCleanup();
    });
  }

  async checkLimit(clientId: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Count recent requests
    const result = await this.ctx.storage.sql.exec(
      'SELECT COUNT(*) as count FROM requests WHERE client_id = ? AND timestamp > ?',
      clientId,
      windowStart
    );

    const count = result.rows[0].count as number;

    if (count >= limit) {
      return false; // Rate limit exceeded
    }

    // Record this request
    await this.ctx.storage.sql.exec(
      'INSERT INTO requests (client_id, timestamp, endpoint) VALUES (?, ?, ?)',
      clientId,
      now,
      'api'
    );

    return true; // Request allowed
  }

  async alarm(): Promise<void> {
    // Cleanup requests older than 1 hour
    const cutoff = Date.now() - 3600_000;

    const deleted = await this.ctx.storage.sql.exec(
      'DELETE FROM requests WHERE timestamp < ?',
      cutoff
    );

    console.log(`Cleaned up ${deleted.rowsWritten} old rate limit records`);

    await this.scheduleCleanup();
  }

  async scheduleCleanup(): Promise<void> {
    const nextCleanup = Date.now() + 3600_000; // 1 hour
    await this.ctx.storage.setAlarm(nextCleanup);
  }
}
```

**Usage in Worker**:
```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const clientId = request.headers.get('CF-Connecting-IP') || 'unknown';
    const id = env.RATE_LIMITER.idFromName(clientId);
    const stub = env.RATE_LIMITER.get(id);

    const allowed = await stub.checkLimit(clientId, 100, 60000); // 100 req/min

    if (!allowed) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    // Process request...
    return new Response('Success');
  }
};
```

### User Session Pattern

**When**: Per-user state + Any scale
**Storage**: Session-based (TTL cleanup)
**Queries**: Basic filtering

**Key Features**:
- Per-user isolated state
- Session expiration with TTL
- Shopping cart, preferences, auth state
- Automatic cleanup

**Implementation**:
```typescript
import { DurableObject } from 'cloudflare:workers';

interface SessionData {
  userId: string;
  cart: Array<{ id: string; quantity: number }>;
  preferences: Record<string, any>;
  expiresAt: number;
}

export class UserSession extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS session_data (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER NOT NULL
        )
      `);

      await this.ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_expires
        ON session_data(expires_at)
        WHERE expires_at IS NOT NULL
      `);

      await this.scheduleCleanup();
    });
  }

  async getSession(): Promise<SessionData | null> {
    const result = await this.ctx.storage.sql.exec(
      'SELECT value FROM session_data WHERE key = ? AND expires_at > ?',
      'session',
      Date.now()
    );

    if (result.rows.length === 0) return null;

    return JSON.parse(result.rows[0].value as string);
  }

  async updateSession(data: Partial<SessionData>): Promise<void> {
    const current = await this.getSession();
    const updated = { ...current, ...data };
    const expiresAt = Date.now() + 86400_000; // 24 hours

    await this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO session_data (key, value, expires_at) VALUES (?, ?, ?)',
      'session',
      JSON.stringify(updated),
      expiresAt
    );
  }

  async addToCart(itemId: string, quantity: number): Promise<void> {
    const session = await this.getSession();
    const cart = session?.cart || [];

    const existingIndex = cart.findIndex(item => item.id === itemId);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({ id: itemId, quantity });
    }

    await this.updateSession({ cart });
  }

  async alarm(): Promise<void> {
    const deleted = await this.ctx.storage.sql.exec(
      'DELETE FROM session_data WHERE expires_at <= ?',
      Date.now()
    );

    if (deleted.rowsWritten > 0) {
      await this.scheduleCleanup();
    }
  }

  async scheduleCleanup(): Promise<void> {
    const nextCleanup = Date.now() + 3600_000;
    await this.ctx.storage.setAlarm(nextCleanup);
  }
}
```

### Counter/Analytics Pattern

**When**: Data aggregation + Any scale
**Storage**: Permanent
**Queries**: Basic filtering

**Key Features**:
- High-performance counters
- Aggregated metrics
- Time-series data
- Minimal storage overhead

**Implementation**:
```typescript
import { DurableObject } from 'cloudflare:workers';

export class Analytics extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_name TEXT NOT NULL,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL
        )
      `);

      await this.ctx.storage.sql.exec(`
        CREATE INDEX IF NOT EXISTS idx_metric_time
        ON metrics(metric_name, timestamp DESC)
      `);
    });
  }

  async increment(metricName: string, value: number = 1): Promise<void> {
    await this.ctx.storage.sql.exec(
      'INSERT INTO metrics (metric_name, value, timestamp) VALUES (?, ?, ?)',
      metricName,
      value,
      Date.now()
    );
  }

  async getTotal(metricName: string): Promise<number> {
    const result = await this.ctx.storage.sql.exec(
      'SELECT SUM(value) as total FROM metrics WHERE metric_name = ?',
      metricName
    );

    return (result.rows[0]?.total as number) || 0;
  }

  async getTimeSeries(metricName: string, startTime: number, endTime: number): Promise<any[]> {
    const result = await this.ctx.storage.sql.exec(`
      SELECT
        (timestamp / 60000) * 60000 as bucket,
        SUM(value) as total
      FROM metrics
      WHERE metric_name = ?
        AND timestamp BETWEEN ? AND ?
      GROUP BY bucket
      ORDER BY bucket
    `, metricName, startTime, endTime);

    return result.rows;
  }
}
```

### Leader Election Pattern

**When**: State coordination + Small-Medium scale
**Storage**: Ephemeral
**Queries**: Simple key-value

**Key Features**:
- Single leader per group
- Automatic failover
- Heartbeat mechanism
- Lock acquisition

**Implementation**:
```typescript
import { DurableObject } from 'cloudflare:workers';

export class LeaderElection extends DurableObject {
  private leader: string | null = null;
  private lastHeartbeat: number = 0;
  private readonly HEARTBEAT_TIMEOUT = 5000; // 5 seconds

  async electLeader(candidateId: string): Promise<boolean> {
    const now = Date.now();

    // Check if current leader is still alive
    if (this.leader && (now - this.lastHeartbeat) < this.HEARTBEAT_TIMEOUT) {
      return this.leader === candidateId;
    }

    // Elect new leader
    this.leader = candidateId;
    this.lastHeartbeat = now;
    return true;
  }

  async heartbeat(leaderId: string): Promise<boolean> {
    if (this.leader !== leaderId) {
      return false;
    }

    this.lastHeartbeat = Date.now();
    return true;
  }

  async getLeader(): Promise<string | null> {
    const now = Date.now();

    if (this.leader && (now - this.lastHeartbeat) >= this.HEARTBEAT_TIMEOUT) {
      this.leader = null;
    }

    return this.leader;
  }

  async releaseLeadership(leaderId: string): Promise<void> {
    if (this.leader === leaderId) {
      this.leader = null;
    }
  }
}
```

## Step 3: Storage Backend Selection

Based on query complexity, recommend storage backend:

### SQL Backend (Recommended for most cases)
**When**:
- Complex queries needed
- Relationships between data
- Filtering, sorting, aggregations
- ACID transactions required

**Benefits**:
- 1GB storage limit (vs 128MB for KV)
- Atomic operations
- Query flexibility
- Better for structured data

**Migration**:
```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["YourDOClass"]
    }
  ]
}
```

### KV Backend (Use sparingly)
**When**:
- Simple key-value lookups only
- No complex queries needed
- Storage under 128MB
- Legacy migration required

**Migration**:
```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["YourDOClass"]
    }
  ]
}
```

## Step 4: Generate Complete Implementation

After pattern selection, generate:

1. **Durable Object Class**
   - Constructor with schema initialization
   - Pattern-specific methods
   - Alarm handlers if needed

2. **wrangler.jsonc Configuration**
   - Binding configuration
   - Migration entry
   - compatibility_date

3. **Worker Entry Point**
   - DO routing logic
   - RPC method calls
   - Error handling

4. **Tests**
   - Vitest test suite
   - Pattern-specific test cases
   - Edge case coverage

## Step 5: Provide Best Practices

For each pattern, provide:

### Performance Tips
- Constructor optimization (minimize blockConcurrencyWhile)
- Query optimization (indexes, prepared statements)
- Caching strategies

### Scaling Considerations
- Partition key selection
- Load distribution
- Global uniqueness implications

### Monitoring
- Logging strategies
- Metrics to track
- Alert thresholds

## Step 6: Next Steps

Provide clear deployment path:

1. **Local Testing**
   ```bash
   npm test  # Run Vitest tests
   wrangler dev  # Local development
   ```

2. **Deployment**
   ```bash
   wrangler deploy  # Deploy to production
   ```

3. **Monitoring**
   ```bash
   wrangler tail  # Live logs
   ```

4. **Optimization**
   - Load references for advanced patterns
   - Consider gradual deployment for large changes
   - Monitor performance metrics

## Common Pattern Combinations

### Chat + Rate Limiting
Combine WebSocket pattern with rate limiting for spam prevention.

### Session + Analytics
Track user behavior while maintaining session state.

### Counter + TTL
Implement temporary counters with automatic expiration.

## Advanced Patterns

For more advanced use cases, load:
- **`references/rpc-metadata.md`** - RpcTarget pattern for metadata access
- **`references/gradual-deployments.md`** - Traffic splitting strategies
- **`references/performance-optimization.md`** - Advanced optimization
- **`templates/ttl-cleanup-do.ts`** - TTL cleanup patterns

## Troubleshooting

If pattern doesn't fit requirements:
1. Use `/do-debug` command for specific issues
2. Load `references/best-practices.md` for alternatives
3. Consult `references/data-modeling.md` for schema design
4. Use `do-pattern-implementer` agent for custom patterns

---

**Pattern Selection Summary**:
- Real-time → WebSocket Chat Room
- Rate limiting → Rate Limiter
- Per-user state → User Session
- Aggregation → Counter/Analytics
- Coordination → Leader Election

Choose pattern based on use case, then customize for specific requirements.
