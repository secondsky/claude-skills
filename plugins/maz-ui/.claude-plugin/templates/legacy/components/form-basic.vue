<script setup lang="ts">
import { ref } from 'vue'
import { useFormValidator } from 'maz-ui/composables/useFormValidator'
import { useToast } from 'maz-ui/composables/useToast'
import { pipe, string, email, minLength } from 'valibot'
import type { InferOutput } from 'valibot'

// Validation schema
const schema = {
  name: pipe(
    string('Name is required'),
    minLength(2, 'Name must be at least 2 characters')
  ),
  email: pipe(
    string('Email is required'),
    email('Please enter a valid email address')
  ),
  message: pipe(
    string('Message is required'),
    minLength(10, 'Message must be at least 10 characters')
  )
}

// Type inference from schema
type FormData = InferOutput<typeof schema>

// Form validator
const {
  model,
  errors,
  errorMessages,
  fieldsStates,
  handleSubmit,
  isSubmitting,
  resetForm
} = useFormValidator({
  schema,
  mode: 'lazy' // Validates after first submit, then real-time
})

// Composables
const toast = useToast()

// Submit handler
const onSubmit = handleSubmit(async (formData: FormData) => {
  try {
    // Replace with your API endpoint
    const response = await $fetch('/api/contact', {
      method: 'POST',
      body: formData
    })

    // Success feedback
    toast.success('Form submitted successfully!', {
      timeout: 3000,
      position: 'top-right'
    })

    // Reset form
    resetForm()
  } catch (error) {
    // Error handling
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to submit form. Please try again.'

    toast.error(errorMessage, {
      timeout: 5000,
      button: {
        text: 'Retry',
        onClick: () => onSubmit(),
        closeToast: true
      }
    })
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <h2 class="text-2xl font-bold mb-6">Contact Form</h2>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- Name Field -->
      <MazInput
        v-model="model.name"
        label="Full Name"
        placeholder="Enter your full name"
        :error="!!errorMessages.name"
        :error-message="errorMessages.name"
        :aria-invalid="!!errorMessages.name"
        :aria-describedby="errorMessages.name ? 'name-error' : undefined"
      />

      <!-- Email Field -->
      <MazInput
        v-model="model.email"
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        :error="!!errorMessages.email"
        :error-message="errorMessages.email"
        autocomplete="email"
      />

      <!-- Message Field -->
      <MazTextarea
        v-model="model.message"
        label="Message"
        placeholder="Enter your message"
        rows="5"
        :error="!!errorMessages.message"
        :error-message="errorMessages.message"
        :maxlength="500"
        show-counter
      />

      <!-- Submit Button -->
      <MazBtn
        type="submit"
        color="primary"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        block
        size="lg"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit' }}
      </MazBtn>
    </form>
  </div>
</template>
