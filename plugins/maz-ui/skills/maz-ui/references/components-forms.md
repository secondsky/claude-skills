# Maz-UI Form Components

Comprehensive guide to all form-related components in Maz-UI.

## MazInput

Versatile text input component with validation states and icons.

**Basic Usage**:
```vue
<script setup>
const name = ref('')
</script>

<template>
  <MazInput
    v-model="name"
    label="Full Name"
    placeholder="Enter your name"
    required
  />
</template>
```

**With Validation States**:
```vue
<template>
  <!-- Success state -->
  <MazInput v-model="email" label="Email" success />

  <!-- Warning state -->
  <MazInput v-model="username" label="Username" warning />

  <!-- Error state -->
  <MazInput v-model="password" label="Password" error hint="Password too weak" />
</template>
```

**With Icons**:
```vue
<template>
  <MazInput
    v-model="email"
    label="Email"
    left-icon="envelope"
    right-icon="check"
  />
</template>
```

**Props**: label, placeholder, type, disabled, required, error, warning, success, hint, assistive-text, top-label, left-icon, right-icon, debounce, size, color, rounded-size

## MazInputPhoneNumber

International phone number input with country detection and validation.

**Basic Usage**:
```vue
<script setup>
import { ref } from 'vue'

const phoneNumber = ref('')
</script>

<template>
  <MazInputPhoneNumber
    v-model="phoneNumber"
    default-country-code="US"
    :preferred-countries="['US', 'CA', 'GB']"
    @update="handlePhoneUpdate"
  />
</template>
```

**With Full Validation**:
```vue
<script setup>
const phone = ref('')
const isValid = ref(false)

function handleUpdate(payload) {
  isValid.value = payload.isValid
  console.log('Country:', payload.countryCode)
  console.log('E164:', payload.e164)
  console.log('National:', payload.nationalNumber)
}
</script>

<template>
  <MazInputPhoneNumber
    v-model="phone"
    default-country-code="US"
    show-code-on-list
    :success="isValid"
    @update="handleUpdate"
  />
</template>
```

**Required Dependency**:
```bash
pnpm add libphonenumber-js
```

## MazSelect

Dropdown select component with search and multiple selection.

**Basic Usage**:
```vue
<script setup>
const selected = ref(null)
const options = [
  { label: 'Option 1', value: 1 },
  { label: 'Option 2', value: 2 },
  { label: 'Option 3', value: 3 }
]
</script>

<template>
  <MazSelect
    v-model="selected"
    :options="options"
    label="Choose option"
    placeholder="Select one"
  />
</template>
```

**With Search**:
```vue
<template>
  <MazSelect
    v-model="selected"
    :options="options"
    label="Country"
    search
    searchPlaceholder="Search countries..."
  />
</template>
```

**Multiple Selection**:
```vue
<script setup>
const selectedItems = ref([])
</script>

<template>
  <MazSelect
    v-model="selectedItems"
    :options="options"
    label="Select multiple"
    multiple
  />
</template>
```

## MazCheckbox

Checkbox component with label and indeterminate state.

**Basic Usage**:
```vue
<script setup>
const agree = ref(false)
</script>

<template>
  <MazCheckbox v-model="agree" label="I agree to terms" />
</template>
```

**Indeterminate State**:
```vue
<script setup>
const allSelected = ref(false)
const indeterminate = ref(true)
</script>

<template>
  <MazCheckbox
    v-model="allSelected"
    :indeterminate="indeterminate"
    label="Select All"
  />
</template>
```

## MazRadio / MazRadioButtons

Radio button components for single selection.

**Individual Radios**:
```vue
<script setup>
const plan = ref('basic')
</script>

<template>
  <MazRadio v-model="plan" value="basic" label="Basic Plan" />
  <MazRadio v-model="plan" value="pro" label="Pro Plan" />
  <MazRadio v-model="plan" value="enterprise" label="Enterprise" />
</template>
```

**Radio Button Group**:
```vue
<script setup>
const plan = ref('basic')
const options = [
  { label: 'Basic', value: 'basic' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' }
]
</script>

<template>
  <MazRadioButtons
    v-model="plan"
    :options="options"
    orientation="horizontal"
  />
</template>
```

## MazSwitch

Toggle switch component.

**Basic Usage**:
```vue
<script setup>
const enabled = ref(false)
</script>

<template>
  <MazSwitch v-model="enabled" label="Enable feature" />
</template>
```

