/**
 * Cloudflare Sandbox - Persistent User Workspace Pattern
 *
 * Use Case: Interactive notebooks, IDEs, development environments with file persistence
 *
 * Features:
 * - Per-user sandbox (persists while active ~10 min)
 * - Automatic backup to R2 for long-term persistence
 * - Restore from R2 on cold starts
 * - File operations (read, write, list, delete)
 * - Session management for command execution
 *
 * Pattern: User Sandbox + R2 Backup + Auto-Restore
 */

import { getSandbox, type Sandbox } from '@cloudflare/sandbox';
export { Sandbox } from '@cloudflare/sandbox';

type Env = {
  Sandbox: DurableObjectNamespace<Sandbox>;
  R2: R2Bucket; // For backing up workspace files
  KV: KVNamespace; // For storing workspace metadata
};

type WorkspaceRequest =
  | { action: 'execute'; userId: string; command: string; timeout?: number }
  | { action: 'writeFile'; userId: string; path: string; content: string }
  | { action: 'readFile'; userId: string; path: string }
  | { action: 'listFiles'; userId: string; directory?: string }
  | { action: 'deleteFile'; userId: string; path: string }
  | { action: 'backup'; userId: string }
  | { action: 'restore'; userId: string }
  | { action: 'reset'; userId: string };

type WorkspaceResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json() as WorkspaceRequest;

      // Validate input
      if (!body.userId) {
        return Response.json({
          success: false,
          error: 'userId is required'
        }, { status: 400 });
      }

      // Get user's sandbox
      const sandboxId = `workspace-${body.userId}`;
      const sandbox = getSandbox(env.Sandbox, sandboxId);

      // Handle different actions
      switch (body.action) {
        case 'execute':
          return await handleExecute(sandbox, env, body);

        case 'writeFile':
          return await handleWriteFile(sandbox, env, body);

        case 'readFile':
          return await handleReadFile(sandbox, env, body);

        case 'listFiles':
          return await handleListFiles(sandbox, env, body);

        case 'deleteFile':
          return await handleDeleteFile(sandbox, env, body);

        case 'backup':
          return await handleBackup(sandbox, env, body);

        case 'restore':
          return await handleRestore(sandbox, env, body);

        case 'reset':
          return await handleReset(sandbox, env, body);

        default:
          return Response.json({
            success: false,
            error: 'Invalid action'
          }, { status: 400 });
      }

    } catch (error) {
      console.error('Workspace error:', error);
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
};

/**
 * Execute command in user's workspace
 */
async function handleExecute(
  sandbox: Sandbox,
  env: Env,
  body: Extract<WorkspaceRequest, { action: 'execute' }>
): Promise<Response> {
  // Get or create session
  const sessionKey = `session:${body.userId}`;
  let sessionId = await env.KV.get(sessionKey);

  if (!sessionId) {
    sessionId = await sandbox.createSession();
    await env.KV.put(sessionKey, sessionId, { expirationTtl: 3600 });
  }

  // Check if workspace needs restoration
  await ensureWorkspaceRestored(sandbox, env, body.userId);

  // Execute command
  const result = await sandbox.exec(body.command, {
    session: sessionId,
    timeout: body.timeout || 30000,
    cwd: '/workspace'
  });

  if (!result.success) {
    return Response.json({
      success: false,
      error: result.stderr,
      data: { exitCode: result.exitCode }
    }, { status: 400 });
  }

  return Response.json({
    success: true,
    data: {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode
    }
  });
}

/**
 * Write file to user's workspace
 */
async function handleWriteFile(
  sandbox: Sandbox,
  env: Env,
  body: Extract<WorkspaceRequest, { action: 'writeFile' }>
): Promise<Response> {
  await ensureWorkspaceRestored(sandbox, env, body.userId);

  await sandbox.writeFile(`/workspace/${body.path}`, body.content);

  // Auto-backup after write
  await backupFile(sandbox, env, body.userId, body.path);

  return Response.json({
    success: true,
    data: { path: body.path, size: body.content.length }
  });
}

/**
 * Read file from user's workspace
 */
async function handleReadFile(
  sandbox: Sandbox,
  env: Env,
  body: Extract<WorkspaceRequest, { action: 'readFile' }>
): Promise<Response> {
  await ensureWorkspaceRestored(sandbox, env, body.userId);

  try {
    const content = await sandbox.readFile(`/workspace/${body.path}`);

    return Response.json({
      success: true,
      data: { path: body.path, content }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: `File not found: ${body.path}`
    }, { status: 404 });
  }
}

/**
 * List files in user's workspace
 */
