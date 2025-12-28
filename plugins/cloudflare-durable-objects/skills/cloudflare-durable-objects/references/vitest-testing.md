# Vitest Testing for Durable Objects

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27
**Official Docs**: [Testing with Durable Objects](https://developers.cloudflare.com/durable-objects/examples/testing-with-durable-objects/)

## Overview

Cloudflare provides `@cloudflare/vitest-pool-workers` for testing Durable Objects inside the Workers runtime. This enables unit tests, integration tests, and direct access to runtime APIs and bindings with automatic test isolation.

**Key Advantages**:
- Tests run in actual Workers runtime (not Node.js simulation)
- Direct access to Durable Object bindings
- Automatic isolated storage per test
- No manual cleanup required
- Integration testing with SELF fetcher

---

## Setup & Configuration

### 1. Install Dependencies

```bash
# npm
npm i -D vitest@~3.2.0 @cloudflare/vitest-pool-workers

# pnpm
pnpm add -D vitest@~3.2.0 @cloudflare/vitest-pool-workers

# bun
bun add -d vitest@~3.2.0 @cloudflare/vitest-pool-workers
```

### 2. Create vitest.config.ts

```typescript
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
      },
    },
  },
});
```

### 3. Configure wrangler.toml

```toml
[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"

[[migrations]]
tag = "v1"
new_sqlite_classes = [ "Counter" ]
```

### 4. TypeScript Configuration (test/tsconfig.json)

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "types": [
      "@cloudflare/workers-types",
      "@cloudflare/vitest-pool-workers"
    ]
  },
  "include": ["./**/*.ts", "../src/**/*.ts"]
}
```

### 5. Add Test Script to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Testing Durable Object State

### Direct RPC Method Testing

Test DO methods directly via stubs:

```typescript
import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("Counter DO", () => {
  it("increments counter via RPC", async () => {
    const id = env.COUNTER.idFromName("test-counter");
    const stub = env.COUNTER.get(id);

    const count1 = await stub.increment();
    expect(count1).toBe(1);

    const count2 = await stub.increment();
    expect(count2).toBe(2);
  });

  it("gets current value", async () => {
    const id = env.COUNTER.idFromName("get-test");
    const stub = env.COUNTER.get(id);

    await stub.increment();
    const value = await stub.getValue();
    expect(value).toBe(1);
  });
});
```

### Internal State Inspection with runInDurableObject()

Access DO instance properties and storage directly:

```typescript
import { runInDurableObject } from "cloudflare:test";

describe("Counter Internal State", () => {
  it("verifies SQL storage contents", async () => {
    const id = env.COUNTER.idFromName("storage-test");
    const stub = env.COUNTER.get(id);

    await stub.increment();
    await stub.increment();

    await runInDurableObject(stub, async (instance, state) => {
      // Access SQL storage
      const result = state.storage.sql
        .exec("SELECT value FROM counters WHERE name = ?", "default")
        .one();

      expect(result.value).toBe(2);
    });
  });

  it("inspects instance properties", async () => {
    const id = env.COUNTER.idFromName("instance-test");
    const stub = env.COUNTER.get(id);

    await runInDurableObject(stub, async (instance: Counter) => {
      // Access private properties (for testing only!)
      expect(instance.initialized).toBe(true);
    });
  });
});
```

### Testing SQL Storage API

Verify database state with complex queries:

```typescript
describe("SQL Storage Testing", () => {
  it("handles batch inserts", async () => {
    const id = env.CHAT_ROOM.idFromName("batch-test");
    const stub = env.CHAT_ROOM.get(id);

    await stub.addMessages([
      { user: "alice", text: "Hello" },
      { user: "bob", text: "Hi" }
    ]);

    await runInDurableObject(stub, async (instance, state) => {
      const messages = state.storage.sql
        .exec("SELECT user, text FROM messages ORDER BY timestamp")
        .toArray();

      expect(messages).toHaveLength(2);
      expect(messages[0].user).toBe("alice");
      expect(messages[1].user).toBe("bob");
    });
  });

  it("verifies transactions", async () => {
    const id = env.COUNTER.idFromName("transaction-test");
    const stub = env.COUNTER.get(id);

    await runInDurableObject(stub, async (instance, state) => {
      // Execute transaction
      state.storage.sql.exec("BEGIN");
      state.storage.sql.exec("INSERT INTO counters (name, value) VALUES (?, ?)", "test", 100);
      state.storage.sql.exec("UPDATE counters SET value = value + 1 WHERE name = ?", "test");
      state.storage.sql.exec("COMMIT");

      const result = state.storage.sql
        .exec("SELECT value FROM counters WHERE name = ?", "test")
        .one();

      expect(result.value).toBe(101);
    });
  });
});
```

### Testing KV Storage API (Legacy)

For DOs using KV storage:

```typescript
describe("KV Storage Testing", () => {
  it("stores and retrieves values", async () => {
    const id = env.SESSION.idFromName("kv-test");
    const stub = env.SESSION.get(id);

    await stub.setSession({ userId: "123", token: "abc" });

    await runInDurableObject(stub, async (instance, state) => {
      const session = await state.storage.get("session");
      expect(session.userId).toBe("123");
      expect(session.token).toBe("abc");
    });
  });

  it("handles multiple keys", async () => {
    const id = env.SESSION.idFromName("multi-key-test");
    const stub = env.SESSION.get(id);

    await runInDurableObject(stub, async (instance, state) => {
      await state.storage.put("key1", "value1");
      await state.storage.put("key2", "value2");
      await state.storage.put("key3", "value3");

      const keys = await state.storage.list();
      expect(keys.size).toBe(3);
    });
  });
});
```

---

## Testing WebSocket Hibernation

**IMPORTANT**: WebSockets with `isolatedStorage: true` are NOT supported. Set `isolatedStorage: false` in vitest.config.ts:

```typescript
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        isolatedStorage: false, // Required for WebSocket tests
      },
    },
  },
});
```

### WebSocket Connection Testing

```typescript
import { getPlatformProxy } from "wrangler";

