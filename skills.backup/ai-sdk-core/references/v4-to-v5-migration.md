# AI SDK v4 to v5 Migration Guide

Complete guide for migrating from AI SDK v4 to v5.

**Last Updated**: 2025-11-21

---

## Breaking Changes Overview

1. **Parameter Renames**
   - `maxTokens` → `maxOutputTokens`
   - `providerMetadata` → `providerOptions`

2. **Tool Definitions**
   - `parameters` → `inputSchema`
   - Tool properties: `args` → `input`, `result` → `output`

3. **Message Types**
   - `CoreMessage` → `ModelMessage`
   - `Message` → `UIMessage`
   - `convertToCoreMessages` → `convertToModelMessages`

4. **Tool Error Handling**
   - `ToolExecutionError` class removed
   - Now `tool-error` content parts
   - Enables automated retry

5. **Multi-Step Execution**
   - `maxSteps` → `stopWhen`
   - Use `stepCountIs()` or `hasToolCall()`

6. **Message Structure**
   - Simple `content` string → `parts` array
   - Parts: text, file, reasoning, tool-call, tool-result

7. **Streaming Architecture**
   - Single chunk → start/delta/end lifecycle
   - Unique IDs for concurrent streams

8. **Tool Streaming**
   - Enabled by default
   - `toolCallStreaming` option removed

9. **Package Reorganization**
   - `ai/rsc` → `@ai-sdk/rsc`
   - `ai/react` → `@ai-sdk/react`
   - `LangChainAdapter` → `@ai-sdk/langchain`

---

## Migration Examples

**Before (v4):**
```typescript
import { generateText } from 'ai';

const result = await generateText({
  model: openai.chat('gpt-4'),
  maxTokens: 500,
  providerMetadata: { openai: { user: 'user-123' } },
  tools: {
    weather: {
      description: 'Get weather',
      parameters: z.object({ location: z.string() }),
      execute: async (args) => { /* args.location */ },
    },
  },
  maxSteps: 5,
});
```

**After (v5):**
```typescript
import { generateText, tool, stopWhen, stepCountIs } from 'ai';

const result = await generateText({
  model: openai('gpt-4'),
  maxOutputTokens: 500,
  providerOptions: { openai: { user: 'user-123' } },
  tools: {
    weather: tool({
      description: 'Get weather',
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => { /* input.location */ },
    }),
  },
  stopWhen: stepCountIs(5),
});
```

---

## Migration Checklist

- [ ] Update all `maxTokens` to `maxOutputTokens`
- [ ] Update `providerMetadata` to `providerOptions`
- [ ] Convert tool `parameters` to `inputSchema`
- [ ] Update tool execute functions: `args` → `input`
- [ ] Replace `maxSteps` with `stopWhen(stepCountIs(n))`
- [ ] Update message types: `CoreMessage` → `ModelMessage`
- [ ] Remove `ToolExecutionError` handling
- [ ] Update package imports (`ai/rsc` → `@ai-sdk/rsc`)
- [ ] Test streaming behavior (architecture changed)
- [ ] Update TypeScript types

---

## Automated Migration

AI SDK provides a migration tool:

```bash
bunx ai migrate
```

This will update most breaking changes automatically. Review changes carefully.

**Official Migration Guide:**
https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0

---

**Questions?** Check `error-catalog.md` for migration-related errors.
