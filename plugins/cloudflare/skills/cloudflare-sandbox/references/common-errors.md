# Cloudflare Sandboxes - Common Errors & Solutions

**Purpose**: Complete list of known errors with solutions

**Last Updated**: 2025-10-29

---

## Error #1: Missing nodejs_compat Flag

### Symptoms
```
ReferenceError: fetch is not defined
ReferenceError: Buffer is not defined
TypeError: Cannot read property 'get' of undefined
```

### Why It Happens
Sandbox SDK requires Node.js APIs (`fetch`, `Buffer`, `process`, etc.) that aren't available in standard Workers runtime.

### Solution
Add `nodejs_compat` to `wrangler.jsonc`:

```jsonc
{
  "compatibility_flags": ["nodejs_compat"]
}
```

### Source
https://developers.cloudflare.com/sandbox/get-started/

---

## Error #2: Class 'Sandbox' Not Found

### Symptoms
```
Error: Class 'Sandbox' not found
Error: Durable Object namespace 'Sandbox' is not bound
```

### Why It Happens
1. Missing `export { Sandbox }` in Worker
2. Missing migrations in wrangler.jsonc
3. Durable Objects binding not configured

### Solution
**Step 1**: Export Sandbox class
```typescript
import { getSandbox, type Sandbox } from '@cloudflare/sandbox';
export { Sandbox } from '@cloudflare/sandbox';  // ← CRITICAL!
```

**Step 2**: Add migrations and bindings to `wrangler.jsonc`
```jsonc
{
  "durable_objects": {
    "bindings": [{
      "class_name": "Sandbox",
      "name": "Sandbox"
    }]
  },
  "migrations": [{
    "tag": "v1",
    "new_sqlite_classes": ["Sandbox"]
  }]
}
```

### Source
https://developers.cloudflare.com/durable-objects/

---

## Error #3: Files Disappearing

### Symptoms
```
ENOENT: no such file or directory, open '/workspace/myfile.txt'
Files created earlier are gone
Dependencies installed before are missing
```

### Why It Happens
Container goes **idle after ~10 minutes** of inactivity. When idle:
- ALL files deleted
- ALL processes killed
- Fresh container created on next request

### Solution
**Option 1**: Backup to R2
```typescript
// After writing important file
await sandbox.writeFile('/workspace/important.txt', data);
await env.R2.put(`backups/${sandboxId}/important.txt`, data);

// Before reading (handles cold start)
const exists = await sandbox.readFile('/workspace/important.txt').catch(() => null);
if (!exists) {
  const backup = await env.R2.get(`backups/${sandboxId}/important.txt`);
  if (backup) {
    await sandbox.writeFile('/workspace/important.txt', await backup.text());
  }
}
```

**Option 2**: Accept ephemerality and rebuild
```typescript
// Check if setup needed
const marker = await sandbox.readFile('/workspace/.initialized').catch(() => null);
if (!marker) {
  // Cold start - rebuild environment
  await sandbox.gitCheckout(repoUrl, '/workspace/repo');
  await sandbox.exec('npm install', { cwd: '/workspace/repo' });
  await sandbox.writeFile('/workspace/.initialized', 'true');
}
```

### Source
https://developers.cloudflare.com/sandbox/concepts/sandboxes/

---

## Error #4: Commands in Wrong Directory

### Symptoms
```
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /workspace/package.json
```

Working directory not preserved between commands.

### Why It Happens
Each `exec()` call runs in a **new bash session** unless you specify a session ID.

### Solution
Use sessions:
```typescript
// ❌ WRONG
await sandbox.exec('cd /workspace/myproject');
await sandbox.exec('npm install');  // NOT in /workspace/myproject

// ✅ CORRECT
const sessionId = await sandbox.createSession();
await sandbox.exec('cd /workspace/myproject', { session: sessionId });
await sandbox.exec('npm install', { session: sessionId });  // In /workspace/myproject
```

### Source
https://developers.cloudflare.com/sandbox/concepts/sessions/

---

## Error #5: Ignoring Exit Codes

### Symptoms
Silent failures, commands appear to succeed but didn't
Subsequent commands fail mysteriously

### Why It Happens
Not checking `result.success` or `result.exitCode`

### Solution
Always check exit codes:
```typescript
// ❌ WRONG
const result = await sandbox.exec('npm run build');
// Assumes success!

// ✅ CORRECT
const result = await sandbox.exec('npm run build');
if (!result.success) {
  throw new Error(`Build failed (exit ${result.exitCode}): ${result.stderr}`);
}
// Only proceed if successful
```

### Source
Shell best practices

---

## Error #6: Cold Start Failures

### Symptoms
```
sh: npm: command not found
Error: Cannot find module 'react'
```

Dependencies missing after some time.

### Why It Happens
Container reset after idle, but code assumes environment is ready.

### Solution
Check for cold starts:
```typescript
async function ensureSetup(sandbox, repoUrl) {
  const exists = await sandbox.readdir('/workspace/repo').catch(() => null);

  if (!exists) {
    // Cold start detected
    console.log('Cold start - setting up environment');
    await sandbox.gitCheckout(repoUrl, '/workspace/repo');
    await sandbox.exec('npm install', {
      cwd: '/workspace/repo',
      timeout: 180000
    });
  }
}

// Always call before running build
await ensureSetup(sandbox, 'https://github.com/user/repo');
await sandbox.exec('npm run build', { cwd: '/workspace/repo' });
```

