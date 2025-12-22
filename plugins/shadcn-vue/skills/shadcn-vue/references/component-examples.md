# shadcn-vue Component Examples

Quick reference with copy-paste examples for common component patterns.

---

## Form Components

### Login Form with Validation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'vue-sonner'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

const email = ref('')
const password = ref('')
const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  try {
    const data = loginSchema.parse({ email: email.value, password: password.value })
    // Handle login
    toast.success('Login successful!')
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        if (err.path[0]) {
          errors.value[err.path[0]] = err.message
        }
      })
    }
  }
}
</script>

<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Login</CardTitle>
      <CardDescription>Enter your credentials to access your account</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input
          id="email"
          v-model="email"
          type="email"
          placeholder="you@example.com"
          :class="{ 'border-destructive': errors.email }"
        />
        <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
      </div>
      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input
          id="password"
          v-model="password"
          type="password"
          :class="{ 'border-destructive': errors.password }"
        />
        <p v-if="errors.password" class="text-sm text-destructive">{{ errors.password }}</p>
      </div>
    </CardContent>
    <CardFooter>
      <Button @click="handleSubmit" class="w-full">Sign In</Button>
    </CardFooter>
  </Card>
</template>
```

### Contact Form with Auto Form

```vue
<script setup lang="ts">
import { z } from 'zod'
import AutoForm from '@/components/ui/auto-form/AutoForm.vue'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.enum(['general', 'support', 'sales'], {
    required_error: 'Please select a subject'
  }).describe('Subject // enumLabels:General Inquiry,Support Request,Sales'),
  message: z.string().min(10, 'Message must be at least 10 characters')
    .describe('Message // type:textarea'),
  subscribe: z.boolean().default(false).describe('Subscribe to newsletter')
})

function onSubmit(values: z.infer<typeof contactSchema>) {
  console.log('Form submitted:', values)
  toast.success('Message sent successfully!')
}
</script>

<template>
  <AutoForm
    :schema="contactSchema"
    @submit="onSubmit"
  >
    <template #submit>
      <Button type="submit">Send Message</Button>
    </template>
  </AutoForm>
</template>
```

---

## Data Display

### User Table with Sorting and Filtering

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState
} from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
  status: 'active' | 'inactive'
}

const data = ref<User[]>([
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user', status: 'inactive' }
])

const sorting = ref<SortingState>([])
const globalFilter = ref('')

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      const variant = role === 'admin' ? 'default' : 'secondary'
      return h(Badge, { variant }, () => role)
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const variant = status === 'active' ? 'default' : 'destructive'
      return h(Badge, { variant }, () => status)
    }
  }
]

const table = useVueTable({
  data: data.value,
  columns,
  state: {
    sorting: sorting.value,
    globalFilter: globalFilter.value
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onGlobalFilterChange: (value) => {
    globalFilter.value = value
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel()
})
</script>

<template>
  <div class="space-y-4">
    <Input
      v-model="globalFilter"
      placeholder="Search users..."
      class="max-w-sm"
    />

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              v-for="header in table.getFlatHeaders()"
              :key="header.id"
            >
              {{ header.column.columnDef.header }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
          >
            <TableCell
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
            >
              <component :is="cell.column.columnDef.cell?.(cell.getContext())" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-between">
      <Button
        variant="outline"
        size="sm"
        @click="table.previousPage()"
        :disabled="!table.getCanPreviousPage()"
      >
        Previous
      </Button>
      <span class="text-sm text-muted-foreground">
        Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
      </span>
      <Button
        variant="outline"
        size="sm"
        @click="table.nextPage()"
        :disabled="!table.getCanNextPage()"
      >
        Next
      </Button>
    </div>
  </div>
</template>
```

---

## Navigation

### Sidebar Navigation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'

const menuItems = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Overview', icon: 'home', href: '/' },
      { label: 'Analytics', icon: 'chart', href: '/analytics' }
    ]
  },
  {
    title: 'Settings',
    items: [
      { label: 'Profile', icon: 'user', href: '/profile' },
      { label: 'Preferences', icon: 'settings', href: '/preferences' }
    ]
  }
]
</script>

