# Chat Components Reference

Nuxt UI v4 provides 8 purpose-built components for AI chatbots, designed to work with Vercel AI SDK v5.

## Component Overview

| Component | Purpose |
|-----------|---------|
| ChatMessages | Scrollable message list with auto-scroll and loading indicator |
| ChatMessage | Individual message bubble with avatar, actions, and slots |
| ChatPrompt | Enhanced textarea for submitting prompts |
| ChatPromptSubmit | Submit button with automatic status handling |
| ChatReasoning | Collapsible AI reasoning/thinking process |
| ChatTool | Collapsible AI tool invocation status |
| ChatShimmer | Text shimmer animation for streaming states |
| ChatPalette | Layout wrapper for embedding chat in overlays |

## Quick Start

### Install Dependencies

```bash
bun add ai @ai-sdk/vue @ai-sdk/gateway
```

### Create API Endpoint

```ts
// server/api/chat.post.ts
import { streamText, convertToModelMessages } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  return streamText({
    model: gateway('anthropic/claude-sonnet-4-6'),
    maxOutputTokens: 10000,
    system: 'You are a helpful assistant.',
    messages: await convertToModelMessages(messages)
  }).toUIMessageStreamResponse()
})
```

### Reasoning Support

```ts
// server/api/chat.post.ts - with reasoning
return streamText({
  model: gateway('anthropic/claude-sonnet-4.6'),
  maxOutputTokens: 10000,
  system: 'You are a helpful assistant.',
  messages: await convertToModelMessages(messages),
  providerOptions: {
    anthropic: {
      thinking: { type: 'adaptive' },
      effort: 'low'
    }
  }
}).toUIMessageStreamResponse()
```

### MCP Tool Calling

```ts
// server/api/chat.post.ts - with MCP tools
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { experimental_createMCPClient } from '@ai-sdk/mcp'
import { stepCountIs } from 'ai'

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)

  const httpClient = await experimental_createMCPClient({
    transport: new StreamableHTTPClientTransport(new URL('https://your-app.com/mcp'))
  })
  const tools = await httpClient.tools()

  return streamText({
    model: gateway('anthropic/claude-sonnet-4-6'),
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

### Create Chat Interface

```vue
<script setup lang="ts">
import { isReasoningUIPart, isTextUIPart, isToolUIPart, getToolName } from 'ai'
import { Chat } from '@ai-sdk/vue'
import { isReasoningStreaming, isToolStreaming } from '@nuxt/ui/utils/ai'

const input = ref('')

const chat = new Chat({
  onError(error) {
    console.error(error)
  }
})

function onSubmit() {
  chat.sendMessage({ text: input.value })
  input.value = ''
}
</script>

<template>
  <div class="flex flex-col h-full">
    <UChatMessages :messages="chat.messages" :status="chat.status">
      <template #content="{ message }">
        <template v-for="(part, index) in message.parts" :key="`${message.id}-${part.type}-${index}`">
          <UChatReasoning
            v-if="isReasoningUIPart(part)"
            :text="part.text"
            :streaming="isReasoningStreaming(message, index, chat)"
          >
            <MDC
              :value="part.text"
              :cache-key="`reasoning-${message.id}-${index}`"
              class="*:first:mt-0 *:last:mb-0"
            />
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
  </div>
</template>
```

## ChatMessages

Displays a list of messages with auto-scroll and status indicator.

### Props

```ts
interface ChatMessagesProps {
  messages?: UIMessage[]       // Message array from AI SDK
  status?: ChatStatus          // 'submitted' | 'streaming' | 'ready' | 'error'
  shouldAutoScroll?: boolean   // Auto-scroll on stream (default: false)
  shouldScrollToBottom?: boolean // Scroll on mount (default: true)
  autoScroll?: boolean | ButtonProps // Auto-scroll button config
  autoScrollIcon?: string      // Icon for scroll button
  user?: Partial<ChatMessageProps>      // User message defaults
  assistant?: Partial<ChatMessageProps> // Assistant message defaults
  compact?: boolean            // Compact mode
  spacingOffset?: number       // Offset for sticky prompt
}
```

### Status Values

- `submitted` - Message sent, awaiting response
- `streaming` - Response actively streaming
- `ready` - Ready for new message
- `error` - Error occurred

### Slots

- `default` - Custom message rendering
- `leading` - Before message content
- `content` - Message content
- `actions` - Message actions
- `indicator` - Loading indicator
- `viewport` - Auto-scroll area

### Usage

```vue
<UChatMessages
  :messages="chat.messages"
  :status="chat.status"
  :should-auto-scroll="true"
  :user="{ variant: 'soft', side: 'right' }"
  :assistant="{ variant: 'naked', side: 'left', avatar: { src: '/ai.png' } }"
