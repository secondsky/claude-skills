# Dashboard Components Reference

Nuxt UI v4 provides a complete dashboard system with 10 components for building admin interfaces.

## Component Overview

| Component | Purpose |
|-----------|---------|
| DashboardGroup | Root layout wrapper with sidebar state |
| DashboardSidebar | Resizable, collapsible sidebar |
| DashboardPanel | Main content panel |
| DashboardNavbar | Top navigation bar |
| DashboardToolbar | Secondary toolbar |
| DashboardSearch | CommandPalette for search |
| DashboardSearchButton | Button to trigger search |
| DashboardSidebarCollapse | Desktop collapse button |
| DashboardSidebarToggle | Mobile toggle button |
| DashboardResizeHandle | Resize handle |

## Basic Dashboard Layout

```vue
<!-- layouts/dashboard.vue -->
<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <template #header>
        <div class="p-4">
          <NuxtLink to="/">
            <Logo />
          </NuxtLink>
        </div>
      </template>

      <UNavigationMenu :items="menuItems" />

      <template #footer>
        <UserMenu />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar>
          <template #left>
            <UDashboardSidebarToggle />
          </template>
          <template #center>
            <UDashboardSearchButton />
          </template>
          <template #right>
            <NotificationBell />
            <UserAvatar />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>

      <template #footer>
        <DashboardFooter />
      </template>
    </UDashboardPanel>

    <UDashboardSearch :groups="searchGroups" />
  </UDashboardGroup>
</template>

<script setup lang="ts">
const menuItems = [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/dashboard'
  },
  {
    label: 'Users',
    icon: 'i-heroicons-users',
    to: '/dashboard/users'
  },
  {
    label: 'Settings',
    icon: 'i-heroicons-cog',
    children: [
      { label: 'Profile', to: '/dashboard/settings/profile' },
      { label: 'Team', to: '/dashboard/settings/team' }
    ]
  }
]
</script>
```

## DashboardGroup

Root wrapper that provides context for all dashboard components.

### Props

```ts
interface DashboardGroupProps {
  as?: any                    // Render element (default: div)
  storage?: 'cookie' | 'local' // Size persistence (default: cookie)
  storageKey?: string         // Storage key (default: 'dashboard')
  persistent?: boolean        // Persist size (default: true)
  unit?: '%' | 'rem' | 'px'   // Size unit (default: %)
}
```

### Usage

```vue
<UDashboardGroup storage="local" storage-key="my-dashboard">
  <!-- Dashboard content -->
</UDashboardGroup>
```

## DashboardSidebar

Resizable and collapsible sidebar with slots for header, content, and footer.

### Props

```ts
interface DashboardSidebarProps {
  id?: string                 // Unique identifier
  collapsible?: boolean       // Enable collapse (default: true)
  collapsed?: boolean         // Initial state
  resizable?: boolean         // Enable resize (default: true)
  minSize?: number           // Min width (default: 10)
  maxSize?: number           // Max width (default: 25)
  defaultSize?: number       // Initial width (default: 15)
}
```

### Slots

- `header` - Top section
- `default` - Main content
- `footer` - Bottom section

### Usage

```vue
<UDashboardSidebar
  :collapsible="true"
  :resizable="true"
  :min-size="10"
  :max-size="30"
  :default-size="20"
>
  <template #header>
    <AppLogo />
  </template>

  <UNavigationMenu :items="items" />

  <template #footer>
    <UserCard />
  </template>
</UDashboardSidebar>
```

## DashboardPanel

Main content area with header, body, and footer slots.

### Props

```ts
interface DashboardPanelProps {
  id?: string
  resizable?: boolean
  collapsible?: boolean
  grow?: boolean             // Fill remaining space (default: true)
}
```

### Slots

- `header` - Fixed header area
- `body` - Scrollable content
- `footer` - Fixed footer area

### Usage

```vue
<UDashboardPanel>
  <template #header>
    <UDashboardNavbar />
    <UDashboardToolbar />
  </template>

  <template #body>
    <NuxtPage />
  </template>

  <template #footer>
    <StatusBar />
  </template>
</UDashboardPanel>
```

## DashboardNavbar

Top navigation bar with left, center, and right slots.

### Slots

- `left` - Left section (sidebar toggle, breadcrumbs)
- `center` - Center section (search button)
- `right` - Right section (notifications, user menu)

