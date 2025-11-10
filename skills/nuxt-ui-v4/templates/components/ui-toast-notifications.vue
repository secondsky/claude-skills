<template>
  <div class="p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Toast Notifications Example</h2>
        <p class="text-dimmed mt-1">Demonstrates useToast composable with various styles and actions</p>
      </template>

      <div class="space-y-6">
        <!-- Basic Toasts -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Basic Notifications</h3>
          <div class="flex flex-wrap gap-2">
            <UButton @click="showSuccess">Success</UButton>
            <UButton @click="showError" color="error">Error</UButton>
            <UButton @click="showWarning" color="warning">Warning</UButton>
            <UButton @click="showInfo" color="info">Info</UButton>
          </div>
        </div>

        <!-- Toast with Description -->
        <div>
          <h3 class="text-lg font-semibold mb-3">With Description</h3>
          <UButton @click="showWithDescription">Show Description</UButton>
        </div>

        <!-- Toast with Actions -->
        <div>
          <h3 class="text-lg font-semibold mb-3">With Actions</h3>
          <div class="flex gap-2">
            <UButton @click="showWithAction">Undo Action</UButton>
            <UButton @click="showWithMultipleActions" variant="outline">Multiple Actions</UButton>
          </div>
        </div>

        <!-- Toast Positions -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Position Variants</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <UButton @click="showPosition('top-left')" variant="outline" size="sm">Top Left</UButton>
            <UButton @click="showPosition('top-center')" variant="outline" size="sm">Top Center</UButton>
            <UButton @click="showPosition('top-right')" variant="outline" size="sm">Top Right</UButton>
            <UButton @click="showPosition('bottom-left')" variant="outline" size="sm">Bottom Left</UButton>
            <UButton @click="showPosition('bottom-center')" variant="outline" size="sm">Bottom Center</UButton>
            <UButton @click="showPosition('bottom-right')" variant="outline" size="sm">Bottom Right</UButton>
          </div>
        </div>

        <!-- Custom Timeout -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Custom Timeout</h3>
          <div class="flex gap-2">
            <UButton @click="showWithTimeout(2000)" size="sm">2 seconds</UButton>
            <UButton @click="showWithTimeout(5000)" size="sm">5 seconds</UButton>
            <UButton @click="showWithTimeout(10000)" size="sm">10 seconds</UButton>
            <UButton @click="showPersistent" size="sm" variant="outline">No Auto-close</UButton>
          </div>
        </div>

        <!-- Loading Toast -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Loading States</h3>
          <UButton @click="showLoadingToast">Simulate Loading</UButton>
        </div>

        <!-- Clear All Toasts -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Clear Toasts</h3>
          <UButton @click="clearAllToasts" color="error" variant="ghost">Clear All</UButton>
        </div>

        <!-- Toast Composable Info -->
        <UAlert
          color="info"
          variant="subtle"
          title="useToast Composable"
          description="Toasts are managed globally through the useToast() composable. They persist across route changes and automatically stack when multiple are shown."
          icon="i-heroicons-information-circle"
        />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Get toast composable
const { add: addToast, remove: removeToast, clear: clearToasts } = useToast()

// Basic success toast
function showSuccess() {
  addToast({
    title: 'Success!',
    description: 'Your action completed successfully',
    color: 'success',
    icon: 'i-heroicons-check-circle',
    timeout: 3000
  })
}

// Error toast
function showError() {
  addToast({
    title: 'Error',
    description: 'Something went wrong. Please try again.',
    color: 'error',
    icon: 'i-heroicons-x-circle',
    timeout: 5000
  })
}

// Warning toast
function showWarning() {
  addToast({
    title: 'Warning',
    description: 'Please review your changes before proceeding',
    color: 'warning',
    icon: 'i-heroicons-exclamation-triangle',
    timeout: 4000
  })
}

// Info toast
function showInfo() {
  addToast({
    title: 'Information',
    description: 'New features are now available in settings',
    color: 'info',
    icon: 'i-heroicons-information-circle',
    timeout: 3000
  })
}

