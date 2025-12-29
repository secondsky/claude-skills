---
name: cloudflare-durable-objects:setup
description: Interactive Durable Objects project initialization. Scaffolds new DO project with proper bindings, migrations, and boilerplate code.
---

# Durable Objects Setup Command

Interactive command to initialize a new Durable Objects project with proper configuration, bindings, migrations, and boilerplate code.

## Overview

This command guides through the complete setup process for Cloudflare Durable Objects, ensuring correct configuration from the start. It handles:

- Project scaffolding (new or existing project)
- Durable Object class creation with proper exports
- wrangler.jsonc configuration (bindings, migrations)
- TypeScript setup and type definitions
- Test environment setup (optional Vitest)
- Template selection (basic, WebSocket, SQL storage)

## Step 1: Gather Project Requirements

Use AskUserQuestion tool to collect setup preferences:

### Question 1: Project Type
**Question**: "Are you setting up a new project or adding Durable Objects to an existing project?"
**Header**: "Project Type"
**Options**:
- **New Project** - Create new Cloudflare Workers project with Durable Objects
  - Description: "Scaffold a complete new project using `npm create cloudflare@latest`"
- **Existing Project** - Add Durable Objects to existing Workers project
  - Description: "Configure Durable Objects in an existing wrangler.jsonc"

### Question 2: Storage Backend
**Question**: "Which storage backend do you want to use for your Durable Object?"
**Header**: "Storage Backend"
**Options**:
- **SQL Storage (Recommended)** - SQLite with 1GB limit per DO instance
  - Description: "Structured data with ACID transactions, recommended for most use cases"
- **Key-Value Storage** - Simple KV storage with 128MB limit
  - Description: "Simpler API, good for basic state management"
- **Both SQL + KV** - Use both storage backends
  - Description: "SQL for structured data, KV for simple key-value pairs"

### Question 3: Use Case Pattern
**Question**: "What will your Durable Object primarily be used for?"
**Header**: "Use Case"
**Options**:
- **WebSocket Chat/Real-time** - WebSocket server with hibernation
  - Description: "Chat rooms, collaborative editing, multiplayer games"
- **Session Management** - Per-user session storage
  - Description: "User sessions, authentication state, preferences"
- **Rate Limiting** - Request rate limiting per user/IP
  - Description: "API rate limiting, DDoS protection"
- **Data Aggregation** - Collect and aggregate data
  - Description: "Analytics, metrics collection, data pipelines"
- **Custom/Other** - General-purpose Durable Object
  - Description: "Start with basic template and customize"

### Question 4: Testing Setup
**Question**: "Do you want to set up Vitest for testing your Durable Objects?"
**Header**: "Testing"
**Options**:
- **Yes (Recommended)** - Install and configure Vitest with @cloudflare/vitest-pool-workers
  - Description: "Enables unit testing with isolated DO storage"
- **No** - Skip test setup
  - Description: "Can add testing later if needed"

## Step 2: Validate Environment

Before proceeding with setup, validate the development environment:

### Check Prerequisites

Run validation checks:

```bash
# Check Node.js version (18+ required)
node --version

# Check if wrangler is installed
wrangler --version

# Check if in valid directory
pwd
```

### Validation Logic

If **New Project**:
- Verify not inside existing Node project (no package.json)
- Check directory is empty or confirm overwrite

If **Existing Project**:
- Verify package.json exists
- Verify wrangler.jsonc exists
- Check for existing DO bindings (warn if found)

### Installation Commands

If wrangler not installed:
```bash
npm install -g wrangler@latest
```

If wrong Node.js version:
```bash
# Recommend using nvm to install Node 18+
nvm install 18
nvm use 18
```

## Step 3: Project Scaffolding

Execute setup based on user selections:

### For New Project

Run npm create cloudflare:
```bash
npm create cloudflare@latest my-durable-objects-app -- \
  --template=cloudflare/durable-objects-template \
  --ts --git --deploy false

cd my-durable-objects-app
```

### For Existing Project

No scaffolding needed, proceed to configuration.

## Step 4: Create Durable Object Class

Generate DO class file based on selected use case pattern:

