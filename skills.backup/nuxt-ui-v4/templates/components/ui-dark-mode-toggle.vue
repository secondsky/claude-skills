<template>
  <div class="p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Dark Mode Toggle Examples</h2>
        <p class="text-dimmed mt-1">Demonstrates color mode switching with system preference support</p>
      </template>

      <div class="space-y-6">
        <!-- Toggle Button -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Simple Toggle Button</h3>
          <UButton
            :icon="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
            :label="isDark ? 'Dark Mode' : 'Light Mode'"
            @click="toggleDarkMode"
          />
        </div>

        <!-- Icon-Only Toggle -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Icon-Only Toggle</h3>
          <UButton
            :icon="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
            variant="ghost"
            size="lg"
            @click="toggleDarkMode"
          />
        </div>

        <!-- Switch Component -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Switch Component</h3>
          <div class="flex items-center gap-3">
            <UIcon :name="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'" class="w-5 h-5" />
            <USwitch v-model="isDark" @update:model-value="handleSwitchChange" />
            <span class="text-sm">{{ isDark ? 'Dark' : 'Light' }}</span>
          </div>
        </div>

        <!-- Dropdown Menu -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Dropdown Menu Selector</h3>
          <UDropdownMenu>
            <UButton
              :icon="colorModeIcon"
              trailing-icon="i-heroicons-chevron-down"
            >
              {{ colorModeLabel }}
            </UButton>

            <template #content>
              <UDropdownMenuItem
                @click="setColorMode('light')"
                :class="{ 'bg-primary/10': colorMode.preference === 'light' }"
              >
                <UIcon name="i-heroicons-sun" class="mr-2" />
                Light
                <UIcon
                  v-if="colorMode.preference === 'light'"
                  name="i-heroicons-check"
                  class="ml-auto text-primary"
                />
              </UDropdownMenuItem>

              <UDropdownMenuItem
                @click="setColorMode('dark')"
                :class="{ 'bg-primary/10': colorMode.preference === 'dark' }"
              >
                <UIcon name="i-heroicons-moon" class="mr-2" />
                Dark
                <UIcon
                  v-if="colorMode.preference === 'dark'"
                  name="i-heroicons-check"
                  class="ml-auto text-primary"
                />
              </UDropdownMenuItem>

              <UDropdownMenuSeparator />

              <UDropdownMenuItem
                @click="setColorMode('system')"
                :class="{ 'bg-primary/10': colorMode.preference === 'system' }"
              >
                <UIcon name="i-heroicons-computer-desktop" class="mr-2" />
                System
                <UIcon
                  v-if="colorMode.preference === 'system'"
                  name="i-heroicons-check"
                  class="ml-auto text-primary"
                />
              </UDropdownMenuItem>
            </template>
          </UDropdownMenu>

          <p class="text-sm text-dimmed mt-2">
            Current preference: <strong>{{ colorMode.preference }}</strong>
          </p>
          <p class="text-sm text-dimmed">
            Effective mode: <strong>{{ colorMode.value }}</strong>
          </p>
        </div>

        <!-- Radio Group Selector -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Radio Group Selector</h3>
          <URadioGroup
            v-model="colorMode.preference"
            :options="colorModeOptions"
          />
        </div>

        <!-- Info Card -->
        <UAlert
          color="info"
          variant="subtle"
          title="Color Mode Persistence"
          description="Your color mode preference is automatically saved to localStorage and will be remembered on your next visit."
          icon="i-heroicons-information-circle"
        />

        <!-- Current Settings -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Current Color Mode Settings</h3>
          </template>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-dimmed">Preference:</span>
              <span class="font-medium">{{ colorMode.preference }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-dimmed">Effective Mode:</span>
              <span class="font-medium">{{ colorMode.value }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-dimmed">System Preference:</span>
              <span class="font-medium">{{ systemPreference }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// Get color mode composable
const colorMode = useColorMode()

// Computed: Is dark mode
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light'
  }
})

// Computed: Color mode icon
const colorModeIcon = computed(() => {
  if (colorMode.preference === 'system') {
    return 'i-heroicons-computer-desktop'
  }
  return colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'
})

// Computed: Color mode label
const colorModeLabel = computed(() => {
  const labels: Record<string, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System'
  }
  return labels[colorMode.preference] || 'Light'
})

// Computed: System preference
const systemPreference = computed(() => {
  if (process.client) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'unknown'
})

// Radio options
const colorModeOptions = [
  {
    value: 'light',
    label: 'Light',
    description: 'Always use light mode',
    icon: 'i-heroicons-sun'
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Always use dark mode',
    icon: 'i-heroicons-moon'
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow system preference',
    icon: 'i-heroicons-computer-desktop'
  }
]

// Toggle dark mode
function toggleDarkMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'

  // Optional: Show toast notification
  const { add: addToast } = useToast()
  addToast({
    title: `Switched to ${colorMode.preference} mode`,
    icon: colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun',
    timeout: 2000
  })
}

// Handle switch change
function handleSwitchChange(value: boolean) {
  colorMode.preference = value ? 'dark' : 'light'
}

// Set color mode
function setColorMode(mode: 'light' | 'dark' | 'system') {
  colorMode.preference = mode

  // Optional: Show toast notification
  const { add: addToast } = useToast()
  addToast({
    title: `Color mode set to ${mode}`,
    icon: colorModeIcon.value,
    timeout: 2000
  })
}

// Watch for system preference changes
if (process.client) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  mediaQuery.addEventListener('change', (e) => {
    if (colorMode.preference === 'system') {
      console.log('System preference changed to:', e.matches ? 'dark' : 'light')
    }
  })
}
</script>
