# Cloudflare Sandboxes - Persistence Guide

**Purpose**: Deep dive into container lifecycle and persistence patterns

**Last Updated**: 2025-10-29

---

## Container Lifecycle States

### 1. Not Created
- Sandbox ID exists conceptually but no container allocated
- First `getSandbox()` call triggers creation

### 2. Active (Provisioning)
- Container is being created
- Takes 2-3 minutes on first request (cold start)
- Downloads Ubuntu image, starts services
- Subsequent requests while active: <1 second

### 3. Active (Running)
- Container fully operational
- Files in `/workspace`, `/tmp`, `/home` persist
- Background processes keep running
- Environment variables remain
- Sessions maintain working directories
- **Duration**: ~10 minutes after last request

###4. Idle
- Container automatically stopped after ~10 minutes of inactivity
- **ALL FILES DELETED** (filesystem wiped)
- **ALL PROCESSES KILLED**
- **ALL STATE RESET**
- Container image destroyed
- Durable Object instance remains (routing preserved)

### 5. Reactivation (from Idle)
- Next request triggers fresh container creation
- Treated as cold start (2-3 min)
- **Starts with clean Ubuntu filesystem**
- No memory of previous files or processes

### 6. Destroyed (via `.destroy()`)
- Permanent deletion
- Container and all data removed
- Durable Object instance deleted
- Cannot be recovered
- Same ID can be reused for new sandbox

---

## What Persists, What Doesn't

| Resource | While Active | After Idle | After Destroy |
|----------|-------------|------------|---------------|
| Files in `/workspace` | ✅ Persists | ❌ Deleted | ❌ Deleted |
| Files in `/tmp` | ✅ Persists | ❌ Deleted | ❌ Deleted |
| Files in `/home` | ✅ Persists | ❌ Deleted | ❌ Deleted |
| Background processes | ✅ Running | ❌ Killed | ❌ Killed |
| Environment variables | ✅ Persists | ❌ Reset | ❌ Reset |
| Session working dirs | ✅ Persists | ❌ Reset | ❌ Reset |
| Sandbox ID routing | ✅ Works | ✅ Works | ❌ Deleted |
| Durable Object state | ✅ Exists | ✅ Exists | ❌ Deleted |

---

## Persistence Patterns

### Pattern 1: Accept Ephemeral Nature (Simplest)

**Use Case**: One-shot executions, CI/CD builds, temporary workspaces

**Strategy**: Rebuild environment on each request

```typescript
const sandbox = getSandbox(env.Sandbox, `build-${taskId}`);

// Always check if setup needed
const exists = await sandbox.readdir('/workspace/project').catch(() => null);

if (!exists) {
  // Cold start - rebuild environment
  await sandbox.gitCheckout(repoUrl, '/workspace/project');
  await sandbox.exec('npm install', { cwd: '/workspace/project' });
}

// Now safe to proceed
await sandbox.exec('npm run build', { cwd: '/workspace/project' });
```

**Pros**: Simple, no external storage needed
**Cons**: Slower on cold starts (need to reinstall dependencies)

---

### Pattern 2: R2 Backup/Restore (Recommended for Important Data)

**Use Case**: User workspaces, important files, long-term persistence

**Strategy**: Backup critical files to R2, restore on cold start

```typescript
const sandbox = getSandbox(env.Sandbox, `user-${userId}`);

// Check if restored
const isRestored = await env.KV.get(`restored:${userId}`);

if (!isRestored) {
  // Cold start - restore from R2
  const listed = await env.R2.list({ prefix: `workspaces/${userId}/` });

  for (const obj of listed.objects) {
    const file = await env.R2.get(obj.key);
    const path = obj.key.replace(`workspaces/${userId}/`, '');
    await sandbox.writeFile(`/workspace/${path}`, await file.text());
  }

  // Mark as restored (TTL = idle timeout)
  await env.KV.put(`restored:${userId}`, 'true', { expirationTtl: 600 });
}

// File operations auto-backup
await sandbox.writeFile('/workspace/important.txt', data);
await env.R2.put(`workspaces/${userId}/important.txt`, data);
```

**Pros**: Files survive container idle, long-term persistence
**Cons**: Slower restore on cold starts, R2 costs

---

### Pattern 3: KV Metadata + R2 Files (Hybrid)

