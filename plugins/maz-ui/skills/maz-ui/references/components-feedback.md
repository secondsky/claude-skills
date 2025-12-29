# Maz-UI Feedback & Animation Components Reference

Comprehensive guide to all Maz-UI feedback and animation components for creating engaging user experiences.

## Overview

Maz-UI provides **8 powerful feedback and animation components** for visual feedback, loading states, and interactive animations:

**Loading Indicators** (4 components):
- `MazFullscreenLoader` - Full-screen loading overlay
- `MazLoadingBar` - Horizontal progress bar
- `MazCircularProgressBar` - Circular progress indicator
- `MazReadingProgressBar` - Reading progress indicator

**Animations** (4 components):
- `MazAnimatedText` - Animated text effects
- `MazAnimatedElement` - Element animations on scroll/mount
- `MazAnimatedCounter` - Number counter animation
- `MazCardSpotlight` - Interactive spotlight effect on cards

**Key Features**:
- ✅ **Customizable** - Color, size, duration controls
- ✅ **Responsive** - Adapts to all screen sizes
- ✅ **Smooth Animations** - CSS-based for optimal performance
- ✅ **Accessible** - ARIA attributes and semantic HTML
- ✅ **SSR Compatible** - Works with Nuxt 3 server-side rendering

---

## MazFullscreenLoader

Full-screen loading overlay with customizable content and backdrop.

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import MazFullscreenLoader from 'maz-ui/components/MazFullscreenLoader'

const isLoading = ref(false)

