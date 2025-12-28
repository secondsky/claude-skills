---
name: do-pattern-implementer
description: Autonomous production pattern implementer for Durable Objects. Analyzes existing DO code and adds advanced patterns like TTL cleanup, gradual deployments, RPC metadata, and performance optimizations.
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - Write
---

# Durable Objects Pattern Implementer Agent

Autonomous agent that analyzes existing Durable Objects and implements advanced production patterns. Enhances DO implementations with best practices for reliability, performance, and maintainability.

## Trigger Conditions

This agent should be used when:

- User wants to add production patterns to existing DO
- User mentions "optimize my DO", "add TTL cleanup", "implement gradual deployment"
- User asks about best practices or production readiness
- User needs to improve DO performance, reliability, or maintainability
- User requests implementation of specific patterns (RPC metadata, WebSocket optimization, etc.)

**Keywords**: optimize, production, best practice, TTL, cleanup, gradual deployment, RPC metadata, performance, scale, improve

## Implementation Process

### Phase 1: Analysis

Analyze existing DO implementation to understand current state:

#### Step 1.1: Locate DO Classes

Find all Durable Object classes in project:

```bash
# Find DO class files
grep -r "extends DurableObject" src/ --include="*.ts" -l

# Extract class names
grep -r "export class.*extends DurableObject" src/ --include="*.ts" -o | \
  sed 's/export class \(.*\) extends DurableObject/\1/'
```

Store:
- Class names
- File paths
- Export statements

#### Step 1.2: Read DO Implementation

For each DO class, read complete implementation:

```bash
cat src/MyDO.ts
```

Extract:
- Storage type (SQL vs KV)
- Methods implemented
- WebSocket usage (if any)
- Alarm handler (if any)
- Constructor complexity

#### Step 1.3: Detect Current Patterns

Identify what patterns are already implemented:

**Pattern Detection Checklist:**

```bash
# TTL Cleanup
grep -q "setAlarm.*cleanup\|DELETE.*WHERE.*expires" src/MyDO.ts
TTL_IMPLEMENTED=$?

# RPC Metadata
grep -q "RpcTarget" src/
RPC_METADATA=$?

# WebSocket Hibernation
grep -q "acceptWebSocket\|webSocketMessage" src/MyDO.ts
WEBSOCKET=$?

# Performance Optimization
grep -q "CREATE INDEX\|PRAGMA" src/MyDO.ts
INDEXES=$?

# Gradual Deployment
grep -q "version.*split\|canary" wrangler.jsonc
GRADUAL_DEPLOY=$?
```

#### Step 1.4: Identify Missing Patterns

Based on use case and current implementation, recommend patterns:

**Recommendation Logic:**

```typescript
interface PatternRecommendation {
  pattern: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  benefit: string;
}

function recommendPatterns(doClass: DOAnalysis): PatternRecommendation[] {
  const recommendations: PatternRecommendation[] = [];

  // TTL Cleanup (critical if unbounded growth)
  if (hasUnboundedGrowth(doClass) && !hasTTLCleanup(doClass)) {
    recommendations.push({
      pattern: 'TTL Cleanup',
      priority: 'critical',
      reason: 'Detected unbounded data growth without cleanup',
      benefit: 'Prevents hitting 1GB storage limit and improves performance'
    });
  }

  // RPC Metadata (high if needs DO name access)
  if (needsDOMetadata(doClass) && !hasRpcMetadata(doClass)) {
    recommendations.push({
      pattern: 'RPC Metadata',
      priority: 'high',
      reason: 'Code attempts to access ctx.id.name (returns empty)',
      benefit: 'Enables logging and debugging with DO identifier'
    });
  }

  // Performance Optimization (high if has slow queries)
  if (hasSQLQueries(doClass) && !hasIndexes(doClass)) {
    recommendations.push({
      pattern: 'SQL Indexes',
      priority: 'high',
      reason: 'SQL queries without indexes detected',
      benefit: 'Dramatically improves query performance'
    });
  }

  // Gradual Deployment (medium for production)
  if (!hasGradualDeployment() && isProduction(doClass)) {
    recommendations.push({
      pattern: 'Gradual Deployment',
      priority: 'medium',
      reason: 'Production DO without deployment strategy',
      benefit: 'Safe rollouts with canary deployments'
    });
  }

  return recommendations.sort((a, b) =>
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}
```

### Phase 2: Pattern Implementation

Implement recommended patterns in priority order:

