# Cloudflare Sandbox SDK - Core API Reference

Complete API reference for the Cloudflare Sandbox SDK. Load this reference when implementing specific sandbox operations, troubleshooting API calls, or when you need detailed method signatures and examples.

---

## Getting a Sandbox

```typescript
import { getSandbox } from '@cloudflare/sandbox';

const sandbox = getSandbox(env.Sandbox, 'unique-sandbox-id');
// Creates new sandbox if doesn't exist, or gets existing one
```

## Executing Commands

```typescript
// Basic execution
const result = await sandbox.exec('python3 script.py');
console.log(result.stdout);   // Standard output
console.log(result.stderr);   // Standard error
console.log(result.exitCode); // Exit code (0 = success)
console.log(result.success);  // Boolean (exitCode === 0)

// With options
const result = await sandbox.exec('npm install', {
  cwd: '/workspace/project',        // Working directory
  timeout: 120000,                   // Timeout in ms (default: 30s)
  session: sessionId,                // Session ID
  env: { NODE_ENV: 'production' }   // Environment variables
});

// Always check exit codes!
if (!result.success) {
  throw new Error(`Command failed: ${result.stderr}`);
}
```

## File Operations

```typescript
// Write file
await sandbox.writeFile('/workspace/data.txt', 'content');

// Read file
const content = await sandbox.readFile('/workspace/data.txt');

// Create directory
await sandbox.mkdir('/workspace/project', { recursive: true });

// List directory
const files = await sandbox.readdir('/workspace');
console.log(files); // ['data.txt', 'project']

// Delete file/directory
await sandbox.rm('/workspace/data.txt');
await sandbox.rm('/workspace/project', { recursive: true });
```

## Git Operations

```typescript
// Clone repository (optimized, faster than exec('git clone'))
await sandbox.gitCheckout(
  'https://github.com/user/repo',
  '/workspace/repo'
);

// Now use standard git commands
await sandbox.exec('git status', { cwd: '/workspace/repo' });
await sandbox.exec('git diff', { cwd: '/workspace/repo' });
```

## Code Interpreter (Jupyter-like)

```typescript
// Create Python context
const ctx = await sandbox.createCodeContext({ language: 'python' });

// Execute code - last expression auto-returned
const result = await sandbox.runCode(`
import pandas as pd
df = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})
df['a'].sum()  # This value is automatically returned
`, { context: ctx });

console.log(result.results[0].text); // "6"
console.log(result.logs); // Output from print() statements
console.log(result.error); // Any errors
```

## Background Processes

```typescript
// Start long-running process
const proc = await sandbox.spawn('python server.py');
console.log(proc.pid);

// Check if still running
const running = await sandbox.isProcessRunning(proc.pid);

// Kill process
await sandbox.killProcess(proc.pid);
```

## Cleanup

```typescript
// Destroy sandbox permanently
await sandbox.destroy();
// All files deleted, container removed, cannot be recovered
```

---

**Back to:** [Main cloudflare-sandbox SKILL.md](../SKILL.md)
