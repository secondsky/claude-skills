# Maz-UI Composables Guide

Maz-UI provides 14+ Vue composables for theming, UI interactions, utilities, and form validation. All composables use Vue 3 Composition API and are fully typed with TypeScript.

**Last Verified**: 2025-12-29 | **Maz-UI Version**: 4.3.3

## Overview

Composables are Vue 3 composition functions that encapsulate and reuse stateful logic. Maz-UI's composables cover:

- **Theming**: Dark mode, theme switching (`useTheme`)
- **Translations**: i18n management (`useTranslations`)
- **UI Interactions**: Toasts, dialogs, loading states (`useToast`, `useDialog`, `useWait`)
- **Utilities**: Responsive design, timers, gestures, idle detection
- **Forms**: Comprehensive validation with Valibot integration (`useFormValidator`, `useFormField`)

---

## Theming

### useTheme()

Manages theme and dark mode for Maz-UI applications.

**Installation Required**: MazUi plugin must be installed with theme option enabled.

```typescript
// Vue 3
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { mazUi } from '@maz-ui/themes'

app.use(MazUi, {
  theme: { preset: mazUi }
})

// Nuxt 3
export default defineNuxtConfig({
  mazUi: {
    composables: { useTheme: true },
    theme: { preset: 'maz-ui' }
  }
})
```

**API**:

| Property/Method | Type | Description |
|----------------|------|-------------|
| `theme` | `Ref<string>` | Current theme name (`'light'` or `'dark'`) |
| `toggleTheme()` | `() => void` | Toggle between light and dark mode |
| `setTheme(theme)` | `(theme: 'light' \| 'dark') => void` | Set specific theme |
| `isDark` | `ComputedRef<boolean>` | True if dark mode is active |

**Usage Example**:

```vue
<script setup lang="ts">
import { useTheme } from 'maz-ui/composables'

const { theme, toggleTheme, isDark } = useTheme()
</script>

<template>
  <div>
    <p>Current theme: {{ theme }}</p>
    <p>Dark mode: {{ isDark }}</p>
    <MazBtn @click="toggleTheme">
      Toggle Theme
    </MazBtn>
  </div>
</template>
```

**SSR Compatibility**: ✅ Full support with automatic theme persistence

**Common Use Cases**:
- Theme toggle buttons in app headers
- Automatic dark mode based on system preferences
- Per-user theme preferences stored in localStorage

---

## Translations

### useTranslations()

Manages i18n (internationalization) for Maz-UI components.

**Installation Required**: MazUi plugin with translations configuration.

```typescript
import { MazUi } from 'maz-ui/plugins/maz-ui'
import { fr, es } from '@maz-ui/translations'

app.use(MazUi, {
  translations: {
    locale: 'fr',
    fallbackLocale: 'en',
    preloadFallback: true,
    messages: { fr, es }
  }
})
```

**API**:

| Property/Method | Type | Description |
|----------------|------|-------------|
| `locale` | `Ref<string>` | Current locale (e.g., 'en', 'fr') |
| `setLocale(locale)` | `(locale: string) => Promise<void>` | Switch to different locale (async for lazy loading) |
| `t(key, variables?)` | `(key: string, vars?: Record<string, any>) => string` | Translate a key with optional variable substitution |

**Usage Example**:

```vue
<script setup lang="ts">
import { useTranslations, useToast } from 'maz-ui/composables'

const { locale, setLocale } = useTranslations()
const toast = useToast()

async function switchLanguage(newLocale: string) {
  try {
    await setLocale(newLocale)
    toast.success(`Language changed to ${newLocale}`)
  } catch (error) {
    toast.error('Failed to load translations')
  }
}
</script>

<template>
  <MazSelect
    v-model="locale"
    :options="[
      { label: 'English', value: 'en' },
      { label: 'Français', value: 'fr' }
    ]"
    @update:model-value="switchLanguage"
  />
</template>
```

**SSR Compatibility**: ✅ Requires immediate loading for initial locale to prevent hydration mismatch

**Important Notes**:
- Always `await` `setLocale()` when lazy loading translations
- Use `preloadFallback: true` to prevent raw translation keys from showing
- For SSR (Nuxt), provide initial locale immediately (not as lazy function)

---

## UI Interactions

### useToast()

Display toast notifications (success, error, warning, info, custom).

