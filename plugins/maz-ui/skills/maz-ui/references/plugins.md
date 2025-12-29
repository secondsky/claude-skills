# Maz-UI Plugins Reference

Comprehensive guide to all Maz-UI plugins for Vue 3 and Nuxt 3 applications.

## Overview

Maz-UI provides **4 powerful plugins** that extend your Vue/Nuxt application with essential functionality:

1. **MazUi** (Main Plugin) - Core plugin installation with theme and translations
2. **Toast** - User-friendly toast notifications
3. **Dialog** - Promise-based confirmation dialogs
4. **AOS** (Animations on Scroll) - Scroll-triggered animations
5. **Wait** - Global loading state management

**Key Features**:
- ✅ **Composable APIs** - Each plugin has a dedicated composable for easier usage
- ✅ **Auto-Imports** - Nuxt 3 automatically imports plugins and composables
- ✅ **TypeScript Support** - Full type safety with TypeScript
- ✅ **SSR Compatible** - Works with server-side rendering
- ✅ **Promise-Based** - Dialog plugin returns promises for async workflows
- ✅ **Global State** - Centralized state management for toasts, dialogs, and loading states

---

## 1. MazUi Plugin (Main Plugin)

The core plugin that initializes Maz-UI with theme, translations, and composable configuration.

### Vue 3 Installation

```typescript
import { createApp } from 'vue'
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes'
import { en } from '@maz-ui/translations'
import 'maz-ui/styles'
import App from './App.vue'

const app = createApp(App)

app.use(MazUi, {
  theme: {
    preset: mazUi, // or 'ocean', 'pristine', 'obsidian'
    dark: false // Enable dark mode by default
  },
  translations: {
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en }
  }
})

app.mount('#app')
```

### Nuxt 3 Installation

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],
  mazUi: {
    theme: {
      preset: 'maz-ui' // or 'ocean', 'pristine', 'obsidian'
    },
    translations: {
      locale: 'en',
      messages: {
        en: () => import('@maz-ui/translations/locales/en')
      }
    },
    composables: {
      useTheme: true,
      useTranslations: true,
      useToast: true,
      useDialog: true,
      useWait: true
    }
  }
})
```

### Plugin Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `theme.preset` | `Theme \| string` | Theme preset or custom theme object | `mazUi` |
| `theme.dark` | `boolean` | Enable dark mode by default | `false` |
| `translations.locale` | `string` | Default locale | `'en'` |
| `translations.fallbackLocale` | `string` | Fallback locale if translation missing | `'en'` |
| `translations.messages` | `object` | Translation messages object | `{}` |
| `translations.preloadFallback` | `boolean` | Preload fallback locale on init | `true` |

### Theme Presets

Maz-UI includes 4 built-in theme presets:

```typescript
import { mazUi, ocean, pristine, obsidian } from '@maz-ui/themes'

// Use in plugin options
app.use(MazUi, {
  theme: { preset: ocean } // Clean ocean-inspired palette
})
```

**Available Presets**:
- `mazUi` - Default Maz-UI theme (blue primary)
- `ocean` - Ocean-inspired (teal/cyan palette)
- `pristine` - Clean minimalist (grayscale)
- `obsidian` - Dark professional (charcoal/slate)

---

## 2. Toast Plugin

A powerful toast notification system for displaying user-friendly messages.

### Installation

**Vue 3**:
```typescript
import { createApp } from 'vue'
import { ToastPlugin, ToastOptions } from 'maz-ui/plugins/toast'

const app = createApp(App)

const toastOptions: ToastOptions = {
  position: 'bottom-right',
  timeout: 10_000,
  persistent: false,
}

app.use(ToastPlugin, toastOptions)
app.mount('#app')
```

**Nuxt 3**:
```typescript
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],
  mazUi: {
    composables: {
      useToast: true
    }
  }
})
```

### Basic Usage

```vue
<script setup>
import { useToast } from 'maz-ui/composables/useToast'