**Use Case**: Mix of small metadata (KV) and large files (R2)

**Strategy**: Use KV for session state, R2 for files

```typescript
// Store session metadata in KV
await env.KV.put(`session:${userId}`, JSON.stringify({
  sessionId,
  workingDir: '/workspace/project',
  lastActive: Date.now()
}));

// Store large files in R2
const artifact = await sandbox.readFile('/workspace/dist/bundle.js');
await env.R2.put(`builds/${userId}/bundle.js`, artifact);
```

**Pros**: Fast metadata access (KV), efficient file storage (R2)
**Cons**: More complex logic

---

### Pattern 4: D1 for Structured Data

**Use Case**: Database-backed applications, query-able persistence

**Strategy**: Use sandbox for computation, D1 for persistence

```typescript
// Execute code in sandbox
const result = await sandbox.runCode(pythonCode);

// Store results in D1
await env.D1.prepare(
  'INSERT INTO results (user_id, output, created_at) VALUES (?, ?, ?)'
).bind(userId, result.results[0].text, Date.now()).run();
```

**Pros**: Structured queries, relational data, transactions
**Cons**: Not suitable for large files

---

## Cold Start Detection

Detect if you're in a cold start:

```typescript
// Method 1: Try to read a marker file
const marker = await sandbox.readFile('/workspace/.initialized').catch(() => null);

if (!marker) {
  console.log('Cold start detected - initializing');
  await sandbox.writeFile('/workspace/.initialized', Date.now().toString());
  // Run initialization
}

// Method 2: Use KV flag (faster)
const initialized = await env.KV.get(`initialized:${sandboxId}`);

if (!initialized) {
  console.log('Cold start detected');
  await env.KV.put(`initialized:${sandboxId}`, 'true', { expirationTtl: 600 });
  // Run initialization
}
```

---

## Best Practices

### DO:
- ✅ Use R2 for files you can't afford to lose
- ✅ Set KV TTL = container idle timeout (~600s)
- ✅ Check for cold starts before assuming files exist
- ✅ Backup incrementally (after writes, not all at once)
- ✅ Use compression for large artifacts (tar.gz)
- ✅ Store metadata separately from content
- ✅ Document what gets backed up vs recreated

### DON'T:
- ❌ Assume files persist after idle timeout
- ❌ Backup every file on every request (use auto-backup on writes)
- ❌ Forget to set expiration on KV flags
- ❌ Use sandbox filesystem for permanent storage
- ❌ Rely on background processes surviving idle
- ❌ Skip cold start handling

---

## Debugging Persistence Issues

### Files disappearing?

**Check**:
1. Has 10 minutes passed since last request?
2. Is cold start detection working?
3. Are files being backed up to R2?
4. Is restore logic running?

**Debug**:
```typescript
// Log container age
const uptimeResult = await sandbox.exec('uptime -s');
console.log('Container started:', uptimeResult.stdout);

// Check if files exist
const lsResult = await sandbox.exec('ls -la /workspace');
console.log('Workspace files:', lsResult.stdout);
```

### Backup/restore not working?

**Check**:
1. R2 binding configured in wrangler.jsonc?
2. Are you awaiting R2 operations?
3. Check R2 bucket contents (use wrangler or dashboard)
4. Verify file paths match (absolute vs relative)

**Debug**:
```typescript
// List R2 backup contents
const listed = await env.R2.list({ prefix: `workspaces/${userId}/` });
console.log('Backed up files:', listed.objects.map(o => o.key));

// Check KV restore flag
const restored = await env.KV.get(`restored:${userId}`);
console.log('Restore flag:', restored);
```

---

## Performance Considerations

### Cold Start Time
- Empty container: ~2-3 minutes
- Restore 10 files from R2: +5-10 seconds
- Restore 100 files from R2: +30-60 seconds
- `npm install` (medium project): +30-90 seconds

### Optimization Tips
1. **Lazy restore**: Only restore files when accessed
2. **Parallel operations**: Use `Promise.all()` for R2 fetches
3. **Compression**: Store `.tar.gz` instead of individual files
4. **Caching**: Keep package cache in R2 between builds
5. **Selective backup**: Only backup user-created files, not node_modules

---

**Key Takeaway**: Sandboxes are ephemeral by design. For anything important, use external storage (R2, KV, D1).
