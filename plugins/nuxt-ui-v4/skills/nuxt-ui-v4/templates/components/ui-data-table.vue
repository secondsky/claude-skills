<template>
  <div class="p-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">Data Table Example</h2>
            <p class="text-dimmed mt-1">Demonstrates sorting, pagination, selection, and actions</p>
          </div>
          <UButton @click="addNew">Add New</UButton>
        </div>
      </template>

      <!-- Search and Filters -->
      <div class="flex gap-4 mb-4">
        <UInput
          v-model="searchQuery"
          placeholder="Search..."
          class="flex-1"
        >
          <template #leading>
            <UIcon name="i-heroicons-magnifying-glass" />
          </template>
        </UInput>

        <USelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Filter by status"
        />
      </div>

      <!-- Table -->
      <UTable
        v-model="selectedRows"
        v-model:sort="sort"
        :rows="paginatedRows"
        :columns="columns"
        :loading="loading"
        @select="onSelect"
      >
        <!-- Name column with avatar -->
        <template #name-data="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :src="row.avatar" :alt="row.name" size="sm" />
            <span class="font-medium">{{ row.name }}</span>
          </div>
        </template>

        <!-- Status column with badge -->
        <template #status-data="{ row }">
          <UBadge
            :color="getStatusColor(row.status)"
            variant="subtle"
          >
            {{ row.status }}
          </UBadge>
        </template>

        <!-- Actions column with dropdown -->
        <template #actions-data="{ row }">
          <UDropdownMenu>
            <UButton
              variant="ghost"
              size="sm"
              icon="i-heroicons-ellipsis-horizontal"
            />
            <template #content>
              <UDropdownMenuItem @click="editRow(row)">
                <UIcon name="i-heroicons-pencil" class="mr-2" />
                Edit
              </UDropdownMenuItem>
              <UDropdownMenuItem @click="viewRow(row)">
                <UIcon name="i-heroicons-eye" class="mr-2" />
                View
              </UDropdownMenuItem>
              <UDropdownMenuSeparator />
              <UDropdownMenuItem @click="deleteRow(row)" class="text-error">
                <UIcon name="i-heroicons-trash" class="mr-2" />
                Delete
              </UDropdownMenuItem>
            </template>
          </UDropdownMenu>
        </template>
      </UTable>

      <!-- Pagination -->
      <template #footer>
        <div class="flex items-center justify-between">
          <span class="text-sm text-dimmed">
            Showing {{ startRow }} to {{ endRow }} of {{ filteredRows.length }} results
          </span>

          <UPagination
            v-model="page"
            :page-count="pageCount"
            :total="filteredRows.length"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Table columns
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions' }
]

// Sample data
const allRows = ref([
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Developer',
    status: 'active',
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Designer',
    status: 'active',
    avatar: 'https://i.pravatar.cc/150?img=2'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Manager',
    status: 'inactive',
    avatar: 'https://i.pravatar.cc/150?img=3'
  },
  {
    id: 4,
    name: 'Alice Williams',
    email: 'alice@example.com',
    role: 'Developer',
    status: 'active',
    avatar: 'https://i.pravatar.cc/150?img=4'
  },
  {
    id: 5,
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'Designer',
    status: 'pending',
    avatar: 'https://i.pravatar.cc/150?img=5'
  }
])

// State
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const selectedRows = ref([])
const sort = ref({ column: 'name', direction: 'asc' as const })
const page = ref(1)
const pageCount = 10

// Status options for filter
const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' }
]

// Computed: Filtered rows
const filteredRows = computed(() => {
  let filtered = allRows.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(row =>
      row.name.toLowerCase().includes(query) ||
      row.email.toLowerCase().includes(query) ||
      row.role.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    filtered = filtered.filter(row => row.status === statusFilter.value)
  }

  // Apply sorting
  if (sort.value.column) {
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sort.value.column as keyof typeof a]
      const bVal = b[sort.value.column as keyof typeof b]

      if (sort.value.direction === 'asc') {
        return aVal < bVal ? -1 : 1
      } else {
        return aVal > bVal ? -1 : 1
      }
    })
  }

  return filtered
})

// Computed: Paginated rows
const paginatedRows = computed(() => {
  const start = (page.value - 1) * pageCount
  const end = start + pageCount
  return filteredRows.value.slice(start, end)
})

// Computed: Pagination info
const startRow = computed(() => (page.value - 1) * pageCount + 1)
const endRow = computed(() => Math.min(page.value * pageCount, filteredRows.value.length))

// Get status color
function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'success',
    inactive: 'error',
    pending: 'warning'
  }
  return colors[status] || 'neutral'
}

// Actions
function onSelect(rows: any[]) {
  console.log('Selected rows:', rows)
}

function addNew() {
  console.log('Add new row')
  // Open modal or navigate to create page
}

function editRow(row: any) {
  console.log('Edit row:', row)
  // Open edit modal or navigate to edit page
}

function viewRow(row: any) {
  console.log('View row:', row)
  // Navigate to detail page
}

async function deleteRow(row: any) {
  // Confirm deletion
  const confirmed = confirm(`Delete ${row.name}?`)
  if (!confirmed) return

  loading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    // Remove from list
    allRows.value = allRows.value.filter(r => r.id !== row.id)

    // Show success toast
    const { add: addToast } = useToast()
    addToast({
      title: 'Deleted',
      description: `${row.name} has been deleted`,
      color: 'success'
    })
  } catch (error) {
    console.error('Delete error:', error)
  } finally {
    loading.value = false
  }
}
</script>
