# Pricing Components Reference

Nuxt UI v4 provides 3 components for building SaaS pricing pages.

## Component Overview

| Component | Purpose |
|-----------|---------|
| PricingPlan | Individual plan card |
| PricingPlans | Responsive plan grid |
| PricingTable | Feature comparison table |

## Basic Pricing Page

```vue
<script setup lang="ts">
const plans = [
  {
    title: 'Starter',
    description: 'Perfect for individuals',
    price: '$9',
    cycle: '/month',
    features: [
      { label: '5 projects', included: true },
      { label: '10GB storage', included: true },
      { label: 'Email support', included: true },
      { label: 'API access', included: false }
    ],
    button: { label: 'Get Started', to: '/signup?plan=starter' }
  },
  {
    title: 'Pro',
    description: 'Best for professionals',
    price: '$29',
    cycle: '/month',
    highlight: true,
    badge: 'Popular',
    features: [
      { label: 'Unlimited projects', included: true },
      { label: '100GB storage', included: true },
      { label: 'Priority support', included: true },
      { label: 'API access', included: true }
    ],
    button: { label: 'Get Started', to: '/signup?plan=pro', color: 'primary' }
  },
  {
    title: 'Enterprise',
    description: 'For large teams',
    price: 'Custom',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Unlimited storage', included: true },
      { label: 'Dedicated support', included: true },
      { label: 'SLA guarantee', included: true }
    ],
    button: { label: 'Contact Sales', to: '/contact' }
  }
]
</script>

<template>
  <UPageSection title="Pricing" description="Choose the perfect plan for you">
    <UPricingPlans :plans="plans" />
  </UPageSection>
</template>
```

## PricingPlan

Individual pricing plan card.

### Props

```ts
interface PricingPlanProps {
  title: string
  description?: string
  price: string | number
  cycle?: string             // '/month', '/year', etc.
  discount?: string          // Original price for comparison
  badge?: string             // Badge text (e.g., 'Popular')
  highlight?: boolean        // Highlight this plan
  features?: PricingFeature[]
  button?: ButtonProps & { label: string }
  align?: 'left' | 'center'
}

interface PricingFeature {
  label: string
  included: boolean
  tooltip?: string
}
```

### Slots

- `header` - Above title
- `title` - Title area
- `description` - Description area
- `price` - Price display
- `features` - Feature list
- `button` - CTA button
- `footer` - Below button

### Usage

```vue
<UPricingPlan
  title="Pro"
  description="For professionals"
  price="$29"
  cycle="/month"
  discount="$49"
  badge="Most Popular"
  highlight
  :features="[
    { label: 'Unlimited projects', included: true },
    { label: 'Priority support', included: true },
    { label: 'API access', included: true, tooltip: 'Full REST API' }
  ]"
  :button="{ label: 'Start Free Trial', color: 'primary' }"
>
  <template #footer>
    <p class="text-sm text-muted">14-day free trial, no credit card required</p>
  </template>
</UPricingPlan>
```

## PricingPlans

Grid layout for multiple plans.

### Props

```ts
interface PricingPlansProps {
  plans: PricingPlanProps[]
  columns?: number | { sm?: number; md?: number; lg?: number }
  compact?: boolean          // Compact display mode
}
```

### Usage

```vue
<!-- Basic usage -->
<UPricingPlans :plans="plans" />

<!-- Custom columns -->
<UPricingPlans :plans="plans" :columns="{ sm: 1, md: 2, lg: 4 }" />

<!-- Compact mode -->
<UPricingPlans :plans="plans" compact />
```

## PricingTable

Feature comparison table.

### Props

```ts
interface PricingTableProps {
  plans: PricingTablePlan[]
  features: PricingTableFeature[]
  highlight?: string         // Plan to highlight
}

interface PricingTablePlan {
  id: string
  title: string
  price: string
  cycle?: string
  button?: ButtonProps
}

interface PricingTableFeature {
  label: string
  category?: string          // Group features by category
  values: Record<string, boolean | string>
  tooltip?: string
}
```

### Usage

