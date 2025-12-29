<script setup lang="ts">
// ✅ Nuxt 3: No imports needed - auto-imported!
// ref, computed, watch, useToast all auto-imported

// Types
interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  createdAt: string
}

// Sample data
const users = ref<User[]>([
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', createdAt: '2024-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', createdAt: '2024-02-10' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive', createdAt: '2024-03-05' },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Moderator', status: 'active', createdAt: '2024-03-20' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'User', status: 'active', createdAt: '2024-04-12' }
])

// Pagination
const currentPage = ref(1)
const pageSize = ref(3)

// Search/Filter
const searchQuery = ref('')

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value

  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user =>
    user.name.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    user.role.toLowerCase().includes(query)
  )
})

// Sort
const sortBy = ref<keyof User>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

const sortedUsers = computed(() => {
  return [...filteredUsers.value].sort((a, b) => {
    const aVal = a[sortBy.value]
    const bVal = b[sortBy.value]

    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

function toggleSort(column: keyof User) {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
}

// ✅ FIXED: Paginate from sortedUsers (not users)
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedUsers.value.slice(start, end)
})

// ✅ FIXED: Total pages from sortedUsers.length (not users.length)
const totalPages = computed(() =>
  Math.ceil(sortedUsers.value.length / pageSize.value)
)

// ✅ FIXED: Reset to page 1 when search/sort changes
watch(searchQuery, () => {
  currentPage.value = 1
})

watch([sortBy, sortOrder], () => {
  currentPage.value = 1
})

// Actions
const toast = useToast()
const selectedUsers = ref<number[]>([])

function toggleUserSelection(userId: number) {
  const index = selectedUsers.value.indexOf(userId)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(userId)
  }
}

function selectAll() {
  if (selectedUsers.value.length === users.value.length) {
    selectedUsers.value = []
  } else {
    selectedUsers.value = users.value.map(u => u.id)
  }
}

async function deleteUser(userId: number) {
  // Implement delete logic
  users.value = users.value.filter(u => u.id !== userId)
  toast.success('User deleted successfully')
}

async function deleteSelected() {
  users.value = users.value.filter(u => !selectedUsers.value.includes(u.id))
  selectedUsers.value = []
  toast.success('Selected users deleted')
}

// Loading state example
const isLoading = ref(false)

async function refreshData() {
  isLoading.value = true
  try {
    // ✅ Nuxt 3: In production, use $fetch or useFetch
    // const data = await $fetch('/api/users')
    // users.value = data

    // Or use composable for reactive data:
    // const { data } = await useFetch('/api/users')
    // users.value = data.value

    // Simulate API call for demo
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Data refreshed')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <h2 class="text-2xl font-bold mb-6">Data Table with Pagination</h2>

    <!-- Toolbar -->
    <div class="flex justify-between items-center mb-6 gap-4">
      <!-- Search -->
      <MazInput
        v-model="searchQuery"
        placeholder="Search users..."
        class="max-w-md"
      />

      <!-- Actions -->
      <div class="flex gap-3">
        <MazBtn
          @click="refreshData"
          :loading="isLoading"
          outlined
        >
          Refresh
        </MazBtn>

        <MazBtn
          v-if="selectedUsers.length > 0"
          @click="deleteSelected"
          color="destructive"
        >
          Delete Selected ({{ selectedUsers.length }})
        </MazBtn>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto border rounded-lg">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left">
              <MazCheckbox
                :model-value="selectedUsers.length === users.length"
                @update:model-value="selectAll"
              />
            </th>
            <th
              @click="toggleSort('name')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Name
              <span v-if="sortBy === 'name'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th
              @click="toggleSort('email')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Email
              <span v-if="sortBy === 'email'">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Role
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="user in paginatedUsers"
            :key="user.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <MazCheckbox
                :model-value="selectedUsers.includes(user.id)"
                @update:model-value="toggleUserSelection(user.id)"
              />
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ user.name }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ user.email }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <MazBadge :color="user.role === 'Admin' ? 'primary' : 'secondary'">
                {{ user.role }}
              </MazBadge>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <MazBadge :color="user.status === 'active' ? 'success' : 'muted'">
                {{ user.status }}
              </MazBadge>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <div class="flex justify-end gap-2">
                <MazBtn size="sm" outlined>
                  Edit
                </MazBtn>
                <MazBtn
                  size="sm"
                  color="destructive"
                  outlined
                  @click="deleteUser(user.id)"
                >
                  Delete
                </MazBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="mt-6 flex justify-between items-center">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Showing {{ (currentPage - 1) * pageSize + 1 }} to
        {{ Math.min(currentPage * pageSize, sortedUsers.length) }} of
        {{ sortedUsers.length }} users
      </div>

      <MazPagination
        v-model="currentPage"
        :total="totalPages"
        :page-size="pageSize"
      />
    </div>
  </div>
</template>