**Installation Required**: Toast plugin must be installed.

```typescript
// Vue 3
import { MazToast } from 'maz-ui/plugins/toast'
app.use(MazToast)

// Nuxt 3 - auto-enabled with @maz-ui/nuxt module
```

**API**:

| Method | Signature | Description |
|--------|-----------|-------------|
| `success(message, options?)` | `(msg: string, opts?: ToastOptions) => void` | Show success toast (green) |
| `error(message, options?)` | `(msg: string, opts?: ToastOptions) => void` | Show error toast (red) |
| `warning(message, options?)` | `(msg: string, opts?: ToastOptions) => void` | Show warning toast (orange) |
| `info(message, options?)` | `(msg: string, opts?: ToastOptions) => void` | Show info toast (blue) |
| `message(message, options?)` | `(msg: string, opts?: ToastOptions) => void` | Show neutral toast (gray) |

**ToastOptions**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | `'top' \| 'top-right' \| 'top-left' \| 'bottom' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Toast position |
| `timeout` | `number` | `10000` | Auto-close timeout (ms), `false` for persistent |
| `button` | `{ text: string, onClick?: () => void, href?: string, closeToast?: boolean }` | - | Action button |
| `persistent` | `boolean` | `false` | Prevent auto-close |

**Usage Example**:

```vue
<script setup lang="ts">
import { useToast } from 'maz-ui/composables'

const toast = useToast()

async function handleSubmit() {
  try {
    await submitForm()
    toast.success('Form submitted successfully!', {
      position: 'bottom',
      button: {
        text: 'View',
        href: '/submissions',
        closeToast: true
      }
    })
  } catch (error) {
    toast.error('Submission failed. Please try again.', {
      timeout: 5000
    })
  }
}
</script>

<template>
  <MazBtn @click="handleSubmit">Submit</MazBtn>
</template>
```

**Best Practices**:
- Use appropriate toast type for context (success for confirmations, error for failures)
- Keep messages concise (1-2 sentences)
- Use action buttons for navigation or undo actions
- Set shorter `timeout` for less critical messages

---

### useDialog()

Programmatically open confirmation dialogs without template code.

**Installation Required**: Dialog plugin must be installed.

```typescript
// Vue 3
import { MazDialog } from 'maz-ui/plugins/dialog'
app.use(MazDialog)

// Nuxt 3 - auto-enabled with @maz-ui/nuxt module
```

**API**:

| Method | Signature | Description |
|--------|-----------|-------------|
| `open(options)` | `(opts: DialogOptions) => void` | Open dialog with configuration |

**DialogOptions**:

| Option | Type | Description |
|--------|------|-------------|
| `title` | `string` | Dialog title |
| `message` | `string` | Dialog message/content |
| `onAccept` | `(response: DialogResponse) => void` | Callback when user confirms |
| `onReject` | `(response: DialogResponse) => void` | Callback when user cancels |
| `acceptText` | `string` | Custom accept button text (default: "Accept") |
| `rejectText` | `string` | Custom reject button text (default: "Cancel") |
| `persistent` | `boolean` | Prevent closing on backdrop click |

**Usage Example**:

```vue
<script setup lang="ts">
import { useDialog, useToast } from 'maz-ui/composables'

const dialog = useDialog()
const toast = useToast()

function confirmDelete() {
  dialog.open({
    title: 'Delete Account',
    message: 'Are you sure you want to delete your account? This action cannot be undone.',
    acceptText: 'Delete',
    rejectText: 'Cancel',
    onAccept: async () => {
      await deleteAccount()
      toast.success('Account deleted', { position: 'bottom' })
    },
    onReject: () => {
      toast.info('Deletion cancelled', { position: 'bottom' })
    }
  })
}
</script>

<template>
  <MazBtn color="danger" @click="confirmDelete">
    Delete Account
  </MazBtn>
</template>
```

**Best Practices**:
- Always provide clear `title` and `message`
- Use for destructive actions (delete, logout, etc.)
- Provide custom button text that describes the action
- Handle both `onAccept` and `onReject` callbacks

---

### useWait()

Manage global loading states with named waiters.

**Installation Required**: Wait plugin must be installed.

```typescript
// Vue 3
import { MazWait } from 'maz-ui/plugins/wait'
app.use(MazWait)

