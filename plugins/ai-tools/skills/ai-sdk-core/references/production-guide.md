# AI SDK Production Best Practices

Complete guide for deploying AI SDK applications in production.

**Last Updated**: 2025-11-21

---

## Performance

**1. Always use streaming for long-form content:**
```typescript
// User-facing: Use streamText
const stream = streamText({ model: openai('gpt-4'), prompt: 'Long essay' });
return stream.toDataStreamResponse();

// Background tasks: Use generateText
const result = await generateText({ model: openai('gpt-4'), prompt: 'Analyze data' });
```

**2. Set appropriate maxOutputTokens:**
```typescript
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Short answer',
  maxOutputTokens: 100,  // Limit tokens to save cost
});
```

**3. Cache provider instances:**
```typescript
// Good: Reuse provider instances
const gpt4 = openai('gpt-4-turbo');
const result1 = await generateText({ model: gpt4, prompt: 'Hello' });
const result2 = await generateText({ model: gpt4, prompt: 'World' });
```

**4. Optimize Zod schemas:**
```typescript
// Avoid complex nested schemas at top level in Workers
// Move into route handlers to prevent startup overhead
```

---

## Error Handling

**1. Wrap all AI calls in try-catch:**
```typescript
try {
  const result = await generateText({ /* ... */ });
} catch (error) {
  // Handle specific errors
  if (error instanceof AI_APICallError) { /* ... */ }
  else if (error instanceof AI_NoContentGeneratedError) { /* ... */ }
  else { /* ... */ }
}
```

**2. Implement retry logic:**
```typescript
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Hello',
  maxRetries: 3,
});
```

**3. Log errors properly:**
```typescript
console.error('AI SDK Error:', {
  type: error.constructor.name,
  message: error.message,
  statusCode: error.statusCode,
  timestamp: new Date().toISOString(),
});
```

---

## Cost Optimization

**1. Choose appropriate models:**
```typescript
// Simple tasks: Use cheaper models
const simple = await generateText({ model: openai('gpt-3.5-turbo'), prompt: 'Hello' });

// Complex reasoning: Use GPT-4
const complex = await generateText({ model: openai('gpt-4'), prompt: 'Analyze...' });
```

**2. Set maxOutputTokens appropriately:**
```typescript
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Summarize in 2 sentences',
  maxOutputTokens: 100,  // Prevent over-generation
});
```

**3. Cache results when possible:**
```typescript
const cache = new Map();

async function getCachedResponse(prompt: string) {
  if (cache.has(prompt)) return cache.get(prompt);

  const result = await generateText({ model: openai('gpt-4'), prompt });
  cache.set(prompt, result.text);
  return result.text;
}
```

---

## Cloudflare Workers Specific

**1. Move imports inside handlers:**
```typescript
// Avoid startup overhead
export default {
  async fetch(request, env) {
    const { generateText } = await import('ai');
    const { openai } = await import('@ai-sdk/openai');
    // Use here
  }
}
```

**2. Monitor startup time:**
```bash
# Wrangler reports startup time
wrangler deploy
# Check output for startup duration (must be <400ms)
```

**3. Handle streaming properly:**
```typescript
// Return ReadableStream for streaming responses
const stream = streamText({ model: openai('gpt-4'), prompt: 'Hello' });
return new Response(stream.toTextStream(), {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
```

---

## Next.js / Vercel Specific

**1. Use Server Actions for mutations:**
```typescript
'use server';

export async function generateContent(input: string) {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: input,
  });
  return result.text;
}
```

**2. Use Server Components for initial loads:**
```typescript
// app/page.tsx
export default async function Page() {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Welcome message',
  });

  return <div>{result.text}</div>;
}
```

**3. Implement loading states:**
```typescript
'use client';

import { useState } from 'react';
import { generateContent } from './actions';

export default function Form() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await generateContent(formData.get('input'));
    setLoading(false);
  }

  return (
    <form action={handleSubmit}>
      <input name="input" />
      <button disabled={loading}>
        {loading ? 'Generating...' : 'Submit'}
      </button>
    </form>
  );
}
```

**4. For deployment:**
See Vercel's official deployment documentation: https://vercel.com/docs/functions

---

**Questions?** Check `error-catalog.md` for production troubleshooting.
