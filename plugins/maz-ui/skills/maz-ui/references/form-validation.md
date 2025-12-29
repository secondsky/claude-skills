---
name: "Maz-UI Form Validation Reference"
description: "Complete guide to form validation in Maz-UI using useFormValidator composable with Valibot integration"
version: "4.3.3"
framework: "Vue 3 / Nuxt 3"
---

# Maz-UI Form Validation Guide

Complete guide to form validation in Maz-UI using the `useFormValidator` composable with Valibot integration.

## Overview

Maz-UI provides a powerful form validation system through the `useFormValidator` composable, offering:

- 🔒 TypeScript type safety (automatic type inference from schemas)
- 📝 5 validation modes (lazy, aggressive, eager, blur, progressive)
- ✅ Valibot integration (60+ built-in validators)
- 🎯 Field-level validation states
- 🚀 Async validation support
- ♿ Accessibility built-in (ARIA attributes)

---

## Basic Setup

### Installation

```bash
npm install valibot
```

### Framework Differences: Vue vs Nuxt

This guide shows examples for both **Vue 3** and **Nuxt 3**. The key differences:

**Vue 3 + Vite**:
- ✅ Explicit imports required: `import { ref } from 'vue'`
- ✅ Import Maz-UI: `import { useFormValidator } from 'maz-ui/composables'`
- ✅ Import Valibot: `import { string, email, pipe } from 'valibot'`

**Nuxt 3**:
- ✅ Auto-imports enabled (no import statements needed)
- ✅ `ref`, `computed`, `watch` - auto-imported from Vue
- ✅ `useFormValidator`, `useToast` - auto-imported from Maz-UI
- ✅ `string`, `email`, `pipe` - auto-imported from Valibot

Throughout this guide, examples will show both versions where they differ.

---

### Simple Form Validation

#### Vue 3 + Vite

```vue
<script setup lang="ts">
import { useFormValidator } from 'maz-ui/composables'
import { string, email, pipe, minLength, nonEmpty } from 'valibot'

// Define validation schema
const schema = {
  email: pipe(
    string('Email is required'),
    nonEmpty('Email is required'),
    email('Invalid email format')
  ),
  password: pipe(
    string('Password is required'),
    minLength(8, 'Password must be at least 8 characters')
  )
}

// Initialize form validator
const {
  model,
  isSubmitting,
  errorMessages,
  fieldsStates,
  handleSubmit
} = useFormValidator({ schema })

// Submit handler
const onSubmit = handleSubmit(async (formData) => {
  console.log('Valid form data:', formData)
  // formData is fully typed from schema
  await api.login(formData.email, formData.password)
})
</script>

<template>
  <form @submit.prevent="onSubmit">
    <MazInput
      v-model="model.email"
      label="Email"
      type="email"
      :error="errorMessages.email"
      :success="fieldsStates.email.valid"
    />

    <MazInput
      v-model="model.password"
      label="Password"
      type="password"
      :error="errorMessages.password"
      :success="fieldsStates.password.valid"
    />

    <MazBtn type="submit" :loading="isSubmitting">
      Login
    </MazBtn>
  </form>
</template>
```

#### Nuxt 3

```vue
<script setup lang="ts">
// ✅ No imports needed - auto-imported!
// useFormValidator, string, email, pipe, minLength, nonEmpty all available

// Define validation schema
const schema = {
  email: pipe(
    string('Email is required'),
    nonEmpty('Email is required'),
    email('Invalid email format')
  ),
  password: pipe(
    string('Password is required'),
    minLength(8, 'Password must be at least 8 characters')
  )
}

// Initialize form validator
const {
  model,
  isSubmitting,
  errorMessages,
  fieldsStates,
  handleSubmit
} = useFormValidator({ schema })

// Submit handler
const onSubmit = handleSubmit(async (formData) => {
  console.log('Valid form data:', formData)
  // formData is fully typed from schema

  // ✅ Nuxt: Use $fetch
  await $fetch('/api/login', {
    method: 'POST',
    body: { email: formData.email, password: formData.password }
  })
})
</script>

<template>
  <form @submit.prevent="onSubmit">
    <MazInput
      v-model="model.email"
      label="Email"
      type="email"
      :error="errorMessages.email"
      :success="fieldsStates.email.valid"
    />

    <MazInput
      v-model="model.password"
      label="Password"
      type="password"
      :error="errorMessages.password"
      :success="fieldsStates.password.valid"
    />

    <MazBtn type="submit" :loading="isSubmitting">
      Login
    </MazBtn>
  </form>
</template>
```

