---
name: claude-api
description: |
  This skill provides comprehensive knowledge for working with the Anthropic Messages API (Claude API). It should be used when integrating Claude models into applications, implementing streaming responses, enabling prompt caching for cost savings, adding tool use (function calling), processing images with vision capabilities, or using extended thinking mode.

  Use when building chatbots, AI assistants, content generation tools, or any application requiring Claude's language understanding. Covers both server-side implementations (Node.js, Cloudflare Workers, Next.js) and direct API access.

  Keywords: claude api, anthropic api, messages api, @anthropic-ai/sdk, claude streaming, prompt caching, tool use, vision, extended thinking, claude 3.5 sonnet, claude 3.7 sonnet, claude sonnet 4, function calling, SSE, rate limits, 429 errors
license: MIT
metadata:
  version: "2.0.0"
  last_verified: "2025-11-21"
  sdk_version: "@anthropic-ai/sdk@0.70.1"
  templates_included: 12
  references_included: 7
---

# Claude API (Anthropic Messages API)

**Status**: Production Ready | **SDK**: @anthropic-ai/sdk@0.70.1

---

## Quick Start (5 Minutes)

### Node.js

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

### Cloudflare Workers

```typescript
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
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
});

const data = await response.json();
console.log(data.content[0].text);
```

**Load `references/setup-guide.md` for complete setup with streaming, caching, and tools.**

---

## Critical Rules

### Always Do ✅

1. **Use environment variables** for API keys (NEVER hardcode)
2. **Set max_tokens** explicitly (required parameter)
3. **Pin model version** (`claude-sonnet-4-5-20250929`, not `claude-3-5-sonnet-latest`)
4. **Enable prompt caching** for repeated content (90% cost savings)
5. **Stream long responses** (`stream: true`) for better UX
6. **Handle errors** - Implement retry logic for 429, 529 errors
7. **Validate inputs** - Sanitize user messages before sending
8. **Monitor costs** - Track token usage
9. **Set timeouts** - Prevent hanging requests
10. **Use tool use properly** - Return tool_result in follow-up message

### Never Do ❌

1. **Never expose API key** in client-side code
2. **Never skip max_tokens** - API will error without it
3. **Never ignore stop_reason** - Check for `tool_use`, `end_turn`, `max_tokens`
4. **Never assume single content block** - `content` is an array
5. **Never use outdated models** - Pin to specific version
6. **Never skip error handling** - API calls can fail
7. **Never mix message roles** - Alternate user/assistant correctly
8. **Never ignore rate limits** - Implement exponential backoff
9. **Never store API keys** in logs or databases
10. **Never skip input validation** - Prevent injection attacks

---

## Top 5 Use Cases

### Use Case 1: Basic Chat

**Quick Pattern:**

```typescript
const message = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Explain quantum computing.' },
  ],
});

console.log(message.content[0].text);
```

**Load**: `templates/basic-chat.ts` for complete example

---

### Use Case 2: Streaming Responses

**Quick Pattern:**

```typescript
const stream = await client.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Write a story.' }],
});

for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    process.stdout.write(event.delta.text);
  }
}
```

**Load**: `templates/streaming-chat.ts` for complete implementation

---

### Use Case 3: Prompt Caching (90% Cost Savings)

**Quick Pattern:**

```typescript
const message = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: 'Long system prompt...',  // This gets cached
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [{ role: 'user', content: 'Question?' }],
});
```

**Benefits**: Cache lasts 5 minutes, 90% savings on cached tokens

**Load**: `references/prompt-caching-guide.md` + `templates/prompt-caching.ts`

---

### Use Case 4: Tool Use (Function Calling)

**Quick Pattern:**

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
          location: { type: 'string' },
        },
        required: ['location'],
      },
    },
  ],
  messages: [
    { role: 'user', content: 'What is the weather in SF?' },
  ],
});

if (message.stop_reason === 'tool_use') {
  const toolUse = message.content.find(b => b.type === 'tool_use');
  // Execute tool and send result back...
}
```

**Load**: `references/tool-use-patterns.md` + `templates/tool-use-basic.ts`

---

### Use Case 5: Vision (Image Understanding)

**Quick Pattern:**

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
        { type: 'text', text: 'What is in this image?' },
      ],
    },
  ],
});
```

**Load**: `references/vision-capabilities.md` + `templates/vision-image.ts`

---

## Model Versions (Current)

**Latest models:**
- `claude-sonnet-4-5-20250929` - Recommended (best performance)
- `claude-sonnet-4-20250514` - Stable version
- `claude-3-7-sonnet-20250219` - Previous generation
- `claude-3-5-sonnet-20241022` - Legacy

**Always pin to specific version** (not `-latest` suffix)

---

## Streaming

**Benefits:**
- Better user experience (progressive output)
- Lower latency to first token
- Handle long responses without timeout

**Basic streaming:**

```typescript
const stream = await client.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Tell me a story.' }],
});

for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    process.stdout.write(event.delta.text);
  }
}
```

**Load `templates/streaming-chat.ts` for complete SSE handling.**

---

## Prompt Caching (⭐ 90% Cost Savings)

**How it works:**
- Mark content with `cache_control: { type: 'ephemeral' }`
- Cache lasts 5 minutes
- 90% cost reduction on cached tokens
- 95% cost reduction on cache writes vs reads

**Best for:**
- Large system prompts
- Documents in context
- Tool definitions
- Examples/few-shot prompts

