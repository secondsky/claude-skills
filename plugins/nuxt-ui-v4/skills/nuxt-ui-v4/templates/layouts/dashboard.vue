<template>
  <UDashboardGroup>
    <!-- Sidebar -->
    <UDashboardSidebar
      :collapsible="true"
      :resizable="true"
      :min-size="10"
      :max-size="25"
      :default-size="15"
    >
      <template #header>
        <div class="p-4">
          <NuxtLink to="/" class="flex items-center gap-2">
            <UIcon name="i-heroicons-cube" class="size-8 text-primary" />
            <span class="font-bold text-lg">App Name</span>
          </NuxtLink>
        </div>
      </template>

      <UNavigationMenu :items="menuItems" class="px-2" />

      <template #footer>
        <div class="p-4 border-t border-default">
          <UDropdownMenu :items="userMenuItems">
            <UButton variant="ghost" class="w-full justify-start">
              <UAvatar :src="user?.avatar" :alt="user?.name" size="sm" />
              <span class="truncate">{{ user?.name }}</span>
            </UButton>
          </UDropdownMenu>
        </div>
      </template>
    </UDashboardSidebar>

    <!-- Main Panel -->
    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar>
          <template #left>
            <UDashboardSidebarToggle class="lg:hidden" />
            <UDashboardSidebarCollapse class="hidden lg:block" />
            <UBreadcrumb :items="breadcrumbs" class="ml-4" />
          </template>

          <template #center>
            <UDashboardSearchButton class="w-64" />
          </template>

          <template #right>
            <UButton
              icon="i-heroicons-bell"
              variant="ghost"
              color="neutral"
            />
            <UColorModeButton variant="ghost" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>

    <!-- Search -->
    <UDashboardSearch :groups="searchGroups" placeholder="Search..." />
  </UDashboardGroup>
</template>

<script setup lang="ts">
const user = {
  name: 'John Doe',
  avatar: '/avatars/john.jpg',
  email: 'john@example.com'
}

const menuItems = [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/dashboard'
  },
  {
    label: 'Projects',
    icon: 'i-heroicons-folder',
    to: '/dashboard/projects'
  },
  {
    label: 'Team',
    icon: 'i-heroicons-users',
    to: '/dashboard/team'
  },
  {
    label: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    children: [
      { label: 'Profile', to: '/dashboard/settings/profile' },
      { label: 'Billing', to: '/dashboard/settings/billing' },
      { label: 'Notifications', to: '/dashboard/settings/notifications' }
    ]
  }
]

const userMenuItems = [
  [
    { label: 'Profile', icon: 'i-heroicons-user', to: '/profile' },
    { label: 'Settings', icon: 'i-heroicons-cog', to: '/settings' }
  ],
  [
    { label: 'Sign out', icon: 'i-heroicons-arrow-right-on-rectangle', click: () => signOut() }
  ]
]

const route = useRoute()
const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  return paths.map((path, index) => ({
    label: path.charAt(0).toUpperCase() + path.slice(1),
    to: '/' + paths.slice(0, index + 1).join('/')
  }))
})

const searchGroups = [
  {
    key: 'pages',
    label: 'Pages',
    commands: [
      { id: 'dashboard', label: 'Dashboard', icon: 'i-heroicons-home', to: '/dashboard' },
      { id: 'projects', label: 'Projects', icon: 'i-heroicons-folder', to: '/dashboard/projects' },
      { id: 'team', label: 'Team', icon: 'i-heroicons-users', to: '/dashboard/team' }
    ]
  },
  {
    key: 'actions',
    label: 'Actions',
    commands: [
      { id: 'new-project', label: 'Create Project', icon: 'i-heroicons-plus' },
      { id: 'invite', label: 'Invite Team Member', icon: 'i-heroicons-user-plus' }
    ]
  }
]

function signOut() {
  // Handle sign out
}
</script>
