# TypeScript Configuration for Durable Objects

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27
**Official Docs**: https://developers.cloudflare.com/durable-objects/

## Overview

Complete guide to TypeScript configuration, types, and patterns for Durable Objects development.

---

## wrangler.jsonc Configuration

**Basic Structure**:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",

  // Durable Objects Configuration
  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",           // Binding name (used in Env interface)
        "class_name": "Counter",     // DO class name (must match export)
        "script_name": "my-worker"   // Optional: for external DOs
      }
    ]
  },

  // Migrations (REQUIRED for new DOs)
  "migrations": [
    {
      "tag": "v1",                              // Unique tag
      "new_sqlite_classes": ["Counter"]         // New DOs with SQL storage
    },
    {
      "tag": "v2",
      "renamed_classes": [
        { "from": "Counter", "to": "CounterV2" }  // Rename DO class
      ]
    }
  ]
}
```

**Multiple Durable Objects**:

```jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "COUNTER", "class_name": "Counter" },
      { "name": "CHAT_ROOM", "class_name": "ChatRoom" },
      { "name": "USER_SESSION", "class_name": "UserSession" }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["Counter", "ChatRoom", "UserSession"]
    }
  ]
}
```

---

## TypeScript Types

### Core Imports

```typescript
import {
  DurableObject,
  DurableObjectState,
  DurableObjectNamespace,
  DurableObjectId,
  DurableObjectStub,
} from 'cloudflare:workers';
```

### Environment Interface

```typescript
interface Env {
  // Durable Object Bindings
  COUNTER: DurableObjectNamespace<Counter>;
  CHAT_ROOM: DurableObjectNamespace<ChatRoom>;

  // Other bindings
  MY_KV: KVNamespace;
  MY_BUCKET: R2Bucket;
  DATABASE: D1Database;

  // Environment variables
  API_KEY: string;
}
```

### Durable Object Class with Types

```typescript
export class Counter extends DurableObject<Env> {
  private value: number = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Load state from storage
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<number>("value");
      this.value = stored ?? 0;
    });
  }

  async increment(): Promise<number> {
    this.value++;
    await this.ctx.storage.put("value", this.value);
    return this.value;
  }

  async getValue(): Promise<number> {
    return this.value;
  }
}

// CRITICAL: Export as default
export default Counter;
```

### Worker with DO Bindings

```typescript
interface Env {
  COUNTER: DurableObjectNamespace<Counter>;
}

// Export DO class
export { Counter };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Create or get DO instance
    const id: DurableObjectId = env.COUNTER.idFromName("global");
    const stub: DurableObjectStub<Counter> = env.COUNTER.get(id);

    // Call RPC method
    const count: number = await stub.increment();

    return new Response(`Count: ${count}`);
  },
};
```

---

## Advanced Type Patterns

### Generic Durable Object

```typescript
interface StorageItem<T> {
  value: T;
  timestamp: number;
}

export class GenericStore<T> extends DurableObject {
  async set(key: string, value: T): Promise<void> {
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
    };
    await this.ctx.storage.put(key, item);
  }

  async get(key: string): Promise<T | null> {
    const item = await this.ctx.storage.get<StorageItem<T>>(key);
    return item?.value ?? null;
  }
}
```

### Typed RPC Methods

```typescript
interface CounterMethods {
  increment(): Promise<number>;
  decrement(): Promise<number>;
  getValue(): Promise<number>;
  reset(): Promise<void>;
}

export class Counter extends DurableObject implements CounterMethods {
  async increment(): Promise<number> {
    // Implementation
    return 1;
  }

  async decrement(): Promise<number> {
    // Implementation
    return 0;
  }

  async getValue(): Promise<number> {
    // Implementation
    return 0;
  }

  async reset(): Promise<void> {
    // Implementation
  }
}

// Usage with type safety
const stub: DurableObjectStub<Counter> & CounterMethods = env.COUNTER.get(id);
await stub.increment(); // Type-safe!
```

### State API Types

```typescript
// SQL Storage
type SqlResult = {
  one<T>(): T | null;
  toArray<T>(): T[];
};

// KV Storage (Legacy)
interface KVStorageAPI {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<Map<string, any>>;
}

// Using typed storage
export class TypedStorage extends DurableObject {
  async storeUser(userId: string, user: User): Promise<void> {
    await this.ctx.storage.sql.exec(
      "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
      userId,
      user.name,
      user.email
    );
  }

  async getUser(userId: string): Promise<User | null> {
    return this.ctx.storage.sql
      .exec<User>("SELECT * FROM users WHERE id = ?", userId)
      .one();
  }
}

interface User {
  id: string;
  name: string;
  email: string;
}
```

---

## tsconfig.json Configuration

### Recommended Settings

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### With Vitest Testing

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "types": [
      "@cloudflare/workers-types",
      "@cloudflare/vitest-pool-workers"
    ],
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*", "test/**/*"]
}
```

---

## Common Type Issues & Solutions

### Issue 1: DO Not Exported

```typescript
// ❌ WRONG: Not exported as default
export class Counter extends DurableObject {}

// ✅ CORRECT: Export as default
export class Counter extends DurableObject {}
export default Counter;
```

### Issue 2: Binding Name Mismatch

```typescript
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [
      { "name": "COUNTER", "class_name": "Counter" }
    ]
  }
}

// ❌ WRONG: Mismatched binding name
interface Env {
  MY_COUNTER: DurableObjectNamespace<Counter>; // Wrong!
}

// ✅ CORRECT: Match binding name exactly
interface Env {
  COUNTER: DurableObjectNamespace<Counter>;
}
```

### Issue 3: Missing Generic Parameter

```typescript
// ❌ WRONG: Missing Env generic
export class Counter extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env); // Type error!
  }
}

// ✅ CORRECT: Include Env generic
export class Counter extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
}
```

### Issue 4: Async Constructor

```typescript
// ❌ WRONG: Async constructor
export class Counter extends DurableObject {
  async constructor(ctx: DurableObjectState, env: Env) { // Invalid!
    super(ctx, env);
    await this.loadData();
  }
}

// ✅ CORRECT: Use blockConcurrencyWhile
export class Counter extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    ctx.blockConcurrencyWhile(async () => {
      await this.loadData();
    });
  }

  private async loadData(): Promise<void> {
    // Async initialization
  }
}
```

---

## Versioning & Compatibility

### Package Versions

```json
{
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20251125.0",
    "wrangler": "^4.50.0",
    "typescript": "^5.6.0"
  }
}
```

### Compatibility Dates

```jsonc
{
  "compatibility_date": "2025-01-01",  // Use latest date
  "compatibility_flags": [
    "nodejs_compat"  // If using Node.js APIs
  ]
}
```

---

## Sources

- [Get started](https://developers.cloudflare.com/durable-objects/get-started/)
- [TypeScript](https://developers.cloudflare.com/workers/languages/typescript/)
- [Workers Types](https://github.com/cloudflare/workers-types)