// Toast with longer description
function showWithDescription() {
  addToast({
    title: 'Update Available',
    description: 'A new version of this application is available. Click the button below to refresh and get the latest features and bug fixes.',
    color: 'info',
    icon: 'i-heroicons-arrow-path',
    timeout: 6000
  })
}

// Toast with action button
function showWithAction() {
  addToast({
    title: 'Item Deleted',
    description: 'The item has been removed from your list',
    color: 'success',
    icon: 'i-heroicons-trash',
    timeout: 5000,
    actions: [{
      label: 'Undo',
      click: () => {
        console.log('Undo clicked')
        addToast({
          title: 'Restored',
          description: 'Item has been restored',
          color: 'success',
          timeout: 2000
        })
      }
    }]
  })
}

// Toast with multiple actions
function showWithMultipleActions() {
  addToast({
    title: 'New Message',
    description: 'You have received a new message from John Doe',
    color: 'info',
    icon: 'i-heroicons-envelope',
    timeout: 0,  // No auto-close
    actions: [
      {
        label: 'View',
        click: () => {
          console.log('View clicked')
        }
      },
      {
        label: 'Dismiss',
        click: (toast) => {
          if (toast?.id) {
            removeToast(toast.id)
          }
        }
      }
    ]
  })
}

// Toast at different positions
function showPosition(position: string) {
  addToast({
    title: `Toast Position: ${position}`,
    description: 'This toast appears at a custom position',
    color: 'primary',
    icon: 'i-heroicons-map-pin',
    timeout: 3000,
    // Note: Position is configured globally in app.config.ts
    // This is just for demonstration
  })
}

// Toast with custom timeout
function showWithTimeout(ms: number) {
  addToast({
    title: `${ms / 1000} Second Toast`,
    description: `This toast will auto-close in ${ms / 1000} seconds`,
    color: 'neutral',
    icon: 'i-heroicons-clock',
    timeout: ms
  })
}

// Persistent toast (no auto-close)
function showPersistent() {
  addToast({
    title: 'Persistent Notification',
    description: 'This toast will not auto-close. Click the X to dismiss.',
    color: 'warning',
    icon: 'i-heroicons-bell',
    timeout: 0,  // 0 = no auto-close
    actions: [{
      label: 'Got it',
      click: (toast) => {
        if (toast?.id) {
          removeToast(toast.id)
        }
      }
    }]
  })
}

// Loading toast with async operation
async function showLoadingToast() {
  const loadingToast = addToast({
    title: 'Processing...',
    description: 'Please wait while we complete your request',
    color: 'info',
    icon: 'i-heroicons-arrow-path',
    timeout: 0  // Don't auto-close while loading
  })

  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Remove loading toast
  if (loadingToast?.id) {
    removeToast(loadingToast.id)
  }

  // Show success toast
  addToast({
    title: 'Complete!',
    description: 'Your request has been processed successfully',
    color: 'success',
    icon: 'i-heroicons-check-circle',
    timeout: 3000
  })
}

// Clear all toasts
function clearAllToasts() {
  clearToasts()

  // Show confirmation
  setTimeout(() => {
    addToast({
      title: 'Cleared',
      description: 'All notifications have been cleared',
      color: 'neutral',
      timeout: 2000
    })
  }, 100)
}

// Example: Real-world usage patterns
/*
// 1. Form submission success
async function submitForm() {
  try {
    await api.submitForm(data)
    addToast({
      title: 'Form Submitted',
      description: 'Your form has been submitted successfully',
      color: 'success'
    })
  } catch (error) {
    addToast({
      title: 'Submission Failed',
      description: error.message,
      color: 'error'
    })
  }
}

// 2. File upload progress
async function uploadFile(file) {
  const toast = addToast({
    title: 'Uploading...',
    description: 'Please wait',
    timeout: 0
  })

  try {
    await uploadAPI(file)
    removeToast(toast.id)
    addToast({
      title: 'Upload Complete',
      color: 'success'
    })
  } catch (error) {
    removeToast(toast.id)
    addToast({
      title: 'Upload Failed',
      description: error.message,
      color: 'error'
    })
  }
}

// 3. Clipboard copy
async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
  addToast({
    title: 'Copied!',
    timeout: 2000
  })
}
*/
</script>
