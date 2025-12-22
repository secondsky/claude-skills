/**
 * MCP Server with Bearer Token Authentication
 *
 * Demonstrates Bearer token authentication pattern for custom auth systems.
 * Shows middleware pattern for validating Authorization headers.
 *
 * Based on: https://github.com/cloudflare/ai/tree/main/demos/mcp-server-bearer-auth
 *
 * ═══════════════════════════════════════════════════════════════
 * 🔐 BEARER TOKEN AUTHENTICATION
 * ═══════════════════════════════════════════════════════════════
 *
 * This pattern is for:
 * - Custom authentication systems
 * - API key validation
 * - Service-to-service communication
 * - Integration with existing auth backends
 *
 * NOT for:
 * - OAuth (use OAuth Proxy pattern instead)
 * - Public APIs (use authless pattern)
 * - Enterprise SSO (use Auth0/Okta integrations)
 *
 * ═══════════════════════════════════════════════════════════════
 * 📋 HOW IT WORKS
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. Client sends request with Authorization header:
 *    Authorization: Bearer YOUR_TOKEN_HERE
 *
 * 2. Worker validates token (check against database, external API, etc.)
 *
 * 3. If valid: Pass token to MCP server via ctx.props
 *
 * 4. If invalid: Return 401 Unauthorized
 *
 * 5. MCP tools can access token via this.props.bearerToken
 *
 * ═══════════════════════════════════════════════════════════════
 * 🔧 CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 *
 * Option 1: Static token list (simple, for development)
 * Option 2: Check against KV store (production)
 * Option 3: Validate with external API (most flexible)
 *
 * This template shows all three approaches.
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type Env = {
  // Optional: KV for token storage
  AUTH_TOKENS?: KVNamespace;

  // Optional: API endpoint for token validation
  AUTH_API_URL?: string;
};

/**
 * Props passed to MCP server after authentication
 */
type Props = {
  bearerToken: string; // The validated token
  userId?: string; // Optional: User ID from token
};

/**
 * MCP Server with bearer token authentication
 */
export class MyMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: "Bearer Auth MCP Server",
    version: "1.0.0",
  });

  async init() {
    // ═══════════════════════════════════════════════════════════════
    // TOOL 1: Echo with Auth Info
    // ═══════════════════════════════════════════════════════════════
    // Demonstrates accessing bearer token from props
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "echo_auth",
      "Echo back your message along with auth info",
      {
        message: z.string().describe("Message to echo"),
      },
      async ({ message }) => {
        // Access authenticated user info
        const token = this.props?.bearerToken || "none";
        const userId = this.props?.userId || "unknown";

        return {
          content: [
            {
              type: "text",
              text: `Message: ${message}\n\nAuth Info:\n- Token: ${token.substring(0, 10)}...\n- User ID: ${userId}`,
            },
          ],
        };
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // TOOL 2: Protected Tool Example
    // ═══════════════════════════════════════════════════════════════
    // Only accessible to authenticated users
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "protected_action",
      "Perform a protected action (requires auth)",
      {
        action: z.string().describe("Action to perform"),
      },
      async ({ action }) => {
        // Verify authentication (should always pass if middleware worked)
        if (!this.props?.bearerToken) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Unauthenticated. This should never happen if middleware is working.",
              },
            ],
            isError: true,
          };
        }

        // Perform protected action
        return {
          content: [
            {
              type: "text",
              text: `Protected action "${action}" performed successfully by user ${this.props.userId}`,
            },
          ],
        };
      }
    );
  }
}

/**
 * Validate bearer token
 *
 * Three validation strategies (choose one):
 * 1. Static list (development)
 * 2. KV store lookup (production)
 * 3. External API validation (most flexible)
 */
