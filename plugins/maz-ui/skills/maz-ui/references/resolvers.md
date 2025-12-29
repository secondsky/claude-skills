# Maz-UI Auto-Import Resolvers Reference

Complete guide to Maz-UI's intelligent auto-import resolvers for effortless component, directive, and composable imports in Vue 3 projects.

## Overview

Maz-UI provides **3 powerful auto-import resolvers** that eliminate manual imports while maintaining perfect tree-shaking and TypeScript support:

1. **MazComponentsResolver** - Auto-imports all 50+ Maz-UI components
2. **MazDirectivesResolver** - Auto-imports all 5 directives (v-tooltip, v-click-outside, etc.)
3. **MazModulesResolver** - Auto-imports composables and utility functions

**Key Benefits**:
- ✅ **Zero Boilerplate** - No manual import statements required
- ✅ **Perfect Tree-Shaking** - Only bundles what you actually use
- ✅ **Type Safety** - Full TypeScript support with auto-generated definitions
- ✅ **Conflict Prevention** - Configurable prefixes to avoid naming conflicts
- ✅ **IntelliSense Support** - Full autocomplete and hover documentation

::: tip Vue Only Feature
Auto-import resolvers are designed for Vue 3 projects using Vite or Webpack. **Nuxt 3 users** already have everything integrated in the [@maz-ui/nuxt module](./setup-nuxt.md) and don't need manual resolver configuration.
:::

---

## Quick Setup

### 1. Install Required Packages

```bash
# Using pnpm
pnpm add unplugin-vue-components unplugin-auto-import

# Using npm
npm install unplugin-vue-components unplugin-auto-import

# Using yarn
yarn add unplugin-vue-components unplugin-auto-import
```

### 2. Configure Build Tool

**Vite Configuration**:

```typescript
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {
  MazComponentsResolver,
  MazDirectivesResolver,
  MazModulesResolver
} from 'maz-ui/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        MazComponentsResolver(),
        MazDirectivesResolver(),
      ],
      dts: true, // Generate TypeScript definitions
    }),
    AutoImport({
      resolvers: [MazModulesResolver()],
      dts: true, // Generate TypeScript definitions
    }),
  ],
})
```

**Webpack Configuration**:

```javascript
// webpack.config.js
const Components = require('unplugin-vue-components/webpack')
const AutoImport = require('unplugin-auto-import/webpack')
const {
  MazComponentsResolver,
  MazDirectivesResolver,
  MazModulesResolver
} = require('maz-ui/resolvers')

module.exports = {
  plugins: [
    Components({
      resolvers: [
        MazComponentsResolver(),
        MazDirectivesResolver(),
      ],
      dts: true,
    }),
    AutoImport({
      resolvers: [MazModulesResolver()],
      dts: true,
    }),
  ],
}
```

### 3. Start Using (No Imports Needed!)

```vue
<script setup>
// All auto-imported - no import statements needed!
const text = ref('')
const toast = useToast()
const { isDark } = useTheme()

function showSuccess() {
  toast.success('Auto-imports are working!')
}
</script>

<template>
  <!-- Components auto-imported -->
  <MazInput v-model="text" placeholder="Type here..." />
  <MazBtn @click="showSuccess" color="primary">
    Show Toast
  </MazBtn>

  <!-- Directives auto-imported -->
  <div v-tooltip="'Helpful tooltip'">
    Hover me
  </div>
</template>
```

---

## 1. MazComponentsResolver

Auto-imports all 50+ Maz-UI components without manual import statements.

### Basic Usage

```vue
<script setup>
// No imports needed!
const email = ref('')
const password = ref('')
const showPassword = ref(false)

async function handleLogin() {
  // Submit login
}
</script>

<template>
  <!-- All components auto-imported -->
  <MazCard>
    <template #header>
      <h2>Login</h2>
    </template>

    <MazInput
      v-model="email"
      type="email"
      label="Email"
      placeholder="you@example.com"
    />

    <MazInput
      v-model="password"
      :type="showPassword ? 'text' : 'password'"
      label="Password"
      placeholder="Enter password"
    />

    <MazCheckbox v-model="showPassword">
      Show password
    </MazCheckbox>

    <MazBtn @click="handleLogin" color="primary" block>
      Login
    </MazBtn>
  </MazCard>
</template>
```

