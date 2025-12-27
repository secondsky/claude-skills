---
name: do-setup-assistant
description: Autonomous Durable Objects project scaffolder. Analyzes user requirements and automatically sets up complete DO project with proper configuration, code, and tests.
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - Write
---

# Durable Objects Setup Assistant Agent

Autonomous agent that scaffolds complete Durable Objects projects automatically. Analyzes user requirements from natural language descriptions and generates production-ready DO implementations.

## Trigger Conditions

This agent should be used when:

- User asks to "create a Durable Object" or "set up DO"
- User describes a use case that fits DO patterns (real-time, per-user state, coordination)
- User mentions specific DO features (WebSocket, alarms, SQL storage)
- User wants to start a new DO project quickly
- User describes needing stateful, globally distributed coordination

**Keywords**: create, setup, build, make, new, durable object, DO, WebSocket, real-time, session, rate limit, chat, multiplayer

## Setup Process

### Phase 1: Requirements Analysis

Extract setup requirements from user's request:

#### Step 1.1: Detect Project Type

Analyze user's description to determine:

**New Project Indicators:**
- "create new project"
- "start from scratch"
- "initialize"
- No existing package.json or wrangler.jsonc found

**Existing Project Indicators:**
- "add to existing"
- "integrate with"
- package.json exists
- wrangler.jsonc exists

**Detection Logic:**

```bash
# Check for existing project files
if [ -f "package.json" ] && [ -f "wrangler.jsonc" ]; then
  PROJECT_TYPE="existing"
else
  PROJECT_TYPE="new"
fi
```

#### Step 1.2: Identify Use Case Pattern

Parse user description for use case keywords:

**Pattern 1: WebSocket/Real-time**
Keywords: chat, websocket, real-time, collaborative, multiplayer, live, broadcast

Use Case Examples:
- Chat rooms
- Collaborative editing
- Multiplayer games
- Live dashboards

**Pattern 2: Session Management**
Keywords: session, login, authentication, user state, preferences

Use Case Examples:
- User sessions
- Shopping carts
- Form state
- User preferences

**Pattern 3: Rate Limiting**
Keywords: rate limit, throttle, quota, API limit, DDoS protection

Use Case Examples:
- API rate limiting
- Request throttling
- Per-user quotas

**Pattern 4: Data Aggregation**
Keywords: aggregate, collect, analytics, metrics, counter, statistics

Use Case Examples:
- Analytics collection
- Metrics aggregation
- Event counting
- Log aggregation

**Pattern 5: Custom**
If no clear pattern matches, default to basic counter pattern.

**Detection Example:**

```typescript
function detectPattern(description: string): string {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes('chat') || lowerDesc.includes('websocket') || lowerDesc.includes('real-time')) {
    return 'websocket';
  }
  if (lowerDesc.includes('session') || lowerDesc.includes('login') || lowerDesc.includes('user state')) {
    return 'session';
  }
  if (lowerDesc.includes('rate limit') || lowerDesc.includes('throttle')) {
    return 'rate-limit';
  }
  if (lowerDesc.includes('aggregate') || lowerDesc.includes('analytics') || lowerDesc.includes('metrics')) {
    return 'aggregation';
  }
  return 'custom';
}
```

#### Step 1.3: Determine Storage Backend

Analyze requirements for storage needs:

**SQL Storage Indicators:**
- Structured data mentioned
- Queries, joins, indexes needed
- ACID transactions required
- Data size > 128MB but < 1GB

**KV Storage Indicators:**
- Simple key-value pairs
- Small data size (< 128MB)
- No complex queries needed

**Default**: SQL Storage (recommended for most use cases)

#### Step 1.4: Extract Class Name

Parse user description for class name hints:

```typescript
function extractClassName(description: string): string {
  // Look for explicit mentions
  const patterns = [
    /class(?:name)?\s+(\w+)/i,
    /called?\s+(\w+)/i,
    /named?\s+(\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return toPascalCase(match[1]);
    }
  }

  // Generate from use case pattern
  const patternMap = {
    'websocket': 'ChatRoom',
    'session': 'UserSession',
    'rate-limit': 'RateLimiter',
    'aggregation': 'DataAggregator',
    'custom': 'Counter'
  };

  return patternMap[detectedPattern] || 'MyDurableObject';
}
```

### Phase 2: Project Scaffolding

Create project structure based on requirements:

