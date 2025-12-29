<script setup lang="ts">
// ✅ Vue 3: Explicit imports
import { ref } from 'vue'
import { useFormValidator } from 'maz-ui/composables/useFormValidator'
import { useToast } from 'maz-ui/composables/useToast'
import { pipe, string, email, minLength } from 'valibot'

// Current step tracker
const currentStep = ref(1)

// Step 1 schema
const step1Schema = {
  firstName: pipe(string('First name is required'), minLength(2)),
  lastName: pipe(string('Last name is required'), minLength(2)),
  email: pipe(string('Email is required'), email('Invalid email'))
}

// Step 2 schema
const step2Schema = {
  address: pipe(string('Address is required'), minLength(5)),
  city: pipe(string('City is required'), minLength(2)),
  zipCode: pipe(string('ZIP code is required'), minLength(5))
}

// ✅ FIXED: Removed unused step3Schema (review step needs no validation)

// Form validators for each step
const step1 = useFormValidator({ schema: step1Schema, mode: 'lazy' })
const step2 = useFormValidator({ schema: step2Schema, mode: 'lazy' })

// Composables
const toast = useToast()

// ✅ FIXED: Removed canProceed computed - validation happens in nextStep()
// The computed was checking errors.value which is empty in lazy mode until validation runs

// Navigation
async function nextStep() {
  if (currentStep.value === 1) {
    const valid = await step1.validate()
    if (!valid) {
      toast.warning('Please fix errors before proceeding')
      return
    }
  }

  if (currentStep.value === 2) {
    const valid = await step2.validate()
    if (!valid) {
      toast.warning('Please fix errors before proceeding')
      return
    }
  }

  if (currentStep.value < 3) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Final submission
async function submitForm() {
  try {
    const allData = {
      ...step1.model.value,
      ...step2.model.value
    }

    // ✅ Vue 3: Use standard fetch() API (not $fetch)
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allData)
    })

    if (!response.ok) {
      throw new Error('Submission failed')
    }

    toast.success('Form submitted successfully!')

    // ✅ FIXED: Manual model reset (resetForm() doesn't exist on useFormValidator)
    step1.model.value = { firstName: '', lastName: '', email: '' }
    step2.model.value = { address: '', city: '', zipCode: '' }
    currentStep.value = 1
  } catch (error) {
    toast.error('Failed to submit form')
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <h2 class="text-2xl font-bold mb-6">Multi-Step Form</h2>

    <!-- Stepper -->
    <MazStepper
      v-model="currentStep"
      :steps="[
        { label: 'Personal Info' },
        { label: 'Address' },
        { label: 'Review' }
      ]"
      class="mb-8"
    />

    <!-- Step 1: Personal Info -->
    <div v-if="currentStep === 1" class="space-y-6">
      <MazInput
        v-model="step1.model.value.firstName"
        label="First Name"
        :error="!!step1.errorMessages.value.firstName"
        :error-message="step1.errorMessages.value.firstName"
      />

      <MazInput
        v-model="step1.model.value.lastName"
        label="Last Name"
        :error="!!step1.errorMessages.value.lastName"
        :error-message="step1.errorMessages.value.lastName"
      />

      <MazInput
        v-model="step1.model.value.email"
        type="email"
        label="Email"
        :error="!!step1.errorMessages.value.email"
        :error-message="step1.errorMessages.value.email"
      />
    </div>

    <!-- Step 2: Address -->
    <div v-if="currentStep === 2" class="space-y-6">
      <MazInput
        v-model="step2.model.value.address"
        label="Street Address"
        :error="!!step2.errorMessages.value.address"
        :error-message="step2.errorMessages.value.address"
      />

      <div class="grid grid-cols-2 gap-4">
        <MazInput
          v-model="step2.model.value.city"
          label="City"
          :error="!!step2.errorMessages.value.city"
          :error-message="step2.errorMessages.value.city"
        />

        <MazInput
          v-model="step2.model.value.zipCode"
          label="ZIP Code"
          :error="!!step2.errorMessages.value.zipCode"
          :error-message="step2.errorMessages.value.zipCode"
        />
      </div>
    </div>

    <!-- Step 3: Review -->
    <div v-if="currentStep === 3" class="space-y-4">
      <h3 class="text-lg font-semibold mb-4">Review Your Information</h3>

      <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Personal Info</p>
          <p class="font-medium">
            {{ step1.model.value.firstName }} {{ step1.model.value.lastName }}
          </p>
          <p class="text-sm">{{ step1.model.value.email }}</p>
        </div>

        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Address</p>
          <p class="font-medium">{{ step2.model.value.address }}</p>
          <p class="text-sm">
            {{ step2.model.value.city }}, {{ step2.model.value.zipCode }}
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex justify-between mt-8">
      <MazBtn
        @click="prevStep"
        :disabled="currentStep === 1"
        outlined
      >
        Previous
      </MazBtn>

      <MazBtn
        v-if="currentStep < 3"
        @click="nextStep"
        color="primary"
      >
        Next
      </MazBtn>

      <MazBtn
        v-else
        @click="submitForm"
        color="success"
      >
        Submit
      </MazBtn>
    </div>
  </div>
</template>
