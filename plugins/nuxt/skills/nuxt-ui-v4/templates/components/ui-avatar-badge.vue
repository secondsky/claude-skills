<template>
  <div class="p-6">
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold mb-2">Avatar & Badge Examples</h2>
        <p class="text-dimmed">Demonstrates Avatar and Badge components with various sizes and styles</p>
      </div>

      <!-- Avatar Sizes -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Avatar Sizes</h3>
        <div class="flex items-end gap-4">
          <UAvatar src="https://i.pravatar.cc/150?img=1" size="xs" alt="XS" />
          <UAvatar src="https://i.pravatar.cc/150?img=2" size="sm" alt="SM" />
          <UAvatar src="https://i.pravatar.cc/150?img=3" size="md" alt="MD" />
          <UAvatar src="https://i.pravatar.cc/150?img=4" size="lg" alt="LG" />
          <UAvatar src="https://i.pravatar.cc/150?img=5" size="xl" alt="XL" />
        </div>
      </div>

      <!-- Avatar with Fallback -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Avatar with Fallback (Initials)</h3>
        <div class="flex items-center gap-4">
          <UAvatar alt="John Doe" size="lg" />
          <UAvatar alt="Jane Smith" size="lg" />
          <UAvatar alt="Bob Johnson" size="lg" />
        </div>
      </div>

      <!-- Avatar Group -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Avatar Group</h3>
        <UAvatarGroup :max="4" size="md">
          <UAvatar v-for="i in 6" :key="i" :src="`https://i.pravatar.cc/150?img=${i}`" :alt="`User ${i}`" />
        </UAvatarGroup>

        <p class="text-sm text-dimmed mt-2">Showing 4 of 6 users</p>
      </div>

      <!-- Avatar with Status Badge -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Avatar with Status Badge</h3>
        <div class="flex items-center gap-6">
          <div class="relative">
            <UAvatar src="https://i.pravatar.cc/150?img=1" size="lg" />
            <span class="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-success ring-2 ring-white" />
          </div>

          <div class="relative">
            <UAvatar src="https://i.pravatar.cc/150?img=2" size="lg" />
            <span class="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-warning ring-2 ring-white" />
          </div>

          <div class="relative">
            <UAvatar src="https://i.pravatar.cc/150?img=3" size="lg" />
            <span class="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-error ring-2 ring-white" />
          </div>
        </div>

        <div class="flex gap-4 mt-3 text-sm">
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-success" />
            <span class="text-dimmed">Online</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-warning" />
            <span class="text-dimmed">Away</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full bg-error" />
            <span class="text-dimmed">Offline</span>
          </div>
        </div>
      </div>

      <!-- Badge Colors -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Badge Colors</h3>
        <div class="flex flex-wrap gap-2">
          <UBadge color="primary">Primary</UBadge>
          <UBadge color="secondary">Secondary</UBadge>
          <UBadge color="success">Success</UBadge>
          <UBadge color="info">Info</UBadge>
          <UBadge color="warning">Warning</UBadge>
          <UBadge color="error">Error</UBadge>
          <UBadge color="neutral">Neutral</UBadge>
        </div>
      </div>

      <!-- Badge Variants -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Badge Variants</h3>
        <div class="flex flex-wrap gap-2">
          <UBadge color="primary" variant="solid">Solid</UBadge>
          <UBadge color="primary" variant="subtle">Subtle</UBadge>
          <UBadge color="primary" variant="outline">Outline</UBadge>
        </div>
      </div>

      <!-- Badge Sizes -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Badge Sizes</h3>
        <div class="flex items-center gap-2">
          <UBadge size="xs">XS</UBadge>
          <UBadge size="sm">SM</UBadge>
          <UBadge size="md">MD</UBadge>
          <UBadge size="lg">LG</UBadge>
        </div>
      </div>

      <!-- Badge with Icon -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Badge with Icons</h3>
        <div class="flex flex-wrap gap-2">
          <UBadge color="success">
            <UIcon name="i-heroicons-check" class="mr-1" />
            Verified
          </UBadge>
          <UBadge color="error">
            <UIcon name="i-heroicons-x-mark" class="mr-1" />
            Failed
          </UBadge>
          <UBadge color="warning">
            <UIcon name="i-heroicons-clock" class="mr-1" />
            Pending
          </UBadge>
        </div>
      </div>

      <!-- Badge with Number -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Badge with Numbers (Notifications)</h3>
        <div class="flex gap-4">
          <div class="relative inline-block">
            <UButton variant="ghost" icon="i-heroicons-bell" />
            <UBadge class="absolute -top-1 -right-1" color="error" size="xs">5</UBadge>
          </div>

          <div class="relative inline-block">
            <UButton variant="ghost" icon="i-heroicons-envelope" />
            <UBadge class="absolute -top-1 -right-1" color="primary" size="xs">12</UBadge>
          </div>

          <div class="relative inline-block">
            <UButton variant="ghost" icon="i-heroicons-shopping-cart" />
            <UBadge class="absolute -top-1 -right-1" color="success" size="xs">3</UBadge>
          </div>
        </div>
      </div>

      <!-- User List with Avatar and Badge -->
      <div>
        <h3 class="text-lg font-semibold mb-4">User List (Combined)</h3>
        <UCard>
          <div class="divide-y divide-default">
            <div v-for="user in users" :key="user.id" class="py-3 first:pt-0 last:pb-0">
              <div class="flex items-center gap-4">
                <div class="relative">
                  <UAvatar :src="user.avatar" :alt="user.name" />
                  <span :class="[
                    'absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white',
                    user.status === 'online' ? 'bg-success' : user.status === 'away' ? 'bg-warning' : 'bg-error'
                  ]" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium truncate">{{ user.name }}</span>
                    <UBadge v-if="user.role" :color="getRoleBadgeColor(user.role)" size="xs" variant="subtle">
                      {{ user.role }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-dimmed truncate">{{ user.email }}</p>
                </div>

                <UButton variant="ghost" size="sm">View</UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    status: 'online',
    role: 'Admin'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    status: 'away',
    role: 'Editor'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    avatar: 'https://i.pravatar.cc/150?img=3',
    status: 'offline',
    role: 'Viewer'
  }
]

function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    'Admin': 'error',
    'Editor': 'warning',
    'Viewer': 'info'
  }
  return colors[role] || 'neutral'
}
</script>
