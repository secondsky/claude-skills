/**
 * RpcTarget Metadata Pattern for Durable Objects
 *
 * Problem: Cannot access DO name inside DO via ctx.id.name (returns empty string)
 * Solution: Use RpcTarget wrapper class to pass metadata to DO methods
 *
 * This pattern enables:
 * - Access to DO name/identifier in RPC methods
 * - Logging with DO context (correlation IDs)
 * - Multi-tenant logic based on DO name
 * - Audit trails with DO metadata
 *
 * Trade-offs:
 * ✅ No storage overhead (metadata in memory)
 * ✅ Type-safe with TypeScript
 * ❌ Extra boilerplate for each RPC method
 * ❌ Metadata not available in constructor/alarm/webSocketMessage handlers
 *
 * See: references/rpc-metadata.md for detailed guide
 */

import { DurableObject, RpcTarget } from "cloudflare:workers";

// ============================================================================
// Example 1: Basic RpcTarget Wrapper
// ============================================================================

/**
 * Main Durable Object implementation
 */
export class UserSessionDO extends DurableObject {
  /**
   * Constructor: Cannot access ctx.id.name here
   * Use blockConcurrencyWhile only for critical initialization
   */
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Initialize storage schema
    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          last_activity INTEGER NOT NULL
        )
      `);
    });
  }

  /**
   * Core business logic - no access to DO name
   */
  async updateActivity(userId: string): Promise<void> {
    const now = Date.now();
    await this.ctx.storage.sql.exec(
      `INSERT INTO sessions (id, user_id, created_at, last_activity)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET last_activity = ?`,
      crypto.randomUUID(),
      userId,
      now,
      now,
      now
    );
  }

  /**
   * Core business logic with metadata needs
   * Note: sessionId parameter must be passed from RpcTarget wrapper
   */
  async logActivity(userId: string, sessionId: string): Promise<void> {
    console.log(`[Session ${sessionId}] User ${userId} activity`);
    await this.updateActivity(userId);
  }

  /**
   * Query methods
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const result = await this.ctx.storage.sql.exec<Session>(
      "SELECT * FROM sessions WHERE id = ? LIMIT 1",
      sessionId
    ).toArray();
    return result[0] || null;
  }
}

/**
 * RpcTarget Wrapper: Injects metadata into RPC calls
 */
export class UserSessionRpc extends RpcTarget {
  constructor(
    private mainDo: UserSessionDO,
    private sessionIdentifier: string
  ) {
    super();
  }

  /**
   * Wrapped RPC method: sessionId metadata available
   */
  async logActivity(userId: string): Promise<void> {
    return this.mainDo.logActivity(userId, this.sessionIdentifier);
  }

  /**
   * Wrapped RPC method: Pass metadata to core logic
   */
  async getSession(): Promise<Session | null> {
    return this.mainDo.getSession(this.sessionIdentifier);
  }
}

/**
 * Worker: Creates RpcTarget wrapper when accessing DO
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return new Response("Missing sessionId", { status: 400 });
    }

    // Get DO stub
    const id = env.USER_SESSION.idFromName(sessionId);
    const stub = env.USER_SESSION.get(id);

    // Wrap with RpcTarget to inject metadata
    const rpcStub = new UserSessionRpc(stub as unknown as UserSessionDO, sessionId);

    // RPC call now has access to sessionId
    await rpcStub.logActivity("user-123");
    const session = await rpcStub.getSession();

    return Response.json({ session });
  },
} satisfies ExportedHandler<Env>;

// ============================================================================
// Example 2: Multi-Tenant Chat Room with RpcTarget
// ============================================================================

/**
 * Chat room DO with multi-tenant support
 */
export class ChatRoomDO extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_name TEXT NOT NULL,
          user_id TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_room_timestamp ON messages(room_name, timestamp DESC);
      `);
    });
  }

  /**
   * Send message: Requires roomName for logging/audit
   */
  async sendMessage(userId: string, message: string, roomName: string): Promise<number> {
    console.log(`[Room ${roomName}] ${userId}: ${message}`);

    const result = await this.ctx.storage.sql.exec<{ id: number }>(
      `INSERT INTO messages (room_name, user_id, message, timestamp)
       VALUES (?, ?, ?, ?)
       RETURNING id`,
      roomName,
      userId,
      message,
      Date.now()
    ).toArray();

    // Broadcast to WebSocket connections
    const websockets = this.ctx.getWebSockets();
    websockets.forEach((ws) => {
      ws.send(JSON.stringify({ userId, message, roomName }));
    });

    return result[0].id;
  }

  /**
   * Get messages: Requires roomName for query
   */
  async getMessages(roomName: string, limit: number = 50): Promise<Message[]> {
    const result = await this.ctx.storage.sql.exec<Message>(
      `SELECT * FROM messages
       WHERE room_name = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      roomName,
      limit
    ).toArray();

    return result;
  }
}

/**
 * RpcTarget wrapper for chat room
 */
export class ChatRoomRpc extends RpcTarget {
  constructor(
    private chatRoom: ChatRoomDO,
    private roomName: string
  ) {
    super();
  }

  async sendMessage(userId: string, message: string): Promise<number> {
    return this.chatRoom.sendMessage(userId, message, this.roomName);
  }

  async getMessages(limit?: number): Promise<Message[]> {
    return this.chatRoom.getMessages(this.roomName, limit);
  }
}

// ============================================================================
// Example 3: Rate Limiter with Per-User Logging
// ============================================================================

/**
 * Rate limiter DO with user-specific limits
 */
export class RateLimiterDO extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  /**
   * Check rate limit: Needs userId for logging violations
   */
  async checkLimit(userId: string, limit: number = 100): Promise<{ allowed: boolean; remaining: number }> {
    const key = `requests:${userId}`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get current request count
    const requests = (await this.ctx.storage.get<number[]>(key)) || [];
    const validRequests = requests.filter((timestamp) => timestamp > windowStart);

    if (validRequests.length >= limit) {
      console.warn(`[RateLimiter] User ${userId} exceeded limit (${validRequests.length}/${limit})`);
      return { allowed: false, remaining: 0 };
    }

    // Add new request
    validRequests.push(now);
    await this.ctx.storage.put(key, validRequests);

    const remaining = limit - validRequests.length;
    console.log(`[RateLimiter] User ${userId} request allowed (${remaining} remaining)`);

    return { allowed: true, remaining };
  }
}

/**
 * RpcTarget wrapper for rate limiter
 */
export class RateLimiterRpc extends RpcTarget {
  constructor(
    private rateLimiter: RateLimiterDO,
    private userId: string
  ) {
    super();
  }

  async checkLimit(limit?: number): Promise<{ allowed: boolean; remaining: number }> {
    return this.rateLimiter.checkLimit(this.userId, limit);
  }
}

// ============================================================================
// Example 4: Alternative Pattern - Store Metadata in Storage
// ============================================================================

/**
 * Alternative: Store metadata in storage (trade-off analysis)
 *
 * Pros:
 * ✅ Metadata available in constructor/alarm/webSocketMessage handlers
 * ✅ No RpcTarget boilerplate
 * ✅ Simpler API
 *
 * Cons:
 * ❌ Storage overhead (writes on every initialization)
 * ❌ Eventual consistency (metadata might be stale)
 * ❌ Extra storage.get() calls
 */
export class UserProfileDO extends DurableObject {
  private userId: string | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Load metadata from storage
    this.ctx.blockConcurrencyWhile(async () => {
      this.userId = await this.ctx.storage.get<string>("userId");
    });
  }

  /**
   * Initialize: Store metadata for future use
   */
  async initialize(userId: string): Promise<void> {
    await this.ctx.storage.put("userId", userId);
    this.userId = userId;
  }

  /**
   * Business logic: Metadata available via this.userId
   */
  async updateProfile(data: UserProfile): Promise<void> {
    if (!this.userId) {
      throw new Error("DO not initialized - call initialize() first");
    }

    console.log(`[Profile ${this.userId}] Updating profile`);
    await this.ctx.storage.put("profile", data);
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface Session {
  id: string;
  user_id: string;
  created_at: number;
  last_activity: number;
}

interface Message {
  id: number;
  room_name: string;
  user_id: string;
  message: string;
  timestamp: number;
}

interface UserProfile {
  name: string;
  email: string;
  avatar_url: string;
}

interface Env {
  USER_SESSION: DurableObjectNamespace<UserSessionDO>;
  CHAT_ROOM: DurableObjectNamespace<ChatRoomDO>;
  RATE_LIMITER: DurableObjectNamespace<RateLimiterDO>;
  USER_PROFILE: DurableObjectNamespace<UserProfileDO>;
}

// ============================================================================
// Decision Guide: RpcTarget vs Storage
// ============================================================================

/**
 * Use RpcTarget Pattern When:
 * - Metadata only needed in RPC methods
 * - High-frequency DO access (minimize storage writes)
 * - Metadata is derived from request context (sessionId, userId)
 * - Type safety is critical
 *
 * Use Storage Pattern When:
 * - Metadata needed in constructor/alarm/webSocketMessage handlers
 * - Metadata rarely changes
 * - Simple API is more important than performance
 * - Metadata is inherent to DO (not request-specific)
 *
 * Hybrid Approach:
 * - Use RpcTarget for request-specific metadata (sessionId, requestId)
 * - Use storage for DO-inherent metadata (tenantId, region)
 */
