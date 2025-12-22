# Common Durable Objects Patterns

Production-tested patterns for common use cases with Cloudflare Durable Objects.

---

## Table of Contents

1. [Pattern 1: Rate Limiting (Per-User)](#pattern-1-rate-limiting-per-user)
2. [Pattern 2: Session Management](#pattern-2-session-management)
3. [Pattern 3: Leader Election](#pattern-3-leader-election)
4. [Pattern 4: Multi-DO Coordination](#pattern-4-multi-do-coordination)

---

## Pattern 1: Rate Limiting (Per-User)

**Use case**: Prevent abuse by limiting requests per user/IP/key

**Why Durable Objects**: Global uniqueness ensures accurate counting across all Cloudflare edges

```typescript
export class RateLimiter extends DurableObject {
  async checkLimit(userId: string, limit: number, window: number): Promise<boolean> {
    const key = `rate:${userId}`;
    const now = Date.now();

    // Get recent requests
    const requests = await this.ctx.storage.get<number[]>(key) || [];

    // Remove requests outside window
    const validRequests = requests.filter(timestamp => now - timestamp < window);

    // Check limit
    if (validRequests.length >= limit) {
      return false;  // Rate limit exceeded
    }

    // Add current request
    validRequests.push(now);
    await this.ctx.storage.put(key, validRequests);

    return true;  // Within limit
  }
}

// Worker usage:
const limiter = env.RATE_LIMITER.getByName(userId);
const allowed = await limiter.checkLimit(userId, 100, 60000);  // 100 req/min

if (!allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

**Key points:**
- One DO instance per user/key (use `getByName(userId)`)
- Sliding window algorithm
- KV storage for simplicity
- Can extend with multiple limits (per second, minute, hour)

**Production enhancements:**
```typescript
export class AdvancedRateLimiter extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    // Create table for multiple rate limits
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT NOT NULL,
        window_type TEXT NOT NULL,  -- 'second', 'minute', 'hour', 'day'
        timestamp INTEGER NOT NULL,
        PRIMARY KEY (key, window_type, timestamp)
      )
    `);
  }

  async checkMultipleLimits(
    key: string,
    limits: { second?: number; minute?: number; hour?: number }
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();

    // Check each limit
    for (const [windowType, limit] of Object.entries(limits)) {
      const windowMs = this.getWindowMs(windowType);
      const cutoff = now - windowMs;

      // Count requests in window
      const cursor = this.sql.exec(
        'SELECT COUNT(*) as count FROM rate_limits WHERE key = ? AND window_type = ? AND timestamp > ?',
        key,
        windowType,
        cutoff
      );

      const { count } = cursor.one<{ count: number }>();

      if (count >= limit) {
        // Calculate retry-after
        const oldestInWindow = this.sql.exec(
          'SELECT MIN(timestamp) as oldest FROM rate_limits WHERE key = ? AND window_type = ?',
          key,
          windowType
        ).one<{ oldest: number }>();

        const retryAfter = Math.ceil((oldestInWindow.oldest + windowMs - now) / 1000);

        return { allowed: false, retryAfter };
      }
    }

    // Record request for all window types
    for (const windowType of Object.keys(limits)) {
      this.sql.exec(
        'INSERT INTO rate_limits (key, window_type, timestamp) VALUES (?, ?, ?)',
        key,
        windowType,
        now
      );
    }

    // Cleanup old entries
    this.sql.exec(
      'DELETE FROM rate_limits WHERE timestamp < ?',
      now - (24 * 60 * 60 * 1000)  // Keep last 24 hours
    );

    return { allowed: true };
  }

  private getWindowMs(windowType: string): number {
    const windows = {
      'second': 1000,
      'minute': 60000,
      'hour': 3600000,
      'day': 86400000
    };
    return windows[windowType] || 60000;
  }
}

// Usage: Multiple rate limits
const limiter = env.RATE_LIMITER.getByName(`user:${userId}`);
const result = await limiter.checkMultipleLimits(`api:${endpoint}`, {
  second: 10,   // 10 requests per second
  minute: 100,  // 100 requests per minute
  hour: 1000    // 1000 requests per hour
});

if (!result.allowed) {
  return new Response('Rate limit exceeded', {
    status: 429,
    headers: { 'Retry-After': String(result.retryAfter) }
  });
}
```

---

## Pattern 2: Session Management

**Use case**: Store user session data with TTL and automatic cleanup

**Why Durable Objects**: Strong consistency for session data, built-in alarm for cleanup

```typescript
export class UserSession extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS session (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER
      );
    `);

    // Schedule cleanup alarm
    ctx.blockConcurrencyWhile(async () => {
      const alarm = await ctx.storage.getAlarm();
      if (alarm === null) {
        await ctx.storage.setAlarm(Date.now() + 3600000);  // 1 hour
      }
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl : null;

    this.sql.exec(
      'INSERT OR REPLACE INTO session (key, value, expires_at) VALUES (?, ?, ?)',
      key,
      JSON.stringify(value),
      expiresAt
    );
  }

  async get(key: string): Promise<any | null> {
    const cursor = this.sql.exec(
      'SELECT value, expires_at FROM session WHERE key = ?',
      key
    );

    const row = cursor.one<{ value: string; expires_at: number | null }>({ allowNone: true });

    if (!row) {
      return null;
    }

    // Check expiration
    if (row.expires_at && row.expires_at < Date.now()) {
      this.sql.exec('DELETE FROM session WHERE key = ?', key);
      return null;
    }

    return JSON.parse(row.value);
  }

  async delete(key: string): Promise<void> {
    this.sql.exec('DELETE FROM session WHERE key = ?', key);
  }

  async alarm(): Promise<void> {
    // Cleanup expired sessions
    this.sql.exec('DELETE FROM session WHERE expires_at < ?', Date.now());

    // Schedule next cleanup
    await this.ctx.storage.setAlarm(Date.now() + 3600000);
  }
}

// Worker usage:
const session = env.USER_SESSION.getByName(`user:${userId}`);

// Set session data with 24-hour TTL
await session.set('cart', { items: [...] }, 86400000);

// Get session data
const cart = await session.get('cart');
```

**Key points:**
- One DO instance per user (use `getByName(userId)`)
- SQLite for structured data
- Automatic cleanup with alarms (reduces storage costs)
- TTL per key

---

## Pattern 3: Leader Election

**Use case**: Ensure only one worker/instance performs a task (e.g., cron job, data sync)

**Why Durable Objects**: Global uniqueness guarantees single leader

```typescript
export class LeaderElection extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS leader (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        worker_id TEXT NOT NULL,
        elected_at INTEGER NOT NULL,
        heartbeat_at INTEGER NOT NULL
      );
    `);
  }

  async electLeader(workerId: string, ttl: number = 60000): Promise<boolean> {
    const now = Date.now();

    // Try to become leader
    try {
      this.sql.exec(
        'INSERT INTO leader (id, worker_id, elected_at, heartbeat_at) VALUES (1, ?, ?, ?)',
        workerId,
        now,
        now
      );
      return true;  // Became leader
    } catch (error) {
      // Check if current leader is expired
      const cursor = this.sql.exec('SELECT worker_id, heartbeat_at FROM leader WHERE id = 1');
      const row = cursor.one<{ worker_id: string; heartbeat_at: number }>();

      if (now - row.heartbeat_at > ttl) {
        // Current leader expired, replace it
        this.sql.exec(
          'UPDATE leader SET worker_id = ?, elected_at = ?, heartbeat_at = ? WHERE id = 1',
          workerId,
          now,
          now
        );
        return true;  // Became leader
      }

      return false;  // Someone else is leader
    }
  }

  async heartbeat(workerId: string): Promise<boolean> {
    const cursor = this.sql.exec('SELECT worker_id FROM leader WHERE id = 1');
    const row = cursor.one<{ worker_id: string }>({ allowNone: true });

    if (row?.worker_id === workerId) {
      this.sql.exec('UPDATE leader SET heartbeat_at = ? WHERE id = 1', Date.now());
      return true;  // Still leader
    }

    return false;  // Not leader or leadership lost
  }

  async getLeader(): Promise<string | null> {
    const cursor = this.sql.exec('SELECT worker_id FROM leader WHERE id = 1');
    const row = cursor.one<{ worker_id: string }>({ allowNone: true });
    return row?.worker_id || null;
  }

  async releaseLeadership(workerId: string): Promise<void> {
    this.sql.exec('DELETE FROM leader WHERE id = 1 AND worker_id = ?', workerId);
  }
}

// Worker usage (in scheduled handler):
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const workerId = crypto.randomUUID();  // Unique per worker instance

    // Try to become leader
    const election = env.LEADER_ELECTION.getByName('global');
    const isLeader = await election.electLeader(workerId, 60000);  // 60s TTL

    if (!isLeader) {
      console.log('Not leader, skipping task');
      return;
    }

    console.log('I am the leader, executing task');

    try {
      // Perform work
      await performCriticalTask(env);

      // Send heartbeat every 30 seconds during work
      ctx.waitUntil(
        (async () => {
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 30000));
            await election.heartbeat(workerId);
          }
        })()
      );
    } finally {
      // Release leadership when done
      await election.releaseLeadership(workerId);
    }
  }
};
```

**Key points:**
- Global singleton DO (use `getByName('global')`)
- TTL-based leadership expiration
- Heartbeat mechanism for long-running tasks
- Graceful leadership release

---

## Pattern 4: Multi-DO Coordination

**Use case**: Multiple DO types working together (e.g., game coordinator + game rooms)

**Why Durable Objects**: Each DO type handles different concerns, coordinator orchestrates

```typescript
// Coordinator DO
export class GameCoordinator extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS games (
        game_id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        player_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'waiting'
      );
    `);
  }

  async createGame(gameId: string, env: Env): Promise<void> {
    // Create game room DO
    const gameRoom = env.GAME_ROOM.getByName(gameId);
    await gameRoom.initialize();

    // Track in coordinator
    this.sql.exec(
      'INSERT INTO games (game_id, created_at) VALUES (?, ?)',
      gameId,
      Date.now()
    );
  }

  async listGames(): Promise<Array<{ game_id: string; player_count: number; status: string }>> {
    const cursor = this.sql.exec('SELECT game_id, player_count, status FROM games WHERE status = ?', 'waiting');
    return cursor.toArray<{ game_id: string; player_count: number; status: string }>();
  }

  async updateGameStatus(gameId: string, status: string, playerCount: number): Promise<void> {
    this.sql.exec(
      'UPDATE games SET status = ?, player_count = ? WHERE game_id = ?',
      status,
      playerCount,
      gameId
    );
  }

  async deleteGame(gameId: string): Promise<void> {
    this.sql.exec('DELETE FROM games WHERE game_id = ?', gameId);
  }
}

