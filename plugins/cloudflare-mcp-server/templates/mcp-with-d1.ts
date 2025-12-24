/**
 * MCP Server with D1 Database Integration
 *
 * Demonstrates D1 (Cloudflare's SQL database) integration for persistent data storage.
 * Shows CRUD operations, SQL queries, and error handling.
 *
 * ═══════════════════════════════════════════════════════════════
 * 💾 D1 DATABASE INTEGRATION
 * ═══════════════════════════════════════════════════════════════
 *
 * This template shows:
 * 1. D1 binding configuration
 * 2. Schema creation and migrations
 * 3. CRUD operations (Create, Read, Update, Delete)
 * 4. SQL query patterns
 * 5. Error handling for database operations
 * 6. Prepared statements (SQL injection prevention)
 *
 * ═══════════════════════════════════════════════════════════════
 * 📋 REQUIRED SETUP
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. Create D1 database:
 *    npx wrangler d1 create my-database
 *
 * 2. Add binding to wrangler.jsonc:
 *    {
 *      "d1_databases": [
 *        {
 *          "binding": "DB",
 *          "database_name": "my-database",
 *          "database_id": "YOUR_DATABASE_ID"
 *        }
 *      ]
 *    }
 *
 * 3. Create schema (run locally or in wrangler):
 *    npx wrangler d1 execute my-database --local --file=schema.sql
 *
 * schema.sql:
 * ```sql
 * CREATE TABLE IF NOT EXISTS users (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   name TEXT NOT NULL,
 *   email TEXT UNIQUE NOT NULL,
 *   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
 * );
 * ```
 *
 * 4. Deploy:
 *    npx wrangler deploy
 *
 * Pricing: https://developers.cloudflare.com/d1/platform/pricing/
 * - Free tier: 5 GB storage, 5 million reads/day
 * - Pay-as-you-go after free tier
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type Env = {
  DB: D1Database; // D1 binding (configured in wrangler.jsonc)
};

/**
 * User type (matches database schema)
 */
type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

/**
 * MCP Server with D1 database tools
 */
