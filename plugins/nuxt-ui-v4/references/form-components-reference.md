# Form Components Reference

**Component Count**: 17 form components
**Purpose**: Complete reference for all Nuxt UI v4 form components with props, events, and slots

---

## Overview

Nuxt UI v4 provides 17 accessible form components built on Reka UI with automatic validation support via Zod schemas.

**Form Components List**:
1. Input - Text inputs with leading/trailing icons
2. InputDate (v4.2+) - Date picker with range support
3. InputTime (v4.2+) - Time picker (12/24-hour)
4. InputMenu - Searchable dropdown input
5. InputNumber - Numeric input with steppers
6. InputTags - Tag/chip input
7. Select - Native select dropdown
8. SelectMenu - Custom searchable select
9. Textarea - Multi-line text input
10. Checkbox - Single checkbox
11. CheckboxGroup - Multiple checkboxes
12. Radio - Radio button
13. RadioGroup - Radio button group
14. Switch - Toggle switch
15. Slider - Range slider
16. ColorPicker - Color selection
17. Form - Form validation wrapper

---

## Input Component

### Basic Usage

```vue
<template>
  <UInput
    v-model="email"
    type="email"
    placeholder="Enter email"
    required
  />
</template>

<script setup lang="ts">
const email = ref('')
</script>
```

### With Icons

```vue
<template>
  <UInput
    v-model="search"
    placeholder="Search..."
    :ui="{
      icon: { leading: 'text-primary' }
    }"
  >
    <template #leading>
      <UIcon name="i-heroicons-magnifying-glass" />
    </template>

    <template #trailing>
      <UButton
        v-if="search"
        icon="i-heroicons-x-mark"
        variant="ghost"
        size="xs"
        @click="search = ''"
      />
    </template>
  </UInput>
</template>
```

### Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `v-model` | `string` | - | Input value (required) |
| `type` | `string` | `'text'` | HTML input type |
| `placeholder` | `string` | - | Placeholder text |
| `disabled` | `boolean` | `false` | Disable input |
| `loading` | `boolean` | `false` | Show loading state |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `color` | Semantic color | `'primary'` | Input color |
| `variant` | `'solid' \| 'outline' \| 'soft' \| 'subtle'` | `'outline'` | Input variant |

### Slots

- `leading` - Content before input (icons, buttons)
- `trailing` - Content after input (icons, buttons)

---

## InputDate Component (v4.2+)

### Basic Date Picker

```vue
<template>
  <UInputDate v-model="date" />
</template>

<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'

const date = ref(new CalendarDate(2024, 1, 15))
</script>
```

### Date Range Selection

```vue
<template>
  <UInputDate
    v-model="dateRange"
    range
    separator-icon="i-heroicons-arrow-right"
  />
</template>

<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'

const dateRange = ref({
  start: new CalendarDate(2024, 1, 1),
  end: new CalendarDate(2024, 1, 7)
})
</script>
```

### Unavailable Dates

```vue
<template>
  <UInputDate
    v-model="workDate"
    :is-date-unavailable="isWeekend"
    placeholder="Select weekday"
  />
</template>

<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'

const workDate = ref(new CalendarDate(2024, 1, 15))

function isWeekend(date: CalendarDate) {
  const dayOfWeek = date.toDate('UTC').getDay()
  return dayOfWeek === 0 || dayOfWeek === 6  // Sunday or Saturday
}
</script>
```

### Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `v-model` | `CalendarDate \| { start, end }` | - | Selected date(s) |
| `range` | `boolean` | `false` | Enable range selection |
| `is-date-unavailable` | `(date) => boolean` | - | Function to disable dates |
| `separator-icon` | `string` | `'i-heroicons-minus'` | Range separator icon |
| `color` | Semantic color | `'primary'` | Calendar color |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Input size |

**Requires**: `@internationalized/date` package
```bash
bun add @internationalized/date
```

---

## InputTime Component (v4.2+)

### Basic Time Picker

```vue
<template>
  <UInputTime v-model="time" :hour-cycle="24" />
</template>

<script setup lang="ts">
import { Time } from '@internationalized/date'

const time = ref(new Time(14, 30))  // 2:30 PM
</script>
```

### 12-Hour Format

```vue
<template>
  <UInputTime
    v-model="time12"
    :hour-cycle="12"
    placeholder="Select time"
  />
</template>

<script setup lang="ts">
import { Time } from '@internationalized/date'

const time12 = ref(new Time(2, 30))  // 2:30 AM
</script>
```

### Key Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `v-model` | `Time` | - | Selected time |
| `hour-cycle` | `12 \| 24` | `24` | Time format |
| `color` | Semantic color | `'primary'` | Picker color |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `disabled` | `boolean` | `false` | Disable picker |

**Requires**: `@internationalized/date` package

---

## Select & SelectMenu Components

### Select (Native)

```vue
<template>
  <USelect
    v-model="selected"
    :options="options"
    placeholder="Select option"
  />
</template>

<script setup lang="ts">
const options = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' }
]
const selected = ref(null)
</script>
```

### SelectMenu (Custom, Searchable)

```vue
<template>
  <USelectMenu
    v-model="selected"
    :items="items"
    searchable
    placeholder="Search options..."
    value-key="id"
    label-key="name"
  />
</template>

<script setup lang="ts">
const items = [
  { id: 1, name: 'Apple', category: 'Fruit' },
  { id: 2, name: 'Carrot', category: 'Vegetable' }
]
const selected = ref(null)
</script>
```

### SelectMenu with Groups

