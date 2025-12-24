# Cloudflare Sandboxes - Naming Strategies

**Purpose**: Choosing effective sandbox IDs for different use cases

**Last Updated**: 2025-10-29

---

## Why Naming Matters

Sandbox ID determines:
1. **Routing**: Same ID → same Durable Object → same container
2. **Geographic location**: First request determines region (sticky)
3. **Lifecycle**: Per-user vs per-task vs per-session strategies
4. **Debuggability**: Meaningful IDs help troubleshooting

---

## Strategy 1: Per-User Sandboxes

### Format
```typescript
const sandboxId = `user-${userId}`;
```

### Characteristics
- **Persistence**: While container is active (~10 min after last request)
- **Geographic**: Sticky to user's first request location
- **Concurrency**: One container per user
- **Isolation**: User's workspace separate from others

### Use Cases
- ✅ Interactive development environments
- ✅ Notebooks (Jupyter-style)
- ✅ Personal workspaces
- ✅ IDEs
- ✅ Long-running chat conversations

### Pros
- User's work persists while they're actively using it
- Context maintained across requests
- Familiar environment on return

### Cons
- Geographic lock-in (higher latency for global users)
- No multi-region redundancy
- User blocked if container fails

### Example
```typescript
export default {
  async fetch(request: Request, env: Env) {
    const userId = request.headers.get('X-User-ID');
    const sandbox = getSandbox(env.Sandbox, `user-${userId}`);
    // Same sandbox for all user's requests
  }
};
```

---

## Strategy 2: Per-Session Sandboxes

### Format
```typescript
const sandboxId = `session-${Date.now()}-${crypto.randomUUID()}`;
```

### Characteristics
- **Persistence**: None (destroyed after use)
- **Geographic**: Random (wherever request lands)
- **Concurrency**: New container per session
- **Isolation**: Complete (no shared state)

### Use Cases
- ✅ One-shot code execution
- ✅ Code playgrounds
- ✅ API endpoints
- ✅ Ephemeral builds
- ✅ Testing/CI individual runs

### Pros
- Clean environment every time
- No state pollution
- Easy cleanup
- No geographic concerns

### Cons
- Cold start on every request
- No persistence between requests
- Can't resume work

### Example
```typescript
export default {
  async fetch(request: Request, env: Env) {
    const sandboxId = `exec-${Date.now()}-${crypto.randomUUID()}`;
    const sandbox = getSandbox(env.Sandbox, sandboxId);

    try {
      const result = await sandbox.exec('...');
      return Response.json({ result });
    } finally {
      await sandbox.destroy(); // Always cleanup
    }
  }
};
```

---

## Strategy 3: Per-Task Sandboxes

### Format
```typescript
const sandboxId = `build-${repoName}-${commitSha}`;
// Or: `task-${taskType}-${taskId}`
```

### Characteristics
- **Persistence**: Idempotent (same task = same sandbox)
- **Geographic**: Sticky to first execution
- **Concurrency**: One container per unique task
- **Isolation**: Tasks don't interfere

### Use Cases
- ✅ CI/CD builds
- ✅ Data processing pipelines
- ✅ Batch jobs
- ✅ Reproducible computations
- ✅ Cacheable operations