describe("WebSocket Hibernation", () => {
  it("accepts WebSocket connections", async () => {
    const id = env.CHAT_ROOM.idFromName("ws-test");
    const stub = env.CHAT_ROOM.get(id);

    // Create WebSocket pair
    const { 0: client, 1: server } = new WebSocketPair();

    await stub.handleWebSocket(server);

    await runInDurableObject(stub, async (instance, state) => {
      const sockets = await state.getWebSockets();
      expect(sockets).toHaveLength(1);
    });
  });

  it("handles WebSocket messages", async (test Done) => {
    const id = env.CHAT_ROOM.idFromName("message-test");
    const stub = env.CHAT_ROOM.get(id);

    const { 0: client, 1: server } = new WebSocketPair();

    client.addEventListener("message", (event) => {
      expect(event.data).toBe("Hello from DO");
      client.close();
      testDone();
    });

    await stub.handleWebSocket(server);
    client.send("ping");
  });
});
```

### Testing Hibernation Lifecycle

```typescript
describe("Hibernation API", () => {
  it("serializes and deserializes attachments", async () => {
    const id = env.CHAT_ROOM.idFromName("hibernation-test");
    const stub = env.CHAT_ROOM.get(id);

    const { 0: client, 1: server } = new WebSocketPair();

    // Attach metadata
    await stub.handleWebSocket(server, { userId: "alice", roomId: "123" });

    await runInDurableObject(stub, async (instance, state) => {
      const sockets = await state.getWebSockets();
      const attachment = await sockets[0].deserializeAttachment();

      expect(attachment.userId).toBe("alice");
      expect(attachment.roomId).toBe("123");
    });
  });
});
```

---

## Testing Alarms API

### Basic Alarm Testing

Use `runDurableObjectAlarm()` to trigger alarms immediately:

```typescript
import { runDurableObjectAlarm } from "cloudflare:test";