async function loadData() {
  isLoading.value = true
  try {
    await fetchData()
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <MazFullscreenLoader v-if="isLoading">
    <p class="text-lg">Loading data...</p>
  </MazFullscreenLoader>

  <MazBtn @click="loadData">Load Data</MazBtn>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `color` | `string` | Backdrop color | `'rgba(0,0,0,0.5)'` |
| `blur` | `boolean` | Enable backdrop blur | `false` |
| `zIndex` | `number` | Z-index value | `9999` |

### Slots

| Slot | Description |
|------|-------------|
| `default` | Custom loader content (spinner, text, etc.) |

### Examples

**With Custom Spinner**:
```vue
<template>
  <MazFullscreenLoader v-if="isLoading">
    <MazSpinner size="lg" color="primary" />
    <p class="mt-4 text-white">Please wait...</p>
  </MazFullscreenLoader>
</template>
```

**With Blur Effect**:
```vue
<template>
  <MazFullscreenLoader v-if="isProcessing" blur>
    <div class="text-center">
      <MazCircularProgressBar :percentage="progress" />
      <p class="mt-2">Processing: {{ progress }}%</p>
    </div>
  </MazFullscreenLoader>
</template>
```

**Click to Dismiss**:
```vue
<script setup>
const showLoader = ref(true)
</script>

<template>
  <MazFullscreenLoader
    v-if="showLoader"
    @click="showLoader = false"
  >
    <p>Click anywhere to close</p>
  </MazFullscreenLoader>
</template>
```

---

## MazLoadingBar

Horizontal progress bar for page loading or task progress.

### Basic Usage

```vue
<script setup>
import MazLoadingBar from 'maz-ui/components/MazLoadingBar'
</script>

<template>
  <MazLoadingBar color="primary" />
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'destructive'` | Bar color | `'primary'` |
| `height` | `string` | Bar height (px, em, rem) | `'4px'` |
| `position` | `'top' \| 'bottom'` | Bar position | `'top'` |
| `speed` | `number` | Animation speed (ms) | `300` |

### Examples

**Page Loading Indicator**:
```vue
<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const isLoading = ref(false)

router.beforeEach(() => {
  isLoading.value = true
})

router.afterEach(() => {
  isLoading.value = false
})
</script>

<template>
  <MazLoadingBar v-if="isLoading" color="success" position="top" />
</template>
```

**Custom Styling**:
```vue
<template>
  <MazLoadingBar
    color="warning"
    height="8px"
    position="bottom"
    :speed="500"
  />
</template>
```

---

## MazCircularProgressBar

Circular progress indicator with percentage display and animations.

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import MazCircularProgressBar from 'maz-ui/components/MazCircularProgressBar'

const percentage = ref(75)
</script>

<template>
  <MazCircularProgressBar
    :percentage="percentage"
    suffix="%"
  />
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `percentage` | `number` | Progress percentage (0-100) | `0` |
| `size` | `string` | Component size (px, em, rem) | `'10rem'` |
| `color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'destructive'` | Progress color | `'primary'` |
| `autoColor` | `boolean` | Auto color based on percentage | `false` |
| `duration` | `number` | Animation duration (ms) | `1000` |
| `suffix` | `string` | Suffix text (e.g., '%') | `''` |
| `prefix` | `string` | Prefix text (e.g., '$') | `''` |

### Auto-Color Behavior

When `autoColor` is enabled:
- **0-49%** → `destructive` (red)
- **50-99%** → `warning` (orange)
- **100%** → `success` (green)

### Examples

**Different Sizes**:
```vue
<template>
  <div class="flex gap-4">
    <MazCircularProgressBar :percentage="75" size="3em" />
    <MazCircularProgressBar :percentage="75" size="100px" />
    <MazCircularProgressBar :percentage="75" size="10rem" />
    <MazCircularProgressBar :percentage="75" size="15rem" />
  </div>
</template>
```

**Custom Duration**:
```vue
<template>
  <!-- Slow animation over 5 seconds -->
  <MazCircularProgressBar
    :percentage="100"
    :duration="5000"
  />
</template>
```

**Different Colors**:
```vue
<template>
  <div class="flex gap-4">
    <MazCircularProgressBar :percentage="75" color="primary" />
    <MazCircularProgressBar :percentage="75" color="secondary" />
    <MazCircularProgressBar :percentage="75" color="success" />
    <MazCircularProgressBar :percentage="75" color="warning" />
    <MazCircularProgressBar :percentage="75" color="destructive" />
  </div>
</template>
```

**Auto-Color Mode**:
```vue
<template>
  <div class="flex gap-4">
    <MazCircularProgressBar :percentage="0" auto-color />   <!-- Red -->
    <MazCircularProgressBar :percentage="25" auto-color />  <!-- Red -->
    <MazCircularProgressBar :percentage="50" auto-color />  <!-- Orange -->
    <MazCircularProgressBar :percentage="100" auto-color /> <!-- Green -->
  </div>
</template>
```

**Custom Slot Content**:
```vue
<template>
  <MazCircularProgressBar :percentage="50">
    2/4
  </MazCircularProgressBar>

  <MazCircularProgressBar :percentage="75">
    <MazIcon name="check" />
  </MazCircularProgressBar>
</template>
```

---

## MazReadingProgressBar

Reading progress indicator for articles and long-form content.

### Basic Usage

```vue
<script setup>
import MazReadingProgressBar from 'maz-ui/components/MazReadingProgressBar'
</script>

<template>
  <MazReadingProgressBar color="primary" position="top" />

  <article>
    <!-- Long article content -->
  </article>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'destructive'` | Bar color | `'primary'` |
| `height` | `string` | Bar height | `'4px'` |
| `position` | `'top' \| 'bottom'` | Bar position | `'top'` |
| `target` | `string` | Target element selector | `'body'` |

### Examples

**Article Progress**:
```vue
<template>
  <div>
    <MazReadingProgressBar
      color="success"
      position="top"
      height="6px"
      target="#article-content"
    />

    <div id="article-content">
      <h1>Article Title</h1>
      <p>Long article content...</p>
      <!-- More content -->
    </div>
  </div>
</template>
```

**Custom Target Element**:
```vue
<template>
  <div>
    <MazReadingProgressBar target=".content-wrapper" />

    <div class="content-wrapper">
      <!-- Target content -->
    </div>
  </div>
</template>
```

---

## MazAnimatedText

Animated text effects with various animation styles.

### Basic Usage

```vue
<script setup>
import MazAnimatedText from 'maz-ui/components/MazAnimatedText'
</script>

<template>
  <MazAnimatedText animation="fade-in">
    Welcome to Maz-UI
  </MazAnimatedText>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `animation` | `'fade-in' \| 'slide-up' \| 'slide-down' \| 'zoom-in' \| 'type'` | Animation type | `'fade-in'` |
| `duration` | `number` | Animation duration (ms) | `600` |
| `delay` | `number` | Animation delay (ms) | `0` |
| `once` | `boolean` | Animate only once | `true` |

### Animation Types

**fade-in**:
```vue
<template>
  <MazAnimatedText animation="fade-in">
    Fade in animation
  </MazAnimatedText>
</template>
```

**slide-up**:
```vue
<template>
  <MazAnimatedText animation="slide-up">
    Slide up from bottom
  </MazAnimatedText>
</template>
```

**zoom-in**:
```vue
<template>
  <MazAnimatedText animation="zoom-in" :duration="1000">
    Zoom in effect
  </MazAnimatedText>
</template>
```

**type** (typewriter effect):
```vue
<template>
  <MazAnimatedText animation="type" :duration="2000">
    Typewriter effect...
  </MazAnimatedText>
</template>
```

### Examples

**Delayed Animation**:
```vue
<template>
  <div>
    <MazAnimatedText animation="slide-up" :delay="0">
      First line
    </MazAnimatedText>
    <MazAnimatedText animation="slide-up" :delay="200">
      Second line (200ms delay)
    </MazAnimatedText>
    <MazAnimatedText animation="slide-up" :delay="400">
      Third line (400ms delay)
    </MazAnimatedText>
  </div>
</template>
```

**Repeating Animation**:
```vue
<template>
  <MazAnimatedText animation="fade-in" :once="false">
    This animates every time it enters viewport
  </MazAnimatedText>
</template>
```

---

## MazAnimatedElement

Generic element animation wrapper with scroll-triggered animations.

### Basic Usage

```vue
<script setup>
import MazAnimatedElement from 'maz-ui/components/MazAnimatedElement'
</script>

<template>
  <MazAnimatedElement animation="fade-up">
    <MazCard>
      <h2>Animated Card</h2>
      <p>This card animates when scrolled into view</p>
    </MazCard>
  </MazAnimatedElement>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `animation` | `string` | Animation name (AOS-compatible) | `'fade-up'` |
| `duration` | `number` | Animation duration (ms) | `600` |
| `delay` | `number` | Animation delay (ms) | `0` |
| `once` | `boolean` | Animate only once | `true` |
| `offset` | `number` | Trigger offset (px) | `120` |

### Animation Names

All AOS animations are supported:
- **Fade**: `fade-up`, `fade-down`, `fade-left`, `fade-right`
- **Zoom**: `zoom-in`, `zoom-out`, `zoom-in-up`, `zoom-in-down`
- **Slide**: `slide-up`, `slide-down`, `slide-left`, `slide-right`
- **Flip**: `flip-left`, `flip-right`, `flip-up`, `flip-down`

### Examples

**Card Grid Animation**:
```vue
<template>
  <div class="grid grid-cols-3 gap-4">
    <MazAnimatedElement
      v-for="(item, i) in items"
      :key="item.id"
      animation="fade-up"
      :delay="i * 100"
    >
      <MazCard>
        {{ item.title }}
      </MazCard>
    </MazAnimatedElement>
  </div>
</template>
```

**Different Animations**:
```vue
<template>
  <MazAnimatedElement animation="zoom-in">
    <div>Zooms in</div>
  </MazAnimatedElement>

  <MazAnimatedElement animation="slide-left">
    <div>Slides from right</div>
  </MazAnimatedElement>

  <MazAnimatedElement animation="flip-up">
    <div>Flips up</div>
  </MazAnimatedElement>
</template>
```

---

## MazAnimatedCounter

Animated number counter with prefix/suffix support.

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import MazAnimatedCounter from 'maz-ui/components/MazAnimatedCounter'

const count = ref(1000)
</script>

<template>
  <MazAnimatedCounter :count="count" />
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `count` | `number` | Target number to count to | `0` |
| `duration` | `number` | Animation duration (ms) | `1000` |
| `prefix` | `string` | Prefix text (e.g., '$') | `''` |
| `suffix` | `string` | Suffix text (e.g., '%') | `''` |
| `decimals` | `number` | Decimal places | `0` |

### Slots

| Slot | Description |
|------|-------------|
| `prefix` | Custom prefix content |
| `suffix` | Custom suffix content |

### Examples

**Currency Counter**:
```vue
<template>
  <MazAnimatedCounter :count="2999.99" prefix="$" :decimals="2" />
  <!-- Output: $2,999.99 -->
</template>
```

**Percentage Counter**:
```vue
<template>
  <MazAnimatedCounter :count="75" suffix="%" />
  <!-- Output: 75% -->
</template>
```

**Custom Duration**:
```vue
<template>
  <MazAnimatedCounter
    :count="10000"
    :duration="5000"
    prefix="$"
  />
  <!-- Counts to $10,000 over 5 seconds -->
</template>
```

**Prefix/Suffix Slots**:
```vue
<template>
  <MazAnimatedCounter :count="20">
    <template #prefix>
      <MazIcon name="dollar" class="mr-1" />
    </template>
    <template #suffix>
      <span class="ml-1 text-sm">USD</span>
    </template>
  </MazAnimatedCounter>
</template>
```

**Reactive Counter**:
```vue
<script setup>
import { ref, onMounted } from 'vue'

const count = ref(0)

onMounted(() => {
  // Update counter every 3 seconds
  setInterval(() => {
    count.value = Math.floor(Math.random() * 10000)
  }, 3000)
})
</script>

<template>
  <MazAnimatedCounter :count="count" prefix="$" />
</template>
```

---

## MazCardSpotlight

Interactive card with animated spotlight effect that follows cursor.

### Basic Usage

```vue
<script setup>
import MazCardSpotlight from 'maz-ui/components/MazCardSpotlight'
</script>

<template>
  <MazCardSpotlight>
    <h3>Spotlight Card</h3>
    <p>Hover to see the spotlight effect</p>
  </MazCardSpotlight>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `color` | `string` | Spotlight color (CSS color) | `'rgba(255,255,255,0.1)'` |
| `intensity` | `number` | Spotlight intensity (0-1) | `0.3` |
| `size` | `number` | Spotlight size (px) | `300` |
| `disabled` | `boolean` | Disable spotlight effect | `false` |

### Examples

**Custom Spotlight Color**:
```vue
<template>
  <MazCardSpotlight color="rgba(59, 130, 246, 0.2)">
    <h3>Blue Spotlight</h3>
    <p>Custom blue spotlight effect</p>
  </MazCardSpotlight>
</template>
```

**Intense Spotlight**:
```vue
<template>
  <MazCardSpotlight :intensity="0.8" :size="500">
    <h3>Intense Effect</h3>
    <p>Larger, more intense spotlight</p>
  </MazCardSpotlight>
</template>
```

**Conditional Spotlight**:
```vue
<script setup>
const isPremium = ref(true)
</script>

<template>
  <MazCardSpotlight :disabled="!isPremium">
    <h3>{{ isPremium ? 'Premium' : 'Basic' }} Card</h3>
    <p>Spotlight only for premium users</p>
  </MazCardSpotlight>
</template>
```

**Card Grid with Spotlights**:
```vue
<template>
  <div class="grid grid-cols-3 gap-4">
    <MazCardSpotlight
      v-for="product in products"
      :key="product.id"
      color="rgba(16, 185, 129, 0.15)"
    >
      <h4>{{ product.name }}</h4>
      <p>{{ product.price }}</p>
      <MazBtn color="success">Buy Now</MazBtn>
    </MazCardSpotlight>
  </div>
</template>
```

---

## Best Practices

### Loading States

**DO**:
- Use `MazFullscreenLoader` for critical operations that block user interaction
- Use `MazLoadingBar` for page/route transitions
- Use `MazCircularProgressBar` to show determinate progress
- Provide meaningful loading messages

**DON'T**:
- Use fullscreen loader for minor operations
- Show multiple loading indicators simultaneously
- Leave users without feedback during long operations

```vue
<!-- ✅ Good: Clear loading state with message -->
<MazFullscreenLoader v-if="isProcessing">
  <MazCircularProgressBar :percentage="progress" />
  <p class="mt-2">Processing {{ currentFile }} ({{ progress }}%)</p>
</MazFullscreenLoader>

<!-- ❌ Bad: No context or progress indication -->
<MazFullscreenLoader v-if="isProcessing" />
```

### Progress Indicators

**DO**:
- Use `auto-color` for intuitive progress feedback
- Show percentage when possible
- Animate progress smoothly
- Update progress in real-time

**DON'T**:
- Show fake progress without actual data
- Use indeterminate progress for long operations
- Forget to handle 100% completion state

```vue
<!-- ✅ Good: Real progress with auto-color -->
<MazCircularProgressBar
  :percentage="uploadProgress"
  auto-color
  suffix="%"
/>

<!-- ❌ Bad: Static fake progress -->
<MazCircularProgressBar :percentage="50" />
```

### Animations

**DO**:
- Use subtle animations for better UX
- Set appropriate animation durations (300-600ms)
- Use `once: true` for performance
- Match animation style to content

**DON'T**:
- Over-animate every element
- Use very long animations (>2s)
- Animate critical content on every scroll

```vue
<!-- ✅ Good: Subtle, performant animations -->
<MazAnimatedElement
  v-for="item in items"
  :key="item.id"
  animation="fade-up"
  :duration="400"
  once
>
  <MazCard>{{ item.title }}</MazCard>
</MazAnimatedElement>

<!-- ❌ Bad: Excessive animation -->
<MazAnimatedElement
  animation="flip-left"
  :duration="3000"
  :once="false"
>
  <p>Critical navigation content</p>
</MazAnimatedElement>
```

---

## Accessibility

### Screen Readers

All feedback components include proper ARIA attributes:

```vue
<!-- Fullscreen loader with ARIA -->
<MazFullscreenLoader
  v-if="isLoading"
  role="status"
  aria-live="polite"
  aria-label="Loading content"
>
  <p>Loading...</p>
</MazFullscreenLoader>

<!-- Progress bar with ARIA -->
<MazCircularProgressBar
  :percentage="75"
  role="progressbar"
  :aria-valuenow="75"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Upload progress"
/>
```

### Reduced Motion

Respect user's motion preferences:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

const prefersReducedMotion = ref(false)

// ✅ Client-only: Access window after mount
onMounted(() => {
  prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

const animationDuration = computed(() =>
  prefersReducedMotion.value ? 0 : 600
)
</script>

<template>
  <MazAnimatedText :duration="animationDuration">
    Respects motion preferences
  </MazAnimatedText>
</template>
```

---

## SSR Compatibility

All feedback components are SSR-safe:

```vue
<!-- Nuxt 3 - Works automatically -->
<template>
  <div>
    <MazFullscreenLoader v-if="isLoading" />
    <MazAnimatedElement animation="fade-up">
      <MazCard>SSR-safe content</MazCard>
    </MazAnimatedElement>
  </div>
</template>
```

**Hydration Notes**:
- Animations trigger after hydration completes
- Progress states sync correctly server → client
- No layout shift issues with loaders

---

## Related Documentation

- **[Components Forms](./components-forms.md)** - Form input components
- **[Components Navigation](./components-navigation.md)** - Navigation components
- **[Components Layout](./components-layout.md)** - Layout and container components
- **[Composables Reference](./composables.md)** - useWait, useAos composables
- **[Plugins Reference](./plugins.md)** - AOS plugin for scroll animations

---

**Version**: Maz-UI v4.3.3
**Last Updated**: 2025-12-14
**Component Count**: 8 feedback & animation components