**With Colors**:
```vue
<template>
  <MazSwitch v-model="enabled" label="Notifications" color="success" />
</template>
```

## MazTextarea

Multi-line text input.

**Basic Usage**:
```vue
<script setup>
const message = ref('')
</script>

<template>
  <MazTextarea
    v-model="message"
    label="Message"
    placeholder="Enter your message"
    :rows="4"
  />
</template>
```

**Auto-Resize**:
```vue
<template>
  <MazTextarea
    v-model="message"
    label="Message"
    auto-grow
    :min-height="100"
    :max-height="400"
  />
</template>
```

## MazSlider

Range slider component.

**Basic Usage**:
```vue
<script setup>
const value = ref(50)
</script>

<template>
  <MazSlider
    v-model="value"
    label="Volume"
    :min="0"
    :max="100"
    :step="5"
  />
</template>
```

**Range Slider**:
```vue
<script setup>
const range = ref([20, 80])
</script>

<template>
  <MazSlider
    v-model="range"
    label="Price Range"
    :min="0"
    :max="1000"
    :step="10"
  />
</template>
```

## MazInputCode

PIN/code input component.

**Basic Usage**:
```vue
<script setup>
const code = ref('')
</script>

<template>
  <MazInputCode
    v-model="code"
    :code-length="6"
    type="number"
    @completed="handleCodeComplete"
  />
</template>
```

## MazInputTags

Tag/chip input component.

**Basic Usage**:
```vue
<script setup>
const tags = ref(['vue', 'nuxt'])
</script>

<template>
  <MazInputTags
    v-model="tags"
    label="Tags"
    placeholder="Add tag"
  />
</template>
```

## MazInputPrice

Currency input with formatting.

**Basic Usage**:
```vue
<script setup>
const price = ref(null)
</script>

<template>
  <MazInputPrice
    v-model="price"
    label="Price"
    currency="USD"
    locale="en-US"
  />
</template>
```

## MazDatePicker

Date picker component.

**Basic Usage**:
```vue
<script setup>
const date = ref(null)
</script>

<template>
  <MazDatePicker
    v-model="date"
    label="Select Date"
    format="YYYY-MM-DD"
  />
</template>
```

**Date Range**:
```vue
<script setup>
const dateRange = ref({ start: null, end: null })
</script>

<template>
  <MazDatePicker
    v-model="dateRange"
    label="Date Range"
    range
  />
</template>
```

## MazChecklist

Searchable checklist with multiple selection.

**Basic Usage**:
```vue
<script setup>
const selectedItems = ref([])
const items = [
  { label: 'Item 1', value: 1 },
  { label: 'Item 2', value: 2 },
  { label: 'Item 3', value: 3 }
]
</script>

<template>
  <MazChecklist
    v-model="selectedItems"
    :options="items"
    search
    searchPlaceholder="Search items..."
  />
</template>
```

## Form Validation with useFormValidator

**Setup** (Valibot required):
```bash
pnpm add valibot
```

**Usage**:
```vue
<script setup>
import { string, email, minLength } from 'valibot'
import { useFormValidator } from 'maz-ui/composables'

const formData = ref({
  email: '',
  password: '',
  name: ''
})

const { errors, validate, isValid } = useFormValidator({
  schema: {
    email: [string(), email()],
    password: [string(), minLength(8)],
    name: [string(), minLength(2)]
  },
  data: formData
})

async function handleSubmit() {
  if (await validate()) {
    console.log('Form is valid!', formData.value)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <MazInput
      v-model="formData.email"
      label="Email"
      type="email"
      :error="!!errors.email"
      :hint="errors.email"
    />

    <MazInput
      v-model="formData.password"
      label="Password"
      type="password"
      :error="!!errors.password"
      :hint="errors.password"
    />

    <MazInput
      v-model="formData.name"
      label="Name"
      :error="!!errors.name"
      :hint="errors.name"
    />

    <MazBtn
      type="submit"
      color="primary"
      :disabled="!isValid"
    >
      Submit
    </MazBtn>
  </form>
</template>
```

## Common Props (Most Components)

- **size**: 'mini' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- **color**: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'destructive' | 'accent' | 'contrast'
- **rounded-size**: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
- **disabled**: boolean
- **required**: boolean
- **error**: boolean
- **warning**: boolean
- **success**: boolean
- **hint**: string (error message)
- **label**: string
- **placeholder**: string
