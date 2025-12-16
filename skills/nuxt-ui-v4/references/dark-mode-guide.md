# Dark Mode Guide

**Purpose**: Complete guide to implementing and customizing dark mode in Nuxt UI v4
**Feature**: Built-in dark mode support with automatic system preference detection

---

## Quick Setup

Dark mode is **enabled by default** in Nuxt UI v4. No additional configuration needed.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  ui: {
    colorMode: true  // ← Enabled by default
  }
})
```

---

## Color Mode Features

### Automatic System Detection

On first visit, Nuxt UI automatically detects the user's system preference:
- Uses `prefers-color-scheme` media query
- Respects OS-level dark mode setting
- No manual user selection required initially

### Persistent Preference

User preferences are automatically saved to localStorage:
- **Storage key**: `nuxt-color-mode`
- **Values**: `'light'`, `'dark'`, or `'system'`
- **Persistence**: Survives page reloads and browser restarts

### Three Modes

1. **Light**: Force light mode
2. **Dark**: Force dark mode
3. **System**: Follow OS preference (auto-switches when OS changes)

---

## Using useColorMode Composable

### Basic Usage

```vue
<script setup lang="ts">
const colorMode = useColorMode()

// Get current mode
console.log(colorMode.value)  // 'light' | 'dark' | 'system'

// Get preference (what user selected)
console.log(colorMode.preference)  // 'light' | 'dark' | 'system'

// Check if currently dark
const isDark = computed(() => colorMode.value === 'dark')
</script>
```

### Setting Color Mode

```vue
<script setup lang="ts">
const colorMode = useColorMode()

// Set to dark mode
function setDark() {
  colorMode.preference = 'dark'
}

// Set to light mode
function setLight() {
  colorMode.preference = 'light'
}

// Set to system mode
function setSystem() {
  colorMode.preference = 'system'
}
</script>
```

### Toggle Color Mode

```vue
<template>
  <UButton
    :icon="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
    @click="toggleDark"
  >
    {{ isDark ? 'Dark' : 'Light' }}
  </UButton>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

function toggleDark() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
```

---

## Built-in Color Mode Components

### UColorModeSwitch

Simple toggle component:

```vue
<template>
  <UColorModeSwitch />
</template>
```

Renders a toggle switch that switches between light/dark modes.

### UColorModeButton

Button component with icon:

```vue
<template>
  <UColorModeButton />
</template>
```

Renders a button that cycles through light/dark/system modes.

### UColorModeSelect

Dropdown select component:

```vue
<template>
  <UColorModeSelect />
</template>
```

Renders a select menu with all three options (Light, Dark, System).

### UColorModeImage

Display different images based on color mode:

```vue
<template>
  <UColorModeImage
    light="/logo-light.png"
    dark="/logo-dark.png"
    alt="Logo"
  />
</template>
```

### UColorModeAvatar

Display different avatars based on color mode:

```vue
<template>
  <UColorModeAvatar
    light="/avatar-light.jpg"
    dark="/avatar-dark.jpg"
    alt="Profile"
  />
</template>
```

---

## Custom Toggle Components

### Icon-Only Toggle

```vue
<template>
  <UButton
    :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
    variant="ghost"
    aria-label="Toggle color mode"
    @click="toggleColorMode"
  />
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

function toggleColorMode() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
```

### Toggle with Label

```vue
<template>
  <div class="flex items-center gap-2">
    <UIcon :name="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'" />
    <USwitch v-model="isDarkMode" @update:model-value="toggleColorMode" />
    <span class="text-sm">{{ isDark ? 'Dark' : 'Light' }} Mode</span>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const isDarkMode = computed({
  get: () => isDark.value,
  set: (value) => {
    colorMode.preference = value ? 'dark' : 'light'
  }
})
</script>
```

### Three-Way Toggle

```vue
<template>
  <UDropdownMenu>
    <UButton :icon="currentIcon" variant="ghost">
      {{ currentLabel }}
    </UButton>

    <template #content>
      <UDropdownMenuItem
        @click="colorMode.preference = 'light'"
        :disabled="colorMode.preference === 'light'"
      >
        <UIcon name="i-heroicons-sun" class="mr-2" />
        Light
      </UDropdownMenuItem>

      <UDropdownMenuItem
        @click="colorMode.preference = 'dark'"
        :disabled="colorMode.preference === 'dark'"
      >
        <UIcon name="i-heroicons-moon" class="mr-2" />
        Dark
      </UDropdownMenuItem>

      <UDropdownMenuItem
        @click="colorMode.preference = 'system'"
        :disabled="colorMode.preference === 'system'"
      >
        <UIcon name="i-heroicons-computer-desktop" class="mr-2" />
        System
      </UDropdownMenuItem>
    </template>
  </UDropdownMenu>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

const currentIcon = computed(() => {
  switch (colorMode.preference) {
    case 'light': return 'i-heroicons-sun'
    case 'dark': return 'i-heroicons-moon'
    case 'system': return 'i-heroicons-computer-desktop'
    default: return 'i-heroicons-sun'
  }
})