const toast = useToast()

// Display different toast types
toast.message('Default message')
toast.info('Info message')
toast.success('Success message')
toast.warning('Warning message')
toast.error('Error message')
</script>

<template>
  <MazBtn @click="toast.success('Task completed!')">
    Show Toast
  </MazBtn>
</template>
```

### Toast Options

```typescript
interface ToastOptions {
  /** Position of the toast on screen
   * @default 'bottom-right'
   */
  position?: 'top' | 'top-right' | 'top-left' |
             'bottom' | 'bottom-right' | 'bottom-left'

  /** Auto-close timeout in ms (false = no timeout)
   * @default 10000
   */
  timeout?: number | false

  /** Prevent user from closing toast
   * @default false
   */
  persistent?: boolean

  /** Display icon in toast
   * @default true
   */
  icon?: boolean

  /** Enable HTML content
   * @default false
   */
  html?: boolean

  /** Pause timeout on hover
   * @default true
   */
  pauseOnHover?: boolean

  /** Queue toasts instead of stacking
   * @default false
   */
  queue?: boolean

  /** Maximum number of toasts to display
   * @default false (unlimited)
   */
  maxToasts?: number | false

  /** Button configuration */
  button?: {
    text: string
    onClick?: () => unknown
    href?: string
    target?: '_self' | '_blank'
    closeToast?: boolean
  }
}
```

### Toast with Actions

**Link Button**:
```typescript
toast.info('New feature available!', {
  button: {
    href: 'https://example.com/features',
    target: '_blank',
    text: 'Learn More',
    closeToast: true
  }
})
```

**Action Button**:
```typescript
toast.warning('Unsaved changes', {
  button: {
    onClick: async () => {
      await saveData()
      toast.success('Changes saved')
    },
    text: 'Save Now',
    closeToast: true
  }
})
```

### Programmatic Close

```typescript
// Close toast after specific time
const toastInstance = toast.message('Processing...')

setTimeout(() => {
  toastInstance.close()
}, 3000)
```

### HTML Content

```typescript
toast.message(`
  <ul>
    <li>Item <b>1</b></li>
    <li>Item <b>2</b></li>
    <li>Item <b>3</b></li>
  </ul>
`, {
  html: true,
  position: 'top'
})
```

---

## 3. Dialog Plugin

Promise-based confirmation dialogs with flexible customization.

### Installation

**Vue 3**:
```typescript
import { createApp } from 'vue'
import { DialogPlugin, DialogOptions } from 'maz-ui/plugins/dialog'

const app = createApp(App)

app.use(DialogPlugin)
app.mount('#app')
```

**Nuxt 3**:
```typescript
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],
  mazUi: {
    composables: {
      useDialog: true
    }
  }
})
```

### Basic Usage

```vue
<script setup>
import { useDialog } from 'maz-ui/composables/useDialog'
import { useToast } from 'maz-ui/composables/useToast'

const dialog = useDialog()
const toast = useToast()

async function confirmDelete() {
  dialog.open({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    acceptText: 'Delete',
    rejectText: 'Cancel',
    onAccept: () => {
      // User clicked Delete
      toast.success('Item deleted')
    },
    onReject: () => {
      // User clicked Cancel
      toast.info('Deletion cancelled')
    }
  })
}
</script>

<template>
  <MazBtn @click="confirmDelete" color="destructive">
    Delete Item
  </MazBtn>
</template>
```

### Dialog Options

```typescript
interface DialogOptions {
  /** Dialog identifier for managing multiple dialogs
   * @default 'main-dialog'
   */
  identifier?: string

  /** Dialog title */
  title?: string

  /** Dialog message/content */
  message?: string

  /** Text for accept button
   * @default 'Confirm'
   */
  acceptText?: string

  /** Text for reject button
   * @default 'Cancel'
   */
  rejectText?: string

