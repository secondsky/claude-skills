# Chat Components Reference

Nuxt UI v4 provides 5 purpose-built components for AI chatbots, designed to work with Vercel AI SDK v5.

## Component Overview

| Component | Purpose |
|-----------|---------|
| ChatMessage | Single message display |
| ChatMessages | Message list with auto-scroll |
| ChatPalette | Chat overlay interface |
| ChatPrompt | Enhanced textarea for input |
| ChatPromptSubmit | Submit button with status |

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
    model: gateway('openai/gpt-4o-mini'),
    maxOutputTokens: 10000,
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(messages)
  }).toUIMessageStreamResponse()
})
```

### Create Chat Interface

```vue
<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { getTextFromMessage } from '@nuxt/ui/utils/ai'

const input = ref('')

const chat = new Chat({
  api: '/api/chat',
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
        <MDC :value="getTextFromMessage(message)" />
      </template>
    </UChatMessages>

    <UChatPrompt v-model="input" @submit="onSubmit">
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

### Props

Combines ChatMessages and ChatPrompt props with overlay configuration.

### Usage

```vue
<script setup>
const isOpen = ref(false)
</script>

<template>
  <UButton @click="isOpen = true">Open Chat</UButton>

  <UChatPalette v-model="isOpen" :messages="messages" :status="status">
    <template #content="{ message }">
      {{ message.content }}
    </template>
  </UChatPalette>
</template>
```

## AI SDK v5 Integration

### Chat Class Setup

```ts
import { Chat } from '@ai-sdk/vue'

const chat = new Chat({
  api: '/api/chat',
  initialMessages: [],
  onFinish(message) {
    console.log('Response complete:', message)
  },
  onError(error) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
})
```

### Available Methods

```ts
// Send message
chat.sendMessage({ text: 'Hello' })

// Stop streaming
chat.stop()

// Regenerate last response
chat.regenerate()

// Clear messages
chat.setMessages([])

// Access state
chat.messages  // Message array
chat.status    // Current status
chat.error     // Error if any
```

### Message Parts

AI SDK v5 uses message parts for rich content:

```ts
import { getTextFromMessage } from '@nuxt/ui/utils/ai'

// Extract text from message parts
const text = getTextFromMessage(message)

// Message structure
interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  parts: MessagePart[]
}

type MessagePart =
  | { type: 'text', text: string }
  | { type: 'image', image: string }
  | { type: 'tool-call', toolName: string, args: object }
```

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

### Chat with Markdown Rendering

```vue
<UChatMessages :messages="messages" :status="status">
  <template #content="{ message }">
    <MDC
      :value="getTextFromMessage(message)"
      :cache-key="message.id"
      class="prose prose-sm dark:prose-invert"
    />
  </template>
</UChatMessages>
```

### Chat with Tool Calls

```vue
<template #content="{ message }">
  <template v-for="part in message.parts">
    <div v-if="part.type === 'text'">{{ part.text }}</div>
    <ToolResult v-else-if="part.type === 'tool-call'" :tool="part" />
  </template>
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