const currentLabel = computed(() => {
  return colorMode.preference.charAt(0).toUpperCase() + colorMode.preference.slice(1)
})
</script>
```

---

## CSS Variables & Dark Mode

All Nuxt UI components automatically adapt to dark mode via CSS variables:

```css
/* Automatically defined by Nuxt UI */
.dark {
  --ui-bg: #1f2937;
  --ui-text: #f9fafb;
  --ui-primary: #3b82f6;
  /* ... and many more */
}
```

### Custom Dark Mode Styles

Use the `.dark` class for custom dark mode styling:

```vue
<template>
  <div class="
    bg-white dark:bg-gray-900
    text-gray-900 dark:text-white
    border border-gray-200 dark:border-gray-700
  ">
    Content adapts to color mode
  </div>
</template>
```

### Accessing Color Mode in CSS

```vue
<style scoped>
.my-component {
  background: white;
  color: black;
}

.dark .my-component {
  background: #1f2937;
  color: white;
}

/* Or use Tailwind's dark: prefix */
</style>
```

---

## Advanced Configuration

### Force Dark/Light Mode

Disable user preference and force a specific mode:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    colorMode: {
      preference: 'dark',  // Force dark mode
      fallback: 'dark'     // Fallback if preference unavailable
    }
  }
})
```

### Disable Color Mode

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    colorMode: false  // Disable color mode entirely
  }
})
```

### Custom Storage Key

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    colorMode: {
      storageKey: 'my-app-theme'  // Custom localStorage key
    }
  }
})
```

---

## Theming Dark Mode Colors

### Global Semantic Colors

Customize dark mode colors in `app.config.ts`:

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      success: 'green',
      warning: 'amber',
      error: 'red'
    }
  }
})
```

These colors automatically adapt to dark mode with proper contrast.

### Custom CSS Variables

Add custom CSS variables that adapt to color mode:

```vue
<style>
@theme {
  /* Light mode (default) */
  --custom-bg: #ffffff;
  --custom-text: #000000;
}

.dark {
  /* Dark mode overrides */
  --custom-bg: #1f2937;
  --custom-text: #f9fafb;
}
</style>
```

---

## Reactive to Color Mode Changes

### Watch for Changes

```vue
<script setup lang="ts">
const colorMode = useColorMode()

watch(() => colorMode.value, (newMode) => {
  console.log('Color mode changed to:', newMode)

  // Perform actions on mode change
  if (newMode === 'dark') {
    // Dark mode specific logic
  }
})
</script>
```

### One-time Setup

```vue
<script setup lang="ts">
const colorMode = useColorMode()

onMounted(() => {
  if (colorMode.value === 'dark') {
    // Initialize dark mode specific features
  }
})
</script>
```

---

## Common Patterns

### Header with Color Mode Toggle

```vue
<template>
  <header class="border-b bg-white dark:bg-gray-900">
    <UContainer>
      <div class="flex items-center justify-between py-4">
        <div class="flex items-center gap-2">
          <UColorModeImage
            light="/logo-light.svg"
            dark="/logo-dark.svg"
            alt="Logo"
            class="h-8"
          />
          <span class="font-bold text-xl">My App</span>
        </div>

        <nav class="flex items-center gap-4">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/about">About</NuxtLink>
          <UColorModeButton />
        </nav>
      </div>
    </UContainer>
  </header>
</template>
```

### Settings Panel

```vue
<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold">Appearance</h3>
    </template>

    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium">Theme</label>
        <URadioGroup
          v-model="colorMode.preference"
          :items="themeOptions"
          class="mt-2"
        />
      </div>

      <UDivider />

      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Dark Mode</p>
          <p class="text-sm text-gray-500">Toggle dark mode on/off</p>
        </div>
        <UColorModeSwitch />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' }
]
</script>
```

---

## Troubleshooting

### Flash of Unstyled Content (FOUC)

**Problem**: Brief flash of light mode before dark mode applies

**Solution**: Color mode is applied before hydration by default. If you see FOUC:

1. Ensure `@nuxt/ui` is in modules
2. Verify UApp wrapper exists in app.vue
3. Check that CSS imports are in correct order

### Preference Not Persisting

**Problem**: Color mode resets on page reload

**Cause**: localStorage access issues or browser restrictions

**Solution**:
```typescript
// Check localStorage access
if (typeof localStorage !== 'undefined') {
  console.log('localStorage available')
} else {
  console.error('localStorage blocked')
}
```

### System Mode Not Working

**Problem**: System mode doesn't follow OS changes

**Cause**: Browser doesn't support `prefers-color-scheme`

**Solution**: Provide manual toggle as fallback:
```vue
<template>
  <UColorModeSelect />
</template>
```

---

## Reference

- **Templates**: See `templates/components/ui-dark-mode-toggle.vue`
- **Composables**: See `composables-guide.md` for useColorMode
- **Theming**: See `component-theming-guide.md` for color customization