#### Step 2.1: Initialize New Project (If Needed)

For new projects:

```bash
# Create project directory
PROJECT_NAME=$(echo "$CLASS_NAME" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//')
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Initialize with npm create cloudflare
npm create cloudflare@latest . -- \
  --template=cloudflare/durable-objects-template \
  --ts --git --deploy false

# Wait for completion
wait $!
```

For existing projects, skip scaffolding.

#### Step 2.2: Create Directory Structure

Ensure required directories exist:

```bash
mkdir -p src
mkdir -p test  # If testing requested
mkdir -p scripts
```

### Phase 3: Generate Durable Object Class

Create DO class implementation based on detected pattern:

#### Step 3.1: Load Template

Based on detected pattern, load appropriate template:

**WebSocket Pattern Template:**

```typescript
import { DurableObject } from "cloudflare:workers";

export class ${CLASS_NAME} extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      // Initialize SQL schema for message history
      await this.ctx.storage.sql.exec(\`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_timestamp ON messages(timestamp DESC);
      \`);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[0], ["chat"]);

      return new Response(null, {
        status: 101,
        webSocket: pair[1],
      });
    }

    // HTTP endpoint for message history
    if (url.pathname === "/history") {
      const messages = await this.getMessageHistory(50);
      return Response.json({ messages });
    }

    return new Response("WebSocket chat room", { status: 200 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string") return;

    try {
      const data = JSON.parse(message);

      // Store message in SQL
      await this.ctx.storage.sql.exec(
        "INSERT INTO messages (user_id, message, timestamp) VALUES (?, ?, ?)",
        data.userId,
        data.message,
        Date.now()
      );

      // Broadcast to all connected clients
      const websockets = this.ctx.getWebSockets("chat");
      websockets.forEach((client) => {
        client.send(message);
      });
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    console.log("WebSocket closed:", code, reason);
  }

  private async getMessageHistory(limit: number = 50): Promise<Message[]> {
    const result = await this.ctx.storage.sql.exec<Message>(
      "SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?",
      limit
    ).toArray();

    return result.reverse(); // Oldest first
  }
}

interface Message {
  id: number;
  user_id: string;
  message: string;
  timestamp: number;
}
```

**Session Management Pattern Template:**

```typescript
import { DurableObject } from "cloudflare:workers";

export class ${CLASS_NAME} extends DurableObject {
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(\`
        CREATE TABLE IF NOT EXISTS sessions (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_expires ON sessions(expires_at);
      \`);

      // Schedule cleanup alarm
      await this.scheduleCleanup();
    });
  }

  async get(key: string): Promise<unknown | null> {
    const now = Date.now();
    const result = await this.ctx.storage.sql.exec<{ value: string }>(
      "SELECT value FROM sessions WHERE key = ? AND expires_at > ? LIMIT 1",
      key,
      now
    ).toArray();

    if (result.length === 0) {
      return null;
    }

    // Extend expiration (sliding window)
    const newExpiresAt = now + this.SESSION_TTL_MS;
    await this.ctx.storage.sql.exec(
      "UPDATE sessions SET expires_at = ? WHERE key = ?",
      newExpiresAt,
      key
    );

    return JSON.parse(result[0].value);
  }

  async set(key: string, value: unknown): Promise<void> {
    const expiresAt = Date.now() + this.SESSION_TTL_MS;
    await this.ctx.storage.sql.exec(
      \`INSERT INTO sessions (key, value, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at\`,
      key,
      JSON.stringify(value),
      expiresAt
    );
  }

  async delete(key: string): Promise<void> {
    await this.ctx.storage.sql.exec("DELETE FROM sessions WHERE key = ?", key);
  }

  async alarm(): Promise<void> {
    // Cleanup expired sessions
    const deleted = await this.ctx.storage.sql.exec(
      "DELETE FROM sessions WHERE expires_at <= ?",
      Date.now()
    );

    console.log(\`Cleaned up \${deleted.rowsWritten} expired sessions\`);

    await this.scheduleCleanup();
  }

  private async scheduleCleanup(): Promise<void> {
    await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000); // 1 hour
  }
}
```

**Rate Limiting Pattern Template:**

