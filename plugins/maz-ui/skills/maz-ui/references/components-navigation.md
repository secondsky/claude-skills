# Maz-UI Navigation Components Reference

Comprehensive guide to all Maz-UI navigation components for organizing content and improving user flow.

## Overview

Maz-UI provides **3 powerful navigation components** for structuring content and guiding users through multi-step flows:

**Components**:
- `MazTabs` - Tab-based navigation for content sections
- `MazStepper` - Step-by-step progress indicator
- `MazPagination` - Pagination controls for data tables and lists

**Key Features**:
- ✅ **Keyboard Accessible** - Full arrow key navigation support
- ✅ **Responsive** - Adapts to mobile and desktop layouts
- ✅ **Customizable** - Colors, sizes, orientations
- ✅ **Router Integration** - Optional Vue Router integration
- ✅ **TypeScript Support** - Full type safety with TypeScript

---

## MazTabs

Tab navigation component for organizing content into separate views.

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import MazTabs from 'maz-ui/components/MazTabs'

const activeTab = ref('overview')

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' }
]
</script>

<template>
  <MazTabs v-model="activeTab" :tabs="tabs">
    <template #overview>
      <h2>Overview Content</h2>
      <p>Product overview details...</p>
    </template>

    <template #features>
      <h2>Features Content</h2>
      <p>Feature list...</p>
    </template>

    <template #pricing>
      <h2>Pricing Content</h2>
      <p>Pricing plans...</p>
    </template>

    <template #faq>
      <h2>FAQ Content</h2>
      <p>Frequently asked questions...</p>
    </template>
  </MazTabs>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `modelValue` | `string \| number` | Active tab ID (v-model) | `null` |
| `tabs` | `Tab[]` | Array of tab objects | `[]` |
| `color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'destructive'` | Active tab color | `'primary'` |
| `orientation` | `'horizontal' \| 'vertical'` | Tab layout orientation | `'horizontal'` |
| `size` | `'sm' \| 'md' \| 'lg'` | Tab button size | `'md'` |
| `alignTabs` | `'start' \| 'center' \| 'end'` | Tab alignment | `'start'` |
| `fullWidth` | `boolean` | Tabs stretch to full width | `false` |
| `underline` | `boolean` | Underline active tab | `true` |
| `disabled` | `boolean` | Disable all tabs | `false` |

### Tab Object

```typescript
interface Tab {
  id: string | number
  label: string
  icon?: string        // Icon name (from @maz-ui/icons)
  disabled?: boolean   // Disable this tab
  badge?: string       // Badge text (e.g., "New", "3")
  badgeColor?: string  // Badge color
}
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string \| number` | Emitted when active tab changes |
| `change` | `{ id: string \| number, tab: Tab }` | Emitted when tab is clicked |

### Slots

| Slot | Props | Description |
|------|-------|-------------|
| `[tab-id]` | - | Content for each tab (dynamic slot) |
| `tab-label` | `{ tab: Tab, active: boolean }` | Custom tab button content |

### Examples

**With Icons and Badges**:
```vue
<script setup>
const tabs = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: 'inbox',
    badge: '5',
    badgeColor: 'destructive'
  },
  {
    id: 'sent',
    label: 'Sent',
    icon: 'send'
  },
  {
    id: 'drafts',
    label: 'Drafts',
    icon: 'file',
    badge: '2',
    badgeColor: 'warning'
  }
]
</script>

<template>
  <MazTabs v-model="activeTab" :tabs="tabs">
    <template #inbox>
      <div>Inbox messages...</div>
    </template>
    <template #sent>
      <div>Sent messages...</div>
    </template>
    <template #drafts>
      <div>Draft messages...</div>
    </template>
  </MazTabs>
</template>
```

**Vertical Orientation**:
```vue
<template>
  <MazTabs
    v-model="activeTab"
    :tabs="tabs"
    orientation="vertical"
    class="h-screen"
  >
    <template #tab1>Content 1</template>
    <template #tab2>Content 2</template>
  </MazTabs>
</template>
```

