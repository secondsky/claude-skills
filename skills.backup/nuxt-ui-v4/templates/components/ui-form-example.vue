<template>
  <div class="max-w-2xl mx-auto p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Form Example with Validation</h2>
        <p class="text-dimmed mt-1">Demonstrates Input, Select, Checkbox, Radio with Zod validation</p>
      </template>

      <UForm :state="formState" :schema="schema" @submit="onSubmit">
        <!-- Text Input -->
        <UFormField name="email" label="Email" class="mb-4">
          <UInput
            v-model="formState.email"
            type="email"
            placeholder="you@example.com"
            required
          >
            <template #leading>
              <UIcon name="i-heroicons-envelope" />
            </template>
          </UInput>
        </UFormField>

        <!-- Password Input -->
        <UFormField name="password" label="Password" class="mb-4">
          <UInput
            v-model="formState.password"
            type="password"
            placeholder="••••••••"
            required
          >
            <template #leading>
              <UIcon name="i-heroicons-lock-closed" />
            </template>
          </UInput>
        </UFormField>

        <!-- Select Dropdown -->
        <UFormField name="role" label="Role" class="mb-4">
          <USelect
            v-model="formState.role"
            :options="roleOptions"
            placeholder="Select a role"
          />
        </UFormField>

        <!-- Checkbox -->
        <UFormField name="terms" label="Terms & Conditions" class="mb-4">
          <UCheckbox
            v-model="formState.terms"
            label="I agree to the terms and conditions"
          />
        </UFormField>

        <!-- Radio Group -->
        <UFormField name="plan" label="Subscription Plan" class="mb-4">
          <URadioGroup
            v-model="formState.plan"
            :options="planOptions"
          />
        </UFormField>

        <!-- Textarea -->
        <UFormField name="bio" label="Bio" class="mb-4">
          <UTextarea
            v-model="formState.bio"
            placeholder="Tell us about yourself..."
            :rows="4"
          />
        </UFormField>

        <!-- Submit Button -->
        <div class="flex justify-end gap-2 mt-6">
          <UButton variant="ghost" @click="resetForm">Reset</UButton>
          <UButton type="submit" :loading="isSubmitting">Submit</UButton>
        </div>
      </UForm>

      <!-- Success Message -->
      <UAlert
        v-if="successMessage"
        color="success"
        variant="subtle"
        title="Success!"
        :description="successMessage"
        class="mt-4"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'

// Zod validation schema
const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1, 'Please select a role'),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  plan: z.enum(['free', 'pro', 'enterprise'], { errorMap: () => ({ message: 'Please select a plan' }) }),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional()
})

// Form state
const formState = reactive({
  email: '',
  password: '',
  role: '',
  terms: false,
  plan: 'free',
  bio: ''
})

// Select options
const roleOptions = [
  { label: 'Developer', value: 'developer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Manager', value: 'manager' },
  { label: 'Other', value: 'other' }
]

// Radio options
const planOptions = [
  { value: 'free', label: 'Free', description: 'Basic features' },
  { value: 'pro', label: 'Pro', description: 'Advanced features' },
  { value: 'enterprise', label: 'Enterprise', description: 'All features + support' }
]

// State
const isSubmitting = ref(false)
const successMessage = ref('')

// Submit handler
async function onSubmit(data: z.infer<typeof schema>) {
  isSubmitting.value = true
  successMessage.value = ''

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Form submitted:', data)
    successMessage.value = 'Your form has been submitted successfully!'

    // Optionally reset form
    // resetForm()
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Reset form
function resetForm() {
  formState.email = ''
  formState.password = ''
  formState.role = ''
  formState.terms = false
  formState.plan = 'free'
  formState.bio = ''
  successMessage.value = ''
}
</script>
