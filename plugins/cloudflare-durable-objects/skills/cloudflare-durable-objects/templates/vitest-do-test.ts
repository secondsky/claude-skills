/**
 * Complete Vitest Test Suite for Cloudflare Durable Objects
 *
 * Demonstrates:
 * - RPC method testing
 * - State persistence testing
 * - WebSocket hibernation testing
 * - Alarms API testing
 * - Isolated storage per test
 * - listDurableObjectIds usage
 *
 * Setup Required:
 * 1. Install: npm install -D vitest@2.0.0 @cloudflare/vitest-pool-workers@0.5.0
 * 2. Configure vitest.config.ts (see vitest-testing.md reference)
 * 3. Add test script to package.json: "test": "vitest"
 *
 * Run: npm test
 */

import { env, runInDurableObject, runDurableObjectAlarm, listDurableObjectIds } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";

// ============================================================================
// Basic RPC Method Testing
// ============================================================================

describe("Counter Durable Object - RPC Methods", () => {
  it("increments counter via RPC", async () => {
    const id = env.COUNTER.idFromName("test-counter");
    const stub = env.COUNTER.get(id);

    const count1 = await stub.increment();
    expect(count1).toBe(1);

    const count2 = await stub.increment();
    expect(count2).toBe(2);
  });

  it("resets counter via RPC", async () => {
    const id = env.COUNTER.idFromName("test-reset");
    const stub = env.COUNTER.get(id);

    await stub.increment();
    await stub.increment();
    await stub.reset();

    const count = await stub.getCount();
    expect(count).toBe(0);
  });

  it("isolates storage between tests", async () => {
    // Each test gets isolated storage automatically
    const id = env.COUNTER.idFromName("test-isolation");
    const stub = env.COUNTER.get(id);

    const count = await stub.getCount();
    expect(count).toBe(0); // Always starts fresh
  });
});

// ============================================================================
// State Persistence Testing
// ============================================================================

describe("Counter Durable Object - State Persistence", () => {
  it("persists state using SQL storage", async () => {
    const id = env.COUNTER.idFromName("test-persist");

    await runInDurableObject(env.COUNTER, id, async (instance, state) => {
      // Direct access to state.storage.sql
      await state.storage.sql.exec(
        "CREATE TABLE IF NOT EXISTS counters (id INTEGER PRIMARY KEY, value INTEGER)"
      );
      await state.storage.sql.exec(
        "INSERT INTO counters (id, value) VALUES (1, 42)"
      );

      const result = await state.storage.sql.exec<{ value: number }>(
        "SELECT value FROM counters WHERE id = 1"
      ).toArray();

      expect(result[0].value).toBe(42);
    });
  });

  it("persists state using KV storage", async () => {
    const id = env.COUNTER.idFromName("test-kv-persist");

    await runInDurableObject(env.COUNTER, id, async (instance, state) => {
      await state.storage.put("myKey", "myValue");
      const value = await state.storage.get("myKey");
      expect(value).toBe("myValue");
    });
  });

  it("verifies state cleanup with deleteAll", async () => {
    const id = env.COUNTER.idFromName("test-cleanup");

    await runInDurableObject(env.COUNTER, id, async (instance, state) => {
      await state.storage.put("key1", "value1");
      await state.storage.put("key2", "value2");

      await state.storage.deleteAll();

      const keys = await state.storage.list();
      expect(keys.size).toBe(0);
    });
  });
});

// ============================================================================
// WebSocket Hibernation Testing
// ============================================================================