>
  <template #content="{ message }">
    <MDC :value="getTextFromMessage(message)" />
  </template>

  <template #indicator>
    <UButton loading label="Thinking..." variant="link" />
  </template>
</UChatMessages>
```

## ChatMessage

Single message display with avatar, icon, and actions.

### Props

```ts
interface ChatMessageProps {
  side?: 'left' | 'right'     // Message alignment
  variant?: 'solid' | 'soft' | 'subtle' | 'naked'
  icon?: string               // Message icon
  avatar?: AvatarProps        // Avatar props
  actions?: DropdownMenuItem[] // Action menu items
}
```

### Slots

- `leading` - Before content (avatar/icon)
- `default` - Message content
- `trailing` - After content (actions)

### Usage

```vue
<UChatMessage
  side="left"
  variant="naked"
  :avatar="{ src: '/ai-avatar.png' }"
  :actions="[
    { label: 'Copy', icon: 'i-heroicons-clipboard' },
    { label: 'Regenerate', icon: 'i-heroicons-arrow-path' }
  ]"
>
  Hello! How can I help you today?
</UChatMessage>
```

## ChatPrompt

Enhanced textarea for chat input with submit handling.

### Props

```ts
interface ChatPromptProps {
  modelValue?: string         // v-model binding
  placeholder?: string        // Placeholder text
  disabled?: boolean          // Disable input
  loading?: boolean           // Show loading state
  autofocus?: boolean         // Focus on mount
  autoresize?: boolean        // Auto-resize height
  maxRows?: number            // Max rows when autoresizing
}
```

### Events

- `@update:modelValue` - Input change
- `@submit` - Form submission (Enter or button)

### Slots

- `leading` - Before textarea
- `default` - Submit button area
- `trailing` - After textarea

### Usage

```vue
<UChatPrompt
  v-model="input"
  placeholder="Type a message..."
  :disabled="chat.status === 'streaming'"
  @submit="sendMessage"
>
  <template #leading>
    <UButton icon="i-heroicons-paper-clip" variant="ghost" />
  </template>

  <UChatPromptSubmit :status="chat.status" />
</UChatPrompt>
```

## ChatPromptSubmit

Submit button with automatic status handling.

### Props

```ts
interface ChatPromptSubmitProps {
  status?: ChatStatus         // Current chat status
  submitIcon?: string         // Submit icon
  stopIcon?: string          // Stop icon
  reloadIcon?: string        // Reload icon
}
```

### Events

- `@stop` - Stop streaming
- `@reload` - Regenerate response

### Usage

```vue
<UChatPromptSubmit
  :status="chat.status"
  submit-icon="i-heroicons-paper-airplane"
  stop-icon="i-heroicons-stop"
  @stop="chat.stop()"
  @reload="chat.regenerate()"
/>
```

## ChatPalette

Chat interface inside an overlay (modal/slideover).

### Usage

```vue
<script setup>
const isOpen = ref(false)
</script>

<template>
  <UButton @click="isOpen = true">Open Chat</UButton>

  <UChatPalette v-model="isOpen">
    <!-- ChatPalette wraps ChatMessages + ChatPrompt -->
  </UChatPalette>
</template>
```

## ChatReasoning

Collapsible AI reasoning/thinking process. Auto-opens during streaming, auto-closes after.

```vue
<template>
  <UChatReasoning
    :text="part.text"
    :streaming="isReasoningStreaming(message, index, chat)"
    icon="i-lucide-brain"
  />
</template>
```

**Load `references/chat-reasoning.md`** for full props, slots, and theme.

## ChatTool

Collapsible AI tool invocation status with inline or card variant.

```vue
<template>
  <UChatTool
    :text="getToolName(part)"
    :streaming="isToolStreaming(part)"
    variant="card"
    icon="i-lucide-terminal"
  >
    <pre v-text="toolOutput" />
  </UChatTool>
