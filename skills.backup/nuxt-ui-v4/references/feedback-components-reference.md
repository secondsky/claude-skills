# Feedback Components Reference

**Components**: Toast, Notification, Alert, Progress, Skeleton, Empty (v4.2+)
**Purpose**: Complete reference for user feedback and loading states

---

## Toast Notifications

### Using useToast Composable

```vue
<template>
  <div class="space-y-2">
    <UButton @click="showSuccess">Show Success Toast</UButton>
    <UButton @click="showError" color="error">Show Error Toast</UButton>
    <UButton @click="showWithAction">Toast with Action</UButton>
  </div>
</template>

<script setup lang="ts">
const { add: addToast } = useToast()

function showSuccess() {
  addToast({
    title: 'Success!',
    description: 'Your changes have been saved.',
    color: 'success',
    icon: 'i-heroicons-check-circle',
    timeout: 3000
  })
}

function showError() {
  addToast({
    title: 'Error',
    description: 'Something went wrong. Please try again.',
    color: 'error',
    icon: 'i-heroicons-x-circle',
    timeout: 5000
  })
}

function showWithAction() {
  addToast({
    title: 'File deleted',
    description: 'Your file has been moved to trash.',
    color: 'warning',
    timeout: 10000,
    actions: [{
      label: 'Undo',
      click: () => {
        console.log('Undo clicked')
        // Restore file logic
      }
    }]
  })
}
</script>
```

### Toast Colors

```typescript
const { add } = useToast()

// Success toast
add({ title: 'Success', color: 'success' })

// Error toast
add({ title: 'Error', color: 'error' })

// Warning toast
add({ title: 'Warning', color: 'warning' })

// Info toast
add({ title: 'Info', color: 'info' })

// Neutral toast (default)
add({ title: 'Notification', color: 'neutral' })
```

### Toast Positioning

Configure toast position in `app.config.ts`:

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    toast: {
      position: 'top-right'  // top-left, top-right, bottom-left, bottom-right
    }
  }
})
```

### Managing Toasts

```vue
<script setup lang="ts">
const { add, remove, clear } = useToast()

// Add toast and get ID
const toastId = add({
  title: 'Processing...',
  timeout: 0  // Don't auto-dismiss
})

// Remove specific toast
setTimeout(() => {
  remove(toastId)
}, 5000)

// Clear all toasts
function clearAll() {
  clear()
}
</script>
```

### Toast with Promise

```vue
<script setup lang="ts">
const { add, remove } = useToast()

async function saveData() {
  const toastId = add({
    title: 'Saving...',
    color: 'info',
    timeout: 0
  })

  try {
    await api.save(data)

    // Update toast to success
    remove(toastId)
    add({
      title: 'Saved!',
      color: 'success',
      timeout: 3000
    })
  } catch (error) {
    // Update toast to error
    remove(toastId)
    add({
      title: 'Save failed',
      description: error.message,
      color: 'error',
      timeout: 5000
    })
  }
}
</script>
```

---

## Notification Component

### Using useNotification Composable

```vue
<script setup lang="ts">
const { add: addNotification } = useNotification()

function showNotification() {
  addNotification({
    title: 'New message',
    description: 'You have a new message from John Doe',
    icon: 'i-heroicons-envelope',
    avatar: { src: '/john.jpg' },
    color: 'primary',
    timeout: 0  // Persistent notification
  })
}