---

## Validation Modes

### Lazy Mode (Default)

**Validates**: On submit only

```typescript
const { model, handleSubmit } = useFormValidator({
  schema,
  mode: 'lazy' // Default
})
```

**Best for**:
- Simple forms
- One-time submission
- Minimal validation UX

**User experience**:
- No validation on input
- Errors appear after submit attempt
- Fast initial interaction

---

### Aggressive Mode

**Validates**: On every keystroke

```typescript
const { model } = useFormValidator({
  schema,
  mode: 'aggressive'
})
```

**Best for**:
- Complex validation rules
- Real-time feedback needed
- Password strength meters

**User experience**:
- Immediate validation feedback
- Can be overwhelming for users
- Best for technical users

**Example**: Password strength indicator

```vue
<script setup lang="ts">
// ✅ Vue 3: Explicit imports
import { useFormValidator } from 'maz-ui/composables'
import { pipe, string, minLength, custom } from 'valibot'

const schema = {
  password: pipe(
    string(),
    minLength(8),
    custom((value) => {
      const hasUppercase = /[A-Z]/.test(value)
      const hasLowercase = /[a-z]/.test(value)
      const hasNumber = /[0-9]/.test(value)
      const hasSpecial = /[!@#$%^&*]/.test(value)

      return hasUppercase && hasLowercase && hasNumber && hasSpecial
    }, 'Password must include uppercase, lowercase, number, and special character')
  )
}

const { model, errorMessages } = useFormValidator({
  schema,
  mode: 'aggressive' // Instant feedback
})
</script>

<template>
  <MazInput
    v-model="model.password"
    label="Password"
    type="password"
    :error="errorMessages.password"
    hint="Must include uppercase, lowercase, number, and special character"
  />
</template>
```

---

### Eager Mode

**Validates**: On input change after first blur

```typescript
const { model } = useFormValidator({
  schema,
  mode: 'eager'
})
```

**Best for**:
- Most forms (recommended)
- Balance between UX and validation
- Standard web applications

**User experience**:
- No validation until user leaves field
- Then validates on every change
- Good balance of feedback

---

### Blur Mode

**Validates**: Only when field loses focus

```typescript
const { model } = useFormValidator({
  schema,
  mode: 'blur'
})
```

**Best for**:
- Long forms
- Reduced visual noise
- Mobile forms (less intrusive)

**User experience**:
- Validation appears after leaving field
- Less intrusive than aggressive
- Cleaner form appearance

---

### Progressive Mode

**Validates**: Progressively as form is filled

```typescript
const { model } = useFormValidator({
  schema,
  mode: 'progressive'
})
```

**Best for**:
- Multi-step forms
- Wizard-style interfaces
- Sequential input patterns

**User experience**:
- Validates completed fields first
- Guides user through form
- Reduces cognitive load

---

## Valibot Schema Patterns

### Basic Validators

```typescript
import {
  string,
  number,
  boolean,
  array,
  object,
  pipe,
  nonEmpty,
  email,
  url,
  minLength,
  maxLength,
  minValue,
  maxValue,
  regex
} from 'valibot'

const schema = {
  // String validation
  name: pipe(
    string('Name is required'),
    nonEmpty('Name cannot be empty'),
    minLength(2, 'Name must be at least 2 characters')
  ),

  // Email validation
  email: pipe(
    string(),
    email('Invalid email format')
  ),

  // Number validation
  age: pipe(
    number('Age must be a number'),
    minValue(18, 'Must be 18 or older'),
    maxValue(120, 'Invalid age')
  ),

  // Boolean validation
  terms: pipe(
    boolean(),
    custom((value) => value === true, 'You must accept the terms')
  ),

  // URL validation
  website: pipe(
    string(),
    url('Invalid URL format')
  ),

  // Pattern validation
  phone: pipe(
    string(),
    regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
  )
}
```

---

### Custom Validators

```typescript
import { custom, string, pipe } from 'valibot'

const schema = {
  username: pipe(
    string(),
    minLength(3),
    custom((value) => {
      // No spaces allowed
      return !value.includes(' ')
    }, 'Username cannot contain spaces'),
    custom((value) => {
      // Only alphanumeric and underscore
      return /^[a-zA-Z0-9_]+$/.test(value)
    }, 'Username can only contain letters, numbers, and underscores')
  ),

  // Password strength
  password: pipe(
    string(),
    minLength(8),
    custom((value) => {
      const strength = calculatePasswordStrength(value)
      return strength >= 3 // Strong password
    }, 'Password is too weak')
  )
}

function calculatePasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[!@#$%^&*]/.test(password)) strength++
  return strength
}
```

