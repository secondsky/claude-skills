<template>
  <div class="p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Command Palette Example</h2>
        <p class="text-dimmed mt-1">Press ⌘K (Mac) or Ctrl+K (Windows) to open</p>
      </template>

      <UButton @click="isOpen = true">
        <UIcon name="i-heroicons-magnifying-glass" class="mr-2" />
        Open Command Palette
        <UKbd class="ml-2">⌘K</UKbd>
      </UButton>
    </UCard>

    <UCommandPalette
      v-model="isOpen"
      :groups="filteredGroups"
      placeholder="Search commands..."
      @update:model-value="onSelect"
    />
  </div>
</template>

<script setup lang="ts">
const isOpen = ref(false)
const selected = ref(null)

const groups = computed(() => [
  {
    key: 'actions',
    label: 'Actions',
    commands: [
      { id: 'new', label: 'New File', icon: 'i-heroicons-document-plus', shortcuts: ['⌘', 'N'] },
      { id: 'open', label: 'Open File', icon: 'i-heroicons-folder-open', shortcuts: ['⌘', 'O'] },
      { id: 'save', label: 'Save', icon: 'i-heroicons-document-arrow-down', shortcuts: ['⌘', 'S'] }
    ]
  },
  {
    key: 'navigation',
    label: 'Navigation',
    commands: [
      { id: 'home', label: 'Go to Home', icon: 'i-heroicons-home' },
      { id: 'settings', label: 'Settings', icon: 'i-heroicons-cog' },
      { id: 'profile', label: 'Profile', icon: 'i-heroicons-user' }
    ]
  }
])

const filteredGroups = computed(() => groups.value)

function onSelect(item: any) {
  console.log('Selected:', item)
  const { add: addToast } = useToast()
  addToast({
    title: `Command: ${item.label}`,
    timeout: 2000
  })
}

// Register keyboard shortcut
defineShortcuts({
  'meta_k': () => { isOpen.value = !isOpen.value },
  'ctrl_k': () => { isOpen.value = !isOpen.value }
})
</script>