### Usage

```vue
<UDashboardNavbar>
  <template #left>
    <UDashboardSidebarToggle />
    <UBreadcrumb :items="breadcrumbs" />
  </template>

  <template #center>
    <UDashboardSearchButton />
  </template>

  <template #right>
    <UButton icon="i-heroicons-bell" variant="ghost" />
    <UDropdownMenu :items="userMenuItems">
      <UAvatar src="/avatar.jpg" />
    </UDropdownMenu>
  </template>
</UDashboardNavbar>
```

## DashboardToolbar

Secondary toolbar displayed below the navbar.

### Usage

```vue
<UDashboardToolbar>
  <template #left>
    <UTabs v-model="tab" :items="tabs" />
  </template>

  <template #right>
    <UButton label="Export" icon="i-heroicons-arrow-down-tray" />
  </template>
</UDashboardToolbar>
```

## DashboardSearch

Full-featured CommandPalette for dashboard search.

### Props

Inherits all CommandPalette props plus:

```ts
interface DashboardSearchProps {
  groups: CommandPaletteGroup[]
  placeholder?: string
}
```

### Usage

```vue
<script setup>
const searchGroups = [
  {
    key: 'pages',
    label: 'Pages',
    commands: [
      { id: 'dashboard', label: 'Dashboard', icon: 'i-heroicons-home', to: '/dashboard' },
      { id: 'users', label: 'Users', icon: 'i-heroicons-users', to: '/users' }
    ]
  },
  {
    key: 'actions',
    label: 'Actions',
    commands: [
      { id: 'new-user', label: 'Create User', icon: 'i-heroicons-plus' }
    ]
  }
]
</script>

<template>
  <UDashboardSearch :groups="searchGroups" placeholder="Search..." />
</template>
```

## Responsive Behavior

Dashboard components automatically handle responsive layouts:

- **Desktop**: Sidebar visible, collapsible with DashboardSidebarCollapse
- **Mobile**: Sidebar hidden, toggleable with DashboardSidebarToggle

```vue
<UDashboardNavbar>
  <template #left>
    <!-- Shows on mobile only -->
    <UDashboardSidebarToggle class="lg:hidden" />

    <!-- Shows on desktop only -->
    <UDashboardSidebarCollapse class="hidden lg:block" />
  </template>
</UDashboardNavbar>
```

## Multi-Panel Layout

Create complex layouts with multiple panels:

```vue
<UDashboardGroup>
  <UDashboardSidebar :default-size="15" />

  <UDashboardPanel :resizable="true" :default-size="40">
    <template #body>
      <ItemList />
    </template>
  </UDashboardPanel>

  <UDashboardResizeHandle />

  <UDashboardPanel grow>
    <template #body>
      <ItemDetail />
    </template>
  </UDashboardPanel>
</UDashboardGroup>
```

## Theming

Customize dashboard appearance in `app.config.ts`:

```ts
export default defineAppConfig({
  ui: {
    dashboardGroup: {
      base: 'fixed inset-0 flex overflow-hidden'
    },
    dashboardSidebar: {
      base: 'flex flex-col bg-elevated border-r border-default'
    },
    dashboardPanel: {
      base: 'flex-1 flex flex-col overflow-hidden'
    },
    dashboardNavbar: {
      base: 'h-16 flex items-center px-4 border-b border-default'
    }
  }
})
```

## Common Patterns

### Sidebar with Nested Navigation

```vue
<UDashboardSidebar>
  <UNavigationMenu
    :items="[
      {
        label: 'Overview',
        icon: 'i-heroicons-home',
        to: '/'
      },
      {
        label: 'Projects',
        icon: 'i-heroicons-folder',
        defaultOpen: true,
        children: [
          { label: 'All Projects', to: '/projects' },
          { label: 'Archived', to: '/projects/archived' }
        ]
      }
    ]"
  />
</UDashboardSidebar>
```

### Dashboard with Tabs

```vue
<UDashboardPanel>
  <template #header>
    <UDashboardNavbar />
    <UDashboardToolbar>
      <UTabs v-model="activeTab" :items="tabItems" />
    </UDashboardToolbar>
  </template>

  <template #body>
    <KeepAlive>
      <component :is="tabComponents[activeTab]" />
    </KeepAlive>
  </template>
</UDashboardPanel>
```