// Game room DO
export class GameRoom extends DurableObject {
  sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS players (
        player_id TEXT PRIMARY KEY,
        joined_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS game_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  async initialize(): Promise<void> {
    this.sql.exec(
      "INSERT OR IGNORE INTO game_state (key, value) VALUES ('started', 'false')"
    );
  }

  async addPlayer(playerId: string, env: Env): Promise<number> {
    this.sql.exec(
      'INSERT OR IGNORE INTO players (player_id, joined_at) VALUES (?, ?)',
      playerId,
      Date.now()
    );

    // Get player count
    const cursor = this.sql.exec('SELECT COUNT(*) as count FROM players');
    const { count } = cursor.one<{ count: number }>();

    // Notify coordinator
    const coordinator = env.GAME_COORDINATOR.getByName('global');
    await coordinator.updateGameStatus(this.ctx.id.toString(), 'waiting', count);

    return count;
  }

  async removePlayer(playerId: string, env: Env): Promise<number> {
    this.sql.exec('DELETE FROM players WHERE player_id = ?', playerId);

    // Get remaining player count
    const cursor = this.sql.exec('SELECT COUNT(*) as count FROM players');
    const { count } = cursor.one<{ count: number }>();

    if (count === 0) {
      // Notify coordinator to delete game
      const coordinator = env.GAME_COORDINATOR.getByName('global');
      await coordinator.deleteGame(this.ctx.id.toString());
    } else {
      // Update coordinator
      const coordinator = env.GAME_COORDINATOR.getByName('global');
      await coordinator.updateGameStatus(this.ctx.id.toString(), 'in_progress', count);
    }

    return count;
  }

  async startGame(): Promise<void> {
    this.sql.exec(
      "UPDATE game_state SET value = 'true' WHERE key = 'started'"
    );
  }

  async getPlayers(): Promise<string[]> {
    const cursor = this.sql.exec('SELECT player_id FROM players');
    return cursor.toArray<{ player_id: string }>().map(row => row.player_id);
  }
}

// Worker usage:
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Create new game
    if (url.pathname === '/games/create') {
      const gameId = crypto.randomUUID();
      const coordinator = env.GAME_COORDINATOR.getByName('global');
      await coordinator.createGame(gameId, env);

      return Response.json({ gameId });
    }

