<template>
  <div class="max-w-2xl mx-auto p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">InputTime Component (v4.2+)</h2>
        <p class="text-dimmed mt-1">Time picker with 12/24-hour format support and custom validation</p>
      </template>

      <!-- 12-Hour Format -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">12-Hour Format</h3>
        <UFormField label="Select time (12-hour)">
          <UInputTime v-model="time12" :hour-cycle="12" />
        </UFormField>
        <p class="text-sm text-muted mt-2">Selected: {{ formatTime(time12, 12) }}</p>
      </div>

      <!-- 24-Hour Format -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">24-Hour Format</h3>
        <UFormField label="Select time (24-hour)">
          <UInputTime v-model="time24" :hour-cycle="24" />
        </UFormField>
        <p class="text-sm text-muted mt-2">Selected: {{ formatTime(time24, 24) }}</p>
      </div>

      <!-- Business Hours Only -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">Business Hours (9 AM - 5 PM)</h3>
        <UFormField label="Select meeting time">
          <UInputTime v-model="meetingTime" :hour-cycle="12" />
        </UFormField>
        <p class="text-sm text-muted mt-2">Selected: {{ formatTime(meetingTime, 12) }}</p>
      </div>

      <!-- Combined Date + Time -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">Date + Time Combination</h3>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Date">
            <UInputDate v-model="appointmentDate" />
          </UFormField>
          <UFormField label="Time">
            <UInputTime v-model="appointmentTime" :hour-cycle="12" />
          </UFormField>
        </div>
        <p class="text-sm text-muted mt-2">
          Appointment: {{ formatDate(appointmentDate) }} at {{ formatTime(appointmentTime, 12) }}
        </p>
      </div>

      <!-- Form with Validation -->
      <div class="mt-8 pt-6 border-t">
        <h3 class="text-lg font-semibold mb-4">Form Example with Validation</h3>
        <UForm :state="formState" :schema="schema" @submit="onSubmit">
          <UFormField name="startTime" label="Start Time" class="mb-4">
            <UInputTime v-model="formState.startTime" :hour-cycle="24" />
          </UFormField>

          <UFormField name="endTime" label="End Time (Must be after start time)" class="mb-4">
            <UInputTime v-model="formState.endTime" :hour-cycle="24" />
          </UFormField>

          <UFormField name="breakTime" label="Break Time (Must be during business hours)" class="mb-4">
            <UInputTime v-model="formState.breakTime" :hour-cycle="12" />
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
import { CalendarDate, Time } from '@internationalized/date'
import { z } from 'zod'

// Time examples
const time12 = ref(new Time(2, 30))    // 2:30 AM
const time24 = ref(new Time(14, 30))   // 14:30 (2:30 PM)
const meetingTime = ref(new Time(10, 0)) // 10:00 AM

// Date + Time
const appointmentDate = ref(new CalendarDate(2024, 6, 20))
const appointmentTime = ref(new Time(14, 0)) // 2:00 PM

// Form state
const formState = reactive({
  startTime: new Time(9, 0),   // 9:00 AM
  endTime: new Time(17, 0),    // 5:00 PM
  breakTime: new Time(12, 0)   // 12:00 PM
})

const isSubmitting = ref(false)
const showSuccess = ref(false)

// Custom Zod validator for Time
const timeSchema = z.custom<Time>(
  (val) => val instanceof Time,
  { message: 'Invalid time' }
)

// Schema with time validation
const schema = z.object({
  startTime: timeSchema,
  endTime: timeSchema,
  breakTime: timeSchema.refine(
    (time) => {
      // Business hours: 9 AM - 5 PM
      const hour = time.hour
      return hour >= 9 && hour < 17
    },
    { message: 'Break time must be during business hours (9 AM - 5 PM)' }
  )
}).refine(
  (data) => {
    // End time must be after start time
    const startMinutes = data.startTime.hour * 60 + data.startTime.minute
    const endMinutes = data.endTime.hour * 60 + data.endTime.minute
    return endMinutes > startMinutes
  },
  { message: 'End time must be after start time', path: ['endTime'] }
)

// Helper functions
function formatTime(time: Time | undefined, hourCycle: 12 | 24): string {
  if (!time) return 'Not selected'

  if (hourCycle === 24) {
    return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
  }

  // 12-hour format with AM/PM
  const hour = time.hour === 0 ? 12 : time.hour > 12 ? time.hour - 12 : time.hour
  const period = time.hour < 12 ? 'AM' : 'PM'
  return `${hour}:${String(time.minute).padStart(2, '0')} ${period}`
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
    startTime: formatTime(formState.startTime, 24),
    endTime: formatTime(formState.endTime, 24),
    breakTime: formatTime(formState.breakTime, 12)
  })

  isSubmitting.value = false
  showSuccess.value = true

  // Hide success message after 3 seconds
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}
</script>
