# MDX Components Guide

Complete guide to using MDX with React components in Content Collections.

---

## Setup MDX

### 1. Install Dependencies

```bash
pnpm add -D @content-collections/mdx shiki
```

### 2. Configure Collection

```typescript
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod";

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.mdx",
  schema: z.object({
    title: z.string(),
    content: z.string(),
  }),
  transform: async (post) => {
    const mdx = await compileMDX(post.content, {
      syntaxHighlighter: "shiki",
      shikiOptions: {
        theme: "github-dark",
      },
    });

    return {
      ...post,
      mdx, // Compiled MDX code
    };
  },
});
```

---

## Rendering MDX

### Basic Rendering

```tsx
import { MDXContent } from "@content-collections/mdx/react";

export function BlogPost({ post }: { post: { mdx: string } }) {
  return (
    <article>
      <MDXContent code={post.mdx} />
    </article>
  );
}
```

---

## Custom Components

### Mapping Standard Elements

```tsx
import { MDXContent } from "@content-collections/mdx/react";

const components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mb-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-semibold mb-3 mt-8">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl font-semibold mb-2 mt-6">{children}</h3>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
      {children}
    </p>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-blue-600 hover:underline"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Code
  code: ({ children, className }) => {
    // Inline code
    if (!className) {
      return (
        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    }

    // Block code (handled by Shiki)
    return <code className={className}>{children}</code>;
  },

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-gray-200 dark:border-gray-700">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2">{children}</td>,

  // Horizontal rule
  hr: () => <hr className="my-8 border-gray-300 dark:border-gray-700" />,

  // Images
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt}
      className="rounded-lg my-6 w-full"
      loading="lazy"
    />
  ),
};

export function BlogPost({ post }) {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <MDXContent code={post.mdx} components={components} />
    </article>
  );
}
```

---

## Custom MDX Components

### Callout Component

```tsx
// components/Callout.tsx
export function Callout({ type = "info", children }: {
  type?: "info" | "warning" | "error" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-blue-50 border-blue-500 text-blue-900",
    warning: "bg-yellow-50 border-yellow-500 text-yellow-900",
    error: "bg-red-50 border-red-500 text-red-900",
    success: "bg-green-50 border-green-500 text-green-900",
  };

  return (
    <div className={`border-l-4 p-4 my-4 ${styles[type]}`}>
      {children}
    </div>
  );
}
```

**Use in MDX**:
```mdx
<Callout type="warning">
This is an important warning!
</Callout>
```

---

### Code Block with Copy Button

```tsx
// components/CodeBlock.tsx
"use client";

import { useState } from "react";

export function CodeBlock({ children, className }: {
  children: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={copyCode}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white px-3 py-1 rounded text-sm"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className={className}>
        <code>{children}</code>
      </pre>
    </div>
  );
}
```

**Map in components**:
```tsx
const components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
};
```

---

### YouTube Embed

```tsx
// components/YouTube.tsx
export function YouTube({ id }: { id: string }) {
  return (
    <div className="aspect-video my-6">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-lg"
      />
    </div>
  );
}
```

**Use in MDX**:
```mdx
<YouTube id="dQw4w9WgXcQ" />
```

---

### Table of Contents

```tsx
// components/TOC.tsx
export function TableOfContents({ headings }: {
  headings: Array<{ level: number; text: string; slug: string }>;
}) {
  return (
    <nav className="border-l-2 border-gray-300 pl-4 my-8">
      <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li
            key={heading.slug}
            style={{ marginLeft: `${(heading.level - 1) * 1}rem` }}
          >
            <a
              href={`#${heading.slug}`}
              className="text-blue-600 hover:underline"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

---

## Syntax Highlighting with Shiki

### Basic Configuration

```typescript
transform: async (post) => {
  const mdx = await compileMDX(post.content, {
    syntaxHighlighter: "shiki",
    shikiOptions: {
      theme: "github-dark", // or "github-light", "nord", "dracula"
    },
  });

  return { ...post, mdx };
}
```

### Dual Theme (Light/Dark)

