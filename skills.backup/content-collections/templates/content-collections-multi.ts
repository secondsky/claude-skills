import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";

/**
 * Multi-collection setup with posts and docs
 *
 * Collections:
 * - posts: Blog posts with authors
 * - docs: Documentation pages with navigation
 */

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.md",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    author: z.string(),
    tags: z.array(z.string()).optional(),
    content: z.string(),
  }),
  transform: (post) => ({
    ...post,
    slug: post._meta.path.replace(/\.md$/, ""),
    readingTime: Math.ceil(post.content.split(/\s+/).length / 200),
  }),
});

const docs = defineCollection({
  name: "docs",
  directory: "content/docs",
  include: "**/*.md",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().optional(),
    category: z.string().optional(),
    content: z.string(),
  }),
  transform: (doc) => ({
    ...doc,
    slug: doc._meta.path.replace(/\.md$/, ""),
    path: doc._meta.path,
  }),
});

export default defineConfig({
  collections: [posts, docs],
});
