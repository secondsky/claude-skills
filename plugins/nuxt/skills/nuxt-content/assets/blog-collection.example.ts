// Blog Collection Setup Example
// Complete configuration for a blog with Nuxt Content

import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        // Required fields
        title: z.string(),
        description: z.string(),
        date: z.date(),
        author: z.string(),

        // Optional fields with defaults
        published: z.boolean().default(false),
        featured: z.boolean().default(false),
        tags: z.array(z.string()).default([]),

        // Images
        image: z.string(),
        imageAlt: z.string().optional(),

        // Categories with enum
        category: z.enum([
          'news',
          'tutorial',
          'update',
          'announcement',
          'case-study'
        ]),

        // SEO fields
        seo: z.object({
          ogImage: z.string().optional(),
          ogDescription: z.string().optional(),
          keywords: z.array(z.string()).optional()
        }).optional(),

        // Reading time (auto-calculated or manual)
        readingTime: z.number().optional()
      })
    }),

    // Authors as separate collection
    authors: defineCollection({
      type: 'data',
      source: 'authors/*.yml',
      schema: z.object({
        name: z.string(),
        bio: z.string(),
        avatar: z.string(),
        role: z.string().optional(),
        social: z.object({
          github: z.string().optional(),
          twitter: z.string().optional(),
          linkedin: z.string().optional(),
          website: z.string().url().optional()
        }).optional()
      })
    })
  }
})

/*
File Structure:
===============

content/
  blog/
    2024-01-15-first-post.md
    2024-01-20-second-post.md
    2024-02-01-tutorial.md
  authors/
    john-doe.yml
    jane-smith.yml

Example Blog Post (content/blog/2024-01-15-first-post.md):
===========================================================

---
title: 'Getting Started with Nuxt Content'
description: 'Learn how to build a blog with Nuxt Content v3'
date: 2024-01-15
author: 'john-doe'
published: true
featured: true
tags: ['nuxt', 'content', 'tutorial']
image: '/images/blog/nuxt-content.jpg'
imageAlt: 'Nuxt Content logo'
category: 'tutorial'
seo:
  ogImage: '/images/blog/nuxt-content-og.jpg'
  keywords: ['nuxt', 'cms', 'markdown']
readingTime: 5
---

# Getting Started with Nuxt Content

Content goes here...

<!--more-->

Full article content after the excerpt...
---

Example Author (content/authors/john-doe.yml):
===============================================

name: John Doe
bio: Full-stack developer and technical writer
avatar: /images/authors/john-doe.jpg
role: Senior Developer
social:
  github: johndoe
  twitter: johndoe
  website: https://johndoe.com

Query Examples:
===============

// List all published posts
const posts = await queryCollection('blog')
  .where('published', '=', true)
  .select('path', 'title', 'description', 'date', 'author', 'image', 'category')
  .order('date', 'DESC')
  .all()

// Get featured posts
const featured = await queryCollection('blog')
  .where('featured', '=', true)
  .where('published', '=', true)
  .limit(3)
  .all()

// Filter by category
const tutorials = await queryCollection('blog')
  .where('category', '=', 'tutorial')
  .where('published', '=', true)
  .all()

// Search by tags
const nuxtPosts = await queryCollection('blog')
  .where('tags', 'IN', ['nuxt'])
  .all()

// Get post with author
const post = await queryCollection('blog')
  .path('/blog/first-post')
  .first()

const author = await queryCollection('authors')
  .where('id', '=', post.author)
  .first()

*/
