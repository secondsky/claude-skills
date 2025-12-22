/**
 * Nuxt Content v3 - Blog Collection Setup Template
 * 
 * This template shows how to set up a complete blog with Nuxt Content v3,
 * including collections, schemas, queries, and deployment.
 */

// ===== 1. INSTALL DEPENDENCIES =====
// bun add @nuxt/content better-sqlite3 zod

// ===== 2. NUXT CONFIG =====
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  
  // Optional: Configure content
  content: {
    highlight: {
      theme: 'github-dark',
      langs: ['typescript', 'javascript', 'vue', 'css', 'bash']
    }
  }
})

// ===== 3. CONTENT CONFIG =====
// content.config.ts
import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    // Blog posts collection
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        author: z.string(),
        tags: z.array(z.string()).default([]),
        published: z.boolean().default(false),
        coverImage: z.string().optional()
      })
    }),

    // Authors data collection
    authors: defineCollection({
      type: 'data',
      source: 'authors/*.yml',
      schema: z.object({
        name: z.string(),
        bio: z.string(),
        avatar: z.string().url(),
        social: z.object({
          twitter: z.string().optional(),
          github: z.string().optional()
        }).optional()
      })
    })
  }
})

// ===== 4. CREATE CONTENT FILES =====

// content/blog/hello-world.md
/*
---
title: Hello World
description: My first blog post
date: 2024-01-15
author: john-doe
tags: ['nuxt', 'content']
published: true
---

# Hello World

This is my first blog post using Nuxt Content v3!

<!--more-->

## Features

- Type-safe queries
- MDC components
- Full-text search

\`\`\`typescript
const posts = await queryCollection('blog').all()
\`\`\`
*/

// content/authors/john-doe.yml
/*
name: John Doe
bio: Full-stack developer passionate about Nuxt
avatar: https://example.com/avatar.jpg
social:
  twitter: johndoe
  github: johndoe
*/

// ===== 5. QUERY PAGES =====

// pages/blog/index.vue
/*
<script setup lang="ts">
// Query all published posts, sorted by date
const { data: posts } = await useAsyncData('blog-posts', () =>
  queryCollection('blog')
    .where('published', '=', true)
    .sort('date', 'DESC')
    .all()
)
</script>

<template>
  <div>
    <h1>Blog</h1>
    <article v-for="post in posts" :key="post.path">
      <NuxtLink :to="post.path">
        <h2>{{ post.title }}</h2>
        <p>{{ post.description }}</p>
        <time>{{ new Date(post.date).toLocaleDateString() }}</time>
      </NuxtLink>
    </article>
  </div>
</template>
*/

// pages/blog/[...slug].vue
/*
<script setup lang="ts">
const route = useRoute()

// Query single post by path
const { data: post } = await useAsyncData(route.path, () =>
  queryCollection('blog').path(route.path).first()
)

// Handle 404
if (!post.value) {
  throw createError({ statusCode: 404, message: 'Post not found' })
}

// Optional: Query author data
const { data: author } = await useAsyncData(`author-${post.value.author}`, () =>
  queryCollection('authors').where('_id', '=', post.value.author).first()
)
</script>

<template>
  <article v-if="post">
    <header>
      <h1>{{ post.title }}</h1>
      <p>{{ post.description }}</p>
      <div>
        <time>{{ new Date(post.date).toLocaleDateString() }}</time>
        <span v-if="author"> by {{ author.name }}</span>
      </div>
      <div v-if="post.tags.length">
        <span v-for="tag in post.tags" :key="tag">#{{ tag }}</span>
      </div>
    </header>

    <ContentRenderer :value="post" />

    <footer v-if="author">
      <img :src="author.avatar" :alt="author.name" />
      <p>{{ author.bio }}</p>
    </footer>
  </article>
</template>
*/

// ===== 6. SEARCH PAGE =====

// pages/search.vue
/*
<script setup lang="ts">
import { ref } from 'vue'

const query = ref('')
const results = ref([])

async function search() {
  if (!query.value) {
    results.value = []
    return
  }

  // Full-text search
  results.value = await queryCollectionSearchSections('blog', query.value)
    .where('published', '=', true)
    .all()
}
</script>

<template>
  <div>
    <h1>Search Blog</h1>
    <input v-model="query" @input="search" placeholder="Search posts..." />

    <div v-if="results.length">
      <article v-for="result in results" :key="result.id">
        <NuxtLink :to="result.path">
          <h2>{{ result.title }}</h2>
          <p>{{ result.description }}</p>
        </NuxtLink>
      </article>
    </div>
  </div>
</template>
*/

// ===== 7. NAVIGATION =====

// pages/docs/index.vue
/*
<script setup lang="ts">
// Auto-generate navigation from content structure
const { data: navigation } = await useAsyncData('blog-navigation', () =>
  queryCollectionNavigation('blog')
    .where('published', '=', true)
    .all()
)
</script>

<template>
  <nav>
    <ul>
      <li v-for="item in navigation" :key="item.path">
        <NuxtLink :to="item.path">{{ item.title }}</NuxtLink>
        <ul v-if="item.children?.length">
          <li v-for="child in item.children" :key="child.path">
            <NuxtLink :to="child.path">{{ child.title }}</NuxtLink>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>
*/

// ===== 8. DEPLOYMENT TO CLOUDFLARE =====

// wrangler.toml
/*
name = "my-nuxt-blog"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"  # Must be exactly "DB"
database_name = "nuxt-content"
database_id = "your-d1-database-id"
*/

// Deploy commands:
/*
# Create D1 database
npx wrangler d1 create nuxt-content

# Build for Cloudflare
bun run build

# Deploy
npx wrangler pages deploy dist
*/

// ===== 9. SERVER API ROUTES =====

// server/api/posts/[slug].get.ts
/*
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  const post = await queryCollection('blog')
    .where('_id', '=', slug)
    .where('published', '=', true)
    .first()

  if (!post) {
    throw createError({ statusCode: 404, message: 'Post not found' })
  }

  return post
})
*/

// server/api/posts/index.get.ts
/*
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page || 1)
  const limit = 10

  const posts = await queryCollection('blog')
    .where('published', '=', true)
    .sort('date', 'DESC')
    .limit(limit)
    .offset((page - 1) * limit)
    .all()

  const total = await queryCollection('blog')
    .where('published', '=', true)
    .count()

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
})
*/

/**
 * Best Practices:
 * 
 * 1. Always define collections in content.config.ts
 * 2. Use Zod schemas for type safety
 * 3. Query only fields you need with .only()
 * 4. Use pagination for large collections
 * 5. Add <!--more--> in content for excerpts
 * 6. Specify language in code blocks for syntax highlighting
 * 7. Use ISO 8601 date format (YYYY-MM-DD)
 * 8. Place MDC components in components/content/
 * 9. Delete .nuxt directory when content structure changes
 * 10. For Cloudflare: D1 binding MUST be named "DB"
 */