### Determine File Path

- Check if `src/` directory exists, otherwise create it
- Create DO class file: `src/DurableObject.ts` (or custom name from user)

### Generate Class Code

Based on **Use Case Pattern** selection:

#### WebSocket Chat/Real-time Pattern

```typescript
import { DurableObject } from "cloudflare:workers";

export class ChatRoom extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      // Initialize SQL schema for message history
      if (STORAGE_BACKEND includes "SQL") {
        await this.ctx.storage.sql.exec(`
          CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp INTEGER NOT NULL
          )
        `);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[0]);
      return new Response(null, { status: 101, webSocket: pair[1] });
    }

    return new Response("WebSocket endpoint", { status: 200 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Broadcast to all connected clients
    const websockets = this.ctx.getWebSockets();
    websockets.forEach((client) => {
      client.send(message);
    });

    // Store message in SQL (if enabled)
    if (STORAGE_BACKEND includes "SQL") {
      const data = typeof message === "string" ? JSON.parse(message) : null;
      if (data) {
        await this.ctx.storage.sql.exec(
          "INSERT INTO messages (user_id, message, timestamp) VALUES (?, ?, ?)",
          data.userId,
          data.message,
          Date.now()
        );
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    console.log("WebSocket closed:", code, reason);
  }
}
```

#### Session Management Pattern

```typescript
import { DurableObject } from "cloudflare:workers";

export class UserSession extends DurableObject {
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      if (STORAGE_BACKEND includes "SQL") {
        await this.ctx.storage.sql.exec(`
          CREATE TABLE IF NOT EXISTS sessions (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            expires_at INTEGER NOT NULL
          )
        `);
      }

      // Schedule cleanup alarm
      await this.scheduleCleanup();
    });
  }

  async get(key: string): Promise<unknown | null> {
    const now = Date.now();

    if (STORAGE_BACKEND === "SQL") {
      const result = await this.ctx.storage.sql.exec<{ value: string }>(
        "SELECT value FROM sessions WHERE key = ? AND expires_at > ?",
        key,
        now
      ).toArray();
      return result[0] ? JSON.parse(result[0].value) : null;
    } else {
      return await this.ctx.storage.get(key);
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    const expiresAt = Date.now() + this.SESSION_TTL_MS;

    if (STORAGE_BACKEND === "SQL") {
      await this.ctx.storage.sql.exec(
        `INSERT INTO sessions (key, value, expires_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at`,
        key,
        JSON.stringify(value),
        expiresAt
      );
    } else {
      await this.ctx.storage.put(key, value);
    }
  }

  async alarm(): Promise<void> {
    // Cleanup expired sessions
    if (STORAGE_BACKEND === "SQL") {
      await this.ctx.storage.sql.exec(
        "DELETE FROM sessions WHERE expires_at <= ?",
        Date.now()
      );
    }

    await this.scheduleCleanup();
  }

  private async scheduleCleanup(): Promise<void> {
    await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000); // 1 hour
  }
}
```

#### Rate Limiting Pattern

```typescript
import { DurableObject } from "cloudflare:workers";

export class RateLimiter extends DurableObject {
  private readonly WINDOW_SIZE_MS = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 100;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      if (STORAGE_BACKEND includes "SQL") {
        await this.ctx.storage.sql.exec(`
          CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
          )
        `);
      }

      await this.scheduleCleanup();
    });
  }

  async checkLimit(): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE_MS;

    let requestCount = 0;

    if (STORAGE_BACKEND === "SQL") {
      const result = await this.ctx.storage.sql.exec<{ count: number }>(
        "SELECT COUNT(*) as count FROM requests WHERE timestamp > ?",
        windowStart
      ).toArray();
      requestCount = result[0].count;
    } else {
      const timestamps = (await this.ctx.storage.get<number[]>("requests")) || [];
      const validTimestamps = timestamps.filter(ts => ts > windowStart);
      requestCount = validTimestamps.length;
    }

    const allowed = requestCount < this.MAX_REQUESTS;

    if (allowed) {
      if (STORAGE_BACKEND === "SQL") {
        await this.ctx.storage.sql.exec(
          "INSERT INTO requests (timestamp, expires_at) VALUES (?, ?)",
          now,
          now + this.WINDOW_SIZE_MS
        );
      } else {
        const timestamps = (await this.ctx.storage.get<number[]>("requests")) || [];
        timestamps.push(now);
        await this.ctx.storage.put("requests", timestamps);
      }
    }

    return {
      allowed,
      remaining: Math.max(0, this.MAX_REQUESTS - requestCount - (allowed ? 1 : 0))
    };
  }

  async alarm(): Promise<void> {
    if (STORAGE_BACKEND === "SQL") {
      await this.ctx.storage.sql.exec(
        "DELETE FROM requests WHERE expires_at <= ?",
        Date.now()
      );
    }

    await this.scheduleCleanup();
  }

  private async scheduleCleanup(): Promise<void> {
    await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000); // 5 minutes
  }
}
```

