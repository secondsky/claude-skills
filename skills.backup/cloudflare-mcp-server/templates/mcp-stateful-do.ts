/**
 * Stateful MCP Server with Durable Objects
 *
 * Uses Durable Objects to maintain per-session state.
 * Each MCP client gets its own DO instance with persistent storage.
 *
 * Perfect for: Stateful applications, games, conversation history
 *
 * Based on: https://developers.cloudflare.com/agents/model-context-protocol/mcp-agent-api
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type Env = {
  MY_MCP: DurableObjectNamespace; // Binding to this DO class
};

/**
 * Stateful MCP Server using Durable Objects
 * Each instance has its own SQL database and persistent storage
 */
export class MyMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "Stateful MCP Server",
    version: "1.0.0",
  });

  /**
   * Initialize tools that use persistent state
   */
  async init() {
    // Tool: Store a value
    this.server.tool(
      "store_value",
      "Store a key-value pair in persistent storage",
      {
        key: z.string().describe("Storage key"),
        value: z.string().describe("Value to store"),
      },
      async ({ key, value }) => {
        try {
          // Use Durable Objects storage API for persistence
          await this.state.storage.put(key, value);

          return {
            content: [
              {
                type: "text",
                text: `Stored "${key}" = "${value}"`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error storing value: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Tool: Retrieve a value
    this.server.tool(
      "get_value",
      "Retrieve a stored value by key",
      {
        key: z.string().describe("Storage key"),
      },
      async ({ key }) => {
        try {
          const value = await this.state.storage.get<string>(key);

          if (value === undefined) {
            return {
              content: [
                {
                  type: "text",
                  text: `No value found for key "${key}"`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `"${key}" = "${value}"`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error retrieving value: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Tool: List all stored keys
    this.server.tool(
      "list_keys",
      "List all stored keys",
      {},
      async () => {
        try {
          const keys = await this.state.storage.list();
          const keyList = Array.from(keys.keys()).join(", ");

          if (keys.size === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "No keys stored",
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `Stored keys (${keys.size}): ${keyList}`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error listing keys: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Tool: Delete a key
    this.server.tool(
      "delete_key",
      "Delete a stored key-value pair",
      {
        key: z.string().describe("Storage key to delete"),
      },
      async ({ key }) => {
        try {
          const existed = await this.state.storage.delete(key);

          if (!existed) {
            return {
              content: [
                {
                  type: "text",
                  text: `Key "${key}" did not exist`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `Deleted key "${key}"`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error deleting key: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Example: Counter with persistent state
    this.server.tool(
      "increment_counter",
      "Increment a persistent counter",
      {
        counter_name: z.string().default("default").describe("Counter name"),
      },
      async ({ counter_name }) => {
        try {
          const key = `counter:${counter_name}`;
          const current = (await this.state.storage.get<number>(key)) || 0;
          const newValue = current + 1;

          await this.state.storage.put(key, newValue);

          return {
            content: [
              {
                type: "text",
                text: `Counter "${counter_name}" incremented: ${current} → ${newValue}`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error incrementing counter: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Example: Store structured data (JSON)
    this.server.tool(
      "store_json",
      "Store structured JSON data",
      {
        key: z.string().describe("Storage key"),
        data: z.record(z.any()).describe("JSON data to store"),
      },
      async ({ key, data }) => {
        try {
          await this.state.storage.put(key, data);

          return {
            content: [
              {
                type: "text",
                text: `Stored JSON data under key "${key}"`,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error storing JSON: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Tool: Get JSON data
    this.server.tool(
      "get_json",
      "Retrieve stored JSON data",
      {
        key: z.string().describe("Storage key"),
      },
      async ({ key }) => {
        try {
          const data = await this.state.storage.get<Record<string, any>>(key);

          if (data === undefined) {
            return {
              content: [
                {
                  type: "text",
                  text: `No data found for key "${key}"`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: `Error retrieving JSON: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }
}

/**
 * Worker fetch handler
 * Routes requests to Durable Objects
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { pathname } = new URL(request.url);

    // Health check
    if (pathname === "/") {
      return new Response(
        JSON.stringify({
          name: "Stateful MCP Server",
          version: "1.0.0",
          transports: ["/sse", "/mcp"],
          stateful: true,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Route MCP requests to Durable Objects
    if (pathname.startsWith("/sse") || pathname.startsWith("/mcp")) {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    return new Response("Not Found", { status: 404 });
  },
};