### All Auto-Imported Components

**Forms & Inputs** (13 components):
- `MazInput`, `MazTextarea`, `MazSelect`, `MazCheckbox`, `MazRadio`, `MazSwitch`
- `MazSlider`, `MazInputPhoneNumber`, `MazInputCode`, `MazInputPrice`
- `MazInputTags`, `MazDatePicker`, `MazChecklist`

**UI Elements** (10 components):
- `MazBtn`, `MazCard`, `MazBadge`, `MazAvatar`, `MazIcon`, `MazSpinner`
- `MazTable`, `MazTabs`, `MazStepper`, `MazPagination`

**Overlays & Modals** (6 components):
- `MazDialog`, `MazDialogConfirm`, `MazDrawer`, `MazBottomSheet`
- `MazBackdrop`, `MazPopover`, `MazDropdown`

**Feedback & Animation** (9 components):
- `MazFullscreenLoader`, `MazLoadingBar`, `MazCircularProgressBar`
- `MazReadingProgressBar`, `MazAnimatedText`, `MazAnimatedElement`
- `MazAnimatedCounter`, `MazCardSpotlight`

**Layout & Display** (12 components):
- `MazCarousel`, `MazGallery`, `MazAccordion`, `MazExpandAnimation`
- `MazLazyImg`, `MazPullToRefresh`, `MazChart`

### Resolver Options

```typescript
interface MazComponentsResolverOptions {
  /**
   * Prefix for component names
   * @default '' (no prefix, use 'MazBtn')
   * @example 'Maz' → 'MazMazBtn'
   */
  prefix?: string

  /**
   * Enable development mode for faster builds
   * @default false
   */
  devMode?: boolean
}

// Usage
MazComponentsResolver({
  prefix: 'Ui', // Components become UiMazBtn, UiMazInput
  devMode: process.env.NODE_ENV === 'development'
})
```

---

## 2. MazDirectivesResolver

Auto-imports all 5 Maz-UI Vue directives for enhanced functionality.

### Available Directives

**v-tooltip**:
```vue
<template>
  <!-- Simple tooltip -->
  <MazBtn v-tooltip="'Click to save'">
    Save
  </MazBtn>

  <!-- Advanced tooltip with options -->
  <MazBtn v-tooltip="{
    text: 'Delete this item permanently',
    position: 'top',
    color: 'destructive'
  }">
    Delete
  </MazBtn>
</template>
```

**v-click-outside**:
```vue
<script setup>
const showDropdown = ref(false)

function handleClickOutside() {
  showDropdown.value = false
}
</script>

<template>
  <div v-click-outside="handleClickOutside">
    <button @click="showDropdown = !showDropdown">
      Menu
    </button>
    <div v-if="showDropdown" class="dropdown">
      Dropdown content
    </div>
  </div>
</template>
```

**v-lazy-img**:
```vue
<template>
  <!-- Lazy load image with placeholder -->
  <img v-lazy-img="{
    src: '/images/large-photo.jpg',
    loading: '/images/placeholder.jpg',
    error: '/images/error.jpg',
    threshold: 0.5
  }" alt="Photo" />
</template>
```

**v-zoom-img**:
```vue
<template>
  <!-- Click to zoom image -->
  <img
    v-zoom-img
    src="/gallery/photo-1.jpg"
    alt="Zoomable photo"
  />
</template>
```

**v-fullscreen-img**:
```vue
<template>
  <!-- Fullscreen image viewer -->
  <img
    v-fullscreen-img
    src="/gallery/photo-1.jpg"
    alt="Gallery photo"
  />
</template>
```

### Resolver Options