#### Pattern 1: TTL Cleanup with Alarms

**When to Implement:**
- DO stores time-series data (logs, messages, requests)
- Data has natural expiration (sessions, rate limits)
- Data grows unbounded without cleanup

**Implementation Steps:**

1. **Add Expiration Column to SQL Schema:**

```typescript
// Find CREATE TABLE statements
const createTable = findCreateTable(doCode);

// Add expires_at column if missing
if (!createTable.includes('expires_at')) {
  const newSchema = addExpirationColumn(createTable);

  // Update constructor
  edit(doFile, createTable, newSchema);
}
```

Example edit:

```typescript
// OLD
await this.ctx.storage.sql.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    message TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )
`);

// NEW
await this.ctx.storage.sql.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    message TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_expires ON messages(expires_at);
`);
```

2. **Update Insert Statements:**

Add expires_at value to all INSERT statements:

```typescript
// OLD
await this.ctx.storage.sql.exec(
  "INSERT INTO messages (message, timestamp) VALUES (?, ?)",
  data.message,
  Date.now()
);

// NEW
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
await this.ctx.storage.sql.exec(
  "INSERT INTO messages (message, timestamp, expires_at) VALUES (?, ?, ?)",
  data.message,
  Date.now(),
  Date.now() + TTL_MS
);
```

3. **Add Alarm Handler:**

```typescript
// Add to DO class
async alarm(): Promise<void> {
  try {
    const deleted = await this.ctx.storage.sql.exec(
      "DELETE FROM messages WHERE expires_at <= ?",
      Date.now()
    );

    console.log(\`Cleaned up \${deleted.rowsWritten} expired messages\`);

    // Reschedule
    await this.scheduleCleanup();
  } catch (error) {
    console.error("Cleanup failed:", error);
    // Retry in 5 minutes
    await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000);
    throw error;
  }
}

private async scheduleCleanup(): Promise<void> {
  await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000); // 1 hour
}
```

4. **Schedule Initial Alarm:**

Add to constructor:

```typescript
constructor(ctx: DurableObjectState, env: Env) {
  super(ctx, env);

  this.ctx.blockConcurrencyWhile(async () => {
    // ... existing schema setup ...

    // Schedule cleanup alarm
    await this.scheduleCleanup();
  });
}
```

#### Pattern 2: RPC Metadata

**When to Implement:**
- Code attempts to access `this.ctx.id.name` (returns empty)
- Logging needs DO identifier for correlation
- Multi-tenant logic needs DO name

**Implementation Steps:**

1. **Create RpcTarget Wrapper Class:**

```typescript
// Add to DO file or separate file
import { RpcTarget } from "cloudflare:workers";

export class ${CLASS_NAME}Rpc extends RpcTarget {
  constructor(
    private do: ${CLASS_NAME},
    private doIdentifier: string
  ) {
    super();
  }

  // Wrap each public method to inject identifier
  async methodName(arg1: string): Promise<ReturnType> {
    return this.do.methodName(arg1, this.doIdentifier);
  }
}
```

2. **Update DO Methods to Accept Identifier:**

```typescript
// OLD
async logActivity(userId: string): Promise<void> {
  console.log(\`User \${userId} activity\`);
  // Cannot access DO name here!
}

// NEW
async logActivity(userId: string, doIdentifier: string): Promise<void> {
  console.log(\`[DO \${doIdentifier}] User \${userId} activity\`);
  // Now have DO identifier for logging!
}
```

3. **Update Worker to Use RpcTarget:**

```typescript
// In src/index.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const doId = url.searchParams.get("id") || "default";

    const id = env.MY_DO.idFromName(doId);
    const stub = env.MY_DO.get(id);

    // Wrap with RpcTarget to inject metadata
    const rpcStub = new ${CLASS_NAME}Rpc(stub as unknown as ${CLASS_NAME}, doId);

    // Use RPC stub instead of direct stub
    await rpcStub.logActivity("user-123");

    return Response.json({ success: true });
  },
};
```

#### Pattern 3: SQL Index Optimization

**When to Implement:**
- SQL queries exist without indexes
- Query performance is slow
- Queries use WHERE, ORDER BY, or JOIN on specific columns

**Implementation Steps:**

1. **Analyze Queries:**

Extract all SQL queries:

```bash
grep -r "storage.sql.exec" src/ -A 2 | grep "SELECT\|UPDATE\|DELETE"
```

Identify columns used in:
- WHERE clauses
- ORDER BY clauses
- JOIN conditions

