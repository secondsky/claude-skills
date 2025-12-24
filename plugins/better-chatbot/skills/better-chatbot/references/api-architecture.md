# API Architecture & Design Patterns

This reference provides comprehensive guidance on API architecture patterns used in better-chatbot.

---

## Route Structure Philosophy

**Convention**: RESTful resources with Next.js App Router conventions

```
/api/[resource]/route.ts         → GET/POST collection endpoints
/api/[resource]/[id]/route.ts    → GET/PUT/DELETE item endpoints
/api/[resource]/actions.ts       → Server actions (mutations)
```

---

## Standard Route Handler Pattern

**Location**: `src/app/api/`

**Template structure**:
```typescript
export async function POST(request: Request) {
  try {
    // 1. Parse and validate request body with Zod
    const json = await request.json();
    const parsed = zodSchema.parse(json);

    // 2. Check authentication
    const session = await getSession();
    if (!session?.user.id) return new Response("Unauthorized", { status: 401 });

    // 3. Check authorization (ownership/permissions)
    if (resource.userId !== session.user.id) return new Response("Forbidden", { status: 403 });

    // 4. Load/compose dependencies (tools, context, etc.)
    const tools = await loadMcpTools({ mentions, allowedMcpServers });

    // 5. Execute with streaming if applicable
    const stream = createUIMessageStream({ execute: async ({ writer }) => { ... } });

    // 6. Return response
    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    logger.error(error);
    return Response.json({ message: error.message }, { status: 500 });
  }
}
```

---

## Shared Business Logic Pattern

**Key Insight**: Extract complex orchestration logic into shared utilities

**Example**: `src/app/api/chat/shared.chat.ts`

This file demonstrates how to handle:
- Tool loading (`loadMcpTools`, `loadWorkFlowTools`, `loadAppDefaultTools`)
- Filtering and composition (`filterMCPToolsByMentions`, `excludeToolExecution`)
- System prompt building (`mergeSystemPrompt`)
- Manual tool execution handling

**Pattern**:
```typescript
// Shared utility function
export const loadMcpTools = (opt?) =>
  safe(() => mcpClientsManager.tools())
    .map((tools) => {
      if (opt?.mentions?.length) {
        return filterMCPToolsByMentions(tools, opt.mentions);
      }
      return filterMCPToolsByAllowedMCPServers(tools, opt?.allowedMcpServers);
    })
    .orElse({} as Record<string, VercelAIMcpTool>);

// Used in multiple routes
// - /api/chat/route.ts
// - /api/chat/temporary/route.ts
// - /api/workflow/[id]/execute/route.ts
```

**Why**: DRY principle, single source of truth, consistent behavior

---

## Defensive Programming with safe()

**Library**: `ts-safe` for functional error handling

**Philosophy**: Never crash the chat - degrade features gracefully

```typescript
// Returns empty object on failure, chat continues
const MCP_TOOLS = await safe()
  .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
  .map(() => loadMcpTools({ mentions, allowedMcpServers }))
  .orElse({});  // Graceful fallback
```

**Benefits**:
- Chat continues even if MCP tools fail to load
- Users get partial functionality instead of complete failure
- Graceful degradation improves reliability

---

## Streaming-First Architecture

**Pattern**: Use Vercel AI SDK streaming utilities

```typescript
// In route handler
const stream = createUIMessageStream({
  execute: async ({ writer }) => {
    // Stream intermediate results
    writer.write({ type: "text", content: "Processing..." });

    // Execute with streaming
    const result = await streamText({
      model,
      messages,
      tools,
      onChunk: (chunk) => writer.write({ type: "text-delta", delta: chunk })
    });

    return { output: result };
  }
});

return createUIMessageStreamResponse({ stream });
```

**Why**: Live feedback, better UX, handles long-running operations

**Benefits**:
- Users see progress immediately
- Better perceived performance
- Can handle long-running LLM responses
- Supports real-time updates

---

## Best Practices

1. **Always validate input** with Zod schemas
2. **Check authentication** before processing
3. **Check authorization** for resource access
4. **Use defensive programming** with safe() wrapper
5. **Prefer streaming** for better UX
6. **Extract shared logic** to avoid duplication
7. **Return proper HTTP status codes** (401, 403, 500, etc.)
8. **Log errors** for debugging

---

## Related References

- `tool-system.md` - Tool loading and composition patterns
- `server-actions.md` - Server action validators
- `templates.md` - Complete route templates
- `common-errors.md` - API-related troubleshooting
