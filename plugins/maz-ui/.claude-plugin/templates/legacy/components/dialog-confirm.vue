<script setup lang="ts">
import { ref } from 'vue'
import { useDialog } from 'maz-ui/composables/useDialog'
import { useToast } from 'maz-ui/composables/useToast'

// Composables
const dialog = useDialog()
const toast = useToast()

// Custom dialog state
const isCustomDialogOpen = ref(false)
const itemToDelete = ref<{ id: number; name: string } | null>(null)

/**
 * Option 1: Using useDialog() composable (programmatic)
 * Best for: Simple confirm/cancel dialogs without custom UI
 */
async function deleteWithDialog() {
  const confirmed = await dialog.confirm({
    title: 'Delete Item',
    message: 'This action cannot be undone. Are you sure you want to delete this item?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmColor: 'destructive'
  })

  if (confirmed) {
    performDelete()
  }
}

/**
 * Option 2: Using MazDialog component (template-based)
 * Best for: Custom dialog content and styling
 */
function openCustomDialog(item: { id: number; name: string }) {
  itemToDelete.value = item
  isCustomDialogOpen.value = true
}

function closeCustomDialog() {
  isCustomDialogOpen.value = false
  itemToDelete.value = null
}

async function confirmCustomDelete() {
  if (!itemToDelete.value) return

  try {
    await $fetch(`/api/items/${itemToDelete.value.id}`, {
      method: 'DELETE'
    })

    toast.success(`${itemToDelete.value.name} deleted successfully`)
    closeCustomDialog()
  } catch (error) {
    toast.error('Failed to delete item')
  }
}

// Shared delete logic
async function performDelete() {
  try {
    await $fetch('/api/delete', { method: 'DELETE' })
    toast.success('Item deleted successfully')
  } catch (error) {
    toast.error('Failed to delete item', {
      button: {
        text: 'Retry',
        onClick: deleteWithDialog,
        closeToast: true
      }
    })
  }
}

// Info dialog example
async function showInfoDialog() {
  await dialog.info({
    title: 'Information',
    message: 'This is an informational dialog. No action required.'
  })
}

// Warning dialog example
async function showWarningDialog() {
  const confirmed = await dialog.confirm({
    title: 'Warning',
    message: 'This action may have unintended consequences. Do you want to continue?',
    confirmText: 'Continue',
    cancelText: 'Go Back',
    confirmColor: 'warning'
  })

  if (confirmed) {
    toast.info('Continuing with action...')
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6 space-y-6">
    <h2 class="text-2xl font-bold mb-6">Dialog Examples</h2>

    <!-- Option 1: Programmatic Dialogs (useDialog composable) -->
    <section class="space-y-4">
      <h3 class="text-lg font-semibold">Programmatic Dialogs</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Using <code>useDialog()</code> composable for simple confirm/info dialogs
      </p>

      <div class="flex gap-4">
        <MazBtn
          @click="deleteWithDialog"
          color="destructive"
        >
          Delete with Confirmation
        </MazBtn>

        <MazBtn
          @click="showInfoDialog"
          color="info"
        >
          Show Info
        </MazBtn>

        <MazBtn
          @click="showWarningDialog"
          color="warning"
        >
          Show Warning
        </MazBtn>
      </div>
    </section>

    <!-- Option 2: Template-Based Dialog (MazDialog component) -->
    <section class="space-y-4">
      <h3 class="text-lg font-semibold">Custom Template Dialog</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Using <code>&lt;MazDialog&gt;</code> component for custom content
      </p>

      <MazBtn
        @click="openCustomDialog({ id: 1, name: 'Sample Item' })"
        color="destructive"
      >
        Delete with Custom Dialog
      </MazBtn>
    </section>

    <!-- Custom Dialog Component -->
    <MazDialog
      v-model="isCustomDialogOpen"
      title="Confirm Deletion"
      persistent
    >
      <div class="p-6 space-y-4">
        <p class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete
          <strong class="text-red-600 dark:text-red-400">{{ itemToDelete?.name }}</strong>?
        </p>

        <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <p class="text-sm text-red-800 dark:text-red-200">
            <strong>Warning:</strong> This action cannot be undone.
            All data associated with this item will be permanently deleted.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3 p-4">
          <MazBtn
            @click="closeCustomDialog"
            outlined
          >
            Cancel
          </MazBtn>

          <MazBtn
            @click="confirmCustomDelete"
            color="destructive"
          >
            Delete Permanently
          </MazBtn>
        </div>
      </template>
    </MazDialog>
  </div>
</template>