**Full Width Tabs**:
```vue
<template>
  <MazTabs
    v-model="activeTab"
    :tabs="tabs"
    full-width
    align-tabs="center"
  >
    <template #tab1>Content 1</template>
    <template #tab2>Content 2</template>
    <template #tab3>Content 3</template>
  </MazTabs>
</template>
```

**Custom Tab Labels**:
```vue
<template>
  <MazTabs v-model="activeTab" :tabs="tabs">
    <template #tab-label="{ tab, active }">
      <div class="flex items-center gap-2">
        <MazIcon :name="tab.icon" />
        <span :class="{ 'font-bold': active }">
          {{ tab.label }}
        </span>
        <MazBadge v-if="tab.badge" size="sm">
          {{ tab.badge }}
        </MazBadge>
      </div>
    </template>

    <template #tab1>Content 1</template>
    <template #tab2>Content 2</template>
  </MazTabs>
</template>
```

**Disabled Tabs**:
```vue
<script setup>
const tabs = [
  { id: 'tab1', label: 'Available' },
  { id: 'tab2', label: 'Coming Soon', disabled: true },
  { id: 'tab3', label: 'Premium Only', disabled: true }
]
</script>

<template>
  <MazTabs v-model="activeTab" :tabs="tabs">
    <template #tab1>
      <p>This content is available</p>
    </template>
    <template #tab2>
      <p>Coming soon...</p>
    </template>
    <template #tab3>
      <p>Upgrade to premium</p>
    </template>
  </MazTabs>
</template>
```

**Router Integration**:
```vue
<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const activeTab = computed({
  get: () => route.query.tab || 'overview',
  set: (tab) => router.push({ query: { tab } })
})

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details' }
]
</script>

<template>
  <MazTabs v-model="activeTab" :tabs="tabs">
    <template #overview>Overview</template>
    <template #details>Details</template>
  </MazTabs>
</template>
```

---

## MazStepper

Step-by-step progress indicator for multi-step workflows.

### Basic Usage

```vue
<script setup>
import { ref } from 'vue'
import MazStepper from 'maz-ui/components/MazStepper'

const currentStep = ref(1)

const steps = [
  { id: 1, label: 'Account Details', icon: 'user' },
  { id: 2, label: 'Payment Info', icon: 'credit-card' },
  { id: 3, label: 'Confirmation', icon: 'check-circle' }
]

function nextStep() {
  if (currentStep.value < steps.length) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}
</script>

<template>
  <MazStepper
    v-model="currentStep"
    :steps="steps"
  />

  <!-- Step content -->
  <div v-if="currentStep === 1">
    <h2>Step 1: Account Details</h2>
    <MazInput label="Name" />
    <MazInput label="Email" type="email" />
  </div>

  <div v-if="currentStep === 2">
    <h2>Step 2: Payment Info</h2>
    <MazInput label="Card Number" />
  </div>

  <div v-if="currentStep === 3">
    <h2>Step 3: Confirmation</h2>
    <p>Review your information</p>
  </div>

  <!-- Navigation -->
  <div class="flex gap-2">
    <MazBtn
      @click="previousStep"
      :disabled="currentStep === 1"
    >
      Previous
    </MazBtn>
    <MazBtn
      @click="nextStep"
      color="primary"
      :disabled="currentStep === steps.length"
    >
      Next
    </MazBtn>
  </div>
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `modelValue` | `number` | Current step index (v-model) | `1` |
| `steps` | `Step[]` | Array of step objects | `[]` |
| `color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'destructive'` | Active/completed step color | `'primary'` |
| `orientation` | `'horizontal' \| 'vertical'` | Stepper layout | `'horizontal'` |
| `size` | `'sm' \| 'md' \| 'lg'` | Step indicator size | `'md'` |
| `clickable` | `boolean` | Allow clicking to navigate steps | `false` |
| `showLabels` | `boolean` | Show step labels | `true` |
| `showNumbers` | `boolean` | Show step numbers | `true` |
| `linear` | `boolean` | Only allow sequential navigation | `true` |

### Step Object

```typescript
interface Step {
  id: number
  label: string
  description?: string     // Optional step description
  icon?: string           // Icon name
  disabled?: boolean      // Disable this step
  completed?: boolean     // Mark as completed (auto-calculated if not provided)
  error?: boolean         // Mark step as having error
}
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `number` | Emitted when current step changes |
| `change` | `{ step: number, stepData: Step }` | Emitted when step changes |
| `click-step` | `{ step: number, stepData: Step }` | Emitted when step is clicked (if clickable) |

