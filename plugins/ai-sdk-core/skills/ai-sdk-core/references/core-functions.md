# AI SDK Core Functions Reference

Complete API reference for AI SDK v5 core functions: `generateText()`, `streamText()`, `generateObject()`, and `streamObject()`.

**Last Updated**: 2025-11-21

---

## generateText()

Generate text completion with optional tools and multi-step execution.

### Signature

```typescript
async function generateText(options: {
  model: LanguageModel;
  prompt?: string;
  messages?: Array<ModelMessage>;
  system?: string;
  tools?: Record<string, Tool>;
  maxOutputTokens?: number;
  temperature?: number;
  stopWhen?: StopCondition;
}): Promise<GenerateTextResult>
```

### Basic Usage

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await generateText({
  model: openai('gpt-4-turbo'),
  prompt: 'Explain quantum computing',
  maxOutputTokens: 500,
  temperature: 0.7,
});

console.log(result.text);
console.log(`Tokens: ${result.usage.totalTokens}`);
```

### With Messages (Chat Format)

```typescript
const result = await generateText({
  model: openai('gpt-4-turbo'),
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the weather?' },
    { role: 'assistant', content: 'I need your location.' },
    { role: 'user', content: 'San Francisco' },
  ],
});
```

### With Tools

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-4'),
  tools: {
    weather: tool({
      description: 'Get the weather for a location',
      inputSchema: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        return { temperature: 72, condition: 'sunny' };
      },
    }),
  },
  prompt: 'What is the weather in Tokyo?',
});
```

### When to Use
- Need final response (not streaming)
- Want to wait for tool executions to complete
- Simpler code when streaming not needed
- Building batch/scheduled tasks

### Error Handling

```typescript
import { AI_APICallError, AI_NoContentGeneratedError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: 'Hello',
  });
} catch (error) {
  if (error instanceof AI_APICallError) {
    console.error('API call failed:', error.message);
  } else if (error instanceof AI_NoContentGeneratedError) {
    console.error('No content generated');
  }
}
```

---

## streamText()

Stream text completion with real-time chunks.

### Signature

```typescript
function streamText(options: {
  model: LanguageModel;
  prompt?: string;
  messages?: Array<ModelMessage>;
  system?: string;
  tools?: Record<string, Tool>;
  maxOutputTokens?: number;
  temperature?: number;
}): StreamTextResult
```

### Basic Streaming

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const stream = streamText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  prompt: 'Write a poem about AI',
});

// Stream to console
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}

// Or get final result
const finalResult = await stream.result;
console.log(finalResult.text);
```

### Handling the Stream

```typescript
const stream = streamText({
  model: openai('gpt-4-turbo'),
  prompt: 'Explain AI',
});

// Option 1: Text stream
for await (const text of stream.textStream) {
  console.log(text);
}

// Option 2: Full stream (includes metadata)
for await (const part of stream.fullStream) {
  if (part.type === 'text-delta') {
    console.log(part.textDelta);
  } else if (part.type === 'tool-call') {
    console.log('Tool called:', part.toolName);
  }
}

// Option 3: Wait for final result
const result = await stream.result;
console.log(result.text, result.usage);
```

### Production Pattern (Next.js)

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = streamText({
    model: openai('gpt-4-turbo'),
    messages,
  });

  return stream.toDataStreamResponse();
}
```

### When to Use
- Real-time user-facing responses
- Long-form content generation
- Want to show progress
- Better perceived performance

### Error Handling

```typescript
// Recommended: Use onError callback
const stream = streamText({
  model: openai('gpt-4-turbo'),
  prompt: 'Hello',
  onError({ error }) {
    console.error('Stream error:', error);
  },
});
```

---

## generateObject()

Generate structured output validated by Zod schema.

### Signature

```typescript
async function generateObject<T>(options: {
  model: LanguageModel;
  schema: z.Schema<T>;
  prompt?: string;
  messages?: Array<ModelMessage>;
  mode?: 'auto' | 'json' | 'tool';
}): Promise<GenerateObjectResult<T>>
```