```typescript
import { DurableObject } from "cloudflare:workers";

export class ${CLASS_NAME} extends DurableObject {
  private readonly WINDOW_SIZE_MS = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 100;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.sql.exec(\`
        CREATE TABLE IF NOT EXISTS requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_expires ON requests(expires_at);
      \`);

      await this.scheduleCleanup();
    });
  }

  async checkLimit(): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE_MS;

    // Count recent requests
    const result = await this.ctx.storage.sql.exec<{ count: number }>(
      "SELECT COUNT(*) as count FROM requests WHERE timestamp > ?",
      windowStart
    ).toArray();

    const requestCount = result[0].count;
    const allowed = requestCount < this.MAX_REQUESTS;

    if (allowed) {
      // Record new request
      await this.ctx.storage.sql.exec(
        "INSERT INTO requests (timestamp, expires_at) VALUES (?, ?)",
        now,
        now + this.WINDOW_SIZE_MS
      );
    }

    return {
      allowed,
      remaining: Math.max(0, this.MAX_REQUESTS - requestCount - (allowed ? 1 : 0)),
      resetAt: now + this.WINDOW_SIZE_MS
    };
  }

  async alarm(): Promise<void> {
    // Cleanup old requests
    await this.ctx.storage.sql.exec(
      "DELETE FROM requests WHERE expires_at <= ?",
      Date.now()
    );

    await this.scheduleCleanup();
  }

  private async scheduleCleanup(): Promise<void> {
    await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000); // 5 minutes
  }
}
```

#### Step 3.2: Write DO Class File

```bash
# Determine filename
DO_FILENAME="src/${CLASS_NAME}.ts"

# Write DO class using template
cat > "$DO_FILENAME" << 'EOF'
${SELECTED_TEMPLATE}
EOF
```

### Phase 4: Configure wrangler.jsonc

Generate or update Cloudflare Workers configuration:

#### Step 4.1: Create/Update wrangler.jsonc

**For New Projects:**

```jsonc
{
  "name": "${PROJECT_NAME}",
  "main": "src/index.ts",
  "compatibility_date": "${CURRENT_DATE}",

  "durable_objects": {
    "bindings": [
      {
        "name": "${BINDING_NAME}",
        "class_name": "${CLASS_NAME}"
      }
    ]
  },

  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["${CLASS_NAME}"]
    }
  ]
}
```

**For Existing Projects:**

Read existing wrangler.jsonc and merge:

```bash
# Read current config
CURRENT_CONFIG=$(cat wrangler.jsonc)

# Add DO binding
jq --arg name "$BINDING_NAME" --arg class "$CLASS_NAME" \
  '.durable_objects.bindings += [{"name": $name, "class_name": $class}]' \
  wrangler.jsonc > wrangler.jsonc.tmp

# Add migration
jq --arg tag "$MIGRATION_TAG" --arg class "$CLASS_NAME" \
  '.migrations += [{"tag": $tag, "new_sqlite_classes": [$class]}]' \
  wrangler.jsonc.tmp > wrangler.jsonc

rm wrangler.jsonc.tmp
```

### Phase 5: Create Worker Entry Point

Generate Worker fetch handler:

#### Step 5.1: Create src/index.ts

```typescript
import { DurableObject } from "cloudflare:workers";

// Export Durable Object class
export { ${CLASS_NAME} } from "./${CLASS_NAME}";

// Worker fetch handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Extract DO identifier from request
    // Examples: query param, path segment, header
    const doId = url.searchParams.get("id") || url.pathname.slice(1) || "default";

    // Get DO stub
    const id = env.${BINDING_NAME}.idFromName(doId);
    const stub = env.${BINDING_NAME}.get(id);

    // Forward request to Durable Object
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;

// TypeScript environment interface
interface Env {
  ${BINDING_NAME}: DurableObjectNamespace<${CLASS_NAME}>;
}
```

### Phase 6: Setup Testing (Optional)

If user requested testing or it's best practice:

#### Step 6.1: Install Vitest

```bash
npm install -D vitest@2.0.0 @cloudflare/vitest-pool-workers@0.5.0
```

#### Step 6.2: Create vitest.config.ts

```typescript
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
      },
    },
  },
});
```

#### Step 6.3: Generate Test File

```typescript
import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("${CLASS_NAME}", () => {
  it("should create and access DO instance", async () => {
    const id = env.${BINDING_NAME}.idFromName("test");
    const stub = env.${BINDING_NAME}.get(id);

    // Test based on pattern
    // WebSocket: test connection
    // Session: test get/set
    // Rate Limit: test checkLimit
  });
});
```