```typescript
interface MazDirectivesResolverOptions {
  /**
   * Prefix for directive names
   * @default '' (no prefix, use v-tooltip)
   * @example 'maz' → v-maz-tooltip
   */
  prefix?: string

  /**
   * Enable development mode
   * @default false
   */
  devMode?: boolean
}

// Usage
MazDirectivesResolver({
  prefix: 'maz', // Directives become v-maz-tooltip, v-maz-click-outside
  devMode: process.env.NODE_ENV === 'development'
})
```

---

## 3. MazModulesResolver

Auto-imports composables and utility functions for cleaner code.

### Auto-Imported Composables

**UI Management**:
```vue
<script setup>
// All composables auto-imported
const toast = useToast()
const dialog = useDialog()
const wait = useWait()
const { isDark, toggleDarkMode } = useTheme()

async function confirmDelete() {
  const result = await dialog.open({
    title: 'Delete Item',
    message: 'Are you sure?'
  })

  if (result) {
    wait.start('DELETING')
    await deleteItem()
    wait.stop('DELETING')
    toast.success('Item deleted')
  }
}
</script>
```

**Responsive Design**:
```vue
<script setup>
const { isMobile, isTablet, isDesktop } = useBreakpoints()
const { width, height } = useWindowSize()

const columns = computed(() => {
  if (isMobile.value) return 1
  if (isTablet.value) return 2
  return 3
})
</script>

<template>
  <div :class="{ 'mobile-layout': isMobile }">
    <p>Window: {{ width }} x {{ height }}</p>
    <div :style="{ 'grid-template-columns': `repeat(${columns}, 1fr)` }">
      <!-- Grid items -->
    </div>
  </div>
</template>
```

**Form Validation**:
```vue
<script setup>
import { pipe, string, nonEmpty, email, number, minValue } from 'valibot'

const schema = {
  email: pipe(
    string('Email is required'),
    nonEmpty('Email is required'),
    email('Invalid email format')
  ),
  age: pipe(
    number('Age is required'),
    minValue(18, 'Must be 18 or older')
  )
}

const {
  model,
  errorMessages,
  isSubmitting,
  handleSubmit
} = useFormValidator({ schema })

const onSubmit = handleSubmit(async (data) => {
  await api.submit(data)
  toast.success('Form submitted!')
})
</script>
```

**User Interaction**:
```vue
<script setup>
const { isIdle } = useIdleTimeout(60_000) // 60 seconds
const { isVisible } = useUserVisibility()
const { direction } = useSwipe(targetRef)
const { start, pause, reset, time } = useTimer()

watch(isIdle, (idle) => {
  if (idle) {
    toast.warning('Are you still there?')
  }
})

watch(direction, (dir) => {
  if (dir === 'left') handleSwipeLeft()
  if (dir === 'right') handleSwipeRight()
})
</script>
```

### Auto-Imported Utilities

**Formatters**:
```vue
<script setup>
const price = ref(29.99)
const date = ref(new Date())

// Auto-imported utility functions
const formattedPrice = computed(() =>
  formatCurrency(price.value, { currency: 'EUR', locale: 'de-DE' })
)

const formattedDate = computed(() =>
  formatDate(date.value, { format: 'short', locale: 'en-US' })
)
</script>

<template>
  <p>Price: {{ formattedPrice }}</p>
  <p>Date: {{ formattedDate }}</p>
</template>
```

**Performance Utilities**:
```vue
<script setup>
// Auto-imported debounce and throttle
const debouncedSearch = debounce((query) => {
  console.log('Searching:', query)
}, 300)

const throttledScroll = throttle((event) => {
  console.log('Scroll position:', window.scrollY)
}, 100)

function handleSearch(query) {
  debouncedSearch(query)
}

onMounted(() => {
  window.addEventListener('scroll', throttledScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', throttledScroll)
})
</script>
```

