---
name: maz-ui:snippets
description: Quick code snippets for common Maz-UI patterns (forms, dialogs, toasts, validation, components)
---

# Maz-UI Code Snippets

Quick access to production-ready code snippets for common Maz-UI patterns.

## Usage

Type `/snippets` followed by a category:

- `/snippets form` - Form templates
- `/snippets dialog` - Dialog patterns
- `/snippets toast` - Toast notification patterns
- `/snippets validation` - Validation schemas
- `/snippets component` - Component snippets
- `/snippets theme` - Theme configuration
- `/snippets setup` - Setup configurations

## Available Snippets

### Form Snippets (`/snippets form`)

#### Basic Contact Form
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFormValidator } from 'maz-ui/composables/useFormValidator'
import { useToast } from 'maz-ui/composables/useToast'
import { pipe, string, email, minLength } from 'valibot'

const schema = {
  name: pipe(string('Name is required'), minLength(2)),
  email: pipe(string('Email is required'), email('Invalid email')),
  message: pipe(string('Message is required'), minLength(10))
}

const { model, errorMessages, handleSubmit, isSubmitting } =
  useFormValidator({ schema })

const toast = useToast()

const onSubmit = handleSubmit(async (formData) => {
  try {
    await $fetch('/api/contact', { method: 'POST', body: formData })
    toast.success('Message sent!')
  } catch (error) {
    toast.error('Failed to send message')
  }
})
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <MazInput
      v-model="model.name"
      label="Name"
      :error="!!errorMessages.name"
      :error-message="errorMessages.name"
    />

    <MazInput
      v-model="model.email"
      type="email"
      label="Email"
      :error="!!errorMessages.email"
      :error-message="errorMessages.email"
    />

    <MazTextarea
      v-model="model.message"
      label="Message"
      rows="5"
      :error="!!errorMessages.message"
      :error-message="errorMessages.message"
    />

    <MazBtn
      type="submit"
      color="primary"
      :loading="isSubmitting"
      block
    >
      Send Message
    </MazBtn>
  </form>
</template>
```

#### Login Form with Async Validation
```vue
<script setup lang="ts">
import { pipe, string, email, minLength, customAsync } from 'valibot'

const schema = {
  email: pipe(
    string('Email is required'),
    email('Invalid email'),
    customAsync(async (value) => {
      const res = await $fetch(`/api/check-email?email=${value}`)
      return res.exists
    }, 'Email not found')
  ),
  password: pipe(string('Password is required'), minLength(8))
}

const { model, errorMessages, handleSubmit, isSubmitting } =
  useFormValidator({ schema })

const onSubmit = handleSubmit(async (formData) => {
  // Login logic
})
</script>
```

### Dialog Snippets (`/snippets dialog`)

#### Confirmation Dialog
```vue
<script setup lang="ts">
import { useDialog } from 'maz-ui/composables/useDialog'
import { useToast } from 'maz-ui/composables/useToast'

const dialog = useDialog()
const toast = useToast()

