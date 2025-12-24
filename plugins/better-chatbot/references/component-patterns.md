# Component & Design Philosophy

This reference covers component organization, design patterns, and architectural principles for UI components in better-chatbot.

---

## Organization by Feature

**Location**: `src/components/`

```
components/
├── ui/              → shadcn/ui primitives
├── layouts/         → App structure
├── agent/           → Agent-specific
├── workflow/        → Workflow editor
├── tool-invocation/ → Tool result rendering
└── *.tsx            → Shared components
```

**Principle**: Group by feature, not by type

---

## Compound Component Pattern

**Example**: `message.tsx` + `message-parts.tsx`

**Philosophy**: Break complex components into composable parts

```typescript
// message.tsx exports multiple related components
export function PreviewMessage({ message }) { ... }
export function ErrorMessage({ error }) { ... }

// message-parts.tsx handles polymorphic content
export function MessageParts({ parts }) {
  return parts.map(part => {
    if (isToolUIPart(part)) return <ToolInvocation part={part} />;
    if (part.type === 'text') return <Markdown text={part.text} />;
    // ... other types
  });
}
```

**Benefits**:
- Composable: Mix and match parts as needed
- Testable: Each part can be tested independently
- Maintainable: Changes isolated to specific parts
- Flexible: Easy to add new part types

---

## Client Component Wrapper Pattern

**Example**: `chat-bot.tsx`

**Structure**:
```typescript
export default function ChatBot({ threadId, initialMessages }) {
  // 1. State management (Zustand)
  const [model, toolChoice] = appStore(useShallow(state => [...]));

  // 2. Vercel AI SDK hook
  const { messages, append, status } = useChat({
    id: threadId,
    initialMessages,
    body: { chatModel: model, toolChoice },
  });

  // 3. Render orchestration
  return (
    <>
      <ChatGreeting />
      <MessageList messages={messages} />
      <PromptInput onSubmit={append} />
    </>
  );
}
```

**Why**: Top-level orchestrates, delegates rendering to specialized components

**Pattern**:
1. **State layer**: Global state (Zustand) for app-wide concerns
2. **Data layer**: Vercel AI SDK hooks for chat state
3. **Render layer**: Specialized components for each UI concern

---

## Tool Result Rendering Separation

**Key Architecture Decision**:
- Tool **execution** lives in `lib/ai/tools/`
- Tool **rendering** lives in `components/tool-invocation/`

**Example**:
```typescript
// Server-side (lib/ai/tools/create-table.ts)
execute: async (params) => "Success"

// Client-side (components/tool-invocation/interactive-table.tsx)
export function InteractiveTable({ part }) {
  const { columns, data } = part.input;
  return <DataTable columns={columns} data={data} />;
}
```

**Benefits**:
- Clear separation of concerns
- Easier testing
- Client can be rich/interactive without server complexity
- Tool execution can be reused across different UIs

---

## Best Practices

1. **Group by feature** - Organize components by domain, not by type
2. **Use compound patterns** - Break complex components into composable parts
3. **Separate execution from rendering** - Tools execute server-side, render client-side
4. **Delegate rendering** - Top-level components orchestrate, child components specialize
5. **Keep components focused** - Each component has one clear responsibility
6. **Use TypeScript** - Strong typing for component props and state

---

## Related References

- `templates.md` - Component templates and examples
- `ux-patterns.md` - UX patterns and interaction flows
- `api-architecture.md` - Server-side patterns
