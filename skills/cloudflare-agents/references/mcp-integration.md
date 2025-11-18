## Model Context Protocol (MCP)

Build MCP servers using the Agents SDK.

### MCP Server Setup

```bash
npm install @modelcontextprotocol/sdk agents
```

### Basic MCP Server

```typescript
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export class MyMCP extends McpAgent {
  server = new McpServer({ name: "Demo", version: "1.0.0" });

  async init() {
    // Define a tool
    this.server.tool(
      "add",
      "Add two numbers together",
      {
        a: z.number().describe("First number"),
        b: z.number().describe("Second number")
      },
      async ({ a, b }) => ({
        content: [{ type: "text", text: String(a + b) }]
      })
    );
  }
}
```

### Stateful MCP Server

```typescript
type State = { counter: number };

export class StatefulMCP extends McpAgent<Env, State> {
  server = new McpServer({ name: "Counter", version: "1.0.0" });

  initialState: State = { counter: 0 };

  async init() {
    // Resource
    this.server.resource(
      "counter",
      "mcp://resource/counter",
      (uri) => ({
        contents: [{ uri: uri.href, text: String(this.state.counter) }]
      })
    );

    // Tool
    this.server.tool(
      "increment",
      "Increment the counter",
      { amount: z.number() },
      async ({ amount }) => {
        this.setState({
          ...this.state,
          counter: this.state.counter + amount
        });

        return {
          content: [{
            type: "text",
            text: `Counter is now ${this.state.counter}`
          }]
        };
      }
    );
  }
}
```

### MCP Transport Configuration

```typescript
import { Hono } from 'hono';

const app = new Hono();

// Modern streamable HTTP transport (recommended)
app.mount('/mcp', MyMCP.serve('/mcp').fetch, { replaceRequest: false });

// Legacy SSE transport (deprecated)
app.mount('/sse', MyMCP.serveSSE('/sse').fetch, { replaceRequest: false });

export default app;
```

**Transport Comparison:**
- **/mcp**: Streamable HTTP (modern, recommended)
- **/sse**: Server-Sent Events (legacy, deprecated)

### MCP with OAuth

```typescript
import { OAuthProvider } from '@cloudflare/workers-oauth-provider';

export default new OAuthProvider({
  apiHandlers: {
    '/sse': MyMCP.serveSSE('/sse'),
    '/mcp': MyMCP.serve('/mcp')
  },
  // OAuth configuration
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  // ... other OAuth settings
});
```

### Testing MCP Server

```bash
# Run MCP inspector
npx @modelcontextprotocol/inspector@latest

# Connect to: http://localhost:8788/mcp
```

**Cloudflare's MCP Servers**: See [reference](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/) for production examples.

---