#### Custom/Other Pattern

Use basic counter example:

```typescript
import { DurableObject } from "cloudflare:workers";

export class Counter extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      if (STORAGE_BACKEND includes "SQL") {
        await this.ctx.storage.sql.exec(`
          CREATE TABLE IF NOT EXISTS counters (
            id INTEGER PRIMARY KEY,
            value INTEGER NOT NULL DEFAULT 0
          )
        `);

        // Initialize counter if not exists
        await this.ctx.storage.sql.exec(
          "INSERT OR IGNORE INTO counters (id, value) VALUES (1, 0)"
        );
      }
    });
  }

  async increment(): Promise<number> {
    if (STORAGE_BACKEND === "SQL") {
      await this.ctx.storage.sql.exec(
        "UPDATE counters SET value = value + 1 WHERE id = 1"
      );
      const result = await this.ctx.storage.sql.exec<{ value: number }>(
        "SELECT value FROM counters WHERE id = 1"
      ).toArray();
      return result[0].value;
    } else {
      let value = (await this.ctx.storage.get<number>("value")) || 0;
      value += 1;
      await this.ctx.storage.put("value", value);
      return value;
    }
  }

  async getCount(): Promise<number> {
    if (STORAGE_BACKEND === "SQL") {
      const result = await this.ctx.storage.sql.exec<{ value: number }>(
        "SELECT value FROM counters WHERE id = 1"
      ).toArray();
      return result[0].value;
    } else {
      return (await this.ctx.storage.get<number>("value")) || 0;
    }
  }

  async reset(): Promise<void> {
    if (STORAGE_BACKEND === "SQL") {
      await this.ctx.storage.sql.exec(
        "UPDATE counters SET value = 0 WHERE id = 1"
      );
    } else {
      await this.ctx.storage.put("value", 0);
    }
  }
}
```

**Note**: Replace `STORAGE_BACKEND` placeholder with actual storage choice from user selection.

## Step 5: Configure wrangler.jsonc

Update or create wrangler.jsonc with proper DO configuration:

### Generate Configuration

```jsonc
{
  "name": "PROJECT_NAME",
  "main": "src/index.ts",
  "compatibility_date": "CURRENT_DATE",

  "durable_objects": {
    "bindings": [
      {
        "name": "BINDING_NAME",
        "class_name": "CLASS_NAME"
      }
    ]
  },

  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["CLASS_NAME"]
    }
  ]
}
```

### Configuration Values

- **PROJECT_NAME**: From user input or directory name
- **BINDING_NAME**: Uppercase snake_case of class name (e.g., `CHAT_ROOM`)
- **CLASS_NAME**: PascalCase class name (e.g., `ChatRoom`)
- **CURRENT_DATE**: Today's date in YYYY-MM-DD format
- **new_sqlite_classes**: Only include if SQL Storage selected

### Merge Strategy

If **Existing Project** with existing wrangler.jsonc:
- Read current configuration
- Add new binding to `durable_objects.bindings` array
- Add new migration to `migrations` array
- Preserve all existing configuration

## Step 6: Create Worker Entry Point

Generate or update Worker entry point (src/index.ts):

