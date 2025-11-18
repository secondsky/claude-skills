---
name: openai-responses
description: |
  This skill provides comprehensive knowledge for working with OpenAI's Responses API, the unified stateful API for building agentic applications. It should be used when building AI agents that preserve reasoning across turns, integrating MCP servers for external tools, using built-in tools (Code Interpreter, File Search, Web Search, Image Generation), managing stateful conversations, implementing background processing, or migrating from Chat Completions API.

  Use when building agentic workflows, conversational AI with memory, tools-based applications, RAG systems, data analysis agents, or any application requiring OpenAI's reasoning models with persistent state. Covers both Node.js SDK and Cloudflare Workers implementations.

  Keywords: responses api, openai responses, stateful openai, openai mcp, code interpreter openai, file search openai, web search openai, image generation openai, reasoning preservation, agentic workflows, conversation state, background mode, chat completions migration, gpt-5, polymorphic outputs
license: MIT
metadata:
  version: "2.0.0"
  last_verified: "2025-11-18"
  api_launch: "March 2025"
  sdk_version: "openai@5.19.1+"
  templates_included: 10
  references_included: 8
---

# OpenAI Responses API

**Status**: Production Ready | **API Launch**: March 2025 | **SDK**: openai@5.19.1+

---

## Quick Start (5 Minutes)

### Node.js

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
```

### Cloudflare Workers

```typescript
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
console.log(data.output_text);
```

**Load `references/setup-guide.md` for complete setup with stateful conversations and built-in tools.**

---

## What Is the Responses API?

The Responses API (`/v1/responses`) is OpenAI's unified interface for agentic applications launched March 2025.

**Key Innovation**: **Preserved Reasoning State**

Unlike Chat Completions where reasoning is discarded, Responses **keeps the notebook open**. The model's thought processes survive into the next turn, improving multi-turn performance by ~5% on TAUBench.

**Why Use Responses Over Chat Completions?**

| Feature | Chat Completions | Responses API |
|---------|-----------------|---------------|
| State Management | Manual history tracking | Automatic (conversation IDs) |
| Reasoning | Dropped between turns | Preserved across turns |
| Tools | Client-side round trips | Server-side hosted |
| Cache Utilization | Baseline | 40-80% better |
| MCP Support | Manual integration | Built-in |

**Load `references/responses-vs-chat-completions.md` for complete comparison.**

---

## Critical Rules

### Always Do ✅

1. **Store conversation_id** - Preserve state between turns
2. **Use environment variables** for API keys (NEVER hardcode)
3. **Implement error handling** - Handle rate limits (429), auth errors (401)
4. **Enable tools explicitly** - `tools: { web_search: { enabled: true } }`
5. **Stream long responses** - Use `stream: true` for better UX
6. **Validate inputs** - Sanitize user messages before sending
7. **Monitor costs** - Track token usage and API calls
8. **Handle polymorphic outputs** - Check `output.type` (message, reasoning, function_call)
9. **Set timeouts** - Prevent hanging requests
10. **Cache aggressively** - Leverage improved cache utilization

### Never Do ❌

1. **Never expose API key** in client-side code
2. **Never ignore conversation_id** - State will be lost
3. **Never assume single output type** - Always check `output.type`
4. **Never skip error handling** - API calls can fail
5. **Never hardcode model names** - Use constants
6. **Never forget to enable tools** - Tools won't work without explicit enable
7. **Never mix Chat Completions and Responses** in same conversation
8. **Never ignore rate limits** - Implement backoff
9. **Never store API keys** in databases or logs
10. **Never skip input validation** - Prevent injection attacks

---

## Top 5 Use Cases

### Use Case 1: Stateful Conversation

**Quick Pattern:**

```typescript
// First turn
const response1 = await openai.responses.create({
  model: 'gpt-5',
  input: 'My favorite color is blue.',
});

const conversationId = response1.conversation_id;

// Second turn - model remembers
const response2 = await openai.responses.create({
  model: 'gpt-5',
  conversation_id: conversationId,
  input: 'What is my favorite color?',
});
// Output: "Your favorite color is blue."
```

**Load**: `references/stateful-conversations.md` + `templates/stateful-conversation.ts`

---

### Use Case 2: Web Search Agent

**Quick Pattern:**

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Search the web for latest AI news.',
  tools: {
    web_search: { enabled: true },
  },
});
```

**Load**: `references/built-in-tools-guide.md` + `templates/web-search.ts`

---

### Use Case 3: Code Interpreter

