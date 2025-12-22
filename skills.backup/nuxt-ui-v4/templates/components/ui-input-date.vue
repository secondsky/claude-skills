<template>
  <div class="max-w-2xl mx-auto p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">InputDate Component (v4.2+)</h2>
        <p class="text-dimmed mt-1">Date picker with calendar UI, range selection, and custom validation</p>
      </template>

      <!-- Single Date Picker -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">Single Date</h3>
        <UFormField label="Select a date">
          <UInputDate v-model="singleDate" />
        </UFormField>
        <p class="text-sm text-muted mt-2">Selected: {{ formatDate(singleDate) }}</p>
      </div>

      <!-- Date Range Picker -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">Date Range</h3>
        <UFormField label="Select date range">
          <UInputDate v-model="dateRange" range />
        </UFormField>
        <p class="text-sm text-muted mt-2">
          Range: {{ formatDate(dateRange?.start) }} - {{ formatDate(dateRange?.end) }}
        </p>
      </div>

      <!-- Unavailable Dates (Weekends) -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">Weekdays Only (No Weekends)</h3>
        <UFormField label="Select a weekday">
          <UInputDate v-model="weekdayDate" :is-date-unavailable="isWeekend" />
        </UFormField>
        <p class="text-sm text-muted mt-2">Selected: {{ formatDate(weekdayDate) }}</p>
      </div>

      <!-- Date Range with Min/Max -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">Limited Range (Next 30 Days)</h3>
        <UFormField label="Select future date">
          <UInputDate
            v-model="futureDate"
            :is-date-unavailable="isPast"
          />
        </UFormField>
        <p class="text-sm text-muted mt-2">Selected: {{ formatDate(futureDate) }}</p>
      </div>

      <!-- Form with Validation -->
      <div class="mt-8 pt-6 border-t">
        <h3 class="text-lg font-semibold mb-4">Form Example with Validation</h3>
        <UForm :state="formState" :schema="schema" @submit="onSubmit">
          <UFormField name="birthDate" label="Birth Date" class="mb-4">
            <UInputDate v-model="formState.birthDate" />
          </UFormField>

          <UFormField name="startDate" label="Start Date (Must be today or later)" class="mb-4">
            <UInputDate v-model="formState.startDate" />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton type="submit" :loading="isSubmitting">Submit</UButton>
          </div>
        </UForm>

        <!-- Success Message -->
        <UAlert
          v-if="showSuccess"
          color="success"
          variant="subtle"
          title="Success!"
          description="Form submitted successfully"
          class="mt-4"
        />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import { z } from 'zod'

// Single date
const singleDate = ref(new CalendarDate(2024, 6, 15))

// Date range
const dateRange = ref({
  start: new CalendarDate(2024, 6, 1),
  end: new CalendarDate(2024, 6, 7)
})

// Weekday only
const weekdayDate = ref(new CalendarDate(2024, 6, 17)) // Monday

// Future dates only
const futureDate = ref(new CalendarDate(2024, 6, 20))

// Form state
const formState = reactive({
  birthDate: new CalendarDate(1990, 1, 1),
  startDate: new CalendarDate(2024, 6, 20)
})

const isSubmitting = ref(false)
const showSuccess = ref(false)

// Custom Zod validator for CalendarDate
const calendarDateSchema = z.custom<CalendarDate>(
  (val) => val instanceof CalendarDate,
  { message: 'Invalid date' }
)

// Schema with date validation
const schema = z.object({
  birthDate: calendarDateSchema.refine(
    (date) => {
      const today = new CalendarDate(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        new Date().getDate()
      )
      return date.compare(today) < 0
    },
    { message: 'Birth date must be in the past' }
  ),
  startDate: calendarDateSchema.refine(
    (date) => {
      const today = new CalendarDate(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        new Date().getDate()
      )
      return date.compare(today) >= 0
    },
    { message: 'Start date must be today or later' }
  )
})

// Helper functions
function isWeekend(date: CalendarDate): boolean {
  const dayOfWeek = date.toDate('UTC').getDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

function isPast(date: CalendarDate): boolean {
  const today = new CalendarDate(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  )
  return date.compare(today) < 0
}

function formatDate(date: CalendarDate | undefined): string {
  if (!date) return 'Not selected'
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

async function onSubmit() {
  isSubmitting.value = true
  showSuccess.value = false

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log('Form submitted:', {
    birthDate: formatDate(formState.birthDate),
    startDate: formatDate(formState.startDate)
  })

  isSubmitting.value = false
  showSuccess.value = true

  // Hide success message after 3 seconds
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}
</script>
