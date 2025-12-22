<template>
  <div class="p-6">
    <div class="space-y-6">
      <h2 class="text-2xl font-bold">Card Layout Examples</h2>
      <p class="text-dimmed">Demonstrates Card component with various slot configurations</p>

      <!-- Basic Card -->
      <UCard>
        <template #header>
          <h3 class="font-semibold">Basic Card</h3>
        </template>

        <p>This is the card body content. Cards are versatile containers for grouping related content and actions.</p>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost">Cancel</UButton>
            <UButton>Save</UButton>
          </div>
        </template>
      </UCard>

      <!-- Image Card -->
      <UCard>
        <div class="aspect-video bg-gradient-to-br from-primary/20 to-success/20 rounded-lg mb-4 flex items-center justify-center">
          <UIcon name="i-heroicons-photo" class="w-16 h-16 text-dimmed" />
        </div>

        <template #header>
          <h3 class="font-semibold">Beautiful Landscape</h3>
        </template>

        <p class="text-sm text-dimmed">A stunning view captured at sunrise in the mountains.</p>

        <template #footer>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UAvatar src="https://i.pravatar.cc/150?img=1" size="xs" />
              <span class="text-sm">John Doe</span>
            </div>
            <div class="flex gap-1">
              <UButton icon="i-heroicons-heart" variant="ghost" size="sm" />
              <UButton icon="i-heroicons-share" variant="ghost" size="sm" />
            </div>
          </div>
        </template>
      </UCard>

      <!-- Stats Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <UIcon name="i-heroicons-users" class="w-6 h-6 text-primary" />
            </div>
            <div>
              <div class="text-2xl font-bold">2,543</div>
              <div class="text-sm text-dimmed">Total Users</div>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-success" />
            </div>
            <div>
              <div class="text-2xl font-bold">$12.5K</div>
              <div class="text-sm text-dimmed">Revenue</div>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <UIcon name="i-heroicons-clock" class="w-6 h-6 text-warning" />
            </div>
            <div>
              <div class="text-2xl font-bold">24h</div>
              <div class="text-sm text-dimmed">Avg. Time</div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- List Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">Recent Activity</h3>
            <UButton variant="ghost" size="sm">View All</UButton>
          </div>
        </template>

        <div class="divide-y divide-default">
          <div v-for="item in activities" :key="item.id" class="py-3 first:pt-0 last:pb-0">
            <div class="flex items-start gap-3">
              <UAvatar :src="item.avatar" size="sm" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ item.user }}</p>
                <p class="text-sm text-dimmed truncate">{{ item.action }}</p>
              </div>
              <span class="text-xs text-muted">{{ item.time }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Pricing Card -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UCard v-for="plan in pricingPlans" :key="plan.name" :class="plan.featured ? 'ring-2 ring-primary' : ''">
          <template #header>
            <div class="text-center">
              <div class="text-lg font-semibold">{{ plan.name }}</div>
              <div class="mt-2">
                <span class="text-4xl font-bold">${{ plan.price }}</span>
                <span class="text-dimmed">/mo</span>
              </div>
            </div>
          </template>

          <ul class="space-y-2">
            <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2 text-sm">
              <UIcon name="i-heroicons-check" class="text-success flex-shrink-0" />
              <span>{{ feature }}</span>
            </li>
          </ul>

          <template #footer>
            <UButton :color="plan.featured ? 'primary' : 'neutral'" block>
              Choose Plan
            </UButton>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const activities = [
  { id: 1, user: 'John Doe', action: 'Created a new project', time: '2h ago', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, user: 'Jane Smith', action: 'Updated documentation', time: '3h ago', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, user: 'Bob Johnson', action: 'Commented on issue', time: '5h ago', avatar: 'https://i.pravatar.cc/150?img=3' }
]

const pricingPlans = [
  {
    name: 'Basic',
    price: 9,
    featured: false,
    features: ['10 Projects', '5GB Storage', 'Basic Support']
  },
  {
    name: 'Pro',
    price: 29,
    featured: true,
    features: ['Unlimited Projects', '100GB Storage', 'Priority Support', 'Advanced Analytics']
  },
  {
    name: 'Enterprise',
    price: 99,
    featured: false,
    features: ['Unlimited Projects', '1TB Storage', '24/7 Support', 'Custom Features', 'SLA']
  }
]
</script>