**Quick Pattern:**

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Calculate the sum of squares from 1 to 100.',
  tools: {
    code_interpreter: { enabled: true },
  },
});
```

**Load**: `references/built-in-tools-guide.md` + `templates/code-interpreter.ts`

---

### Use Case 4: File Search (RAG)

**Quick Pattern:**

```typescript
// Upload file
const file = await openai.files.create({
  file: fs.createReadStream('document.pdf'),
  purpose: 'user_data',
});

// Search file
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Summarize key points from the uploaded document.',
  tools: {
    file_search: {
      enabled: true,
      file_ids: [file.id],
    },
  },
});
```

**Load**: `references/built-in-tools-guide.md` + `templates/file-search.ts`

---

### Use Case 5: MCP Server Integration

**Quick Pattern:**

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Get weather for San Francisco.',
  tools: {
    mcp_servers: [
      {
        url: 'https://weather-mcp.example.com',
        tool_choice: 'auto',
      },
    ],
  },
});
```

**Load**: `references/mcp-integration-guide.md` + `templates/mcp-integration.ts`

---

## Built-in Tools (Server-Side)

All tools run server-side for lower latency and simpler code:

1. **Code Interpreter** - Execute Python code, data analysis
2. **File Search** - Search uploaded documents (RAG)
3. **Web Search** - Real-time web search
4. **Image Generation** - DALL-E integration

**Enable explicitly:**

```typescript
tools: {
  code_interpreter: { enabled: true },
  file_search: { enabled: true, file_ids: ['file-123'] },
  web_search: { enabled: true },
  image_generation: { enabled: true },
}
```

**Load `references/built-in-tools-guide.md` for complete guide with examples.**

---

## Stateful Conversations

**Automatic state management** with conversation IDs:

```typescript
// Create conversation
const response1 = await openai.responses.create({
  model: 'gpt-5',
  input: 'Remember: my name is Alice.',
});

// Continue conversation
const response2 = await openai.responses.create({
  model: 'gpt-5',
  conversation_id: response1.conversation_id,  // Pass ID
  input: 'What is my name?',
});
```

**Benefits:**
- No manual message array management
- Reasoning preserved between turns
- Better cache utilization (40-80%)

**Storage options:**
- **Node.js**: Session storage, Redis, database
- **Cloudflare Workers**: KV namespace

**Load `references/stateful-conversations.md` for persistence patterns.**

---

## Migration from Chat Completions

### Before (Chat Completions):

```typescript
const messages = [{ role: 'user', content: 'Hello' }];

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: messages,
});

// Manual history management
messages.push(response.choices[0].message);
```

### After (Responses API):

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Hello',
});

// Automatic state management
const response2 = await openai.responses.create({
  model: 'gpt-5',
  conversation_id: response.conversation_id,
  input: 'Follow-up question',
});
```

**Load `references/migration-guide.md` for complete migration checklist.**

---

## Polymorphic Outputs

Responses can return multiple output types:

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Calculate 2 + 2 and explain your reasoning.',
});

// Handle different output types
for (const output of response.output) {
  if (output.type === 'message') {
    console.log('Message:', output.content);
  } else if (output.type === 'reasoning') {
    console.log('Reasoning:', output.summary);
  } else if (output.type === 'function_call') {
    console.log('Function:', output.name, output.arguments);
  } else if (output.type === 'image') {
    console.log('Image URL:', output.url);
  }
}
```

**Or use convenience property:**

```typescript
console.log(response.output_text);  // Simplified text output
```

**Load `references/reasoning-preservation.md` for reasoning output details.**

---

## Background Mode

For long-running tasks (>60 seconds):

```typescript
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Analyze this 50-page document.',
  background: true,  // Runs asynchronously
});

console.log(response.status);  // 'in_progress'

// Poll for completion
const completed = await openai.responses.retrieve(response.id);
console.log(completed.output_text);
```

**Load `templates/background-mode.ts` for complete polling pattern.**

---

## Error Handling

**Common errors:**

```typescript
try {
  const response = await openai.responses.create({
    model: 'gpt-5',
    input: userMessage,
  });
} catch (error) {
  if (error.status === 429) {
    // Rate limit - implement backoff
    await sleep(1000);
    return retry();
  } else if (error.status === 401) {
    // Invalid API key
    console.error('Invalid API key');
  } else if (error.status === 400) {
    // Bad request - invalid input
    console.error('Invalid input:', error.message);
  } else {
    console.error('OpenAI error:', error);
  }
  throw error;
}
```

