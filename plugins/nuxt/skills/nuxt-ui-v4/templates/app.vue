<template>
  <!-- UApp wrapper is REQUIRED for Nuxt UI components to work -->
  <UApp>
    <!-- Render pages -->
    <NuxtPage />

    <!-- Toast notifications container (auto-managed by useToast) -->
    <!-- Notifications container (auto-managed by useNotification) -->
  </UApp>
</template>

<style>
/* Import Tailwind CSS - MUST be first */
@import "tailwindcss";

/* Import Nuxt UI - MUST be after Tailwind */
@import "@nuxt/ui";

/* Optional: Custom global styles */
body {
  @apply bg-default text-default;
}

/* Optional: Custom CSS variables for theming */
:root {
  /* Add custom CSS variables if needed */
}
</style>

<script setup lang="ts">
// Optional: Global setup, meta tags, etc.
useHead({
  titleTemplate: '%s - Nuxt UI v4 App',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ]
})

// Optional: Global keyboard shortcuts
defineShortcuts({
  // Example: Open command palette with Cmd+K
  // 'meta_k': () => openCommandPalette()
})

// Optional: Color mode preference
// const colorMode = useColorMode()
// colorMode.preference = 'system' // or 'light' or 'dark'
</script>
