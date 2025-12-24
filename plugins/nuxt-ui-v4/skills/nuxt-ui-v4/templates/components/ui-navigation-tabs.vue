<template>
  <div class="p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Tabs Navigation Example</h2>
        <p class="text-dimmed mt-1">Demonstrates tabs with icons, badges, and dynamic content</p>
      </template>

      <UTabs v-model="selectedTab" :items="tabItems" class="w-full">
        <!-- Overview Tab -->
        <template #overview>
          <div class="p-6">
            <h3 class="text-xl font-semibold mb-4">Overview</h3>
            <p class="text-dimmed mb-4">
              This is the overview tab content. Tabs are great for organizing related content
              into separate views without navigation.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UCard>
                <div class="text-center">
                  <UIcon name="i-heroicons-users" class="w-12 h-12 mx-auto mb-2 text-primary" />
                  <div class="text-2xl font-bold">1,234</div>
                  <div class="text-sm text-dimmed">Total Users</div>
                </div>
              </UCard>

              <UCard>
                <div class="text-center">
                  <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto mb-2 text-success" />
                  <div class="text-2xl font-bold">456</div>
                  <div class="text-sm text-dimmed">Documents</div>
                </div>
              </UCard>

              <UCard>
                <div class="text-center">
                  <UIcon name="i-heroicons-chart-bar" class="w-12 h-12 mx-auto mb-2 text-info" />
                  <div class="text-2xl font-bold">89%</div>
                  <div class="text-sm text-dimmed">Success Rate</div>
                </div>
              </UCard>
            </div>
          </div>
        </template>

        <!-- Settings Tab -->
        <template #settings>
          <div class="p-6">
            <h3 class="text-xl font-semibold mb-4">Settings</h3>

            <div class="space-y-4">
              <UFormField label="Notifications">
                <USwitch v-model="settings.notifications" />
              </UFormField>

              <UFormField label="Email Updates">
                <USwitch v-model="settings.emailUpdates" />
              </UFormField>

              <UFormField label="Dark Mode">
                <USwitch v-model="settings.darkMode" @update:model-value="toggleDarkMode" />
              </UFormField>

              <UFormField label="Language">
                <USelect v-model="settings.language" :options="languageOptions" />
              </UFormField>

              <div class="pt-4">
                <UButton @click="saveSettings">Save Settings</UButton>
              </div>
            </div>
          </div>
        </template>

        <!-- Activity Tab -->
        <template #activity>
          <div class="p-6">
            <h3 class="text-xl font-semibold mb-4">Recent Activity</h3>

            <div class="space-y-4">
              <div v-for="activity in activities" :key="activity.id" class="flex items-start gap-4 p-4 border border-default rounded-lg">
                <UAvatar :src="activity.avatar" :alt="activity.user" />
                <div class="flex-1">
                  <div class="font-medium">{{ activity.user }}</div>
                  <div class="text-sm text-dimmed">{{ activity.action }}</div>
                  <div class="text-xs text-muted mt-1">{{ activity.time }}</div>
                </div>
                <UBadge :color="activity.type === 'success' ? 'success' : 'info'" variant="subtle">
                  {{ activity.type }}
                </UBadge>
              </div>
            </div>
          </div>
        </template>

        <!-- Notifications Tab (with badge) -->
        <template #notifications>
          <div class="p-6">
            <h3 class="text-xl font-semibold mb-4">Notifications</h3>

            <div class="space-y-2">
              <UAlert
                v-for="notification in notifications"
                :key="notification.id"
                :color="notification.color"
                variant="subtle"
                :title="notification.title"
                :description="notification.message"
                :icon="notification.icon"
              />
            </div>

            <div v-if="notifications.length === 0" class="text-center py-12 text-dimmed">
              <UIcon name="i-heroicons-bell-slash" class="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No new notifications</p>
            </div>
          </div>
        </template>
      </UTabs>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Tab items with icons and badges
const tabItems = [
  {
    key: 'overview',
    label: 'Overview',
    icon: 'i-heroicons-home',
    slot: 'overview'
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'i-heroicons-cog',
    slot: 'settings'
  },
  {
    key: 'activity',
    label: 'Activity',
    icon: 'i-heroicons-clock',
    slot: 'activity'
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: 'i-heroicons-bell',
    slot: 'notifications',
    badge: 3  // Badge count
  }
]

// Selected tab
const selectedTab = ref('overview')

// Settings
const settings = reactive({
  notifications: true,
  emailUpdates: false,
  darkMode: false,
  language: 'en'
})

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' }
]

// Activities
const activities = ref([
  {
    id: 1,
    user: 'John Doe',
    action: 'Created a new project',
    time: '2 hours ago',
    type: 'success',
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Updated documentation',
    time: '3 hours ago',
    type: 'info',
    avatar: 'https://i.pravatar.cc/150?img=2'
  },
  {
    id: 3,
    user: 'Bob Johnson',
    action: 'Commented on issue #123',
    time: '5 hours ago',
    type: 'info',
    avatar: 'https://i.pravatar.cc/150?img=3'
  }
])

// Notifications
const notifications = ref([
  {
    id: 1,
    title: 'New message',
    message: 'You have a new message from Alice',
    color: 'info',
    icon: 'i-heroicons-envelope'
  },
  {
    id: 2,
    title: 'Update available',
    message: 'A new version of the app is available',
    color: 'warning',
    icon: 'i-heroicons-arrow-path'
  },
  {
    id: 3,
    title: 'Task completed',
    message: 'Your export has finished successfully',
    color: 'success',
    icon: 'i-heroicons-check-circle'
  }
])

// Actions
function saveSettings() {
  const { add: addToast } = useToast()
  addToast({
    title: 'Settings saved',
    description: 'Your settings have been updated successfully',
    color: 'success',
    icon: 'i-heroicons-check-circle'
  })
}

function toggleDarkMode(enabled: boolean) {
  const colorMode = useColorMode()
  colorMode.preference = enabled ? 'dark' : 'light'
}

// Watch for tab changes
watch(selectedTab, (newTab) => {
  console.log('Tab changed to:', newTab)

  // Clear notification badge when viewing notifications
  if (newTab === 'notifications') {
    const notifTab = tabItems.find(t => t.key === 'notifications')
    if (notifTab) {
      notifTab.badge = 0
    }
  }
})
</script>
