/**
 * TTL Cleanup Pattern for Durable Objects
 *
 * Implements automatic data expiration and cleanup using:
 * - Alarms API for scheduled cleanup tasks
 * - SQL timestamps for expiration tracking
 * - Idempotent cleanup logic for retry safety
 * - Incremental deletion to avoid timeouts
 *
 * Use Cases:
 * - Session management (expire old sessions)
 * - Cache invalidation (expire stale cache entries)
 * - Temporary data storage (expire after N days)
 * - Rate limiting (cleanup old request timestamps)
 *
 * See: references/data-modeling.md, references/alarms-api.md
 */

import { DurableObject } from "cloudflare:workers";

// ============================================================================
// Example 1: Session Store with TTL
// ============================================================================

/**
 * Session store with automatic expiration
 * - Sessions expire after 24 hours of inactivity
 * - Cleanup runs every hour via alarms
 * - Incremental deletion (1000 sessions per alarm)
 */
export class SessionStoreDO extends DurableObject {
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  private readonly CLEANUP_BATCH_SIZE = 1000;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      // Create sessions table with expiration tracking
      await this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          session_id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          last_activity INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_expires_at ON sessions(expires_at);
      `);

      // Schedule initial cleanup alarm
      await this.scheduleCleanup();
    });
  }

  /**
   * Create session with expiration
   */
  async createSession(userId: string, data: Record<string, unknown>): Promise<string> {
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + this.SESSION_TTL_MS;

    await this.ctx.storage.sql.exec(
      `INSERT INTO sessions (session_id, user_id, data, created_at, expires_at, last_activity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      sessionId,
      userId,
      JSON.stringify(data),
      now,
      expiresAt,
      now
    );

    console.log(`[SessionStore] Created session ${sessionId}, expires at ${new Date(expiresAt).toISOString()}`);
    return sessionId;
  }

  /**
   * Get session and extend expiration on access
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const now = Date.now();

    // Get session
    const result = await this.ctx.storage.sql.exec<SessionRow>(
      "SELECT * FROM sessions WHERE session_id = ? AND expires_at > ? LIMIT 1",
      sessionId,
      now
    ).toArray();

    if (result.length === 0) {
      return null; // Session expired or doesn't exist
    }

    // Extend expiration (sliding window)
    const newExpiresAt = now + this.SESSION_TTL_MS;
    await this.ctx.storage.sql.exec(
      "UPDATE sessions SET last_activity = ?, expires_at = ? WHERE session_id = ?",
      now,
      newExpiresAt,
      sessionId
    );

    const row = result[0];
    return {
      sessionId: row.session_id,
      userId: row.user_id,
      data: JSON.parse(row.data),
      createdAt: row.created_at,
      expiresAt: newExpiresAt,
      lastActivity: now,
    };
  }

  /**
   * Delete session manually
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.ctx.storage.sql.exec(
      "DELETE FROM sessions WHERE session_id = ?",
      sessionId
    );
    console.log(`[SessionStore] Deleted session ${sessionId}`);
  }

  /**
   * Alarm handler: Cleanup expired sessions
   */
  async alarm(): Promise<void> {
    const now = Date.now();

    try {
      // Count expired sessions
      const countResult = await this.ctx.storage.sql.exec<{ count: number }>(
        "SELECT COUNT(*) as count FROM sessions WHERE expires_at <= ?",
        now
      ).toArray();
      const expiredCount = countResult[0].count;

      if (expiredCount === 0) {
        console.log("[SessionStore] No expired sessions to clean up");
        await this.scheduleCleanup();
        return;
      }

      // Delete expired sessions in batches (avoid timeout)
      const deleted = await this.ctx.storage.sql.exec(
        `DELETE FROM sessions WHERE session_id IN (
           SELECT session_id FROM sessions
           WHERE expires_at <= ?
           LIMIT ?
         )`,
        now,
        this.CLEANUP_BATCH_SIZE
      );

      console.log(`[SessionStore] Deleted ${deleted.rowsWritten} expired sessions (${expiredCount} total)`);

      // If more sessions to delete, schedule immediate alarm
      if (expiredCount > this.CLEANUP_BATCH_SIZE) {
        await this.ctx.storage.setAlarm(Date.now() + 1000); // 1 second
      } else {
        // Otherwise, schedule next regular cleanup
        await this.scheduleCleanup();
      }
    } catch (error) {
      console.error("[SessionStore] Cleanup failed:", error);
      // Retry in 5 minutes
      await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000);
      throw error; // Propagate error for retry
    }
  }

  /**
   * Schedule next cleanup alarm
   */
  private async scheduleCleanup(): Promise<void> {
    const nextCleanup = Date.now() + this.CLEANUP_INTERVAL_MS;
    await this.ctx.storage.setAlarm(nextCleanup);
    console.log(`[SessionStore] Scheduled cleanup at ${new Date(nextCleanup).toISOString()}`);
  }
}

// ============================================================================
// Example 2: Cache Store with TTL and LRU Eviction
// ============================================================================

