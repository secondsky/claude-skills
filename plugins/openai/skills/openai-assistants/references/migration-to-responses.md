# Migrating from Assistants API to Responses API

**Last Updated**: 2025-10-25
**Deprecation Timeline**: Assistants API v2 sunset planned for H1 2026

---

## Overview

OpenAI announced that the Assistants API will be deprecated in favor of the Responses API. This guide helps you migrate existing Assistants API code to the newer, more flexible Responses API.

**Why the change?**
- **Simpler API**: Responses API is stateless and more straightforward
- **More control**: You manage conversation history and state
- **Better performance**: No server-side thread management overhead
- **Future-proof**: Active development and new features

---

## Key Differences

### Assistants API (Deprecated)

```typescript
// Stateful, server-managed
const assistant = await openai.beta.assistants.create({...})
const thread = await openai.beta.threads.create()
await openai.beta.threads.messages.create(thread.id, {...})
const run = await openai.beta.threads.runs.create(thread.id, {...})
// Poll for completion...
```

**Characteristics:**
- ✅ Server manages state
- ✅ Built-in tools (Code Interpreter, File Search)
- ❌ Complex run lifecycle
- ❌ Polling required
- ❌ Limited control over conversation flow

### Responses API (Recommended)

```typescript
// Stateless, client-managed
const response = await openai.chat.completions.create({
  model: "gpt-4-1106-preview",
  messages: conversationHistory, // You manage this
  tools: [...], // Define your own tools
})
```

**Characteristics:**
- ✅ Simple request/response
- ✅ Full control over state
- ✅ No polling
- ✅ Streaming built-in
- ✅ Tool calling integrated
- ❌ You manage conversation history
- ❌ You implement tools yourself

---

## Migration Path

### Step 1: Inventory Your Assistants

**What to check:**
- [ ] Which tools does your assistant use? (Code Interpreter, File Search, Functions)
- [ ] Do you use vector stores for RAG?
- [ ] Do you persist threads long-term?
- [ ] Do you use streaming?
- [ ] How complex is your function calling?

### Step 2: Map Features

| Assistants API Feature | Responses API Equivalent |
|------------------------|--------------------------|
| **Assistants** | System messages in chat completions |
| **Threads** | Conversation history array (you manage) |
| **Messages** | Chat messages array |
| **Runs** | Single `chat.completions.create()` call |
| **Streaming Runs** | `stream: true` parameter |
| **Code Interpreter** | External sandboxed execution (e.g., E2B, Modal) |
| **File Search** | External vector database (Pinecone, Weaviate, Qdrant) |
| **Function Calling** | `tools` parameter (same API) |
| **Vector Stores** | External vector database |

### Step 3: Migrate Code

#### Before (Assistants API)

```typescript
import OpenAI from 'openai'

const openai = new OpenAI()

// Create assistant
const assistant = await openai.beta.assistants.create({
  name: "Support Bot",
  instructions: "You are a helpful support assistant.",
  model: "gpt-4-1106-preview",
  tools: [{ type: "file_search" }],
})

// Create thread
const thread = await openai.beta.threads.create()

// Add message
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "How do I reset my password?",
})

// Create and poll run
const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
  assistant_id: assistant.id,
})

// Get messages
const messages = await openai.beta.threads.messages.list(thread.id)
```

#### After (Responses API)

```typescript
import OpenAI from 'openai'

const openai = new OpenAI()

// Manage conversation history
const conversationHistory = [
  {
    role: "system",
    content: "You are a helpful support assistant.",
  },
  {
    role: "user",
    content: "How do I reset my password?",
  },
]

// Single API call
const response = await openai.chat.completions.create({
  model: "gpt-4-1106-preview",
  messages: conversationHistory,
})

// Add assistant response to history
conversationHistory.push(response.choices[0].message)

// For next turn, just add new user message and call again
conversationHistory.push({
  role: "user",
  content: "Thanks! Where is the reset link sent?",
})

const response2 = await openai.chat.completions.create({
  model: "gpt-4-1106-preview",
  messages: conversationHistory,
})
```

---

## Migrating Specific Features

### Code Interpreter → External Execution

**Before (Assistants):**
```typescript
const assistant = await openai.beta.assistants.create({
  tools: [{ type: "code_interpreter" }],
})
```

**After (Responses + E2B):**
```typescript
import { Sandbox } from '@e2b/code-interpreter'

// Execute code externally
const sandbox = await Sandbox.create()
const execution = await sandbox.runCode(`
  import matplotlib.pyplot as plt
  plt.plot([1, 2, 3])
`)

// Include results in conversation
conversationHistory.push({
  role: "assistant",
  content: `Code executed. Result: ${execution.logs}`,
})
```

### File Search → External Vector DB

**Before (Assistants):**
```typescript
const vectorStore = await openai.beta.vectorStores.create({
  name: "Support Docs",
  file_ids: [file.id],
})

const assistant = await openai.beta.assistants.create({
  tools: [{ type: "file_search" }],
  tool_resources: {
    file_search: { vector_store_ids: [vectorStore.id] },
  },
})
```

