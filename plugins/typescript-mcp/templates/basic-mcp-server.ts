/**
 * Basic MCP Server Template
 *
 * A minimal Model Context Protocol server with a simple echo tool.
 * Deploy to Cloudflare Workers for serverless MCP endpoint.
 *
 * Setup:
 * 1. npm install @modelcontextprotocol/sdk hono zod
 * 2. npm install -D @cloudflare/workers-types wrangler typescript
 * 3. wrangler deploy
 *
 * Test locally:
 * - wrangler dev
 * - npx @modelcontextprotocol/inspector (connect to http://localhost:8787/mcp)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Hono } from 'hono';
import { z } from 'zod';

// Define environment type (add your bindings here)
type Env = {
  // Example: D1 database
  // DB: D1Database;
  // KV namespace
  // CACHE: KVNamespace;
};

// Initialize MCP server
const server = new McpServer({
  name: 'basic-mcp-server',
  version: '1.0.0'
});

// Register a simple echo tool
server.registerTool(
  'echo',
  {
    description: 'Echoes back the input text',
    inputSchema: z.object({
      text: z.string().describe('Text to echo back')
    })
  },
  async ({ text }) => ({
    content: [{ type: 'text', text }]
  })
);

// Register an addition tool
server.registerTool(
  'add',
  {
    description: 'Adds two numbers together',
    inputSchema: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number')
    })
  },
  async ({ a, b }) => ({
    content: [{
      type: 'text',
      text: `The sum of ${a} and ${b} is ${a + b}`
    }]
  })
);

// HTTP endpoint setup with Hono
const app = new Hono<{ Bindings: Env }>();

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'basic-mcp-server',
    version: '1.0.0',
    status: 'running',
    mcp_endpoint: '/mcp'
  });
});

// MCP endpoint
app.post('/mcp', async (c) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  // CRITICAL: Close transport on response end to prevent memory leaks
  c.res.raw.on('close', () => transport.close());

  await server.connect(transport);
  await transport.handleRequest(c.req.raw, c.res.raw, await c.req.json());

  return c.body(null);
});

// CRITICAL: Use direct export (not object wrapper)
// ✅ CORRECT:
export default app;

// ❌ WRONG (causes build errors):
// export default { fetch: app.fetch };
