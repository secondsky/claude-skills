# TypeScript Setup & Configuration

**Purpose**: Complete guide to TypeScript integration with Nuxt UI v4
**Feature**: Full TypeScript support with auto-completion and type safety

---

## Quick Setup

TypeScript is supported out of the box with Nuxt UI v4. No additional configuration required.

### Generate Types

Run this command to generate Nuxt types (includes Nuxt UI component types):

```bash
bunx nuxt prepare
```

This generates:
- `.nuxt/nuxt.d.ts` - Nuxt type declarations
- `.nuxt/types/` - Component types
- `.nuxt/imports.d.ts` - Auto-import types

**When to run**:
- After installing `@nuxt/ui`
- After adding new components
- When types are missing in IDE

---

## Component Props Types

### Importing Component Types

```vue
<script setup lang="ts">
import type { Button, Card, Modal } from '#ui/types'

// Type-safe button props
const buttonProps: Button = {
  size: 'md',
  color: 'primary',
  variant: 'solid',
  icon: 'i-heroicons-plus'
}

// Type-safe card props
const cardProps: Card = {
  variant: 'outline'
}
</script>

<template>
  <UButton v-bind="buttonProps">Click me</UButton>
  <UCard v-bind="cardProps">Content</UCard>
</template>
```

### Generic Component Types

For components with generic data (Table, SelectMenu, etc.):

```vue
<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
}

const users: User[] = [
  { id: 1, name: 'John', email: 'john@example.com' }
]

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' }
] as const
</script>

<template>
  <UTable :rows="users" :columns="columns" />
</template>
```

---

## Form Validation with Zod

### Basic Zod Schema

```vue
<script setup lang="ts">
import { z } from 'zod'

// Define schema
const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.number().min(18, 'Must be 18 or older').optional()
})

// Infer TypeScript type from schema
type FormData = z.infer<typeof schema>

// Type-safe state
const state = reactive<FormData>({
  email: '',
  password: '',
  age: undefined
})

async function onSubmit(data: FormData) {
  // data is fully typed
  console.log(data.email)  // ✓ TypeScript knows this is string
  console.log(data.age)    // ✓ TypeScript knows this is number | undefined
}
</script>

<template>
  <UForm
    :state="state"
    :schema="schema"
    @submit="onSubmit"
  >
    <UFormField name="email" label="Email">
      <UInput v-model="state.email" type="email" />
    </UFormField>

    <UFormField name="password" label="Password">
      <UInput v-model="state.password" type="password" />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

### Complex Zod Schemas

```typescript
import { z } from 'zod'

// Nested object validation
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid zip code')
})

const userSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(18).max(120),
  address: addressSchema,
  role: z.enum(['admin', 'user', 'guest']),
  tags: z.array(z.string()).min(1, 'At least one tag required')
})

// Infer types
type User = z.infer<typeof userSchema>
type Address = z.infer<typeof addressSchema>
```

### Zod Refinements & Custom Validation

```typescript
const passwordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

// Async validation
const usernameSchema = z.object({
  username: z.string().min(3)
}).refine(async (data) => {
  const available = await checkUsernameAvailability(data.username)
  return available
}, {
  message: 'Username already taken'
})
```

---

## Composable Types

### useToast Types

```typescript
import type { Toast } from '#ui/types'

const { add, remove } = useToast()

const toast: Toast = {
  title: 'Success',
  description: 'Operation completed',
  color: 'success',
  icon: 'i-heroicons-check-circle',
  timeout: 3000,
  actions: [{
    label: 'Undo',
    click: () => console.log('Undo')
  }]
}

add(toast)
```

### useNotification Types

```typescript
import type { Notification } from '#ui/types'

const { add: addNotification } = useNotification()

const notification: Notification = {
  title: 'New Message',
  description: 'You have a new message',
  icon: 'i-heroicons-envelope',
  avatar: { src: '/avatar.jpg' },
  color: 'primary'
}

addNotification(notification)
```

### useColorMode Types

```typescript
const colorMode = useColorMode()

// TypeScript knows the possible values
type ColorMode = 'light' | 'dark' | 'system'

const mode: ColorMode = colorMode.value
const preference: ColorMode = colorMode.preference
```

---

## CommandPalette Types

### Typed Command Items

```vue
<script setup lang="ts">
import type { CommandPaletteItem } from '@nuxt/ui'

interface CustomCommand extends CommandPaletteItem {
  // Extend with custom properties
  category?: string
  premium?: boolean
}

const commands: CustomCommand[] = [
  {
    id: 'new-file',
    label: 'New File',
    icon: 'i-heroicons-document-plus',
    shortcuts: ['⌘', 'N'],
    category: 'File',
    click: () => createFile()
  }
]

const groups = computed(() => [
  {
    key: 'actions',
    label: 'Actions',
    commands: commands.filter(cmd => cmd.category === 'File')
  }
])
</script>
```

---

## Table Types

### Typed Table Rows

```vue
<script setup lang="ts">
interface Product {
  id: number
  name: string
  price: number
  stock: number
  category: string
}

