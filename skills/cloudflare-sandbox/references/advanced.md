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
interface SafeExecOptions {
  timeout?: number;
  debug?: boolean;
  allowSensitiveLogs?: boolean;
}

interface SafeExecResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode: number;
}

async function safeSandboxExec(
  sandbox: Sandbox,
  cmd: string,
  options?: SafeExecOptions
): Promise<SafeExecResult> {
  try {
    const result = await sandbox.exec(cmd, {
      timeout: options?.timeout || 30000
    });

    if (!result.success) {
      // Only log details if explicitly allowed
      if (options?.debug || options?.allowSensitiveLogs) {
        console.error(`Command failed: ${cmd}`, {
          exitCode: result.exitCode,
          stderr: result.stderr?.substring(0, 200) // Truncate
        });
      } else {
        console.error(`Sandbox command failed with exit code ${result.exitCode}`);
      }

      return {
        success: false,
        error: "Command execution failed",
        exitCode: result.exitCode
      };
    }

    return {
      success: true,
      output: result.stdout,
      exitCode: 0
    };
  } catch (error) {
    // Safe error message extraction
    const safeMessage = error instanceof Error
      ? error.message
      : String(error);

    if (options?.debug) {
      console.error(`Sandbox error: ${safeMessage}`);
    } else {
      console.error(`Sandbox execution error occurred`);
    }

    return {
      success: false,
      error: "Sandbox execution error",
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