  /** Custom buttons (replaces default accept/reject) */
  buttons?: DialogButton[]

  /** Prevent closing on outside click
   * @default false
   */
  persistent?: boolean

  /** Callback when dialog is accepted */
  onAccept?: (response?: unknown) => unknown

  /** Callback when dialog is rejected */
  onReject?: (response?: unknown) => unknown

  /** Callback when dialog is closed */
  onClose?: () => unknown
}

interface DialogButton extends MazBtnProps {
  text: string
  type?: 'resolve' | 'reject'
  response?: unknown
  onClick?: () => unknown
}
```

### Custom Buttons

**With Actions**:
```typescript
dialog.open({
  title: 'Save Changes',
  message: 'Do you want to save your changes?',
  buttons: [
    {
      text: 'Discard',
      color: 'destructive',
      outlined: true,
      onClick: () => {
        toast.info('Changes discarded')
      }
    },
    {
      text: 'Save',
      color: 'success',
      onClick: async () => {
        await saveChanges()
        toast.success('Changes saved')
      }
    }
  ]
})
```

**With Custom Responses**:
```typescript
const { promise } = dialog.open({
  title: 'Choose Action',
  message: 'What would you like to do?',
  buttons: [
    {
      text: 'Cancel',
      type: 'reject',
      response: 'cancelled',
      color: 'contrast'
    },
    {
      text: 'Save Draft',
      type: 'resolve',
      response: 'draft',
      color: 'warning'
    },
    {
      text: 'Publish',
      type: 'resolve',
      response: 'publish',
      color: 'success'
    }
  ],
  onAccept: (response) => {
    if (response === 'draft') {
      saveDraft()
    } else if (response === 'publish') {
      publishPost()
    }
  }
})
```

### Programmatic Close

```typescript
const { close } = dialog.open({
  title: 'Processing',
  message: 'Please wait...',
  buttons: [],
  persistent: true
})

// Close after operation completes
setTimeout(() => {
  close()
}, 5000)
```

---

## 4. AOS Plugin (Animations on Scroll)

Scroll-triggered animations for creating engaging user experiences.

### Installation

**Vue 3**:
```typescript
import { createApp } from 'vue'
import router from './router'
import { AosPlugin, AosOptions } from 'maz-ui/plugins/aos'

// ⚠️ IMPORTANT: Import AOS styles
import 'maz-ui/aos-styles'

const app = createApp(App)
app.use(router)

const aosOptions: AosOptions = {
  animation: {
    duration: 1000,
    once: false,
    delay: 0
  },
  delay: 100,
  router
}

app.use(AosPlugin, aosOptions)
app.mount('#app')
```

**Nuxt 3**:
```typescript
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],
  mazUi: {
    composables: {
      useAos: {
        animation: {
          duration: 1000,
          once: false,
          delay: 0
        },
        delay: 100
      }
    }
  }
})
```

### Basic Usage

Add `data-maz-aos` attribute to any element:

```vue
<template>
  <!-- Simple fade-up animation -->
  <div data-maz-aos="fade-up">
    <h1>Animated Title</h1>
  </div>

  <!-- With custom duration and delay -->
  <div
    data-maz-aos="zoom-in"
    data-maz-aos-duration="1500"
    data-maz-aos-delay="300"
  >
    <p>Animated content</p>
  </div>

  <!-- Anchor to parent element -->
  <div id="parentCard" data-maz-aos="scale-out">
    <h2
      data-maz-aos="fade-down"
      data-maz-aos-anchor="#parentCard"
    >
      Title animates relative to parent
    </h2>
  </div>
</template>
```

### AOS Attributes

| Attribute | Description | Example | Default |
|-----------|-------------|---------|---------|
| `data-maz-aos` | Animation name | `fade-up` | - |
| `data-maz-aos-duration` | Animation duration (ms) | `50` to `3000` (step: 50) | `300` |
| `data-maz-aos-delay` | Animation delay (ms) | `50` to `3000` (step: 50) | `0` |
| `data-maz-aos-easing` | Timing function | `ease-in-sine` | `linear` |
| `data-maz-aos-once` | Fire only once | `true` | `false` |
| `data-maz-aos-anchor` | Anchor element (ID only) | `#selector` | `undefined` |

