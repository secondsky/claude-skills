<template>
  <div class="flex flex-col h-full">
    <!-- Messages -->
    <UChatMessages
      :messages="chat.messages"
      :status="chat.status"
      :should-auto-scroll="true"
      :user="{
        variant: 'soft',
        side: 'right'
      }"
      :assistant="{
        variant: 'naked',
        side: 'left',
        avatar: { src: '/ai-avatar.png', alt: 'AI' }
      }"
    >
      <!-- Custom content rendering with MDC -->
      <template #content="{ message }">
        <MDC
          :value="getTextFromMessage(message)"
          :cache-key="message.id"
          class="prose prose-sm dark:prose-invert max-w-none"
        />
      </template>

      <!-- Message actions -->
      <template #actions="{ message }">
        <div v-if="message.role === 'assistant'" class="flex gap-1 mt-2">
          <UButton
            icon="i-heroicons-clipboard"
            variant="ghost"
            size="xs"
            @click="copyMessage(message)"
          />
          <UButton
            icon="i-heroicons-arrow-path"
            variant="ghost"
            size="xs"
            @click="chat.regenerate()"
          />
        </div>
      </template>

      <!-- Custom loading indicator -->
      <template #indicator>
        <div class="flex items-center gap-2 text-muted">
          <UIcon name="i-heroicons-sparkles" class="animate-pulse" />
          <span>Thinking...</span>
        </div>
      </template>
    </UChatMessages>

    <!-- Prompt Input -->
    <div class="border-t border-default p-4">
      <UChatPrompt
        v-model="input"
        placeholder="Type your message..."
        :disabled="chat.status === 'streaming'"
        @submit="onSubmit"
      >
        <template #leading>
          <UButton
            icon="i-heroicons-paper-clip"
            variant="ghost"
            color="neutral"
            @click="attachFile"
          />
        </template>

        <UChatPromptSubmit
          :status="chat.status"
          @stop="chat.stop()"
          @reload="chat.regenerate()"
        />
      </UChatPrompt>

      <!-- Error display -->
      <UAlert
        v-if="chat.error"
        color="error"
        class="mt-2"
        :title="chat.error.message"
        :close-button="{ click: () => chat.regenerate() }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { getTextFromMessage } from '@nuxt/ui/utils/ai'

const input = ref('')
const { add: addToast } = useToast()

// Initialize chat
const chat = new Chat({
  api: '/api/chat',
  onFinish(message) {
    console.log('Response complete:', message)
  },
  onError(error) {
    console.error('Chat error:', error)
    // Error is displayed via UAlert component in template
  }
})

// Submit message
function onSubmit() {
  if (!input.value.trim()) return

  chat.sendMessage({ text: input.value })
  input.value = ''
}

// Copy message to clipboard
async function copyMessage(message: { id: string; text: string; role: string }) {
  try {
    const text = getTextFromMessage(message)
    await navigator.clipboard.writeText(text)
    addToast({
      title: 'Copied to clipboard',
      color: 'success'
    })
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    addToast({
      title: 'Copy failed',
      description: 'Unable to copy message to clipboard',
      color: 'error'
    })
  }
}

// File attachment (placeholder)
function attachFile() {
  // Implement file attachment logic
}
</script>
