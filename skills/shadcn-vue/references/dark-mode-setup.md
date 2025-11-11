# Dark Mode Setup Guide for shadcn-vue

Complete guide to implementing dark mode in shadcn-vue applications.

---

## Vue 3 + Vite Setup

### 1. Install VueUse

```bash
bun add @vueuse/core
# or npm install @vueuse/core
# or pnpm add @vueuse/core
```

### 2. Create Theme Composable

```typescript
// composables/useTheme.ts
import { useColorMode } from '@vueuse/core'
import { computed } from 'vue'

export function useTheme() {
  const mode = useColorMode({
    attribute: 'class',
    modes: {
      light: 'light',
      dark: 'dark'
    },
    storageKey: 'vueuse-color-scheme'
  })

  const isDark = computed(() => mode.value === 'dark')

  const toggleTheme = () => {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    mode.value = theme
  }

  return {
    mode,
    isDark,
    toggleTheme,
    setTheme
  }
}
```

### 3. Create Theme Toggle Component

```vue
<!-- components/ThemeToggle.vue -->
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const { mode, setTheme } = useTheme()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon">
        <svg
          v-if="mode === 'light'"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
        <span class="sr-only">Toggle theme</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="setTheme('light')">
        Light
      </DropdownMenuItem>
      <DropdownMenuItem @click="setTheme('dark')">
        Dark
      </DropdownMenuItem>
      <DropdownMenuItem @click="setTheme('auto')">
        System
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

### 4. Use in App

```vue
<!-- App.vue -->
<script setup>
import ThemeToggle from '@/components/ThemeToggle.vue'
</script>

<template>
  <div>
    <header>
      <ThemeToggle />
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>
```

---

## Nuxt 3 Setup

### 1. Install Nuxt Color Mode

```bash
bun add @nuxtjs/color-mode
# or npm/pnpm
```

### 2. Configure Nuxt

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/color-mode'],
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storageKey: 'nuxt-color-mode'
  }
})
```

### 3. Create Theme Toggle Component

```vue
<!-- components/ThemeToggle.vue -->
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const colorMode = useColorMode()

const setTheme = (theme: 'light' | 'dark' | 'system') => {
  colorMode.preference = theme
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon">
        <ClientOnly>
          <svg
            v-if="colorMode.value === 'light'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2m-8-10H2m20 0h-2m-2.93-6.07-1.41 1.41M6.34 17.66l-1.41 1.41m12.02 0 1.41 1.41M4.93 6.34l1.41-1.41" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </ClientOnly>
        <span class="sr-only">Toggle theme</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="setTheme('light')">
        Light
      </DropdownMenuItem>
      <DropdownMenuItem @click="setTheme('dark')">
        Dark
      </DropdownMenuItem>
      <DropdownMenuItem @click="setTheme('system')">
        System
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

### 4. Apply Dark Class

```vue
<!-- app.vue -->
<script setup>
const colorMode = useColorMode()
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
html {
  /* Color mode class applied automatically by @nuxtjs/color-mode */
}
</style>
```

---

## CSS Variables Setup

### Complete CSS Variable Definitions

```css
/* src/assets/index.css (Vue) or assets/css/tailwind.css (Nuxt) */
@import "tailwindcss";

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;

  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;

  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;

  --radius: 0.5rem;

  /* Chart colors */
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;

  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;

  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;

  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;

  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;

  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;

  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;

  /* Chart colors (same as light mode) */
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}
```

---

## System Preference Detection

### Auto-detect System Theme

```typescript
// composables/useTheme.ts
import { useColorMode, usePreferredDark } from '@vueuse/core'
import { computed, watch } from 'vue'

export function useTheme() {
  const prefersDark = usePreferredDark()

  const mode = useColorMode({
    attribute: 'class',
    modes: {
      light: 'light',
      dark: 'dark',
      auto: 'auto'
    },
    storageKey: 'vueuse-color-scheme'
  })

  // When mode is 'auto', follow system preference
  watch([mode, prefersDark], ([newMode, systemPrefersDark]) => {
    if (newMode === 'auto') {
      document.documentElement.classList.toggle('dark', systemPrefersDark)
    }
  }, { immediate: true })

  const isDark = computed(() => {
    if (mode.value === 'auto') {
      return prefersDark.value
    }
    return mode.value === 'dark'
  })

  return {
    mode,
    isDark,
    prefersDark,
    toggleTheme: () => {
      mode.value = isDark.value ? 'light' : 'dark'
    },
    setTheme: (theme: 'light' | 'dark' | 'auto') => {
      mode.value = theme
    }
  }
}
```

---

## Advanced: Custom Colors Per Theme

### Different Colors for Light/Dark

```css
:root {
  --primary: 221.2 83.2% 53.3%; /* Blue in light mode */
}

.dark {
  --primary: 142 71% 45%; /* Green in dark mode */
}
```

### Accessing in Components

```vue
<template>
  <div class="bg-primary text-primary-foreground">
    <!-- Background automatically switches between blue (light) and green (dark) -->
    This changes color based on theme
  </div>
</template>
```

---

## Troubleshooting

### Flash of Wrong Theme (FOUC)

Add inline script in `index.html` (Vue) or `app.vue` (Nuxt):

```html
<!-- Vue: public/index.html -->
<script>
  const theme = localStorage.getItem('vueuse-color-scheme') || 'light'
  document.documentElement.classList.toggle('dark', theme === 'dark')
</script>
```

```vue
<!-- Nuxt: app.vue -->
<script setup>
const colorMode = useColorMode()
</script>

<template>
  <div>
    <Head>
      <Script>
        const theme = localStorage.getItem('nuxt-color-mode') || 'light'
        document.documentElement.classList.toggle('dark', theme === 'dark')
      </Script>
    </Head>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

### Dark Mode Not Applying

1. Check CSS variables are defined in main CSS file
2. Verify `class="dark"` is added to `<html>` element
3. Ensure Tailwind is configured to use dark mode with class strategy
4. Check browser DevTools for `.dark` class on `<html>`

### localStorage Not Persisting

Ensure `storageKey` is set in `useColorMode` config:

```typescript
const mode = useColorMode({
  storageKey: 'vueuse-color-scheme' // Must be set
})
```

---

## Best Practices

1. **Always provide system option**: Let users follow OS preference
2. **Store preference**: Use localStorage to persist choice
3. **Prevent FOUC**: Load theme before content renders
4. **Test both themes**: Ensure all components work in light and dark
5. **Accessible toggle**: Include aria-label and keyboard support
6. **Smooth transitions**: Add CSS transitions for theme changes

```css
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```
