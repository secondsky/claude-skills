# Claude API Setup Guide

Complete setup guide for Node.js and Cloudflare Workers.

---

## Node.js Setup

### Step 1: Install Anthropic SDK

```bash
bun add @anthropic-ai/sdk  # preferred
# or: npm install @anthropic-ai/sdk
```

**Version**: `@anthropic-ai/sdk@0.32.1` or later

### Step 2: Get API Key

1. Go to https://console.anthropic.com/
2. Navigate to API Keys
3. Create new key
4. Save securely (NEVER commit to git)

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

### Step 3: Basic Chat

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Hello, Claude!' },
  ],
});

console.log(message.content[0].text);
```

### Step 4: Streaming

```typescript
const stream = await client.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Write a story about a robot.' },
  ],
});

for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    process.stdout.write(event.delta.text);
  }
}
```

### Step 5: Prompt Caching (90% Cost Savings)

```typescript
const message = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: 'You are a helpful assistant...',
      cache_control: { type: 'ephemeral' },  // Cache this
    },
  ],
  messages: [
    { role: 'user', content: 'Hello!' },
  ],
});
```

**Cache lasts 5 minutes, saves 90% on cached tokens.**

---

## Cloudflare Workers Setup

### Step 1: Create Worker

```bash
npm create cloudflare@latest my-claude-worker
cd my-claude-worker
```

### Step 2: Add API Key to Secrets

```bash
npx wrangler secret put ANTHROPIC_API_KEY
# Paste sk-ant-api03-... when prompted
```

### Step 3: Basic Chat (Fetch API)

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: 'Hello, Claude!' },
        ],
      }),
    });

    const data = await response.json();
    return Response.json({ message: data.content[0].text });
  },
};
```

### Step 4: Streaming with Workers

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const stream = new ReadableStream({
      async start(controller) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1024,
            stream: true,
            messages: [
              { role: 'user', content: 'Write a story.' },
            ],
          }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content_block_delta') {
                controller.enqueue(new TextEncoder().encode(data.delta.text));
              }
            }
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
```

---

## Common Patterns

### Tool Use (Function Calling)

```typescript
const message = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  tools: [
    {
      name: 'get_weather',
      description: 'Get weather for a location',
      input_schema: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
        },
        required: ['location'],
      },
    },
  ],
  messages: [
    { role: 'user', content: 'What is the weather in San Francisco?' },
  ],
});

// Check if tool was called
if (message.stop_reason === 'tool_use') {
  const toolUse = message.content.find(block => block.type === 'tool_use');
  console.log('Tool:', toolUse.name);
  console.log('Input:', toolUse.input);

  // Execute tool
  const result = await getWeather(toolUse.input.location);

  // Send result back
  const finalMessage = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    tools: [...],
    messages: [
      { role: 'user', content: 'What is the weather in San Francisco?' },
      { role: 'assistant', content: message.content },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          },
        ],
      },
    ],
  });
}
```

### Vision (Image Understanding)

```typescript
const message = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          type: 'text',
          text: 'What is in this image?',
        },
      ],
    },
  ],
});
```

### Extended Thinking Mode

```typescript
const message = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096,
  thinking: {
    type: 'enabled',
    budget_tokens: 2000,  // Optional: limit thinking tokens
  },
  messages: [
    { role: 'user', content: 'Solve this complex math problem...' },
  ],
});

// Access thinking process
const thinkingBlock = message.content.find(block => block.type === 'thinking');
console.log('Thinking:', thinkingBlock?.thinking);

// Get final answer
const textBlock = message.content.find(block => block.type === 'text');
console.log('Answer:', textBlock?.text);
```

---

## Error Handling

```typescript
try {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'Hello!' },
    ],
  });
} catch (error) {
  if (error instanceof Anthropic.APIError) {
    if (error.status === 429) {
      // Rate limit - implement backoff
      console.error('Rate limited');
    } else if (error.status === 401) {
      // Invalid API key
      console.error('Invalid API key');
    } else if (error.status === 400) {
      // Bad request
      console.error('Bad request:', error.message);
    } else if (error.status === 529) {
      // Overloaded - retry with backoff
      console.error('API overloaded');
    }
  }
  throw error;
}
```

---

## Production Checklist

- [ ] API key stored securely (environment variable or secret)
- [ ] Error handling implemented (401, 429, 400, 529)
- [ ] Rate limiting handled (exponential backoff)
- [ ] Prompt caching enabled for repeated content
- [ ] Streaming implemented for long responses
- [ ] Input validation added
- [ ] Output sanitization implemented
- [ ] Monitoring and logging set up
- [ ] Cost tracking enabled
- [ ] Timeouts configured
- [ ] Model version pinned (claude-sonnet-4-5-20250929)
- [ ] Max tokens set appropriately

---

## Platform-Specific Tips

### Node.js
- Use official SDK (`@anthropic-ai/sdk`)
- TypeScript support included
- Better error handling
- Easier streaming

### Cloudflare Workers
- Use fetch API (lighter)
- Store API key in secrets
- Edge deployment (lower latency)
- Cost-effective at scale
- Use KV for conversation state

---

**Load `templates/` for complete working examples:**
- `nodejs-example.ts` - Complete Node.js implementation
- `cloudflare-worker.ts` - Complete Cloudflare Workers implementation
- `streaming-chat.ts` - Streaming implementation
- `tool-use-basic.ts` - Tool use example
- `vision-image.ts` - Vision example
- `extended-thinking.ts` - Extended thinking example
- `prompt-caching.ts` - Prompt caching example

**Load `references/top-errors.md` for all errors with solutions.**
