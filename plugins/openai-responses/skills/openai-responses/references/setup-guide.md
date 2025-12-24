# OpenAI Responses API Setup Guide

Complete setup guide for Node.js and Cloudflare Workers implementations.

---

## Node.js Setup

### Step 1: Install OpenAI SDK

```bash
bun add openai  # preferred
# or: npm install openai
# or: pnpm add openai
```

**Version requirement**: `openai@5.19.1` or later

### Step 2: Get API Key

1. Go to https://platform.openai.com/
2. Navigate to API Keys section
3. Create new key
4. Save securely (NEVER commit to git)

```bash
# Set environment variable
export OPENAI_API_KEY="sk-proj-..."

# Or in .env file
OPENAI_API_KEY=sk-proj-...
```

### Step 3: Basic Response

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'What are the 5 Ds of dodgeball?',
});

console.log(response.output_text);
// Output: "Dodge, Duck, Dip, Dive, and Dodge"
```

### Step 4: Stateful Conversation

```typescript
// First turn
const response1 = await openai.responses.create({
  model: 'gpt-5',
  input: 'My favorite color is blue.',
});

const conversationId = response1.conversation_id;

// Second turn - model remembers context
const response2 = await openai.responses.create({
  model: 'gpt-5',
  conversation_id: conversationId,  // Continue conversation
  input: 'What is my favorite color?',
});

console.log(response2.output_text);
// Output: "Your favorite color is blue."
```

### Step 5: Use Built-in Tools

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Search the web for the latest news about AI.',
  tools: {
    web_search: { enabled: true },
  },
});

// Model automatically searches web and includes results
console.log(response.output_text);
```

**Available built-in tools:**
- `code_interpreter` - Execute Python code
- `file_search` - Search uploaded files
- `web_search` - Search the web
- `image_generation` - Generate images with DALL-E

### Step 6: Deploy to Production

**Environment variables:**

```bash
# .env.production
OPENAI_API_KEY=sk-proj-...
NODE_ENV=production
```

**Error handling:**

```typescript
try {
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: userMessage,
  });
  return response.output_text;
} catch (error) {
  if (error.status === 429) {
    // Rate limit - implement backoff
    await sleep(1000);
    return retry();
  } else if (error.status === 401) {
    // Invalid API key
    console.error('Invalid API key');
  } else {
    console.error('OpenAI error:', error);
  }
  throw error;
}
```

---

## Cloudflare Workers Setup

### Step 1: Create Worker

```bash
npm create cloudflare@latest my-openai-worker
cd my-openai-worker
```

### Step 2: Add API Key to Secrets

```bash
npx wrangler secret put OPENAI_API_KEY
# Paste your sk-proj-... key when prompted
```

### Step 3: Basic Response (Fetch API)

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        input: 'Hello, world!',
      }),
    });

    const data = await response.json();
    return new Response(data.output_text);
  },
};
```

### Step 4: Stateful Conversation with KV

```typescript
export interface Env {
  OPENAI_API_KEY: string;
  CONVERSATIONS: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { message, userId } = await request.json();

    // Retrieve conversation ID from KV
    const conversationId = await env.CONVERSATIONS.get(userId);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        input: message,
        conversation_id: conversationId,  // Continue conversation
      }),
    });

    const data = await response.json();

    // Store conversation ID for next turn
    if (!conversationId) {
      await env.CONVERSATIONS.put(userId, data.conversation_id);
    }

    return Response.json({
      message: data.output_text,
      conversationId: data.conversation_id,
    });
  },
};
```

### Step 5: Add wrangler.toml Configuration

```toml
name = "my-openai-worker"
main = "src/index.ts"
compatibility_date = "2025-10-11"

[[kv_namespaces]]
binding = "CONVERSATIONS"
id = "your-kv-namespace-id"
```

### Step 6: Deploy

```bash
npx wrangler deploy
```

---

## Common Patterns

### Pattern 1: Streaming Responses (Node.js)

```typescript
const stream = await openai.responses.create({
  model: 'gpt-5',
  input: 'Write a story about a robot.',
  stream: true,
});

for await (const chunk of stream) {
  if (chunk.type === 'content_delta') {
    process.stdout.write(chunk.delta);
  }
}
```

### Pattern 2: Background Mode for Long Tasks

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Analyze this 50-page document.',
  modalities: ['text'],
  background: true,  // Runs asynchronously
});

console.log(response.status);  // 'in_progress'

// Poll for completion
const completedResponse = await openai.responses.retrieve(response.id);
console.log(completedResponse.output_text);
```

