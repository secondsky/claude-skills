import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";

/**
 * Basic blog posts collection
 *
 * Directory: content/posts
 * Files: *.md
 * Schema: title, date, description, content
 */
const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.md",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    content: z.string(),
  }),
});

export default defineConfig({
  collections: [posts],
});
