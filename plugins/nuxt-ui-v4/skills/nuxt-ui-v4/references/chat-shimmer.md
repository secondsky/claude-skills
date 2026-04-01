# ChatShimmer Component

Text shimmer animation effect for streaming/loading states in chat interfaces.

---

## Props

```ts
interface ChatShimmerProps {
  text: string            // Text to display with shimmer effect (required)
  as?: any                // Element or component to render as (default: 'span')
  duration?: number       // Animation duration in seconds (default: 2)
  spread?: number         // Shimmer highlight width multiplier (default: 2)
                            // Actual spread = text.length * spread in pixels
}
```

## Usage

### Basic

```vue
<template>
  <UChatShimmer text="Thinking..." />
</template>
```

### Custom Duration

```vue
<template>
  <UChatShimmer text="Searching..." :duration="4" />
</template>
```

### Custom Spread

```vue
<template>
  <UChatShimmer text="Loading..." :spread="5" />
</template>
```

## Theme

```ts
export default defineAppConfig({
  ui: {
    chatShimmer: {
      base: 'text-transparent bg-clip-text bg-no-repeat bg-size-[calc(200%+var(--spread)*2+2px)_100%,auto] bg-[image:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--ui-text-highlighted),#0000_calc(50%+var(--spread))),linear-gradient(var(--ui-text-muted),var(--ui-text-muted))] animate-[shimmer_var(--duration)_linear_infinite] rtl:animate-[shimmer-rtl_var(--duration)_linear_infinite] will-change-[background-position]'
    }
  }
})
```

## Notes

- Automatically used by `ChatTool` and `ChatReasoning` when streaming
- RTL support included via separate animation
- Uses CSS variables `--duration` and `--spread` for runtime customization
- No slots or events - purely presentational
