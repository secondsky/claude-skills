# CommandPalette Setup

## Installation (if using search)

```bash
npm install fuse.js
```

## Basic Setup

```vue
<script setup lang="ts">
const isOpen = ref(false)

const groups = computed(() => [
  {
    key: 'actions',
    label: 'Actions',
    commands: [
      {
        id: 'new',
        label: 'New File',
        icon: 'i-heroicons-document-plus',
        shortcuts: ['⌘', 'N']
      }
    ]
  }
])

defineShortcuts({
  'meta_k': () => { isOpen.value = !isOpen.value }
})
</script>

<template>
  <UCommandPalette v-model="isOpen" :groups="groups" />
</template>
```

## With Search (Fuse.js)

```typescript
import Fuse from 'fuse.js'

const allCommands = [...]

const fuse = new Fuse(allCommands, {
  keys: ['label', 'description'],
  threshold: 0.3
})

const searchQuery = ref('')

const filteredCommands = computed(() => {
  if (!searchQuery.value) return allCommands
  return fuse.search(searchQuery.value).map(r => r.item)
})
```

## Async Data

```typescript
const groups = computed(async () => {
  const data = await $fetch('/api/commands')
  return data
})
```
