# ChatReasoning Component

Display a collapsible AI reasoning or thinking process. Auto-opens during streaming and auto-closes after.

---

## Props

```ts
interface ChatReasoningProps {
  text?: string                          // Reasoning text content
  streaming?: boolean                    // Whether actively streaming (default: false)
  duration?: number                      // Reasoning duration in seconds (auto-calculated if omitted)
  icon?: any                             // Icon next to trigger
  chevron?: 'leading' | 'trailing'       // Chevron position (default: 'trailing')
  chevronIcon?: any                      // Custom chevron icon
  autoCloseDelay?: number                // Delay before auto-close after streaming ends (default: 500, 0 = disabled)
  shimmer?: Partial<ChatShimmerProps>    // Customize ChatShimmer when streaming
  open?: boolean                        // Controlled open state (v-model)
  defaultOpen?: boolean                 // Initial open state
  unmountOnHide?: boolean               // Unmount when closed (default: false)
  disabled?: boolean                    // Prevent interaction
  ui?: { root?, trigger?, leading?, leadingIcon?, chevronIcon?, label?, trailingIcon?, content?, body? }
}
```

## Events

- `@update:open` - Open state changes

## Slots

- `default` - Custom body content (overrides text prop)

## Usage

### Basic

```vue
<template>
  <UChatReasoning text="The user is asking about Vue components..." />
</template>
```

### With Streaming Detection

```vue
<script setup lang="ts">
import { isReasoningStreaming } from '@nuxt/ui/utils/ai'
import { isReasoningUIPart } from 'ai'

// Inside ChatMessages #content slot
</script>

<template>
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
</template>
```

### With Custom Icon

```vue
<template>
  <UChatReasoning
    icon="i-lucide-brain"
    chevron="leading"
    text="Analyzing your request..."
  />
</template>
```

## Theme

```ts
export default defineAppConfig({
  ui: {
    chatReasoning: {
      slots: {
        root: '',
        trigger: 'group flex w-full items-center gap-1.5 text-muted text-sm',
        leading: 'relative size-4 shrink-0',
        leadingIcon: 'size-4 shrink-0',
        chevronIcon: 'size-4 shrink-0 group-data-[state=open]:rotate-180 transition-transform duration-200',
        label: 'truncate',
        content: 'data-[state=open]:animate-[collapsible-down_200ms_ease-out] data-[state=closed]:animate-[collapsible-up_200ms_ease-out] overflow-hidden',
        body: 'max-h-[200px] pt-2 overflow-y-auto text-sm text-dimmed whitespace-pre-wrap'
      }
    }
  }
})
```

## Notes

- Body content uses `useScrollShadow` composable for fade shadows when overflowing
- When `chevron` is `leading` with `icon`, the icon swaps with chevron on hover/open
- When streaming ends, auto-closes after `autoCloseDelay` ms (default 500)