// Nuxt 3 - auto-enabled with @maz-ui/nuxt module
```

**API**:

| Method | Signature | Description |
|--------|-----------|-------------|
| `start(name)` | `(name: string) => void` | Start named loader |
| `stop(name)` | `(name: string) => void` | Stop named loader |
| `isLoading(name)` | `(name: string) => boolean` | Check if specific loader is active |
| `isLoading()` | `() => boolean` | Check if any loader is active |

**Usage Example**:

```vue
<script setup lang="ts">
import { useWait } from 'maz-ui/composables'
import { onMounted } from 'vue'

const wait = useWait()

async function loadData() {
  wait.start('FETCH_DATA')
  try {
    const data = await fetchData()
    // Process data
  } finally {
    wait.stop('FETCH_DATA')
  }
}

onMounted(loadData)
</script>

<template>
  <MazFullscreenLoader v-if="wait.isLoading('FETCH_DATA')">
    Loading data...
  </MazFullscreenLoader>
  <div v-else>
    <!-- Content -->
  </div>
</template>
```

**Best Practices**:
- Use descriptive waiter names (e.g., 'FETCH_USERS', 'SUBMIT_FORM')
- Always use try/finally to ensure `stop()` is called
- Use different waiter names for independent loading states
- Use `isLoading()` without argument to check global loading state

---

## Utilities

### useBreakpoints()

Manage responsive breakpoints for adaptive layouts.

**Installation**: No plugin required (works standalone)

**API**:

| Property | Type | Description |
|----------|------|-------------|
| `isSmallScreen` | `ComputedRef<boolean>` | True if width < medium breakpoint |
| `isMediumScreen` | `ComputedRef<boolean>` | True if width >= medium and < large |
| `isLargeScreen` | `ComputedRef<boolean>` | True if width >= large breakpoint |
| `width` | `Ref<number>` | Current window width |
| `height` | `Ref<number>` | Current window height |

**Configuration**:

```typescript
const breakpoints = {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}

const {
  isLargeScreen,
  isMediumScreen,
  isSmallScreen,
} = useBreakpoints({
  breakpoints,
  initialWidth: 0,
  mediumBreakPoint: 'md',
  largeBreakPoint: 'lg',
})
```

**Usage Example**:

```vue
<script setup lang="ts">
import { useBreakpoints } from 'maz-ui/composables'

const { isSmallScreen, isMediumScreen, isLargeScreen } = useBreakpoints({
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px'
  },
  mediumBreakPoint: 'md',
  largeBreakPoint: 'lg'
})
</script>

<template>
  <div>
    <div v-if="isSmallScreen">Mobile view</div>
    <div v-else-if="isMediumScreen">Tablet view</div>
    <div v-else-if="isLargeScreen">Desktop view</div>
  </div>
</template>
```

**SSR Compatibility**: ⚠️ Use `initialWidth` prop for server-side rendering

---

### useWindowSize()

Track window dimensions reactively.

**Installation**: No plugin required

**API**:

| Property | Type | Description |
|----------|------|-------------|
| `width` | `Ref<number>` | Current window width in pixels |
| `height` | `Ref<number>` | Current window height in pixels |

**Usage Example**:

```vue
<script setup lang="ts">
import { useWindowSize } from 'maz-ui/composables'

const { width, height } = useWindowSize()
</script>

<template>
  <div>
    Window size: {{ width }}x{{ height }}
  </div>
</template>
```

**Performance**: Uses debounced resize listener to avoid excessive updates

---

### useTimer()

Create countdown/countup timers with pause/resume/reset.

**Installation**: No plugin required

**API**:

| Property/Method | Type | Description |
|----------------|------|-------------|
| `time` | `Ref<number>` | Current time value |
| `isRunning` | `Ref<boolean>` | True if timer is active |
| `start()` | `() => void` | Start/resume timer |
| `pause()` | `() => void` | Pause timer |
| `reset()` | `() => void` | Reset to initial value |

**Usage Example - OTP Timer**:

```vue
<script setup lang="ts">
import { useTimer } from 'maz-ui/composables'

const { time, isRunning, start, reset } = useTimer({
  initialTime: 60,
  countdown: true,
  onComplete: () => {
    console.log('OTP expired')
  }
})

