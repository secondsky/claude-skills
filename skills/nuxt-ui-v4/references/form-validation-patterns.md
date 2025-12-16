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

---

## Date & Time Validation (v4.2+)

### InputDate Validation

```vue
<script setup lang="ts">
import { z } from 'zod'
import { CalendarDate } from '@internationalized/date'

// Custom Zod validator for CalendarDate
const calendarDateSchema = z.custom<CalendarDate>(
  (val) => val instanceof CalendarDate,
  { message: 'Invalid date' }
)

const schema = z.object({
  birthDate: calendarDateSchema,
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

const state = reactive({
  birthDate: new CalendarDate(2000, 1, 1),
  startDate: new CalendarDate(2024, 12, 1)
})
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="birthDate" label="Birth Date">
      <UInputDate v-model="state.birthDate" />
    </UFormField>

    <UFormField name="startDate" label="Start Date">
      <UInputDate v-model="state.startDate" />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

### Date Range Validation

```vue
<script setup lang="ts">
import { z } from 'zod'
import { CalendarDate } from '@internationalized/date'

const dateRangeSchema = z.object({
  start: z.custom<CalendarDate>((val) => val instanceof CalendarDate),
  end: z.custom<CalendarDate>((val) => val instanceof CalendarDate)
}).refine(
  (data) => data.end.compare(data.start) > 0,
  {
    message: 'End date must be after start date',
    path: ['end']
  }
)

const schema = z.object({
  dateRange: dateRangeSchema
})

const state = reactive({
  dateRange: {
    start: new CalendarDate(2024, 1, 1),
    end: new CalendarDate(2024, 1, 7)
  }
})
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="dateRange" label="Date Range">
      <UInputDate v-model="state.dateRange" range />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

### InputTime Validation

```vue
<script setup lang="ts">
import { z } from 'zod'
import { Time } from '@internationalized/date'

// Custom Zod validator for Time
const timeSchema = z.custom<Time>(
  (val) => val instanceof Time,
  { message: 'Invalid time' }
)

// Business hours validation (9 AM - 5 PM)
const businessHoursSchema = timeSchema.refine(
  (time) => {
    const hour = time.hour
    return hour >= 9 && hour < 17
  },
  { message: 'Please select a time during business hours (9 AM - 5 PM)' }
)

const schema = z.object({
  meetingTime: businessHoursSchema,
  reminderTime: timeSchema
})

const state = reactive({
  meetingTime: new Time(14, 30),  // 2:30 PM
  reminderTime: new Time(9, 0)    // 9:00 AM
})
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="meetingTime" label="Meeting Time">
      <UInputTime v-model="state.meetingTime" :hour-cycle="12" />
    </UFormField>

    <UFormField name="reminderTime" label="Reminder Time">
      <UInputTime v-model="state.reminderTime" :hour-cycle="24" />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```

### Combined Date + Time Validation

```vue
<script setup lang="ts">
import { z } from 'zod'
import { CalendarDate, Time } from '@internationalized/date'

const schema = z.object({
  eventDate: z.custom<CalendarDate>((val) => val instanceof CalendarDate),
  eventTime: z.custom<Time>((val) => val instanceof Time)
}).refine(
  (data) => {
    // Combine date and time, ensure it's in the future
    const eventDateTime = new Date(
      data.eventDate.year,
      data.eventDate.month - 1,
      data.eventDate.day,
      data.eventTime.hour,
      data.eventTime.minute
    )
    return eventDateTime > new Date()
  },
  {
    message: 'Event must be scheduled in the future',
    path: ['eventDate']
  }
)

const state = reactive({
  eventDate: new CalendarDate(2024, 12, 25),
  eventTime: new Time(15, 0)
})
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="eventDate" label="Event Date">
      <UInputDate v-model="state.eventDate" />
    </UFormField>

    <UFormField name="eventTime" label="Event Time">
      <UInputTime v-model="state.eventTime" :hour-cycle="12" />
    </UFormField>

    <UButton type="submit">Schedule Event</UButton>
  </UForm>
</template>
```

### Weekend Exclusion Validation

```vue
<script setup lang="ts">
import { z } from 'zod'
import { CalendarDate, getDayOfWeek } from '@internationalized/date'

const weekdaySchema = z.custom<CalendarDate>(
  (val) => val instanceof CalendarDate
).refine(
  (date) => {
    const dayOfWeek = getDayOfWeek(date, 'en-US')
    return dayOfWeek !== 0 && dayOfWeek !== 6  // Not Sunday or Saturday
  },
  { message: 'Please select a weekday (Monday-Friday)' }
)

const schema = z.object({
  workDate: weekdaySchema
})

const state = reactive({
  workDate: new CalendarDate(2024, 12, 16)  // Monday
})

function isWeekend(date: CalendarDate) {
  const dayOfWeek = getDayOfWeek(date, 'en-US')
  return dayOfWeek === 0 || dayOfWeek === 6
}
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="workDate" label="Work Date">
      <UInputDate
        v-model="state.workDate"
        :is-date-unavailable="isWeekend"
      />
    </UFormField>

    <UButton type="submit">Submit</UButton>
  </UForm>
</template>
```