### Pattern 3: Polymorphic Output Handling

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Calculate 2 + 2.',
});

// Handle different output types
for (const output of response.output) {
  if (output.type === 'message') {
    console.log('Message:', output.content);
  } else if (output.type === 'reasoning') {
    console.log('Reasoning:', output.summary);
  } else if (output.type === 'function_call') {
    console.log('Function:', output.name);
  }
}
```

### Pattern 4: File Upload for File Search

```typescript
// Upload file
const file = await openai.files.create({
  file: fs.createReadStream('document.pdf'),
  purpose: 'user_data',
});

// Use file search
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Summarize the key points from the uploaded document.',
  tools: {
    file_search: {
      enabled: true,
      file_ids: [file.id],
    },
  },
});
```

### Pattern 5: Image Generation

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Generate an image of a sunset over mountains.',
  tools: {
    image_generation: { enabled: true },
  },
});

// Extract image URL from output
for (const output of response.output) {
  if (output.type === 'image') {
    console.log('Image URL:', output.url);
  }
}
```

---

## Environment-Specific Considerations

### Node.js Best Practices

1. **Use environment variables** for API keys (never hardcode)
2. **Implement retry logic** for rate limits (exponential backoff)
3. **Stream large responses** to avoid memory issues
4. **Cache conversation IDs** in database or session storage
5. **Set timeouts** for long-running requests

### Cloudflare Workers Best Practices

1. **Store API key in secrets** (not environment variables)
2. **Use KV for conversation state** (persistent storage)
3. **Leverage edge caching** for repeated queries
4. **Set CPU time limits** for long requests
5. **Handle streaming** with TransformStream

---

## Migration from Chat Completions

### Before (Chat Completions):

```typescript
// Manual message history management
const messages = [
  { role: 'user', content: 'My name is Alice.' },
];

const response1 = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: messages,
});

// Must manually track history
messages.push(response1.choices[0].message);
messages.push({ role: 'user', content: 'What is my name?' });

const response2 = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: messages,
});
```

### After (Responses API):

```typescript
// Automatic state management
const response1 = await openai.responses.create({
  model: 'gpt-5',
  input: 'My name is Alice.',
});

// Just pass conversation ID
const response2 = await openai.responses.create({
  model: 'gpt-5',
  conversation_id: response1.conversation_id,
  input: 'What is my name?',
});
```

**Benefits:**
- No manual message array management
- Reasoning preserved between turns
- Simpler code
- Better cache utilization (40-80% improvement)

---

## Troubleshooting

### Issue: "Invalid API key"

**Solution**: Check API key is correct and starts with `sk-proj-`

```bash
echo $OPENAI_API_KEY  # Should start with sk-proj-
```

### Issue: Rate limit errors (429)

**Solution**: Implement exponential backoff

```typescript
async function createWithRetry(params: any, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await openai.responses.create(params);
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

### Issue: Conversation state not persisting

**Solution**: Ensure conversation_id is passed correctly

```typescript
// ❌ Wrong: Creating new conversation each time
const response = await openai.responses.create({
  model: 'gpt-5',
  input: message,
  // Missing conversation_id!
});

// ✅ Correct: Continue existing conversation
const response = await openai.responses.create({
  model: 'gpt-5',
  conversation_id: existingId,  // Pass saved ID
  input: message,
});
```

### Issue: Tools not working

**Solution**: Ensure tools are enabled correctly

```typescript
// ❌ Wrong: Tool not enabled
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Search for Python tutorials',
  // Missing tools!
});

// ✅ Correct: Enable web_search tool
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Search for Python tutorials',
  tools: {
    web_search: { enabled: true },
  },
});
```

---

## Production Checklist

Before deploying to production:

- [ ] API key stored securely (environment variable or secret)
- [ ] Error handling implemented
- [ ] Rate limiting handled (exponential backoff)
- [ ] Conversation IDs persisted (database or KV)
- [ ] Streaming implemented for long responses
- [ ] Timeouts configured
- [ ] Monitoring and logging set up
- [ ] Cost tracking enabled
- [ ] Input validation added
- [ ] Output sanitization implemented

---

**See `references/migration-guide.md` for complete Chat Completions migration.**
**See `templates/` for working examples in Node.js and Cloudflare Workers.**