**After (Responses + Pinecone):**
```typescript
import { PineconeClient } from '@pinecone-database/pinecone'

// Index documents in Pinecone
const pinecone = new PineconeClient()
await pinecone.init({ apiKey: process.env.PINECONE_API_KEY })
const index = pinecone.Index('support-docs')

// Search
const queryEmbedding = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: userQuery,
})

const searchResults = await index.query({
  vector: queryEmbedding.data[0].embedding,
  topK: 3,
})

// Add context to conversation
conversationHistory.push({
  role: "system",
  content: `Relevant docs: ${searchResults.matches.map(m => m.metadata.text).join('\n')}`,
})

// Then call chat completions
const response = await openai.chat.completions.create({
  model: "gpt-4-1106-preview",
  messages: conversationHistory,
})
```

### Function Calling (Unchanged)

**Good news:** Function calling API is the same!

```typescript
// Works with both Assistants and Responses API
const tools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
        },
        required: ["location"],
      },
    },
  },
]

const response = await openai.chat.completions.create({
  model: "gpt-4-1106-preview",
  messages: conversationHistory,
  tools,
})

// Handle tool calls (same as Assistants API)
if (response.choices[0].message.tool_calls) {
  // Execute function and add result to conversation
}
```

---

## State Management

### Persisting Conversations

**Assistants API:**
- Server stores thread history
- You just reference `thread.id`

**Responses API:**
- You store conversation history
- Options:
  1. Database (Postgres, MongoDB)
  2. Redis (ephemeral)
  3. Client-side (localStorage)
  4. File system (for dev)

**Example: Database Storage**

```typescript
// Save conversation
await db.conversations.create({
  userId,
  messages: conversationHistory,
  updatedAt: new Date(),
})

// Load conversation
const conversation = await db.conversations.findOne({ userId })
const conversationHistory = conversation.messages

// Continue conversation
conversationHistory.push({ role: "user", content: newMessage })
const response = await openai.chat.completions.create({
  model: "gpt-4-1106-preview",
  messages: conversationHistory,
})
```

---

## Streaming

### Before (Assistants)

```typescript
const stream = openai.beta.threads.runs.stream(thread.id, {
  assistant_id: assistant.id,
})

for await (const event of stream) {
  if (event.event === 'thread.message.delta') {
    process.stdout.write(event.data.delta.content[0].text.value)
  }
}
```

### After (Responses)

```typescript
const stream = await openai.chat.completions.create({
  model: "gpt-4-1106-preview",
  messages: conversationHistory,
  stream: true,
})

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content
  if (content) {
    process.stdout.write(content)
  }
}
```

---

## Migration Checklist

### Phase 1: Assessment
- [ ] Audit all Assistants API usage
- [ ] Identify required tools (Code Interpreter, File Search)
- [ ] Check vector store usage
- [ ] Review function calling implementation
- [ ] Estimate migration effort

### Phase 2: Setup Replacements
- [ ] Choose vector database (if using File Search)
- [ ] Set up code execution sandbox (if using Code Interpreter)
- [ ] Design conversation storage strategy
- [ ] Test with pilot feature

### Phase 3: Migrate Code
- [ ] Replace assistant creation with system messages
- [ ] Replace threads with conversation history arrays
- [ ] Replace runs with chat completions
- [ ] Migrate streaming code
- [ ] Migrate file uploads to new approach
- [ ] Test end-to-end

### Phase 4: Cleanup
- [ ] Remove Assistants API code
- [ ] Delete unused assistants
- [ ] Delete unused vector stores
- [ ] Update documentation
- [ ] Monitor new implementation

---

## Cost Comparison

### Assistants API
- Charged per token + tool usage
- Vector store storage fees ($0.10/GB/day)
- File storage fees

### Responses API
- Charged per token only
- No storage fees (you manage storage)
- External tool costs (E2B, Pinecone, etc.)

**Typically:** Responses API is more cost-effective for high-volume applications.

---

## Timeline Recommendations

**12-18 month deprecation window:**

- **Months 1-3**: Assessment and planning
- **Months 4-9**: Incremental migration (start with new features)
- **Months 10-15**: Migrate legacy features
- **Months 16-18**: Final cleanup and testing

**Priority Order:**
1. New features (use Responses API immediately)
2. High-traffic endpoints
3. Low-traffic features
4. Internal/admin tools

---

## Support and Resources

- **Responses API Skill**: See `../openai-responses/SKILL.md`
- **OpenAI Migration Guide**: https://platform.openai.com/docs/guides/migration
- **Responses API Docs**: https://platform.openai.com/docs/guides/responses
- **Community Forum**: https://community.openai.com/

---

## Frequently Asked Questions

**Q: Can I run both APIs during migration?**
A: Yes! Migrate incrementally and run both in parallel.

**Q: Will my assistant IDs stop working?**
A: After H1 2026 sunset, yes. Plan migration before then.

**Q: Should I migrate immediately?**
A: For existing apps, no rush. For new apps, use Responses API.

**Q: What if I need Code Interpreter?**
A: Use external sandboxes like E2B, Modal, or Replit.

**Q: What about vector stores?**
A: Migrate to Pinecone, Weaviate, Qdrant, or pgvector.

**Q: Is function calling affected?**
A: No, function calling works the same in both APIs.

---

**This migration guide is based on production experience migrating multiple Assistants API applications to Responses API.**