```vue
<script setup>
const tablePlans = [
  { id: 'starter', title: 'Starter', price: '$9', cycle: '/mo' },
  { id: 'pro', title: 'Pro', price: '$29', cycle: '/mo' },
  { id: 'enterprise', title: 'Enterprise', price: 'Custom' }
]

const tableFeatures = [
  {
    category: 'Core',
    label: 'Projects',
    values: { starter: '5', pro: 'Unlimited', enterprise: 'Unlimited' }
  },
  {
    category: 'Core',
    label: 'Storage',
    values: { starter: '10GB', pro: '100GB', enterprise: 'Unlimited' }
  },
  {
    category: 'Support',
    label: 'Email support',
    values: { starter: true, pro: true, enterprise: true }
  },
  {
    category: 'Support',
    label: 'Priority support',
    values: { starter: false, pro: true, enterprise: true }
  },
  {
    category: 'Support',
    label: 'Dedicated account manager',
    values: { starter: false, pro: false, enterprise: true }
  },
  {
    category: 'Features',
    label: 'API access',
    values: { starter: false, pro: true, enterprise: true }
  },
  {
    category: 'Features',
    label: 'SSO',
    values: { starter: false, pro: false, enterprise: true }
  }
]
</script>

<template>
  <UPricingTable
    :plans="tablePlans"
    :features="tableFeatures"
    highlight="pro"
  />
</template>
```

## Billing Toggle

Common pattern for monthly/yearly toggle.

```vue
<script setup>
const billing = ref<'monthly' | 'yearly'>('monthly')

const plans = computed(() => [
  {
    title: 'Pro',
    price: billing.value === 'monthly' ? '$29' : '$290',
    cycle: billing.value === 'monthly' ? '/month' : '/year',
    discount: billing.value === 'yearly' ? '$348' : undefined,
    // ... rest of plan
  }
])
</script>

<template>
  <div class="flex justify-center mb-8">
    <UTabs
      v-model="billing"
      :items="[
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly', badge: 'Save 20%' }
      ]"
    />
  </div>

  <UPricingPlans :plans="plans" />
</template>
```

## Theming

```ts
export default defineAppConfig({
  ui: {
    pricingPlan: {
      slots: {
        root: 'relative flex flex-col p-6 bg-elevated rounded-xl border border-default',
        title: 'text-xl font-semibold',
        description: 'text-muted mt-1',
        price: 'text-4xl font-bold mt-4',
        cycle: 'text-muted text-sm',
        features: 'mt-6 space-y-3',
        button: 'mt-8'
      },
      variants: {
        highlight: {
          true: {
            root: 'border-primary ring-2 ring-primary'
          }
        }
      }
    },
    pricingTable: {
      slots: {
        root: 'overflow-x-auto',
        table: 'w-full',
        header: 'border-b border-default',
        row: 'border-b border-default',
        cell: 'px-4 py-3'
      }
    }
  }
})
```

## Common Patterns

### Enterprise Contact Form

```vue
<UPricingPlan
  title="Enterprise"
  price="Custom"
  :features="enterpriseFeatures"
>
  <template #button>
    <UModal v-model="showContactForm">
      <template #trigger>
        <UButton label="Contact Sales" block />
      </template>
      <ContactForm @submit="handleContact" />
    </UModal>
  </template>
</UPricingPlan>
```

### Free Trial Emphasis

```vue
<UPricingPlan
  title="Pro"
  price="$29"
  :button="{ label: 'Start 14-Day Free Trial', color: 'primary' }"
>
  <template #footer>
    <div class="flex items-center gap-2 text-sm text-muted">
      <UIcon name="i-heroicons-credit-card" />
      <span>No credit card required</span>
    </div>
  </template>
</UPricingPlan>
```

### Feature Tooltips

```vue
<UPricingPlan
  :features="[
    {
      label: 'API access',
      included: true,
      tooltip: 'Full REST API with 10,000 requests/month'
    },
    {
      label: 'Webhooks',
      included: true,
      tooltip: 'Real-time event notifications'
    }
  ]"
/>
```
