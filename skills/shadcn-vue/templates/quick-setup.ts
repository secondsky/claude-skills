/**
 * shadcn-vue - Quick Setup Template
 * 
 * This template provides the complete setup pattern for shadcn-vue
 * in Vue/Nuxt projects with Reka UI v2.
 */

// ===== 1. INSTALLATION =====

// Initialize shadcn-vue (run in project root)
// bunx shadcn-vue@latest init

// During init, select:
// - Style: "New York" or "Default" (cannot change later!)
// - Base color: "Slate" (recommended)
// - CSS variables: "Yes" (required for dark mode)

// ===== 2. TYPESCRIPT CONFIGURATION =====

// tsconfig.json
export const tsConfig = {
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// ===== 3. VITE CONFIGURATION =====

// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite' // Tailwind v4
import path from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

// ===== 4. ADD COMPONENTS =====

// bunx shadcn-vue@latest add button
// bunx shadcn-vue@latest add card
// bunx shadcn-vue@latest add form

// ===== 5. BASIC USAGE =====

// Example: Button Component
/*
<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <div>
    <Button>Click me</Button>
    <Button variant="destructive">Delete</Button>
    <Button variant="outline">Cancel</Button>
    <Button variant="ghost">Ghost</Button>
    <Button size="sm">Small</Button>
    <Button size="lg">Large</Button>
  </div>
</template>
*/

// Example: Form with Auto Form
/*
<script setup lang="ts">
import { AutoForm } from '@/components/ui/auto-form'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older')
})

function onSubmit(values: z.infer<typeof schema>) {
  console.log('Form submitted:', values)
}
</script>

<template>
  <AutoForm :schema="schema" @submit="onSubmit">
    <template #submit>
      <Button type="submit">Submit</Button>
    </template>
  </AutoForm>
</template>
*/

// ===== 6. DARK MODE SETUP =====

// Install dependencies
// bun add @vueuse/core

// Create theme provider
// components/ThemeProvider.vue
/*
<script setup lang="ts">
import { useColorMode } from '@vueuse/core'

const mode = useColorMode()
</script>

<template>
  <div :class="mode">
    <slot />
  </div>
</template>
*/

// Use in app
/*
<script setup>
import ThemeProvider from './components/ThemeProvider.vue'
import { useColorMode } from '@vueuse/core'

const mode = useColorMode()

function toggleTheme() {
  mode.value = mode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <ThemeProvider>
    <Button @click="toggleTheme">Toggle Theme</Button>
    <!-- Your app content -->
  </ThemeProvider>
</template>
*/

// ===== 7. DATA TABLE EXAMPLE =====

// Install TanStack Table
// bun add @tanstack/vue-table

/*
<script setup lang="ts">
import { DataTable } from '@/components/ui/data-table'
import { h } from 'vue'

const columns = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  }
]

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
]
</script>

<template>
  <DataTable :columns="columns" :data="data" />
</template>
*/

/**
 * Best Practices:
 * 
 * 1. Always run `init` before adding components
 * 2. Choose style carefully (cannot change later)
 * 3. Use CSS variables for theming (cssVariables: true)
 * 4. Configure TypeScript path aliases
 * 5. Keep components.json in version control
 * 6. Don't mix Radix Vue and Reka UI v2
 * 7. Use Bun for faster installs
 * 8. Install component dependencies individually
 * 9. Verify Tailwind CSS is configured
 * 10. For monorepos: use `-c` flag to specify workspace
 */