### Source
https://developers.cloudflare.com/sandbox/concepts/sandboxes/

---

## Error #7: Docker Not Running (Local Dev)

### Symptoms
```
Failed to build container
Error: Cannot connect to the Docker daemon
docker: command not found
```

### Why It Happens
Local development requires Docker daemon for container simulation.

### Solution
1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Start Docker Desktop
3. Verify: `docker ps` (should not error)
4. Run `npm run dev`

### Source
https://developers.cloudflare.com/sandbox/get-started/

---

## Error #8: Version Mismatch

### Symptoms
```
TypeError: sandbox.someMethod is not a function
Unexpected behavior from SDK methods
```

### Why It Happens
npm package version doesn't match Docker image version.

### Solution
Keep versions in sync:

**package.json**:
```json
{
  "dependencies": {
    "@cloudflare/sandbox": "^0.4.12"
  }
}
```

**wrangler.jsonc**:
```jsonc
{
  "containers": [{
    "image": "cloudflare/sandbox:0.4.12"  // ← Same version
  }]
}
```

**Update both**:
```bash
npm install @cloudflare/sandbox@latest
# Update wrangler.jsonc image to match
```

### Source
GitHub issues, community reports

---

## Error #9: Resource Leaks

### Symptoms
Unexpected costs, resource quota exceeded
Many idle sandboxes in dashboard

### Why It Happens
Creating ephemeral sandboxes without destroying them.

### Solution
Always destroy ephemeral sandboxes:
```typescript
// ❌ WRONG
const sandboxId = `temp-${Date.now()}`;
const sandbox = getSandbox(env.Sandbox, sandboxId);
await sandbox.exec('...');
// Never destroyed!

// ✅ CORRECT
const sandboxId = `temp-${Date.now()}`;
const sandbox = getSandbox(env.Sandbox, sandboxId);

try {
  await sandbox.exec('...');
  return result;
} finally {
  await sandbox.destroy();  // Always cleanup
}
```

**When to destroy**:
- ✅ Per-request sandboxes (one-shot execution)
- ✅ Per-task sandboxes when task complete
- ❌ Per-user sandboxes (keep while active)

### Source
Resource management best practices

---

## Error #10: Command Injection

### Symptoms
Security breach, arbitrary code execution
Unexpected commands running

### Why It Happens
Passing unsanitized user input to `exec()`.

### Solution
**Option 1**: Use code interpreter (safer)
```typescript
// ✅ SAFE: Runs in controlled context
const ctx = await sandbox.createCodeContext({ language: 'python' });
const result = await sandbox.runCode(userProvidedCode, {
  context: ctx,
  timeout: 10000
});
```

**Option 2**: Validate input
```typescript
function sanitizeCommand(input: string): string {
  const dangerous = ['rm -rf', '$(', '`', '&&', '||', ';', '|', '>', '<'];

  for (const pattern of dangerous) {
    if (input.includes(pattern)) {
      throw new Error(`Dangerous pattern detected: ${pattern}`);
    }
  }

  return input;
}

const safeCommand = sanitizeCommand(userInput);
await sandbox.exec(safeCommand);
```

**Option 3**: Use allowlist
```typescript
const ALLOWED_COMMANDS = ['ls', 'pwd', 'cat', 'echo'];

function validateCommand(cmd: string): void {
  const baseCommand = cmd.split(' ')[0];
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    throw new Error(`Command not allowed: ${baseCommand}`);
  }
}
```

### Source
Security best practices, OWASP

---

## Quick Troubleshooting Checklist

When something goes wrong:

1. **Check wrangler.jsonc**:
   - [ ] `nodejs_compat` in compatibility_flags?
   - [ ] containers configuration present?
   - [ ] Durable Objects binding configured?
   - [ ] migrations array present?
   - [ ] Docker image version matches npm package?

2. **Check Worker code**:
   - [ ] `export { Sandbox }` from '@cloudflare/sandbox'?
   - [ ] Exit codes being checked?
   - [ ] Using sessions for multi-step workflows?
   - [ ] Cold start handling present?

3. **Check local environment** (if developing locally):
   - [ ] Docker Desktop running?
   - [ ] `docker ps` works?
   - [ ] Latest Wrangler installed?

4. **Check runtime behavior**:
   - [ ] Has 10 minutes passed since last request?
   - [ ] Files being backed up to R2?
   - [ ] Sessions being recreated after idle?
   - [ ] Destroying ephemeral sandboxes?

---

**Still having issues?**

1. Enable observability in wrangler.jsonc:
   ```jsonc
   { "observability": { "enabled": true } }
   ```

2. Add logging:
   ```typescript
   console.log('Container uptime:', (await sandbox.exec('uptime')).stdout);
   console.log('Files in workspace:', (await sandbox.exec('ls -la /workspace')).stdout);
   ```

3. Check official docs: https://developers.cloudflare.com/sandbox/
4. Search GitHub issues: https://github.com/cloudflare/sandbox-sdk/issues