function resendOTP() {
  reset()
  start()
  // Send new OTP
}
</script>

<template>
  <div>
    <p v-if="isRunning">Resend OTP in {{ time }}s</p>
    <MazBtn v-else @click="resendOTP">Resend OTP</MazBtn>
  </div>
</template>
```

---

### useSwipe()

Detect swipe gestures for touch interactions.

**Installation**: No plugin required

**API**:

| Property | Type | Description |
|----------|------|-------------|
| `direction` | `Ref<'left' \| 'right' \| 'up' \| 'down' \| null>` | Detected swipe direction |
| `onSwipe(callback)` | `(cb: (dir: SwipeDirection) => void) => void` | Register swipe callback |

**Usage Example - Mobile Carousel**:

```vue
<script setup lang="ts">
import { useSwipe } from 'maz-ui/composables'
import { ref } from 'vue'

const currentSlide = ref(0)
const { onSwipe } = useSwipe()

onSwipe((direction) => {
  if (direction === 'left') {
    currentSlide.value = Math.min(currentSlide.value + 1, totalSlides - 1)
  } else if (direction === 'right') {
    currentSlide.value = Math.max(currentSlide.value - 1, 0)
  }
})
</script>

<template>
  <div class="carousel">
    <img :src="slides[currentSlide]" />
  </div>
</template>
```

---

### useIdleTimeout()

Detect user inactivity for auto-logout or session warnings.

**Installation**: No plugin required

**API**:

| Property/Method | Type | Description |
|----------------|------|-------------|
| `isIdle` | `Ref<boolean>` | True if user is idle |
| `idleTime` | `Ref<number>` | Time elapsed since last activity (ms) |
| `reset()` | `() => void` | Reset idle timer |

**Usage Example - Session Timeout Warning**:

```vue
<script setup lang="ts">
import { useIdleTimeout, useDialog } from 'maz-ui/composables'
import { watch } from 'vue'

const { isIdle, reset } = useIdleTimeout({
  timeout: 5 * 60 * 1000, // 5 minutes
  events: ['mousemove', 'keydown', 'click']
})

const dialog = useDialog()

watch(isIdle, (idle) => {
  if (idle) {
    dialog.open({
      title: 'Session Timeout Warning',
      message: 'You will be logged out in 1 minute due to inactivity.',
      acceptText: 'Stay Logged In',
      onAccept: () => {
        reset()
      },
      onReject: () => {
        logout()
      }
    })
  }
})
</script>
```

---

### useUserVisibility()

Detect page visibility changes (tab switch, minimize).

**Installation**: No plugin required

**API**:

| Property | Type | Description |
|----------|------|-------------|
| `isVisible` | `Ref<boolean>` | True if page is visible |
| `onVisibilityChange(callback)` | `(cb: (visible: boolean) => void) => void` | Register visibility callback |

**Usage Example - Video Player Pause**:

```vue
<script setup lang="ts">
import { useUserVisibility } from 'maz-ui/composables'
import { ref, watch } from 'vue'

const { isVisible } = useUserVisibility()
const videoRef = ref<HTMLVideoElement>()

watch(isVisible, (visible) => {
  if (!visible && videoRef.value) {
    videoRef.value.pause()
  }
})
</script>

<template>
  <video ref="videoRef" src="/video.mp4" />
</template>
```

---

### useReadingTime()

Calculate estimated reading time for text content.

**Installation**: No plugin required

**API**:

| Method | Signature | Description |
|--------|-----------|-------------|
| `calculateReadingTime(text)` | `(text: string, wpm?: number) => number` | Returns reading time in minutes |

**Usage Example - Blog Post Reading Time**:

```vue
<script setup lang="ts">
import { useReadingTime } from 'maz-ui/composables'
import { computed } from 'vue'

const props = defineProps<{ content: string }>()

const readingTime = computed(() => {
  const { calculateReadingTime } = useReadingTime()
  return calculateReadingTime(props.content, 200) // 200 words per minute
})
</script>

<template>
  <p>{{ readingTime }} min read</p>