### Examples

**Vertical Stepper**:
```vue
<template>
  <div class="flex">
    <MazStepper
      v-model="currentStep"
      :steps="steps"
      orientation="vertical"
      class="w-64"
    />

    <div class="flex-1 ml-8">
      <!-- Step content -->
    </div>
  </div>
</template>
```

**Clickable Steps (Non-Linear)**:
```vue
<script setup>
const steps = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Address' },
  { id: 3, label: 'Review' }
]
</script>

<template>
  <MazStepper
    v-model="currentStep"
    :steps="steps"
    clickable
    :linear="false"
    @click-step="handleStepClick"
  />
</template>
```

**With Descriptions**:
```vue
<script setup>
const steps = [
  {
    id: 1,
    label: 'Account',
    description: 'Enter your basic information'
  },
  {
    id: 2,
    label: 'Verification',
    description: 'Verify your email address'
  },
  {
    id: 3,
    label: 'Complete',
    description: 'Finalize your account'
  }
]
</script>

<template>
  <MazStepper v-model="currentStep" :steps="steps" />
</template>
```

**Error States**:
```vue
<script setup>
const steps = ref([
  { id: 1, label: 'Info', completed: true },
  { id: 2, label: 'Payment', error: true }, // Show error
  { id: 3, label: 'Done' }
])

const currentStep = ref(2)
</script>

<template>
  <MazStepper v-model="currentStep" :steps="steps" />

  <div v-if="currentStep === 2">
    <MazAlert color="destructive">
      Payment failed. Please update your payment method.
    </MazAlert>
  </div>
</template>
```

**Form Wizard Example**:
```vue
<script setup>
import { ref, computed } from 'vue'

const currentStep = ref(1)
const formData = ref({
  name: '',
  email: '',
  cardNumber: ''
})

const steps = computed(() => [
  {
    id: 1,
    label: 'Personal Info',
    completed: currentStep.value > 1
  },
  {
    id: 2,
    label: 'Payment',
    completed: currentStep.value > 2
  },
  {
    id: 3,
    label: 'Confirmation',
    completed: currentStep.value > 3
  }
])

async function nextStep() {
  if (await validateStep(currentStep.value)) {
    currentStep.value++
  }
}
</script>

<template>
  <MazStepper v-model="currentStep" :steps="steps" />

  <!-- Step content with validation -->
  <form @submit.prevent="nextStep">
    <div v-show="currentStep === 1">
      <MazInput v-model="formData.name" label="Name" required />
      <MazInput v-model="formData.email" label="Email" type="email" required />
    </div>

    <div v-show="currentStep === 2">
      <MazInput v-model="formData.cardNumber" label="Card Number" required />
    </div>

    <div v-show="currentStep === 3">
      <h3>Review Your Information</h3>
      <p>Name: {{ formData.name }}</p>
      <p>Email: {{ formData.email }}</p>
    </div>

    <MazBtn type="submit" color="primary">
      {{ currentStep < steps.length ? 'Next' : 'Submit' }}
    </MazBtn>
  </form>
</template>
```

---

## MazPagination

Pagination controls for data tables and lists.

### Basic Usage

