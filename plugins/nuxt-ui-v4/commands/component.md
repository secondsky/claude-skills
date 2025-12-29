---
name: nuxt-ui-v4:component
description: Scaffold a new component using Nuxt UI v4 patterns with proper typing and composition
allowed-tools:
  - Read
  - Write
  - Bash
  - mcp__nuxt-ui__get_component
  - mcp__nuxt-ui__get_component_metadata
argument-hint: "<component-type> <name> [--path <dir>]"
---

# Nuxt UI Component Scaffold Command

Scaffold a new Vue component using Nuxt UI v4 patterns and components.

## Arguments

- `<component-type>`: Type of component to scaffold:
  - `form` - Form with validation
  - `table` - Data table with sorting/pagination
  - `modal` - Modal dialog with form
  - `dashboard` - Dashboard layout
  - `chat` - AI chat interface
  - `page` - Page layout with hero/sections
  - `card` - Card with content slots
  - `dropdown` - Dropdown menu with actions

- `<name>`: Component name in PascalCase (e.g., UserSettings)
- `--path <dir>`: Output directory (default: components/)

## Instructions

1. **Parse Component Type and Name**
   Determine which Nuxt UI components to use.

2. **Fetch Component Metadata**
   Use MCP tools to get accurate props and slots.

3. **Generate Component Based on Type**

### Form Component
```vue
<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  // Define schema
})

type FormData = z.infer<typeof schema>

const state = reactive<Partial<FormData>>({})

async function onSubmit() {
  // Handle submit
}
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="field" label="Field">
      <UInput v-model="state.field" />
    </UFormField>
    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

### Table Component
```vue
<script setup lang="ts">
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'actions', label: '' }
]

const { data, pending } = await useFetch('/api/data')
</script>

<template>
  <UTable :columns="columns" :rows="data" :loading="pending">
    <template #actions-data="{ row }">
      <UDropdownMenu :items="getActions(row)" />
    </template>
  </UTable>
</template>
```

### Dashboard Component
```vue
<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <UNavigationMenu :items="menuItems" />
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar />
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
```

### Chat Component
```vue
<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'

const chat = new Chat({ api: '/api/chat' })
const input = ref('')

function onSubmit() {
  chat.sendMessage({ text: input.value })
  input.value = ''
}
</script>

<template>
  <UChatMessages :messages="chat.messages" :status="chat.status">
    <template #content="{ message }">
      <div>{{ message.content }}</div>
    </template>
  </UChatMessages>

  <UChatPrompt v-model="input" @submit="onSubmit">
    <UChatPromptSubmit :status="chat.status" />
  </UChatPrompt>
</template>
```

### Page Component
```vue
<template>
  <UPage>
    <UPageHero
      title="Page Title"
      description="Page description"
      :links="[{ label: 'Get Started', to: '/start' }]"
    />

    <UPageSection>
      <UPageGrid>
        <UPageCard
          v-for="item in items"
          :key="item.id"
          v-bind="item"
        />
      </UPageGrid>
    </UPageSection>
  </UPage>
</template>
```

4. **Add TypeScript Types**
   Include proper type definitions for props/emits.

5. **Write Component File**
   Save to specified path or `components/<Name>.vue`.

## Output

- Created component file path
- List of Nuxt UI components used
- Required dependencies (if any)
- Usage example

## Tips

- Use TypeScript strict mode
- Define Zod schemas for form validation
- Use composables for shared logic
- Keep components focused and composable