### Basic Usage

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await generateObject({
  model: openai('gpt-4'),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({
        name: z.string(),
        amount: z.string(),
      })),
      instructions: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a recipe for chocolate chip cookies',
});

console.log(result.object.recipe);
```

### Nested Schemas

```typescript
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
  }),
  hobbies: z.array(z.string()),
});

const result = await generateObject({
  model: openai('gpt-4'),
  schema: PersonSchema,
  prompt: 'Generate a person profile',
});
```

### Arrays and Unions

```typescript
// Array of objects
const result = await generateObject({
  model: openai('gpt-4'),
  schema: z.object({
    people: z.array(z.object({
      name: z.string(),
      role: z.enum(['engineer', 'designer', 'manager']),
    })),
  }),
  prompt: 'Generate a team of 5 people',
});

// Union types
const result = await generateObject({
  model: openai('gpt-4'),
  schema: z.discriminatedUnion('type', [
    z.object({ type: z.literal('text'), content: z.string() }),
    z.object({ type: z.literal('image'), url: z.string() }),
  ]),
  prompt: 'Generate content',
});
```

### When to Use
- Need structured data (JSON, forms, etc.)
- Validation is critical
- Extracting data from unstructured input
- Building AI workflows that consume JSON

### Error Handling

```typescript
import { AI_NoObjectGeneratedError, AI_TypeValidationError } from 'ai';

try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: z.object({ name: z.string() }),
    prompt: 'Generate a person',
  });
} catch (error) {
  if (error instanceof AI_NoObjectGeneratedError) {
    console.error('Model did not generate valid object');
  } else if (error instanceof AI_TypeValidationError) {
    console.error('Zod validation failed:', error.message);
  }
}
```

---

## streamObject()

Stream structured output with partial updates.

### Signature

```typescript
function streamObject<T>(options: {
  model: LanguageModel;
  schema: z.Schema<T>;
  prompt?: string;
  messages?: Array<ModelMessage>;
  mode?: 'auto' | 'json' | 'tool';
}): StreamObjectResult<T>
```

### Basic Usage

```typescript
import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const stream = streamObject({
  model: google('gemini-2.5-pro'),
  schema: z.object({
    characters: z.array(z.object({
      name: z.string(),
      class: z.string(),
      stats: z.object({
        hp: z.number(),
        mana: z.number(),
      }),
    })),
  }),
  prompt: 'Generate 3 RPG characters',
});

// Stream partial updates
for await (const partialObject of stream.partialObjectStream) {
  console.log(partialObject);
}
```

### UI Integration Pattern

```typescript
// Server endpoint
export async function POST(request: Request) {
  const { prompt } = await request.json();

  const stream = streamObject({
    model: openai('gpt-4'),
    schema: z.object({
      summary: z.string(),
      keyPoints: z.array(z.string()),
    }),
    prompt,
  });

  return stream.toTextStreamResponse();
}

// Client (with useObject hook)
const { object, isLoading } = useObject({
  api: '/api/analyze',
  schema: /* same schema */,
});

{object?.summary && <p>{object.summary}</p>}
{object?.keyPoints?.map(point => <li key={point}>{point}</li>)}
```

### When to Use
- Real-time structured data (forms, dashboards)
- Show progressive completion
- Large structured outputs
- Better UX for slow generations

---

## Comparison Table

| Function | Output Type | Streaming | Tools | Best For |
|----------|-------------|-----------|-------|----------|
| `generateText()` | Text | No | Yes | Batch processing, simple completions |
| `streamText()` | Text | Yes | Yes | Chat UIs, long responses |
| `generateObject()` | Structured | No | No | Data extraction, JSON generation |
| `streamObject()` | Structured | Yes | No | Real-time forms, progressive UIs |

---

**Questions?** Check `error-catalog.md` for common function-specific errors.
