<template>
  <div class="p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Dropdown Menu Example</h2>
        <p class="text-dimmed mt-1">Demonstrates dropdown menus with nested items, separators, and keyboard navigation</p>
      </template>

      <div class="space-y-6">
        <!-- Basic Dropdown -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Basic Dropdown</h3>
          <UDropdownMenu>
            <UButton trailing-icon="i-heroicons-chevron-down">Actions</UButton>

            <template #content>
              <UDropdownMenuItem @click="handleAction('edit')">
                <UIcon name="i-heroicons-pencil" class="mr-2" />
                Edit
              </UDropdownMenuItem>
              <UDropdownMenuItem @click="handleAction('duplicate')">
                <UIcon name="i-heroicons-document-duplicate" class="mr-2" />
                Duplicate
              </UDropdownMenuItem>
              <UDropdownMenuSeparator />
              <UDropdownMenuItem @click="handleAction('delete')" class="text-error">
                <UIcon name="i-heroicons-trash" class="mr-2" />
                Delete
              </UDropdownMenuItem>
            </template>
          </UDropdownMenu>
        </div>

        <!-- Icon-Only Trigger -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Icon-Only Trigger</h3>
          <UDropdownMenu>
            <UButton icon="i-heroicons-ellipsis-horizontal" variant="ghost" />

            <template #content>
              <UDropdownMenuItem @click="handleAction('view')">View</UDropdownMenuItem>
              <UDropdownMenuItem @click="handleAction('edit')">Edit</UDropdownMenuItem>
              <UDropdownMenuItem @click="handleAction('share')">Share</UDropdownMenuItem>
            </template>
          </UDropdownMenu>
        </div>

        <!-- With Keyboard Shortcuts -->
        <div>
          <h3 class="text-lg font-semibold mb-3">With Keyboard Shortcuts</h3>
          <UDropdownMenu>
            <UButton>File</UButton>

            <template #content>
              <UDropdownMenuItem @click="handleAction('new')">
                <UIcon name="i-heroicons-document-plus" class="mr-2" />
                New File
                <UKbd class="ml-auto">⌘N</UKbd>
              </UDropdownMenuItem>
              <UDropdownMenuItem @click="handleAction('open')">
                <UIcon name="i-heroicons-folder-open" class="mr-2" />
                Open
                <UKbd class="ml-auto">⌘O</UKbd>
              </UDropdownMenuItem>
              <UDropdownMenuItem @click="handleAction('save')">
                <UIcon name="i-heroicons-document-arrow-down" class="mr-2" />
                Save
                <UKbd class="ml-auto">⌘S</UKbd>
              </UDropdownMenuItem>
              <UDropdownMenuSeparator />
              <UDropdownMenuItem @click="handleAction('quit')">
                <UIcon name="i-heroicons-arrow-right-on-rectangle" class="mr-2" />
                Quit
                <UKbd class="ml-auto">⌘Q</UKbd>
              </UDropdownMenuItem>
            </template>
          </UDropdownMenu>
        </div>

        <!-- User Profile Dropdown -->
        <div>
          <h3 class="text-lg font-semibold mb-3">User Profile Dropdown</h3>
          <UDropdownMenu>
            <UButton variant="ghost">
              <div class="flex items-center gap-2">
                <UAvatar src="https://i.pravatar.cc/150?img=8" size="sm" />
                <span>John Doe</span>
                <UIcon name="i-heroicons-chevron-down" />
              </div>
            </UButton>

            <template #content>
              <div class="px-4 py-2 border-b border-default">
                <div class="font-medium">John Doe</div>
                <div class="text-sm text-dimmed">john@example.com</div>
              </div>

              <UDropdownMenuItem @click="handleAction('profile')">
                <UIcon name="i-heroicons-user" class="mr-2" />
                Profile
              </UDropdownMenuItem>
              <UDropdownMenuItem @click="handleAction('settings')">
                <UIcon name="i-heroicons-cog" class="mr-2" />
                Settings
              </UDropdownMenuItem>
              <UDropdownMenuItem @click="handleAction('billing')">
                <UIcon name="i-heroicons-credit-card" class="mr-2" />
                Billing
              </UDropdownMenuItem>

              <UDropdownMenuSeparator />

              <UDropdownMenuItem @click="handleAction('logout')" class="text-error">
                <UIcon name="i-heroicons-arrow-right-on-rectangle" class="mr-2" />
                Logout
              </UDropdownMenuItem>
            </template>
          </UDropdownMenu>
        </div>

        <!-- Context Menu (Right-Click) -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Context Menu (Right-Click)</h3>
          <UCard class="cursor-pointer" @contextmenu.prevent="showContextMenu">
            <p>Right-click this card to open context menu</p>
          </UCard>

          <UContextMenu v-model="isContextMenuOpen">
            <UDropdownMenuItem @click="handleAction('copy')">
              <UIcon name="i-heroicons-clipboard" class="mr-2" />
              Copy
            </UDropdownMenuItem>
            <UDropdownMenuItem @click="handleAction('cut')">
              <UIcon name="i-heroicons-scissors" class="mr-2" />
              Cut
            </UDropdownMenuItem>
            <UDropdownMenuItem @click="handleAction('paste')">
              <UIcon name="i-heroicons-clipboard-document" class="mr-2" />
              Paste
            </UDropdownMenuItem>
          </UContextMenu>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Context menu state
const isContextMenuOpen = ref(false)

// Handle dropdown actions
function handleAction(action: string) {
  console.log('Action:', action)

  const { add: addToast } = useToast()
  addToast({
    title: 'Action Triggered',
    description: `You clicked: ${action}`,
    timeout: 2000
  })
}

// Show context menu
function showContextMenu(event: MouseEvent) {
  event.preventDefault()
  isContextMenuOpen.value = true
}

// Keyboard shortcuts (optional)
defineShortcuts({
  'meta_n': () => handleAction('new'),
  'meta_o': () => handleAction('open'),
  'meta_s': () => handleAction('save'),
  'meta_q': () => handleAction('quit')
})
</script>
