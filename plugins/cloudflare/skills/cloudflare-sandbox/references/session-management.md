# Cloudflare Sandboxes - Session Management Guide

**Purpose**: Advanced session patterns and best practices

**Last Updated**: 2025-10-29

---

## What Are Sessions?

Sessions are **bash shell execution contexts** within a single sandbox container.

**Think of it like**:
- Each session = separate terminal tab
- Same filesystem (shared `/workspace`)
- Different working directories
- Different environment variables
- Different shell history

**Key Difference**:
```typescript
// Without session - each command runs in NEW shell
await sandbox.exec('cd /project');  // Shell 1
await sandbox.exec('ls');            // Shell 2 (NOT in /project)

// With session - commands run in SAME shell
const sessionId = await sandbox.createSession();
await sandbox.exec('cd /project', { session: sessionId }); // Shell A
await sandbox.exec('ls', { session: sessionId });           // Shell A (still in /project)
```

---

## Session Lifecycle

### Creation
```typescript
const sessionId = await sandbox.createSession();
// Returns: string UUID (e.g., "abc-123-def-456")
```

### Usage
```typescript
await sandbox.exec('command', {
  session: sessionId,  // Use this session
  cwd: '/workspace',   // Optional: set working directory
  timeout: 30000       // Optional: timeout in ms
});
```

### Persistence
- Sessions persist while container is **active**
- Sessions destroyed when container goes **idle**
- No explicit cleanup needed (garbage collected)

### Cleanup
```typescript
// Sessions are automatically cleaned up, but you can destroy manually if needed
// (No official API for session cleanup - they're lightweight)
```

---

## Common Patterns

### Pattern 1: Multi-Step Workflow

**Use Case**: Commands that build on each other

```typescript
const sessionId = await sandbox.createSession();

// Step 1: Setup
await sandbox.exec('mkdir myproject && cd myproject', { session: sessionId });

// Step 2: Initialize
await sandbox.exec('npm init -y', { session: sessionId });

// Step 3: Install dependencies (still in myproject/)
await sandbox.exec('npm install react', { session: sessionId });

// Step 4: Create files (still in myproject/)
await sandbox.writeFile('/workspace/myproject/index.js', code);

// Step 5: Run (still in myproject/)
const result = await sandbox.exec('node index.js', { session: sessionId });
```

---

### Pattern 2: Chat-Based Agent

**Use Case**: Conversational development environment

```typescript
type Conversation = {
  sandboxId: string;
  sessionId: string;
  workingDir: string;
};

// First message: Create conversation
const conversation: Conversation = {
  sandboxId: `user-${userId}`,
  sessionId: await sandbox.createSession(),
  workingDir: '/workspace'
};

// Store in KV
await env.KV.put(`conversation:${conversationId}`, JSON.stringify(conversation));

// Later messages: Reuse session
const conv = JSON.parse(await env.KV.get(`conversation:${conversationId}`));
const sandbox = getSandbox(env.Sandbox, conv.sandboxId);

await sandbox.exec(userCommand, { session: conv.sessionId });
// Commands preserve context!
```

---

### Pattern 3: Parallel Execution

**Use Case**: Run multiple tasks simultaneously

```typescript
const session1 = await sandbox.createSession();
const session2 = await sandbox.createSession();
const session3 = await sandbox.createSession();

// All run in parallel
const [train, test, validate] = await Promise.all([
  sandbox.exec('python train.py', { session: session1, timeout: 300000 }),
  sandbox.exec('python test.py', { session: session2, timeout: 60000 }),
  sandbox.exec('python validate.py', { session: session3, timeout: 60000 })
]);

console.log('Training:', train.stdout);
console.log('Testing:', test.stdout);
console.log('Validation:', validate.stdout);
```

---

### Pattern 4: Environment Isolation

**Use Case**: Different configurations per session

```typescript
const prodSession = await sandbox.createSession();
const devSession = await sandbox.createSession();

// Production environment
await sandbox.exec('export NODE_ENV=production', { session: prodSession });
await sandbox.exec('npm run build', { session: prodSession });

// Development environment (separate shell, different env vars)
await sandbox.exec('export NODE_ENV=development', { session: devSession });
await sandbox.exec('npm run dev', { session: devSession });
```

---

## Session vs No Session

### Without Session (New Shell Each Time)

```typescript
// ❌ WRONG: This doesn't work as expected
await sandbox.exec('cd /project');
await sandbox.exec('export API_KEY=abc123');
await sandbox.exec('npm run build');  // NOT in /project, API_KEY not set!
```

**What happens**:
1. First exec: Shell A runs `cd /project`, then exits
2. Second exec: Shell B runs `export API_KEY=abc123`, then exits
3. Third exec: Shell C runs `npm run build` in default dir (/workspace), no API_KEY

### With Session (Same Shell)

```typescript
// ✅ CORRECT: Session preserves state
const sessionId = await sandbox.createSession();

await sandbox.exec('cd /project', { session: sessionId });
await sandbox.exec('export API_KEY=abc123', { session: sessionId });
await sandbox.exec('npm run build', { session: sessionId });
// All commands run in same shell, state preserved!
```