### Animation Types

**Fade Animations** (8 variants):
- `fade-up`, `fade-down`, `fade-left`, `fade-right`
- `fade-up-left`, `fade-up-right`, `fade-down-left`, `fade-down-right`

**Zoom Animations** (10 variants):
- `zoom-in`, `zoom-in-up`, `zoom-in-down`, `zoom-in-left`, `zoom-in-right`
- `zoom-out`, `zoom-out-up`, `zoom-out-down`, `zoom-out-left`, `zoom-out-right`

**Slide Animations** (4 variants):
- `slide-up`, `slide-down`, `slide-left`, `slide-right`

**Flip Animations** (4 variants):
- `flip-up`, `flip-down`, `flip-left`, `flip-right`

**Rotate Animations** (2 variants):
- `rotate-left`, `rotate-right`

**Scale Animations** (2 variants):
- `scale-in`, `scale-out`

### Easing Functions

Choose from 19 timing functions:

**Basic**: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`

**Back**: `ease-in-back`, `ease-out-back`, `ease-in-out-back`

**Sine**: `ease-in-sine`, `ease-out-sine`, `ease-in-out-sine`

**Quad**: `ease-in-quad`, `ease-out-quad`, `ease-in-out-quad`

**Cubic**: `ease-in-cubic`, `ease-out-cubic`, `ease-in-out-cubic`

**Quart**: `ease-in-quart`, `ease-out-quart`, `ease-in-out-quart`

### Programmatic Animations

Use `useAos()` composable to trigger animations programmatically:

```vue
<script setup>
import { useAos } from 'maz-ui/composables/useAos'
import { onMounted } from 'vue'

const aos = useAos()

onMounted(() => {
  // Run animations on mount (client-side only)
  aos.runAnimations()
})

// Re-run animations after dynamic content loads
async function loadContent() {
  await fetchData()
  aos.runAnimations()
}
</script>

<template>
  <div data-maz-aos="fade-up">
    Dynamic content
  </div>
</template>
```

### AOS Plugin Options

```typescript
interface AosOptions {
  /** Router instance to trigger animations on navigation
   * @default undefined
   */
  router?: Router

  /** Delay before starting animations (ms)
   * @default 100
   */
  delay?: number

  /** Intersection Observer options */
  observer?: {
    /** Scope animations to specific parent
     * @default undefined
     */
    root?: Element | Document | null

    /** Margin around elements to trigger animations
     * @default undefined
     * @example "100px"
     */
    rootMargin?: string

    /** Ratio corresponding to element size
     * @default 0.2
     */
    threshold?: number | number[]
  }

  /** Default animation settings */
  animation?: {
    /** Fire animation only once
     * @default true
     */
    once?: boolean

    /** Default duration (ms)
     * @default 300
     */
    duration?: number

    /** Default delay (ms)
     * @default 0
     */
    delay?: number
  }
}
```

---

## 5. Wait Plugin

Global loading state management for handling async operations.

### Installation

**Vue 3**:
```typescript
import { createApp } from 'vue'
import { WaitPlugin } from 'maz-ui/plugins/wait'

const app = createApp(App)

app.use(WaitPlugin)
app.mount('#app')
```

**Nuxt 3**:
```typescript
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],
  mazUi: {
    composables: {
      useWait: true
    }
  }
})
```

### Basic Usage

```vue
<script setup>
import { useWait } from 'maz-ui/composables/useWait'
import { ref } from 'vue'

const wait = useWait()
const submitted = ref(false)

