# AI SDK v5 Integration

Complete guide for integrating Vercel AI SDK v5 with Nuxt UI v4 Chat components.

---

## Installation

```bash
bun add ai @ai-sdk/vue @ai-sdk/gateway
```

**Additional providers** (optional, use instead of gateway):
```bash
bun add @ai-sdk/openai     # OpenAI
bun add @ai-sdk/anthropic  # Anthropic
bun add @ai-sdk/google     # Google
```

---

## Server Setup

### Basic Endpoint

```ts
// server/api/chat.post.ts
import { streamText, convertToModelMessages } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  return streamText({
    model: gateway('anthropic/claude-sonnet-4.6'),
    maxOutputTokens: 10000,
    system: 'You are a helpful assistant.',
    messages: await convertToModelMessages(messages)
  }).toUIMessageStreamResponse()
})
```

### With Reasoning Support

```ts
import { streamText, convertToModelMessages } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  return streamText({
    model: gateway('anthropic/claude-sonnet-4.6'),
    maxOutputTokens: 10000,
    system: 'You are a helpful assistant.',
    messages: await convertToModelMessages(messages),
    providerOptions: {
      anthropic: {
        thinking: { type: 'adaptive' },
        effort: 'low'
      },
      google: {
        thinkingConfig: { includeThoughts: true, thinkingLevel: 'low' }
      },
      openai: {
        reasoningEffort: 'low',
        reasoningSummary: 'detailed'
      }
    }
  }).toUIMessageStreamResponse()
})
```

### With Web Search

```ts
import { anthropic } from '@ai-sdk/anthropic'

return streamText({
  model: gateway('anthropic/claude-sonnet-4.6'),
  messages: await convertToModelMessages(messages),
  tools: {
    web_search: anthropic.tools.webSearch_20250305({})
  }
}).toUIMessageStreamResponse()
```

### With MCP Tool Calling

```ts
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { experimental_createMCPClient } from '@ai-sdk/mcp'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  const httpClient = await experimental_createMCPClient({
    transport: new StreamableHTTPClientTransport(new URL('https://your-app.com/mcp'))
  })
  const tools = await httpClient.tools()

  return streamText({
    model: gateway('anthropic/claude-sonnet-4.6'),
    maxOutputTokens: 10000,
    system: 'You are a helpful assistant.',
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(6),
    tools,
    onFinish: async () => { await httpClient.close() },
    onError: async (error) => { console.error(error); await httpClient.close() }
  }).toUIMessageStreamResponse()
})
```

---

## Client Setup

### Chat Class (replaces useChat)

```vue
<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'

const chat = new Chat({
  onError(error) {
    console.error(error)
  }
})
</script>
```

### Chat Methods

```ts
chat.sendMessage({ text: 'Hello' })  // Send message
chat.stop()                           // Stop streaming
chat.regenerate()                     // Regenerate last response
chat.setMessages([])                  // Replace messages

chat.messages  // UIMessage[] - reactive
chat.status    // 'submitted' | 'streaming' | 'ready' | 'error'
chat.error     // Error | undefined
```

---

## Parts-Based Rendering

AI SDK v5 uses `message.parts` instead of `message.content`. Each part has a `type` field.

### Import Helpers

```ts
// From 'ai' package
import {
  isReasoningUIPart,   // Check if part is reasoning content
  isTextUIPart,        // Check if part is text content
  isToolUIPart,        // Check if part is tool invocation
  getToolName          // Extract tool name from tool part
} from 'ai'

// From '@nuxt/ui/utils/ai'
import {
  isReasoningStreaming,  // Check if reasoning part is currently streaming
  isToolStreaming,       // Check if tool part is still running
  getTextFromMessage     // Extract all text from message parts
} from '@nuxt/ui/utils/ai'
```

### Full Rendering Pattern

```vue
<template>
  <UChatMessages :messages="chat.messages" :status="chat.status">
    <template #content="{ message }">
      <template v-for="(part, index) in message.parts" :key="`${message.id}-${part.type}-${index}`">
        <UChatReasoning
          v-if="isReasoningUIPart(part)"
          :text="part.text"
          :streaming="isReasoningStreaming(message, index, chat)"
        >
          <MDC :value="part.text" :cache-key="`reasoning-${message.id}-${index}`" />
        </UChatReasoning>

        <UChatTool
          v-else-if="isToolUIPart(part)"
          :text="getToolName(part)"
          :streaming="isToolStreaming(part)"
        />

        <template v-else-if="isTextUIPart(part)">
          <MDC
            v-if="message.role === 'assistant'"
            :value="part.text"
            :cache-key="`${message.id}-${index}`"
            class="*:first:mt-0 *:last:mb-0"
          />
          <p v-else-if="message.role === 'user'" class="whitespace-pre-wrap">
            {{ part.text }}
          </p>
        </template>
      </template>
    </template>
  </UChatMessages>

  <UChatPrompt v-model="input" :error="chat.error" @submit="onSubmit">
    <UChatPromptSubmit
      :status="chat.status"
      @stop="chat.stop()"
      @reload="chat.regenerate()"
    />
  </UChatPrompt>
</template>
```

---

## Migration from AI SDK v4

### useChat → Chat Class

```diff
- import { useChat } from '@ai-sdk/vue'
+ import { Chat } from '@ai-sdk/vue'

- const { messages, input, handleSubmit, status, error, reload, setMessages } = useChat()
+ const input = ref('')
+ const chat = new Chat({ onError(error) { console.error(error) } })
```

### content → parts

```diff
- setMessages([{ id: '1', role: 'user', content: 'Hello' }])
+ // Messages now use parts instead of content
+ // Handled automatically by Chat class
```

### Method Renames

```diff
- reload()
+ chat.regenerate()

- :messages="messages"
- :status="status"
+ :messages="chat.messages"
+ :status="chat.status"
```

---

## Official Templates

Nuxt UI provides production-ready chat templates:
- **Nuxt**: https://github.com/nuxt-ui-templates/chat
- **Vue**: https://github.com/nuxt-ui-templates/chat-vue

```bash
npm create nuxt@latest -- -t ui/chat
```
