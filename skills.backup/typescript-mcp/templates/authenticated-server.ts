/**
 * Authenticated MCP Server Template
 *
 * An MCP server with API key authentication using Cloudflare KV.
 * Essential for production deployments to prevent unauthorized access.
 *
 * Setup:
 * 1. npm install @modelcontextprotocol/sdk hono zod
 * 2. npm install -D @cloudflare/workers-types wrangler typescript
 * 3. Create KV namespace: wrangler kv namespace create MCP_API_KEYS
 * 4. Add binding to wrangler.jsonc
 * 5. Add API keys: wrangler kv key put --binding=MCP_API_KEYS "key:YOUR_KEY" "true"
 * 6. wrangler deploy
 *
 * Usage:
 * - Clients must send Authorization header: "Bearer YOUR_API_KEY"
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

type Env = {
  MCP_API_KEYS: KVNamespace; // Required for authentication
  DB?: D1Database;
  CACHE?: KVNamespace;
};

const server = new McpServer({
  name: 'authenticated-mcp-server',
  version: '1.0.0'
});

// Register tools
server.registerTool(
  'secure-operation',
  {
    description: 'Performs a secure operation (requires authentication)',
    inputSchema: z.object({
      operation: z.string().describe('Operation to perform'),
      data: z.string().describe('Operation data')
    })
  },
  async ({ operation, data }) => {
    return {
      content: [{
        type: 'text',
        text: `Performed secure operation "${operation}" with data: ${data}`
      }]
    };
  }
);

server.registerTool(
  'get-status',
  {
    description: 'Returns server status',
    inputSchema: z.object({})
  },
  async () => {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          status: 'running',
          authenticated: true,
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
);

// HTTP setup
const app = new Hono<{ Bindings: Env }>();

// CORS configuration (adjust origins for your use case)
app.use('/mcp', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8787',
    'https://your-app.com' // Replace with your domain
  ],
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Authentication middleware
app.use('/mcp', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  // Check for Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Use: Authorization: Bearer YOUR_API_KEY'
    }, 401);
  }

  // Extract API key
  const apiKey = authHeader.replace('Bearer ', '');

  // Validate API key against KV store
  try {
    const storedKey = await c.env.MCP_API_KEYS.get(`key:${apiKey}`);

    if (!storedKey) {
      return c.json({
        error: 'Forbidden',
        message: 'Invalid API key'
      }, 403);
    }

    // Optional: Track API key usage
    const usageKey = `usage:${apiKey}:${new Date().toISOString().split('T')[0]}`;
    const currentUsage = await c.env.MCP_API_KEYS.get(usageKey);
    await c.env.MCP_API_KEYS.put(
      usageKey,
      String(parseInt(currentUsage || '0') + 1),
      { expirationTtl: 86400 * 7 } // Keep for 7 days
    );

    // User is authenticated, continue
    await next();
  } catch (error) {
    return c.json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    }, 500);
  }
});

// Rate limiting middleware (per IP)
app.use('/mcp', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `ratelimit:${ip}:${Math.floor(Date.now() / 60000)}`; // Per minute

  try {
    const count = await c.env.MCP_API_KEYS.get(rateLimitKey);
    const requestCount = parseInt(count || '0');

    // Allow 100 requests per minute per IP
    if (requestCount >= 100) {
      return c.json({
        error: 'Rate Limit Exceeded',
        message: 'Too many requests. Please try again later.'
      }, 429);
    }

    await c.env.MCP_API_KEYS.put(
      rateLimitKey,
      String(requestCount + 1),
      { expirationTtl: 60 }
    );

    await next();
  } catch (error) {
    // Rate limiting is best-effort, continue if it fails
    await next();
  }
});

// Public health check (no auth required)
app.get('/', (c) => {
  return c.json({
    name: 'authenticated-mcp-server',
    version: '1.0.0',
    status: 'running',
    authentication: 'required',
    mcp_endpoint: '/mcp',
    usage: 'Send POST requests to /mcp with Authorization: Bearer YOUR_API_KEY'
  });
});

// Authenticated MCP endpoint
app.post('/mcp', async (c) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  c.res.raw.on('close', () => transport.close());

  await server.connect(transport);
  await transport.handleRequest(c.req.raw, c.res.raw, await c.req.json());

  return c.body(null);
});

export default app;

/**
 * API Key Management Commands
 * ============================
 *
 * Add a new API key:
 * wrangler kv key put --binding=MCP_API_KEYS "key:abc123xyz" "true"
 *
 * Revoke an API key:
 * wrangler kv key delete --binding=MCP_API_KEYS "key:abc123xyz"
 *
 * List all API keys:
 * wrangler kv key list --binding=MCP_API_KEYS --prefix="key:"
 *
 * Check API key usage:
 * wrangler kv key get --binding=MCP_API_KEYS "usage:abc123xyz:2025-10-28"
 *
 * Generate secure API key (local):
 * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
