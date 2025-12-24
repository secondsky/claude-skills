// Documentation Collection Setup Example
// Complete configuration for documentation site with Nuxt Content

import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: 'docs/**/*.md',
      schema: z.object({
        // Required fields
        title: z.string(),
        description: z.string(),

        // Organization
        category: z.string(),
        order: z.number().optional(),

        // UI metadata
        badge: z.string().optional(),  // "New", "Beta", "Deprecated"
        icon: z.string().optional(),   // Icon identifier

        // Versioning
        version: z.string().optional(),
        lastUpdated: z.date().optional(),

        // Navigation control
        navigation: z.boolean().default(true),

        // Related docs
        related: z.array(z.string()).optional()
      })
    })
  }
})

/*
File Structure with Numeric Prefixes:
======================================

content/
  docs/
    .navigation.yml
    01-getting-started/
      .navigation.yml
      01-installation.md
      02-configuration.md
      03-first-steps.md
    02-guides/
      .navigation.yml
      01-basics.md
      02-advanced.md
      03-best-practices.md
    03-api/
      01-overview.md
      02-collections.md
      03-queries.md

Navigation Metadata (.navigation.yml):
=======================================

# content/docs/.navigation.yml
title: Documentation
icon: i-lucide-book
badge: v3

# content/docs/01-getting-started/.navigation.yml
title: Getting Started
icon: i-lucide-square-play
description: Learn the basics


Example Doc Page (content/docs/01-getting-started/01-installation.md):
======================================================================

---
title: Installation
description: Install and set up Nuxt Content v3
category: getting-started
order: 1
badge: New
icon: i-lucide-download
lastUpdated: 2024-01-15
related: ['/docs/getting-started/configuration', '/docs/getting-started/first-steps']
---

# Installation

Install Nuxt Content v3...

[Content continues...]

Query Examples:
===============

// Get navigation tree
const navigation = await queryCollectionNavigation('docs')

// Get page by path
const page = await queryCollection('docs')
  .path(route.path)
  .first()

// Get all docs in category
const gettingStarted = await queryCollection('docs')
  .where('category', '=', 'getting-started')
  .order('order', 'ASC')
  .all()

// Get latest updated docs
const recentlyUpdated = await queryCollection('docs')
  .where('lastUpdated', 'IS NOT NULL')
  .order('lastUpdated', 'DESC')
  .limit(5)
  .all()

Navigation Utilities:
=====================

import {
  findPageHeadline,
  findPageBreadcrumb,
  findPageChildren,
  findPageSiblings
} from '@nuxt/content/utils'

// Get section title
const headline = findPageHeadline(navigation, '/docs/getting-started/installation')

// Build breadcrumbs
const breadcrumb = findPageBreadcrumb(navigation, route.path, {
  current: true
})

// Get child pages
const children = findPageChildren(navigation, '/docs/getting-started')

// Get sibling pages (prev/next)
const siblings = findPageSiblings(navigation, route.path)

Component Example (pages/docs/[...slug].vue):
==============================================

<script setup>
import { findPageBreadcrumb, findPageSiblings } from '@nuxt/content/utils'

const route = useRoute()

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('docs').path(route.path).first()
)

const { data: navigation } = await useAsyncData('docs-nav', () =>
  queryCollectionNavigation('docs')
)

const breadcrumb = computed(() =>
  findPageBreadcrumb(navigation.value, route.path)
)

const siblings = computed(() =>
  findPageSiblings(navigation.value, route.path)
)

const prev = computed(() => {
  const index = siblings.value?.findIndex(s => s._path === route.path)
  return index > 0 ? siblings.value[index - 1] : null
})

const next = computed(() => {
  const index = siblings.value?.findIndex(s => s._path === route.path)
  return index < siblings.value.length - 1 ? siblings.value[index + 1] : null
})

useHead({
  title: page.value.title,
  meta: [
    { name: 'description', content: page.value.description }
  ]
})
</script>

<template>
  <div class="docs-layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <nav>
        <!-- Render navigation tree -->
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="content">
      <!-- Breadcrumbs -->
      <nav class="breadcrumb">
        <NuxtLink
          v-for="(item, index) in breadcrumb"
          :key="item._path"
          :to="item._path"
        >
          {{ item.title }}
          <span v-if="index < breadcrumb.length - 1">/</span>
        </NuxtLink>
      </nav>

      <!-- Page Title & Badge -->
      <header>
        <h1>
          {{ page.title }}
          <span v-if="page.badge" class="badge">{{ page.badge }}</span>
        </h1>
        <p>{{ page.description }}</p>
      </header>

      <!-- Content -->
      <ContentRenderer :value="page" />

      <!-- Prev/Next Navigation -->
      <nav class="page-nav">
        <NuxtLink v-if="prev" :to="prev._path">
          ← {{ prev.title }}
        </NuxtLink>
        <NuxtLink v-if="next" :to="next._path">
          {{ next.title }} →
        </NuxtLink>
      </nav>
    </main>

    <!-- Table of Contents (optional) -->
    <aside class="toc">
      <!-- TOC component -->
    </aside>
  </div>
</template>

Layout Example (layouts/docs.vue):
===================================

<script setup>
const { data: navigation } = await useAsyncData('docs-nav', () =>
  queryCollectionNavigation('docs')
)
</script>

<template>
  <div class="docs-layout">
    <Header />

    <div class="container">
      <Sidebar :navigation="navigation" />
      <main>
        <slot />
      </main>
    </div>

    <Footer />
  </div>
</template>

*/
