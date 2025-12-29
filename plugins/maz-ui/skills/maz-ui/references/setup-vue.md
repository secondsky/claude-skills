# Maz-UI Vue 3 Setup Guide

Complete installation and configuration guide for using Maz-UI in Vue 3 projects.

## Installation

```bash
# Using pnpm (recommended)
pnpm add maz-ui @maz-ui/themes

# Using npm
npm install maz-ui @maz-ui/themes

# Using yarn
yarn add maz-ui @maz-ui/themes
```

## Basic Setup

### 1. Install MazUi Plugin

Create or edit your `main.ts` file:

```typescript
import { createApp } from 'vue'
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes'
import { en } from '@maz-ui/translations'
import App from './App.vue'

// Import Maz-UI styles BEFORE your own CSS
import 'maz-ui/styles'
import './style.css'

const app = createApp(App)

app.use(MazUi, {
  theme: {
    preset: mazUi
  },
  translations: {
    messages: { en }
  }
})

app.mount('#app')
```

### 2. Use Components

```vue
<script setup lang="ts">
import MazBtn from 'maz-ui/components/MazBtn'
import MazInput from 'maz-ui/components/MazInput'
import { ref } from 'vue'

const name = ref('')

function handleSubmit() {
  console.log('Name:', name.value)
}
</script>

<template>
  <div class="maz-flex maz-flex-col maz-gap-4">
    <MazInput
      v-model="name"
      label="Your Name"
      placeholder="Enter your name"
    />
    <MazBtn color="primary" @click="handleSubmit">
      Submit
    </MazBtn>
  </div>
</template>
```

## Advanced Configuration

### With Custom Theme

```typescript
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes/presets'
import { fr } from '@maz-ui/translations'
import 'maz-ui/styles'
import './style.css'

app.use(MazUi, {
  theme: {
    preset: mazUi, // or 'ocean' | 'pristine' | 'obsidian'
    overrides: {
      foundation: {
        'radius': '0.7rem',
        'border-width': '0.0625rem',
      },
      colors: {
        light: {
          primary: '220 100% 50%', // Custom blue
        },
        dark: {
          primary: '220 100% 70%',
        }
      }
    }
  },
  translations: {
    locale: 'fr',
    fallbackLocale: 'en',
    messages: { fr },
  },
})
```

## Auto-Import Setup (Recommended)

For optimal DX, use auto-imports to avoid manual component imports.

### Install Dependencies

```bash
pnpm add -D unplugin-vue-components unplugin-auto-import
```

### Configure Vite

Edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import {
  MazComponentsResolver,
  MazDirectivesResolver,
  MazModulesResolver
} from 'maz-ui/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    vue(),

    // Auto-import components
    Components({
      resolvers: [
        MazComponentsResolver(),
        MazDirectivesResolver(),
      ],
      dts: true, // Generate type definitions
    }),

    // Auto-import composables and utilities
    AutoImport({
      resolvers: [MazModulesResolver()],
      dts: true,
    }),
  ],
})
```

### Use Without Imports

```vue
<script setup>
// No imports needed! All auto-imported:
const name = ref('')
const toast = useToast() // Auto-imported composable
const { toggleDarkMode } = useTheme()

const debouncedSearch = debounce((query) => {
  console.log('Searching:', query)
}, 300)

function handleClickOutside() {
  toast.info('Clicked outside!')
}
</script>

<template>
  <!-- Auto-imported components -->
  <MazInput v-model="name" placeholder="Type here..." />
  <MazBtn @click="toggleDarkMode">Toggle Dark Mode</MazBtn>

  <!-- Auto-imported directives -->
  <div v-click-outside="handleClickOutside">
    Click outside detector
  </div>

  <MazBtn v-tooltip="'This is a tooltip'">
    Hover me
  </MazBtn>
</template>
```

## Available Resolvers

| Resolver | Purpose | Import |
|----------|---------|--------|
| `MazComponentsResolver` | Components (MazBtn, MazInput, etc.) | `'maz-ui/resolvers'` |
| `MazDirectivesResolver` | Directives (v-click-outside, v-tooltip, etc.) | `'maz-ui/resolvers'` |
| `MazModulesResolver` | Composables & utilities (useToast, debounce, etc.) | `'maz-ui/resolvers'` |

### Avoiding Naming Conflicts

Use the `prefix` option:

```typescript
export default defineConfig({
  plugins: [
    Components({
      resolvers: [
        MazComponentsResolver(),
        MazDirectivesResolver({ prefix: 'Maz' }), // v-maz-tooltip
      ],
    }),
    AutoImport({
      resolvers: [
        MazModulesResolver({ prefix: 'Maz' }), // useMazToast, useMazTheme
      ],
    }),
  ],
})
```

## Using Plugins

### Toast Plugin

```typescript
// main.ts
import { MazToast } from 'maz-ui/plugins/toast'
import 'maz-ui/styles' // Already includes toast styles

app.use(MazToast, {
  position: 'top-right',
  timeout: 3000,
})
```

Usage in components:

```vue
<script setup>
import { useToast } from 'maz-ui/composables'

const toast = useToast()

