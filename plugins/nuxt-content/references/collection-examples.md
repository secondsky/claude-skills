# Nuxt Content Collection Examples

Quick reference for common collection patterns.

## Blog Collection

```ts
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
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
        category: z.enum(['news', 'tutorial', 'update'])
      })
    })
  }
})
```

**File Structure**:
```
content/
  blog/
    2024-01-15-first-post.md
    2024-01-20-second-post.md
```

**Query Examples**:
```ts
// List all published posts
const posts = await queryCollection('blog')
  .where('published', '=', true)
  .order('date', 'DESC')
  .all()

// Get post by path
const post = await queryCollection('blog')
  .path('/blog/first-post')
  .first()

// Filter by category and tags
const tutorials = await queryCollection('blog')
  .where('category', '=', 'tutorial')
  .where('tags', 'IN', ['nuxt', 'vue'])
  .all()
```

---

## Documentation Collection

```ts
export default defineContentConfig({
  collections: {
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
    })
  }
})
```

**File Structure** (with numeric prefixes):
```
content/
  docs/
    01-getting-started/
      01-installation.md
      02-configuration.md
    02-guides/
      01-basics.md
      02-advanced.md
```

**Query with Navigation**:
```ts
// Get navigation tree
const navigation = await queryCollectionNavigation('docs')

// Get specific page
const page = await queryCollection('docs')
  .path(route.path)
  .first()

// Get breadcrumbs
const breadcrumb = findPageBreadcrumb(navigation, route.path)
```

---

## Authors (Data Collection)

```ts
export default defineContentConfig({
  collections: {
    authors: defineCollection({
      type: 'data',  // Not URL-mapped
      source: 'authors/*.yml',
      schema: z.object({
        name: z.string(),
        bio: z.string(),
        avatar: z.string(),
        email: z.string().email(),
        social: z.object({
          github: z.string(),
          twitter: z.string().optional(),
          website: z.string().url().optional()
        })
      })
    })
  }
})
```

**File**: `content/authors/john-doe.yml`
```yaml
name: John Doe
bio: Full-stack developer
avatar: /images/john.jpg
email: john@example.com
social:
  github: johndoe
  twitter: johndoe
  website: https://johndoe.com
```

**Query**:
```ts
// Get author by ID
const author = await queryCollection('authors')
  .where('id', '=', 'john-doe')
  .first()

// Get all authors
const authors = await queryCollection('authors').all()
```

---

## Multi-Language Collection

```ts
export default defineContentConfig({
  collections: {
    en: defineCollection({
      type: 'page',
      source: {
        include: 'en/**/*.md',
        prefix: '/en'
      }
    }),

    fr: defineCollection({
      type: 'page',
      source: {
        include: 'fr/**/*.md',
        prefix: '/fr'
      }
    })
  }
})
```

**File Structure**:
```
content/
  en/
    index.md
    about.md
    blog/
      post-1.md
  fr/
    index.md
    about.md
    blog/
      post-1.md
```

**URLs**:
- `/en` → `content/en/index.md`
- `/en/about` → `content/en/about.md`
- `/fr` → `content/fr/index.md`
- `/fr/about` → `content/fr/about.md`

---

## Products Collection (E-Commerce)

```ts
export default defineContentConfig({
  collections: {
    products: defineCollection({
      type: 'page',
      source: 'products/**/*.md',
      schema: z.object({
        name: z.string(),
        description: z.string(),
        price: z.number(),
        sku: z.string(),
        category: z.string(),
        images: z.array(z.string()),
        inStock: z.boolean().default(true),
        tags: z.array(z.string()).default([]),
        specifications: z.object({
          weight: z.string().optional(),
          dimensions: z.string().optional(),
          color: z.string().optional()
        }).optional()
      })
    }),

    categories: defineCollection({
      type: 'data',
      source: 'categories/*.json',
      schema: z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string(),
        image: z.string()
      })
    })
  }
})
```

**Query Products**:
```ts
// Get products by category
const products = await queryCollection('products')
  .where('category', '=', 'electronics')
  .where('inStock', '=', true)
  .where('price', '<', 1000)
  .order('price', 'ASC')
  .all()

// Search products
const results = await queryCollection('products')
  .where('name', 'LIKE', '%phone%')
  .all()
```

---

## Remote Repository Collection

```ts
export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: {
        include: 'docs/**/*.md',
        repository: 'https://github.com/username/docs-repo',
        authToken: process.env.GITHUB_TOKEN  // For private repos
      }
    })
  }
})
```

**Environment Variable**:
```bash
# .env
GITHUB_TOKEN=ghp_your_token_here
```

---

## With Nuxt Studio Editor Metadata

```ts
import { property } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),

        // Media picker in Studio
        image: property(z.string()).editor({
          input: 'media'
        }),

        // Dropdown select
        category: property(z.string()).editor({
          input: 'select',
          options: ['news', 'tutorial', 'update']
        }),

        // Toggle switch
        featured: property(z.boolean()).editor({
          input: 'toggle'
        })
      })
    })
  }
})
```

---

## Best Practices

✅ **Use meaningful collection names**: `blog`, `docs`, `products`, not `collection1`
✅ **Define schemas for all fields**: Enables validation and TypeScript types
✅ **Use `type: 'page'` for URLs**: Blog posts, docs, products
✅ **Use `type: 'data'` for metadata**: Authors, categories, settings
✅ **Add defaults for optional fields**: `z.boolean().default(false)`
✅ **Use enums for fixed values**: `z.enum(['news', 'tutorial'])`
✅ **Organize with subdirectories**: `blog/`, `docs/`, `authors/`