async function deleteItem() {
  const confirmed = await dialog.confirm({
    title: 'Delete Item',
    message: 'This action cannot be undone. Are you sure?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmColor: 'destructive'
  })

  if (confirmed) {
    try {
      await $fetch('/api/delete', { method: 'DELETE' })
      toast.success('Item deleted')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }
}
</script>

<template>
  <MazBtn @click="deleteItem" color="destructive">
    Delete
  </MazBtn>
</template>
```

#### Custom Dialog with MazDialog
```vue
<script setup lang="ts">
const isOpen = ref(false)
const data = ref(null)

async function handleConfirm() {
  // Process data
  isOpen.value = false
}
</script>

<template>
  <MazDialog v-model="isOpen" title="Custom Dialog">
    <div class="p-4 space-y-4">
      <!-- Dialog content -->
      <MazInput v-model="data" label="Data" />
    </div>

    <template #footer>
      <MazBtn @click="isOpen = false" outlined>
        Cancel
      </MazBtn>
      <MazBtn @click="handleConfirm" color="primary">
        Confirm
      </MazBtn>
    </template>
  </MazDialog>

  <MazBtn @click="isOpen = true">
    Open Dialog
  </MazBtn>
</template>
```

### Toast Snippets (`/snippets toast`)

#### Basic Toast Notifications
```vue
<script setup lang="ts">
import { useToast } from 'maz-ui/composables/useToast'

const toast = useToast()

// Success toast
toast.success('Operation completed successfully!', {
  timeout: 3000,
  position: 'top-right'
})

// Error toast with retry button
toast.error('Failed to save', {
  timeout: 5000,
  button: {
    text: 'Retry',
    onClick: () => retrySave(),
    closeToast: true
  }
})

// Info toast
toast.info('New version available')

// Warning toast
toast.warning('Your session will expire soon')
</script>
```

#### Toast with Custom Position and Action
```vue
<script setup lang="ts">
const toast = useToast()

toast.success('File uploaded successfully', {
  timeout: 4000,
  position: 'bottom-center',
  button: {
    text: 'View',
    onClick: () => router.push('/files'),
    closeToast: false
  }
})
</script>
```

### Validation Snippets (`/snippets validation`)

#### Registration Form Schema
```typescript
import { pipe, string, email, minLength, custom, boolean } from 'valibot'

const registrationSchema = {
  username: pipe(
    string('Username is required'),
    minLength(3, 'Username must be at least 3 characters'),
    custom((value) => /^[a-zA-Z0-9_]+$/.test(value),
      'Username can only contain letters, numbers, and underscores')
  ),

  email: pipe(
    string('Email is required'),
    email('Please enter a valid email')
  ),

  password: pipe(
    string('Password is required'),
    minLength(8, 'Password must be at least 8 characters'),
    custom((value) =>
      /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value),
      'Password must contain uppercase, lowercase, and number')
  ),

  confirmPassword: pipe(
    string('Please confirm password'),
    custom((value) => value === model.value.password,
      'Passwords do not match')
  ),

  terms: pipe(
    boolean('You must accept the terms'),
    custom((value) => value === true,
      'You must accept the terms')
  )
}
```

#### Phone Number Validation
```typescript
import { pipe, string, regex } from 'valibot'

const phoneSchema = {
  phone: pipe(
    string('Phone is required'),
    regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
  )
}
```

#### Credit Card Validation
```typescript
const paymentSchema = {
  cardNumber: pipe(
    string('Card number is required'),
    regex(/^\d{16}$/, 'Card number must be 16 digits')
  ),

  expiryDate: pipe(
    string('Expiry date is required'),
    regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY')
  ),

  cvv: pipe(
    string('CVV is required'),
    regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits')
  )
}
```

### Component Snippets (`/snippets component`)

#### Data Table with Pagination
```vue
<script setup lang="ts">
const users = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
])

const currentPage = ref(1)
const pageSize = ref(10)

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return users.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.ceil(users.value.length / pageSize.value))
</script>

<template>
  <div>
    <MazTable
      :rows="paginatedUsers"
      :headers="[
        { text: 'Name', value: 'name' },
        { text: 'Email', value: 'email' },
        { text: 'Role', value: 'role' }
      ]"
    />

    <MazPagination
      v-model="currentPage"
      :total="totalPages"
    />
  </div>
</template>
```

#### Multi-Step Form with MazStepper
```vue
<script setup lang="ts">
const currentStep = ref(1)
const formData = ref({
  step1: {},
  step2: {},
  step3: {}
})

function nextStep() {
  if (currentStep.value < 3) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}
</script>