**Async Utilities**:
```vue
<script setup>
async function loadSequentially() {
  await sleep(1000) // Wait 1 second
  const data1 = await fetchData1()

  await sleep(500) // Wait 500ms
  const data2 = await fetchData2()

  return [data1, data2]
}
</script>
```

### Composables Reference Table

| Category | Composables |
|----------|------------|
| **UI Management** | `useToast()`, `useDialog()`, `useWait()`, `useTheme()` |
| **Responsive** | `useBreakpoints()`, `useWindowSize()` |
| **User Interaction** | `useUserVisibility()`, `useIdleTimeout()`, `useSwipe()` |
| **Form Handling** | `useFormValidator()`, `useFormField()` |
| **Utilities** | `useTimer()`, `useStringMatching()`, `useReadingTime()` |
| **Animations** | `useAos()` |

### Utilities Reference Table

| Category | Functions |
|----------|-----------|
| **Formatters** | `formatCurrency()`, `formatDate()` |
| **Performance** | `debounce()`, `throttle()` |
| **Comparison** | `isEqual()` |
| **Async** | `sleep()` |

### Resolver Options

```typescript
interface MazModulesResolverOptions {
  /**
   * Prefix for composable names (only composables, not utilities)
   * @default '' (no prefix, use useToast)
   * @example 'maz' → useMazToast (utilities NOT prefixed)
   */
  prefix?: string

  /**
   * Enable development mode
   * @default false
   */
  devMode?: boolean
}

// Usage
MazModulesResolver({
  prefix: 'maz', // Composables become useMazToast, useMazTheme
  devMode: process.env.NODE_ENV === 'development'
})
```

::: warning Prefix Limitation
Currently, utility functions (like `debounce`, `formatCurrency`) are **NOT prefixed** by `MazModulesResolver`. Only composables (functions starting with `use`) are prefixed. This is a known limitation that may be addressed in future versions.
:::

---

## Advanced Configuration

### Avoiding Naming Conflicts with Prefixes

When using multiple UI libraries, use prefixes to prevent naming collisions:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import {
  MazComponentsResolver,
  MazDirectivesResolver,
  MazModulesResolver
} from 'maz-ui/resolvers'
import {
  ElementPlusResolver,
  AntDesignVueResolver
} from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    Components({
      resolvers: [
        MazComponentsResolver({ prefix: 'Maz' }),
        ElementPlusResolver({ prefix: 'El' }),
        AntDesignVueResolver({ prefix: 'A' }),
      ],
    }),
    AutoImport({
      resolvers: [
        MazModulesResolver({ prefix: 'maz' })
      ],
    }),
  ],
})
```

**With Prefixes**:

```vue
<script setup>
// Prefixed composables
const toast = useMazToast()
const theme = useMazTheme()

// Utilities are NOT prefixed (limitation)
const formatted = formatCurrency(29.99) // Still unprefixed
</script>

<template>
  <!-- Prefixed components -->
  <MazMazBtn>Maz UI Button</MazMazBtn>
  <ElButton>Element Plus Button</ElButton>
  <AButton>Ant Design Button</AButton>

  <!-- Prefixed directives -->
  <div v-maz-tooltip="'Maz tooltip'">Hover me</div>
