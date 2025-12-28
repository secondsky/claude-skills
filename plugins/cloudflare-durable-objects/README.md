# Cloudflare Durable Objects

**Auto-Discovery Skill for Claude Code CLI**

Complete knowledge domain for Cloudflare Durable Objects - globally unique, stateful objects for coordination, real-time communication, and persistent state management.

---

## Auto-Trigger Keywords

Claude will automatically suggest this skill when you mention any of these keywords:

### Primary Triggers (Core Technologies)
- durable objects
- cloudflare do
- durable object class
- do bindings
- websocket hibernation
- do state api
- do alarms
- durable objects storage
- do migrations
- durable objects workers
- cloudflare stateful
- do sql storage
- sqlite durable objects
- rpctarget
- durable objects testing
- vitest durable objects
- gradual deployment do

### Secondary Triggers (Patterns & Use Cases)
- real-time cloudflare
- websocket workers
- multiplayer cloudflare
- chat room workers
- coordination cloudflare
- stateful workers
- websocket server cloudflare
- do coordination
- rate limiting workers
- session management workers
- leader election cloudflare
- collaborative editing cloudflare
- game server cloudflare
- chat backend cloudflare

### API & Methods
- DurableObject class
- ctx.storage.sql
- ctx.acceptWebSocket
- webSocketMessage
- webSocketClose
- alarm() handler
- storage.setAlarm
- idFromName
- newUniqueId
- getByName
- DurableObjectStub
- DurableObjectState
- blockConcurrencyWhile
- serializeAttachment
- deserializeAttachment
- RpcTarget
- runInDurableObject
- runDurableObjectAlarm
- listDurableObjectIds

### Configuration Keywords
- durable_objects bindings
- new_sqlite_classes
- do wrangler config
- durable objects migrations
- renamed_classes
- deleted_classes
- transferred_classes
- location hints
- jurisdiction do

### Testing & Development (2024-2025)
- @cloudflare/vitest-pool-workers
- test durable objects
- vitest do
- unit test do
- integration test do
- test do state
- test websocket hibernation
- test alarms
- isolated storage testing
- rpc metadata pattern
- gradual deployment
- traffic split workers
- canary deployment do
- rollout strategy
- version affinity
- ttl cleanup pattern
- do performance optimization
- monitoring durable objects
- debugging do
- data modeling do
- schema design do

### Error-Based Triggers
- "do class export"
- "do constructor"
- "new_sqlite_classes"
- "migrations required"
- "alarm api error"
- "websocket hibernation"
- "do binding not found"
- "global uniqueness"
- "class name mismatch"
- "migration tag"
- "cannot start a transaction"
- "state limit exceeded"
- "hibernation failed"
- "alarm retry"

### Commands (Interactive Workflows)
- /do-setup - Initialize new DO project
- /do-migrate - Migration assistant
- /do-debug - Debugging workflow
- setup durable objects
- create durable object
- initialize do
- migrate durable objects
- debug do
- fix durable object errors

### Agents (Autonomous Assistants)
- do-debugger - Autonomous error detection
- do-setup-assistant - Project scaffolding
- do-pattern-implementer - Production patterns
- autonomous debugging
- auto-fix do
- implement patterns
- production ready do

---

## What This Skill Does

- ✅ Creates Durable Object classes with proper structure
- ✅ Configures DO bindings and migrations in wrangler.jsonc
- ✅ Implements WebSocket Hibernation API for real-time apps
- ✅ Manages state with SQL and key-value storage APIs
- ✅ Schedules tasks with Alarms API
- ✅ Uses RPC methods for type-safe DO communication
- ✅ Handles DO routing with location hints
- ✅ Implements coordination patterns (rate limiting, sessions, multiplayer)
- ✅ Manages DO migrations (new, rename, delete, transfer)
- ✅ Tests DOs with Vitest (@cloudflare/vitest-pool-workers)
- ✅ Uses RpcTarget pattern for DO metadata handling
- ✅ Implements gradual deployments with traffic splitting
- ✅ Optimizes performance and monitors production DOs
- ✅ Prevents 15+ documented errors and misconfigurations
- ✅ Provides interactive commands for setup, migration, and debugging
- ✅ Autonomous agents for error fixing and pattern implementation

---

## Known Issues Prevented

