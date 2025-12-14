# Next.js Pages Router - Complete Implementation

**Purpose**: Complete working example of AI SDK UI in Next.js Pages Router. For projects using the traditional Next.js routing system.

**Use When**: Building chat applications in Next.js 12 or earlier, or in Next.js 13+ projects that still use the Pages Router pattern.

---

### Pages Router Complete Example

**Directory Structure:**
```
pages/
├── api/
│   └── chat.ts           # Chat API endpoint
└── chat.tsx              # Chat page
```

**Chat Page:**
```tsx
// pages/chat.tsx
import { useChat } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function ChatPage() {
  const { messages, sendMessage, isLoading } = useChat({
    api: '/api/chat',
  });
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage({ content: input });
    setInput('');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Chat</h1>

      <div className="border rounded p-4 h-96 overflow-y-auto mb-4">
        {messages.map(m => (
          <div key={m.id} className="mb-4">
            <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong> {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          className="flex-1 p-2 border rounded"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

**API Route:**
```typescript
// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Guard: Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate input
  if (!req.body.messages || !Array.isArray(req.body.messages)) {
    return res.status(400).json({
      error: 'Invalid request body. Expected { messages: Message[] }'
    });
  }

  const { messages } = req.body;

  const result = streamText({
    model: openai('gpt-4-turbo'),
    messages,
  });

  // Pages Router uses pipeDataStreamToResponse
  return result.pipeDataStreamToResponse(res);
}
```

**Key Difference**: App Router uses `toDataStreamResponse()`, Pages Router uses `pipeDataStreamToResponse()`.

---

**Related References**:
- `references/nextjs-app-router-full.md` - App Router implementation for comparison
- `references/hooks-api-full.md` - Full useChat API options
- `references/streaming-apis.md` - Server-side streaming setup
- `references/route-handlers.md` - API route patterns for different frameworks