describe("ChatRoom Durable Object - WebSocket Hibernation", () => {
  it("accepts WebSocket connections", async () => {
    const id = env.CHAT_ROOM.idFromName("test-room");
    const stub = env.CHAT_ROOM.get(id);

    // Test WebSocket upgrade
    const response = await stub.fetch("https://fake-host/ws", {
      headers: { Upgrade: "websocket" },
    });

    expect(response.status).toBe(101);
    expect(response.webSocket).toBeDefined();
  });

  it("broadcasts messages to connected clients", async () => {
    const id = env.CHAT_ROOM.idFromName("test-broadcast");

    await runInDurableObject(env.CHAT_ROOM, id, async (instance, state) => {
      // Simulate two WebSocket connections
      const ws1 = new WebSocket("wss://fake");
      const ws2 = new WebSocket("wss://fake");

      state.acceptWebSocket(ws1);
      state.acceptWebSocket(ws2);

      const messages: string[] = [];
      ws2.addEventListener("message", (event) => {
        messages.push(event.data);
      });

      // Send message from ws1
      ws1.send(JSON.stringify({ type: "chat", text: "Hello!" }));

      // ws2 should receive the broadcast
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(messages).toContain(JSON.stringify({ type: "chat", text: "Hello!" }));
    });
  });

  it("hibernates WebSocket connections correctly", async () => {
    const id = env.CHAT_ROOM.idFromName("test-hibernation");

    await runInDurableObject(env.CHAT_ROOM, id, async (instance, state) => {
      const ws = new WebSocket("wss://fake");
      state.acceptWebSocket(ws, ["chat"]);

      // Verify WebSocket is accepted and ready for hibernation
      const websockets = state.getWebSockets();
      expect(websockets.length).toBe(1);
      expect(websockets[0].readyState).toBe(WebSocket.OPEN);
    });
  });
});

// ============================================================================
// Alarms API Testing
// ============================================================================

describe("Scheduler Durable Object - Alarms", () => {
  it("schedules alarm successfully", async () => {
    const id = env.SCHEDULER.idFromName("test-alarm");

    await runInDurableObject(env.SCHEDULER, id, async (instance, state) => {
      const scheduleTime = Date.now() + 5000; // 5 seconds from now
      await state.storage.setAlarm(scheduleTime);

      const alarmTime = await state.storage.getAlarm();
      expect(alarmTime).toBe(scheduleTime);
    });
  });

  it("executes alarm handler", async () => {
    const id = env.SCHEDULER.idFromName("test-alarm-execution");

    // Schedule alarm
    await runInDurableObject(env.SCHEDULER, id, async (instance, state) => {
      await state.storage.setAlarm(Date.now() + 100); // 100ms from now
    });

    // Wait for alarm to trigger
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Run alarm handler manually for testing
    await runDurableObjectAlarm(env.SCHEDULER, id);

    // Verify alarm executed (check side effects)
    await runInDurableObject(env.SCHEDULER, id, async (instance, state) => {
      const executed = await state.storage.get("alarmExecuted");
      expect(executed).toBe(true);
    });
  });

  it("handles alarm retries on failure", async () => {
    const id = env.SCHEDULER.idFromName("test-alarm-retry");

    // First attempt fails
    await runDurableObjectAlarm(env.SCHEDULER, id);

    // Alarm should be rescheduled automatically
    await runInDurableObject(env.SCHEDULER, id, async (instance, state) => {
      const alarmTime = await state.storage.getAlarm();
      expect(alarmTime).toBeTruthy(); // Alarm still scheduled
    });
  });

  it("deletes alarm when no longer needed", async () => {
    const id = env.SCHEDULER.idFromName("test-alarm-delete");

    await runInDurableObject(env.SCHEDULER, id, async (instance, state) => {
      await state.storage.setAlarm(Date.now() + 5000);
      await state.storage.deleteAlarm();

      const alarmTime = await state.storage.getAlarm();
      expect(alarmTime).toBeNull();
    });
  });
});

// ============================================================================
// listDurableObjectIds Testing
// ============================================================================