2. **Generate Index Statements:**

```typescript
// For each query pattern, generate index
const queries = extractQueries(doCode);
const indexes = generateIndexes(queries);

// Examples:
// SELECT * FROM messages WHERE user_id = ? ORDER BY timestamp DESC
// → CREATE INDEX idx_user_timestamp ON messages(user_id, timestamp DESC);

// SELECT * FROM sessions WHERE expires_at > ?
// → CREATE INDEX idx_expires ON sessions(expires_at);
```

3. **Add Indexes to Constructor:**

```typescript
// Add to schema setup
await this.ctx.storage.sql.exec(`
  CREATE TABLE IF NOT EXISTS messages (...);

  -- Add indexes
  CREATE INDEX IF NOT EXISTS idx_user_timestamp ON messages(user_id, timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_room ON messages(room_id);
`);
```

#### Pattern 4: WebSocket Hibernation Optimization

**When to Implement:**
- WebSockets used but not hibernating
- setTimeout/setInterval found in DO
- High memory usage

**Implementation Steps:**

1. **Remove setTimeout/setInterval:**

Find and replace:

```typescript
// OLD (blocks hibernation)
webSocketMessage(ws: WebSocket, message: string) {
  setTimeout(() => {
    ws.send("delayed message");
  }, 5000);
}

// NEW (allows hibernation)
webSocketMessage(ws: WebSocket, message: string) {
  // Store metadata for alarm
  await this.ctx.storage.put("pendingMessage", {
    wsId: ws.serializeAttachment(),
    message: "delayed message"
  });

  // Schedule alarm
  await this.ctx.storage.setAlarm(Date.now() + 5000);
}

async alarm() {
  const pending = await this.ctx.storage.get("pendingMessage");
  if (!pending) return;

  const websockets = this.ctx.getWebSockets();
  const ws = websockets.find(w => w.serializeAttachment() === pending.wsId);

  if (ws) {
    ws.send(pending.message);
  }

  await this.ctx.storage.delete("pendingMessage");
}
```

2. **Add WebSocket Tags:**

```typescript
// OLD
this.ctx.acceptWebSocket(ws);

// NEW
this.ctx.acceptWebSocket(ws, ["chat", "presence"]);
```

3. **Optimize Message Handling:**

```typescript
async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
  // Parse message to determine type
  const data = JSON.parse(message as string);

  // Only broadcast certain message types
  if (data.type === "chat") {
    this.broadcast(message);
  }

  // Don't broadcast presence updates (reduce traffic)
  if (data.type === "presence") {
    // Just acknowledge
    ws.send(JSON.stringify({ type: "ack" }));
  }
}
```

#### Pattern 5: Gradual Deployment Configuration

**When to Implement:**
- Production DO without deployment strategy
- Want canary deployments
- Need safe rollouts

**Implementation Steps:**

1. **Create Deployment Configuration:**

Add to project root:

```jsonc
// deployment-strategy.jsonc
{
  "phases": [
    {
      "name": "canary",
      "percentage": 10,
      "duration": "1h",
      "metrics": ["error_rate", "latency_p95"]
    },
    {
      "name": "expand",
      "percentage": 25,
      "duration": "4h",
      "metrics": ["error_rate", "latency_p95", "do_creation_rate"]
    },
    {
      "name": "majority",
      "percentage": 75,
      "duration": "12h",
      "metrics": ["error_rate", "latency_p95"]
    },
    {
      "name": "full",
      "percentage": 100,
      "duration": "forever"
    }
  ],
  "rollback_threshold": {
    "error_rate": 0.05,  // 5% error rate triggers rollback
    "latency_p95": 2.0   // 2x latency increase triggers rollback
  }
}
```

2. **Add Version Affinity for DOs:**

```typescript
// In src/index.ts

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const doName = url.searchParams.get("id") || "default";

    // Version affinity: route based on DO name hash
    const hash = await hashDOName(doName);
    const version = determineVersion(hash, env.DEPLOYMENT_PERCENTAGE);

    // Route to appropriate version
    const binding = version === "new" ? env.MY_DO_V2 : env.MY_DO;
    const id = binding.idFromName(doName);
    const stub = binding.get(id);

    return stub.fetch(request);
  },
};

async function hashDOName(name: string): Promise<number> {
  const encoder = new TextEncoder();
  const data = encoder.encode(name);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray[0];
}

function determineVersion(hash: number, percentage: number): string {
  return (hash % 100) < percentage ? "new" : "stable";
}
```

3. **Add Deployment Script:**

Create `scripts/deploy-gradual.sh`:

```bash
#!/bin/bash

# Phase 1: Canary (10%)
wrangler versions upload --tag v2.0.0 --message "New feature"
wrangler versions deploy v2.0.0@10% --message "Canary deployment"
echo "Deployed to 10% (canary). Monitoring for 1 hour..."
sleep 3600

# Check metrics (placeholder)
# ./scripts/check-metrics.sh || { echo "Rollback!"; wrangler versions deploy v1.0.0@100%; exit 1; }

# Phase 2: Expand (25%)
wrangler versions deploy v2.0.0@25% --message "Expand deployment"
echo "Deployed to 25%. Monitoring for 4 hours..."
# Continue...
```

### Phase 3: Testing

Test implemented patterns:

#### Step 3.1: Create Pattern Tests

Generate tests for each implemented pattern:

**TTL Cleanup Test:**

```typescript
import { env, runDurableObjectAlarm } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("TTL Cleanup Pattern", () => {
  it("should cleanup expired entries", async () => {
    const id = env.MY_DO.idFromName("test-ttl");
    const stub = env.MY_DO.get(id);

    // Add entry with short TTL
    await stub.addEntry("test", "value", 100); // 100ms TTL

    // Wait for expiration
    await new Promise(r => setTimeout(r, 150));

    // Trigger alarm
    await runDurableObjectAlarm(env.MY_DO, id);

    // Verify cleanup
    const entry = await stub.getEntry("test");
    expect(entry).toBeNull();
  });
});
```

**RPC Metadata Test:**

```typescript
describe("RPC Metadata Pattern", () => {
  it("should have access to DO identifier", async () => {
    const doName = "test-room";
    const id = env.MY_DO.idFromName(doName);
    const stub = env.MY_DO.get(id);

    // Wrap with RPC
    const rpcStub = new MyDORpc(stub, doName);

    // Call method that uses identifier
    const logs = await rpcStub.getLogs();

    // Verify identifier in logs
    expect(logs[0]).toContain(`[DO ${doName}]`);
  });
});
```

#### Step 3.2: Run Tests

```bash
npm test
```

Verify all pattern tests pass.

### Phase 4: Documentation

Document implemented patterns:

#### Step 4.1: Update README

Add patterns section:

```markdown
## Production Patterns Implemented

### TTL Cleanup
- **Purpose**: Prevent unbounded data growth
- **Implementation**: Alarms-based cleanup every hour
- **Configuration**: `TTL_MS` constant in DO class
- **Monitoring**: Check cleanup logs in wrangler tail

### RPC Metadata
- **Purpose**: Access DO identifier for logging
- **Implementation**: RpcTarget wrapper class
- **Usage**: Use ${CLASS_NAME}Rpc instead of direct DO stub
- **Benefit**: Structured logging with correlation IDs

### SQL Indexes
- **Indexes Added**: idx_user_timestamp, idx_expires
- **Queries Optimized**: User message lookup, expiration cleanup
- **Performance Gain**: ~10x faster queries

### WebSocket Hibernation
- **Optimizations**: Removed setTimeout, added tags
- **Memory Savings**: ~80% reduction during idle
- **Hibernation Delay**: ~30 seconds of inactivity

### Gradual Deployment
- **Strategy**: Canary → 25% → 75% → 100%
- **Monitoring**: Error rate, latency p95
- **Rollback**: Automatic if thresholds exceeded
```

#### Step 4.2: Add Pattern Comments

Add comments to code explaining patterns:

```typescript
/**
 * TTL Cleanup Pattern
 *
 * Prevents unbounded growth by automatically deleting expired entries.
 * Cleanup runs every hour via alarms. Entries expire after 30 days.
 *
 * See: references/data-modeling.md (TTL patterns)
 * Template: templates/ttl-cleanup-do.ts
 */
async alarm(): Promise<void> {
  // Implementation...
}
```

## Output Format

Provide detailed implementation report:

```
✅ Production Patterns Implemented!

Analysis Results:
─────────────────

DO Class: ${CLASS_NAME}
File: src/${CLASS_NAME}.ts
Storage: SQL (SQLite)
Current Patterns: Basic CRUD
Missing Patterns: 5 critical, 2 high priority

Patterns Implemented:
─────────────────────

1. ✅ TTL Cleanup Pattern (CRITICAL)
   Priority: Critical
   Reason: Unbounded data growth detected (no expiration)
   Changes:
     - Added expires_at column to messages table
     - Added idx_expires index
     - Implemented alarm() handler
     - Scheduled cleanup every 1 hour
   Files Modified:
     - src/${CLASS_NAME}.ts (constructor, alarm handler)
   Testing:
     - test/${CLASS_NAME}.test.ts (TTL cleanup test added)
   Result: ✅ Prevents hitting 1GB storage limit

2. ✅ RPC Metadata Pattern (HIGH)
   Priority: High
   Reason: Code attempts to access ctx.id.name (returns empty)
   Changes:
     - Created ${CLASS_NAME}Rpc wrapper class
     - Updated DO methods to accept doIdentifier parameter
     - Modified Worker to use RpcTarget wrapper
   Files Modified:
     - src/${CLASS_NAME}.ts (method signatures)
     - src/index.ts (RpcTarget usage)
   Testing:
     - test/${CLASS_NAME}.test.ts (metadata test added)
   Result: ✅ Logging now includes DO identifier

3. ✅ SQL Index Optimization (HIGH)
   Priority: High
   Reason: 3 queries without indexes detected
   Changes:
     - Added idx_user_timestamp (user_id, timestamp DESC)
     - Added idx_room (room_id)
   Queries Optimized:
     - SELECT * FROM messages WHERE user_id = ? ORDER BY timestamp DESC
     - SELECT * FROM messages WHERE room_id = ?
   Files Modified:
     - src/${CLASS_NAME}.ts (constructor schema)
   Performance Gain: ~10x faster queries
   Result: ✅ Query performance improved

4. ✅ WebSocket Hibernation Optimization (MEDIUM)
   Priority: Medium
   Reason: setTimeout blocking hibernation
   Changes:
     - Replaced setTimeout with alarm scheduling
     - Added WebSocket tags for message filtering
     - Optimized webSocketMessage handler
   Files Modified:
     - src/${CLASS_NAME}.ts (webSocketMessage, alarm)
   Memory Savings: ~80% reduction during idle
   Result: ✅ WebSocket hibernation working

5. ✅ Gradual Deployment Configuration (MEDIUM)
   Priority: Medium
   Reason: Production DO without deployment strategy
   Changes:
     - Created deployment-strategy.jsonc
     - Added version affinity logic
     - Created deploy-gradual.sh script
   Files Created:
     - deployment-strategy.jsonc
     - scripts/deploy-gradual.sh
   Files Modified:
     - src/index.ts (version routing)
   Result: ✅ Safe deployment strategy in place

Summary:
────────

Total Patterns: 5
Lines Added: ${TOTAL_LINES_ADDED}
Lines Modified: ${TOTAL_LINES_MODIFIED}
Tests Added: 5
Files Modified: 4
Files Created: 3

Validation:
───────────

✅ TypeScript compilation: No errors
✅ Pattern tests: All passed (5/5)
✅ Configuration valid: wrangler.jsonc OK
✅ Local testing: DO accessible

Next Steps:
───────────

1. Review implemented patterns:
   git diff

2. Run full test suite:
   npm test

3. Test locally with patterns:
   wrangler dev

4. Deploy using gradual strategy:
   ./scripts/deploy-gradual.sh

5. Monitor metrics:
   wrangler tail --filter "cleanup\|RPC\|query"

Documentation:
──────────────

Pattern documentation added to README.md

Load these references for details:
- references/data-modeling.md (TTL patterns)
- references/rpc-metadata.md (RPC metadata)
- references/performance-optimization.md (Indexes)
- references/websocket-hibernation.md (Hibernation)
- references/gradual-deployments.md (Deployment strategy)

Pattern templates available in:
- templates/ttl-cleanup-do.ts
- templates/rpc-metadata-do.ts
- templates/gradual-deployment-config.jsonc

Production Ready! 🚀
```

## Related Commands and Agents

After implementation:

- **Debug**: Use do-debugger to validate patterns
- **Test**: Load templates/vitest-do-test.ts for pattern tests
- **Deploy**: Use scripts/deploy-gradual.sh for safe rollouts
- **Monitor**: Load references/monitoring-debugging.md

## Success Criteria

Implementation succeeds when:

- ✅ All critical patterns implemented
- ✅ High-priority patterns added
- ✅ Tests passing for each pattern
- ✅ Documentation updated
- ✅ TypeScript compiles
- ✅ Local testing successful
- ✅ Deployment strategy in place