export class MyMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "D1 Database MCP Server",
    version: "1.0.0",
  });

  async init() {
    // ═══════════════════════════════════════════════════════════════
    // TOOL 1: Create User
    // ═══════════════════════════════════════════════════════════════
    // Demonstrates: INSERT with prepared statements
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "create_user",
      "Create a new user in the database",
      {
        name: z.string().describe("User's full name"),
        email: z.string().email().describe("User's email address"),
      },
      async ({ name, email }) => {
        try {
          // Use prepared statement to prevent SQL injection
          const result = await this.env.DB.prepare(
            "INSERT INTO users (name, email) VALUES (?, ?)"
          )
            .bind(name, email)
            .run();

          // Check if insert was successful
          if (!result.success) {
            throw new Error("Failed to insert user");
          }

          return {
            content: [
              {
                type: "text",
                text: `User created successfully!\nID: ${result.meta.last_row_id}\nName: ${name}\nEmail: ${email}`,
              },
            ],
          };
        } catch (error) {
          // Handle duplicate email error (UNIQUE constraint)
          if (error.message.includes("UNIQUE constraint failed")) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Email "${email}" is already registered.`,
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `Error creating user: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // TOOL 2: Get User by ID
    // ═══════════════════════════════════════════════════════════════
    // Demonstrates: SELECT with WHERE clause
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "get_user",
      "Get a user by their ID",
      {
        id: z.number().int().positive().describe("User ID"),
      },
      async ({ id }) => {
        try {
          const user = await this.env.DB.prepare(
            "SELECT * FROM users WHERE id = ?"
          )
            .bind(id)
            .first<User>();

          if (!user) {
            return {
              content: [
                {
                  type: "text",
                  text: `User with ID ${id} not found.`,
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(user, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching user: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // TOOL 3: List All Users
    // ═══════════════════════════════════════════════════════════════
    // Demonstrates: SELECT all rows with pagination
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "list_users",
      "List all users (with optional pagination)",
      {
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .default(10)
          .optional()
          .describe("Maximum number of users to return (default 10, max 100)"),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .optional()
          .describe("Number of users to skip (for pagination, default 0)"),
      },
      async ({ limit = 10, offset = 0 }) => {
        try {
          // Get users with pagination
          const { results: users } = await this.env.DB.prepare(
            "SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?"
          )
            .bind(limit, offset)
            .all<User>();

          // Get total count
          const { count } = await this.env.DB.prepare(
            "SELECT COUNT(*) as count FROM users"
          ).first<{ count: number }>();

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    users,
                    pagination: {
                      total: count,
                      limit,
                      offset,
                      showing: users.length,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error listing users: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // TOOL 4: Update User
    // ═══════════════════════════════════════════════════════════════
    // Demonstrates: UPDATE with prepared statements
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "update_user",
      "Update a user's information",
      {
        id: z.number().int().positive().describe("User ID to update"),
        name: z.string().optional().describe("New name (optional)"),
        email: z.string().email().optional().describe("New email (optional)"),
      },
      async ({ id, name, email }) => {
        try {
          // Build dynamic UPDATE query based on provided fields
          const updates: string[] = [];
          const values: (string | number)[] = [];

          if (name !== undefined) {
            updates.push("name = ?");
            values.push(name);
          }
          if (email !== undefined) {
            updates.push("email = ?");
            values.push(email);
          }

          if (updates.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "No fields to update. Provide name or email.",
                },
              ],
              isError: true,
            };
          }

          // Add ID to values array
          values.push(id);

          // Execute UPDATE
          const result = await this.env.DB.prepare(
            `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
          )
            .bind(...values)
            .run();

          if (!result.success) {
            throw new Error("Failed to update user");
          }

          // Fetch updated user
          const updatedUser = await this.env.DB.prepare(
            "SELECT * FROM users WHERE id = ?"
          )
            .bind(id)
            .first<User>();

          return {
            content: [
              {
                type: "text",
                text: `User updated successfully!\n\n${JSON.stringify(updatedUser, null, 2)}`,
              },
            ],
          };
        } catch (error) {
          if (error.message.includes("UNIQUE constraint failed")) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Email "${email}" is already in use.`,
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `Error updating user: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // TOOL 5: Delete User
    // ═══════════════════════════════════════════════════════════════
    // Demonstrates: DELETE with confirmation
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "delete_user",
      "Delete a user from the database (⚠️ permanent!)",
      {
        id: z.number().int().positive().describe("User ID to delete"),
      },
      async ({ id }) => {
        try {
          // Get user before deleting (for confirmation message)
          const user = await this.env.DB.prepare(
            "SELECT * FROM users WHERE id = ?"
          )
            .bind(id)
            .first<User>();

          if (!user) {
            return {
              content: [
                {
                  type: "text",
                  text: `User with ID ${id} not found.`,
                },
              ],
              isError: true,
            };
          }

          // Delete user
          const result = await this.env.DB.prepare(
            "DELETE FROM users WHERE id = ?"
          )
            .bind(id)
            .run();

          if (!result.success) {
            throw new Error("Failed to delete user");
          }

          return {
            content: [
              {
                type: "text",
                text: `User deleted successfully!\n\nDeleted: ${user.name} (${user.email})`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error deleting user: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // TOOL 6: Search Users
    // ═══════════════════════════════════════════════════════════════
    // Demonstrates: LIKE queries for text search
    // ═══════════════════════════════════════════════════════════════
    this.server.tool(
      "search_users",
      "Search users by name or email",
      {
        query: z.string().describe("Search term (name or email)"),
      },
      async ({ query }) => {
        try {
          const searchPattern = `%${query}%`;

          const { results: users } = await this.env.DB.prepare(
            "SELECT * FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC"
          )
            .bind(searchPattern, searchPattern)
            .all<User>();

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query,
                    results: users.length,
                    users,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error searching users: ${error.message}`,
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
 *
 * ═══════════════════════════════════════════════════════════════
 * 🔧 SETUP CHECKLIST
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. Create D1 database:
 *    npx wrangler d1 create my-database
 *
 * 2. Note the database_id from output
 *
 * 3. Add to wrangler.jsonc:
 *    {
 *      "d1_databases": [{
 *        "binding": "DB",
 *        "database_name": "my-database",
 *        "database_id": "YOUR_ID_HERE"
 *      }]
 *    }
 *
 * 4. Create schema:
 *    npx wrangler d1 execute my-database --local --command \
 *      "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
 *
 * 5. Deploy:
 *    npx wrangler deploy
 *
 * 6. Client URL:
 *    "url": "https://YOUR-WORKER.workers.dev/sse"
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

    // Handle CORS preflight
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

    // SSE transport
    if (pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    // HTTP transport
    if (pathname.startsWith("/mcp")) {
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    // Health check with DB binding info
    if (pathname === "/" || pathname === "/health") {
      return new Response(
        JSON.stringify({
          name: "D1 Database MCP Server",
          version: "1.0.0",
          transports: {
            sse: "/sse",
            http: "/mcp",
          },
          features: {
            database: !!env.DB,
          },
          tools: [
            "create_user",
            "get_user",
            "list_users",
            "update_user",
            "delete_user",
            "search_users",
          ],
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
