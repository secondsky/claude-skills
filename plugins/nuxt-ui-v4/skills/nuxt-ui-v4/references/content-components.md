# Content Components Reference

Nuxt UI v4 provides components for documentation sites and blogs.

## Component Overview

| Component | Purpose |
|-----------|---------|
| BlogPost | Article display |
| BlogPosts | Blog grid |
| ChangelogVersion | Version entry |
| ChangelogVersions | Version timeline |
| ContentNavigation | Doc navigation |
| ContentSearch | Doc search |
| ContentSearchButton | Search button |
| ContentSurround | Prev/next links |
| ContentToc | Table of contents |

## Blog Components

### BlogPost

Individual blog post display.

```ts
interface BlogPostProps {
  title: string
  description?: string
  date?: string | Date
  image?: string
  badge?: BadgeProps
  authors?: Author[]
  to?: string
  orientation?: 'horizontal' | 'vertical'
}

interface Author {
  name: string
  avatar?: string
  to?: string
}
```

```vue
<UBlogPost
  title="Introducing Nuxt UI v4"
  description="The biggest update yet with 125+ components"
  date="2024-11-15"
  image="/blog/nuxt-ui-v4.png"
  :badge="{ label: 'Release', color: 'primary' }"
  :authors="[
    { name: 'John Doe', avatar: '/avatars/john.jpg' }
  ]"
  to="/blog/nuxt-ui-v4"
/>
```

### BlogPosts

Grid layout for blog posts.

```vue
<script setup>
const posts = await queryContent('/blog').find()
</script>

<template>
  <UBlogPosts>
    <UBlogPost
      v-for="post in posts"
      :key="post._path"
      :title="post.title"
      :description="post.description"
      :date="post.date"
      :image="post.image"
      :authors="post.authors"
      :to="post._path"
    />
  </UBlogPosts>
</template>
```

## Changelog Components

### ChangelogVersion

Single version entry.

```ts
interface ChangelogVersionProps {
  title: string
  date?: string | Date
  icon?: string
  badge?: BadgeProps
  to?: string
}
```

```vue
<UChangelogVersion
  title="v4.2.0"
  date="2024-11-20"
  icon="i-heroicons-rocket-launch"
  :badge="{ label: 'Latest', color: 'success' }"
>
  <h3>New Features</h3>
  <ul>
    <li>InputDate component</li>
    <li>InputTime component</li>
    <li>Empty state component</li>
  </ul>

  <h3>Bug Fixes</h3>
  <ul>
    <li>Fixed modal focus trap</li>
    <li>Fixed table virtualization</li>
  </ul>
</UChangelogVersion>
```

### ChangelogVersions

Timeline of versions.

```vue
<script setup>
const versions = [
  {
    title: 'v4.2.0',
    date: '2024-11-20',
    badge: { label: 'Latest', color: 'success' },
    content: '...'
  },
  {
    title: 'v4.1.0',
    date: '2024-10-15',
    content: '...'
  }
]
</script>

<template>
  <UChangelogVersions>
    <UChangelogVersion
      v-for="version in versions"
      :key="version.title"
      v-bind="version"
    >
      <MDC :value="version.content" />
    </UChangelogVersion>
  </UChangelogVersions>
</template>
```

## Documentation Components

### ContentNavigation

Accordion-style documentation navigation.

```ts
interface ContentNavigationProps {
  items: NavigationItem[]
  defaultOpen?: boolean
  multiple?: boolean          // Allow multiple open
}

interface NavigationItem {
  label: string
  icon?: string
  to?: string
  children?: NavigationItem[]
  defaultOpen?: boolean
}
```

```vue
<script setup>
const navigation = [
  {
    label: 'Getting Started',
    icon: 'i-heroicons-home',
    defaultOpen: true,
    children: [
      { label: 'Introduction', to: '/docs' },
      { label: 'Installation', to: '/docs/installation' },
      { label: 'Configuration', to: '/docs/configuration' }
    ]
  },
  {
    label: 'Components',
    icon: 'i-heroicons-cube',
    children: [
      { label: 'Button', to: '/docs/components/button' },
      { label: 'Card', to: '/docs/components/card' }
    ]
  }
]
</script>

<template>
  <UContentNavigation :items="navigation" />
</template>
```

