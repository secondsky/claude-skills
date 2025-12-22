# Tool Abstraction System Patterns

Complete implementation for branded type tags enabling runtime type checking in multi-type tool systems.

---

## The Problem

Handling multiple tool types (MCP, Workflow, Default, Custom) with different execution patterns leads to:
- Type mismatches at runtime (TypeScript can't enforce runtime types)
- Repeated type checking boilerplate in every tool executor
- Difficulty adding new tool types without breaking existing code
- Unsafe type assertions that can fail silently

---

## The Solution: Branded Type Tags

Create `lib/tool-tags.ts` in your project to implement a type-safe branded type system.

### Complete Implementation

```typescript
// Branded type system for runtime type narrowing
export class ToolTag<T extends string> {
  private readonly _tag: T
  private readonly _branded: unique symbol

  private constructor(tag: T) {
    this._tag = tag
  }

  static create<TTag extends string>(tag: TTag) {
    return new ToolTag(tag) as ToolTag<TTag>
  }

  is(tag: string): boolean {
    return this._tag === tag
  }

  get tag(): T {
    return this._tag
  }
}

// Define your tool types (adapt to your needs)
export type MCPTool = {
  type: "mcp"
  name: string
  execute: (...args: any[]) => Promise<any>
  description?: string
}

export type WorkflowTool = {
  type: "workflow"
  id: string
  nodes: any[]
  execute?: () => Promise<any>
}

export type DefaultTool = {
  type: "default"
  name: string
  handler: () => any
}

// Branded tag system for MCP tools
export const VercelAIMcpToolTag = {
  create: <T extends MCPTool>(tool: T) => ({
    ...tool,
    _tag: ToolTag.create("mcp")
  }),
  isMaybe: (tool: any): tool is MCPTool & { _tag: ToolTag<"mcp"> } =>
    tool?._tag?.is("mcp")
}

// Branded tag system for Workflow tools
export const VercelAIWorkflowToolTag = {
  create: <T extends WorkflowTool>(tool: T) => ({
    ...tool,
    _tag: ToolTag.create("workflow")
  }),
  isMaybe: (tool: any): tool is WorkflowTool & { _tag: ToolTag<"workflow"> } =>
    tool?._tag?.is("workflow")
}

// Branded tag system for Default tools
export const VercelAIDefaultToolTag = {
  create: <T extends DefaultTool>(tool: T) => ({
    ...tool,
    _tag: ToolTag.create("default")
  }),
  isMaybe: (tool: any): tool is DefaultTool & { _tag: ToolTag<"default"> } =>
    tool?._tag?.is("default")
}
```

---

## Usage Examples

### Example 1: Tool Executor with Runtime Type Checking

```typescript
// lib/ai/tool-executor.ts
import {
  VercelAIMcpToolTag,
  VercelAIWorkflowToolTag,
  VercelAIDefaultToolTag
} from "@/lib/tool-tags"

async function executeTool(tool: unknown) {
  // Runtime type narrowing with branded tags
  if (VercelAIMcpToolTag.isMaybe(tool)) {
    console.log("Executing MCP tool:", tool.name)
    // TypeScript now knows tool is MCPTool
    return await tool.execute()
  } else if (VercelAIWorkflowToolTag.isMaybe(tool)) {
    console.log("Executing workflow:", tool.id)
    // TypeScript now knows tool is WorkflowTool
    return await executeWorkflow(tool.nodes)
  } else if (VercelAIDefaultToolTag.isMaybe(tool)) {
    console.log("Executing default tool:", tool.name)
    // TypeScript now knows tool is DefaultTool
    return await tool.handler()
  }

  throw new Error("Unknown tool type")
}

async function executeWorkflow(nodes: any[]) {
  // Workflow execution logic
  for (const node of nodes) {
    await node.execute()
  }
}
```

### Example 2: Creating Tagged Tools

```typescript
// lib/ai/tools.ts
import {
  VercelAIMcpToolTag,
  VercelAIWorkflowToolTag,
  VercelAIDefaultToolTag
} from "@/lib/tool-tags"

// Create MCP tool
const mcpTool = VercelAIMcpToolTag.create({
  type: "mcp",
  name: "search",
  description: "Search the web",
  execute: async (query: string) => {
    const results = await fetch(`/api/search?q=${query}`)
    return await results.json()
  }
})

// Create workflow tool
const workflowTool = VercelAIWorkflowToolTag.create({
  type: "workflow",
  id: "workflow-123",
  nodes: [
    { id: "1", execute: async () => console.log("Step 1") },
    { id: "2", execute: async () => console.log("Step 2") }
  ]
})

// Create default tool
const defaultTool = VercelAIDefaultToolTag.create({
  type: "default",
  name: "getTime",
  handler: () => new Date().toISOString()
})

// Export all tools
export const tools = [mcpTool, workflowTool, defaultTool]
```

### Example 3: Tool Registry with Type Guards

```typescript
// lib/ai/tool-registry.ts
import {
  VercelAIMcpToolTag,
  VercelAIWorkflowToolTag,
  VercelAIDefaultToolTag,
  type MCPTool,
  type WorkflowTool,
  type DefaultTool
} from "@/lib/tool-tags"

type AnyTool = MCPTool | WorkflowTool | DefaultTool

class ToolRegistry {
  private tools = new Map<string, any>()

  register(name: string, tool: AnyTool) {
    // Tag the tool when registering
    if (tool.type === "mcp") {
      this.tools.set(name, VercelAIMcpToolTag.create(tool as MCPTool))
    } else if (tool.type === "workflow") {
      this.tools.set(name, VercelAIWorkflowToolTag.create(tool as WorkflowTool))
    } else if (tool.type === "default") {
      this.tools.set(name, VercelAIDefaultToolTag.create(tool as DefaultTool))
    }
  }

  get(name: string) {
    return this.tools.get(name)
  }

  async execute(name: string, ...args: any[]) {
    const tool = this.get(name)
    if (!tool) throw new Error(`Tool ${name} not found`)

    if (VercelAIMcpToolTag.isMaybe(tool)) {
      return await tool.execute(...args)
    } else if (VercelAIWorkflowToolTag.isMaybe(tool)) {
      return await this.executeWorkflow(tool.nodes)
    } else if (VercelAIDefaultToolTag.isMaybe(tool)) {
      return await tool.handler()
    }

    throw new Error(`Unknown tool type for ${name}`)
  }

  private async executeWorkflow(nodes: any[]) {
    const results = []
    for (const node of nodes) {
      results.push(await node.execute())
    }
    return results
  }
}

export const toolRegistry = new ToolRegistry()
```

---

## Adding New Tool Types

### Step 1: Define the Type

```typescript
export type CustomTool = {
  type: "custom"
  id: string
  config: Record<string, any>
  handler: (config: any) => Promise<any>
}
```

### Step 2: Create the Tag System

```typescript
export const VercelAICustomToolTag = {
  create: <T extends CustomTool>(tool: T) => ({
    ...tool,
    _tag: ToolTag.create("custom")
  }),
  isMaybe: (tool: any): tool is CustomTool & { _tag: ToolTag<"custom"> } =>
    tool?._tag?.is("custom")
}
```

### Step 3: Update Executors

```typescript
async function executeTool(tool: unknown) {
  if (VercelAIMcpToolTag.isMaybe(tool)) {
    return await tool.execute()
  } else if (VercelAIWorkflowToolTag.isMaybe(tool)) {
    return await executeWorkflow(tool.nodes)
  } else if (VercelAIDefaultToolTag.isMaybe(tool)) {
    return await tool.handler()
  } else if (VercelAICustomToolTag.isMaybe(tool)) {
    // NEW: Handle custom tool type
    return await tool.handler(tool.config)
  }

  throw new Error("Unknown tool type")
}
```

---

## Integration with Vercel AI SDK

```typescript
// app/api/chat/route.ts
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { toolRegistry } from "@/lib/ai/tool-registry"
import { VercelAIMcpToolTag } from "@/lib/tool-tags"

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Create tagged MCP tool
  const searchTool = VercelAIMcpToolTag.create({
    type: "mcp",
    name: "search",
    description: "Search the web for information",
    execute: async ({ query }: { query: string }) => {
      const results = await fetch(`/api/search?q=${query}`)
      return await results.json()
    }
  })

  const result = await streamText({
    model: openai("gpt-4"),
    messages,
    tools: {
      search: {
        description: searchTool.description,
        parameters: z.object({
          query: z.string().describe("The search query")
        }),
        execute: searchTool.execute
      }
    }
  })

  return result.toDataStreamResponse()
}
```

---

## When to Use

**Use branded type tags when**:
- Building multi-type tool systems
- Runtime type checking is required (can't rely on compile-time types)
- Adding extensible tool types (plugins, MCP servers, workflows)
- Need type-safe tool dispatch without type assertions
- Working with external data that requires runtime validation

**Don't use when**:
- Simple single-type systems (just use TypeScript interfaces)
- No runtime type ambiguity
- All types known at compile time

---

## Benefits

✅ **Type-safe**: Full TypeScript type narrowing after runtime check
✅ **Extensible**: Add new tool types without breaking existing code
✅ **Maintainable**: Centralized type checking logic
✅ **Safe**: No unsafe type assertions or `as` casts
✅ **Clear**: Explicit type tags make code intent obvious

---

**Last Updated**: 2025-12-17