async function submitData() {
  submitted.value = false
  wait.start('DATA_SUBMITTING')

  try {
    await api.submitData()
    submitted.value = true
  } finally {
    wait.stop('DATA_SUBMITTING')
  }
}
</script>

<template>
  <MazBtn
    @click="submitData"
    :loading="wait.isLoading('DATA_SUBMITTING')"
  >
    Submit Data
  </MazBtn>

  <div v-if="submitted">
    Data submitted successfully!
  </div>
</template>
```

### Wait API

```typescript
interface UseWait {
  /** Start loading state for identifier */
  start(identifier: string): void

  /** Stop loading state for identifier */
  stop(identifier: string): void

  /** Check if identifier is loading */
  isLoading(identifier: string): boolean

  /** Get all active loading identifiers */
  getActiveLoading(): string[]

  /** Stop all loading states */
  stopAll(): void
}
```

### Multiple Loading States

Track multiple operations independently:

```vue
<script setup>
import { useWait } from 'maz-ui/composables/useWait'

const wait = useWait()

async function savePost() {
  wait.start('SAVE_POST')
  await api.savePost()
  wait.stop('SAVE_POST')
}

async function publishPost() {
  wait.start('PUBLISH_POST')
  await api.publishPost()
  wait.stop('PUBLISH_POST')
}

async function deletePost() {
  wait.start('DELETE_POST')
  await api.deletePost()
  wait.stop('DELETE_POST')
}
</script>

<template>
  <MazBtn
    @click="savePost"
    :loading="wait.isLoading('SAVE_POST')"
  >
    Save
  </MazBtn>

  <MazBtn
    @click="publishPost"
    :loading="wait.isLoading('PUBLISH_POST')"
    color="success"
  >
    Publish
  </MazBtn>

  <MazBtn
    @click="deletePost"
    :loading="wait.isLoading('DELETE_POST')"
    color="destructive"
  >
    Delete
  </MazBtn>
</template>
```

### Global Loading Indicator

Check if any operation is loading:

```vue
<script setup>
import { useWait } from 'maz-ui/composables/useWait'
import { computed } from 'vue'

const wait = useWait()

const isAnyLoading = computed(() => {
  return wait.getActiveLoading().length > 0
})
</script>

<template>
  <MazFullscreenLoader v-if="isAnyLoading" />

  <div v-else>
    <!-- App content -->
  </div>
</template>
```

---

## Plugin Installation Patterns

### Vue 3 Complete Setup

```typescript
import { createApp } from 'vue'
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { ToastPlugin } from 'maz-ui/plugins/toast'
import { DialogPlugin } from 'maz-ui/plugins/dialog'
import { AosPlugin } from 'maz-ui/plugins/aos'
import { WaitPlugin } from 'maz-ui/plugins/wait'
import { mazUi } from '@maz-ui/themes'
import { en } from '@maz-ui/translations'
import 'maz-ui/styles'
import 'maz-ui/aos-styles'
import router from './router'
import App from './App.vue'

const app = createApp(App)

// Core plugin
app.use(MazUi, {
  theme: { preset: mazUi },
  translations: { messages: { en } }
})

// Toast notifications
app.use(ToastPlugin, {
  position: 'bottom-right',
  timeout: 5000
})

// Dialogs
app.use(DialogPlugin)

// Animations on scroll
app.use(AosPlugin, {
  router,
  animation: { duration: 800, once: true }
})

// Loading states
app.use(WaitPlugin)

app.mount('#app')
```

### Nuxt 3 Complete Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],

  mazUi: {
    // Theme configuration
    theme: {
      preset: 'ocean'
    },

    // Translations
    translations: {
      locale: 'en',
      messages: {
        en: () => import('@maz-ui/translations/locales/en')
      }
    },

    // Enable all composables
    composables: {
      useTheme: true,
      useTranslations: true,
      useToast: true,
      useDialog: true,
      useWait: true,
      useAos: {
        animation: {
          duration: 800,
          once: true
        }
      }
    }
  }
})
```