</template>
```

**Load `references/chat-tool.md`** for full props, variants, and theme.

## ChatShimmer

Text shimmer animation for streaming states. Automatically used by ChatReasoning and ChatTool.

```vue
<template>
  <UChatShimmer text="Thinking..." :duration="2" :spread="2" />
</template>
```

**Load `references/chat-shimmer.md`** for full props.

## AI SDK v5 Integration

### Chat Class Setup

```ts
import { Chat } from '@ai-sdk/vue'

const chat = new Chat({
  onError(error) {
    console.error(error)
  }
})
```

### Available Methods

```ts
chat.sendMessage({ text: 'Hello' })  // Send message
chat.stop()                           // Stop streaming
chat.regenerate()                     // Regenerate last response
chat.setMessages([])                  // Clear messages

chat.messages  // UIMessage[] array
chat.status    // 'submitted' | 'streaming' | 'ready' | 'error'
chat.error     // Error if any
```

### Parts-Based Rendering

AI SDK v5 uses message parts for rich content. Import helpers from `ai` and `@nuxt/ui/utils/ai`:

```ts
import { isReasoningUIPart, isTextUIPart, isToolUIPart, getToolName } from 'ai'
import { isReasoningStreaming, isToolStreaming } from '@nuxt/ui/utils/ai'
```

```vue
<template v-for="(part, index) in message.parts" :key="`${message.id}-${part.type}-${index}`">
  <UChatReasoning v-if="isReasoningUIPart(part)" :text="part.text" :streaming="isReasoningStreaming(message, index, chat)" />
  <UChatTool v-else-if="isToolUIPart(part)" :text="getToolName(part)" :streaming="isToolStreaming(part)" />
  <template v-else-if="isTextUIPart(part)">
    <MDC v-if="message.role === 'assistant'" :value="part.text" />
    <p v-else class="whitespace-pre-wrap">{{ part.text }}</p>
  </template>
</template>
```

**Load `references/ai-sdk-v5-integration.md`** for complete integration guide.

## Styling

### Theming

```ts
export default defineAppConfig({
  ui: {
    chatMessages: {
      slots: {
        root: 'flex flex-col gap-1 px-2.5',
        indicator: 'h-6 flex items-center gap-1',
        autoScroll: 'rounded-full absolute bottom-0 right-1/2'
      }
    },
    chatMessage: {
      slots: {
        root: 'flex gap-3',
        content: 'flex-1'
      },
      variants: {
        side: {
          left: { root: 'flex-row' },
          right: { root: 'flex-row-reverse' }
        }
      }
    },
    chatPrompt: {
      base: 'relative flex items-end gap-2 p-2'
    }
  }
})
```

## Common Patterns

### Chat with Parts-Based Rendering (Recommended)

```vue
<script setup lang="ts">
import { isReasoningUIPart, isTextUIPart, isToolUIPart, getToolName } from 'ai'
import { isReasoningStreaming, isToolStreaming } from '@nuxt/ui/utils/ai'
</script>

<template>
  <UChatMessages :messages="chat.messages" :status="chat.status">
    <template #content="{ message }">
      <template v-for="(part, index) in message.parts" :key="`${message.id}-${part.type}-${index}`">
        <UChatReasoning v-if="isReasoningUIPart(part)" :text="part.text" :streaming="isReasoningStreaming(message, index, chat)" />
        <UChatTool v-else-if="isToolUIPart(part)" :text="getToolName(part)" :streaming="isToolStreaming(part)" />
        <template v-else-if="isTextUIPart(part)">
          <MDC v-if="message.role === 'assistant'" :value="part.text" :cache-key="`${message.id}-${index}`" />
          <p v-else-if="message.role === 'user'" class="whitespace-pre-wrap">{{ part.text }}</p>
        </template>
      </template>
    </template>
  </UChatMessages>
</template>
```

### Chat in Dashboard

```vue
<UDashboardPanel>
  <template #body>
    <UContainer>
      <UChatMessages :messages="chat.messages" :status="chat.status" />
    </UContainer>
  </template>

  <template #footer>
    <UContainer class="pb-4">
      <UChatPrompt v-model="input" @submit="onSubmit">
        <UChatPromptSubmit :status="chat.status" />
      </UChatPrompt>
    </UContainer>
  </template>
</UDashboardPanel>
```