**Load `references/top-errors.md` for all errors with solutions.**

---

## When to Load References

### Load `references/setup-guide.md` when:
- First-time Responses API user
- Need complete Node.js or Cloudflare Workers setup
- Want production deployment checklist
- Troubleshooting setup issues

### Load `references/responses-vs-chat-completions.md` when:
- Deciding between Responses and Chat Completions
- Understanding differences in detail
- Comparing performance characteristics
- Evaluating migration effort

### Load `references/migration-guide.md` when:
- Migrating from Chat Completions API
- Need step-by-step migration checklist
- Want code comparison examples
- Planning migration timeline

### Load `references/built-in-tools-guide.md` when:
- Using Code Interpreter, File Search, Web Search, or Image Generation
- Need tool configuration options
- Want complete tool examples
- Troubleshooting tool issues

### Load `references/mcp-integration-guide.md` when:
- Integrating external MCP servers
- Building custom MCP tools
- Need MCP configuration examples
- Connecting to third-party APIs

### Load `references/stateful-conversations.md` when:
- Implementing conversation persistence
- Using KV/Redis for state storage
- Need conversation lifecycle management
- Building multi-turn applications

### Load `references/reasoning-preservation.md` when:
- Want to access model reasoning
- Debugging model behavior
- Building transparent AI systems
- Need reasoning output examples

### Load `references/top-errors.md` when:
- Encountering API errors
- Need error code reference
- Want prevention strategies
- Implementing error handling

---

## Using Bundled Resources

### References (references/)

- **setup-guide.md** - Complete setup (Node.js + Cloudflare Workers)
- **responses-vs-chat-completions.md** - Detailed API comparison
- **migration-guide.md** - Chat Completions migration checklist
- **built-in-tools-guide.md** - Code Interpreter, File Search, Web Search, Image Generation
- **mcp-integration-guide.md** - MCP server integration guide
- **stateful-conversations.md** - Conversation persistence patterns
- **reasoning-preservation.md** - Accessing model reasoning
- **top-errors.md** - Complete error catalog with solutions

### Templates (templates/)

- **basic-response.ts** - Simple response example
- **stateful-conversation.ts** - Multi-turn conversation
- **code-interpreter.ts** - Code execution example
- **file-search.ts** - Document search (RAG)
- **web-search.ts** - Web search agent
- **image-generation.ts** - Image generation
- **mcp-integration.ts** - MCP server integration
- **background-mode.ts** - Long-running tasks
- **cloudflare-worker.ts** - Complete Cloudflare Workers implementation
- **package.json** - Dependencies

---

## Node.js vs Cloudflare Workers

**Node.js:**
- Use official `openai` SDK
- Better for complex applications
- Full streaming support
- Easier debugging

**Cloudflare Workers:**
- Use fetch API (no SDK needed)
- Lower latency (edge deployment)
- KV for conversation state
- Cost-effective at scale

**Load templates for platform-specific examples:**
- Node.js: All `.ts` templates work
- Cloudflare Workers: `templates/cloudflare-worker.ts`

---

## Production Checklist

Before deploying:

- [ ] API key stored securely (environment variable or secret)
- [ ] Error handling implemented (401, 429, 400, 500)
- [ ] Rate limiting handled (exponential backoff)
- [ ] Conversation IDs persisted (database/KV)
- [ ] Input validation added
- [ ] Output sanitization implemented
- [ ] Streaming enabled for long responses
- [ ] Timeouts configured
- [ ] Monitoring and logging set up
- [ ] Cost tracking enabled
- [ ] Tools enabled explicitly
- [ ] Polymorphic output handling

---

## Related Skills

- **openai-api** - Classic Chat Completions API
- **openai-agents** - OpenAI Agents SDK (wrapper for Responses)
- **claude-api** - Claude API for comparison
- **ai-sdk-core** - Vercel AI SDK (supports Responses)

---

## Official Documentation

- **Responses API**: https://platform.openai.com/docs/api-reference/responses
- **Migration Guide**: https://platform.openai.com/docs/guides/responses-migration
- **Built-in Tools**: https://platform.openai.com/docs/guides/responses-tools
- **MCP Integration**: https://platform.openai.com/docs/guides/mcp

---

**Questions? Issues?**

1. Check `references/top-errors.md` for error solutions
2. Review `references/setup-guide.md` for complete setup
3. See `references/migration-guide.md` for Chat Completions migration
4. Load templates from `templates/` for working examples