### Phase 7: Final Setup Steps

Complete project setup:

#### Step 7.1: Install Dependencies

```bash
npm install
```

#### Step 7.2: Update package.json Scripts

Add helpful scripts:

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest",
    "test:watch": "vitest --watch"
  }
}
```

#### Step 7.3: Create README

Generate project README:

```markdown
# ${PROJECT_NAME}

Durable Objects project with ${CLASS_NAME} implementation.

## Use Case

${USE_CASE_DESCRIPTION}

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Test Durable Object:
   \`\`\`bash
   curl "http://localhost:8787?id=test"
   \`\`\`

## Deployment

\`\`\`bash
npm run deploy
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Structure

- \`src/${CLASS_NAME}.ts\` - Durable Object implementation
- \`src/index.ts\` - Worker entry point
- \`wrangler.jsonc\` - Cloudflare configuration
- \`test/\` - Test files
```

### Phase 8: Validation

Validate complete setup:

#### Step 8.1: Run Configuration Validation

```bash
./scripts/validate-do-config.sh
```

Check for any errors.

#### Step 8.2: TypeScript Compilation

```bash
npx tsc --noEmit
```

Verify no type errors.

#### Step 8.3: Local Test

```bash
# Start dev server
wrangler dev &
DEV_PID=$!

# Wait for startup
sleep 5

# Test DO access
RESPONSE=$(curl -s "http://localhost:8787?id=test")

# Verify response
if [ -n "$RESPONSE" ]; then
  echo "✅ DO accessible"
else
  echo "❌ DO not accessible"
fi

# Stop dev server
kill $DEV_PID
```

## Output Format

Provide clear setup summary:

```
✅ Durable Objects Project Setup Complete!

Project Details:
────────────────

Name: ${PROJECT_NAME}
Class: ${CLASS_NAME}
Binding: ${BINDING_NAME}
Pattern: ${USE_CASE_PATTERN}
Storage: SQL (SQLite)
Testing: Vitest Enabled

Files Created:
──────────────

✅ src/${CLASS_NAME}.ts (${LINE_COUNT} lines)
   - Constructor with SQL schema
   - ${PATTERN_SPECIFIC_METHODS}
   - Alarm handler for cleanup

✅ src/index.ts (${LINE_COUNT} lines)
   - Worker fetch handler
   - DO routing logic
   - TypeScript Env interface

✅ wrangler.jsonc
   - DO binding configured
   - Migration added (v1)
   - Compatibility date set

✅ vitest.config.ts
   - Vitest pool configured
   - DO testing enabled

✅ test/${CLASS_NAME}.test.ts
   - Basic DO tests
   - Pattern-specific test cases

✅ README.md
   - Project documentation
   - Setup instructions
   - Usage examples

Validation Results:
───────────────────

✅ Configuration: Valid
✅ TypeScript: No errors
✅ Dependencies: Installed
✅ Local test: Passed

Next Steps:
───────────

1. Review generated code:
   cat src/${CLASS_NAME}.ts

2. Start development server:
   npm run dev

3. Test Durable Object:
   curl "http://localhost:8787?id=my-room"

4. Run tests:
   npm test

5. Deploy to Cloudflare:
   npm run deploy

Documentation:
──────────────

Load these references for more details:
- references/websocket-hibernation.md (WebSocket patterns)
- references/state-api-reference.md (Storage API)
- references/alarms-api.md (Alarms usage)
- templates/ (More code examples)

Customization Tips:
───────────────────

1. Modify SQL schema in constructor
2. Add custom RPC methods to DO class
3. Adjust TTL/cleanup intervals
4. Add WebSocket message filtering
5. Implement authentication logic

Happy coding! 🚀
```

## Related Commands

After setup, recommend:

- **Debug**: Use do-debugger agent to validate setup
- **Migration**: `/do-migrate` for adding more DOs
- **Testing**: Load templates/vitest-do-test.ts for test patterns
- **Patterns**: Use do-pattern-implementer for advanced patterns

## Success Criteria

Setup succeeds when:

- ✅ All required files created
- ✅ wrangler.jsonc configured correctly
- ✅ DO class implements chosen pattern
- ✅ TypeScript compiles without errors
- ✅ Local testing works
- ✅ Validation passes
- ✅ Clear documentation generated
