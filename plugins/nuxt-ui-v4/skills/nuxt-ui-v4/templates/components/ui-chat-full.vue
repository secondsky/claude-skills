<template>
  <div class="flex flex-col h-full">
    <UChatMessages
      :messages="chat.messages"
      :status="chat.status"
      :should-auto-scroll="true"
      :user="{ variant: 'soft', side: 'right' }"
      :assistant="{ variant: 'naked', side: 'left', avatar: { src: '/ai-avatar.png', alt: 'AI' } }"
    >
      <template #content="{ message }">
        <template v-for="(part, index) in message.parts" :key="`${message.id}-${part.type}-${index}`">
          <UChatReasoning
            v-if="isReasoningUIPart(part)"
            :text="part.text"
            :streaming="isReasoningStreaming(message, index, chat)"
            icon="i-lucide-brain"
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
            variant="card"
          />

          <template v-else-if="isTextUIPart(part)">
            <MDC
              v-if="message.role === 'assistant'"
              :value="part.text"
              :cache-key="`${message.id}-${index}`"
              class="*:first:mt-0 *:last:mb-0 max-w-none"
            />
            <p v-else-if="message.role === 'user'" class="whitespace-pre-wrap">
              {{ part.text }}
            </p>
          </template>
        </template>
      </template>

      <template #actions="{ message }">
        <div v-if="message.role === 'assistant'" class="flex gap-1 mt-2">
          <UButton
            icon="i-lucide-clipboard"
            variant="ghost"
            size="xs"
            @click="copyMessage(message)"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            size="xs"
            @click="chat.regenerate()"
          />
        </div>
      </template>

      <template #indicator>
        <div class="flex items-center gap-2 text-muted">
          <UChatShimmer text="Thinking..." />
        </div>
      </template>
    </UChatMessages>

    <div class="border-t border-default p-4">
      <UChatPrompt
        v-model="input"
        placeholder="Type your message..."
        :error="chat.error"
        @submit="onSubmit"
      >
        <UChatPromptSubmit
          :status="chat.status"
          @stop="chat.stop()"
          @reload="chat.regenerate()"
        />
      </UChatPrompt>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isReasoningUIPart, isTextUIPart, isToolUIPart, getToolName } from 'ai'
import { Chat } from '@ai-sdk/vue'
import { isReasoningStreaming, isToolStreaming } from '@nuxt/ui/utils/ai'

const input = ref('')
const { add: addToast } = useToast()

const chat = new Chat({
  onError(error) {
    console.error('Chat error:', error)
  }
})

function onSubmit() {
  if (!input.value.trim()) return
  chat.sendMessage({ text: input.value })
  input.value = ''
}

async function copyMessage(message: any) {
  try {
    const textParts = message.parts
      ?.filter((p: any) => isTextUIPart(p))
      .map((p: any) => p.text)
      .join('\n') || ''
    await navigator.clipboard.writeText(textParts)
    addToast({ title: 'Copied to clipboard', color: 'success' })
  } catch {
    addToast({ title: 'Copy failed', color: 'error' })
  }
}
</script>
