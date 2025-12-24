# Cloudflare Workers AI - External Integrations

Integration patterns for using Workers AI with external SDKs and services.

---

## Table of Contents

1. [OpenAI SDK Compatibility](#openai-sdk-compatibility)
2. [Vercel AI SDK](#vercel-ai-sdk)
3. [REST API](#rest-api)

---

## OpenAI SDK Compatibility

Workers AI supports OpenAI-compatible endpoints, allowing use of the OpenAI SDK with Workers AI models.

### Setup

```typescript
import OpenAI from 'openai';

export interface Env {
  CLOUDFLARE_API_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const openai = new OpenAI({
      apiKey: env.CLOUDFLARE_API_KEY,
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
    });

    // Chat completions
    const completion = await openai.chat.completions.create({
      model: '@cf/meta/llama-3.1-8b-instruct',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    return Response.json(completion);
  },
};
```

### Supported Endpoints

| OpenAI Endpoint | Workers AI Equivalent |
|-----------------|----------------------|
| `/v1/chat/completions` | Text generation models |
| `/v1/embeddings` | Embedding models |

### Chat Completions

```typescript
const completion = await openai.chat.completions.create({
  model: '@cf/meta/llama-3.1-8b-instruct',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is Cloudflare?' },
  ],
  stream: true, // Streaming supported
});

// Handle streaming
for await (const chunk of completion) {
  const content = chunk.choices[0]?.delta?.content || '';
  // Process chunk
}
```

### Embeddings

```typescript
const embeddings = await openai.embeddings.create({
  model: '@cf/baai/bge-base-en-v1.5',
  input: 'Hello world',
});

console.log(embeddings.data[0].embedding);
// [0.123, -0.456, ...]
```

### Use Cases

- **Migration**: Easily switch from OpenAI to Workers AI
- **Multi-Provider**: Use same codebase for multiple AI providers
- **Familiar API**: Developers familiar with OpenAI can use same patterns

---

## Vercel AI SDK

The `workers-ai-provider` package provides native Vercel AI SDK support.

### Installation

```bash
bun add workers-ai-provider ai
```

### Setup

```typescript
import { createWorkersAI } from 'workers-ai-provider';
import { generateText, streamText } from 'ai';

export interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const workersai = createWorkersAI({ binding: env.AI });

    // Generate text
    const result = await generateText({
      model: workersai('@cf/meta/llama-3.1-8b-instruct'),
      prompt: 'Write a poem',
    });

    return Response.json({ text: result.text });
  },
};
```

### Streaming

```typescript
import { streamText } from 'ai';

const stream = streamText({
  model: workersai('@cf/meta/llama-3.1-8b-instruct'),
  prompt: 'Tell me a story',
});

return stream.toAIStreamResponse();
```

### With Chat History

```typescript
import { generateText } from 'ai';

const result = await generateText({
  model: workersai('@cf/meta/llama-3.1-8b-instruct'),
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is 2+2?' },
    { role: 'assistant', content: '4' },
    { role: 'user', content: 'What about 3+3?' },
  ],
});
```

### Use Cases

- **Next.js/React Apps**: Seamless integration with Vercel AI SDK
- **Streaming UI**: Built-in streaming support for chat interfaces
- **Type Safety**: Full TypeScript support

---

## REST API

Direct REST API access for any HTTP client.

### Base URL

```
https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}
```

### Authentication

```bash
# Header
Authorization: Bearer {CLOUDFLARE_API_KEY}
```

### Text Generation

```bash
curl https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.1-8b-instruct \
  -H "Authorization: Bearer {CLOUDFLARE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are helpful"},
      {"role": "user", "content": "Hello"}
    ]
  }'
```

### Embeddings

```bash
curl https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/baai/bge-base-en-v1.5 \
  -H "Authorization: Bearer {CLOUDFLARE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"text": ["Hello world", "Second text"]}'
```

### Image Generation

```bash
curl https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/black-forest-labs/flux-1-schnell \
  -H "Authorization: Bearer {CLOUDFLARE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset"}' \
  --output image.png
```

---

## Choosing an Integration Method

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| **Native Binding** (`env.AI`) | Workers apps | Fastest, no extra packages | Workers-only |
| **OpenAI SDK** | Migration, multi-provider | Familiar API | Extra dependency |
| **Vercel AI SDK** | Next.js/React apps | Streaming UI support | Extra dependencies |
| **REST API** | Any language/platform | Universal | More verbose |

**Recommendation**: Use native binding (`env.AI`) for Workers apps, OpenAI SDK for migrations, Vercel AI SDK for frontend frameworks.

---

## References

- [Workers AI REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)
- [OpenAI Compatibility](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/)
- [Vercel AI SDK Provider](https://sdk.vercel.ai/providers/community-providers/cloudflare-workers-ai)