describe("Durable Objects - listDurableObjectIds", () => {
  beforeEach(async () => {
    // Create multiple DO instances
    const ids = ["user-1", "user-2", "user-3"];
    for (const name of ids) {
      const id = env.COUNTER.idFromName(name);
      const stub = env.COUNTER.get(id);
      await stub.increment(); // Ensure DO is initialized
    }
  });

  it("lists all Durable Object IDs", async () => {
    const cursor = await listDurableObjectIds(env.COUNTER);
    const ids = [...cursor];

    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => typeof id === "string")).toBe(true);
  });

  it("paginates through DO IDs with limit", async () => {
    const cursor = await listDurableObjectIds(env.COUNTER);
    const firstBatch = cursor.next(2); // Get first 2 IDs

    expect(firstBatch.length).toBe(2);
    expect(cursor.hasMore()).toBe(true);
  });

  it("filters DO IDs by cursor position", async () => {
    const cursor1 = await listDurableObjectIds(env.COUNTER);
    const firstId = cursor1.next(1)[0];

    // Create new cursor starting after firstId
    const cursor2 = await listDurableObjectIds(env.COUNTER, { cursor: firstId });
    const secondBatch = cursor2.next(10);

    expect(secondBatch).not.toContain(firstId);
  });
});

// ============================================================================
// Advanced Patterns Testing
// ============================================================================

describe("Advanced Durable Object Patterns", () => {
  it("tests rate limiting with DO", async () => {
    const userId = "user-123";
    const id = env.RATE_LIMITER.idFromName(userId);
    const stub = env.RATE_LIMITER.get(id);

    // Allow 3 requests per minute
    const results = await Promise.all([
      stub.checkLimit(),
      stub.checkLimit(),
      stub.checkLimit(),
      stub.checkLimit(), // Should be rate limited
    ]);

    expect(results.slice(0, 3).every((r) => r.allowed)).toBe(true);
    expect(results[3].allowed).toBe(false);
  });

  it("tests session management with DO", async () => {
    const sessionId = "session-abc";
    const id = env.SESSION.idFromName(sessionId);
    const stub = env.SESSION.get(id);

    await stub.setUser({ id: "user-1", name: "Alice" });
    const user = await stub.getUser();

    expect(user).toEqual({ id: "user-1", name: "Alice" });
  });

  it("tests leader election with DO", async () => {
    const groupId = "group-1";
    const id = env.LEADER_ELECTION.idFromName(groupId);
    const stub = env.LEADER_ELECTION.get(id);

    const leaderId = await stub.electLeader("worker-1");
    expect(leaderId).toBe("worker-1");

    // Second worker tries to become leader
    const newLeaderId = await stub.electLeader("worker-2");
    expect(newLeaderId).toBe("worker-1"); // Leader doesn't change
  });

  it("tests multi-DO coordination", async () => {
    const userId = "user-456";
    const roomId = "room-789";

    const userDO = env.USER_DO.get(env.USER_DO.idFromName(userId));
    const roomDO = env.ROOM_DO.get(env.ROOM_DO.idFromName(roomId));

    // User joins room
    await userDO.joinRoom(roomId);
    await roomDO.addUser(userId);

    // Verify coordination
    const userRooms = await userDO.getRooms();
    const roomUsers = await roomDO.getUsers();

    expect(userRooms).toContain(roomId);
    expect(roomUsers).toContain(userId);
  });
});

// ============================================================================
// Error Handling Testing
// ============================================================================

describe("Durable Objects - Error Handling", () => {
  it("handles RPC method errors gracefully", async () => {
    const id = env.COUNTER.idFromName("test-error");
    const stub = env.COUNTER.get(id);

    await expect(stub.invalidMethod()).rejects.toThrow();
  });

  it("handles storage errors", async () => {
    const id = env.COUNTER.idFromName("test-storage-error");

    await runInDurableObject(env.COUNTER, id, async (instance, state) => {
      // Attempt invalid SQL
      await expect(
        state.storage.sql.exec("INVALID SQL")
      ).rejects.toThrow();
    });
  });

  it("handles WebSocket close events", async () => {
    const id = env.CHAT_ROOM.idFromName("test-ws-close");

    await runInDurableObject(env.CHAT_ROOM, id, async (instance, state) => {
      const ws = new WebSocket("wss://fake");
      state.acceptWebSocket(ws);

      ws.close(1000, "Normal closure");

      await new Promise((resolve) => setTimeout(resolve, 100));

      const websockets = state.getWebSockets();
      expect(websockets.length).toBe(0); // WebSocket removed
    });
  });
});
