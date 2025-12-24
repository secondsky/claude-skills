# Data Display Components Reference

**Components**: Table, Card, Avatar, AvatarGroup, Badge
**Purpose**: Complete reference for displaying structured data and visual elements

---

## Table Component

### Basic Table

```vue
<template>
  <UTable
    :rows="rows"
    :columns="columns"
  />
</template>

<script setup lang="ts">
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' }
]

const rows = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
]
</script>
```

### Table with Actions

```vue
<template>
  <UTable
    :rows="rows"
    :columns="columns"
    @select="onSelect"
  >
    <template #actions-data="{ row }">
      <UDropdownMenu>
        <UButton variant="ghost" size="sm" icon="i-heroicons-ellipsis-horizontal" />

        <template #content>
          <UDropdownMenuItem @click="edit(row)">
            <UIcon name="i-heroicons-pencil" class="mr-2" />
            Edit
          </UDropdownMenuItem>
          <UDropdownMenuItem @click="duplicate(row)">
            <UIcon name="i-heroicons-document-duplicate" class="mr-2" />
            Duplicate
          </UDropdownMenuItem>
          <UDropdownMenuSeparator />
          <UDropdownMenuItem @click="remove(row)" class="text-error">
            <UIcon name="i-heroicons-trash" class="mr-2" />
            Delete
          </UDropdownMenuItem>
        </template>
      </UDropdownMenu>
    </template>
  </UTable>
</template>

<script setup lang="ts">
function edit(row: any) {
  console.log('Edit:', row)
}

function duplicate(row: any) {
  console.log('Duplicate:', row)
}

function remove(row: any) {
  console.log('Delete:', row)
}

function onSelect(rows: any[]) {
  console.log('Selected rows:', rows)
}
</script>
```

### Table with Sorting & Pagination

```vue
<template>
  <UTable
    v-model:page="page"
    v-model:page-count="pageCount"
    :rows="paginatedRows"
    :columns="columns"
    :loading="loading"
    :sort="{ column: 'name', direction: 'asc' }"
    @update:sort="onSort"
  >
    <template #empty>
      <UEmpty
        icon="i-heroicons-inbox"
        title="No data"
        description="There are no rows to display"
      />
    </template>
  </UTable>

  <div class="flex justify-end mt-4">
    <UPagination v-model="page" :total="totalRows" :page-count="pageCount" />
  </div>
</template>

<script setup lang="ts">
const page = ref(1)
const pageCount = ref(10)
const totalRows = ref(100)
const loading = ref(false)

const paginatedRows = computed(() => {
  const start = (page.value - 1) * pageCount.value
  const end = start + pageCount.value
  return allRows.value.slice(start, end)
})

function onSort({ column, direction }: any) {
  // Implement sorting logic
  console.log('Sort by:', column, direction)
}
</script>
```

### Table with Custom Cells

```vue
<template>
  <UTable :rows="rows" :columns="columns">
    <template #name-data="{ row }">
      <div class="flex items-center gap-3">
        <UAvatar :src="row.avatar" :alt="row.name" size="sm" />
        <span class="font-medium">{{ row.name }}</span>
      </div>
    </template>

    <template #status-data="{ row }">
      <UBadge
        :color="row.status === 'active' ? 'success' : 'error'"
        variant="subtle"
      >
        {{ row.status }}
      </UBadge>
    </template>

    <template #progress-data="{ row }">
      <UProgress :value="row.progress" :max="100" size="sm" />
    </template>
  </UTable>
</template>
```

### Table with Selection

```vue
<template>
  <div>
    <div v-if="selectedRows.length" class="mb-4">
      <p class="text-sm text-gray-600">
        {{ selectedRows.length }} row(s) selected
      </p>
      <div class="flex gap-2 mt-2">
        <UButton size="sm" @click="bulkEdit">Edit Selected</UButton>
        <UButton size="sm" color="error" @click="bulkDelete">Delete Selected</UButton>
      </div>
    </div>

    <UTable
      v-model="selectedRows"
      :rows="rows"
      :columns="columns"
      selectable
    />
  </div>
</template>

<script setup lang="ts">
const selectedRows = ref([])
</script>
```

### Table with Virtualization (v4.1+)

For large datasets (1000+ rows):

```vue
<template>
  <UTable
    :rows="largeDataset"
    :columns="columns"
    virtualize
    class="h-96"
  />
</template>

<script setup lang="ts">
const largeDataset = Array(100000).fill(0).map((_, i) => ({
  id: i,
  name: `User ${i}`,
  email: `user${i}@example.com`
}))
</script>
```

**See**: `performance-optimization.md` for virtualization details

---

## Card Component

### Basic Card

```vue
<template>
  <UCard>
    <p>Simple card content</p>
  </UCard>
</template>
```

### Card with Header & Footer

```vue
<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Card Title</h3>
        <UBadge color="success">New</UBadge>
      </div>
    </template>

    <p class="text-gray-600">
      Card body content goes here. This can include any Vue components,
      text, images, or other elements.
    </p>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost">Cancel</UButton>
        <UButton>Save</UButton>
      </div>
    </template>
  </UCard>
</template>
```

### Card Grid Layout

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <UCard v-for="item in items" :key="item.id">
      <template #header>
        <div class="flex items-center gap-3">
          <UAvatar :src="item.image" :alt="item.title" />
          <div>
            <h4 class="font-semibold">{{ item.title }}</h4>
            <p class="text-sm text-gray-500">{{ item.subtitle }}</p>
          </div>
        </div>
      </template>

      <p class="text-sm">{{ item.description }}</p>

      <template #footer>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">{{ item.date }}</span>
          <UButton size="sm" variant="ghost">View</UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
