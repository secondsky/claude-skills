# Navigation Components Reference

**Components**: Tabs, Breadcrumb, CommandPalette, Pagination
**Purpose**: Complete reference for navigation and command patterns

---

## Tabs Component

### Basic Tabs

```vue
<template>
  <UTabs v-model="selected" :items="items">
    <template #item="{ item }">
      <div v-if="item.key === 'account'">Account settings content</div>
      <div v-else-if="item.key === 'security'">Security settings content</div>
      <div v-else-if="item.key === 'notifications'">Notifications settings content</div>
    </template>
  </UTabs>
</template>

<script setup lang="ts">
const selected = ref('account')

const items = [
  { key: 'account', label: 'Account', icon: 'i-heroicons-user' },
  { key: 'security', label: 'Security', icon: 'i-heroicons-lock-closed' },
  { key: 'notifications', label: 'Notifications', icon: 'i-heroicons-bell' }
]
</script>
```

### Tabs with Router Integration

```vue
<template>
  <UTabs :items="items" :default-value="route.query.tab as string">
    <template #item="{ item }">
      <component :is="item.component" />
    </template>
  </UTabs>
</template>

<script setup lang="ts">
import AccountTab from './tabs/AccountTab.vue'
import SecurityTab from './tabs/SecurityTab.vue'

const route = useRoute()

const items = [
  {
    key: 'account',
    label: 'Account',
    component: AccountTab
  },
  {
    key: 'security',
    label: 'Security',
    component: SecurityTab
  }
]

watch(() => selected.value, (newTab) => {
  navigateTo({ query: { tab: newTab } })
})
</script>
```

### Vertical Tabs

```vue
<template>
  <div class="flex gap-6">
    <UTabs
      v-model="selected"
      :items="items"
      orientation="vertical"
      class="w-48"
    />
    <div class="flex-1">
      <!-- Tab content -->
    </div>
  </div>
</template>
```

---

## Breadcrumb Component

### Basic Breadcrumb

```vue
<template>
  <UBreadcrumb :items="items" />
</template>

<script setup lang="ts">
const items = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Electronics', to: '/products/electronics' },
  { label: 'Laptops' }  // Current page (no link)
]
</script>
```

### Breadcrumb with Icons

```vue
<template>
  <UBreadcrumb :items="items" />
</template>

<script setup lang="ts">
const items = [
  { label: 'Home', icon: 'i-heroicons-home', to: '/' },
  { label: 'Dashboard', icon: 'i-heroicons-chart-bar', to: '/dashboard' },
  { label: 'Analytics' }
]
</script>
```

### Dynamic Breadcrumb from Route

```vue
<script setup lang="ts">
const route = useRoute()

const items = computed(() => {
  const paths = route.path.split('/').filter(Boolean)

  return paths.map((path, index) => {
    const to = '/' + paths.slice(0, index + 1).join('/')
    const isLast = index === paths.length - 1

    return {
      label: path.charAt(0).toUpperCase() + path.slice(1),
      to: isLast ? undefined : to
    }
  })
})
</script>

<template>
  <UBreadcrumb :items="items" />
</template>
```

---

## CommandPalette Component

### Basic Command Palette

```vue
<template>
  <UCommandPalette
    v-model="isOpen"
    :groups="groups"
    placeholder="Search commands..."
  />

  <UButton @click="isOpen = true">
    Open Command Palette
    <UKbd>⌘K</UKbd>
  </UButton>
</template>

<script setup lang="ts">
import type { CommandPaletteItem } from '@nuxt/ui'

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
        shortcuts: ['⌘', 'N'],
        click: () => createFile()
      },
      {
        id: 'open',
        label: 'Open File',
        icon: 'i-heroicons-folder-open',
        shortcuts: ['⌘', 'O'],
        click: () => openFile()
      }
    ]
  },
  {
    key: 'navigation',
    label: 'Go to',
    commands: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'i-heroicons-home',
        click: () => navigateTo('/dashboard')
      }
    ]
  }
])

// Keyboard shortcut
defineShortcuts({
  'meta_k': () => { isOpen.value = !isOpen.value }
})
</script>
```

### Command Palette with Search

```vue
<template>
  <UCommandPalette
    v-model="selected"
    :groups="groups"
    :fuse="{ keys: ['label', 'description'] }"
    @update:model-value="onSelect"
  />
</template>

<script setup lang="ts">
import Fuse from 'fuse.js'

const selected = ref(null)

function onSelect(item: any) {
  if (item.click) {
    item.click()
  }
  selected.value = null
}
</script>
```