```typescript
import { DurableObject } from "cloudflare:workers";

// Import Durable Object class
export { CLASS_NAME } from "./DurableObject";

// Worker fetch handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Example: Route to DO based on room ID
    const doName = url.searchParams.get("id") || "default";
    const id = env.BINDING_NAME.idFromName(doName);
    const stub = env.BINDING_NAME.get(id);

    // Forward request to Durable Object
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;

// TypeScript environment interface
interface Env {
  BINDING_NAME: DurableObjectNamespace<CLASS_NAME>;
}
```

**Note**: Replace placeholders with actual values from configuration.

## Step 7: Setup Testing (Optional)

If user selected **Yes** for testing setup:

### Install Vitest Packages

```bash
npm install -D vitest@2.0.0 @cloudflare/vitest-pool-workers@0.5.0
```

### Create vitest.config.ts

Use the setup script:

```bash
# Run the setup-vitest-do.sh script from skill
./scripts/setup-vitest-do.sh
```

Or create manually using template from `references/vitest-testing.md`.

### Generate Example Test

Create `test/do.test.ts`:

```typescript
import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("CLASS_NAME", () => {
  it("should work correctly", async () => {
    const id = env.BINDING_NAME.idFromName("test");
    const stub = env.BINDING_NAME.get(id);

    // Add your test logic here
    // Example for Counter:
    // const count = await stub.increment();
    // expect(count).toBe(1);
  });
});
```

## Step 8: Validation and Next Steps

Validate the complete setup:

### Run Validation Script

```bash
./scripts/validate-do-config.sh
```

Check for:
- Bindings configured correctly
- Migrations present
- Class exports match bindings
- No common configuration errors

### Display Summary

Show setup summary:

```
✅ Durable Objects Setup Complete!

Configuration:
  - Project: PROJECT_NAME
  - Durable Object: CLASS_NAME
  - Binding: BINDING_NAME
  - Storage: STORAGE_TYPE
  - Pattern: USE_CASE
  - Testing: VITEST_ENABLED

Files Created:
  - src/DurableObject.ts (CLASS_NAME implementation)
  - src/index.ts (Worker entry point)
  - wrangler.jsonc (DO configuration)
  [- vitest.config.ts (if testing enabled)]
  [- test/do.test.ts (if testing enabled)]

Next Steps:
  1. Review generated code in src/
  2. Customize DO logic for your use case
  3. Test locally:
     wrangler dev
  4. Run tests (if enabled):
     npm test
  5. Deploy to Cloudflare:
     wrangler deploy

Documentation:
  - Load references/websocket-hibernation.md for WebSocket patterns
  - Load references/state-api-reference.md for storage API
  - Load references/alarms-api.md for scheduled tasks
  - Load templates/ directory for more examples
```

### Offer Additional Help

Ask if user needs:
- Help testing the DO locally
- Guidance on implementing specific features
- Migration from existing architecture
- Performance optimization tips

## Error Handling

Handle common setup errors gracefully:

### Missing Prerequisites

If wrangler not installed:
```
Error: wrangler not found
Install: npm install -g wrangler@latest
```

### Invalid Directory

If trying to create new project in non-empty directory:
```
Warning: Directory not empty
Options:
  1. Choose different directory
  2. Continue and merge with existing files
  3. Cancel setup
```

### Configuration Conflicts

If DO binding name already exists:
```
Warning: Binding 'MY_DO' already exists in wrangler.jsonc
Options:
  1. Use different binding name
  2. Replace existing configuration
  3. Cancel setup
```

## Related Resources

After setup completion, recommend relevant resources:

- **references/best-practices.md** - Production patterns
- **templates/** - More code examples
- **scripts/validate-do-config.sh** - Validate configuration
- **scripts/migration-generator.sh** - Generate migrations
- **/do-migrate** - Interactive migration assistant
- **/do-debug** - Debug DO issues

## Success Criteria

Setup is successful when:
- ✅ wrangler.jsonc has valid DO configuration
- ✅ Durable Object class exported correctly
- ✅ Worker entry point routes to DO
- ✅ Migration configured (for SQL storage)
- ✅ `wrangler dev` starts without errors
- ✅ Tests pass (if enabled)