### Pros
- Idempotent (rerun = same result)
- Debuggable (ID tells you what it's for)
- Traceable (logs/metrics by task)
- Cacheable (skip if already done)

### Cons
- Need manual cleanup strategy
- Can accumulate old sandboxes
- Still has geographic lock-in

### Example
```typescript
export default {
  async fetch(request: Request, env: Env) {
    const { repoUrl, commit } = await request.json();
    const repoName = repoUrl.split('/').pop();
    const sandboxId = `build-${repoName}-${commit}`;

    const sandbox = getSandbox(env.Sandbox, sandboxId);

    // Idempotent: same commit = same sandbox
    // Can check if build already exists
    const exists = await env.R2.get(`builds/${sandboxId}/artifact.tar.gz`);
    if (exists) {
      return Response.json({ cached: true, artifactKey: exists.key });
    }

    // Run build...
  }
};
```

---

## Strategy 4: Per-Conversation Sandboxes

### Format
```typescript
const sandboxId = `conversation-${conversationId}`;
```

### Characteristics
- **Persistence**: Duration of conversation
- **Geographic**: Sticky
- **Concurrency**: One per conversation
- **Isolation**: Conversations separate

### Use Cases
- ✅ Chat-based coding agents
- ✅ Multi-turn interactions
- ✅ Guided tutorials
- ✅ Interactive debugging sessions

### Pros
- Context preserved across messages
- Natural lifecycle (conversation end = cleanup)
- Easy to implement

### Cons
- Geographic lock-in per conversation
- Need conversation cleanup logic

### Example
```typescript
export default {
  async fetch(request: Request, env: Env) {
    const { conversationId, message } = await request.json();
    const sandbox = getSandbox(env.Sandbox, `conversation-${conversationId}`);

    // All messages in same conversation use same sandbox
    const sessionId = await getOrCreateSession(env, conversationId);
    const result = await sandbox.exec(message, { session: sessionId });

    return Response.json({ output: result.stdout });
  }
};
```

---

## Strategy 5: Multi-Region Per-User

### Format
```typescript
const region = request.cf?.colo || 'default';
const sandboxId = `user-${userId}-${region}`;
```

### Characteristics
- **Persistence**: While active, per region
- **Geographic**: Multiple sandboxes per user
- **Concurrency**: User can hit different regions
- **Isolation**: Region-specific

### Use Cases
- ✅ Global applications
- ✅ Low-latency requirements
- ✅ Multi-region redundancy

### Pros
- Low latency (closest region)
- Redundancy (failover to another region)
- Scales globally

### Cons
- More complex state management
- Higher resource usage (multiple sandboxes per user)
- Need sync strategy if sharing state

### Example
```typescript
export default {
  async fetch(request: Request, env: Env) {
    const userId = request.headers.get('X-User-ID');
    const region = request.cf?.colo || 'default';
    const sandboxId = `user-${userId}-${region}`;

    const sandbox = getSandbox(env.Sandbox, sandboxId);

    // User in different regions get different sandboxes
    // (optional: sync state via R2/KV)
  }
};
```

---

## Comparison Table

| Strategy | Cold Start Frequency | Persistence | Geographic | Cleanup | Best For |
|----------|---------------------|-------------|------------|---------|----------|
| **Per-User** | Low (reuses) | While active | Sticky | Manual (optional) | IDEs, workspaces |
| **Per-Session** | High (every time) | None | Random | Auto (destroy) | Code execution, APIs |
| **Per-Task** | Medium (per task) | Idempotent | Sticky | Manual (periodic) | CI/CD, pipelines |
| **Per-Conversation** | Low (reuses) | During conversation | Sticky | Manual (on end) | Chat agents |
| **Multi-Region** | Low (per region) | While active | Multi | Manual (optional) | Global apps |

---

## Best Practices

### Naming Conventions

**DO**:
- ✅ Use descriptive prefixes (`user-`, `build-`, `exec-`)
- ✅ Include relevant IDs (`userId`, `taskId`, `commitSha`)
- ✅ Use kebab-case or snake_case
- ✅ Keep IDs under 256 characters
- ✅ Document your naming scheme

**DON'T**:
- ❌ Use random UUIDs only (not debuggable)
- ❌ Include sensitive data in IDs
- ❌ Mix naming strategies inconsistently
- ❌ Use special characters that need escaping

### Cleanup Strategies

**Ephemeral** (per-session):
```typescript
try {
  const sandbox = getSandbox(env.Sandbox, tempId);
  // Use it
} finally {
  await sandbox.destroy(); // Always cleanup
}
```

**Persistent** (per-user):
```typescript
// Optional: Cleanup on explicit user action
if (action === 'logout' || action === 'reset') {
  const sandbox = getSandbox(env.Sandbox, `user-${userId}`);
  await sandbox.destroy();
}
```

**Task-based** (periodic cleanup):
```typescript
// Cron job to cleanup old builds
const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
for (const taskId of oldTasks) {
  if (taskId.timestamp < cutoff) {
    const sandbox = getSandbox(env.Sandbox, taskId);
    await sandbox.destroy();
  }
}
```

---

## Example Decision Tree

```
Is this for a specific user?
├─ Yes → Is it multi-region?
│   ├─ Yes → per-region-user: `user-${userId}-${region}`
│   └─ No → per-user: `user-${userId}`
└─ No → Is it for a specific task?
    ├─ Yes → per-task: `build-${repoName}-${commit}`
    └─ No → Is it ephemeral?
        ├─ Yes → per-session: `exec-${timestamp}-${uuid}`
        └─ No → per-conversation: `conversation-${conversationId}`
```

---

**Key Takeaway**: Choose naming strategy based on persistence needs, geographic requirements, and cleanup lifecycle.
