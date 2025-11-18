---
name: cloudflare-mcp-server
description: Build MCP (Model Context Protocol) servers on Cloudflare Workers with tools, resources, and prompts.
license: MIT
---

# Cloudflare MCP Server

**Last Updated**: 2025-11-10

## Quick Start

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';

const server = new McpServer({
  name: 'my-server',
  version: '1.0.0'
});

server.tool('getTodo', async ({ id }) => ({
  id,
  title: 'Task',
  completed: false
}));

export default server;
```

## Core Concepts

- **Tools**: Functions AI can call
- **Resources**: Data AI can access
- **Prompts**: Reusable templates
- **Transports**: SSE, HTTP, WebSocket

## Example Tool

```typescript
server.tool('searchDocs', {
  description: 'Search documentation',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' }
    }
  },
  handler: async ({ query }) => {
    return { results: [...] };
  }
});
```

## Resources

- `templates/basic-mcp.ts` - Server setup
- `references/error-catalog.md` - Common errors

**Docs**: https://modelcontextprotocol.io
