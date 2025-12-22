/**
 * Resource-Server MCP Template
 *
 * An MCP server focused on exposing resources (static and dynamic data).
 * Resources are URI-addressed data that LLMs can query.
 *
 * Setup:
 * 1. npm install @modelcontextprotocol/sdk hono zod
 * 2. npm install -D @cloudflare/workers-types wrangler typescript
 * 3. Configure bindings in wrangler.jsonc (D1, KV, etc.)
 * 4. wrangler deploy
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/types.js';
import { Hono } from 'hono';

type Env = {
  DB?: D1Database;
  CACHE?: KVNamespace;
};

const server = new McpServer({
  name: 'resource-server',
  version: '1.0.0'
});

// Resource 1: Static Configuration
server.registerResource(
  'config',
  new ResourceTemplate('config://app', { list: undefined }),
  {
    title: 'Application Configuration',
    description: 'Returns application configuration and metadata'
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify({
        name: 'resource-server',
        version: '1.0.0',
        features: ['static-resources', 'dynamic-resources', 'd1-integration'],
        lastUpdated: new Date().toISOString()
      }, null, 2)
    }]
  })
);

// Resource 2: Environment Info
server.registerResource(
  'environment',
  new ResourceTemplate('env://info', { list: undefined }),
  {
    title: 'Environment Information',
    description: 'Returns environment and deployment information'
  },
  async (uri, _, env) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify({
        hasDatabase: !!env.DB,
        hasCache: !!env.CACHE,
        runtime: 'cloudflare-workers',
        timestamp: new Date().toISOString()
      }, null, 2)
    }]
  })
);

// Resource 3: Dynamic User Profile (with parameter)
server.registerResource(
  'user-profile',
  new ResourceTemplate('user://{userId}', { list: undefined }),
  {
    title: 'User Profile',
    description: 'Returns user profile data by ID'
  },
  async (uri, { userId }, env) => {
    if (!env.DB) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Database not configured' }, null, 2)
        }]
      };
    }

    try {
      const user = await env.DB
        .prepare('SELECT id, name, email, created_at FROM users WHERE id = ?')
        .bind(userId)
        .first();

      if (!user) {
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: `User ${userId} not found` }, null, 2)
          }]
        };
      }

      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(user, null, 2)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({
            error: `Failed to fetch user: ${(error as Error).message}`
          }, null, 2)
        }]
      };
    }
  }
);

// Resource 4: Dynamic Data by Key (KV-backed)
server.registerResource(
  'data',
  new ResourceTemplate('data://{key}', { list: undefined }),
  {
    title: 'Data by Key',
    description: 'Returns data from KV store by key'
  },
  async (uri, { key }, env) => {
    if (!env.CACHE) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/plain',
          text: 'KV store not configured'
        }]
      };
    }

    try {
      const value = await env.CACHE.get(key as string);

      if (!value) {
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'text/plain',
            text: `Key "${key}" not found`
          }]
        };
      }

      // Try to parse as JSON, fallback to plain text
      let mimeType = 'text/plain';
      let text = value;

      try {
        JSON.parse(value);
        mimeType = 'application/json';
      } catch {
        // Not JSON, keep as plain text
      }

      return {
        contents: [{
          uri: uri.href,
          mimeType,
          text
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/plain',
          text: `Error fetching key: ${(error as Error).message}`
        }]
      };
    }
  }
);

// Resource 5: List All Users (D1-backed)
server.registerResource(
  'users-list',
  new ResourceTemplate('users://all', { list: undefined }),
  {
    title: 'All Users',
    description: 'Returns list of all users from database'
  },
  async (uri, _, env) => {
    if (!env.DB) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Database not configured' }, null, 2)
        }]
      };
    }

    try {
      const result = await env.DB
        .prepare('SELECT id, name, email FROM users ORDER BY created_at DESC LIMIT 100')
        .all();

      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({
            count: result.results.length,
            users: result.results
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({
            error: `Failed to fetch users: ${(error as Error).message}`
          }, null, 2)
        }]
      };
    }
  }
);

// Resource 6: Dynamic File Content (with path parameter)
server.registerResource(
  'file',
  new ResourceTemplate('file://{path}', { list: undefined }),
  {
    title: 'File Content',
    description: 'Returns content of a file by path (simulated)'
  },
  async (uri, { path }) => {
    // In production, you might fetch from R2, D1, or external storage
    const simulatedFiles: Record<string, string> = {
      'readme.md': '# README\n\nWelcome to the resource server!',
      'config.json': JSON.stringify({ setting1: 'value1', setting2: 'value2' }, null, 2),
      'data.txt': 'Sample text file content'
    };

    const content = simulatedFiles[path as string];

    if (!content) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/plain',
          text: `File "${path}" not found. Available: ${Object.keys(simulatedFiles).join(', ')}`
        }]
      };
    }

    const mimeType = (path as string).endsWith('.json')
      ? 'application/json'
      : (path as string).endsWith('.md')
        ? 'text/markdown'
        : 'text/plain';

    return {
      contents: [{
        uri: uri.href,
        mimeType,
        text: content
      }]
    };
  }
);

// HTTP endpoint setup
const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.json({
    name: 'resource-server',
    version: '1.0.0',
    resources: [
      'config://app',
      'env://info',
      'user://{userId}',
      'data://{key}',
      'users://all',
      'file://{path}'
    ]
  });
});

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
