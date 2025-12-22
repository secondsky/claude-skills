<template>
  <div class="p-6">
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold mb-2">Feedback States Example</h2>
        <p class="text-dimmed">Demonstrates Alert, Skeleton, and Progress components for user feedback</p>
      </div>

      <!-- Alerts -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Alert Components</h3>
        <div class="space-y-3">
          <UAlert
            color="success"
            variant="subtle"
            title="Success"
            description="Your changes have been saved successfully"
            icon="i-heroicons-check-circle"
          />

          <UAlert
            color="error"
            variant="subtle"
            title="Error"
            description="Failed to save changes. Please try again."
            icon="i-heroicons-x-circle"
          />

          <UAlert
            color="warning"
            variant="subtle"
            title="Warning"
            description="Your session will expire in 5 minutes"
            icon="i-heroicons-exclamation-triangle"
          />

          <UAlert
            color="info"
            variant="subtle"
            title="Info"
            description="New features are available in the latest update"
            icon="i-heroicons-information-circle"
          />
        </div>
      </div>

      <!-- Skeleton Loaders -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Skeleton Loaders</h3>

        <div class="flex items-center gap-2 mb-4">
          <UButton @click="toggleLoading">{{ isLoading ? 'Hide' : 'Show' }} Loading</UButton>
        </div>

        <div v-if="isLoading" class="space-y-4">
          <!-- Profile Skeleton -->
          <UCard>
            <div class="flex items-start gap-4">
              <USkeleton class="h-16 w-16 rounded-full" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-32" />
                <USkeleton class="h-3 w-48" />
                <USkeleton class="h-3 w-24" />
              </div>
            </div>
          </UCard>

          <!-- List Skeleton -->
          <UCard>
            <div class="space-y-4">
              <div v-for="i in 3" :key="i" class="flex items-center gap-4">
                <USkeleton class="h-12 w-12 rounded" />
                <div class="flex-1 space-y-2">
                  <USkeleton class="h-4 w-full" />
                  <USkeleton class="h-3 w-3/4" />
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <div v-else>
          <!-- Actual Content -->
          <UCard>
            <div class="flex items-start gap-4">
              <UAvatar src="https://i.pravatar.cc/150?img=1" size="lg" />
              <div>
                <h4 class="font-semibold">John Doe</h4>
                <p class="text-sm text-dimmed">Software Engineer</p>
                <p class="text-sm text-muted">San Francisco, CA</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Progress Bars -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Progress Indicators</h3>

        <div class="space-y-6">
          <!-- Linear Progress -->
          <div>
            <div class="flex justify-between text-sm mb-2">
              <span>Upload Progress</span>
              <span class="text-dimmed">{{ uploadProgress }}%</span>
            </div>
            <UProgress :value="uploadProgress" :max="100" color="primary" />
          </div>

          <!-- Colored Progress -->
          <div class="space-y-4">
            <div>
              <div class="text-sm mb-2">Success (75%)</div>
              <UProgress :value="75" :max="100" color="success" />
            </div>

            <div>
              <div class="text-sm mb-2">Warning (50%)</div>
              <UProgress :value="50" :max="100" color="warning" />
            </div>

            <div>
              <div class="text-sm mb-2">Error (30%)</div>
              <UProgress :value="30" :max="100" color="error" />
            </div>
          </div>

          <!-- Animated Progress -->
          <div>
            <UButton @click="simulateUpload" :disabled="isUploading">
              {{ isUploading ? 'Uploading...' : 'Simulate Upload' }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- Empty States -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Empty States</h3>

        <UCard>
          <div class="text-center py-12">
            <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto mb-4 text-dimmed opacity-50" />
            <h4 class="text-lg font-semibold mb-2">No items found</h4>
            <p class="text-dimmed mb-4">Get started by creating your first item</p>
            <UButton>Create Item</UButton>
          </div>
        </UCard>
      </div>

      <!-- Error States -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Error States</h3>

        <UCard>
          <div class="text-center py-12">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-error" />
            </div>
            <h4 class="text-lg font-semibold mb-2">Failed to load data</h4>
            <p class="text-dimmed mb-4">We couldn't fetch the data. Please try again.</p>
            <div class="flex justify-center gap-2">
              <UButton variant="ghost">Go Back</UButton>
              <UButton>Retry</UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isLoading = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

function toggleLoading() {
  isLoading.value = !isLoading.value
}

async function simulateUpload() {
  isUploading.value = true
  uploadProgress.value = 0

  const interval = setInterval(() => {
    uploadProgress.value += 10

    if (uploadProgress.value >= 100) {
      clearInterval(interval)
      isUploading.value = false

      const { add: addToast } = useToast()
      addToast({
        title: 'Upload Complete',
        description: 'Your file has been uploaded successfully',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }
  }, 300)
}
</script>
