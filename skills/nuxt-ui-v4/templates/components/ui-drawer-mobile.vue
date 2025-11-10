<template>
  <div class="p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Drawer & Mobile Patterns</h2>
        <p class="text-dimmed mt-1">Demonstrates responsive Drawer component for mobile-first UI</p>
      </template>

      <div class="space-y-6">
        <!-- Drawer Positions -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Drawer Positions</h3>
          <div class="flex flex-wrap gap-2">
            <UButton @click="openDrawer('left')">Left Drawer</UButton>
            <UButton @click="openDrawer('right')">Right Drawer</UButton>
            <UButton @click="openDrawer('top')">Top Drawer</UButton>
            <UButton @click="openDrawer('bottom')">Bottom Drawer</UButton>
          </div>
        </div>

        <!-- Responsive Pattern: Modal → Drawer -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Responsive: Modal ↔ Drawer</h3>
          <UButton @click="openResponsive">Open Responsive Overlay</UButton>
          <p class="text-sm text-dimmed mt-2">
            Desktop: Shows as Modal | Mobile: Shows as Drawer
          </p>
        </div>
      </div>
    </UCard>

    <!-- Drawer Components -->
    <UDrawer v-model="isDrawerOpen" :side="drawerSide">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">{{ drawerTitle }}</h3>
            <UButton
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isDrawerOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-dimmed">
            This is a drawer opening from the {{ drawerSide }} side.
          </p>

          <div class="space-y-3">
            <UFormField label="Name">
              <UInput v-model="formData.name" placeholder="Enter your name" />
            </UFormField>

            <UFormField label="Email">
              <UInput v-model="formData.email" type="email" placeholder="Enter your email" />
            </UFormField>

            <UFormField label="Message">
              <UTextarea v-model="formData.message" placeholder="Your message" :rows="4" />
            </UFormField>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="isDrawerOpen = false">Cancel</UButton>
            <UButton @click="submitForm">Submit</UButton>
          </div>
        </template>
      </UCard>
    </UDrawer>

    <!-- Responsive: Modal or Drawer based on screen size -->
    <UModal v-if="!isMobile" v-model="isResponsiveOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">Desktop Modal</h3>
            <UButton
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isResponsiveOpen = false"
            />
          </div>
        </template>

        <p>This appears as a centered modal on desktop screens.</p>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="isResponsiveOpen = false">Cancel</UButton>
            <UButton>Confirm</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <UDrawer v-else v-model="isResponsiveOpen" side="bottom">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">Mobile Drawer</h3>
            <UButton
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="isResponsiveOpen = false"
            />
          </div>
        </template>

        <p>This appears as a bottom drawer on mobile screens.</p>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="isResponsiveOpen = false">Cancel</UButton>
            <UButton>Confirm</UButton>
          </div>
        </template>
      </UCard>
    </UDrawer>
  </div>
</template>

<script setup lang="ts">
// Drawer state
const isDrawerOpen = ref(false)
const drawerSide = ref<'left' | 'right' | 'top' | 'bottom'>('right')
const drawerTitle = ref('Drawer')

// Responsive overlay state
const isResponsiveOpen = ref(false)

// Form data
const formData = reactive({
  name: '',
  email: '',
  message: ''
})

// Check if mobile (using media query)
const isMobile = computed(() => {
  if (process.client) {
    return window.matchMedia('(max-width: 768px)').matches
  }
  return false
})

// Open drawer
function openDrawer(side: 'left' | 'right' | 'top' | 'bottom') {
  drawerSide.value = side
  drawerTitle.value = `${side.charAt(0).toUpperCase() + side.slice(1)} Drawer`
  isDrawerOpen.value = true
}

// Open responsive overlay
function openResponsive() {
  isResponsiveOpen.value = true
}

// Submit form
function submitForm() {
  console.log('Form submitted:', formData)

  const { add: addToast } = useToast()
  addToast({
    title: 'Form Submitted',
    description: 'Your information has been saved',
    color: 'success'
  })

  isDrawerOpen.value = false

  // Reset form
  formData.name = ''
  formData.email = ''
  formData.message = ''
}
</script>
