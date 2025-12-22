# AI SDK v5 Integration

## Installation

```bash
npm install ai @ai-sdk/vue
```

## Basic Chat Interface

```vue
<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { getTextFromMessage } from '@ai-sdk/vue/utils'

const chat = new Chat({
  api: '/api/chat',
  onFinish: () => console.log('Done')
})

const messages = computed(() => chat.messages)
const isStreaming = computed(() => chat.status === 'streaming')

async function send(content: string) {
  await chat.append({ role: 'user', content })
}
</script>
```

## Key Changes from v4

- `useChat` → `Chat` class
- `messages[].content` → `messages[].parts`
- `reload()` → `chat.regenerate()`
- Use `getTextFromMessage()` utility