### Command Palette with Recent Items

```vue
<script setup lang="ts">
const recentFiles = useLocalStorage('recent-files', [])

const groups = computed(() => {
  const baseGroups = [
    // ... regular command groups
  ]

  if (recentFiles.value.length > 0) {
    baseGroups.unshift({
      key: 'recent',
      label: 'Recent',
      commands: recentFiles.value.map(file => ({
        id: file.id,
        label: file.name,
        icon: 'i-heroicons-clock',
        click: () => openFile(file)
      }))
    })
  }

  return baseGroups
})
</script>
```

### Command Palette with Virtualization (v4.1+)

For large command lists (500+ items):

```vue
<template>
  <UCommandPalette
    :groups="groups"
    virtualize
    :fuse="{ resultLimit: 1000 }"
    class="h-80"
  />
</template>

<script setup lang="ts">
const items = Array(1000).fill(0).map((_, i) => ({
  label: `Command ${i}`,
  value: i
}))

const groups = [{ id: 'commands', items }]
</script>
```

**See**: `performance-optimization.md` for virtualization details

---

## Pagination Component

### Basic Pagination

```vue
<template>
  <div>
    <div class="mb-4">
      <!-- Your content -->
      <div v-for="item in paginatedItems" :key="item.id">
        {{ item.name }}
      </div>
    </div>

    <UPagination
      v-model="page"
      :total="totalItems"
      :page-count="pageCount"
    />
  </div>
</template>

<script setup lang="ts">
const page = ref(1)
const pageCount = ref(10)
const totalItems = ref(100)

const paginatedItems = computed(() => {
  const start = (page.value - 1) * pageCount.value
  const end = start + pageCount.value
  return allItems.value.slice(start, end)
})
</script>
```

### Pagination with Page Size Selector

```vue
<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600">Items per page:</span>
      <USelectMenu
        v-model="pageCount"
        :items="[10, 25, 50, 100]"
        class="w-20"
      />
    </div>

    <UPagination
      v-model="page"
      :total="totalItems"
      :page-count="pageCount"
    />

    <span class="text-sm text-gray-600">
      Showing {{ start }}-{{ end }} of {{ totalItems }}
    </span>
  </div>
</template>

<script setup lang="ts">
const page = ref(1)
const pageCount = ref(10)
const totalItems = ref(245)

const start = computed(() => (page.value - 1) * pageCount.value + 1)
const end = computed(() => Math.min(page.value * pageCount.value, totalItems.value))
</script>
```

### Server-Side Pagination

```vue
<template>
  <div>
    <UTable
      :rows="rows"
      :columns="columns"
      :loading="pending"
    />

    <UPagination
      v-model="page"
      :total="totalItems"
      :page-count="pageCount"
    />
  </div>
</template>

<script setup lang="ts">
const page = ref(1)
const pageCount = ref(20)

const { data, pending } = await useFetch('/api/items', {
  query: {
    page,
    limit: pageCount
  },
  watch: [page, pageCount]
})

const rows = computed(() => data.value?.items || [])
const totalItems = computed(() => data.value?.total || 0)
</script>
```

---

## Common Patterns

### Multi-Level Navigation

```vue
<template>
  <div>
    <UBreadcrumb :items="breadcrumbs" class="mb-4" />

    <UTabs v-model="selectedTab" :items="tabs" class="mb-6">
      <template #item="{ item }">
        <!-- Tab content -->
      </template>
    </UTabs>

    <div class="flex items-center justify-between">
      <UButton @click="commandPaletteOpen = true">
        Quick Actions
        <UKbd>⌘K</UKbd>
      </UButton>

      <UPagination v-model="page" :total="100" />
    </div>
  </div>

  <UCommandPalette v-model="commandPaletteOpen" :groups="commands" />
</template>
```

### Navigation with Keyboard Shortcuts

```vue
<script setup lang="ts">
const router = useRouter()
const commandPaletteOpen = ref(false)

defineShortcuts({
  'meta_k': () => { commandPaletteOpen.value = true },
  'g_h': () => router.push('/'),
  'g_d': () => router.push('/dashboard'),
  'g_s': () => router.push('/settings')
})
</script>

<template>
  <UCommandPalette
    v-model="commandPaletteOpen"
    :groups="groups"
  />
</template>
```

---

## Reference

- **Templates**: See `templates/components/ui-navigation-tabs.vue`, `ui-command-palette.vue`
- **Command Setup**: See `command-palette-setup.md`
- **Performance**: See `performance-optimization.md` for CommandPalette virtualization
