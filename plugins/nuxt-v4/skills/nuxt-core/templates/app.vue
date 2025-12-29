<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// SEO Meta tags
useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

// Check authentication session on mount
const { checkSession } = useAuth()

onMounted(() => {
  checkSession()
})
</script>
