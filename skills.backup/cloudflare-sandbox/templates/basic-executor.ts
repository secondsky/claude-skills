/**
 * Cloudflare Sandbox - Basic Code Executor Pattern
 *
 * Use Case: One-shot code execution for code playgrounds, learning platforms, API endpoints
 *
 * Features:
 * - Ephemeral sandbox (created and destroyed per request)
 * - Code interpreter API for automatic result capture
 * - Proper error handling and cleanup
 * - Timeout protection
 *
 * Pattern: Create → Execute → Cleanup
 */

import { getSandbox, type Sandbox } from '@cloudflare/sandbox';
export { Sandbox } from '@cloudflare/sandbox';

type Env = {
  Sandbox: DurableObjectNamespace<Sandbox>;
};

type ExecuteRequest = {
  code: string;
  language: 'python' | 'javascript';
  timeout?: number; // Optional timeout in milliseconds
};

type ExecuteResponse = {
  success: boolean;
  result?: string;
  logs?: string;
  error?: string;
  executionTime?: number;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json() as ExecuteRequest;

      // Validate input
      if (!body.code) {
        return Response.json({
          success: false,
          error: 'Code is required'
        }, { status: 400 });
      }

      if (!['python', 'javascript'].includes(body.language)) {
        return Response.json({
          success: false,
          error: 'Language must be python or javascript'
        }, { status: 400 });
      }

      // Create ephemeral sandbox with unique ID
      const sandboxId = `exec-${Date.now()}-${crypto.randomUUID()}`;
      const sandbox = getSandbox(env.Sandbox, sandboxId);

      const startTime = Date.now();

      try {
        // Create code context
        const ctx = await sandbox.createCodeContext({
          language: body.language
        });

        // Execute code with automatic result capture
        const result = await sandbox.runCode(body.code, {
          context: ctx,
          timeout: body.timeout || 10000 // Default 10s timeout
        });

        const executionTime = Date.now() - startTime;

        // Check for execution errors
        if (result.error) {
          return Response.json({
            success: false,
            error: result.error,
            logs: result.logs,
            executionTime
          }, { status: 400 });
        }

        // Return successful result
        return Response.json({
          success: true,
          result: result.results?.[0]?.text || null,
          logs: result.logs,
          executionTime
        });

      } finally {
        // CRITICAL: Always destroy ephemeral sandboxes to avoid resource leaks
        await sandbox.destroy();
      }

    } catch (error) {
      console.error('Execution error:', error);
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
};

/**
 * Example Usage:
 *
 * POST /
 * Content-Type: application/json
 *
 * {
 *   "code": "import math\nmath.pi * 2",
 *   "language": "python",
 *   "timeout": 5000
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "result": "6.283185307179586",
 *   "logs": "",
 *   "executionTime": 234
 * }
 */