</template>
```

---

### useStringMatching()

Fuzzy search and highlighting utilities.

**Installation**: No plugin required

**API**:

| Method | Signature | Description |
|--------|-----------|-------------|
| `fuzzyMatch(query, text)` | `(query: string, text: string) => boolean` | Test if query matches text (fuzzy) |
| `highlight(query, text)` | `(query: string, text: string) => string` | Return text with `<mark>` tags around matches |

**Usage Example - Search Autocomplete**:

```vue
<script setup lang="ts">
import { useStringMatching } from 'maz-ui/composables'
import { ref, computed } from 'vue'

const { fuzzyMatch, highlight } = useStringMatching()

const searchQuery = ref('')
const items = ref(['Apple', 'Banana', 'Cherry', 'Date'])

const filteredItems = computed(() => {
  return items.value
    .filter(item => fuzzyMatch(searchQuery.value, item))
    .map(item => ({
      text: item,
      highlighted: highlight(searchQuery.value, item)
    }))
})
</script>

<template>
  <MazInput v-model="searchQuery" placeholder="Search..." />
  <div v-for="item in filteredItems" :key="item.text">
    <span v-html="item.highlighted" />
  </div>
</template>
```

---

### useDisplayNames()

Get localized display names for countries, languages, currencies.

**Installation**: No plugin required

**API**:

| Method | Signature | Description |
|--------|-----------|-------------|
| `getCountryName(code, locale)` | `(code: string, locale: string) => string` | Get country name in specific locale |
| `getLanguageName(code, locale)` | `(code: string, locale: string) => string` | Get language name in specific locale |

**Usage Example**:

```vue
<script setup lang="ts">
import { useDisplayNames } from 'maz-ui/composables'

const { getCountryName, getLanguageName } = useDisplayNames()

const countryName = getCountryName('US', 'en') // "United States"
const languageName = getLanguageName('fr', 'en') // "French"
</script>
```

---

## Forms

### useFormValidator()

Comprehensive form validation using Valibot schemas with multiple validation modes.

**Installation**: Valibot peer dependency required

```bash
pnpm add valibot
```

**API**:

| Property/Method | Type | Description |
|----------------|------|-------------|
| `model` | `Ref<Model>` | Form data model (reactive) |
| `isValid` | `ComputedRef<boolean>` | True if entire form is valid |
| `isDirty` | `ComputedRef<boolean>` | True if form has been modified |
| `isSubmitting` | `Ref<boolean>` | True during form submission |
| `isSubmitted` | `Ref<boolean>` | True after form submission |
| `errors` | `ComputedRef<Record<string, ValidationIssues>>` | Validation errors per field |
| `errorMessages` | `ComputedRef<Record<string, string>>` | First error message per field |
| `fieldsStates` | `FieldsStates` | Validation state per field |
| `validateForm()` | `(setErrors?: boolean) => Promise<boolean>` | Manually validate entire form |
| `handleSubmit(callback)` | `(callback: (data: Model) => void) => (e: Event) => void` | Form submission handler |

**Validation Modes**:

| Mode | Behavior | Use Case |
|------|----------|----------|
| `lazy` | Validate on value change | Simple forms (default) |
| `aggressive` | Validate all fields immediately | Real-time validation |
| `eager` | Validate on blur (if not empty), then on change | Recommended for UX |
| `blur` | Validate only on focus loss | Minimal interruption |
| `progressive` | Field becomes valid after first success, shows error on blur | Best UX for complex forms |

**Basic Usage (Lazy Mode)**:

```vue
<script setup lang="ts">
import { useFormValidator, useToast } from 'maz-ui/composables'
import { pipe, string, nonEmpty, number, minValue, maxValue } from 'valibot'

const schema = {
  name: pipe(
    string('Name is required'),
    nonEmpty('Name is required')
  ),
  age: pipe(
    number('Age is required'),
    minValue(18, 'Must be 18 or older'),
    maxValue(100, 'Must be under 100')
  )
}

const { model, isSubmitting, errorMessages, fieldsStates, handleSubmit } =
  useFormValidator({ schema })

const toast = useToast()

const onSubmit = handleSubmit(async (formData) => {
  await submitToAPI(formData)
  toast.success('Form submitted!')
})
</script>

<template>
  <form @submit="onSubmit">
    <MazInput
      v-model="model.name"
      label="Name"
      :hint="errorMessages.name"
      :error="!!errorMessages.name"
      :success="fieldsStates.name.valid"
    />
    <MazInput
      v-model="model.age"
      type="number"
      label="Age"
      :hint="errorMessages.age"
      :error="!!errorMessages.age"
      :success="fieldsStates.age.valid"
    />
    <MazBtn type="submit" :loading="isSubmitting">
      Submit
    </MazBtn>
  </form>