async function validateToken(
  token: string,
  env: Env
): Promise<{ valid: boolean; userId?: string }> {
  // ═══════════════════════════════════════════════════════════════
  // Strategy 1: Static Token List (Development Only!)
  // ═══════════════════════════════════════════════════════════════
  // ⚠️ DON'T use in production! Tokens exposed in code.
  // ═══════════════════════════════════════════════════════════════
  const VALID_TOKENS = {
    "dev-token-123": "user-1",
    "dev-token-456": "user-2",
  };

  if (VALID_TOKENS[token]) {
    return { valid: true, userId: VALID_TOKENS[token] };
  }

  // ═══════════════════════════════════════════════════════════════
  // Strategy 2: KV Store Lookup (Production)
  // ═══════════════════════════════════════════════════════════════
  // Store tokens in KV: { "token-abc123": "user-id" }
  // ═══════════════════════════════════════════════════════════════
  if (env.AUTH_TOKENS) {
    const userId = await env.AUTH_TOKENS.get(token);
    if (userId) {
      return { valid: true, userId };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Strategy 3: External API Validation (Most Flexible)
  // ═══════════════════════════════════════════════════════════════
  // Validate token with external auth service
  // ═══════════════════════════════════════════════════════════════
  if (env.AUTH_API_URL) {
    try {
      const response = await fetch(`${env.AUTH_API_URL}/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { valid: true, userId: data.userId };
      }
    } catch (error) {
      console.error("Token validation error:", error);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Token Invalid
  // ═══════════════════════════════════════════════════════════════
  return { valid: false };
}

/**
 * Worker fetch handler with bearer auth middleware
 *
 * ═══════════════════════════════════════════════════════════════
 * 🔐 AUTHENTICATION FLOW
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. Extract Authorization header
 * 2. Validate bearer token
 * 3. If valid: Pass to MCP server with user context
 * 4. If invalid: Return 401 Unauthorized
 *
 * Client configuration:
 * {
 *   "mcpServers": {
 *     "my-mcp": {
 *       "url": "https://YOUR-WORKER.workers.dev/sse",
 *       "headers": {
 *         "Authorization": "Bearer YOUR_TOKEN_HERE"
 *       }
 *     }
 *   }
 * }
 *
 * ═══════════════════════════════════════════════════════════════
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { pathname } = new URL(request.url);

    // ═══════════════════════════════════════════════════════════════
    // Handle CORS Preflight (no auth required)
    // ═══════════════════════════════════════════════════════════════
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // Health Check (no auth required)
    // ═══════════════════════════════════════════════════════════════
    if (pathname === "/" || pathname === "/health") {
      return new Response(
        JSON.stringify({
          name: "Bearer Auth MCP Server",
          version: "1.0.0",
          transports: {
            sse: "/sse",
            http: "/mcp",
          },
          auth: "Bearer token required",
          status: "ok",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // Authentication Middleware
    // ═══════════════════════════════════════════════════════════════
    // Extract and validate bearer token before serving MCP
    // ═══════════════════════════════════════════════════════════════

    // 1. Extract Authorization header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Missing Authorization header",
          hint: 'Include header: Authorization: Bearer YOUR_TOKEN',
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": 'Bearer realm="MCP Server"',
          },
        }
      );
    }

    // 2. Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid Authorization header format",
          hint: 'Use format: Authorization: Bearer YOUR_TOKEN',
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": 'Bearer realm="MCP Server"',
          },
        }
      );
    }

    // 3. Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // 4. Validate token
    const { valid, userId } = await validateToken(token, env);

    if (!valid) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid bearer token",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": 'Bearer realm="MCP Server"',
          },
        }
      );
    }

    // 5. Authentication successful! Set props and pass to MCP server
    const props: Props = {
      bearerToken: token,
      userId,
    };

    // ═══════════════════════════════════════════════════════════════
    // SSE Transport (with auth)
    // ═══════════════════════════════════════════════════════════════
    if (pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse").fetch(request, env, {
        ...ctx,
        props,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // HTTP Transport (with auth)
    // ═══════════════════════════════════════════════════════════════
    if (pathname.startsWith("/mcp")) {
      return MyMCP.serve("/mcp").fetch(request, env, {
        ...ctx,
        props,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