</template>
```

### Development Mode Optimization

Enable development mode for faster builds during development:

```typescript
export default defineConfig({
  plugins: [
    Components({
      resolvers: [
        MazComponentsResolver({
          devMode: process.env.NODE_ENV === 'development'
        }),
        MazDirectivesResolver({
          devMode: process.env.NODE_ENV === 'development'
        }),
      ],
    }),
    AutoImport({
      resolvers: [
        MazModulesResolver({
          devMode: process.env.NODE_ENV === 'development'
        }),
      ],
    }),
  ],
})
```

**Development Mode Benefits**:
- Faster build times
- Better debugging output
- More detailed error messages
- Skip unnecessary optimizations during dev

### Production-Ready Configuration

Complete production configuration with all optimizations:

```typescript
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {
  MazComponentsResolver,
  MazDirectivesResolver,
  MazModulesResolver
} from 'maz-ui/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        MazComponentsResolver(),
        MazDirectivesResolver(),
      ],
      dts: 'src/types/components.d.ts',
      directoryAsNamespace: true,
      deep: true,
    }),
    AutoImport({
      resolvers: [MazModulesResolver()],
      dts: 'src/types/auto-imports.d.ts',
      imports: ['vue', 'vue-router'],
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
      },
    }),
  ],
  build: {
    rollupOptions: {
      treeshake: true,
    },
  },
})
```

---

## TypeScript Integration

### Auto-Generated Type Definitions

Resolvers automatically generate TypeScript definitions for perfect IntelliSense:

**components.d.ts** (generated):
```typescript
declare module 'vue' {
  export interface GlobalComponents {
    MazBtn: typeof import('maz-ui/components')['MazBtn']
    MazInput: typeof import('maz-ui/components')['MazInput']
    MazCard: typeof import('maz-ui/components')['MazCard']
    MazDialog: typeof import('maz-ui/components')['MazDialog']
    // ... all other auto-imported components
  }
}
```

**auto-imports.d.ts** (generated):
```typescript
declare global {
  const useToast: typeof import('maz-ui/composables')['useToast']
  const useTheme: typeof import('maz-ui/composables')['useTheme']
  const useBreakpoints: typeof import('maz-ui/composables')['useBreakpoints']
  const debounce: typeof import('maz-ui')['debounce']
  const formatCurrency: typeof import('maz-ui')['formatCurrency']
  // ... all other auto-imported functions
}

export {}
```

### ESLint Configuration

Prevent ESLint errors for auto-imported globals:

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    './.eslintrc-auto-import.json', // Generated by unplugin-auto-import
  ],
  rules: {
    // Allow auto-imported globals
    'no-undef': 'off',
  },
}
```

**Generated .eslintrc-auto-import.json**:
```json
{
  "globals": {
    "useToast": "readonly",
    "useTheme": "readonly",
    "debounce": "readonly",
    "formatCurrency": "readonly"
  }
}
```

---

## Real-World Example: Dashboard

Complete dashboard implementation using all 3 resolvers:

```vue
<script setup lang="ts">
// ✨ Nothing imported - everything is auto-imported!

// Composables
const toast = useToast()
const { width } = useWindowSize()
const { isMobile } = useBreakpoints()

// State
const currentPage = ref(1)
const perPage = ref(10)
const isLoading = ref(false)
const showUserDialog = ref(false)
const editingUser = ref({ name: '', role: '' })

// Mock data
const users = ref([
  { id: 1, name: 'John Doe', role: 'Admin' },
  { id: 2, name: 'Jane Smith', role: 'User' },
  { id: 3, name: 'Bob Johnson', role: 'Moderator' },
])

// Computed
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return users.value.slice(start, start + perPage.value)
})

const totalUsers = computed(() => users.value.length)

const stats = computed(() => [
  { label: 'Total Users', value: totalUsers.value, color: 'primary' },
  { label: 'Admins', value: users.value.filter(u => u.role === 'Admin').length, color: 'success' },
  { label: 'Users', value: users.value.filter(u => u.role === 'User').length, color: 'info' },
])

// Table configuration
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
]

const roleOptions = ['Admin', 'User', 'Moderator']

// Auto-imported utility
const debouncedRefresh = debounce(refreshData, 1000)

// Methods
function refreshData() {
  isLoading.value = true
  sleep(1000).then(() => {
    isLoading.value = false
    toast.success('Data refreshed!')
  })
}

function closeDialog() {
  showUserDialog.value = false
  editingUser.value = { name: '', role: '' }
}

function saveUser() {
  toast.success('User saved successfully!')
  closeDialog()
}
</script>

<template>
  <div class="dashboard">
    <!-- Stats Card -->
    <MazCard class="stats-card">
      <template #header>
        <div class="flex items-center justify-between">
          <h2>Statistics</h2>
          <MazBtn
            v-tooltip="'Refresh data'"
            size="sm"
            @click="refreshData"
          >
            <MazIcon name="refresh" />
          </MazBtn>
        </div>
      </template>

      <div class="grid grid-cols-3 gap-4">
        <div v-for="stat in stats" :key="stat.label">
          <MazBadge :color="stat.color">
            {{ stat.value }}
          </MazBadge>
          <p class="text-sm text-muted">
            {{ stat.label }}
          </p>
        </div>
      </div>
    </MazCard>

    <!-- Users Table -->
    <MazCard>
      <template #header>
        Users
      </template>

      <MazTable
        :data="paginatedUsers"
        :columns="columns"
        :loading="isLoading"
      />

      <template #footer>
        <MazPagination
          v-model:current-page="currentPage"
          :total="totalUsers"
          :per-page="perPage"
        />
      </template>
    </MazCard>

    <!-- User Edit Dialog -->
    <MazDialog v-model="showUserDialog" title="User Details">
      <MazInput
        v-model="editingUser.name"
        label="Name"
        placeholder="Enter user name"
      />
      <MazSelect
        v-model="editingUser.role"
        label="Role"
        :options="roleOptions"
      />

      <template #footer>
        <MazBtn @click="closeDialog">
          Cancel
        </MazBtn>
        <MazBtn @click="saveUser" color="success">
          Save
        </MazBtn>
      </template>
    </MazDialog>
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 1.5rem;
  padding: 1rem;
}

.stats-card {
  border: 1px solid var(--maz-border-color);
  border-radius: 0.5rem;
}
</style>
```

