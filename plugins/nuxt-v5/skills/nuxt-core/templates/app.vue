<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

const { checkSession } = useAuth()

onMounted(async () => {
  try {
    await checkSession()
  } catch {
    console.error('Session check failed')
  }
})
</script>
