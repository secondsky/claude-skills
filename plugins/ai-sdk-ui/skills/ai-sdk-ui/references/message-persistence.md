# Message Persistence

**Purpose**: Save and restore chat history using localStorage. Enable users to return to previous conversations.

**Use When**: Building chat applications that need to persist conversations across page reloads or browser sessions.

---

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
  // SSR safety check
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(`chat-${chatId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load messages from localStorage:', error);
    return [];
  }
}

function saveMessages(chatId: string, messages: any[]) {
  // SSR safety check
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`chat-${chatId}`, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error);
    // Silently fail - persistence is best-effort
  }
}
```

---

**Related References**:
- `references/hooks-api-full.md` - Full useChat API with initialMessages option
- `references/best-practices.md` - Chat persistence patterns and optimization
- `references/error-handling.md` - localStorage error handling and fallbacks