/**
 * Cache store with TTL and size limits
 * - Entries expire after configurable TTL
 * - LRU eviction when cache size limit reached
 * - Cleanup runs every 10 minutes
 */
export class CacheStoreDO extends DurableObject {
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 10000;
  private readonly CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          last_accessed INTEGER NOT NULL,
          access_count INTEGER NOT NULL DEFAULT 1
        );
        CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_cache_lru ON cache(last_accessed);
      `);

      await this.scheduleCleanup();
    });
  }

  /**
   * Set cache entry with TTL
   */
  async set(key: string, value: unknown, ttlMs: number = this.DEFAULT_TTL_MS): Promise<void> {
    const now = Date.now();
    const expiresAt = now + ttlMs;

    // Check if we need to evict entries
    await this.evictIfNeeded();

    await this.ctx.storage.sql.exec(
      `INSERT INTO cache (key, value, expires_at, last_accessed)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         expires_at = excluded.expires_at,
         last_accessed = excluded.last_accessed,
         access_count = access_count + 1`,
      key,
      JSON.stringify(value),
      expiresAt,
      now
    );

    console.log(`[CacheStore] Set ${key}, expires at ${new Date(expiresAt).toISOString()}`);
  }

  /**
   * Get cache entry and extend TTL
   */
  async get(key: string): Promise<unknown | null> {
    const now = Date.now();

    const result = await this.ctx.storage.sql.exec<CacheRow>(
      `UPDATE cache
       SET last_accessed = ?, access_count = access_count + 1
       WHERE key = ? AND expires_at > ?
       RETURNING *`,
      now,
      key,
      now
    ).toArray();

    if (result.length === 0) {
      return null; // Cache miss or expired
    }

    return JSON.parse(result[0].value);
  }

  /**
   * Evict LRU entries if cache size exceeds limit
   */
  private async evictIfNeeded(): Promise<void> {
    const countResult = await this.ctx.storage.sql.exec<{ count: number }>(
      "SELECT COUNT(*) as count FROM cache"
    ).toArray();

    const cacheSize = countResult[0].count;
    if (cacheSize < this.MAX_CACHE_SIZE) {
      return; // No eviction needed
    }

    // Evict 10% of cache (LRU entries)
    const evictCount = Math.floor(this.MAX_CACHE_SIZE * 0.1);
    await this.ctx.storage.sql.exec(
      `DELETE FROM cache WHERE key IN (
         SELECT key FROM cache
         ORDER BY last_accessed ASC
         LIMIT ?
       )`,
      evictCount
    );

    console.log(`[CacheStore] Evicted ${evictCount} LRU entries (cache size: ${cacheSize})`);
  }

  /**
   * Alarm handler: Cleanup expired entries
   */
  async alarm(): Promise<void> {
    const now = Date.now();

    try {
      const deleted = await this.ctx.storage.sql.exec(
        "DELETE FROM cache WHERE expires_at <= ?",
        now
      );

      console.log(`[CacheStore] Deleted ${deleted.rowsWritten} expired cache entries`);

      // Schedule next cleanup
      await this.scheduleCleanup();
    } catch (error) {
      console.error("[CacheStore] Cleanup failed:", error);
      await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000); // Retry in 5 minutes
      throw error;
    }
  }

  private async scheduleCleanup(): Promise<void> {
    const nextCleanup = Date.now() + this.CLEANUP_INTERVAL_MS;
    await this.ctx.storage.setAlarm(nextCleanup);
  }
}

// ============================================================================
// Example 3: Rate Limiter with Sliding Window TTL
// ============================================================================

/**
 * Rate limiter with automatic cleanup of old request timestamps
 * - Sliding window: 100 requests per minute
 * - Cleanup runs every 5 minutes
 */
export class RateLimiterDO extends DurableObject {
  private readonly WINDOW_SIZE_MS = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 100;
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_user_timestamp ON requests(user_id, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_expires_at ON requests(expires_at);
      `);

      await this.scheduleCleanup();
    });
  }

  /**
   * Check rate limit for user
   */
  async checkLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE_MS;

    // Count recent requests
    const countResult = await this.ctx.storage.sql.exec<{ count: number }>(
      "SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND timestamp > ?",
      userId,
      windowStart
    ).toArray();

    const requestCount = countResult[0].count;
    const allowed = requestCount < this.MAX_REQUESTS;

    if (allowed) {
      // Record new request
      const expiresAt = now + this.WINDOW_SIZE_MS;
      await this.ctx.storage.sql.exec(
        "INSERT INTO requests (user_id, timestamp, expires_at) VALUES (?, ?, ?)",
        userId,
        now,
        expiresAt
      );
    }

    const remaining = Math.max(0, this.MAX_REQUESTS - requestCount - (allowed ? 1 : 0));
    const resetAt = now + this.WINDOW_SIZE_MS;

    return { allowed, remaining, resetAt };
  }

  /**
   * Alarm handler: Cleanup expired request records
   */
  async alarm(): Promise<void> {
    const now = Date.now();

    try {
      const deleted = await this.ctx.storage.sql.exec(
        "DELETE FROM requests WHERE expires_at <= ?",
        now
      );

      console.log(`[RateLimiter] Deleted ${deleted.rowsWritten} expired request records`);

      await this.scheduleCleanup();
    } catch (error) {
      console.error("[RateLimiter] Cleanup failed:", error);
      await this.ctx.storage.setAlarm(Date.now() + 60 * 1000); // Retry in 1 minute
      throw error;
    }
  }

  private async scheduleCleanup(): Promise<void> {
    const nextCleanup = Date.now() + this.CLEANUP_INTERVAL_MS;
    await this.ctx.storage.setAlarm(nextCleanup);
  }
}