```

### Card Variants

```vue
<template>
  <div class="space-y-4">
    <UCard variant="solid">Solid variant</UCard>
    <UCard variant="outline">Outline variant</UCard>
    <UCard variant="soft">Soft variant</UCard>
    <UCard variant="subtle">Subtle variant</UCard>
  </div>
</template>
```

---

## Avatar Component

### Basic Avatar

```vue
<template>
  <UAvatar
    src="/user-avatar.jpg"
    alt="John Doe"
  />
</template>
```

### Avatar Sizes

```vue
<template>
  <div class="flex items-center gap-4">
    <UAvatar src="/avatar.jpg" size="xs" />
    <UAvatar src="/avatar.jpg" size="sm" />
    <UAvatar src="/avatar.jpg" size="md" />
    <UAvatar src="/avatar.jpg" size="lg" />
    <UAvatar src="/avatar.jpg" size="xl" />
  </div>
</template>
```

### Avatar with Fallback

```vue
<template>
  <!-- Fallback to initials -->
  <UAvatar
    alt="John Doe"
    :ui="{ placeholder: 'bg-primary text-white' }"
  />

  <!-- Fallback to icon -->
  <UAvatar
    icon="i-heroicons-user"
  />
</template>
```

### Avatar with Status Badge

```vue
<template>
  <div class="relative inline-block">
    <UAvatar src="/avatar.jpg" size="lg" />
    <UBadge
      color="success"
      class="absolute bottom-0 right-0 rounded-full"
    >
      <span class="w-2 h-2 bg-current rounded-full" />
    </UBadge>
  </div>
</template>
```

---

## AvatarGroup Component

### Basic Avatar Group

```vue
<template>
  <UAvatarGroup :max="3" size="sm">
    <UAvatar v-for="user in users" :key="user.id" :src="user.avatar" :alt="user.name" />
  </UAvatarGroup>
</template>

<script setup lang="ts">
const users = [
  { id: 1, name: 'John', avatar: '/john.jpg' },
  { id: 2, name: 'Jane', avatar: '/jane.jpg' },
  { id: 3, name: 'Bob', avatar: '/bob.jpg' },
  { id: 4, name: 'Alice', avatar: '/alice.jpg' }
]
</script>
```

### Avatar Group with Tooltip

```vue
<template>
  <UAvatarGroup :max="4" size="md">
    <UTooltip v-for="user in users" :key="user.id" :text="user.name">
      <UAvatar :src="user.avatar" :alt="user.name" />
    </UTooltip>
  </UAvatarGroup>
</template>
```

---

## Badge Component

### Basic Badge

```vue
<template>
  <UBadge>Default</UBadge>
  <UBadge color="success">Success</UBadge>
  <UBadge color="warning">Warning</UBadge>
  <UBadge color="error">Error</UBadge>
  <UBadge color="info">Info</UBadge>
</template>
```

### Badge Variants

```vue
<template>
  <div class="flex gap-2">
    <UBadge variant="solid" color="primary">Solid</UBadge>
    <UBadge variant="outline" color="primary">Outline</UBadge>
    <UBadge variant="soft" color="primary">Soft</UBadge>
    <UBadge variant="subtle" color="primary">Subtle</UBadge>
  </div>
</template>
```

### Badge Sizes

```vue
<template>
  <div class="flex items-center gap-2">
    <UBadge size="xs">Extra Small</UBadge>
    <UBadge size="sm">Small</UBadge>
    <UBadge size="md">Medium</UBadge>
    <UBadge size="lg">Large</UBadge>
  </div>
</template>
```

### Badge with Dot

```vue
<template>
  <UBadge color="success">
    <span class="w-2 h-2 bg-current rounded-full mr-1.5" />
    Online
  </UBadge>
</template>
```

### Badge as Notification

```vue
<template>
  <div class="relative inline-block">
    <UButton icon="i-heroicons-bell">
      Notifications
    </UButton>
    <UBadge
      color="error"
      class="absolute -top-1 -right-1 rounded-full min-w-5 h-5 flex items-center justify-center"
    >
      12
    </UBadge>
  </div>
</template>
```

---

## Common Patterns

### User Profile Card

```vue
<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-4">
        <UAvatar
          src="/user.jpg"
          alt="John Doe"
          size="lg"
        />
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold">John Doe</h3>
            <UBadge color="success" variant="subtle">Pro</UBadge>
          </div>
          <p class="text-sm text-gray-500">john@example.com</p>
        </div>
      </div>
    </template>

    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-map-pin" class="text-gray-400" />
        <span class="text-sm">San Francisco, CA</span>
      </div>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-briefcase" class="text-gray-400" />
        <span class="text-sm">Software Engineer</span>
      </div>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-calendar" class="text-gray-400" />
        <span class="text-sm">Joined March 2024</span>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2">
        <UButton class="flex-1">Message</UButton>
        <UButton variant="outline" class="flex-1">Follow</UButton>
      </div>
    </template>
  </UCard>
</template>
```

### Data Table with Metadata

```vue
<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <UBadge>{{ filteredRows.length }} results</UBadge>
        <UBadge v-if="selectedRows.length" color="primary">
          {{ selectedRows.length }} selected
        </UBadge>
      </div>

      <div class="flex gap-2">
        <UInput
          v-model="search"
          placeholder="Search..."
          icon="i-heroicons-magnifying-glass"
        />
        <UButton icon="i-heroicons-funnel">Filter</UButton>
      </div>
    </div>

    <UTable
      v-model="selectedRows"
      :rows="filteredRows"
      :columns="columns"
      selectable
    />
  </div>
</template>
```

---

## Reference

- **Templates**: See `templates/components/ui-data-table.vue`, `ui-card-layouts.vue`, `ui-avatar-badge.vue`
- **Performance**: See `performance-optimization.md` for table virtualization
