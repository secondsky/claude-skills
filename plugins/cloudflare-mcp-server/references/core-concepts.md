## Core Concepts

### 1. McpAgent Class

The `McpAgent` base class from Cloudflare's Agents SDK provides:
- Automatic Durable Objects integration
- Built-in state management with SQL database
- Tool, resource, and prompt registration
- Transport handling (SSE + HTTP)

**Basic pattern**:
```typescript
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export class MyMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "My MCP Server",
    version: "1.0.0"
  });

  async init() {
    // Register tools here
    this.server.tool(
      "tool_name",
      "Tool description",
      { param: z.string() },
      async ({ param }) => ({
        content: [{ type: "text", text: "Result" }]
      })
    );
  }
}
```

### 2. Tool Definitions

Tools are functions that MCP clients can invoke. Use Zod for parameter validation.

**Pattern**:
```typescript
this.server.tool(
  "tool_name",           // Tool identifier
  "Tool description",    // What it does (for LLM)
  {                      // Parameters (Zod schema)
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional()
  },
  async ({ param1, param2 }) => {  // Handler
    // Your logic here
    return {
      content: [{ type: "text", text: "Result" }]
    };
  }
);
```

**Best practices**:
- **Detailed descriptions**: Help LLMs understand tool purpose
- **Parameter descriptions**: Explain expected values and constraints
- **Error handling**: Return `{ isError: true }` for failures
- **Few, focused tools**: Better than many granular ones

---