```vue
<script setup>
import { ref, computed } from 'vue'
import MazPagination from 'maz-ui/components/MazPagination'

const currentPage = ref(1)
const perPage = ref(10)
const totalItems = ref(250)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  const end = start + perPage.value
  return allData.value.slice(start, end)
})
</script>

<template>
  <MazTable :data="paginatedData" />

  <MazPagination
    v-model:current-page="currentPage"
    :total="totalItems"
    :per-page="perPage"
  />
</template>
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `currentPage` | `number` | Current page number (v-model:current-page) | `1` |
| `total` | `number` | Total number of items | `0` |
| `perPage` | `number` | Items per page | `10` |
| `color` | `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'destructive'` | Active page color | `'primary'` |
| `size` | `'sm' \| 'md' \| 'lg'` | Button size | `'md'` |
| `maxVisiblePages` | `number` | Max page buttons to show | `7` |
| `showFirstLast` | `boolean` | Show first/last page buttons | `true` |
| `showPrevNext` | `boolean` | Show previous/next buttons | `true` |
| `disabled` | `boolean` | Disable all buttons | `false` |

### Computed Properties

```typescript
const totalPages = computed(() =>
  Math.ceil(props.total / props.perPage)
)

const isFirstPage = computed(() =>
  props.currentPage === 1
)

const isLastPage = computed(() =>
  props.currentPage === totalPages.value
)
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:currentPage` | `number` | Emitted when page changes |
| `change` | `{ page: number, perPage: number }` | Emitted when page changes |

### Examples

**With Per-Page Selector**:
```vue
<script setup>
import { ref, watch } from 'vue'

const currentPage = ref(1)
const perPage = ref(10)
const totalItems = ref(500)

const perPageOptions = [10, 25, 50, 100]

watch(perPage, () => {
  currentPage.value = 1 // Reset to first page
})
</script>

<template>
  <div>
    <MazTable :data="paginatedData" />

    <div class="flex items-center justify-between mt-4">
      <MazSelect
        v-model="perPage"
        :options="perPageOptions"
        label="Per page"
        class="w-32"
      />

      <MazPagination
        v-model:current-page="currentPage"
        :total="totalItems"
        :per-page="perPage"
      />
    </div>
  </div>
</template>
```

**Compact Pagination**:
```vue
<template>
  <MazPagination
    v-model:current-page="currentPage"
    :total="totalItems"
    :per-page="perPage"
    :max-visible-pages="5"
    :show-first-last="false"
    size="sm"
  />
</template>
```

**Server-Side Pagination**:
```vue
<script setup>
import { ref, watch, onMounted } from 'vue'

const currentPage = ref(1)
const perPage = ref(20)
const totalItems = ref(0)
const data = ref([])
const isLoading = ref(false)

async function fetchData() {
  isLoading.value = true
  try {
    const response = await api.getData({
      page: currentPage.value,
      limit: perPage.value
    })
    data.value = response.data
    totalItems.value = response.total
  } finally {
    isLoading.value = false
  }
}

watch([currentPage, perPage], fetchData)
onMounted(fetchData)
</script>

<template>
  <MazTable :data="data" :loading="isLoading" />

  <MazPagination
    v-model:current-page="currentPage"
    :total="totalItems"
    :per-page="perPage"
    @change="fetchData"
  />
</template>
```

**With Page Info**:
```vue
<script setup>
const startItem = computed(() =>
  (currentPage.value - 1) * perPage.value + 1
)

const endItem = computed(() =>
  Math.min(currentPage.value * perPage.value, totalItems.value)
)
</script>

<template>
  <div>
    <MazTable :data="paginatedData" />

    <div class="flex items-center justify-between mt-4">
      <p class="text-sm text-muted">
        Showing {{ startItem }} to {{ endItem }} of {{ totalItems }} results
      </p>

      <MazPagination
        v-model:current-page="currentPage"
        :total="totalItems"
        :per-page="perPage"
      />
    </div>
  </div>
