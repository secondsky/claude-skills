# ChatTool Component

Display a collapsible AI tool invocation status. Shows tool name, loading state, and optional output.

---

## Props

```ts
interface ChatToolProps {
  text?: string                          // Tool status text (e.g., "Searching components")
  suffix?: string                        // Secondary text after label (e.g., "Button")
  icon?: any                             // Icon next to trigger
  loading?: boolean                      // Show loading indicator (default: false)
  loadingIcon?: any                      // Custom loading icon (default: i-lucide-loader-circle)
  streaming?: boolean                    // Whether tool is actively running (default: false)
  variant?: 'inline' | 'card'           // Visual variant (default: 'inline')
  chevron?: 'leading' | 'trailing'       // Chevron position (default: 'trailing')
  chevronIcon?: any                      // Custom chevron icon
  shimmer?: Partial<ChatShimmerProps>    // Customize ChatShimmer when streaming
  open?: boolean                        // Controlled open state (v-model)
  defaultOpen?: boolean                 // Initial open state
  unmountOnHide?: boolean               // Unmount when closed (default: false)
  disabled?: boolean                    // Prevent interaction
  ui?: { root?, trigger?, leading?, leadingIcon?, chevronIcon?, label?, suffix?, trailingIcon?, content?, body? }
}
```

## Events

- `@update:open` - Open state changes

## Slots

- `default` - Tool output content (makes it collapsible)

## Usage

### Basic

```vue
<template>
  <UChatTool text="Searched components" />
</template>
```

### With Tool Detection

```vue
<script setup lang="ts">
import { isToolUIPart, getToolName } from 'ai'
import { isToolStreaming } from '@nuxt/ui/utils/ai'
</script>

<template>
  <UChatTool
    v-if="isToolUIPart(part)"
    :text="getToolName(part)"
    :streaming="isToolStreaming(part)"
  />
</template>
```

### Card Variant with Output

```vue
<template>
  <UChatTool
    text="Running lint checks"
    suffix="cd, pnpm run"
    :streaming="streaming"
    icon="i-lucide-terminal"
    variant="card"
    chevron="leading"
  >
    <pre language="bash" v-text="result" />
  </UChatTool>
</template>
```

### With Loading State

```vue
<template>
  <UChatTool loading text="Searching components..." />
</template>
```

## Variants

| Variant | Description |
|---------|-------------|
| `inline` | Default inline style, blends with message text |
| `card` | Card style with border, padding, and scrollable output area |

## Theme

```ts
export default defineAppConfig({
  ui: {
    chatTool: {
      slots: {
        root: '',
        trigger: 'group flex w-full items-center gap-1.5 text-muted text-sm',
        leading: 'relative size-4 shrink-0',
        leadingIcon: 'size-4 shrink-0',
        label: 'truncate',
        suffix: 'text-dimmed ms-1',
        body: 'text-sm text-dimmed whitespace-pre-wrap'
      },
      variants: {
        variant: {
          inline: { body: 'pt-2' },
          card: {
            root: 'rounded-md ring ring-default overflow-hidden',
            trigger: 'px-2 py-1',
            body: 'border-t border-default p-2 max-h-[200px] overflow-y-auto'
          }
        },
        loading: {
          true: { leadingIcon: 'animate-spin' }
        }
      },
      defaultVariants: { variant: 'inline' }
    }
  }
})
```

## Notes

- Without a default slot, renders as a simple inline status (non-collapsible)
- With a default slot, becomes collapsible to show/hide tool output
- Streaming state shows a `ChatShimmer` animation on the label text
- Loading state spins the leading icon
