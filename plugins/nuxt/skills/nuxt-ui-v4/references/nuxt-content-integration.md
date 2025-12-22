# Nuxt Content Integration - Nuxt UI v4

Complete guide for integrating Nuxt Content with Nuxt UI v4 for content-driven websites, documentation sites, and blogs.

---

## Overview

Nuxt UI v4 provides first-class integration with **@nuxt/content** for building content-rich applications with beautiful typography and navigation.

**Key Features:**
- **Prose Components**: Styled components for Markdown rendering
- **UContent Component**: Main content renderer
- **ContentNavigation**: Structured navigation for documentation
- **MDC Support**: Markdown Components for enhanced content
- **Syntax Highlighting**: Beautiful code blocks with Shiki
- **Typography**: Optimized heading, paragraph, list, and table styles

---

## Installation

```bash
bun add @nuxt/content
```

### Configuration

**nuxt.config.ts:**
```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/content'],

  content: {
    documentDriven: true,
    highlight: {
      theme: {
        default: 'github-light',
        dark: 'github-dark'
      },
      langs: ['typescript', 'javascript', 'vue', 'css', 'json', 'bash']
    },
    markdown: {
      toc: {
        depth: 3,
        searchDepth: 3
      }
    }
  },

  // Enable Prose components
  ui: {
    content: true
  }
})
```

---

## Project Structure

```
content/
├── index.md              # Homepage
├── docs/
│   ├── index.md          # Docs landing
│   ├── getting-started/
│   │   ├── installation.md
│   │   └── configuration.md
│   └── api/
│       ├── components.md
│       └── composables.md
└── blog/
    ├── 2025-01-01-post-1.md
    └── 2025-01-05-post-2.md
```

---

## Frontmatter

Add metadata to Markdown files:

```markdown
---
title: Getting Started
description: Learn how to install and configure our library
image: /images/og-getting-started.png
publishedAt: 2025-01-09
authors:
  - name: John Doe
    avatar: /avatars/john.jpg
tags:
  - documentation
  - tutorial
navigation:
  title: Installation
  order: 1
---

# Getting Started

Your content here...
```

---

## UContent Component

The **UContent** component renders parsed Markdown content with Prose styling:

```vue
<template>
  <UContainer>
    <UContent :body="page.body" />
  </UContainer>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
```

### Full Documentation Page Template

```vue
<template>
  <UContainer>
    <UPage>
      <!-- Header -->
      <template #header>
        <UPageHeader
          :title="page.title"
          :description="page.description"
        />
      </template>

      <!-- Main content -->
      <UPageBody>
        <UContent :body="page.body" />
      </UPageBody>

      <!-- Table of Contents -->
      <template #aside>
        <UNavigationTree
          :links="page.toc.links"
          :active-id="activeId"
        />
      </template>
    </UPage>
  </UContainer>
</template>

<script setup lang="ts">
const { page } = useContent()

// Track active heading for TOC
const activeId = ref<string>()

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeId.value = entry.target.id
      }
    })
  })

  document.querySelectorAll('h2, h3').forEach((heading) => {
    observer.observe(heading)
  })
})
</script>
```

---

## Prose Components

Prose components automatically style Markdown elements.

### Typography Elements

**Headings:**
```markdown
# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
```

Rendered with:
- Consistent font sizes
- Proper spacing
- Anchor links (clickable hash links)
- Dark mode support

**Paragraphs:**
```markdown
Regular paragraph text with proper line height and spacing.

Another paragraph with **bold**, *italic*, and `code` formatting.
```

**Lists:**
```markdown
- Unordered list item
- Another item
  - Nested item
  - Another nested

1. Ordered list item
2. Second item
3. Third item
```

**Blockquotes:**
```markdown
> This is a blockquote with beautiful styling.
> Multiple lines are supported.
```

**Tables:**
```markdown
| Feature | Nuxt UI v3 | Nuxt UI v4 |
|---------|------------|------------|
| Components | 40 | 52 |
| Tailwind | v3 | v4 |
| Performance | Good | Excellent |
```

---

## Code Blocks

### Syntax Highlighting

Code blocks are automatically highlighted with Shiki:

````markdown
```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/content']
})
```
````

Renders with:
- Syntax highlighting
- Line numbers (optional)
- Copy button
- Language label
- Dark mode support

### Filename and Meta

````markdown
```typescript [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxt/ui']
})
```
````

### Highlighted Lines

````markdown
```typescript {2,4-6}
export default defineNuxtConfig({
  modules: ['@nuxt/ui'], // highlighted
  content: {
    highlight: { // lines 4-6 highlighted
      theme: 'github-dark'
    }
  }
})
```
````

---

## ContentNavigation Component

Build multi-level navigation for documentation:

```vue
<template>
  <UNavigationTree :links="navigation" />
</template>

<script setup lang="ts">
const { data: navigation } = await useAsyncData('navigation', () =>
  fetchContentNavigation()
)
</script>
```

### With Collapsible Sections