</template>
```

---

## Best Practices

### Tabs

**DO**:
- Use tabs for related content that users might switch between frequently
- Limit tab count to 5-7 for horizontal tabs
- Use icons with labels for better recognition
- Provide visual feedback for active tab

**DON'T**:
- Use tabs for sequential workflows (use stepper instead)
- Create tabs that are too similar in name
- Hide important content in rarely-accessed tabs

```vue
<!-- ✅ Good: Clear, distinct tabs -->
<MazTabs v-model="activeTab" :tabs="[
  { id: 'overview', label: 'Overview', icon: 'info' },
  { id: 'features', label: 'Features', icon: 'star' },
  { id: 'pricing', label: 'Pricing', icon: 'dollar' }
]" />

<!-- ❌ Bad: Too many similar tabs -->
<MazTabs v-model="activeTab" :tabs="[
  { id: 'info1', label: 'Information' },
  { id: 'info2', label: 'Details' },
  { id: 'info3', label: 'Data' },
  { id: 'info4', label: 'Content' }
]" />
```

### Stepper

**DO**:
- Use steppers for sequential workflows (checkout, onboarding, forms)
- Show progress visually
- Allow users to go back and review previous steps
- Validate each step before allowing progression

**DON'T**:
- Use steppers for non-sequential content
- Skip validation between steps
- Make all steps clickable if order matters

```vue
<!-- ✅ Good: Linear stepper with validation -->
<MazStepper
  v-model="currentStep"
  :steps="steps"
  linear
  @change="validateStep"
/>

<!-- ❌ Bad: Non-linear stepper for sequential process -->
<MazStepper
  v-model="currentStep"
  :steps="steps"
  :linear="false"
  clickable
/>
```

### Pagination

**DO**:
- Show total item count
- Provide per-page options for user control
- Use server-side pagination for large datasets
- Reset to page 1 when filters/search changes

**DON'T**:
- Load all data client-side for large datasets
- Use pagination for very small datasets (<20 items)
- Forget to show current page range

```vue
<!-- ✅ Good: Server-side pagination with info -->
<div>
  <p>Showing {{ startItem }}-{{ endItem }} of {{ totalItems }}</p>
  <MazPagination
    v-model:current-page="currentPage"
    :total="totalItems"
    :per-page="perPage"
    @change="fetchData"
  />
</div>

<!-- ❌ Bad: Client-side pagination for 10,000 items -->
<MazPagination
  v-model:current-page="currentPage"
  :total="10000"
  :per-page="10"
/>
<!-- (All 10,000 items loaded in memory) -->
```

---

## Accessibility

### Keyboard Navigation

All navigation components support keyboard navigation:

**Tabs**:
- `Arrow Left/Right` - Navigate between tabs
- `Home` - Go to first tab
- `End` - Go to last tab
- `Enter/Space` - Activate focused tab

**Stepper**:
- `Tab` - Focus next step (if clickable)
- `Enter/Space` - Navigate to step (if clickable)

**Pagination**:
- `Tab` - Focus next/previous page buttons
- `Enter/Space` - Navigate to page

### ARIA Attributes

```vue
<!-- Tabs with ARIA -->
<MazTabs
  v-model="activeTab"
  :tabs="tabs"
  role="tablist"
  aria-label="Product information tabs"
>
  <template #overview>
    <div role="tabpanel" aria-labelledby="tab-overview">
      Content
    </div>
  </template>
</MazTabs>

<!-- Stepper with ARIA -->
<MazStepper
  v-model="currentStep"
  :steps="steps"
  role="navigation"
  aria-label="Checkout steps"
/>

<!-- Pagination with ARIA -->
<MazPagination
  v-model:current-page="currentPage"
  :total="total"
  :per-page="perPage"
  aria-label="Pagination navigation"
/>
```

---

## Related Documentation

- **[Components Forms](./components-forms.md)** - Form input components
- **[Components Feedback](./components-feedback.md)** - Loading and feedback components
- **[Components Layout](./components-layout.md)** - Layout and container components
- **[Router Integration](./setup-vue.md#router-integration)** - Vue Router integration patterns

---

**Version**: Maz-UI v4.3.3
**Last Updated**: 2025-12-14
**Component Count**: 3 navigation components
