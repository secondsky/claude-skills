import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod";

/**
 * MDX integration with React components
 *
 * Features:
 * - MDX compilation with React support
 * - Syntax highlighting with Shiki
 * - Custom remark/rehype plugins
 * - Reading time calculation
 */

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.mdx",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    content: z.string(),
  }),
  transform: async (post) => {
    const mdx = await compileMDX(post.content, {
      // Syntax highlighting with Shiki
      syntaxHighlighter: "shiki",
      shikiOptions: {
        theme: "github-dark",
      },
      // Optional: Add remark/rehype plugins
      // remarkPlugins: [],
      // rehypePlugins: [],
    });

    return {
      ...post,
      mdx,
      slug: post._meta.path.replace(/\.mdx$/, ""),
      readingTime: Math.ceil(post.content.split(/\s+/).length / 200),
    };
  },
});

export default defineConfig({
  collections: [posts],
});