```vue
<template>
  <USelectMenu
    v-model="selected"
    :items="groupedItems"
    searchable
  />
</template>

<script setup lang="ts">
const groupedItems = [
  {
    label: 'Fruits',
    items: [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' }
    ]
  },
  {
    label: 'Vegetables',
    items: [
      { label: 'Carrot', value: 'carrot' },
      { label: 'Broccoli', value: 'broccoli' }
    ]
  }
]
</script>
```

---

## Form Validation with UForm

### Basic Form with Zod

```vue
<template>
  <UForm
    :state="state"
    :schema="schema"
    @submit="onSubmit"
    @error="onError"
  >
    <UFormField name="email" label="Email" required>
      <UInput v-model="state.email" type="email" />
    </UFormField>

    <UFormField name="password" label="Password" required>
      <UInput v-model="state.password" type="password" />
    </UFormField>

    <UFormField name="age" label="Age">
      <UInputNumber v-model="state.age" />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.number().min(18, 'Must be 18 or older').optional()
})

const state = reactive({
  email: '',
  password: '',
  age: undefined
})

async function onSubmit(data: any) {
  console.log('Valid data:', data)
  // API call here
}

function onError(errors: any) {
  console.error('Validation errors:', errors)
}
</script>
```

### Nested Forms

```vue
<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="user.firstName" label="First Name">
      <UInput v-model="state.user.firstName" />
    </UFormField>

    <UFormField name="user.lastName" label="Last Name">
      <UInput v-model="state.user.lastName" />
    </UFormField>

    <UFormField name="address.street" label="Street">
      <UInput v-model="state.address.street" />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  user: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1)
  }),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1)
  })
})

const state = reactive({
  user: {
    firstName: '',
    lastName: ''
  },
  address: {
    street: '',
    city: ''
  }
})
</script>
```

---

## Checkbox & CheckboxGroup

### Single Checkbox

```vue
<template>
  <UCheckbox
    v-model="agreed"
    label="I agree to the terms and conditions"
    required
  />
</template>

<script setup lang="ts">
const agreed = ref(false)
</script>
```

### CheckboxGroup

```vue
<template>
  <UCheckboxGroup
    v-model="selected"
    :items="options"
    label="Select your interests"
  />
</template>

<script setup lang="ts">
const options = [
  { label: 'Sports', value: 'sports' },
  { label: 'Music', value: 'music' },
  { label: 'Technology', value: 'tech' }
]
const selected = ref([])
</script>
```

---

## RadioGroup

```vue
<template>
  <URadioGroup
    v-model="selected"
    :items="options"
    label="Choose your plan"
  />
</template>

<script setup lang="ts">
const options = [
  { label: 'Free', value: 'free', description: 'For personal use' },
  { label: 'Pro', value: 'pro', description: 'For professionals' },
  { label: 'Enterprise', value: 'enterprise', description: 'For teams' }
]
const selected = ref('free')
</script>
```

---

## Switch & Slider

### Switch Component

```vue
<template>
  <USwitch
    v-model="enabled"
    label="Enable notifications"
  />
</template>

<script setup lang="ts">
const enabled = ref(false)
</script>
```

### Slider Component

```vue
<template>
  <USlider
    v-model="volume"
    :min="0"
    :max="100"
    :step="5"
  />
  <p>Volume: {{ volume }}</p>
</template>

<script setup lang="ts">
const volume = ref(50)
</script>
```

---

## ColorPicker

```vue
<template>
  <UColorPicker
    v-model="color"
    :swatches="presetColors"
  />
</template>

<script setup lang="ts">
const color = ref('#3B82F6')
const presetColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
]
</script>
```

---

## InputNumber

```vue
<template>
  <UInputNumber
    v-model="quantity"
    :min="1"
    :max="100"
    :step="1"
  />
</template>

<script setup lang="ts">
const quantity = ref(1)
</script>
```

---

## InputTags

```vue
<template>
  <UInputTags
    v-model="tags"
    placeholder="Add tags..."
  />
</template>

<script setup lang="ts">
const tags = ref(['vue', 'nuxt'])
</script>
```

---

## Textarea

```vue
<template>
  <UTextarea
    v-model="message"
    placeholder="Enter your message..."
    :rows="5"
    resize
  />
</template>

<script setup lang="ts">
const message = ref('')
</script>
```

---

## Common Patterns

### Form with Multiple Field Types

```vue
<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="name" label="Full Name">
      <UInput v-model="state.name" />
    </UFormField>

    <UFormField name="email" label="Email">
      <UInput v-model="state.email" type="email" />
    </UFormField>

    <UFormField name="birthDate" label="Birth Date">
      <UInputDate v-model="state.birthDate" />
    </UFormField>

    <UFormField name="meetingTime" label="Preferred Meeting Time">
      <UInputTime v-model="state.meetingTime" :hour-cycle="12" />
    </UFormField>

    <UFormField name="country" label="Country">
      <USelectMenu
        v-model="state.country"
        :items="countries"
        searchable
      />
    </UFormField>

    <UFormField name="bio" label="Bio">
      <UTextarea v-model="state.bio" :rows="4" />
    </UFormField>

    <UFormField name="subscribe">
      <UCheckbox
        v-model="state.subscribe"
        label="Subscribe to newsletter"
      />
    </UFormField>

    <div class="flex gap-2">
      <UButton type="submit">Save</UButton>
      <UButton variant="ghost" @click="reset">Cancel</UButton>
    </div>
  </UForm>
</template>
```

---

## Reference

- **Validation Patterns**: See `form-validation-patterns.md`
- **Advanced Patterns**: See `form-advanced-patterns.md`
- **Templates**: See `templates/components/ui-form-example.vue`
