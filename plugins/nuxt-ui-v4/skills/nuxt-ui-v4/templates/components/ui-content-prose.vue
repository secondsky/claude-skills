<template>
  <UContainer>
    <UPage>
      <!-- Page Header with Title and Meta -->
      <template #header>
        <UPageHeader
          :title="page.title"
          :description="page.description"
        >
          <template #description>
            <div class="flex flex-col gap-2 mt-2">
              <p class="text-muted">{{ page.description }}</p>

              <!-- Article metadata -->
              <div v-if="page.publishedAt" class="flex items-center gap-4 text-sm text-dimmed">
                <time :datetime="page.publishedAt">
                  {{ formatDate(page.publishedAt) }}
                </time>
                <span v-if="readingTime">·</span>
                <span v-if="readingTime">{{ readingTime }} min read</span>
                <span v-if="page.authors?.length">·</span>
                <span v-if="page.authors?.length">
                  {{ page.authors.map(a => a.name).join(', ') }}
                </span>
              </div>

              <!-- Tags -->
              <div v-if="page.tags?.length" class="flex gap-2 mt-2">
                <UBadge
                  v-for="tag in page.tags"
                  :key="tag"
                  variant="subtle"
                  size="sm"
                >
                  {{ tag }}
                </UBadge>
              </div>
            </div>
          </template>
        </UPageHeader>

        <!-- Featured Image -->
        <img
          v-if="page.image"
          :src="page.image"
          :alt="page.title"
          class="w-full aspect-video object-cover rounded-lg mt-6"
        />
      </template>

      <!-- Main Content with Prose Styling -->
      <UPageBody>
        <UContent :body="page.body" class="prose-container" />

        <!-- Navigation Links (Previous/Next) -->
        <nav
          v-if="prevPage || nextPage"
          class="flex items-center justify-between gap-4 mt-12 pt-6 border-t border-default"
        >
          <UButton
            v-if="prevPage"
            :to="prevPage._path"
            variant="ghost"
            leading-icon="i-lucide-arrow-left"
          >
            <div class="text-left">
              <div class="text-xs text-dimmed">Previous</div>
              <div class="font-medium">{{ prevPage.title }}</div>
            </div>
          </UButton>
          <div v-else />

          <UButton
            v-if="nextPage"
            :to="nextPage._path"
            variant="ghost"
            trailing-icon="i-lucide-arrow-right"
          >
            <div class="text-right">
              <div class="text-xs text-dimmed">Next</div>
              <div class="font-medium">{{ nextPage.title }}</div>
            </div>
          </UButton>
          <div v-else />
        </nav>
      </UPageBody>

      <!-- Sidebar: Table of Contents + Share -->
      <template #aside>
        <div class="sticky top-20 space-y-6">
          <!-- Share Section -->
          <UCard v-if="shareEnabled">
            <template #header>
              <h4 class="font-semibold text-sm">Share</h4>
            </template>

            <div class="flex flex-col gap-2">
              <UButton
                :to="shareOnTwitter"
                target="_blank"
                variant="ghost"
                size="sm"
                block
              >
                <template #leading>
                  <UIcon name="i-simple-icons-twitter" />
                </template>
                Share on Twitter
              </UButton>

              <UButton
                :to="shareOnLinkedIn"
                target="_blank"
                variant="ghost"
                size="sm"
                block
              >
                <template #leading>
                  <UIcon name="i-simple-icons-linkedin" />
                </template>
                Share on LinkedIn
              </UButton>

              <UButton
                @click="copyLink"
                variant="ghost"
                size="sm"
                block
              >
                <template #leading>
                  <UIcon name="i-lucide-link" />
                </template>
                {{ copied ? 'Copied!' : 'Copy Link' }}
              </UButton>
            </div>
          </UCard>

          <!-- Table of Contents -->
          <UCard v-if="page.toc?.links?.length">
            <template #header>
              <h4 class="font-semibold text-sm">On this page</h4>
            </template>

            <UNavigationTree
              :links="page.toc.links"
              :active-id="activeHeadingId"
            />
          </UCard>
        </div>
      </template>
    </UPage>
  </UContainer>
</template>

<script setup lang="ts">
// Props
interface Props {
  shareEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  shareEnabled: true
})

// Get current page content
const { page, prev: prevPage, next: nextPage } = useContent()

// Active heading tracking for TOC
const activeHeadingId = ref<string>()

onMounted(() => {
  // Track which heading is currently in view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeHeadingId.value = entry.target.id
        }
      })
    },
    {
      rootMargin: '-80px 0px -80% 0px'  // Trigger when heading is near top
    }
  )

  // Observe all headings
  document.querySelectorAll('h2, h3, h4').forEach((heading) => {
    if (heading.id) {
      observer.observe(heading)
    }
  })

  onUnmounted(() => observer.disconnect())
})

// Reading time calculation
const readingTime = computed(() => {
  if (!page.value?.body) return null

  const wordsPerMinute = 200
  const text = page.value.body.children
    ?.map((node: any) => node.value || '')
    .join(' ')

  const wordCount = text.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
})

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Share functionality
const shareOnTwitter = computed(() => {
  if (!process.client) return ''
  const text = encodeURIComponent(page.value.title || '')
  const url = encodeURIComponent(window.location.href)
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`
})

const shareOnLinkedIn = computed(() => {
  if (!process.client) return ''
  const url = encodeURIComponent(window.location.href)
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
})

// Copy link
const copied = ref(false)
const { copy } = useClipboard()

const copyLink = async () => {
  if (!process.client) return

  await copy(window.location.href)
  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<style scoped>
/* Prose container for optimal reading width */
.prose-container {
  @apply max-w-3xl;
}

/* Custom prose styling (optional overrides) */
.prose-container :deep(h2) {
  @apply scroll-mt-20;  /* Account for sticky header */
}

.prose-container :deep(h3) {
  @apply scroll-mt-20;
}

.prose-container :deep(h4) {
  @apply scroll-mt-20;
}

/* Add padding to code blocks */
.prose-container :deep(pre) {
  @apply my-6;
}

/* Table responsiveness */
.prose-container :deep(table) {
  @apply block overflow-x-auto;
}
</style>