```typescript
transform: async (post) => {
  const mdx = await compileMDX(post.content, {
    syntaxHighlighter: "shiki",
    shikiOptions: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
  });

  return { ...post, mdx };
}
```

### Custom Language Aliases

```typescript
shikiOptions: {
  theme: "github-dark",
  langs: [
    {
      id: "bash",
      scopeName: "source.shell",
      aliases: ["sh", "shell"],
    },
  ],
}
```

---

## Remark/Rehype Plugins

### Add Plugins

```typescript
import remarkGfm from "remark-gfm"; // GitHub Flavored Markdown
import rehypeSlug from "rehype-slug"; // Add IDs to headings
import rehypeAutolinkHeadings from "rehype-autolink-headings"; // Link headings

transform: async (post) => {
  const mdx = await compileMDX(post.content, {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
    ],
  });

  return { ...post, mdx };
}
```

### Popular Plugins

- **remark-gfm**: Tables, strikethrough, task lists
- **remark-math**: Math equations (LaTeX)
- **remark-toc**: Table of contents
- **rehype-slug**: Heading IDs
- **rehype-autolink-headings**: Link headings
- **rehype-prism**: Syntax highlighting (alternative to Shiki)

---

## Importing Components in MDX

### Method 1: Global Components Prop

```tsx
import { Callout } from "@/components/Callout";
import { YouTube } from "@/components/YouTube";

const components = {
  Callout,
  YouTube,
  // ... standard elements
};

<MDXContent code={post.mdx} components={components} />
```

### Method 2: Import in MDX (Not Recommended)

MDX imports with custom path aliases don't work. Use relative paths:

```mdx
import { Callout } from "../../components/Callout"

<Callout type="info">
This works but path aliases (@/) don't!
</Callout>
```

---

## Complete Example

```tsx
// app/blog/[slug]/page.tsx
import { allPosts } from "content-collections";
import { MDXContent } from "@content-collections/mdx/react";
import { Callout } from "@/components/Callout";
import { YouTube } from "@/components/YouTube";

const components = {
  // Custom components
  Callout,
  YouTube,

  // Standard elements
  h1: ({ children }) => <h1 className="text-4xl font-bold mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-3xl font-semibold mb-3 mt-8">{children}</h2>,
  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener">
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    if (!className) {
      return <code className="bg-gray-100 px-1.5 py-0.5 rounded">{children}</code>;
    }
    return <code className={className}>{children}</code>;
  },
};

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = allPosts.find((p) => p.slug === params.slug);

  if (!post) return <div>Post not found</div>;

  return (
    <article className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-5xl font-bold mb-2">{post.title}</h1>
        <p className="text-gray-600">{post.date}</p>
      </header>

      <div className="prose dark:prose-invert max-w-none">
        <MDXContent code={post.mdx} components={components} />
      </div>
    </article>
  );
}
```

---

## Tailwind Prose Plugin

For pre-styled MDX content:

```bash
pnpm add -D @tailwindcss/typography
```

```typescript
// tailwind.config.ts
export default {
  plugins: [require("@tailwindcss/typography")],
};
```

```tsx
<div className="prose dark:prose-invert max-w-none">
  <MDXContent code={post.mdx} />
</div>
```

---

## Common Mistakes

❌ **Not awaiting compileMDX**
```typescript
transform: (post) => {
  const mdx = compileMDX(post.content); // ❌ Missing await
  return { ...post, mdx };
}
```

✅ **Always await**
```typescript
transform: async (post) => {
  const mdx = await compileMDX(post.content); // ✅
  return { ...post, mdx };
}
```

---

❌ **Using path aliases in MDX imports**
```mdx
import { Callout } from "@/components/Callout" // ❌ Won't work
```

✅ **Pass via components prop**
```tsx
const components = { Callout };
<MDXContent code={post.mdx} components={components} />
```

---

## Official Documentation

- **MDX**: https://mdxjs.com
- **Content Collections MDX**: https://www.content-collections.dev/docs/mdx
- **Shiki**: https://shiki.style
- **Remark Plugins**: https://github.com/remarkjs/remark/blob/main/doc/plugins.md
- **Rehype Plugins**: https://github.com/rehypejs/rehype/blob/main/doc/plugins.md