describe("Alarms API", () => {
  it("sets and triggers alarm", async () => {
    const id = env.CLEANUP.idFromName("alarm-test");
    const stub = env.CLEANUP.get(id);

    // Set alarm for 60 seconds from now
    await runInDurableObject(stub, async (instance, state) => {
      await state.storage.setAlarm(Date.now() + 60_000);
    });

    // Trigger alarm immediately (bypasses timer)
    const alarmRan = await runDurableObjectAlarm(stub);
    expect(alarmRan).toBe(true);

    // Verify alarm executed
    await runInDurableObject(stub, async (instance, state) => {
      const cleaned = state.storage.sql
        .exec("SELECT COUNT(*) as count FROM old_data")
        .one();

      expect(cleaned.count).toBe(0); // Old data cleaned up
    });
  });

  it("handles alarm errors gracefully", async () => {
    const id = env.CLEANUP.idFromName("error-test");
    const stub = env.CLEANUP.get(id);

    await runInDurableObject(stub, async (instance, state) => {
      await state.storage.setAlarm(Date.now() + 1000);
    });

    // This will trigger the alarm even if it throws
    try {
      await runDurableObjectAlarm(stub);
    } catch (error) {
      expect(error.message).toContain("Expected error");
    }
  });
});
```

### TTL Pattern Testing

```typescript
describe("TTL with Alarms", () => {
  it("auto-deletes expired items", async () => {
    const id = env.CACHE.idFromName("ttl-test");
    const stub = env.CACHE.get(id);

    // Set item with TTL
    await stub.set("key1", "value1", { ttl: 60 });

    // Trigger alarm that handles expiration
    await runDurableObjectAlarm(stub);

    // Verify item was deleted
    const value = await stub.get("key1");
    expect(value).toBeNull();
  });
});
```

### Known Issue: Alarms Don't Reset Between Tests

**CRITICAL**: Alarms are not reset between test runs and do not respect isolated storage.

**Workaround**: Always delete or run alarms in each test:

```typescript
afterEach(async () => {
  const id = env.CLEANUP.idFromName("alarm-test");
  const stub = env.CLEANUP.get(id);

  // Clear any pending alarms
  await runInDurableObject(stub, async (instance, state) => {
    await state.storage.deleteAlarm();
  });

  // OR trigger all alarms
  await runDurableObjectAlarm(stub);
});
```

---

## Isolated Storage Patterns

### Automatic Test Isolation

Each test gets isolated storage automatically—no manual cleanup needed:

```typescript
describe("Isolated Storage", () => {
  it("test 1 has fresh storage", async () => {
    const id = env.COUNTER.idFromName("isolation-test");
    const stub = env.COUNTER.get(id);

    const count = await stub.increment();
    expect(count).toBe(1); // Always starts at 1
  });

  it("test 2 has fresh storage", async () => {
    const id = env.COUNTER.idFromName("isolation-test");
    const stub = env.COUNTER.get(id); // Same name!

    const count = await stub.increment();
    expect(count).toBe(1); // Also starts at 1 (isolated)
  });
});
```

### Seeding Data with beforeAll()

Use `beforeAll()` to seed test data:

```typescript
describe("Seeded Tests", () => {
  beforeAll(async () => {
    const id = env.CHAT_ROOM.idFromName("seeded-room");
    const stub = env.CHAT_ROOM.get(id);

    // Seed initial messages
    await stub.addMessages([
      { user: "system", text: "Room created" },
      { user: "admin", text: "Welcome!" }
    ]);
  });

  it("sees seeded data", async () => {
    const id = env.CHAT_ROOM.idFromName("seeded-room");
    const stub = env.CHAT_ROOM.get(id);

    const messages = await stub.getMessages();
    expect(messages).toHaveLength(2);
  });

  it("can add to seeded data", async () => {
    const id = env.CHAT_ROOM.idFromName("seeded-room");
    const stub = env.CHAT_ROOM.get(id);

    await stub.addMessage({ user: "alice", text: "Hi" });

    const messages = await stub.getMessages();
    expect(messages).toHaveLength(3); // 2 seeded + 1 new
  });
});
```

---

## listDurableObjectIds() Usage

List all Durable Objects in a namespace:

```typescript
import { listDurableObjectIds } from "cloudflare:test";

describe("listDurableObjectIds", () => {
  it("lists all DOs in namespace", async () => {
    // Create multiple DOs
    const id1 = env.COUNTER.idFromName("counter-1");
    const id2 = env.COUNTER.idFromName("counter-2");
    const id3 = env.COUNTER.newUniqueId();

    const stub1 = env.COUNTER.get(id1);
    const stub2 = env.COUNTER.get(id2);
    const stub3 = env.COUNTER.get(id3);

    await stub1.increment();
    await stub2.increment();
    await stub3.increment();

    // List all IDs
    const ids = await listDurableObjectIds(env.COUNTER);

    expect(ids.length).toBe(3);
    expect(ids.some((id) => id.equals(id1))).toBe(true);
    expect(ids.some((id) => id.equals(id2))).toBe(true);
    expect(ids.some((id) => id.equals(id3))).toBe(true);
  });

  it("respects isolated storage", async () => {
    // This test sees only its own DOs, not those from other tests
    const id = env.COUNTER.idFromName("isolated-counter");
    const stub = env.COUNTER.get(id);
    await stub.increment();

    const ids = await listDurableObjectIds(env.COUNTER);
    expect(ids.length).toBe(1);
  });
});
```

---

## Integration Testing with SELF

Test full Worker → Durable Object workflows:

```typescript
import { SELF } from "cloudflare:test";

