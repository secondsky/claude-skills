/**
 * Cloudflare Sandbox - Chat-Based Coding Agent Pattern
 *
 * Use Case: Multi-step conversational workflows, interactive development environments
 *
 * Features:
 * - Persistent sandbox per user (survives while active)
 * - Session management for stateful command execution
 * - Working directory preserved across messages
 * - Conversation state stored in KV
 *
 * Pattern: Per-User Sandbox + Sessions + State Persistence
 */

import { getSandbox, type Sandbox } from '@cloudflare/sandbox';
export { Sandbox } from '@cloudflare/sandbox';

type Env = {
  Sandbox: DurableObjectNamespace<Sandbox>;
  KV: KVNamespace; // For storing conversation state
};

type ConversationState = {
  sandboxId: string;
  sessionId: string;
  workingDirectory: string;
  createdAt: number;
};

type ChatRequest = {
  userId: string;
  conversationId: string;
  command: string;
  timeout?: number;
};

type ChatResponse = {
  success: boolean;
  output?: string;
  error?: string;
  workingDirectory?: string;
  executionTime?: number;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json() as ChatRequest;

      // Validate input
      if (!body.userId || !body.conversationId || !body.command) {
        return Response.json({
          success: false,
          error: 'userId, conversationId, and command are required'
        }, { status: 400 });
      }

      const startTime = Date.now();

      // Get or create conversation state
      let state = await getConversationState(env, body.conversationId);

      if (!state) {
        // First message in conversation - initialize state
        state = await initializeConversation(env, body.userId, body.conversationId);
      }

      // Get sandbox instance
      const sandbox = getSandbox(env.Sandbox, state.sandboxId);

      try {
        // Execute command in persistent session
        const result = await sandbox.exec(body.command, {
          session: state.sessionId,
          timeout: body.timeout || 30000, // Default 30s timeout
          cwd: state.workingDirectory
        });

        const executionTime = Date.now() - startTime;

        // Update working directory if command was `cd`
        if (body.command.trim().startsWith('cd ')) {
          // Get current working directory
          const pwdResult = await sandbox.exec('pwd', {
            session: state.sessionId
          });
          if (pwdResult.success) {
            state.workingDirectory = pwdResult.stdout.trim();
            await saveConversationState(env, body.conversationId, state);
          }
        }

        // Check if command succeeded
        if (!result.success) {
          return Response.json({
            success: false,
            error: result.stderr || `Command failed with exit code ${result.exitCode}`,
            workingDirectory: state.workingDirectory,
            executionTime
          }, { status: 400 });
        }

        // Return successful result
        return Response.json({
          success: true,
          output: result.stdout,
          workingDirectory: state.workingDirectory,
          executionTime
        });

      } catch (error) {
        console.error('Command execution error:', error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Execution failed'
        }, { status: 500 });
      }

    } catch (error) {
      console.error('Request processing error:', error);
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
};

/**
 * Helper: Get conversation state from KV
 */
async function getConversationState(
  env: Env,
  conversationId: string
): Promise<ConversationState | null> {
  const stateJson = await env.KV.get(`conversation:${conversationId}`);
  if (!stateJson) return null;

  try {
    return JSON.parse(stateJson) as ConversationState;
  } catch {
    return null;
  }
}

/**
 * Helper: Save conversation state to KV
 */
async function saveConversationState(
  env: Env,
  conversationId: string,
  state: ConversationState
): Promise<void> {
  await env.KV.put(
    `conversation:${conversationId}`,
    JSON.stringify(state),
    {
      expirationTtl: 3600 // Expire after 1 hour of inactivity
    }
  );
}

/**
 * Helper: Initialize new conversation
 */
async function initializeConversation(
  env: Env,
  userId: string,
  conversationId: string
): Promise<ConversationState> {
  // Create per-user sandbox (persists while active ~10 min)
  const sandboxId = `user-${userId}`;
  const sandbox = getSandbox(env.Sandbox, sandboxId);

  // Create new session for this conversation
  const sessionId = await sandbox.createSession();

  // Set initial working directory
  const pwdResult = await sandbox.exec('pwd', { session: sessionId });
  const workingDirectory = pwdResult.success
    ? pwdResult.stdout.trim()
    : '/workspace';

  const state: ConversationState = {
    sandboxId,
    sessionId,
    workingDirectory,
    createdAt: Date.now()
  };

  await saveConversationState(env, conversationId, state);

  return state;
}

/**
 * Example Usage:
 *
 * Message 1:
 * POST /
 * {
 *   "userId": "user123",
 *   "conversationId": "conv456",
 *   "command": "mkdir myproject && cd myproject"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "output": "",
 *   "workingDirectory": "/workspace/myproject",
 *   "executionTime": 123
 * }
 *
 * Message 2 (same conversation):
 * POST /
 * {
 *   "userId": "user123",
 *   "conversationId": "conv456",
 *   "command": "echo 'hello' > file.txt"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "output": "",
 *   "workingDirectory": "/workspace/myproject",
 *   "executionTime": 98
 * }
 *
 * Message 3 (same conversation, still in /workspace/myproject):
 * POST /
 * {
 *   "userId": "user123",
 *   "conversationId": "conv456",
 *   "command": "cat file.txt"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "output": "hello\n",
 *   "workingDirectory": "/workspace/myproject",
 *   "executionTime": 87
 * }
 */

/**
 * wrangler.jsonc additions required:
 *
 * {
 *   "kv_namespaces": [
 *     {
 *       "binding": "KV",
 *       "id": "your-kv-namespace-id"
 *     }
 *   ]
 * }
 */