---

## Performance Optimization

### Tree-Shaking Best Practices

Auto-import resolvers maintain the same tree-shaking benefits as manual imports:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    Components({
      resolvers: [MazComponentsResolver()],
      dts: true, // Generate types for better tree-shaking
    }),
  ],
  build: {
    rollupOptions: {
      treeshake: true, // Ensure tree-shaking is enabled
    },
  },
})
```

**Bundle Size Comparison**:
- Manual imports: `import { MazBtn } from 'maz-ui/components'` → ~5KB
- Auto-import resolver: `<MazBtn>` in template → ~5KB (identical!)

### Optimize Type Generation

Generate types in a dedicated directory:

```typescript
Components({
  resolvers: [MazComponentsResolver()],
  dts: 'src/types/components.d.ts', // Custom path
})

AutoImport({
  resolvers: [MazModulesResolver()],
  dts: 'src/types/auto-imports.d.ts', // Custom path
})
```

**Add to .gitignore**:
```
# Auto-generated types
src/types/components.d.ts
src/types/auto-imports.d.ts
```

---

## Troubleshooting

### Components Not Auto-Importing

**Issue**: Components show as undefined or unknown

**Solutions**:

1. **Verify resolver is configured**:
   ```typescript
   Components({
     resolvers: [MazComponentsResolver()], // Must be included
   })
   ```

2. **Check plugin order**:
   ```typescript
   // ✅ Correct order
   plugins: [
     vue(),
     Components({ ... }),
     AutoImport({ ... }),
   ]

   // ❌ Wrong order
   plugins: [
     Components({ ... }),
     vue(), // vue() should be first
   ]
   ```

3. **Restart dev server**:
   ```bash
   # Stop server, clear cache, restart
   rm -rf node_modules/.vite
   npm run dev
   ```

### TypeScript Errors

**Issue**: "Cannot find name 'MazBtn'" or similar TypeScript errors

**Solutions**:

1. **Enable DTS generation**:
   ```typescript
   Components({
     dts: true, // Generate type definitions
   })
   ```

2. **Check tsconfig.json includes**:
   ```json
   {
     "include": [
       "src/**/*",
       "src/types/**/*" // Include generated types
     ]
   }
   ```

3. **Manually run type generation**:
   ```bash
   # Trigger type generation
   npx vite build --mode development
   ```

### Prefix Not Working for Utilities

**Issue**: Utilities not prefixed despite `prefix: 'maz'` option

**Explanation**: This is a **known limitation**. Currently, only composables (functions starting with `use`) are prefixed, not utility functions.

```typescript
// Current behavior (v4.3.3)
MazModulesResolver({ prefix: 'maz' })

