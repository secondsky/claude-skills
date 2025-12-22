/**
 * Basic MCP Server (No Authentication)
 *
 * A simple Model Context Protocol server with basic tools.
 * Demonstrates the core McpAgent pattern without authentication.
 *
 * Perfect for: Internal tools, development, public APIs
 *
 * Based on: https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless
 *
 * ⚠️ CRITICAL URL CONFIGURATION:
 *
 * This template serves MCP at TWO base paths:
 * - SSE transport: /sse
 * - HTTP transport: /mcp
 *
 * Your client configuration MUST match:
 * {
 *   "mcpServers": {
 *     "my-mcp": {
 *       "url": "https://YOUR-WORKER.workers.dev/sse"  // ← Include /sse!
 *     }
 *   }
 * }
 *
 * Common mistakes:
 * ❌ "url": "https://YOUR-WORKER.workers.dev"      // Missing /sse → 404
 * ❌ "url": "http://localhost:8788"                // Wrong after deploy
 * ✅ "url": "https://YOUR-WORKER.workers.dev/sse"  // Correct!
 *
 * After deploying:
 * 1. Test with: curl https://YOUR-WORKER.workers.dev/sse
 * 2. Update client config with exact URL from step 1
 * 3. Restart Claude Desktop
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type Env = {
  // Add your environment bindings here
  // Example: MY_KV: KVNamespace;
};

/**
 * MyMCP extends McpAgent to create a stateless MCP server
 */
export class MyMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "My MCP Server",
    version: "1.0.0",
  });

  /**
   * Initialize tools, resources, and prompts
   * Called automatically by McpAgent base class
   */
  async init() {
    // Simple calculation tool
    this.server.tool(
      "add",
      "Add two numbers together",
      {
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
      },
      async ({ a, b }) => ({
        content: [
          {
            type: "text",
            text: `The sum of ${a} + ${b} = ${a + b}`,
          },
        ],
      })
    );

    // Calculator tool with operations
    this.server.tool(
      "calculate",
      "Perform basic arithmetic operations",
      {
        operation: z
          .enum(["add", "subtract", "multiply", "divide"])
          .describe("The arithmetic operation to perform"),
        a: z.number().describe("First operand"),
        b: z.number().describe("Second operand"),
      },
      async ({ operation, a, b }) => {
        let result: number;

        switch (operation) {
          case "add":
            result = a + b;
            break;
          case "subtract":
            result = a - b;
            break;
          case "multiply":
            result = a * b;
            break;
          case "divide":
            if (b === 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: Division by zero is not allowed",
                  },
                ],
                isError: true,
              };
            }
            result = a / b;
            break;
        }

        return {
          content: [
            {
              type: "text",
              text: `Result: ${a} ${operation} ${b} = ${result}`,
            },
          ],
        };
      }
    );

    // Example resource (optional)
    this.server.resource({
      uri: "about://server",
      name: "About this server",
      description: "Information about this MCP server",
      mimeType: "text/plain",
    }, async () => ({
      contents: [{
        uri: "about://server",
        mimeType: "text/plain",
        text: "This is a basic MCP server running on Cloudflare Workers"
      }]
    }));
  }
}

/**
 * Worker fetch handler
 * Supports both SSE and Streamable HTTP transports
 *
 * ⚠️ URL CONFIGURATION GUIDE:
 *
 * Option 1: Serve at /sse (current setup)
 * -----------------------------------------
 * Server code (below): MyMCP.serveSSE("/sse").fetch(...)
 * Client config:       "url": "https://worker.dev/sse"
 * Tools available at:  https://worker.dev/sse/tools/list
 *
 * Option 2: Serve at root / (alternative)
 * -----------------------------------------
 * Server code:         MyMCP.serveSSE("/").fetch(...)
 * Client config:       "url": "https://worker.dev"
 * Tools available at:  https://worker.dev/tools/list
 *
 * The base path argument MUST match what the client expects!
 *
 * TESTING YOUR CONFIGURATION:
 * 1. Deploy:     npx wrangler deploy
 * 2. Test:       curl https://YOUR-WORKER.workers.dev/sse
 * 3. Configure:  Use exact URL from step 2 in client config
 * 4. Restart:    Restart Claude Desktop to load new config
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { pathname } = new URL(request.url);

    // Handle CORS preflight (for browser-based clients like MCP Inspector)
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

    // SSE transport (legacy, but widely supported)
    // ⚠️ IMPORTANT: Use pathname.startsWith() to match sub-paths like /sse/tools/list
    if (pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
      // ↑ Base path "/sse" means client URL must be: https://worker.dev/sse
    }

    // Streamable HTTP transport (2025 standard)
    // ⚠️ IMPORTANT: Use pathname.startsWith() to match sub-paths like /mcp/tools/list
    if (pathname.startsWith("/mcp")) {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
      // ↑ Base path "/mcp" means client URL must be: https://worker.dev/mcp
    }

    // Health check endpoint (useful for debugging connection issues)
    // Test with: curl https://YOUR-WORKER.workers.dev/
    if (pathname === "/" || pathname === "/health") {
      return new Response(
        JSON.stringify({
          name: "My MCP Server",
          version: "1.0.0",
          transports: {
            sse: "/sse",
            http: "/mcp",
          },
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

    return new Response("Not Found", { status: 404 });
  },
};