async function handleListFiles(
  sandbox: Sandbox,
  env: Env,
  body: Extract<WorkspaceRequest, { action: 'listFiles' }>
): Promise<Response> {
  await ensureWorkspaceRestored(sandbox, env, body.userId);

  const directory = body.directory || '';
  const result = await sandbox.exec(`find ${directory} -type f`, {
    cwd: '/workspace',
    timeout: 10000
  });

  if (!result.success) {
    return Response.json({
      success: false,
      error: result.stderr
    }, { status: 400 });
  }

  const files = result.stdout
    .split('\n')
    .filter(f => f.trim())
    .map(f => f.replace(/^\.\//, ''));

  return Response.json({
    success: true,
    data: { files }
  });
}

/**
 * Delete file from user's workspace
 */
async function handleDeleteFile(
  sandbox: Sandbox,
  env: Env,
  body: Extract<WorkspaceRequest, { action: 'deleteFile' }>
): Promise<Response> {
  await ensureWorkspaceRestored(sandbox, env, body.userId);

  await sandbox.rm(`/workspace/${body.path}`);

  // Delete from R2 backup
  await env.R2.delete(`workspaces/${body.userId}/${body.path}`);

  return Response.json({
    success: true,
    data: { deleted: body.path }
  });
}

/**
 * Manually backup entire workspace
 */
async function handleBackup(
  sandbox: Sandbox,
  env: Env,
  body: Extract<WorkspaceRequest, { action: 'backup' }>
): Promise<Response> {
  const result = await sandbox.exec('find . -type f', {
    cwd: '/workspace',
    timeout: 10000
  });

  if (!result.success) {
    return Response.json({
      success: false,
      error: 'Failed to list files'
    }, { status: 500 });
  }

  const files = result.stdout.split('\n').filter(f => f.trim());
  let backedUp = 0;

  for (const file of files) {
    const cleanPath = file.replace(/^\.\//, '');
    try {
      await backupFile(sandbox, env, body.userId, cleanPath);
      backedUp++;
    } catch (error) {
      console.error(`Failed to backup ${cleanPath}:`, error);
    }
  }

  return Response.json({
    success: true,
    data: { filesBackedUp: backedUp, totalFiles: files.length }
  });
}

/**
 * Restore workspace from R2
 */
async function handleRestore(
  sandbox: Sandbox,
  env: Env,
  body: Extract<WorkspaceRequest, { action: 'restore' }>
): Promise<Response> {
  const restored = await restoreWorkspace(sandbox, env, body.userId);

  return Response.json({
    success: true,
    data: { filesRestored: restored }
  });
}

/**
 * Reset user's workspace
 */
async function handleReset(
  sandbox: Sandbox,
  env: Env,
  body: Extract<WorkspaceRequest, { action: 'reset' }>
): Promise<Response> {
  // Delete all files from R2
  const listed = await env.R2.list({ prefix: `workspaces/${body.userId}/` });
  for (const obj of listed.objects) {
    await env.R2.delete(obj.key);
  }

  // Destroy sandbox
  await sandbox.destroy();

  // Clear session
  await env.KV.delete(`session:${body.userId}`);
  await env.KV.delete(`workspace:restored:${body.userId}`);

  return Response.json({
    success: true,
    data: { reset: true }
  });
}

/**
 * Helper: Ensure workspace is restored from R2 (handles cold starts)
 */
async function ensureWorkspaceRestored(
  sandbox: Sandbox,
  env: Env,
  userId: string
): Promise<void> {
  const restoredKey = `workspace:restored:${userId}`;
  const isRestored = await env.KV.get(restoredKey);

  if (!isRestored) {
    await restoreWorkspace(sandbox, env, userId);
    await env.KV.put(restoredKey, 'true', { expirationTtl: 600 }); // 10 min TTL
  }
}

/**
 * Helper: Restore all files from R2
 */
async function restoreWorkspace(
  sandbox: Sandbox,
  env: Env,
  userId: string
): Promise<number> {
  const listed = await env.R2.list({ prefix: `workspaces/${userId}/` });
  let restored = 0;

  for (const obj of listed.objects) {
    const file = await env.R2.get(obj.key);
    if (!file) continue;

    const relativePath = obj.key.replace(`workspaces/${userId}/`, '');
    const content = await file.text();

    await sandbox.writeFile(`/workspace/${relativePath}`, content);
    restored++;
  }

  return restored;
}

/**
 * Helper: Backup single file to R2
 */
async function backupFile(
  sandbox: Sandbox,
  env: Env,
  userId: string,
  path: string
): Promise<void> {
  const content = await sandbox.readFile(`/workspace/${path}`);
  await env.R2.put(`workspaces/${userId}/${path}`, content, {
    customMetadata: {
      userId,
      lastModified: new Date().toISOString()
    }
  });
}

/**
 * Example Usage:
 *
 * 1. Create file:
 * POST / { "action": "writeFile", "userId": "user123", "path": "hello.py", "content": "print('hello')" }
 *
 * 2. Execute code:
 * POST / { "action": "execute", "userId": "user123", "command": "python hello.py" }
 * Response: { "success": true, "data": { "stdout": "hello\n", ... } }
 *
 * 3. List files:
 * POST / { "action": "listFiles", "userId": "user123" }
 * Response: { "success": true, "data": { "files": ["hello.py"] } }
 *
 * 4. Backup (automatic on write, or manual):
 * POST / { "action": "backup", "userId": "user123" }
 *
 * 5. After container goes idle, workspace auto-restores from R2 on next request
 */

/**
 * wrangler.jsonc additions required:
 *
 * {
 *   "r2_buckets": [{ "binding": "R2", "bucket_name": "user-workspaces" }],
 *   "kv_namespaces": [{ "binding": "KV", "id": "your-kv-id" }]
 * }
 */
