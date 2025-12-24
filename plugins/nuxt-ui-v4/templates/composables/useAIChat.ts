// useAIChat.ts
// Composable for AI SDK v5 integration with Nuxt UI

// Note: Install dependencies first:
// npm install ai @ai-sdk/vue

import type { Message } from 'ai'

export const useAIChat = (apiEndpoint: string = '/api/chat') => {
  // State
  const messages = ref<Message[]>([])
  const input = ref('')
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Send a message to the AI
   */
  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content
    }

    messages.value.push(userMessage)
    input.value = ''
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch(apiEndpoint, {
        method: 'POST',
        body: {
          messages: messages.value
        }
      })

      if (response && typeof response === 'object' && 'content' in response) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: (response as any).content
        }
        messages.value.push(aiMessage)
      }
    } catch (err: any) {
      error.value = err
      console.error('AI Chat error:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear all messages
   */
  const clearMessages = () => {
    messages.value = []
    error.value = null
  }

  /**
   * Regenerate last AI response
   */
  const regenerate = async () => {
    if (messages.value.length === 0) return

    // Remove last AI message
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage.role === 'assistant') {
      messages.value.pop()
    }

    // Get last user message
    const lastUserMessage = messages.value.findLast(m => m.role === 'user')
    if (lastUserMessage) {
      await sendMessage(lastUserMessage.content as string)
    }
  }

  /**
   * Get text content from message (handles both string and parts format)
   */
  const getMessageText = (message: Message): string => {
    if (typeof message.content === 'string') {
      return message.content
    }
    // Handle AI SDK v5 parts format if needed
    return String(message.content)
  }

  return {
    messages: readonly(messages),
    input,
    isLoading: readonly(isLoading),
    error: readonly(error),
    sendMessage,
    clearMessages,
    regenerate,
    getMessageText
  }
}

/*
 * Production AI SDK v5 Integration Example:
 *
 * import { Chat } from '@ai-sdk/vue'
 *
 * const chat = new Chat({
 *   api: '/api/chat',
 *   onFinish: () => {
 *     // Handle completion
 *   },
 *   onError: (error) => {
 *     // Handle error
 *   }
 * })
 *
 * const messages = computed(() => chat.messages)
 * const isStreaming = computed(() => chat.status === 'streaming')
 *
 * async function send(message: string) {
 *   await chat.append({
 *     role: 'user',
 *     content: message
 *   })
 * }
 */
