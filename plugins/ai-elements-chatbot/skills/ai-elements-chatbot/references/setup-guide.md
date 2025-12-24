# AI Elements Chatbot Complete Setup

Quick setup for production-ready AI chat UI components.

---

## Prerequisites

1. **Next.js 15+** with App Router
2. **shadcn/ui** initialized
3. **Tailwind v4**
4. **AI SDK v5+**

```bash
# Verify
npx next --version  # 15+
npm list ai         # 5.0+
ls components/ui    # shadcn components exist
```

---

## Step 1: Initialize AI Elements

```bash
pnpm dlx ai-elements@latest init
```

Updates `components.json` with AI Elements registry.

---

## Step 2: Add Components

```bash
pnpm dlx ai-elements@latest add message conversation response prompt-input
```

Components copied to `components/ui/ai/`.

---

## Step 3: Create Chat Interface

```typescript
'use client';

import { useChat } from 'ai/react';
import { Conversation } from '@/components/ui/ai/conversation';
import { Message } from '@/components/ui/ai/message';
import { Response } from '@/components/ui/ai/response';
import { PromptInput } from '@/components/ui/ai/prompt-input';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat'
  });

  return (
    <div className="flex h-screen flex-col">
      <Conversation>
        {messages.map((msg) => (
          <Message key={msg.id} role={msg.role}>
            <Response markdown={msg.content} />
          </Message>
        ))}
      </Conversation>

      <PromptInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

---

## Step 4: API Route

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4'),
    messages
  });

  return result.toDataStreamResponse();
}
```

---

## Available Components

- **Message** - Chat message container
- **Conversation** - Message list
- **Response** - Markdown renderer
- **PromptInput** - User input
- **CodeBlock** - Code syntax highlighting
- **Reasoning** - Thinking display
- **Tool** - Function call display
- **Sources** - Citations
- **Actions** - Message actions

---

## Official Documentation

- **AI Elements**: https://ai-elements.vercel.app
- **Examples**: https://github.com/ai-elements/ai-elements/tree/main/examples
