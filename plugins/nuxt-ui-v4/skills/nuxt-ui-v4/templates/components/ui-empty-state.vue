<template>
  <div class="max-w-4xl mx-auto p-6 space-y-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Empty Component (v4.2+)</h2>
        <p class="text-dimmed mt-1">Empty state display with icon, title, description, and actions</p>
      </template>

      <!-- Basic Empty State -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Basic Empty State</h3>
        <UEmpty
          icon="i-heroicons-inbox"
          title="No messages"
          description="You don't have any messages yet."
        />
      </div>

      <!-- Empty with Single Action -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">With Single Action</h3>
        <UEmpty
          icon="i-heroicons-folder-open"
          title="No projects"
          description="Get started by creating your first project."
          :actions="[
            { label: 'Create Project', click: () => showToast('Creating project...') }
          ]"
        />
      </div>

      <!-- Empty with Multiple Actions -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">With Multiple Actions</h3>
        <UEmpty
          icon="i-heroicons-document-text"
          title="No documents"
          description="Upload your first document or create a new one from scratch."
          :actions="[
            { label: 'Upload Document', icon: 'i-heroicons-arrow-up-tray', click: () => showToast('Upload clicked') },
            { label: 'Create New', icon: 'i-heroicons-plus', variant: 'ghost', click: () => showToast('Create clicked') }
          ]"
        />
      </div>

      <!-- Empty with Different Icons -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 class="text-lg font-semibold mb-4">No Search Results</h3>
          <UEmpty
            icon="i-heroicons-magnifying-glass"
            title="No results found"
            description="Try adjusting your search or filter to find what you're looking for."
            :actions="[
              { label: 'Clear Filters', variant: 'outline', click: () => showToast('Filters cleared') }
            ]"
          />
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-4">No Notifications</h3>
          <UEmpty
            icon="i-heroicons-bell"
            title="All caught up!"
            description="You have no new notifications at this time."
          />
        </div>
      </div>

      <!-- Empty with Custom Styling -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Custom Styled</h3>
        <div class="bg-elevated rounded-lg p-8">
          <UEmpty
            icon="i-heroicons-cloud-arrow-up"
            title="Upload your files"
            description="Drag and drop your files here, or click to browse."
            :actions="[
              { label: 'Browse Files', color: 'primary', click: () => showToast('File browser opened') }
            ]"
          />
        </div>
      </div>

      <!-- Interactive Example with Conditional Rendering -->
      <div class="mt-12 pt-8 border-t">
        <h3 class="text-lg font-semibold mb-4">Interactive Example</h3>
        <div class="space-y-4">
          <div class="flex gap-2">
            <UButton @click="addItem" :disabled="items.length >= 5">Add Item</UButton>
            <UButton @click="clearItems" variant="outline" :disabled="items.length === 0">Clear All</UButton>
          </div>

          <!-- Show items if available, otherwise show empty state -->
          <div v-if="items.length > 0" class="space-y-2">
            <UCard v-for="item in items" :key="item.id" class="p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-semibold">{{ item.title }}</h4>
                  <p class="text-sm text-muted">{{ item.description }}</p>
                </div>
                <UButton
                  variant="ghost"
                  color="error"
                  icon="i-heroicons-trash"
                  @click="removeItem(item.id)"
                />
              </div>
            </UCard>
          </div>

          <!-- Empty State -->
          <UEmpty
            v-else
            icon="i-heroicons-inbox"
            title="No items yet"
            description="Add some items to get started. You can add up to 5 items."
            :actions="[
              { label: 'Add First Item', click: addItem }
            ]"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface Item {
  id: number
  title: string
  description: string
}

const items = ref<Item[]>([])
let nextId = 1

const { add: addToast } = useToast()

function showToast(message: string) {
  addToast({
    title: message,
    color: 'success',
    timeout: 2000
  })
}

function addItem() {
  if (items.value.length >= 5) return

  items.value.push({
    id: nextId++,
    title: `Item ${nextId - 1}`,
    description: `This is item number ${nextId - 1}`
  })

  showToast('Item added successfully')
}

function removeItem(id: number) {
  items.value = items.value.filter(item => item.id !== id)
  showToast('Item removed')
}

function clearItems() {
  items.value = []
  showToast('All items cleared')
}
</script>
