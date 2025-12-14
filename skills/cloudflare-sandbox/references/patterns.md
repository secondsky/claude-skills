# Cloudflare Sandbox SDK - Common Patterns

Comprehensive implementation patterns for building applications with Cloudflare Sandboxes. Load this reference when implementing specific use cases like code execution APIs, persistent workspaces, CI/CD pipelines, or AI agent integrations.

---

## Pattern 1: One-Shot Code Execution

```typescript
export default {
  async fetch(request: Request, env: Env) {
    const { code, language } = await request.json();

    // Create ephemeral sandbox
    const sandboxId = `exec-${Date.now()}-${crypto.randomUUID()}`;
    const sandbox = getSandbox(env.Sandbox, sandboxId);

    try {
      // Create code context
      const ctx = await sandbox.createCodeContext({ language });

      // Execute code safely
      const result = await sandbox.runCode(code, {
        context: ctx,
        timeout: 10000
      });

      return Response.json({
        result: result.results?.[0]?.text,
        logs: result.logs,
        error: result.error
      });
    } finally {
      // Always cleanup
      await sandbox.destroy();
    }
  }
};
```

**When to use**: API endpoints for code execution, code playgrounds, learning platforms

## Pattern 2: Persistent User Workspace

```typescript
export default {
  async fetch(request: Request, env: Env) {
    const userId = request.headers.get('X-User-ID');
    const { command, sessionId: existingSession } = await request.json();

    // User-specific sandbox (persists while active)
    const sandbox = getSandbox(env.Sandbox, `user-${userId}`);

    // Get or create session
    let sessionId = existingSession;
    if (!sessionId) {
      sessionId = await sandbox.createSession();
    }

    // Execute command in persistent context
    const result = await sandbox.exec(command, {
      session: sessionId,
      timeout: 30000
    });

    return Response.json({
      sessionId, // Return for next request
      output: result.stdout,
      error: result.stderr,
      success: result.success
    });
  }
};
```

**When to use**: Interactive coding environments, notebooks, IDEs, development workspaces

## Pattern 3: CI/CD Build Pipeline

```typescript
async function runBuild(repoUrl: string, commit: string, env: Env) {
  const sandboxId = `build-${repoUrl.split('/').pop()}-${commit}`;
  const sandbox = getSandbox(env.Sandbox, sandboxId);

  try {
    // Clone repository
    await sandbox.gitCheckout(repoUrl, '/workspace/repo');

    // Checkout specific commit
    await sandbox.exec(`git checkout ${commit}`, {
      cwd: '/workspace/repo'
    });

    // Install dependencies
    const install = await sandbox.exec('npm install', {
      cwd: '/workspace/repo',
      timeout: 180000 // 3 minutes
    });

    if (!install.success) {
      throw new Error(`Install failed: ${install.stderr}`);
    }

    // Run build
    const build = await sandbox.exec('npm run build', {
      cwd: '/workspace/repo',
      timeout: 300000 // 5 minutes
    });

    if (!build.success) {
      throw new Error(`Build failed: ${build.stderr}`);
    }

    // Save artifacts to R2
    const dist = await sandbox.exec('tar -czf dist.tar.gz dist', {
      cwd: '/workspace/repo'
    });
    const artifact = await sandbox.readFile('/workspace/repo/dist.tar.gz');
    await env.R2.put(`builds/${commit}.tar.gz`, artifact);

    return { success: true, artifactKey: `builds/${commit}.tar.gz` };
  } finally {
    // Destroy sandbox to prevent resource leaks
    await sandbox.destroy();
    console.log(`Destroyed sandbox ${sandboxId}`);

    // Debugging tip: To retain sandboxes for debugging, conditionally
    // skip destroy() based on an environment variable:
    // if (!env.DEBUG_KEEP_SANDBOXES) { await sandbox.destroy(); }
  }
}
```

**When to use**: Build systems, testing pipelines, deployment automation

## Pattern 4: AI Agent with Claude Code

```typescript
async function runClaudeCodeOnRepo(
  repoUrl: string,
  task: string,
  env: Env
): Promise<{ diff: string; logs: string }> {
  const sandboxId = `claude-${Date.now()}`;
  const sandbox = getSandbox(env.Sandbox, sandboxId);

  try {
    // Clone repository
    await sandbox.gitCheckout(repoUrl, '/workspace/repo');

    // Run Claude Code CLI with API key in environment
    // ⚠️ WARNING: Never log 'result', 'cmd', or the 'env' object
    // to prevent API key exposure in logs
    const result = await sandbox.exec(
      `claude -p "${task}" --permission-mode acceptEdits`,
      {
        cwd: '/workspace/repo',
        timeout: 300000, // 5 minutes
        // Merge API key into environment - NEVER log this object
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY
        }
      }
    );

    // Get diff of changes
    const diff = await sandbox.exec('git diff', {
      cwd: '/workspace/repo'
    });

    return {
      diff: diff.stdout,
      logs: result.stdout
    };
  } finally {
    await sandbox.destroy();
  }
}
```

**When to use**: Automated code refactoring, code generation, AI-powered development

---

**Back to:** [Main cloudflare-sandbox SKILL.md](../SKILL.md)
