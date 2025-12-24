## Architectural Principles

### 1. Progressive Enhancement

Features build in layers:

```
Base Layer: Chat + LLM
    ↓
Tool Layer: Default + MCP
    ↓
Composition Layer: Workflows (tools as nodes)
    ↓
Personalization Layer: Agents (workflows + prompts)
```

**Evidence**:
- Agents can have `instructions.mentions` (inject tools/workflows)
- Workflows can call MCP + default tools
- Chat API composes all three tiers

**User Journey**:
1. Start with default tools (no setup)
2. Add MCP servers for specialized needs
3. Combine into workflows for automation
4. Package into agents for personas

### 2. Convention Over Configuration

**New Tool?**
- Add to `AppDefaultToolkit` enum → auto-available

**New Workflow Node?**
- Add to `NodeKind` enum → executor handles it

**New MCP Server?**
- Just configure via UI → manager handles lifecycle

### 3. Defensive Programming

**Use `safe()` everywhere**:
```typescript
const tools = await safe(() => loadMcpTools())
  .orElse({});  // Returns default on failure
```

**Philosophy**: Never crash the chat - degrade gracefully

### 4. Streaming-First

**Evidence**:
- Chat API uses `createUIMessageStream()`
- Workflow execution streams intermediate steps
- Tool calls stream progress updates

**Why**: Live feedback, better UX, handles long operations

### 5. Type-Driven Development

**Pattern**:
```typescript
// Zod defines runtime validation AND TypeScript types
const schema = z.object({ name: z.string() });
type SchemaType = z.infer<typeof schema>;

// Discriminated unions for polymorphic data
type WorkflowNodeData =
  | { kind: "input"; ... }
  | { kind: "llm"; ... }
  | { kind: "tool"; ... };

// Brand types for runtime checking
VercelAIMcpToolTag.isMaybe(tool)
```

---

