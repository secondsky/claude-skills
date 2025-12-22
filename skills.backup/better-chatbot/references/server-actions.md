## Server Action Validators & Coding Standards

### Server Action Validators (`lib/action-utils.ts`)

Centralized pattern for validated, permission-gated server actions:

```typescript
// Pattern 1: Simple validation
validatedAction(schema, async (data, formData) => { ... })

// Pattern 2: With user context (auto-auth, auto-error handling)
validatedActionWithUser(schema, async (data, formData, user) => { ... })

// Pattern 3: Permission-based (admin, user-manage)
validatedActionWithAdminPermission(schema, async (data, formData, session) => { ... })
```

**Prevents**:
- Forgetting auth checks ✓
- Inconsistent validation ✓
- FormData parsing errors ✓
- Non-standard error responses ✓

**2. Tool Abstraction System**
Unified interface for multiple tool types using branded type tags:

```typescript
// Branded types for runtime type narrowing
VercelAIMcpToolTag.create(tool)        // Brand as MCP tool
VercelAIWorkflowToolTag.isMaybe(tool)  // Check if Workflow tool

// Single handler for multiple tool types
if (VercelAIWorkflowToolTag.isMaybe(tool)) {
  // Workflow-specific logic
} else if (VercelAIMcpToolTag.isMaybe(tool)) {
  // MCP-specific logic
}
```

**Tool Types**:
- **MCP Tools**: Model Context Protocol integrations
- **Workflow Tools**: Visual DAG-based workflows
- **Default Tools**: Built-in capabilities (search, code execution, etc.)

**3. Workflow Execution Engine**
DAG-based workflow system with real-time streaming:
- Streams node execution progress via `dataStream.write()`
- Tracks: status, input/output, errors, timing
- Token optimization: history stored without detailed results

**4. State Management**
Zustand stores with shallow comparison for workflows and app config.

---

