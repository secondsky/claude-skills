## Tool System Deep Dive

### Three-Tier Tool Architecture

**Design Goal**: Balance extensibility (MCP), composability (workflows), and batteries-included (default tools)

```
Tier 1: MCP Tools (External)
  ↓ Can be used in
Tier 2: Workflow Tools (User-Created)
  ↓ Can be used in
Tier 3: Default Tools (Built-In)
```

### Tier 1: MCP Tools (External Integrations)

**Location**: `src/lib/ai/mcp/`

**Philosophy**: Model Context Protocol servers become first-class tools

**Manager Pattern**:
```typescript
// mcp-manager.ts - Singleton for all MCP clients
export const mcpClientsManager = globalThis.__mcpClientsManager__;

// API:
mcpClientsManager.init()              // Initialize configured servers
mcpClientsManager.getClients()        // Get connected clients
mcpClientsManager.tools()             // Get all tools as Vercel AI SDK tools
mcpClientsManager.toolCall(serverId, toolName, args)  // Execute tool
```

**Why Global Singleton?**
- Next.js dev hot-reloading → reconnecting MCP servers on every change is expensive
- Persists across HMR updates
- Production: only one instance needed

**Tool Wrapping**:
```typescript
// MCP tools are tagged with metadata for filtering
type VercelAIMcpTool = Tool & {
  _mcpServerId: string;
  _originToolName: string;
  _toolName: string; // Transformed for AI SDK
};

// Branded type for runtime checking
VercelAIMcpToolTag.create(tool)
```

### Tier 2: Workflow Tools (Visual Composition)

**Location**: `src/lib/ai/workflow/`

**Philosophy**: Visual workflows become callable tools via `@workflow_name`

**Node Types**:
```typescript
enum NodeKind {
  Input = "input",      // Entry point
  LLM = "llm",          // AI reasoning
  Tool = "tool",        // Call MCP/default tools
  Http = "http",        // HTTP requests
  Template = "template",// Text processing
  Condition = "condition", // Branching logic
  Output = "output",    // Exit point
}
```

**Execution with Streaming**:
```typescript
// Workflows stream intermediate results
executor.subscribe((e) => {
  if (e.eventType == "NODE_START") {
    dataStream.write({
      type: "tool-output-available",
      toolCallId,
      output: { status: "running", node: e.nodeId }
    });
  }
  if (e.eventType == "NODE_END") {
    dataStream.write({
      type: "tool-output-available",
      toolCallId,
      output: { status: "complete", result: e.result }
    });
  }
});
```

**Key Feature**: Live progress updates in chat UI

### Tier 3: Default Tools (Built-In Capabilities)

**Location**: `src/lib/ai/tools/`

**Categories**:
```typescript
export const APP_DEFAULT_TOOL_KIT = {
  [AppDefaultToolkit.Visualization]: {
    CreatePieChart, CreateBarChart, CreateLineChart,
    CreateTable, CreateTimeline
  },
  [AppDefaultToolkit.WebSearch]: {
    WebSearch, WebContent
  },
  [AppDefaultToolkit.Http]: {
    Http
  },
  [AppDefaultToolkit.Code]: {
    JavascriptExecution, PythonExecution
  },
};
```

**Tool Implementation Pattern**:
```typescript
// Execution returns "Success", rendering happens client-side
export const createTableTool = createTool({
  description: "Create an interactive table...",
  inputSchema: z.object({
    title: z.string(),
    columns: z.array(...),
    data: z.array(...)
  }),
  execute: async () => "Success"
});

// Client-side rendering in components/tool-invocation/
export function InteractiveTable({ part }) {
  const args = part.input;
  return <DataTable columns={args.columns} data={args.data} />;
}
```

**Why Separation?**
- Server: Pure data/business logic
- Client: Rich visualization/interaction
- Easier testing, better performance

### Tool Lifecycle

```
1. Request → /api/chat/route.ts
2. Parse mentions (@tool, @workflow, @agent)
3. Load tools based on mentions/permissions:
   - loadMcpTools() → filters by mentions or allowedMcpServers
   - loadWorkFlowTools() → converts workflows to tools
   - loadAppDefaultTools() → filters default toolkits
4. Merge all tools into single Record<string, Tool>
5. Handle toolChoice mode:
   - "manual" → LLM proposes, user confirms
   - "auto" → full execution
   - "none" → no tools loaded
6. Pass tools to streamText()
7. Stream results back
```

### Convention-Based Extension

**Adding a new tool type is simple**:
1. Add enum to `AppDefaultToolkit`
2. Implement tool with `createTool()`
3. Add to `APP_DEFAULT_TOOL_KIT`
4. Tool automatically available via `@toolname`

---

