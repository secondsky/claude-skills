<template>
  <div class="flex flex-col h-screen max-w-4xl mx-auto">
    <!-- Header -->
    <UCard class="rounded-b-none">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UAvatar
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
            alt="AI Assistant"
          />
          <div>
            <h2 class="font-semibold">AI Assistant</h2>
            <p class="text-sm text-dimmed flex items-center gap-2">
              <span :class="isStreaming ? 'text-success' : 'text-dimmed'">
                {{ isStreaming ? '● Typing...' : 'Online' }}
              </span>
            </p>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            variant="ghost"
            icon="i-heroicons-trash"
            @click="clearChat"
            :disabled="messages.length === 0"
          >
            Clear
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Messages Area -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-default">
      <!-- Welcome Message -->
      <div v-if="messages.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-chat-bubble-left-right" class="w-16 h-16 mx-auto mb-4 text-dimmed opacity-50" />
        <h3 class="text-lg font-semibold mb-2">Start a conversation</h3>
        <p class="text-dimmed">Ask me anything!</p>
      </div>

      <!-- Messages -->
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="[
          'flex gap-3',
          message.role === 'user' ? 'justify-end' : 'justify-start'
        ]"
      >
        <!-- AI Avatar (left) -->
        <UAvatar
          v-if="message.role === 'assistant'"
          src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          alt="AI"
          size="sm"
        />

        <!-- Message Bubble -->
        <div
          :class="[
            'max-w-[70%] rounded-lg p-4',
            message.role === 'user'
              ? 'bg-primary text-white'
              : 'bg-elevated border border-default'
          ]"
        >
          <div class="prose prose-sm max-w-none" :class="message.role === 'user' ? 'prose-invert' : ''">
            {{ getMessageText(message) }}
          </div>

          <!-- Message Actions -->
          <div v-if="message.role === 'assistant'" class="flex gap-2 mt-2 pt-2 border-t border-default">
            <UButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-clipboard"
              @click="copyMessage(message)"
            >
              Copy
            </UButton>
            <UButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-hand-thumb-up"
              @click="rateMessage(message, 'up')"
            >
              Helpful
            </UButton>
          </div>
        </div>

        <!-- User Avatar (right) -->
        <UAvatar
          v-if="message.role === 'user'"
          src="https://i.pravatar.cc/150?img=8"
          alt="You"
          size="sm"
        />
      </div>

      <!-- Streaming Indicator -->
      <div v-if="isStreaming" class="flex gap-3">
        <UAvatar
          src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
          alt="AI"
          size="sm"
        />
        <div class="bg-elevated border border-default rounded-lg p-4">
          <div class="flex gap-1">
            <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0ms" />
            <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 150ms" />
            <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 300ms" />
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <UCard class="rounded-t-none border-t">
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <UTextarea
          v-model="input"
          placeholder="Type your message..."
          :rows="1"
          :disabled="isStreaming"
          class="flex-1"
          @keydown.enter.exact.prevent="sendMessage"
        />

        <UButton
          type="submit"
          :disabled="!input.trim() || isStreaming"
          :loading="isStreaming"
          icon="i-heroicons-paper-airplane"
          size="lg"
        >
          Send
        </UButton>
      </form>

      <!-- Quick Actions -->
      <div class="flex gap-2 mt-3">
        <UButton
          v-for="prompt in quickPrompts"
          :key="prompt"
          variant="outline"
          size="xs"
          @click="useQuickPrompt(prompt)"
          :disabled="isStreaming"
        >
          {{ prompt }}
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Note: This example uses AI SDK v5 patterns
// You'll need to install: npm install ai @ai-sdk/vue

// For this example, we'll simulate AI responses
// In production, integrate with actual AI SDK v5

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// State
const messages = ref<Message[]>([])
const input = ref('')
const isStreaming = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

// Quick prompts
const quickPrompts = [
  'What can you help me with?',
  'Explain Nuxt UI',
  'Show me examples'
]

// Get message text (handles both string and parts format)
function getMessageText(message: Message): string {
  if (typeof message.content === 'string') {
    return message.content
  }
  // Handle AI SDK v5 parts format
  return message.content
}

// Send message
async function sendMessage() {
  if (!input.value.trim() || isStreaming.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: input.value,
    timestamp: new Date()
  }

  messages.value.push(userMessage)

  const userInput = input.value
  input.value = ''

  // Scroll to bottom
  await nextTick()
  scrollToBottom()

  // Simulate AI response
  await simulateAIResponse(userInput)
}

// Simulate AI response (replace with actual AI SDK v5 integration)
async function simulateAIResponse(userInput: string) {
  isStreaming.value = true

  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  const aiMessage: Message = {
    id: Date.now().toString(),
    role: 'assistant',
    content: `I received your message: "${userInput}". This is a simulated response. In production, integrate with AI SDK v5 using the Chat class for streaming responses.`,
    timestamp: new Date()
  }

  messages.value.push(aiMessage)
  isStreaming.value = false

  // Scroll to bottom
  await nextTick()
  scrollToBottom()
}

// Use quick prompt
function useQuickPrompt(prompt: string) {
  input.value = prompt
  sendMessage()
}

// Copy message
async function copyMessage(message: Message) {
  try {
    await navigator.clipboard.writeText(getMessageText(message))

    const { add: addToast } = useToast()
    addToast({
      title: 'Copied',
      description: 'Message copied to clipboard',
      icon: 'i-heroicons-clipboard-document-check',
      timeout: 2000
    })
  } catch (error) {
    console.error('Copy failed:', error)
  }
}

// Rate message
function rateMessage(message: Message, rating: 'up' | 'down') {
  console.log('Rated message:', message.id, rating)

  const { add: addToast } = useToast()
  addToast({
    title: 'Thank you!',
    description: 'Your feedback helps improve responses',
    icon: 'i-heroicons-hand-thumb-up',
    timeout: 2000
  })
}

// Clear chat
function clearChat() {
  messages.value = []

  const { add: addToast } = useToast()
  addToast({
    title: 'Chat cleared',
    description: 'All messages have been removed',
    timeout: 2000
  })
}

// Scroll to bottom
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Production AI SDK v5 Integration Example:
/*
import { Chat } from '@ai-sdk/vue'
import { getTextFromMessage } from '@ai-sdk/vue/utils'

const chat = new Chat({
  api: '/api/chat',
  onFinish: () => {
    isStreaming.value = false
    scrollToBottom()
  }
})

const messages = computed(() => chat.messages)
const isStreaming = computed(() => chat.status === 'streaming')

async function sendMessage() {
  if (!input.value.trim()) return

  await chat.append({
    role: 'user',
    content: input.value
  })

  input.value = ''
  scrollToBottom()
}
*/
</script>

<style scoped>
/* Custom scrollbar */
:deep(.overflow-y-auto) {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

:deep(.overflow-y-auto::-webkit-scrollbar) {
  width: 6px;
}

:deep(.overflow-y-auto::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.overflow-y-auto::-webkit-scrollbar-thumb) {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}
</style>