    // List available games
    if (url.pathname === '/games') {
      const coordinator = env.GAME_COORDINATOR.getByName('global');
      const games = await coordinator.listGames();

      return Response.json({ games });
    }

    // Join game
    if (url.pathname === '/games/join') {
      const { gameId, playerId } = await request.json();
      const gameRoom = env.GAME_ROOM.getByName(gameId);
      const playerCount = await gameRoom.addPlayer(playerId, env);

      return Response.json({ playerCount });
    }

    return new Response('Not found', { status: 404 });
  }
};
```

**Key points:**
- Coordinator DO manages game list (global singleton)
- Game Room DOs handle individual game state (one per game)
- DOs communicate via stubs (not direct calls)
- Coordinator tracks high-level state, rooms manage details

---

## Best Practices Across All Patterns

### 1. Use Appropriate ID Methods

```typescript
// ✅ Named DOs for deterministic routing
const rateLimiter = env.LIMITER.getByName(userId);
const session = env.SESSION.getByName(`user:${userId}`);

// ✅ Global singletons for coordination
const coordinator = env.COORDINATOR.getByName('global');
const election = env.ELECTION.getByName('global');
```

### 2. Handle Errors Gracefully

```typescript
try {
  const result = await doStub.method();
} catch (error) {
  console.error('DO call failed:', error);
  // Fallback logic
}
```

### 3. Use SQL for Structured Data

```typescript
// ✅ SQL for relational data
this.sql.exec('SELECT * FROM users WHERE status = ?', 'active');

// ✅ KV for simple key-value
await this.ctx.storage.put('counter', 42);
```

### 4. Leverage Alarms for Cleanup

```typescript
async alarm(): Promise<void> {
  // Cleanup old data
  this.sql.exec('DELETE FROM sessions WHERE expires_at < ?', Date.now());

  // Reschedule
  await this.ctx.storage.setAlarm(Date.now() + 3600000);
}
```

### 5. Minimize Constructor Work

```typescript
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);

  // ✅ Lightweight: Initialize SQL reference
  this.sql = ctx.storage.sql;

  // ❌ Heavy: Don't load data in constructor
  // Use blockConcurrencyWhile if needed:
  ctx.blockConcurrencyWhile(async () => {
    await this.loadInitialState();
  });
}
```

---

**Source**: https://developers.cloudflare.com/durable-objects/examples/
**Last Updated**: 2025-11-23
