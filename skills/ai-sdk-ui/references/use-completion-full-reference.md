# useCompletion Hook - Complete Reference

**Purpose**: Generate text completions with streaming support. Ideal for single-shot generation tasks like writing assistance, code completion, or text summarization.

**Use When**: Building UIs for text generation that don't require conversation context (unlike useChat which maintains message history).

---

## useCompletion Hook - Complete Reference

### Basic Usage

```tsx
'use client';
import { useCompletion } from 'ai/react';
import { useState, FormEvent } from 'react';

export default function Completion() {
  const { completion, complete, isLoading, error } = useCompletion({
    api: '/api/completion',
  });
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    complete(input);
    setInput('');
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a prompt..."
          rows={4}
          className="w-full p-2 border rounded"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {completion && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3>Result:</h3>
          <p>{completion}</p>
        </div>
      )}

      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  );
}
```

### Full API Reference

```typescript
const {
  completion,         // string - Current completion text
  complete,           // (prompt: string) => Promise<string | null | undefined> - Trigger completion
  setCompletion,      // (completion: string) => void - Update completion
  isLoading,          // boolean - Is generating?
  error,              // Error | undefined - Error if any
  stop,               // () => void - Stop generation
} = useCompletion({
  api: '/api/completion',
  id: 'completion-1',

  // Callbacks
  onFinish: (prompt, completion) => {},
  onError: (error) => {},

  // Configuration
  headers: {},
  body: {},
});
```

### API Route for useCompletion

```typescript
// app/api/completion/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: openai('gpt-3.5-turbo'),
    prompt,
    maxOutputTokens: 500,
  });

  return result.toDataStreamResponse();
}
```

---

**Related References**:
- `references/hooks-api-full.md` - Comparison of useChat, useCompletion, useObject
- `references/streaming-apis.md` - Server-side streaming implementation
- `references/route-handlers.md` - API route patterns for different frameworks
- `references/best-practices.md` - Completion optimization and token management