// ✅ Composables ARE prefixed
const toast = useMazToast()
const theme = useMazTheme()

// ❌ Utilities are NOT prefixed
const debounced = debounce(fn, 300) // Still unprefixed
const formatted = formatCurrency(99) // Still unprefixed
```

**Workaround**: Import utilities manually if prefix is required:
```typescript
import { debounce as mazDebounce } from 'maz-ui'
```

### Development Performance Issues

**Issue**: Slow build times in development

**Solutions**:

1. **Enable development mode**:
   ```typescript
   MazComponentsResolver({
     devMode: process.env.NODE_ENV === 'development'
   })
   ```

2. **Disable type generation in dev**:
   ```typescript
   Components({
     dts: process.env.NODE_ENV === 'production',
   })
   ```

3. **Use Vite's built-in optimizations**:
   ```typescript
   export default defineConfig({
     optimizeDeps: {
       include: ['maz-ui'], // Pre-bundle Maz-UI
     },
   })
   ```

---

## Migration from Manual Imports

### Before (Manual Imports)

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { MazBtn, MazCard, MazInput, MazDialog } from 'maz-ui/components'
import { useToast, useTheme, useBreakpoints } from 'maz-ui/composables'
import { vTooltip, vClickOutside } from 'maz-ui/directives'
import { debounce, formatCurrency, sleep } from 'maz-ui'

const toast = useToast()
const { isDark } = useTheme()
const { isMobile } = useBreakpoints()

const debouncedSearch = debounce((query) => {
  console.log('Searching:', query)
}, 300)

// ... rest of component
</script>

<template>
  <MazCard>
    <MazInput v-model="search" />
    <MazBtn v-tooltip="'Save changes'">Save</MazBtn>
  </MazCard>
</template>
```

### After (Auto-Import)

```vue
<script setup lang="ts">
// ✨ Nothing to import! Everything is auto-imported

const toast = useToast()
const { isDark } = useTheme()
const { isMobile } = useBreakpoints()

const debouncedSearch = debounce((query) => {
  console.log('Searching:', query)
}, 300)

// ... rest of component
</script>

<template>
  <MazCard>
    <MazInput v-model="search" />
    <MazBtn v-tooltip="'Save changes'">Save</MazBtn>
  </MazCard>
</template>
```

**Benefits of Migration**:
- 🚀 **60% less boilerplate** - No import statements
- ✅ **Same bundle size** - Perfect tree-shaking maintained
- 💡 **Better IntelliSense** - Auto-generated types
- 🎯 **No breaking changes** - Code logic stays identical

---

## Related Documentation

- **[Setup Vue](./setup-vue.md)** - Complete Vue 3 installation guide with resolver configuration
- **[Setup Nuxt](./setup-nuxt.md)** - Nuxt 3 has built-in auto-imports, no manual resolver setup needed
- **[Composables Reference](./composables.md)** - Detailed API docs for all auto-imported composables
- **[Directives Reference](./directives.md)** - Complete guide to all auto-imported directives
- **[Performance Guide](./performance.md)** - Tree-shaking optimization strategies

---

## External Resources

- **[unplugin-vue-components](https://github.com/antfu/unplugin-vue-components)** - The underlying component auto-import system
- **[unplugin-auto-import](https://github.com/antfu/unplugin-auto-import)** - Auto-import for composables and utilities
- **[Official Maz-UI Resolvers Docs](https://maz-ui.com/guide/resolvers)** - Latest official documentation

---

**Version**: Maz-UI v4.3.3
**Last Updated**: 2025-12-14
**Plugin Requirements**: `unplugin-vue-components` + `unplugin-auto-import`