| Issue | Error Message | How Skill Prevents |
|-------|---------------|-------------------|
| **Class not exported** | "binding not found" | Always exports DO class with proper syntax |
| **Missing migration** | "migrations required" | Templates include migration configuration |
| **Wrong migration type** | Schema errors | Uses new_sqlite_classes for SQLite backend |
| **Constructor overhead** | Slow hibernation wake | Shows blockConcurrencyWhile pattern |
| **setTimeout breaks hibernation** | Never hibernates | Uses alarms instead of setTimeout/setInterval |
| **In-memory state lost** | Data loss on hibernation | Persists to storage, restores in constructor |
| **Outgoing WebSocket** | Not supported | Only server-side WebSockets hibernate |
| **Global uniqueness** | Unexpected behavior | Explains class name global scope |
| **Partial deleteAll (KV)** | Incomplete cleanup | Recommends SQLite backend for atomic ops |
| **Binding name mismatch** | Runtime error | Ensures binding consistency |
| **State size exceeded** | Storage limit | Documents 1GB SQLite, 128MB KV limits |
| **Migration not atomic** | Deploy failures | Explains atomic migration requirement |
| **Location hint ignored** | Wrong region | Clarifies hints are best-effort |
| **Alarm retry failures** | Lost tasks | Shows idempotent alarm patterns |
| **Fetch during hibernation** | Blocks hibernation | Ensures all I/O completes before idle |

---

## When to Use This Skill

### ✅ Use When:
- Building real-time applications (chat, collaboration, multiplayer games)
- Need coordination between multiple clients or Workers
- Implementing per-user or per-room stateful logic
- Building WebSocket servers with thousands of connections
- Need strongly consistent state with ACID transactions
- Implementing rate limiting, session management, or leader election
- Building queues, workflows, or data pipelines
- Need scheduled tasks tied to specific instances (alarms)

### ❌ Don't Use When:
- Simple key-value storage → Use KV instead
- Large file storage → Use R2 instead
- Serverless SQL without state → Use D1 instead
- Static data that doesn't change → Use KV or R2
- Single-request stateless operations → Use Workers alone

---

## Quick Usage Example

```bash
# Scaffold new DO project
npm create cloudflare@latest my-app -- \
  --template=cloudflare/durable-objects-template \
  --ts --git --deploy false
```

```typescript
// Define Durable Object class
import { DurableObject } from 'cloudflare:workers';

export class Counter extends DurableObject {
  async increment(): Promise<number> {
    let value: number = (await this.ctx.storage.get('value')) || 0;
    value += 1;
    await this.ctx.storage.put('value', value);
    return value;
  }
}

export default Counter;
```

```jsonc
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",
        "class_name": "Counter"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["Counter"]
    }
  ]
}
```

---

## File Structure

```
~/.claude/skills/cloudflare-durable-objects/
├── SKILL.md                                # Complete DO documentation (1000+ lines)
├── README.md                               # This file (auto-trigger keywords)
├── templates/
│   ├── wrangler-do-config.jsonc           # Complete wrangler configuration
│   ├── basic-do.ts                         # Simple counter example
│   ├── websocket-hibernation-do.ts         # WebSocket chat room
│   ├── state-api-patterns.ts               # SQL + KV storage examples
│   ├── alarms-api-do.ts                    # Scheduled tasks with alarms
│   ├── rpc-vs-fetch.ts                     # RPC vs fetch patterns
│   ├── location-hints.ts                   # Geographic routing
│   ├── multi-do-coordination.ts            # Multiple DOs working together
│   └── package.json                        # TypeScript dependencies
├── references/
│   ├── wrangler-commands.md                # Complete CLI reference
│   ├── state-api-reference.md              # SQL + KV storage API
│   ├── websocket-hibernation.md            # WebSocket API deep dive
│   ├── alarms-api.md                       # Alarms scheduling guide
│   ├── migrations-guide.md                 # Migration patterns
│   ├── rpc-patterns.md                     # RPC vs fetch decision guide
│   ├── best-practices.md                   # Production patterns
│   └── top-errors.md                       # 15+ documented issues
└── scripts/
    └── check-versions.sh                   # Verify package versions
```

---

## Dependencies

- **Required**: cloudflare-worker-base skill (for Worker setup)
- **CLI**: wrangler@4.43.0+
- **Types**: @cloudflare/workers-types@4.20251014.0+
- **SDK**: cloudflare:workers (built-in)

---

## Related Skills

- `cloudflare-worker-base` - Base Worker + Hono setup
- `cloudflare-d1` - D1 serverless SQL database
- `cloudflare-kv` - Key-value storage
- `cloudflare-queues` - Message queues
- `cloudflare-agents` - AI-powered agents (uses Durable Objects)

---

## Learn More

- **SKILL.md**: Complete Durable Objects documentation with examples
- **templates/**: Working code templates for common patterns
- **references/**: Deep-dive guides for WebSocket, State API, Alarms, Migrations

---

**Status**: Production Ready ✅
**Last Updated**: 2025-10-22
**Maintainer**: Claude Skills Maintainers
