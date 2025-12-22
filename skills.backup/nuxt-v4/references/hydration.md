# Hydration - Best Practices

Complete guide to SSR hydration in Nuxt 4, common issues, and solutions.

## Table of Contents

- [What is Hydration?](#what-is-hydration)
- [Common Causes of Hydration Mismatches](#common-causes-of-hydration-mismatches)
- [Solutions](#solutions)
- [Debugging Hydration Mismatches](#debugging-hydration-mismatches)
- [Third-Party Libraries](#third-party-libraries)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)
- [Checklist](#checklist)

## What is Hydration?

**Hydration** is the process of making server-rendered HTML interactive on the client by attaching Vue's reactivity system and event listeners.

**Process:**
1. Server renders HTML from Vue components
2. HTML is sent to browser
3. Browser displays HTML (instant visual)
4. Client-side JavaScript loads
5. Vue "hydrates" the HTML (makes it interactive)

## Common Causes of Hydration Mismatches

### 1. Browser APIs

```vue
<!-- ❌ Wrong: window doesn't exist on server -->
<script setup>
const width = window.innerWidth
</script>

<template>
  <div>Width: {{ width }}</div>
</template>

<!-- ✅ Right: Check environment first -->
<script setup>
const width = ref(0)

onMounted(() => {
  width.value = window.innerWidth
})
</script>

<template>
  <div>Width: {{ width }}</div>
</template>
```

### 2. Non-Deterministic Values

```vue
<!-- ❌ Wrong: Different value on server vs client -->
<script setup>
const id = Math.random()
const timestamp = Date.now()
</script>

<template>
  <div :id="id">{{ timestamp }}</div>
</template>

<!-- ✅ Right: Use useState for consistent values -->
<script setup>
const id = useState('unique-id', () => Math.random())
const timestamp = useState('timestamp', () => Date.now())
</script>

<template>
  <div :id="id">{{ timestamp }}</div>
</template>
```

### 3. Third-Party Libraries

```vue
<!-- ❌ Wrong: Library uses window -->
<script setup>
import SomeLibrary from 'some-library'

const instance = new SomeLibrary()
</script>

<!-- ✅ Right: Initialize on client only -->
<script setup>
import type SomeLibrary from 'some-library'

const instance = ref<SomeLibrary | null>(null)

onMounted(async () => {
  const { default: Lib } = await import('some-library')
  instance.value = new Lib()
})
</script>
```

### 4. Different HTML Structure

```vue
<!-- ❌ Wrong: Different structure on server vs client -->
<script setup>
const isMobile = window.innerWidth < 768
</script>

<template>
  <div v-if="isMobile">Mobile view</div>
  <div v-else>Desktop view</div>
</template>

<!-- ✅ Right: Same structure, different styling -->
<script setup>
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = window.innerWidth < 768
})
</script>

<template>
  <div :class="{ mobile: isMobile, desktop: !isMobile }">
    <div v-show="isMobile">Mobile view</div>
    <div v-show="!isMobile">Desktop view</div>
  </div>
</template>
```

## Solutions

### ClientOnly Component

```vue
<template>
  <div>
    <h1>My Page</h1>

    <!-- Only renders on client -->
    <ClientOnly>
      <HeavyInteractiveComponent />

      <!-- Fallback shown during SSR -->
      <template #fallback>
        <div>Loading interactive content...</div>
      </template>
    </ClientOnly>
  </div>
</template>
```

### Process Guards

```typescript
// Check at runtime
if (process.client) {
  // Client-only code
  window.addEventListener('resize', handleResize)
}

if (process.server) {
  // Server-only code
  console.log('Running on server')
}

// Check at compile time
if (import.meta.client) {
  // Only bundled for client
}

if (import.meta.server) {
  // Only bundled for server
}
```

### onMounted Hook

```vue
<script setup>
const chart = ref(null)

onMounted(async () => {
  // Guaranteed to run on client only
  const { default: Chart } = await import('chart.js')

  chart.value = new Chart(/* ... */)
})

onUnmounted(() => {
  // Cleanup
  chart.value?.destroy()
})
</script>
```

### useState for Consistency

```vue
<script setup>
// ✅ Consistent value across server and client
const theme = useState('theme', () => {
  if (import.meta.client) {
    return localStorage.getItem('theme') || 'light'
  }
  return 'light'  // Server default
})

// Update on mount
onMounted(() => {
  const stored = localStorage.getItem('theme')
  if (stored) {
    theme.value = stored
  }
})
</script>
```

## Debugging Hydration Mismatches

### Enable Warnings

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    vue: {
      template: {
        compilerOptions: {
          hydration: 'debug'
        }
      }
    }
  }
})
```

### Console Messages

Look for warnings like:
```
[Vue warn]: Hydration node mismatch:
- Client vnode: div
- Server rendered DOM: span
```

### Identify the Component

Vue dev tools will show which component has the mismatch.

### Common Patterns

```vue
<!-- Pattern 1: Date/Time -->
<!-- ❌ Wrong -->
<div>{{ new Date().toISOString() }}</div>

<!-- ✅ Right -->
<script setup>
const currentTime = ref('')

onMounted(() => {
  currentTime.value = new Date().toISOString()
})
</script>

<template>
  <ClientOnly>
    <div>{{ currentTime }}</div>
  </ClientOnly>
</template>

<!-- Pattern 2: Random Values -->
<!-- ❌ Wrong -->
<div :key="Math.random()">Content</div>

<!-- ✅ Right -->
<script setup>
const key = useState('random-key', () => Math.random())
</script>

<template>
  <div :key="key">Content</div>
</template>

<!-- Pattern 3: Browser Detection -->
<!-- ❌ Wrong -->
<script setup>
const userAgent = navigator.userAgent
</script>

<!-- ✅ Right -->
<script setup>
const userAgent = ref('')

onMounted(() => {
  userAgent.value = navigator.userAgent
})
</script>
```

## Third-Party Libraries

### Chart Libraries

```vue
<script setup>
import type { Chart } from 'chart.js'

const chartInstance = ref<Chart | null>(null)
const chartRef = ref<HTMLCanvasElement>()

onMounted(async () => {
  if (!chartRef.value) return

  const { Chart } = await import('chart.js/auto')

  chartInstance.value = new Chart(chartRef.value, {
    type: 'bar',
    data: { /* ... */ }
  })
})

onUnmounted(() => {
  chartInstance.value?.destroy()
})
</script>

<template>
  <ClientOnly>
    <canvas ref="chartRef" />
  </ClientOnly>
</template>
```

### Map Libraries

```vue
<script setup>
const mapInstance = ref(null)
const mapContainer = ref<HTMLDivElement>()

onMounted(async () => {
  if (!mapContainer.value) return

  const L = await import('leaflet')

  mapInstance.value = L.map(mapContainer.value).setView([51.505, -0.09], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
    mapInstance.value
  )
})

onUnmounted(() => {
  mapInstance.value?.remove()
})
</script>

<template>
  <ClientOnly>
    <div ref="mapContainer" style="height: 400px" />
  </ClientOnly>
</template>
```

### Rich Text Editors

```vue
<script setup>
const editor = ref(null)
const editorElement = ref<HTMLDivElement>()

onMounted(async () => {
  if (!editorElement.value) return

  const Quill = (await import('quill')).default

  editor.value = new Quill(editorElement.value, {
    theme: 'snow'
  })
})
</script>

<template>
  <ClientOnly>
    <div ref="editorElement" />

    <template #fallback>
      <textarea placeholder="Loading editor..." />
    </template>
  </ClientOnly>
</template>
```

## Best Practices

1. **Always use ClientOnly** for browser-dependent components
2. **Initialize in onMounted** for browser APIs
3. **Use useState** for values that must be consistent
4. **Avoid Math.random() and Date.now()** in templates
5. **Test SSR rendering** in production mode
6. **Use v-show instead of v-if** when structure must match
7. **Provide fallbacks** with ClientOnly
8. **Clean up resources** in onUnmounted
9. **Use TypeScript** for better type safety
10. **Enable hydration warnings** in development

## Common Pitfalls

❌ **Using window/document without guards**
❌ **Non-deterministic values in templates**
❌ **Different HTML structure server vs client**
❌ **Missing ClientOnly for third-party libraries**
❌ **Not cleaning up event listeners**
❌ **Using localStorage directly in setup**
❌ **Forgetting fallbacks**
❌ **Not testing in production mode**

## Checklist

- [ ] No window/document access in setup
- [ ] All browser APIs in onMounted
- [ ] Third-party libraries use ClientOnly
- [ ] No Math.random() or Date.now() in templates
- [ ] useState for consistent values
- [ ] Fallbacks provided for ClientOnly
- [ ] Event listeners cleaned up
- [ ] Tested in production mode
- [ ] Hydration warnings enabled in dev

---

**Last Updated**: 2025-11-09