<template>
  <SidebarProvider>
    <Sidebar>
      <SidebarContent>
        <SidebarGroup v-for="group in menuItems" :key="group.title">
          <SidebarGroupLabel>{{ group.title }}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in group.items" :key="item.label">
                <SidebarMenuButton :href="item.href">
                  {{ item.label }}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>

    <main class="flex-1">
      <SidebarTrigger />
      <slot />
    </main>
  </SidebarProvider>
</template>
```

---

## Dialogs and Modals

### Confirmation Dialog

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

const open = ref(false)

function handleDelete() {
  // Perform delete action
  toast.success('Item deleted successfully')
  open.value = false
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogTrigger as-child>
      <Button variant="destructive">Delete Item</Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete your item
          and remove it from our servers.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction @click="handleDelete">Continue</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
```

---

## Charts

### Multi-Series Line Chart

```vue
<script setup lang="ts">
import { LineChart } from '@/components/ui/chart'

const data = [
  { month: 'Jan', revenue: 4000, expenses: 2400, profit: 1600 },
  { month: 'Feb', revenue: 3000, expenses: 1398, profit: 1602 },
  { month: 'Mar', revenue: 2000, expenses: 9800, profit: -7800 },
  { month: 'Apr', revenue: 2780, expenses: 3908, profit: -1128 },
  { month: 'May', revenue: 1890, expenses: 4800, profit: -2910 },
  { month: 'Jun', revenue: 2390, expenses: 3800, profit: -1410 }
]

const config = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))'
  },
  expenses: {
    label: 'Expenses',
    color: 'hsl(var(--chart-2))'
  },
  profit: {
    label: 'Profit',
    color: 'hsl(var(--chart-3))'
  }
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">Financial Overview</h3>
    <LineChart
      :data="data"
      :config="config"
      :categories="['revenue', 'expenses', 'profit']"
      :index="'month'"
      :show-legend="true"
      class="h-[400px]"
    />
  </div>
</template>
```

---

## Toast Notifications

### Multiple Toast Types

```vue
<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'

function showSuccess() {
  toast.success('Success!', {
    description: 'Your action was completed successfully'
  })
}

function showError() {
  toast.error('Error!', {
    description: 'Something went wrong. Please try again.'
  })
}

function showInfo() {
  toast.info('Info', {
    description: 'Here is some information for you'
  })
}

function showWarning() {
  toast.warning('Warning!', {
    description: 'Please be careful with this action'
  })
}

function showPromise() {
  const promise = new Promise((resolve) => {
    setTimeout(resolve, 2000)
  })

  toast.promise(promise, {
    loading: 'Loading...',
    success: 'Loaded successfully!',
    error: 'Failed to load'
  })
}
</script>

<template>
  <div class="flex gap-2">
    <Button @click="showSuccess">Success</Button>
    <Button @click="showError" variant="destructive">Error</Button>
    <Button @click="showInfo" variant="outline">Info</Button>
    <Button @click="showWarning" variant="secondary">Warning</Button>
    <Button @click="showPromise" variant="ghost">Promise</Button>
  </div>
</template>
```

---

## Complex Patterns

### Settings Page with Tabs and Forms

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AutoForm from '@/components/ui/auto-form/AutoForm.vue'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

const profileSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  bio: z.string().max(500).optional().describe('Bio // type:textarea')
})

const securitySchema = z.object({
  currentPassword: z.string().describe('Current Password // type:password'),
  newPassword: z.string().min(8).describe('New Password // type:password'),
  confirmPassword: z.string().describe('Confirm Password // type:password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

function handleProfileSubmit(values: z.infer<typeof profileSchema>) {
  console.log('Profile:', values)
  toast.success('Profile updated successfully')
}

function handleSecuritySubmit(values: z.infer<typeof securitySchema>) {
  console.log('Security:', values)
  toast.success('Password changed successfully')
}
</script>

<template>
  <div class="container mx-auto py-10">
    <h1 class="text-3xl font-bold mb-6">Settings</h1>

    <Tabs default-value="profile" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <AutoForm :schema="profileSchema" @submit="handleProfileSubmit">
              <template #submit>
                <Button type="submit">Save Changes</Button>
              </template>
            </AutoForm>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent>
            <AutoForm :schema="securitySchema" @submit="handleSecuritySubmit">
              <template #submit>
                <Button type="submit">Change Password</Button>
              </template>
            </AutoForm>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure your notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">Notification settings coming soon...</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
```