---

### Async Validation

```typescript
import { customAsync } from 'valibot'

const schema = {
  username: pipe(
    string(),
    minLength(3),
    customAsync(async (value) => {
      // Check if username is available
      const response = await fetch(`/api/check-username?username=${value}`)
      const { available } = await response.json()
      return available
    }, 'Username is already taken')
  ),

  email: pipe(
    string(),
    email(),
    customAsync(async (value) => {
      // Check if email is registered
      const response = await fetch(`/api/check-email?email=${value}`)
      const { exists } = await response.json()
      return !exists
    }, 'Email is already registered')
  )
}
```

---

### Conditional Validation

```typescript
import { object, string, pipe, optional, custom } from 'valibot'

const schema = object({
  shippingMethod: string(),

  // Only validate if shipping method is 'express'
  expressDate: pipe(
    string(),
    custom((value, context) => {
      const shippingMethod = context.dataset.shippingMethod
      if (shippingMethod === 'express' && !value) {
        return false
      }
      return true
    }, 'Express shipping requires a delivery date')
  ),

  // Optional field with validation when provided
  promoCode: optional(pipe(
    string(),
    regex(/^PROMO[0-9]{4}$/, 'Invalid promo code format')
  ))
})
```

---

## Real-World Form Examples

### Multi-Step Registration Form

```vue
<script setup lang="ts">
// ✅ Vue 3: Explicit imports
import { ref } from 'vue'
import { useFormValidator } from 'maz-ui/composables'
import { string, email, pipe, minLength, boolean } from 'valibot'

const currentStep = ref(1)

// Step 1: Personal Info
const step1Schema = {
  firstName: pipe(string(), minLength(2)),
  lastName: pipe(string(), minLength(2)),
  email: pipe(string(), email())
}

const step1 = useFormValidator({
  schema: step1Schema,
  mode: 'eager'
})

// Step 2: Account
const step2Schema = {
  username: pipe(string(), minLength(3)),
  password: pipe(string(), minLength(8))
}

const step2 = useFormValidator({
  schema: step2Schema,
  mode: 'eager'
})

// Step 3: Preferences
const step3Schema = {
  newsletter: boolean(),
  notifications: boolean()
}

const step3 = useFormValidator({
  schema: step3Schema
})

const nextStep = step1.handleSubmit(() => {
  currentStep.value = 2
})

const nextStep2 = step2.handleSubmit(() => {
  currentStep.value = 3
})

const finalSubmit = step3.handleSubmit(async () => {
  const allData = {
    ...step1.model,
    ...step2.model,
    ...step3.model
  }

  await api.register(allData)
  toast.success('Registration complete!')
})
</script>

<template>
  <MazStepper v-model="currentStep" :steps="3" />

  <!-- Step 1: Personal Info -->
  <form v-if="currentStep === 1" @submit.prevent="nextStep">
    <MazInput
      v-model="step1.model.firstName"
      label="First Name"
      :error="step1.errorMessages.firstName"
    />
    <MazInput
      v-model="step1.model.lastName"
      label="Last Name"
      :error="step1.errorMessages.lastName"
    />
    <MazInput
      v-model="step1.model.email"
      label="Email"
      type="email"
      :error="step1.errorMessages.email"
    />
    <MazBtn type="submit">Next</MazBtn>
  </form>

  <!-- Step 2: Account -->
  <form v-if="currentStep === 2" @submit.prevent="nextStep2">
    <MazInput
      v-model="step2.model.username"
      label="Username"
      :error="step2.errorMessages.username"
    />
    <MazInput
      v-model="step2.model.password"
      label="Password"
      type="password"
      :error="step2.errorMessages.password"
    />
    <MazBtn @click="currentStep = 1">Back</MazBtn>
    <MazBtn type="submit">Next</MazBtn>
  </form>

  <!-- Step 3: Preferences -->
  <form v-if="currentStep === 3" @submit.prevent="finalSubmit">
    <MazCheckbox
      v-model="step3.model.newsletter"
      label="Subscribe to newsletter"
    />
    <MazCheckbox
      v-model="step3.model.notifications"
      label="Enable notifications"
    />
    <MazBtn @click="currentStep = 2">Back</MazBtn>
    <MazBtn type="submit" :loading="step3.isSubmitting">
      Complete Registration
    </MazBtn>
  </form>
</template>
```

---

### Dynamic Form with Conditional Fields