```vue
<template>
  <UNavigationTree
    :links="navigation"
    :multiple="false"
    :default-open="true"
  />
</template>

<script setup lang="ts">
const { data: navigation } = await useAsyncData('navigation', () =>
  queryContent('/docs')
    .where({ _extension: 'md' })
    .only(['title', 'description', '_path', 'navigation'])
    .find()
)

// Transform to navigation structure
const formattedNavigation = computed(() => {
  return navigation.value?.map(item => ({
    label: item.navigation?.title || item.title,
    to: item._path,
    children: [] // Add children logic if needed
  }))
})
</script>
```

---

## MDC (Markdown Components)

Use Vue components inside Markdown:

### Enable MDC

Already enabled with `ui: { content: true }` in config.

### Using Components in Markdown

**content/docs/example.md:**
```markdown
# Documentation

::UAlert{type="info"}
This is an alert component inside Markdown!
::

::UCard
#header
Card Header

#default
Card body content with **Markdown** support.

#footer
Card footer
::
```

### Custom MDC Components

**components/content/MyCallout.vue:**
```vue
<template>
  <UCard :ui="{ body: 'prose' }">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon :name="icon" />
        <span class="font-semibold">{{ title }}</span>
      </div>
    </template>

    <ContentSlot :use="$slots.default" />
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  icon?: string
}>()
</script>
```

**Usage in Markdown:**
```markdown
::MyCallout{title="Important" icon="i-lucide-info"}
This is custom callout content with **Markdown** support.
::
```

---

## Standalone Prose (Without @nuxt/content)

Use Prose components without installing @nuxt/content:

### Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  ui: {
    mdc: true  // Enables Prose components standalone
  }
})
```

### Usage with MDC Component

```vue
<template>
  <MDC :value="markdownContent" class="prose" />
</template>

<script setup lang="ts">
const markdownContent = ref(`
# Heading

This is **bold** and *italic* text.

- List item 1
- List item 2

\`\`\`typescript
const greeting = 'Hello World'
\`\`\`
`)
</script>
```

---

## Blog Integration

### Blog List Page

```vue
<template>
  <UContainer>
    <UPageHeader
      title="Blog"
      description="Latest articles and updates"
    />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      <UCard
        v-for="post in posts"
        :key="post._path"
        :to="post._path"
      >
        <template #header>
          <img
            v-if="post.image"
            :src="post.image"
            :alt="post.title"
            class="aspect-video object-cover rounded-t-lg"
          />
        </template>

        <h3 class="text-xl font-semibold mb-2">
          {{ post.title }}
        </h3>

        <p class="text-muted mb-4">
          {{ post.description }}
        </p>

        <div class="flex items-center gap-4 text-sm text-dimmed">
          <time :datetime="post.publishedAt">
            {{ formatDate(post.publishedAt) }}
          </time>

          <div class="flex gap-2">
            <UBadge
              v-for="tag in post.tags"
              :key="tag"
              variant="subtle"
            >
              {{ tag }}
            </UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const { data: posts } = await useAsyncData('blog-posts', () =>
  queryContent('/blog')
    .sort({ publishedAt: -1 })
    .find()
)

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
```

### Blog Post Page

```vue
<template>
  <UContainer>
    <UPage>
      <!-- Header -->
      <template #header>
        <UPageHeader :title="page.title">
          <template #description>
            <div class="flex items-center gap-4 text-sm text-dimmed">
              <time :datetime="page.publishedAt">
                {{ formatDate(page.publishedAt) }}
              </time>
              <span>·</span>
              <span>{{ readingTime }} min read</span>
            </div>
          </template>
        </UPageHeader>

        <!-- Featured image -->
        <img
          v-if="page.image"
          :src="page.image"
          :alt="page.title"
          class="w-full aspect-video object-cover rounded-lg mt-6"
        />

        <!-- Authors -->
        <div class="flex items-center gap-4 mt-6">
          <UAvatarGroup
            :items="page.authors"
            size="md"
          />
          <div>
            <div class="font-medium">
              {{ page.authors.map(a => a.name).join(', ') }}
            </div>
            <div class="text-sm text-dimmed">Authors</div>
          </div>
        </div>
      </template>

      <!-- Content -->
      <UPageBody>
        <UContent :body="page.body" />
      </UPageBody>

      <!-- Aside: Share + TOC -->
      <template #aside>
        <div class="sticky top-20 space-y-6">
          <!-- Share buttons -->
          <UCard>
            <div class="space-y-2">
              <h4 class="font-semibold">Share</h4>
              <div class="flex gap-2">
                <UButton
                  icon="i-simple-icons-twitter"
                  :to="shareOnTwitter"
                  target="_blank"
                  variant="ghost"
                  size="sm"
                />
                <UButton
                  icon="i-simple-icons-linkedin"
                  :to="shareOnLinkedIn"
                  target="_blank"
                  variant="ghost"
                  size="sm"
                />
              </div>
            </div>
          </UCard>

          <!-- Table of contents -->
          <UNavigationTree
            v-if="page.toc?.links?.length"
            :links="page.toc.links"
            title="On this page"
          />
        </div>
      </template>
    </UPage>
  </UContainer>