function showWithAction() {
  addNotification({
    title: 'Update available',
    description: 'A new version is available. Click to update.',
    icon: 'i-heroicons-arrow-down-tray',
    color: 'info',
    actions: [{
      label: 'Update',
      click: () => performUpdate()
    }, {
      label: 'Dismiss',
      click: (close) => close()
    }]
  })
}
</script>
```

### Notification vs Toast

**Use Toast for**:
- Temporary feedback
- Success/error confirmations
- Auto-dismiss messages
- Bottom/top-right placement

**Use Notification for**:
- Persistent messages
- Inbox-style notifications
- User actions required
- Top-left/center placement

---

## Alert Component

### Basic Alert

```vue
<template>
  <div class="space-y-4">
    <UAlert
      color="success"
      title="Success"
      description="Your changes have been saved successfully."
      icon="i-heroicons-check-circle"
    />

    <UAlert
      color="error"
      title="Error"
      description="There was a problem processing your request."
      icon="i-heroicons-x-circle"
    />

    <UAlert
      color="warning"
      title="Warning"
      description="This action cannot be undone."
      icon="i-heroicons-exclamation-triangle"
    />

    <UAlert
      color="info"
      title="Information"
      description="New features have been added to your account."
      icon="i-heroicons-information-circle"
    />
  </div>
</template>
```

### Alert Variants

```vue
<template>
  <div class="space-y-4">
    <UAlert variant="solid" title="Solid" />
    <UAlert variant="outline" title="Outline" />
    <UAlert variant="soft" title="Soft" />
    <UAlert variant="subtle" title="Subtle" />
  </div>
</template>
```

### Alert with Actions

```vue
<template>
  <UAlert
    color="warning"
    title="Confirm deletion"
    description="Are you sure you want to delete this item?"
    :actions="[{
      label: 'Delete',
      color: 'error',
      click: () => handleDelete()
    }, {
      label: 'Cancel',
      variant: 'ghost',
      click: () => handleCancel()
    }]"
  />
</template>
```

### Closeable Alert

```vue
<template>
  <UAlert
    v-if="showAlert"
    title="Cookie notice"
    description="We use cookies to improve your experience."
    :close="{ click: () => showAlert = false }"
  />
</template>

<script setup lang="ts">
const showAlert = ref(true)
</script>
```

---

## Progress Component

### Basic Progress Bar

```vue
<template>
  <UProgress :value="progress" :max="100" />
</template>

<script setup lang="ts">
const progress = ref(0)

// Simulate progress
onMounted(() => {
  const interval = setInterval(() => {
    if (progress.value < 100) {
      progress.value += 10
    } else {
      clearInterval(interval)
    }
  }, 500)
})
</script>
```

### Progress Colors

```vue
<template>
  <div class="space-y-4">
    <UProgress :value="50" color="primary" />
    <UProgress :value="50" color="success" />
    <UProgress :value="50" color="warning" />
    <UProgress :value="50" color="error" />
  </div>
</template>
```

### Progress Sizes

```vue
<template>
  <div class="space-y-4">
    <UProgress :value="50" size="xs" />
    <UProgress :value="50" size="sm" />
    <UProgress :value="50" size="md" />
    <UProgress :value="50" size="lg" />
  </div>
</template>
```

### Progress with Label

```vue
<template>
  <div>
    <div class="flex justify-between mb-1">
      <span class="text-sm font-medium">Uploading...</span>
      <span class="text-sm text-gray-500">{{ progress }}%</span>
    </div>
    <UProgress :value="progress" :max="100" />
  </div>
</template>
```

### Indeterminate Progress

```vue
<template>
  <UProgress :value="null" color="primary" />
</template>
```

---

## Skeleton Loader

### Basic Skeleton

```vue
<template>
  <div v-if="loading">
    <USkeleton class="h-8 w-48 mb-4" />
    <USkeleton class="h-4 w-full mb-2" />
    <USkeleton class="h-4 w-3/4" />
  </div>
  <div v-else>
    <h1>{{ title }}</h1>
    <p>{{ content }}</p>
  </div>
</template>
```

### Card Skeleton

```vue
<template>
  <UCard>
    <div v-if="loading" class="space-y-4">
      <div class="flex items-center gap-3">
        <USkeleton class="h-12 w-12 rounded-full" />
        <div class="flex-1">
          <USkeleton class="h-4 w-32 mb-2" />
          <USkeleton class="h-3 w-48" />
        </div>
      </div>
      <USkeleton class="h-4 w-full" />
      <USkeleton class="h-4 w-5/6" />
      <USkeleton class="h-4 w-4/6" />
    </div>
    <div v-else>
      <!-- Actual content -->
    </div>
  </UCard>
