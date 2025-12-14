# Message Persistence

**Purpose**: Save and restore chat history using localStorage. Enable users to return to previous conversations.

**Use When**: Building chat applications that need to persist conversations across page reloads or browser sessions.

---

## Message Persistence

Save and load chat history to localStorage:

```tsx
'use client';
import { useChat } from 'ai/react';
import { useEffect } from 'react';

export default function PersistentChat() {
  const chatId = 'my-chat-1';

  const { messages, setMessages, sendMessage } = useChat({
    api: '/api/chat',
    id: chatId,
    initialMessages: loadMessages(chatId),
  });

  // Save messages whenever they change
  useEffect(() => {
    saveMessages(chatId, messages);
  }, [messages, chatId]);

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>{m.role}: {m.content}</div>
      ))}
      {/* Input form... */}
    </div>
  );
}

// Helper functions
function loadMessages(chatId: string) {
  const stored = localStorage.getItem(`chat-${chatId}`);
  return stored ? JSON.parse(stored) : [];
}

function saveMessages(chatId: string, messages: any[]) {
  localStorage.setItem(`chat-${chatId}`, JSON.stringify(messages));
}
```

---

**Related References**:
- `references/hooks-api-full.md` - Full useChat API with initialMessages option
- `references/best-practices.md` - Chat persistence patterns and optimization
- `references/error-handling.md` - localStorage error handling and fallbacks