</template>

<script setup lang="ts">
const { page } = useContent()

const readingTime = computed(() => {
  const wordsPerMinute = 200
  const words = page.value.body?.children
    ?.map((node: any) => node.value || '')
    .join(' ')
    .split(/\s+/).length || 0
  return Math.ceil(words / wordsPerMinute)
})

const shareOnTwitter = computed(() =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(page.value.title)}&url=${window.location.href}`
)

const shareOnLinkedIn = computed(() =>
  `https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`
)

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
```

---

## Search Integration

Add search to your documentation:

```vue
<template>
  <UCommandPalette
    v-model:open="isOpen"
    :groups="searchGroups"
    @select="onSelect"
  >
    <template #leading>
      <UIcon name="i-lucide-search" />
    </template>
  </UCommandPalette>
</template>

<script setup lang="ts">
import Fuse from 'fuse.js'

const isOpen = ref(false)
const query = ref('')

const { data: content } = await useAsyncData('search-content', () =>
  queryContent()
    .only(['title', 'description', '_path'])
    .find()
)

const fuse = computed(() => new Fuse(content.value || [], {
  keys: ['title', 'description'],
  threshold: 0.3
}))

const searchResults = computed(() => {
  if (!query.value) return content.value?.slice(0, 10) || []
  return fuse.value.search(query.value).map(result => result.item)
})

const searchGroups = computed(() => [{
  label: 'Pages',
  items: searchResults.value.map(item => ({
    label: item.title,
    description: item.description,
    to: item._path
  }))
}])

const onSelect = (item: any) => {
  navigateTo(item.to)
  isOpen.value = false
}

// Open with Cmd+K / Ctrl+K
defineShortcuts({
  'meta_k': () => isOpen.value = true,
  'ctrl_k': () => isOpen.value = true
})
</script>
```

---

## Custom Prose Styling

Override Prose component styles:

**app.config.ts:**
```typescript
export default defineAppConfig({
  ui: {
    prose: {
      h1: {
        class: 'text-4xl font-bold mb-6'
      },
      h2: {
        class: 'text-3xl font-semibold mt-12 mb-4'
      },
      a: {
        class: 'text-primary hover:underline'
      },
      code: {
        class: 'bg-elevated px-1.5 py-0.5 rounded text-sm'
      },
      pre: {
        class: 'bg-elevated rounded-lg p-4 overflow-x-auto'
      }
    }
  }
})
```

---

## Best Practices

### 1. Document-Driven Mode

Enable for automatic page generation:

```typescript
// nuxt.config.ts
content: {
  documentDriven: true
}
```

With this enabled:
- `content/index.md` → `/`
- `content/about.md` → `/about`
- `content/docs/guide.md` → `/docs/guide`

### 2. Use Frontmatter for Navigation

```markdown
---
navigation:
  title: Quick Start
  order: 1
  icon: i-lucide-rocket
---
```

### 3. Add Reading Time

Show estimated reading time for blog posts:

```vue
<script setup lang="ts">
const readingTime = computed(() => {
  const wordsPerMinute = 200
  const wordCount = page.value.body?.children
    ?.map((n: any) => n.value || '').join(' ')
    .split(/\s+/).length || 0
  return Math.ceil(wordCount / wordsPerMinute)
})
</script>
```

### 4. Optimize Images

Use Nuxt Image for automatic optimization:

```markdown
![Alt text](/images/hero.jpg){width="1200" height="630"}
```

### 5. Create Component Wrappers

Wrap Prose in containers for better layout:

```vue
<template>
  <UContainer class="prose-container">
    <UContent :body="page.body" />
  </UContainer>
</template>

<style>
.prose-container {
  @apply max-w-3xl mx-auto py-12;
}
</style>
```

---

## Troubleshooting

### Content Not Rendering

**Problem:** UContent shows nothing.

**Solution:** Ensure `ui: { content: true }` in nuxt.config.ts:
```typescript
ui: {
  content: true
}
```

### Code Blocks Not Highlighted

**Problem:** Code blocks show plain text.

**Solution:** Configure highlight theme:
```typescript
content: {
  highlight: {
    theme: 'github-dark'
  }
}
```

### Navigation Links Broken

**Problem:** ContentNavigation links don't match routes.

**Solution:** Ensure `_path` matches your routing structure. Use `queryContent()` to verify paths.

---

## Resources

- **Nuxt Content Docs**: https://content.nuxt.com/
- **Prose Components**: https://ui.nuxt.com/components/content
- **MDC Syntax**: https://content.nuxt.com/usage/markdown
- **Shiki Themes**: https://shiki.style/themes

---

**Last Updated**: 2025-01-09
**Nuxt UI Version**: 4.0.0
**@nuxt/content Version**: 3.0.0+