---

## Advanced Techniques

### Technique 1: Session Pools

**Use Case**: Reuse sessions for performance

```typescript
class SessionPool {
  private sessions: string[] = [];
  private sandbox: Sandbox;

  constructor(sandbox: Sandbox) {
    this.sandbox = sandbox;
  }

  async getSession(): Promise<string> {
    if (this.sessions.length === 0) {
      return await this.sandbox.createSession();
    }
    return this.sessions.pop()!;
  }

  releaseSession(sessionId: string) {
    this.sessions.push(sessionId);
  }
}

// Usage
const pool = new SessionPool(sandbox);

const sessionId = await pool.getSession();
await sandbox.exec('command', { session: sessionId });
pool.releaseSession(sessionId);
```

### Technique 2: Session State Tracking

**Use Case**: Remember what's been done in session

```typescript
type SessionState = {
  id: string;
  workingDir: string;
  envVars: Record<string, string>;
  setupComplete: boolean;
};

async function trackSessionState(
  sandbox: Sandbox,
  state: SessionState
): Promise<SessionState> {
  // Track working directory
  const pwdResult = await sandbox.exec('pwd', { session: state.id });
  state.workingDir = pwdResult.stdout.trim();

  // Track env vars (if needed)
  const envResult = await sandbox.exec('env', { session: state.id });
  // Parse and store

  return state;
}
```

### Technique 3: Session Validation

**Use Case**: Check if session is still valid

```typescript
async function isSessionValid(
  sandbox: Sandbox,
  sessionId: string
): Promise<boolean> {
  try {
    const result = await sandbox.exec('echo ok', {
      session: sessionId,
      timeout: 5000
    });
    return result.success && result.stdout.includes('ok');
  } catch {
    return false;
  }
}

// Use it
if (!await isSessionValid(sandbox, sessionId)) {
  console.log('Session invalid, creating new one');
  sessionId = await sandbox.createSession();
}
```

---

## Common Mistakes

### Mistake 1: Not Using Sessions

```typescript
// ❌ WRONG
await sandbox.exec('cd /app');
await sandbox.exec('npm install');  // NOT in /app!
```

**Fix**: Use sessions
```typescript
// ✅ CORRECT
const sessionId = await sandbox.createSession();
await sandbox.exec('cd /app', { session: sessionId });
await sandbox.exec('npm install', { session: sessionId });
```

### Mistake 2: Reusing Session ID After Container Idle

```typescript
// ❌ WRONG: Session ID from 15 minutes ago
const oldSessionId = 'session-from-before-idle';
await sandbox.exec('ls', { session: oldSessionId });  // Fails!
```

**Fix**: Recreate session after cold start
```typescript
// ✅ CORRECT
let sessionId = await env.KV.get(`session:${userId}`);

if (!sessionId || !await isSessionValid(sandbox, sessionId)) {
  sessionId = await sandbox.createSession();
  await env.KV.put(`session:${userId}`, sessionId, { expirationTtl: 600 });
}
```

### Mistake 3: Mixing Relative and Absolute Paths

```typescript
// ❌ CONFUSING
const sessionId = await sandbox.createSession();
await sandbox.exec('cd myproject', { session: sessionId });  // Relative
await sandbox.writeFile('/workspace/myproject/file.txt', 'data');  // Absolute
```

**Fix**: Be consistent
```typescript
// ✅ BETTER
const sessionId = await sandbox.createSession();
await sandbox.exec('cd /workspace/myproject', { session: sessionId });  // Absolute
await sandbox.writeFile('/workspace/myproject/file.txt', 'data');  // Absolute
```

---

## Best Practices

### DO:
- ✅ Create sessions for multi-step workflows
- ✅ Store session IDs in KV for conversational flows
- ✅ Set KV expiration to match container idle (~600s)
- ✅ Validate sessions before reuse (check if still active)
- ✅ Use absolute paths in `writeFile()` for clarity
- ✅ Document which commands need sessions

### DON'T:
- ❌ Assume session survives container idle
- ❌ Create new session for every command (wasteful)
- ❌ Mix session and non-session commands for same workflow
- ❌ Store session IDs without expiration
- ❌ Rely on session for long-term state (use KV/R2)

---

## Debugging Sessions

### Check if session exists
```typescript
// Try to use it
const result = await sandbox.exec('echo test', { session: sessionId });
if (!result.success) {
  console.log('Session might be invalid');
}
```

### List active sessions (no official API, but you can track manually)
```typescript
// Store session IDs in KV with metadata
await env.KV.put(`sessions:${sandboxId}`, JSON.stringify([
  { id: session1, purpose: 'main' },
  { id: session2, purpose: 'background' }
]));
```

### Monitor working directory
```typescript
const pwdResult = await sandbox.exec('pwd', { session: sessionId });
console.log('Current directory:', pwdResult.stdout.trim());
```

---

**Key Takeaway**: Use sessions for any multi-step workflow where command order matters. Store session IDs in KV for conversational flows, with expiration matching container idle timeout.
