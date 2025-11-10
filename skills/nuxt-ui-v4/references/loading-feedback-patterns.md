# Loading & Feedback Patterns

## Skeleton Loaders

Match dimensions of real content:

```vue
<div v-if="loading">
  <USkeleton class="h-8 w-48 mb-4" />  <!-- Matches heading -->
  <USkeleton class="h-4 w-full mb-2" /> <!-- Matches text -->
  <USkeleton class="h-4 w-3/4" />       <!-- Matches text -->
</div>

<div v-else>
  <h2>Real Heading</h2>
  <p>Real content...</p>
</div>
```

## Progress Indicators

```vue
<script setup lang="ts">
const progress = ref(0)

async function upload() {
  const interval = setInterval(() => {
    progress.value += 10
    if (progress.value >= 100) {
      clearInterval(interval)
      showSuccessToast()
    }
  }, 300)
}
</script>

<template>
  <UProgress :value="progress" :max="100" />
</template>
```

## Toast Coordination

```typescript
// Show loading toast
const loadingToast = addToast({
  title: 'Processing...',
  timeout: 0
})

// Do work
await doWork()

// Remove loading toast
removeToast(loadingToast.id)

// Show success toast
addToast({
  title: 'Complete!',
  color: 'success'
})
```
