# Transform Function Cookbook

Common patterns for transforming documents in Content Collections.

Transform functions add computed properties, fetch external data, or process content at build time.

---

## Basic Transform Pattern

```typescript
const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.md",
  schema: z.object({
    title: z.string(),
    content: z.string(),
  }),
  transform: (post) => ({
    ...post, // Spread original fields
    // Add computed fields
    slug: post._meta.path.replace(/\.md$/, ""),
  }),
});
```

**Key points**:
- Always spread original document (`...post`)
- Return object with computed fields
- Has access to `post._meta` (filename, path, etc.)

---

## Reading Time Calculator

```typescript
transform: (post) => {
  const wordsPerMinute = 200;
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  return {
    ...post,
    wordCount,
    readingTime, // in minutes
  };
}
```

**Output**: `post.readingTime` → `5` (minutes)

---

## Slug Generation

### From Filename

```typescript
transform: (post) => ({
  ...post,
  slug: post._meta.path.replace(/\.mdx?$/, ""),
  // content/posts/my-post.md → "my-post"
})
```

### From Title

```typescript
transform: (post) => ({
  ...post,
  slug: post.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  // "My First Post!" → "my-first-post"
})
```

---

## Extract Date Components

```typescript
transform: (post) => {
  const date = new Date(post.date);

  return {
    ...post,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    formattedDate: date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}
```

**Output**:
- `post.year` → `2025`
- `post.formattedDate` → `"November 7, 2025"`

---

## Table of Contents Extraction

```typescript
transform: (post) => {
  // Extract headings from markdown
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(post.content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      slug: match[2]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-"),
    });
  }

  return {
    ...post,
    tableOfContents: headings,
  };
}
```

**Output**:
```typescript
post.tableOfContents = [
  { level: 1, text: "Introduction", slug: "introduction" },
  { level: 2, text: "Getting Started", slug: "getting-started" },
]
```

---

## Async Transforms (External Data)

### Fetch GitHub Stars

