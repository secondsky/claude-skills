# Form Validation Patterns

## Basic Validation with Zod

```vue
<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters')
})

const state = reactive({ email: '', password: '' })

async function onSubmit(data: any) {
  // Data is already validated
  console.log(data)
}
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="email" label="Email">
      <UInput v-model="state.email" />
    </UFormField>

    <UFormField name="password" label="Password">
      <UInput v-model="state.password" type="password" />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

## Nested Forms

```vue
<UForm :state="outerState" @submit="onSubmit">
  <UForm :state="innerState" nested>
    <!-- Inner form fields -->
  </UForm>
</UForm>
```

## Transformations

Transformations apply only to submit data, not internal state.
