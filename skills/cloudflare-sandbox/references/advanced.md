# Cloudflare Sandbox SDK - Advanced Topics

Advanced patterns for production deployments including geographic distribution, error handling strategies, and security hardening. Load this reference when implementing global applications, robust error handling, or security-critical features.

---

## Geographic Distribution

First request to a sandbox ID determines its geographic location (via Durable Objects).

**For Global Apps**:
```typescript
// Option 1: Multiple sandboxes per user (better latency)
const region = request.cf?.colo || 'default';
const sandbox = getSandbox(env.Sandbox, `user-${userId}-${region}`);

// Option 2: Single sandbox (simpler, higher latency for distant users)
const sandbox = getSandbox(env.Sandbox, `user-${userId}`);
```

## Error Handling Strategy

```typescript
async function safeSandboxExec(
  sandbox: Sandbox,
  cmd: string,
  options?: any
) {
  try {
    const result = await sandbox.exec(cmd, {
      ...options,
      timeout: options?.timeout || 30000
    });

    if (!result.success) {
      console.error(`Command failed: ${cmd}`, {
        exitCode: result.exitCode,
        stderr: result.stderr
      });

      return {
        success: false,
        error: result.stderr,
        exitCode: result.exitCode
      };
    }

    return {
      success: true,
      output: result.stdout,
      exitCode: 0
    };
  } catch (error) {
    console.error(`Sandbox error:`, error);
    return {
      success: false,
      error: error.message,
      exitCode: -1
    };
  }
}
```

## Security Hardening

```typescript
// Input validation
function sanitizeCommand(input: string): string {
  const dangerous = ['rm -rf', '$(', '`', '&&', '||', ';', '|'];
  for (const pattern of dangerous) {
    if (input.includes(pattern)) {
      throw new Error(`Dangerous pattern detected: ${pattern}`);
    }
  }
  return input;
}

// Use code interpreter instead of direct exec for untrusted code
async function executeUntrustedCode(code: string, sandbox: Sandbox) {
  const ctx = await sandbox.createCodeContext({ language: 'python' });
  return await sandbox.runCode(code, { context: ctx, timeout: 10000 });
}
```

---

**Back to:** [Main cloudflare-sandbox SKILL.md](../SKILL.md)