</template>
```

### Table Skeleton

```vue
<template>
  <div v-if="loading" class="space-y-2">
    <USkeleton
      v-for="i in 5"
      :key="i"
      class="h-12 w-full"
    />
  </div>
  <UTable v-else :rows="rows" :columns="columns" />
</template>
```

---

## Empty Component (v4.2+)

### Basic Empty State

```vue
<template>
  <UEmpty
    icon="i-heroicons-inbox"
    title="No messages"
    description="You don't have any messages yet."
  />
</template>
```

### Empty State with Actions

```vue
<template>
  <UEmpty
    icon="i-heroicons-folder-open"
    title="No projects"
    description="Get started by creating your first project."
    :actions="[{
      label: 'Create Project',
      icon: 'i-heroicons-plus',
      click: () => createProject()
    }, {
      label: 'Import Project',
      variant: 'ghost',
      click: () => importProject()
    }]"
  />
</template>
```

### Empty State Variants

```vue
<template>
  <div class="grid grid-cols-2 gap-4">
    <UEmpty variant="solid" title="Solid" />
    <UEmpty variant="outline" title="Outline" />
    <UEmpty variant="soft" title="Soft" />
    <UEmpty variant="subtle" title="Subtle" />
  </div>
</template>
```

### Empty State with Avatar

```vue
<template>
  <UEmpty
    :avatar="{ src: '/robot.png' }"
    title="No activity"
    description="There's no recent activity to show."
  />
</template>
```

### Empty State with Custom Slots

```vue
<template>
  <UEmpty>
    <template #header>
      <div class="flex justify-center mb-4">
        <UIcon name="i-heroicons-magnifying-glass" class="w-16 h-16 text-gray-400" />
      </div>
    </template>

    <template #title>
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">
        No results found
      </h3>
    </template>

    <template #description>
      <p class="text-gray-500 dark:text-gray-400">
        Try adjusting your search or filter criteria
      </p>
    </template>

    <template #actions>
      <div class="flex gap-2 mt-4">
        <UButton @click="clearFilters">Clear Filters</UButton>
        <UButton variant="ghost" @click="resetSearch">Reset Search</UButton>
      </div>
    </template>
  </UEmpty>
</template>
```

---

## Common Patterns

### Loading State Coordination

```vue
<template>
  <div>
    <!-- Show skeleton while loading -->
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-64 w-full" />
    </div>

    <!-- Show empty state if no data -->
    <UEmpty
      v-else-if="!items.length"
      icon="i-heroicons-inbox"
      title="No items"
      description="Start by adding your first item."
      :actions="[{ label: 'Add Item', click: openAddModal }]"
    />

    <!-- Show actual content -->
    <div v-else>
      <UCard v-for="item in items" :key="item.id">
        {{ item.name }}
      </UCard>
    </div>
  </div>
</template>
```

### Progress with Toast Updates

```vue
<script setup lang="ts">
const { add: addToast, remove } = useToast()
const uploadProgress = ref(0)

async function uploadFile(file: File) {
  const toastId = addToast({
    title: 'Uploading...',
    timeout: 0
  })

  try {
    await uploadWithProgress(file, (progress) => {
      uploadProgress.value = progress
    })

    remove(toastId)
    addToast({
      title: 'Upload complete!',
      color: 'success'
    })
  } catch (error) {
    remove(toastId)
    addToast({
      title: 'Upload failed',
      description: error.message,
      color: 'error'
    })
  }
}
</script>

<template>
  <div v-if="uploadProgress > 0 && uploadProgress < 100">
    <UProgress :value="uploadProgress" />
  </div>
</template>
```

---

## Reference

- **Templates**: See `templates/components/ui-toast-notifications.vue`, `ui-feedback-states.vue`, `ui-empty-state.vue`
- **Composables**: See `composables-guide.md` for useToast, useNotification
- **Loading Patterns**: See `loading-feedback-patterns.md`