// ============================================================================
// Example 4: Archive Pattern (Move Old Data to R2)
// ============================================================================

/**
 * Archive old messages to R2 before deletion
 * - Messages older than 30 days archived to R2
 * - Archived messages deleted from DO storage
 * - Cleanup runs daily
 */
export class MessageArchiveDO extends DurableObject {
  private readonly ARCHIVE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 day
  private readonly ARCHIVE_BATCH_SIZE = 1000;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_created_at ON messages(created_at);
      `);

      await this.scheduleCleanup();
    });
  }

  /**
   * Add message
   */
  async addMessage(roomId: string, userId: string, content: string): Promise<number> {
    const result = await this.ctx.storage.sql.exec<{ id: number }>(
      "INSERT INTO messages (room_id, user_id, content, created_at) VALUES (?, ?, ?, ?) RETURNING id",
      roomId,
      userId,
      content,
      Date.now()
    ).toArray();

    return result[0].id;
  }

  /**
   * Alarm handler: Archive and delete old messages
   */
  async alarm(): Promise<void> {
    const now = Date.now();
    const archiveBefore = now - this.ARCHIVE_AGE_MS;

    try {
      // Get old messages
      const messages = await this.ctx.storage.sql.exec<MessageRow>(
        "SELECT * FROM messages WHERE created_at < ? LIMIT ?",
        archiveBefore,
        this.ARCHIVE_BATCH_SIZE
      ).toArray();

      if (messages.length === 0) {
        console.log("[MessageArchive] No messages to archive");
        await this.scheduleCleanup();
        return;
      }

      // Archive to R2 (if env.ARCHIVE_BUCKET available)
      if ((this.env as any).ARCHIVE_BUCKET) {
        const archiveKey = `archive/${new Date().toISOString().split('T')[0]}.json`;
        await (this.env as any).ARCHIVE_BUCKET.put(archiveKey, JSON.stringify(messages));
        console.log(`[MessageArchive] Archived ${messages.length} messages to R2: ${archiveKey}`);
      }

      // Delete archived messages
      const messageIds = messages.map(m => m.id);
      await this.ctx.storage.sql.exec(
        `DELETE FROM messages WHERE id IN (${messageIds.map(() => '?').join(',')})`,
        ...messageIds
      );

      console.log(`[MessageArchive] Deleted ${messages.length} archived messages`);

      // If more messages to archive, schedule immediate alarm
      if (messages.length === this.ARCHIVE_BATCH_SIZE) {
        await this.ctx.storage.setAlarm(Date.now() + 1000);
      } else {
        await this.scheduleCleanup();
      }
    } catch (error) {
      console.error("[MessageArchive] Archive failed:", error);
      await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000); // Retry in 1 hour
      throw error;
    }
  }

  private async scheduleCleanup(): Promise<void> {
    const nextCleanup = Date.now() + this.CLEANUP_INTERVAL_MS;
    await this.ctx.storage.setAlarm(nextCleanup);
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface SessionRow {
  session_id: string;
  user_id: string;
  data: string;
  created_at: number;
  expires_at: number;
  last_activity: number;
}

interface SessionData {
  sessionId: string;
  userId: string;
  data: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

interface CacheRow {
  key: string;
  value: string;
  expires_at: number;
  last_accessed: number;
  access_count: number;
}

interface MessageRow {
  id: number;
  room_id: string;
  user_id: string;
  content: string;
  created_at: number;
}

interface Env {
  // Add your bindings here
}

// ============================================================================
// Best Practices for TTL Cleanup
// ============================================================================

/**
 * ✅ DO:
 * - Use SQL indexes on expiration timestamps (expires_at)
 * - Batch delete operations (avoid timeouts)
 * - Make cleanup logic idempotent (safe for retries)
 * - Schedule regular cleanup with alarms
 * - Log cleanup operations for monitoring
 * - Handle cleanup failures gracefully (reschedule alarm)
 * - Use incremental cleanup for large datasets
 * - Consider archiving before deletion (R2, D1)
 *
 * ❌ DON'T:
 * - Delete all expired records in one operation (timeout risk)
 * - Forget to index expiration columns (slow queries)
 * - Skip error handling in alarm() (cleanup stops)
 * - Use setTimeout/setInterval (breaks hibernation)
 * - Schedule alarms too frequently (<1 minute)
 * - Delete data without archiving (data loss risk)
 * - Ignore cleanup failures (data accumulates)
 */
