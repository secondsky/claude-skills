// Complete Nuxt Content Configuration Example
// Copy this to your project root as content.config.ts

import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    // Blog Collection
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        author: z.string(),
        tags: z.array(z.string()).default([]),
        image: z.string(),
        published: z.boolean().default(false),
        category: z.enum(['news', 'tutorial', 'update', 'announcement'])
      })
    }),

    // Documentation Collection
    docs: defineCollection({
      type: 'page',
      source: 'docs/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        category: z.string(),
        order: z.number().optional(),
        badge: z.string().optional(),
        icon: z.string().optional()
      })
    }),

    // Authors (Data Collection)
    authors: defineCollection({
      type: 'data',
      source: 'authors/*.yml',
      schema: z.object({
        name: z.string(),
        bio: z.string(),
        avatar: z.string(),
        email: z.string().email().optional(),
        social: z.object({
          github: z.string(),
          twitter: z.string().optional(),
          linkedin: z.string().optional(),
          website: z.string().url().optional()
        }).optional()
      })
    }),

    // Categories (Data Collection)
    categories: defineCollection({
      type: 'data',
      source: 'categories/*.json',
      schema: z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string(),
        color: z.string().optional()
      })
    })
  }
})