```vue
<script setup lang="ts">
// ✅ Vue 3: Explicit imports
import { ref, computed, watch } from 'vue'
import { useFormValidator } from 'maz-ui/composables'
import { string, email, pipe, minLength, regex } from 'valibot'

const accountType = ref('personal')

const schema = computed(() => ({
  accountType: string(),

  // Personal account fields
  ...(accountType.value === 'personal' && {
    firstName: pipe(string(), minLength(2)),
    lastName: pipe(string(), minLength(2))
  }),

  // Business account fields
  ...(accountType.value === 'business' && {
    companyName: pipe(string(), minLength(2)),
    taxId: pipe(string(), regex(/^\d{2}-\d{7}$/))
  }),

  email: pipe(string(), email())
}))

const { model, errorMessages, handleSubmit } = useFormValidator({
  schema,
  mode: 'eager'
})

watch(accountType, (newType) => {
  model.accountType = newType
})

const onSubmit = handleSubmit(async (data) => {
  await api.createAccount(data)
})
</script>

<template>
  <form @submit.prevent="onSubmit">
    <MazSelect
      v-model="accountType"
      label="Account Type"
      :options="[
        { value: 'personal', label: 'Personal' },
        { value: 'business', label: 'Business' }
      ]"
    />

    <!-- Personal fields -->
    <template v-if="accountType === 'personal'">
      <MazInput
        v-model="model.firstName"
        label="First Name"
        :error="errorMessages.firstName"
      />
      <MazInput
        v-model="model.lastName"
        label="Last Name"
        :error="errorMessages.lastName"
      />
    </template>

    <!-- Business fields -->
    <template v-if="accountType === 'business'">
      <MazInput
        v-model="model.companyName"
        label="Company Name"
        :error="errorMessages.companyName"
      />
      <MazInput
        v-model="model.taxId"
        label="Tax ID"
        placeholder="XX-XXXXXXX"
        :error="errorMessages.taxId"
      />
    </template>

    <MazInput
      v-model="model.email"
      label="Email"
      type="email"
      :error="errorMessages.email"
    />

    <MazBtn type="submit">Create Account</MazBtn>
  </form>
</template>
```

---

## Error Handling Patterns

### Field-Level Errors

```vue
<script setup lang="ts">
const { model, errorMessages, fieldsStates } = useFormValidator({ schema })
</script>

<template>
  <MazInput
    v-model="model.email"
    label="Email"
    :error="errorMessages.email"
    :success="fieldsStates.email.valid"
    :warning="fieldsStates.email.validating"
  />
</template>
```

---

### Global Error Messages

```vue
<script setup lang="ts">
const { errorMessages, hasErrors } = useFormValidator({ schema })

const globalErrors = computed(() => {
  return Object.values(errorMessages).filter(Boolean)
})
</script>

<template>
  <MazAlert v-if="hasErrors" color="destructive">
    <ul>
      <li v-for="error in globalErrors" :key="error">
        {{ error }}
      </li>
    </ul>
  </MazAlert>
</template>
```

---

### Custom Error Messages

```typescript
const schema = {
  password: pipe(
    string(),
    minLength(8, 'Too short!'), // Custom message
    custom((value) => {
      return /[A-Z]/.test(value)
    }, 'Needs uppercase letter') // Custom message
  )
}
```

---

## TypeScript Type Inference

### Automatic Type Safety

```typescript
const schema = {
  name: string(),
  age: number(),
  email: pipe(string(), email()),
  newsletter: boolean()
}

const { model, handleSubmit } = useFormValidator({ schema })

// model is fully typed:
// {
//   name: string
//   age: number
//   email: string
//   newsletter: boolean
// }

const onSubmit = handleSubmit((data) => {
  // data is fully typed (same as model)
  console.log(data.name) // ✅ string
  console.log(data.age) // ✅ number
  // console.log(data.unknown) // ❌ TypeScript error
})
```

---

### Complex Type Inference

```typescript
import { object, array, string, number } from 'valibot'

const schema = object({
  user: object({
    name: string(),
    age: number()
  }),
  tags: array(string()),
  settings: object({
    notifications: boolean()
  })
})

const { model } = useFormValidator({ schema })

// model is typed as:
// {
//   user: {
//     name: string
//     age: number
//   }
//   tags: string[]
//   settings: {
//     notifications: boolean
//   }
// }
```

---

## Performance Optimization

### Debouncing Validation

