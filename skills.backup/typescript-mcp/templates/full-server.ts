/**
 * Full MCP Server Template
 *
 * A complete MCP server with tools, resources, AND prompts.
 * Demonstrates all MCP protocol capabilities.
 *
 * Setup:
 * 1. npm install @modelcontextprotocol/sdk hono zod
 * 2. npm install -D @cloudflare/workers-types wrangler typescript
 * 3. Configure bindings in wrangler.jsonc
 * 4. wrangler deploy
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/types.js';
import { Hono } from 'hono';
import { z } from 'zod';

type Env = {
  DB?: D1Database;
  CACHE?: KVNamespace;
  API_KEY?: string;
};

const server = new McpServer({
  name: 'full-mcp-server',
  version: '1.0.0'
});

// ============================================================================
// TOOLS
// ============================================================================

server.registerTool(
  'search-database',
  {
    description: 'Searches the database for records matching a query',
    inputSchema: z.object({
      table: z.string().describe('Table name to search'),
      query: z.string().describe('Search query'),
      limit: z.number().default(10).describe('Maximum results to return')
    })
  },
  async ({ table, query, limit }, env) => {
    if (!env.DB) {
      return {
        content: [{ type: 'text', text: 'Database not configured' }],
        isError: true
      };
    }

    try {
      // Simple example - in production, use proper SQL with parameterized queries
      const result = await env.DB
        .prepare(`SELECT * FROM ${table} WHERE name LIKE ? LIMIT ?`)
        .bind(`%${query}%`, limit)
        .all();

      return {
        content: [{
          type: 'text',
          text: `Found ${result.results.length} results:\n${JSON.stringify(result.results, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Search failed: ${(error as Error).message}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  'cache-set',
  {
    description: 'Sets a value in the cache',
    inputSchema: z.object({
      key: z.string().describe('Cache key'),
      value: z.string().describe('Value to cache'),
      expirationTtl: z.number().optional().describe('TTL in seconds')
    })
  },
  async ({ key, value, expirationTtl }, env) => {
    if (!env.CACHE) {
      return {
        content: [{ type: 'text', text: 'Cache not configured' }],
        isError: true
      };
    }

    try {
      await env.CACHE.put(key, value, expirationTtl ? { expirationTtl } : undefined);
      return {
        content: [{ type: 'text', text: `Cached "${key}" successfully` }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Cache set failed: ${(error as Error).message}` }],
        isError: true
      };
    }
  }
);

server.registerTool(
  'summarize-text',
  {
    description: 'Generates a summary of provided text',
    inputSchema: z.object({
      text: z.string().describe('Text to summarize'),
      maxLength: z.number().default(100).describe('Maximum summary length in words')
    })
  },
  async ({ text, maxLength }) => {
    const words = text.split(/\s+/);
    const summary = words.slice(0, maxLength).join(' ');

    return {
      content: [{
        type: 'text',
        text: summary + (words.length > maxLength ? '...' : '')
      }]
    };
  }
);

// ============================================================================
// RESOURCES
// ============================================================================

server.registerResource(
  'config',
  new ResourceTemplate('config://app', { list: undefined }),
  {
    title: 'Application Configuration',
    description: 'Server configuration and metadata'
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify({
        name: 'full-mcp-server',
        version: '1.0.0',
        capabilities: ['tools', 'resources', 'prompts'],
        features: {
          database: 'D1',
          cache: 'KV',
          tools: ['search-database', 'cache-set', 'summarize-text'],
          resources: ['config', 'stats', 'data'],
          prompts: ['greeting', 'analyze-data']
        }
      }, null, 2)
    }]
  })
);

server.registerResource(
  'stats',
  new ResourceTemplate('stats://server', { list: undefined }),
  {
    title: 'Server Statistics',
    description: 'Current server statistics'
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify({
        uptime: process.uptime ? process.uptime() : 'N/A',
        timestamp: new Date().toISOString(),
        requestCount: 'N/A' // In production, track with Durable Objects
      }, null, 2)
    }]
  })
);

server.registerResource(
  'data',
  new ResourceTemplate('data://{key}', { list: undefined }),
  {
    title: 'Cached Data',
    description: 'Retrieves cached data by key'
  },
  async (uri, { key }, env) => {
    if (!env.CACHE) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/plain',
          text: 'Cache not configured'
        }]
      };
    }

    const value = await env.CACHE.get(key as string);

    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/plain',
        text: value || `Key "${key}" not found`
      }]
    };
  }
);

// ============================================================================
// PROMPTS
// ============================================================================

server.registerPrompt(
  'greeting',
  {
    description: 'Generates a friendly greeting prompt'
  },
  async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'Hello! I\'m an AI assistant connected to a full-featured MCP server. I can help you search databases, manage cache, and analyze data. What would you like to do?'
        }
      }
    ]
  })
);

server.registerPrompt(
  'analyze-data',
  {
    description: 'Prompts the user to analyze data from the server'
  },
  async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'I have access to database search and caching tools. Please tell me what data you\'d like me to analyze, and I\'ll use the available tools to fetch and process it for you.'
        }
      }
    ]
  })
);

server.registerPrompt(
  'help',
  {
    description: 'Shows available tools and resources'
  },
  async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `# Available Capabilities

## Tools
- **search-database**: Search database tables
- **cache-set**: Store data in cache
- **summarize-text**: Summarize text content

## Resources
- **config://app**: Server configuration
- **stats://server**: Server statistics
- **data://{key}**: Cached data by key

## Prompts
- **greeting**: Friendly introduction
- **analyze-data**: Data analysis prompt
- **help**: This help message

How can I assist you today?`
        }
      }
    ]
  })
);

// ============================================================================
// HTTP SETUP
// ============================================================================

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.json({
    name: 'full-mcp-server',
    version: '1.0.0',
    mcp_endpoint: '/mcp',
    capabilities: {
      tools: ['search-database', 'cache-set', 'summarize-text'],
      resources: ['config://app', 'stats://server', 'data://{key}'],
      prompts: ['greeting', 'analyze-data', 'help']
    }
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