---

## Best Practices

### 1. Toast Notifications

**DO**:
- Use appropriate toast types (info, success, warning, error)
- Set reasonable timeouts (3-10 seconds)
- Provide action buttons for important notifications
- Use `pauseOnHover: true` for complex messages

**DON'T**:
- Display too many toasts simultaneously (use `maxToasts`)
- Use persistent toasts without user dismissal option
- Put critical actions in toasts (use dialogs instead)

```typescript
// ✅ Good: Clear message with action
toast.success('Profile updated', {
  timeout: 5000,
  button: {
    text: 'View Profile',
    href: '/profile'
  }
})

// ❌ Bad: No timeout and unclear message
toast.message('Done', { timeout: false })
```

### 2. Dialogs

**DO**:
- Use clear, actionable button text
- Provide context in dialog message
- Handle both accept and reject callbacks
- Use `persistent: true` for critical confirmations

**DON'T**:
- Use dialogs for informational messages (use toasts)
- Create dialogs with ambiguous buttons
- Forget to handle rejection cases

```typescript
// ✅ Good: Clear confirmation with consequences
dialog.open({
  title: 'Delete Account',
  message: 'This action cannot be undone. All your data will be permanently deleted.',
  acceptText: 'Delete Account',
  rejectText: 'Keep Account',
  persistent: true,
  onAccept: () => deleteAccount(),
  onReject: () => toast.info('Account deletion cancelled')
})

// ❌ Bad: Unclear dialog
dialog.open({
  title: 'Confirm',
  message: 'Are you sure?',
  acceptText: 'Yes'
})
```

### 3. Animations on Scroll

**DO**:
- Use `once: true` for better performance
- Choose appropriate animation durations (300-1000ms)
- Use anchors for synchronized animations
- Limit animations on mobile devices

**DON'T**:
- Animate too many elements simultaneously
- Use very long durations (> 2s)
- Apply animations to frequently scrolled content

```vue
<!-- ✅ Good: Subtle, performant animations -->
<div
  data-maz-aos="fade-up"
  data-maz-aos-duration="600"
  data-maz-aos-once="true"
>
  Content
</div>

<!-- ❌ Bad: Excessive animation -->
<div
  data-maz-aos="flip-left"
  data-maz-aos-duration="3000"
  data-maz-aos-delay="2000"
>
  Content
</div>
```

### 4. Loading States

**DO**:
- Use descriptive identifiers (e.g., `'SAVE_POST'`, `'FETCH_USERS'`)
- Always stop loading states in `finally` blocks
- Provide visual feedback (loading buttons, overlays)
- Use global loading for critical operations

**DON'T**:
- Use generic identifiers (e.g., `'LOADING'`)
- Forget to stop loading states on errors
- Leave loading states active indefinitely

```typescript
// ✅ Good: Proper error handling
async function fetchData() {
  wait.start('FETCH_DATA')
  try {
    const data = await api.getData()
    return data
  } catch (error) {
    toast.error('Failed to fetch data')
  } finally {
    wait.stop('FETCH_DATA')
  }
}

// ❌ Bad: No error handling, no cleanup
async function fetchData() {
  wait.start('LOADING')
  const data = await api.getData()
  wait.stop('LOADING')
  return data
}
```

---

## Troubleshooting

### Toast Plugin Issues

**Issue**: Toasts not appearing

**Causes & Solutions**:
1. **Plugin not installed**
   ```typescript
   // Vue: Ensure ToastPlugin is installed
   app.use(ToastPlugin)

   // Nuxt: Enable composable
   mazUi: { composables: { useToast: true } }
   ```

2. **Z-index conflicts**
   ```css
   /* Increase toast z-index in global styles */
   .m-toast {
     z-index: 10000 !important;
   }
   ```

**Issue**: Toast HTML not rendering

**Solution**: Enable HTML mode explicitly
```typescript
toast.message('<b>Bold text</b>', { html: true })
```