const products = ref<Product[]>([
  { id: 1, name: 'Product 1', price: 99.99, stock: 10, category: 'Electronics' }
])

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'price', label: 'Price' },
  { key: 'stock', label: 'Stock' },
  { key: 'category', label: 'Category' }
] as const

function handleSelect(rows: Product[]) {
  // rows is typed as Product[]
  console.log('Selected:', rows[0].name)
}
</script>

<template>
  <UTable
    :rows="products"
    :columns="columns"
    @select="handleSelect"
  />
</template>
```

---

## Utility Types

### Component UI Customization Types

```typescript
import type { Button } from '#ui/types'

// Extract UI customization type
type ButtonUI = Button['ui']

const customUI: ButtonUI = {
  base: 'custom-base-class',
  variant: {
    solid: 'custom-solid-variant'
  }
}
```

### Event Handler Types

```vue
<script setup lang="ts">
import type { FormSubmitEvent, FormErrorEvent } from '#ui/types'
import { z } from 'zod'

// Define your form schema
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email')
})

// Infer the type from schema
type Schema = z.infer<typeof schema>

// Properly typed handlers
function handleSubmit(event: FormSubmitEvent<Schema>) {
  // event.data is now typed as { name: string; email: string }
  console.log(event.data.name)  // TypeScript knows this is a string
  console.log(event.data.email) // TypeScript knows this is a string
}

function handleError(event: FormErrorEvent<Schema>) {
  // event.errors contains validation errors with proper typing
  console.log(event.errors)
}
</script>

<template>
  <UForm :schema="schema" @submit="handleSubmit" @error="handleError">
    <UFormField name="name" label="Name">
      <UInput />
    </UFormField>
    <UFormField name="email" label="Email">
      <UInput type="email" />
    </UFormField>
    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

---

## App Config Types

### Type-Safe App Configuration

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      success: 'green',
      warning: 'amber',
      error: 'red'
    } as const,

    button: {
      defaultVariants: {
        size: 'md',
        color: 'primary'
      }
    }
  }
})
```

### Accessing App Config with Types

```vue
<script setup lang="ts">
const appConfig = useAppConfig()

// TypeScript knows the structure
const primaryColor = appConfig.ui.colors.primary  // 'blue'
</script>
```

---

## Advanced TypeScript Patterns

### Discriminated Unions

```typescript
type AlertType =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string; retry?: () => void }
  | { type: 'warning'; message: string; dismiss: boolean }

function showAlert(alert: AlertType) {
  switch (alert.type) {
    case 'success':
      // TypeScript knows: alert.message exists
      break
    case 'error':
      // TypeScript knows: alert.retry might exist
      if (alert.retry) alert.retry()
      break
    case 'warning':
      // TypeScript knows: alert.dismiss exists
      break
  }
}
```

### Generic Components

```vue
<script setup lang="ts" generic="T extends { id: number }">
defineProps<{
  items: T[]
  onSelect: (item: T) => void
}>()
</script>

<template>
  <div>
    <UButton
      v-for="item in items"
      :key="item.id"
      @click="onSelect(item)"
    >
      {{ item.id }}
    </UButton>
  </div>
</template>
```

---

## Common TypeScript Errors & Solutions

### Error: Cannot find module '#ui/types'

**Solution**: Run `bunx nuxt prepare` to generate types

```bash
bunx nuxt prepare
```

### Error: Property does not exist on type

**Problem**: IDE not recognizing auto-imported components/composables

**Solution**:
1. Run `bunx nuxt prepare`
2. Restart TypeScript server in IDE
3. Check `.nuxt/imports.d.ts` exists

### Error: Type instantiation is excessively deep

**Problem**: Complex nested Zod schemas

**Solution**: Break into smaller schemas
```typescript
// ❌ Too deep
const deepSchema = z.object({
  level1: z.object({
    level2: z.object({
      level3: z.object({
        // ...
      })
    })
  })
})

// ✅ Better
const level3Schema = z.object({ /* ... */ })
const level2Schema = z.object({ level3: level3Schema })
const level1Schema = z.object({ level2: level2Schema })
```

---

## tsconfig.json Configuration

Recommended TypeScript configuration for Nuxt UI projects:

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "types": [
      "@nuxt/ui"
    ]
  }
}
```

---

## IDE Setup

### VSCode Settings

Recommended `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  }
}
```

### WebStorm/IntelliJ

1. Go to Settings → Languages & Frameworks → TypeScript
2. Select "Automatic" or point to `node_modules/typescript/lib`
3. Enable "TypeScript Language Service"

---

## Reference

- **Zod Documentation**: https://zod.dev
- **Nuxt TypeScript**: https://nuxt.com/docs/guide/concepts/typescript
- **Vue TypeScript**: https://vuejs.org/guide/typescript/overview.html