function showNotification() {
  toast.success('Operation successful!')
  toast.error('Something went wrong')
  toast.warning('Please be careful')
  toast.info('Just so you know')
}
</script>
```

### Dialog Plugin

```typescript
// main.ts
import { MazDialog } from 'maz-ui/plugins/dialog'
import 'maz-ui/styles'

app.use(MazDialog)
```

Usage:

```vue
<script setup>
import { useDialog } from 'maz-ui/composables'

const dialog = useDialog()

async function confirmDelete() {
  const confirmed = await dialog.confirm({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    // Perform deletion
  }
}
</script>
```

### AOS Plugin (Animations on Scroll)

```typescript
// main.ts
import { MazAos } from 'maz-ui/plugins/aos'
import 'maz-ui/styles'

app.use(MazAos, {
  animation: 'fade-in',
  duration: 300,
})
```

Usage:

```vue
<template>
  <div data-maz-aos="fade-in" data-maz-aos-delay="100">
    Content with animation
  </div>
</template>
```

### Wait Plugin (Loading States)

```typescript
// main.ts
import { MazWait } from 'maz-ui/plugins/wait'
import 'maz-ui/styles'

app.use(MazWait)
```

Usage:

```vue
<script setup>
import { useWait } from 'maz-ui/composables'

const wait = useWait()

async function fetchData() {
  wait.start('fetching')
  try {
    const data = await fetch('/api/data')
    return data
  } finally {
    wait.end('fetching')
  }
}
</script>

<template>
  <MazBtn :loading="wait.is('fetching')" @click="fetchData">
    Fetch Data
  </MazBtn>
</template>
```

## Using Directives

### Tooltip

```typescript
// main.ts
import { vTooltip } from 'maz-ui/directives'

app.directive('tooltip', vTooltip)
```

Usage:

```vue
<template>
  <MazBtn v-tooltip="'Click me for action'">
    Action
  </MazBtn>

  <!-- With options -->
  <MazBtn v-tooltip="{ text: 'Bottom tooltip', position: 'bottom' }">
    Hover me
  </MazBtn>
</template>
```

### Click Outside

```typescript
// main.ts
import { vClickOutside } from 'maz-ui/directives'

app.directive('click-outside', vClickOutside)
```

Usage:

```vue
<script setup>
const isOpen = ref(false)

function handleClickOutside() {
  isOpen.value = false
}
</script>

<template>
  <div v-click-outside="handleClickOutside">
    <MazBtn @click="isOpen = true">Open</MazBtn>
    <div v-if="isOpen">
      Dropdown content
    </div>
  </div>
</template>
```

### Lazy Image

```typescript
// main.ts
import { vLazyImg } from 'maz-ui/directives'

app.directive('lazy-img', vLazyImg)
```

Usage:

```vue
<template>
  <img v-lazy-img="imageUrl" alt="Description" />
</template>
```

## Tree-Shaking Optimization

### Direct Imports (Most Optimized)

```typescript
// ✅✅✅ Best - smallest bundle size
import MazBtn from 'maz-ui/components/MazBtn'
import MazCard from 'maz-ui/components/MazCard'
import MazInput from 'maz-ui/components/MazInput'
import { useToast } from 'maz-ui/composables/useToast'
import { vClickOutside } from 'maz-ui/directives/vClickOutside'
```

### Index Imports (Good)

```typescript
// ✅ Good - tree-shakable
import { MazBtn, MazCard, MazInput } from 'maz-ui/components'
import { useToast, useBreakpoints } from 'maz-ui/composables'
```

### Avoid (Not Tree-Shakable)

```typescript
// ❌ Imports everything - large bundle
import * as MazUI from 'maz-ui'
```

## TypeScript Support

Maz-UI is written in TypeScript and provides full type definitions out of the box.

### Type Imports

```typescript
import type { MazBtnProps } from 'maz-ui/components/MazBtn'
import type { ToastOptions } from 'maz-ui/types'

// Component props types
const buttonProps: MazBtnProps = {
  color: 'primary',
  size: 'md',
  loading: false
}

// Toast options type
const toastOptions: ToastOptions = {
  position: 'top-right',
  timeout: 3000,
  persistent: false
}
```

## Common Setup Issues

### 1. Styles Not Loading

**Problem**: Components render but have no styling
**Solution**: Ensure `'maz-ui/styles'` is imported in `main.ts` BEFORE your CSS

```typescript
import 'maz-ui/styles' // Must come first
import './style.css'
```

### 2. TypeScript Errors

**Problem**: `Cannot find module 'maz-ui/components/MazBtn'`
**Solution**: Add Maz-UI types to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["maz-ui/types"]
  }
}
```

### 3. Auto-Import Not Working

**Problem**: Components not auto-imported despite resolver configuration
**Solution**:
1. Ensure resolvers are correctly added to `vite.config.ts`
2. Restart dev server
3. Check generated `.d.ts` files are created

### 4. Theme Not Applied

**Problem**: `useTheme()` throws error about plugin not installed
**Solution**: Verify MazUi plugin is installed with theme config:

```typescript
app.use(MazUi, {
  theme: { preset: mazUi }
})
```

## Next Steps

- **Theming**: Load `theming.md` for custom themes and dark mode
- **Components**: Load `components-*.md` for specific component guides
- **i18n**: Load `translations.md` for multi-language support
- **Nuxt**: Load `setup-nuxt.md` for Nuxt-specific setup
