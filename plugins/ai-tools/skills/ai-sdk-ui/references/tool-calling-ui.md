# Tool Calling in UI

**Purpose**: Implement AI function/tool calling in chat interfaces. Display tool invocations and results inline within the message stream.

**Use When**: Building chat UIs that need to execute functions (e.g., search databases, call APIs, perform calculations) and show results to users.

---

## Tool Calling in UI

When your API uses tools, useChat automatically handles tool invocations in the message stream:

```tsx
'use client';
import { useChat } from 'ai/react';

export default function ChatWithTools() {
  const { messages } = useChat({ api: '/api/chat' });

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          {/* Text content */}
          {message.content && <p>{message.content}</p>}

          {/* Tool invocations */}
          {message.toolInvocations?.map((tool, idx) => (
            <div key={idx} className="bg-blue-50 p-2 rounded my-2">
              <div className="font-bold">Tool: {tool.toolName}</div>
              <div className="text-sm">
                <strong>Args:</strong> {JSON.stringify(tool.args, null, 2)}
              </div>
              {tool.result && (
                <div className="text-sm">
                  <strong>Result:</strong> {JSON.stringify(tool.result, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

**Related References**:
- `references/use-chat-migration.md` - Full useChat API with tool handling options
- `references/top-ui-errors.md` - Tool call optimization and error prevention
- `references/streaming-patterns.md` - Server-side tool execution setup