### Dialog Plugin Issues

**Issue**: Dialog promise not resolving

**Solution**: Ensure button `type` is set correctly
```typescript
buttons: [
  { text: 'Cancel', type: 'reject' },
  { text: 'Confirm', type: 'resolve' }
]
```

**Issue**: Multiple dialogs overlapping

**Solution**: Use unique identifiers
```typescript
dialog.open({ identifier: 'delete-dialog', ... })
dialog.open({ identifier: 'save-dialog', ... })
```

### AOS Plugin Issues

**Issue**: Animations not triggering

**Causes & Solutions**:
1. **Missing CSS import**
   ```typescript
   // Add to main.ts (Vue) or nuxt.config.ts (Nuxt)
   import 'maz-ui/aos-styles'
   ```

2. **Router not provided**
   ```typescript
   // Pass router to trigger animations on navigation
   app.use(AosPlugin, { router })
   ```

3. **Elements not in viewport**
   ```typescript
   // Increase threshold for earlier triggering
   app.use(AosPlugin, {
     observer: { threshold: 0.5 }
   })
   ```

**Issue**: Animations fire multiple times

**Solution**: Use `once: true` for single-fire animations
```html
<div data-maz-aos="fade-up" data-maz-aos-once="true">
  Content
</div>
```

### Wait Plugin Issues

**Issue**: Loading state stuck active

**Solution**: Always use `finally` block
```typescript
try {
  wait.start('OPERATION')
  await operation()
} finally {
  wait.stop('OPERATION') // Guaranteed to run
}
```

**Issue**: Multiple loading states interfering

**Solution**: Use specific identifiers
```typescript
// ✅ Good: Specific identifiers
wait.start('SAVE_POST')
wait.start('FETCH_COMMENTS')

// ❌ Bad: Generic identifier
wait.start('LOADING')
```

---

## SSR Compatibility

### Toast Plugin
- ✅ **SSR Safe** - Toast state is client-only
- Mount toast calls inside `onMounted()` or client-side event handlers
- No hydration issues

### Dialog Plugin
- ✅ **SSR Safe** - Dialog state is client-only
- Open dialogs in response to user interactions (client-side)
- No hydration issues

### AOS Plugin
- ⚠️ **Client-Side Only** - Requires DOM and Intersection Observer
- In Nuxt, plugin runs automatically on client
- Use `useAos().runAnimations()` in `onMounted()` for manual control

### Wait Plugin
- ✅ **SSR Safe** - Loading state is reactive and works server/client
- State persists across hydration
- No special handling needed

---

## Plugin Ecosystem Summary

| Plugin | Purpose | Composable | SSR Safe | Key Features |
|--------|---------|-----------|----------|--------------|
| **MazUi** | Core setup | `useTheme()`, `useTranslations()` | ✅ | Theme, i18n, config |
| **Toast** | Notifications | `useToast()` | ✅ | Positions, timeouts, actions |
| **Dialog** | Confirmations | `useDialog()` | ✅ | Promises, custom buttons |
| **AOS** | Scroll animations | `useAos()` | ⚠️ Client-only | 40+ animations, easing |
| **Wait** | Loading states | `useWait()` | ✅ | Global state, multi-tracking |

---

## Related Documentation

- **[Composables Reference](./composables.md)** - Detailed composable APIs (useToast, useDialog, useWait, useAos)
- **[Theming Guide](./theming.md)** - Custom themes, CSS variables, dark mode
- **[Translations Guide](./translations.md)** - i18n setup, lazy loading, custom locales
- **[Setup Vue](./setup-vue.md)** - Vue 3 installation and configuration
- **[Setup Nuxt](./setup-nuxt.md)** - Nuxt 3 module setup with auto-imports

---

**Version**: Maz-UI v4.3.3
**Last Updated**: 2025-12-29
**Official Docs**: https://maz-ui.com/plugins