**Example:**

```typescript
system: [
  {
    type: 'text',
    text: largeSystemPrompt,
    cache_control: { type: 'ephemeral' },  // Cache this
  },
],
```

**Load `references/prompt-caching-guide.md` for complete guide with benchmarks.**

---

## Extended Thinking Mode

**For complex reasoning tasks:**

```typescript
const message = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096,
  thinking: {
    type: 'enabled',
    budget_tokens: 2000,  // Optional limit
  },
  messages: [{ role: 'user', content: 'Solve complex problem...' }],
});

// Access thinking process
const thinking = message.content.find(b => b.type === 'thinking')?.thinking;
console.log('Reasoning:', thinking);

// Get answer
const answer = message.content.find(b => b.type === 'text')?.text;
```

**Load `templates/extended-thinking.ts` for complete example.**

---

## Error Handling

**Common errors:**

```typescript
try {
  const message = await client.messages.create({...});
} catch (error) {
  if (error instanceof Anthropic.APIError) {
    if (error.status === 429) {
      // Rate limit - retry with backoff
      await sleep(1000);
      return retry();
    } else if (error.status === 401) {
      // Invalid API key
      console.error('Invalid API key');
    } else if (error.status === 400) {
      // Bad request
      console.error('Bad request:', error.message);
    } else if (error.status === 529) {
      // Overloaded - retry
      await sleep(2000);
      return retry();
    }
  }
  throw error;
}
```

**Load `references/top-errors.md` for all errors with solutions.**

---

## Rate Limits

**Standard limits:**
- Requests: 50/minute, 1000/day
- Tokens: 40,000/minute, 1,000,000/day

**Handle 429 errors:**

```typescript
async function createWithRetry(params, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await client.messages.create(params);
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        await sleep(Math.pow(2, i) * 1000);  // 1s, 2s, 4s
        continue;
      }
      throw error;
    }
  }
}
```

**Load `references/rate-limits.md` for limits and best practices.**

---

## When to Load References

### Load `references/setup-guide.md` when:
- First-time Claude API user
- Need complete Node.js or Cloudflare Workers setup
- Want production deployment checklist
- Troubleshooting setup issues

### Load `references/prompt-caching-guide.md` when:
- Want to reduce costs by 90%
- Using large system prompts or documents
- Need caching strategy and benchmarks
- Optimizing for repeated content

### Load `references/tool-use-patterns.md` when:
- Implementing function calling
- Need tool definition patterns
- Want multi-turn tool use examples
- Troubleshooting tool use issues

### Load `references/vision-capabilities.md` when:
- Processing images with Claude
- Need image format requirements
- Want vision use cases and limitations
- Troubleshooting vision issues

### Load `references/api-reference.md` when:
- Need complete API parameter reference
- Want all message formats
- Need response schema details
- Looking up specific fields

### Load `references/top-errors.md` when:
- Encountering API errors
- Need error code reference
- Want prevention strategies
- Implementing error handling

### Load `references/rate-limits.md` when:
- Planning high-volume usage
- Encountering 429 errors
- Need tier limits information
- Optimizing request patterns

---

## Using Bundled Resources

### References (references/)

- **setup-guide.md** - Complete setup (Node.js + Cloudflare Workers)
- **api-reference.md** - Complete API parameter reference
- **prompt-caching-guide.md** - 90% cost savings guide
- **tool-use-patterns.md** - Function calling patterns
- **vision-capabilities.md** - Image understanding guide
- **top-errors.md** - Complete error catalog
- **rate-limits.md** - Limits and best practices

### Templates (templates/)

- **basic-chat.ts** - Simple chat example
- **streaming-chat.ts** - Streaming implementation
- **prompt-caching.ts** - Caching example
- **tool-use-basic.ts** - Basic tool use
- **tool-use-advanced.ts** - Advanced tool patterns
- **vision-image.ts** - Vision example
- **extended-thinking.ts** - Extended thinking mode
- **error-handling.ts** - Complete error handling
- **nodejs-example.ts** - Complete Node.js app
- **cloudflare-worker.ts** - Complete CF Worker
- **nextjs-api-route.ts** - Next.js API route
- **package.json** - Dependencies

---

## Platform Integrations

### Node.js
```bash
bun add @anthropic-ai/sdk
```

Use templates: `nodejs-example.ts`, `basic-chat.ts`, `streaming-chat.ts`

### Cloudflare Workers
No SDK needed - use fetch API

Use templates: `cloudflare-worker.ts`

### Next.js
```bash
bun add @anthropic-ai/sdk
```

Use templates: `nextjs-api-route.ts`

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
- [ ] Model version pinned (not `-latest`)
- [ ] max_tokens set appropriately

---

## Related Skills

- **openai-api** - OpenAI Chat Completions for comparison
- **claude-agent-sdk** - Higher-level Claude SDK
- **ai-sdk-core** - Vercel AI SDK (supports Claude)

---

## Official Documentation

- **Messages API**: https://docs.anthropic.com/en/api/messages
- **Prompt Caching**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- **Tool Use**: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
- **Vision**: https://docs.anthropic.com/en/docs/build-with-claude/vision
- **Extended Thinking**: https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking

---

**Questions? Issues?**

1. Check `references/top-errors.md` for error solutions
2. Review `references/setup-guide.md` for complete setup
3. See `references/prompt-caching-guide.md` for cost optimization
4. Load templates from `templates/` for working examples