```typescript
transform: async (post) => {
  if (!post.githubRepo) {
    return { ...post, stars: 0 };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${post.githubRepo}`
    );
    const data = await response.json();

    return {
      ...post,
      stars: data.stargazers_count,
      forks: data.forks_count,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error(`Failed to fetch GitHub data for ${post.githubRepo}`, error);
    return { ...post, stars: 0 };
  }
}
```

**Note**: Must use `async` function for `await`.

---

## Excerpt Generation

```typescript
transform: (post) => {
  // Take first paragraph or 160 chars
  const excerpt = post.content
    .split("\n\n")[0] // First paragraph
    .replace(/^#+ /, "") // Remove heading
    .slice(0, 160) // Max 160 chars
    + (post.content.length > 160 ? "..." : "");

  return {
    ...post,
    excerpt,
  };
}
```

---

## Image Extraction

```typescript
transform: (post) => {
  // Find all image URLs in markdown
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const images = [];
  let match;

  while ((match = imageRegex.exec(post.content)) !== null) {
    images.push(match[1]);
  }

  return {
    ...post,
    images,
    coverImage: images[0] || null, // First image as cover
  };
}
```

---

## Related Posts (Collection Joining)

```typescript
const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.md",
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    content: z.string(),
  }),
  transform: (post, { posts }) => {
    // Find posts with matching tags
    const relatedPosts = posts
      .filter((p) => {
        // Not the same post
        if (p._meta.path === post._meta.path) return false;

        // Has at least one matching tag
        return post.tags.some((tag) => p.tags.includes(tag));
      })
      .slice(0, 3); // Top 3

    return {
      ...post,
      relatedPosts,
    };
  },
});
```

**Note**: Transform receives collections as second parameter.

---

## Multiple Collections Join

```typescript
const authors = defineCollection({
  name: "authors",
  directory: "content/authors",
  include: "*.json",
  schema: z.object({
    id: z.string(),
    name: z.string(),
    bio: z.string(),
  }),
});

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.md",
  schema: z.object({
    title: z.string(),
    authorId: z.string(),
    content: z.string(),
  }),
  transform: (post, { authors }) => {
    const author = authors.find((a) => a.id === post.authorId);

    return {
      ...post,
      author: author || null,
    };
  },
});
```

---

## Code Block Counter

```typescript
transform: (post) => {
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks = post.content.match(codeBlockRegex) || [];

  return {
    ...post,
    codeBlockCount: codeBlocks.length,
    hasCode: codeBlocks.length > 0,
  };
}
```

---

## Category from Folder

```typescript
transform: (post) => {
  // content/posts/react/my-post.md → "react"
  const pathParts = post._meta.path.split("/");
  const category = pathParts.length > 1 ? pathParts[0] : "uncategorized";

  return {
    ...post,
    category,
  };
}
```

---

## SEO Metadata Generation

```typescript
transform: (post) => {
  return {
    ...post,
    seo: {
      title: post.title,
      description: post.description || post.excerpt,
      keywords: post.tags?.join(", "),
      ogImage: post.coverImage || "/default-og.png",
      canonicalUrl: `https://example.com/posts/${post.slug}`,
    },
  };
}
```

---

## Conditional Transforms

```typescript
transform: (post) => {
  const baseTransform = {
    ...post,
    slug: post._meta.path.replace(/\.md$/, ""),
  };

  // Only for published posts
  if (post.published) {
    return {
      ...baseTransform,
      publishedAt: new Date(post.date).toISOString(),
    };
  }

  return baseTransform;
}
```

---

## TypeScript Typing for Transforms

### Explicit Return Type

```typescript
type PostWithSlug = {
  title: string;
  date: string;
  content: string;
  slug: string;
  readingTime: number;
};

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.md",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    content: z.string(),
  }),
  transform: (post): PostWithSlug => ({
    ...post,
    slug: post._meta.path.replace(/\.md$/, ""),
    readingTime: Math.ceil(post.content.split(/\s+/).length / 200),
  }),
});
```

**Why**: Ensures transform return matches expected type.

---

## Error Handling in Async Transforms

```typescript
transform: async (post) => {
  try {
    // External API call
    const data = await fetchExternalData(post.externalId);

    return {
      ...post,
      externalData: data,
    };
  } catch (error) {
    console.error(`Transform failed for ${post._meta.path}:`, error);

    // Return with default/null values
    return {
      ...post,
      externalData: null,
    };
  }
}
```

**Best practice**: Never let transform throw unhandled errors.

---

## Performance Optimization

### Cache External API Calls

```typescript
const cache = new Map();

transform: async (post) => {
  if (!post.githubRepo) return { ...post, stars: 0 };

  // Check cache
  if (cache.has(post.githubRepo)) {
    return {
      ...post,
      ...cache.get(post.githubRepo),
    };
  }

  // Fetch and cache
  const response = await fetch(`https://api.github.com/repos/${post.githubRepo}`);
  const data = await response.json();
  const result = {
    stars: data.stargazers_count,
    forks: data.forks_count,
  };

  cache.set(post.githubRepo, result);

  return {
    ...post,
    ...result,
  };
}
```

---

## Common Mistakes

❌ **Forgetting to spread original post**
```typescript
transform: (post) => ({
  slug: post._meta.path, // Lost all other fields!
})
```

✅ **Always spread**
```typescript
transform: (post) => ({
  ...post, // Keep all original fields
  slug: post._meta.path,
})
```

---

❌ **Not using async for await**
```typescript
transform: (post) => {
  const data = await fetch(...); // ❌ Syntax error!
  return { ...post, data };
}
```

✅ **Use async function**
```typescript
transform: async (post) => {
  const data = await fetch(...); // ✅ Works
  return { ...post, data };
}
```

---

❌ **Mutating original post**
```typescript
transform: (post) => {
  post.slug = "..."; // ❌ Don't mutate!
  return post;
}
```

✅ **Return new object**
```typescript
transform: (post) => ({
  ...post, // Create new object
  slug: "...",
})
```

---

## Official Documentation

- **Transform Functions**: https://www.content-collections.dev/docs/transform
- **Collection Context**: https://www.content-collections.dev/docs/transform#collection-context
