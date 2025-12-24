<template>
  <div class="p-6">
    <UCard>
      <template #header>
        <h2 class="text-2xl font-bold">Carousel Gallery Example</h2>
        <p class="text-dimmed mt-1">Demonstrates Carousel component with Embla integration</p>
      </template>

      <div class="space-y-4">
        <UCarousel :items="images" :ui="{ container: 'gap-4' }">
          <template #item="{ item }">
            <div class="aspect-video bg-gradient-to-br rounded-lg flex items-center justify-center" :style="{ backgroundImage: `linear-gradient(to bottom right, ${item.from}, ${item.to})` }">
              <div class="text-center text-white">
                <UIcon name="i-heroicons-photo" class="w-16 h-16 mx-auto mb-2" />
                <p class="font-semibold">{{ item.title }}</p>
              </div>
            </div>
          </template>
        </UCarousel>

        <p class="text-sm text-dimmed text-center">
          Navigate with arrows or swipe
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const images = [
  { title: 'Image 1', from: '#3b82f6', to: '#8b5cf6' },
  { title: 'Image 2', from: '#10b981', to: '#3b82f6' },
  { title: 'Image 3', from: '#f59e0b', to: '#ef4444' },
  { title: 'Image 4', from: '#ec4899', to: '#8b5cf6' },
  { title: 'Image 5', from: '#06b6d4', to: '#10b981' }
]
</script>

<style scoped>
/* Note: Install embla-carousel-vue for full carousel functionality */
/* npm install embla-carousel-vue */
</style>