</template>
```

**Advanced: Throttling & Debouncing**:

```typescript
const { model, errorMessages } = useFormValidator({
  schema,
  options: {
    debouncedFields: { name: 500 }, // Wait 500ms after typing
    throttledFields: { age: true } // Throttle validation (1000ms default)
  }
})
```

**Advanced: Async Validation**:

```typescript
import { pipeAsync, checkAsync } from 'valibot'

const schema = {
  username: pipeAsync(
    string('Username is required'),
    nonEmpty('Username is required'),
    checkAsync(
      async (username) => {
        const available = await checkUsername(username)
        return available
      },
      'Username is already taken'
    )
  )
}
```

**TypeScript Type Safety**:

```typescript
// Automatic type inference from schema
const schema = {
  name: pipe(string(), nonEmpty()),
  age: pipe(number(), minValue(18))
}

const { model } = useFormValidator({ schema })
// model.name is string
// model.age is number
```

**See Also**: `references/form-validation.md` for comprehensive examples and patterns

---

### useFormField()

Fine-grained control over individual form fields with per-field validation modes.

**Prerequisites**: Must be used with `useFormValidator` initialized first

**API**:

| Property/Method | Type | Description |
|----------------|------|-------------|
| `value` | `WritableComputedRef<T>` | Field value (reactive, typed) |
| `errors` | `ComputedRef<ValidationIssues>` | Field validation errors |
| `errorMessage` | `ComputedRef<string>` | First error message |
| `isValid` | `ComputedRef<boolean>` | True if field is valid |
| `isDirty` | `ComputedRef<boolean>` | True if field modified |
| `hasError` | `ComputedRef<boolean>` | True if field has errors |
| `isValidating` | `ComputedRef<boolean>` | True during async validation |
| `validationEvents` | `ComputedRef<{ onBlur?: () => void }>` | Events to bind with `v-bind` |

**Usage with Eager Mode** (recommended):

```vue
<script setup lang="ts">
import { useFormValidator, useFormField } from 'maz-ui/composables'
import { useTemplateRef } from 'vue'

const schema = {
  email: pipe(string(), nonEmpty(), email())
}

useFormValidator({
  schema,
  options: { mode: 'eager', identifier: 'signup-form' }
})

// Method 1: Using ref for automatic event binding
const { value: email, hasError, errorMessage } = useFormField<string>('email', {
  ref: useTemplateRef('emailRef'),
  formIdentifier: 'signup-form'
})
</script>

<template>
  <MazInput
    ref="emailRef"
    v-model="email"
    label="Email"
    :hint="errorMessage"
    :error="hasError"
  />
</template>
```

**Usage with Progressive Mode**:

```vue
<script setup lang="ts">
const { value, hasError, errorMessage, validationEvents } = useFormField<string>('name', {
  mode: 'progressive',
  formIdentifier: 'contact-form'
})
</script>

<template>
  <MazInput
    v-model="value"
    v-bind="validationEvents"
    label="Name"
    :hint="errorMessage"
    :error="hasError"
  />
</template>
```

**Multiple Forms on Same Page**:

```typescript
// Form 1
const form1 = useFormValidator({
  schema: schema1,
  options: { identifier: 'login-form' }
})

// Form 2
const form2 = useFormValidator({
  schema: schema2,
  options: { identifier: 'signup-form' }
})