### ContentSearch

CommandPalette for documentation search.

```vue
<script setup>
const searchGroups = computed(() => [
  {
    key: 'pages',
    label: 'Pages',
    commands: pages.value.map(page => ({
      id: page._path,
      label: page.title,
      to: page._path
    }))
  }
])
</script>

<template>
  <UContentSearch :groups="searchGroups" />
</template>
```

### ContentSearchButton

Button to trigger search.

```vue
<UContentSearchButton />

<!-- With custom styling -->
<UContentSearchButton class="w-full">
  <template #default>
    <span>Search documentation...</span>
    <UKbd>⌘K</UKbd>
  </template>
</UContentSearchButton>
```

### ContentToc

Sticky table of contents with active link highlighting.

```ts
interface ContentTocProps {
  links: TocLink[]
  title?: string
}

interface TocLink {
  id: string
  text: string
  depth: number
  children?: TocLink[]
}
```

```vue
<script setup>
// With @nuxt/content
const { data: page } = await useAsyncData('page', () => {
  return queryContent(route.path).findOne()
})
</script>

<template>
  <UContentToc :links="page?.body?.toc?.links" title="On this page" />
</template>
```

### ContentSurround

Previous/next navigation links.

```vue
<script setup>
const { data: surround } = await useAsyncData('surround', () => {
  return queryContent()
    .only(['_path', 'title', 'description'])
    .findSurround(route.path)
})
</script>

<template>
  <UContentSurround :surround="surround" />
</template>
```

## Documentation Layout

Complete documentation page layout:

```vue
<!-- layouts/docs.vue -->
<template>
  <UPage>
    <template #left>
      <UPageAside>
        <UContentSearchButton class="mb-4" />
        <UContentNavigation :items="navigation" />
      </UPageAside>
    </template>

    <UPageBody>
      <UPageHeader
        :title="page?.title"
        :description="page?.description"
      />

      <slot />

      <UContentSurround :surround="surround" />
    </UPageBody>

    <template #right>
      <UPageAside>
        <UContentToc :links="page?.body?.toc?.links" />
      </UPageAside>
    </template>
  </UPage>

  <UContentSearch :groups="searchGroups" />
</template>
```

## Blog Layout

Complete blog index:

```vue
<!-- pages/blog/index.vue -->
<template>
  <UPage>
    <UPageHeader
      title="Blog"
      description="Latest news and updates"
    />

    <UBlogPosts>
      <UBlogPost
        v-for="post in posts"
        :key="post._path"
        v-bind="post"
        :to="post._path"
      />
    </UBlogPosts>

    <UPagination
      v-model="page"
      :total="total"
      :per-page="10"
    />
  </UPage>
</template>
```

## Theming

```ts
export default defineAppConfig({
  ui: {
    blogPost: {
      slots: {
        root: 'group flex flex-col',
        image: 'aspect-video rounded-lg overflow-hidden',
        body: 'flex-1 flex flex-col',
        title: 'text-xl font-semibold group-hover:text-primary',
        description: 'text-muted mt-2'
      }
    },
    contentNavigation: {
      slots: {
        root: 'space-y-1',
        item: 'flex items-center gap-2 px-3 py-2 rounded-lg',
        itemActive: 'bg-primary/10 text-primary'
      }
    },
    contentToc: {
      slots: {
        root: 'space-y-2',
        link: 'block text-sm text-muted hover:text-default',
        linkActive: 'text-primary font-medium'
      }
    }
  }
})
```

## Nuxt Content Integration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/content'],

  content: {
    highlight: {
      theme: 'github-dark'
    }
  }
})
```

With `@nuxt/content`, you get automatic:
- Markdown processing with MDC
- Syntax highlighting
- Table of contents generation
- Navigation from file structure
- Search indexing