```vue
<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const schema = {
  username: pipe(
    string(),
    customAsync(async (value) => {
      const { available } = await api.checkUsername(value)
      return available
    }, 'Username taken')
  )
}

const { model, errorMessages } = useFormValidator({
  schema,
  mode: 'eager'
})

// Debounce username validation to avoid excessive API calls
const debouncedValidation = useDebounceFn(() => {
  // Validation happens automatically via useFormValidator
}, 500)

watch(() => model.username, debouncedValidation)
</script>

<template>
  <MazInput
    v-model="model.username"
    label="Username"
    :error="errorMessages.username"
    hint="Checking availability..."
  />
</template>
```

---

### Conditional Validation

Only validate when necessary:

```typescript
const schema = computed(() => {
  const base = {
    email: pipe(string(), email())
  }

  // Only add password validation for new users
  if (!props.isEditing) {
    base.password = pipe(string(), minLength(8))
  }

  return base
})

const { model } = useFormValidator({ schema })
```

---

## Testing Form Validation

### Unit Testing

```typescript
// forms/login.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginForm from './LoginForm.vue'

describe('LoginForm', () => {
  it('should show error for invalid email', async () => {
    const wrapper = mount(LoginForm)

    const emailInput = wrapper.find('input[type="email"]')
    await emailInput.setValue('invalid-email')
    await emailInput.trigger('blur')

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Invalid email format')
  })

  it('should submit with valid data', async () => {
    const wrapper = mount(LoginForm)

    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')

    await wrapper.find('form').trigger('submit')

    // Assert API was called with correct data
    expect(mockApi.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123'
    })
  })
})
```

---

### E2E Testing

```typescript
// e2e/registration.spec.ts
import { test, expect } from '@playwright/test'

test('registration form validation', async ({ page }) => {
  await page.goto('/register')

  // Submit without filling form
  await page.click('button[type="submit"]')

  // Check error messages appear
  await expect(page.locator('text=Email is required')).toBeVisible()
  await expect(page.locator('text=Password is required')).toBeVisible()

  // Fill valid data
  await page.fill('input[name="email"]', 'user@example.com')
  await page.fill('input[name="password"]', 'SecurePass123!')

  // Submit
  await page.click('button[type="submit"]')

  // Check success
  await expect(page.locator('text=Registration successful')).toBeVisible()
})
```

---

## Accessibility Considerations

### ARIA Attributes

```vue
<template>
  <MazInput
    v-model="model.email"
    label="Email"
    :error="errorMessages.email"
    :aria-invalid="!!errorMessages.email"
    :aria-describedby="errorMessages.email ? 'email-error' : undefined"
  />

  <span
    v-if="errorMessages.email"
    id="email-error"
    role="alert"
    class="error-message"
  >
    {{ errorMessages.email }}
  </span>
</template>
```

**Generated HTML**:
```html
<input
  type="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  Invalid email format
</span>
```

---

### Live Regions

```vue
<template>
  <div aria-live="polite" aria-atomic="true">
    <span v-if="fieldsStates.email.validating">
      Checking email availability...
    </span>
    <span v-else-if="fieldsStates.email.valid">
      Email is available
    </span>
  </div>
</template>
```

---

## Validation Checklist

### Form-Level

- [ ] **Validation mode** chosen based on UX requirements
- [ ] **Error messages** clear and actionable
- [ ] **Success states** shown for valid fields
- [ ] **Submit button** disabled during submission
- [ ] **Loading states** shown during async validation
- [ ] **ARIA attributes** properly set (`aria-invalid`, `aria-describedby`)

### Field-Level

- [ ] **Required fields** marked with `*` or "(required)"
- [ ] **Password fields** use `type="password"`
- [ ] **Email fields** use `type="email"` + email validator
- [ ] **Number fields** use appropriate min/max validators
- [ ] **Custom validators** have clear error messages
- [ ] **Async validators** debounced to avoid excessive API calls

---

## Related Documentation

- **[Composables](./composables.md)** - useFormValidator API reference
- **[Components Forms](./components-forms.md)** - Form components
- **[Accessibility](./accessibility.md)** - Form accessibility
- **[Troubleshooting](./troubleshooting.md)** - Common validation errors

---

## External Resources

- **[Valibot Documentation](https://valibot.dev/)** - Complete Valibot guide
- **[Valibot Validators](https://valibot.dev/api/)** - All built-in validators
- **[ARIA Forms](https://www.w3.org/WAI/ARIA/apg/patterns/forms/)** - ARIA form patterns

---

**Form Validation Version**: Maz-UI v4.3.3 + Valibot
**Last Updated**: 2025-12-29

::: tip Validation Mode Recommendation
For most forms, use `mode: 'eager'` for the best balance between user experience and validation feedback. It validates after the first blur, then on every change.
:::