// Use matching identifiers in useFormField
const { value } = useFormField<string>('email', {
  formIdentifier: 'login-form'
})
```

**See Also**: `references/form-validation.md` for complete form validation guide

---

## Best Practices

### Performance Tips

1. **Use debouncing/throttling** for expensive validations:
   ```typescript
   useFormValidator({
     schema,
     options: {
       debouncedFields: { username: 500 }, // Check username availability
       throttledFields: { search: true } // Throttle search queries
     }
   })
   ```

2. **Prefer eager/progressive modes** over aggressive for better UX
3. **Use lazy mode** for simple forms with minimal validation
4. **Leverage TypeScript** for automatic type inference from schemas

### SSR Compatibility

| Composable | SSR Support | Notes |
|-----------|-------------|-------|
| `useTheme` | ✅ Full | Auto theme persistence |
| `useTranslations` | ✅ Full | Provide initial locale immediately |
| `useToast` | ✅ Full | Works in SSR mode |
| `useDialog` | ✅ Full | Works in SSR mode |
| `useWait` | ✅ Full | Works in SSR mode |
| `useBreakpoints` | ⚠️ Partial | Use `initialWidth` prop |
| `useWindowSize` | ⚠️ Partial | Returns 0 on server |
| `useFormValidator` | ✅ Full | Full SSR support |
| `useTimer` | ❌ Client-only | Browser API required |
| `useSwipe` | ❌ Client-only | Touch events required |
| `useIdleTimeout` | ❌ Client-only | Browser events required |
| `useUserVisibility` | ❌ Client-only | Page Visibility API required |

### Common Patterns

**Form Submission with Loading & Toasts**:

```vue
<script setup lang="ts">
const { handleSubmit, isSubmitting } = useFormValidator({ schema })
const toast = useToast()

const onSubmit = handleSubmit(async (data) => {
  try {
    await api.submit(data)
    toast.success('Submitted successfully!')
    router.push('/success')
  } catch (error) {
    toast.error('Submission failed. Please try again.')
  }
})
</script>

<template>
  <form @submit="onSubmit">
    <!-- fields -->
    <MazBtn type="submit" :loading="isSubmitting">Submit</MazBtn>
  </form>
</template>
```

**Dark Mode Toggle with Persistence**:

```vue
<script setup lang="ts">
const { theme, toggleTheme, isDark } = useTheme()

// Theme is automatically persisted to localStorage
</script>

<template>
  <MazBtn @click="toggleTheme">
    <MazIcon :name="isDark ? 'moon' : 'sun'" />
    {{ isDark ? 'Light' : 'Dark' }} Mode
  </MazBtn>
</template>
```

---

## Troubleshooting

### useFormValidator Type Errors

**Problem**: `WritableComputedRef<string | number | boolean | undefined>`

```typescript
// ❌ Wrong - loses type precision
const { value } = useFormField('name')

// ✅ Correct - precise typing
const { value } = useFormField<string>('name')
```

### Validation Not Triggering (Eager/Progressive modes)

**Problem**: Field validation doesn't work with `eager`/`progressive` modes

```vue
<!-- ❌ Missing ref or validation events -->
<MazInput v-model="value" />

<!-- ✅ Use ref for automatic detection -->
<script setup>
const { value } = useFormField<string>('name', {
  ref: useTemplateRef('inputRef')
})
</script>
<MazInput ref="inputRef" v-model="value" />

<!-- ✅ Or use validation events manually -->
<script setup>
const { value, validationEvents } = useFormField<string>('name')
</script>
<MazInput v-model="value" v-bind="validationEvents" />
```

### useTheme Error: "must be used within MazUi plugin"

**Problem**: MazUi plugin not installed or theme disabled

```typescript
// ✅ Vue 3 Fix
app.use(MazUi, {
  theme: { preset: mazUi }
})

// ✅ Nuxt 3 Fix
export default defineNuxtConfig({
  mazUi: {
    composables: { useTheme: true },
    theme: { preset: 'maz-ui' }
  }
})
```

### Translations Showing Raw Keys

**Problem**: Translation keys like `inputPhoneNumber.phoneInput.example` shown instead of translated text

**Causes**:
- Missing locale import
- Lazy loading not awaited
- Missing `preloadFallback` configuration

```typescript
// ✅ Fix: Immediate loading
import { fr } from '@maz-ui/translations'

app.use(MazUi, {
  translations: {
    locale: 'fr',
    preloadFallback: true,
    messages: { fr } // Import immediately
  }
})

// ✅ Fix: Lazy loading with await
const { setLocale } = useTranslations()
await setLocale('fr') // Don't forget await!
```

---

## Related Documentation

- **Form Validation Deep Dive**: `references/form-validation.md`
- **Translations & i18n**: `references/translations.md`
- **Plugins (Toast, Dialog, Wait)**: `references/plugins.md`
- **Theming**: `references/theming.md`
- **SSR/SSG Considerations**: `references/ssr-ssg.md`

---

**Last Updated**: 2025-12-29 | **Maz-UI Version**: 4.3.3
