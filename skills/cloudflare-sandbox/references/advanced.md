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
// ⚠️ SECURITY WARNING: Blocklist Approach Has Limited Effectiveness
//
// This blocklist-based filtering is best-effort and can be easily bypassed:
// - Incomplete: Many dangerous patterns missing (e.g., newlines, $((, ${)
// - Bypassable: Encoding, obfuscation, shell aliases can evade detection
// - Brittle: Legitimate commands may be blocked unnecessarily
//
// RECOMMENDED SAFER APPROACHES (in order of preference):
//
// 1. Use Code Interpreter API (safest for untrusted input):
//    const ctx = await sandbox.createCodeContext({ language: 'python' });
//    const result = await sandbox.runCode(userCode, { context: ctx });
//
// 2. Use Allowlist (permit only known-safe commands):
//    const ALLOWED = ['ls', 'pwd', 'cat', 'echo'];
//    const cmd = input.split(' ')[0];
//    if (!ALLOWED.includes(cmd)) throw new Error('Command not allowed');
//
// 3. Use Structured Arguments (avoid shell entirely):
//    sandbox.execFile('/usr/bin/ls', ['-la', userDir], options)
//
// Only use blocklists for simple, low-risk scenarios with additional controls.

// Input validation (BLOCKLIST - Use with caution, prefer allowlist)
function sanitizeCommand(input: string): string {
  const dangerous = ['rm -rf', '$(', '`', '&&', '||', ';', '|'];
  for (const pattern of dangerous) {
    if (input.includes(pattern)) {
      throw new Error(`Dangerous pattern detected: ${pattern}`);
    }
  }
  return input;
}

// RECOMMENDED: Allowlist-based validation
const ALLOWED_COMMANDS = ['ls', 'pwd', 'cat', 'echo', 'find', 'grep'];

function validateCommand(cmd: string): void {
  const baseCommand = cmd.trim().split(' ')[0];
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    throw new Error(`Command not allowed: ${baseCommand}. Permitted: ${ALLOWED_COMMANDS.join(', ')}`);
  }
}

// Usage:
// validateCommand(userInput);
// await sandbox.exec(userInput);

// Use code interpreter instead of direct exec for untrusted code
async function executeUntrustedCode(code: string, sandbox: Sandbox) {
  const ctx = await sandbox.createCodeContext({ language: 'python' });
  return await sandbox.runCode(code, { context: ctx, timeout: 10000 });
}
```

---

**Back to:** [Main cloudflare-sandbox SKILL.md](../SKILL.md)