<template>
  <div>
    <MazStepper
      v-model="currentStep"
      :steps="[
        { label: 'Personal Info' },
        { label: 'Account Details' },
        { label: 'Review' }
      ]"
    />

    <!-- Step content -->
    <div v-if="currentStep === 1">
      <!-- Step 1 fields -->
    </div>

    <div v-if="currentStep === 2">
      <!-- Step 2 fields -->
    </div>

    <div v-if="currentStep === 3">
      <!-- Step 3 review -->
    </div>

    <!-- Navigation -->
    <div class="flex justify-between mt-6">
      <MazBtn @click="prevStep" :disabled="currentStep === 1">
        Previous
      </MazBtn>
      <MazBtn @click="nextStep" color="primary">
        {{ currentStep === 3 ? 'Submit' : 'Next' }}
      </MazBtn>
    </div>
  </div>
</template>
```

#### Loading State with useWait
```vue
<script setup lang="ts">
import { useWait } from 'maz-ui/composables/useWait'

const wait = useWait()

async function fetchData() {
  wait.start('loading-data')
  try {
    const data = await $fetch('/api/data')
    return data
  } finally {
    wait.end('loading-data')
  }
}
</script>

<template>
  <div>
    <MazBtn
      @click="fetchData"
      :loading="wait.is('loading-data')"
      :disabled="wait.is('loading-data')"
    >
      Fetch Data
    </MazBtn>

    <!-- Or show global loader -->
    <MazFullscreenLoader v-if="wait.is('loading-data')" />
  </div>
</template>
```

### Theme Snippets (`/snippets theme`)

#### Custom Theme Preset
```typescript
// themes/custom.ts
import { definePreset } from '@maz-ui/themes'

export const customTheme = definePreset({
  name: 'custom',
  foundation: {
    'radius': '0.75rem',
    'font-family': 'Inter, sans-serif',
  },
  colors: {
    light: {
      primary: '220 100% 50%',
      secondary: '220 14% 96%',
      background: '0 0% 100%',
      foreground: '222 84% 5%',
    },
    dark: {
      primary: '220 100% 70%',
      secondary: '220 14% 4%',
      background: '222 84% 5%',
      foreground: '210 40% 98%',
    }
  }
})
```

#### Runtime Theme Switching
```vue
<script setup lang="ts">
import { useTheme } from 'maz-ui/composables/useTheme'

const { toggleDarkMode, isDark, setColorMode } = useTheme()
</script>

<template>
  <MazBtn @click="toggleDarkMode">
    {{ isDark ? '🌙' : '☀️' }} Toggle Dark Mode
  </MazBtn>
</template>
```

### Setup Snippets (`/snippets setup`)

#### Vue 3 Setup with Auto-Imports
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
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
        MazDirectivesResolver()
      ],
      dts: true
    }),
    AutoImport({
      resolvers: [MazModulesResolver()],
      dts: true
    })
  ]
})
```

#### Nuxt 3 Full Configuration
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@maz-ui/nuxt'],

  mazUi: {
    theme: {
      preset: 'maz-ui',
      strategy: 'hybrid',
      darkModeStrategy: 'class'
    },

    translations: {
      locale: 'en',
      fallbackLocale: 'en',
      preloadFallback: true
    },

    plugins: {
      toast: true,
      dialog: true,
      aos: true,
      wait: true
    },

    directives: {
      vTooltip: true,
      vClickOutside: true,
      vLazyImg: true
    }
  }
})
```

---

## Quick Reference

**Forms**: Contact form, login form, registration form
**Dialogs**: Confirmation, custom dialog
**Toasts**: Success, error, info, warning with actions
**Validation**: Registration schema, phone, credit card, async validation
**Components**: Data table, multi-step form, loading states
**Theme**: Custom theme, theme switching
**Setup**: Vue 3 auto-imports, Nuxt 3 full config

---

For complete documentation and advanced patterns, load the appropriate reference file:
- Forms: `references/components-forms.md`
- Validation: `references/form-validation.md`
- Theming: `references/theming.md`
- Setup: `references/setup-vue.md` or `references/setup-nuxt.md`