describe("Integration Tests", () => {
  it("routes HTTP requests to DO", async () => {
    const response = await SELF.fetch("http://example.com?id=test-counter", {
      method: "POST",
    });

    expect(response.status).toBe(200);

    const data = await response.json<{ count: number }>();
    expect(data.count).toBe(1);
  });

  it("handles multiple requests", async () => {
    // First request
    const res1 = await SELF.fetch("http://example.com?id=multi-test");
    const data1 = await res1.json<{ count: number }>();
    expect(data1.count).toBe(1);

    // Second request (same DO)
    const res2 = await SELF.fetch("http://example.com?id=multi-test");
    const data2 = await res2.json<{ count: number }>();
    expect(data2.count).toBe(2);
  });

  it("tests error handling", async () => {
    const response = await SELF.fetch("http://example.com?id=error-test", {
      method: "POST",
      headers: { "X-Trigger-Error": "true" },
    });

    expect(response.status).toBe(500);
    const error = await response.json<{ error: string }>();
    expect(error.error).toContain("Intentional error");
  });
});
```

---

## Best Practices

### 1. Use Direct RPC for Unit Tests

Test DO methods directly, not through HTTP:

```typescript
// ✅ GOOD: Direct RPC testing
it("increments counter", async () => {
  const stub = env.COUNTER.get(env.COUNTER.idFromName("test"));
  const count = await stub.increment();
  expect(count).toBe(1);
});

// ❌ BAD: HTTP testing for unit tests
it("increments counter", async () => {
  const response = await SELF.fetch("http://example.com/increment");
  // Slower, more complex, tests Worker + DO
});
```

### 2. Use runInDurableObject() for Internal State

Verify storage and internal state:

```typescript
it("stores data correctly", async () => {
  const stub = env.COUNTER.get(env.COUNTER.idFromName("storage-test"));
  await stub.increment();

  await runInDurableObject(stub, async (instance, state) => {
    const value = state.storage.sql
      .exec("SELECT value FROM counters WHERE name = ?", "default")
      .one();
    expect(value.value).toBe(1);
  });
});
```

### 3. Use SELF for Integration Tests

Test complete workflows:

```typescript
it("full user workflow", async () => {
  // Create user
  const createRes = await SELF.fetch("http://example.com/users", {
    method: "POST",
    body: JSON.stringify({ name: "Alice" }),
  });
  const user = await createRes.json();

  // Get user
  const getRes = await SELF.fetch(`http://example.com/users/${user.id}`);
  const retrieved = await getRes.json();
  expect(retrieved.name).toBe("Alice");
});
```

### 4. Test Alarms Without Delays

Always use `runDurableObjectAlarm()`:

```typescript
// ✅ GOOD: Immediate alarm execution
it("processes alarm", async () => {
  const stub = env.CLEANUP.get(env.CLEANUP.idFromName("test"));
  await runInDurableObject(stub, async (instance, state) => {
    await state.storage.setAlarm(Date.now() + 60_000);
  });
  await runDurableObjectAlarm(stub);
  // Verify alarm executed
});

// ❌ BAD: Waiting for real time
it("processes alarm", async () => {
  const stub = env.CLEANUP.get(env.CLEANUP.idFromName("test"));
  await runInDurableObject(stub, async (instance, state) => {
    await state.storage.setAlarm(Date.now() + 1000);
  });
  await new Promise((resolve) => setTimeout(resolve, 1100)); // Slow!
});
```

### 5. Trust Automatic Test Isolation

Don't manually clean up storage:

```typescript
// ✅ GOOD: Rely on automatic isolation
it("test 1", async () => {
  const stub = env.COUNTER.get(env.COUNTER.idFromName("test"));
  await stub.increment();
});

it("test 2", async () => {
  const stub = env.COUNTER.get(env.COUNTER.idFromName("test"));
  // Starts fresh automatically
  const count = await stub.increment();
  expect(count).toBe(1);
});

// ❌ BAD: Manual cleanup
afterEach(async () => {
  // Unnecessary!
  const stub = env.COUNTER.get(env.COUNTER.idFromName("test"));
  await runInDurableObject(stub, async (instance, state) => {
    await state.storage.deleteAll();
  });
});
```

---

## Running Tests

```bash
# Run all tests
npx vitest

# Watch mode
npx vitest --watch

# Run specific test file
npx vitest test/counter.test.ts

# Coverage report
npx vitest --coverage
```

---

## Sources

- [Testing with Durable Objects](https://developers.cloudflare.com/durable-objects/examples/testing-with-durable-objects/)
- [Vitest Integration](https://developers.cloudflare.com/workers/testing/vitest-integration/)
- [Test APIs](https://developers.cloudflare.com/workers/testing/vitest-integration/test-apis/)
- [Known Issues](https://developers.cloudflare.com/workers/testing/vitest-integration/known-issues/)
