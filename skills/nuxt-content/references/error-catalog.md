# Nuxt Content v3 - Complete Error Catalog

This document contains all 18 documented issues and their solutions for Nuxt Content v3.

**Last Updated**: 2025-01-10
**Nuxt Content Version**: 3.0.0
**Source**: Production deployments, GitHub issues, Nuxt Content documentation

---

## Issue #1: Collection Not Found Error

**Error**: `Collection 'xyz' not found`

**Source**: https://github.com/nuxt/content/issues

**Why It Happens**: Collection not defined in `content.config.ts` or dev server not restarted

**Prevention**: Always define collections in `content.config.ts` and restart dev server after changes

**Solution**:
```ts
// content.config.ts
export default defineContentConfig({
  collections: {
    xyz: defineCollection({
      type: 'page',
      source: 'xyz/**/*.md'
    })
  }
})
```

Then restart: `rm -rf .nuxt && bun dev`

---

## Issue #2: Schema Validation Failure with Dates

**Error**: `Validation error: Expected date, received string`

**Source**: https://github.com/nuxt/content/discussions

**Why It Happens**: Incorrect date format in frontmatter

**Prevention**: Use ISO 8601 format: `2024-01-15` or `2024-01-15T10:30:00Z`

**Solution**:
```md
---
title: My Post
date: 2024-01-15  # ✅ ISO 8601 format
# NOT: "January 15, 2024"  # ❌ Invalid
---
```

---

## Issue #3: Database Locked Error

**Error**: `SQLITE_BUSY: database is locked`

**Source**: https://github.com/nuxt/content/issues

**Why It Happens**: Multiple processes accessing database simultaneously

**Prevention**: Delete `.nuxt` directory and restart dev server

**Solution**:
```bash
rm -rf .nuxt
bun dev
```

**Note**: This can happen when running multiple dev servers or after force-killing a process.

---

## Issue #4: D1 Binding Not Found on Cloudflare

**Error**: `DB is not defined`

**Source**: Cloudflare D1 documentation

**Why It Happens**: D1 binding name is not exactly `DB`

**Prevention**: Use binding name `DB` (case-sensitive) in Cloudflare dashboard

**Solution**:
1. Go to Cloudflare Dashboard → Workers & Pages → Your project → Settings → Variables
2. D1 Database Bindings → Variable name must be exactly `DB`
3. Redeploy after changing binding name

---

## Issue #5: MDC Components Not Rendering

**Error**: Components show as raw text instead of rendering

**Source**: MDC documentation

**Why It Happens**: Component not in `components/content/` or incorrect syntax

**Prevention**: Place components in `components/content/` with exact name matching

**Solution**:
```vue
<!-- components/content/MyAlert.vue -->
<template>
  <div class="alert">
    <slot />
  </div>
</template>
```

```md
<!-- content/page.md -->
::my-alert
This is an alert message
::
```

**Important**: Component name in markdown uses kebab-case, Vue file uses PascalCase.

---

## Issue #6: Navigation Not Updating

**Error**: New content doesn't appear in navigation

**Source**: https://github.com/nuxt/content/issues

**Why It Happens**: `.nuxt` cache not cleared

**Prevention**: Delete `.nuxt` directory when adding new content files

**Solution**:
```bash
rm -rf .nuxt
bun dev
```

---

## Issue #7: Path Not Resolved Correctly

**Error**: Content returns null for valid path

**Source**: https://github.com/nuxt/content/discussions

**Why It Happens**: Path doesn't match file structure or prefix misconfigured

**Prevention**: Use `.all()` to debug paths

**Solution**:
```ts
// Debug all paths in collection
const items = await queryCollection('blog').all()
console.log(items.map(i => i.path))

// Then query with correct path
const post = await queryCollection('blog').path('/blog/hello').first()
```

---

## Issue #8: Studio OAuth Callback Fails

**Error**: `redirect_uri_mismatch`

**Source**: GitHub OAuth documentation

**Why It Happens**: OAuth callback URL doesn't match exactly

**Prevention**: Ensure callback URL in GitHub OAuth app matches production domain exactly (including `https://`)

**Solution**:
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Set Authorization callback URL to: `https://yourdomain.com/api/__studio/oauth/callback`
3. Must include protocol (`https://`)
4. Must match production domain exactly

---

## Issue #9: Studio Changes Not Saving

**Error**: Changes in Studio don't commit to GitHub

**Source**: Nuxt Studio documentation

**Why It Happens**: GitHub token lacks write permissions or repository config incorrect

**Prevention**: Verify repository configuration and GitHub token permissions

**Solution**:
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  studio: {
    enabled: true,
    gitInfo: {
      name: 'your-name',
      email: 'your-email@example.com'
    }
  }
})
```

Ensure GitHub token has `repo` scope (full repository access).

---

## Issue #10: Better-SQLite3 Module Not Found

**Error**: `Cannot find module 'better-sqlite3'`

**Source**: Node.js error logs

**Why It Happens**: Database connector not installed

**Prevention**: Install database connector

**Solution**:
```bash
bun add better-sqlite3
# or
npm install better-sqlite3
```

**Note**: This is required for Nuxt Content v3 SQL storage.

---

## Issue #11: JSON File Validation Error

**Error**: `Unexpected token [ in JSON`

**Source**: Nuxt Content validation

**Why It Happens**: JSON file contains array instead of object

**Prevention**: Each JSON file must contain single object, not array

**Solution**:
```json
// ❌ Wrong: array at root
[
  { "name": "Item 1" },
  { "name": "Item 2" }
]

// ✅ Correct: object at root
{
  "name": "Item 1",
  "description": "This is an item"
}
```

**For arrays**: Use separate JSON files or nest array inside object.

---

## Issue #12: Numeric Prefix Sorting Wrong

**Error**: Files sort as 1, 10, 2, 3 instead of 1, 2, 3, 10

**Source**: File system alphabetical sorting

**Why It Happens**: Single-digit numbers sort alphabetically

**Prevention**: Use zero-padded prefixes

**Solution**:
```
# ❌ Wrong
1-introduction.md
2-setup.md
10-advanced.md

# ✅ Correct
01-introduction.md
02-setup.md
10-advanced.md
```

---

## Issue #13: Server Query Type Error

**Error**: TypeScript error in server routes

**Source**: TypeScript compilation

**Why It Happens**: Missing `server/tsconfig.json`

**Prevention**: Create `server/tsconfig.json` extending `../.nuxt/tsconfig.server.json`

**Solution**:
```json
// server/tsconfig.json
{
  "extends": "../.nuxt/tsconfig.server.json"
}
```

---

## Issue #14: Vercel Build Fails

**Error**: Build timeout or out of memory

**Source**: Vercel build logs

**Why It Happens**: Large content causing memory issues

**Prevention**: Use route rules with prerendering and pagination

**Solution**:
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/blog/**': { prerender: true },
    '/api/**': { cors: true }
  },
  
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      ignore: ['/admin/**']
    }
  }
})
```

**Also consider**: Implement pagination for large collections.

---

## Issue #15: Excerpt Not Working

**Error**: Excerpt returns full content

**Source**: Nuxt Content documentation

**Why It Happens**: Missing `<!--more-->` divider in Markdown

**Prevention**: Add `<!--more-->` in content to separate excerpt from full content

**Solution**:
```md
---
title: My Post
---

This is the excerpt content. It appears in listings.

<!--more-->

This is the full content. It only appears on the full post page.
```

```ts
// Query with excerpt
const posts = await queryCollection('blog')
  .only(['title', 'excerpt', 'path'])
  .all()
```

---

## Issue #16: Code Highlighting Not Working

**Error**: Code blocks show plain text without syntax highlighting

**Source**: Shiki configuration

**Why It Happens**: Language not specified or Shiki not configured

**Prevention**: Specify language in code fence

**Solution**:
```md
<!-- ❌ Wrong: no language specified -->
\`\`\`
const hello = 'world'
\`\`\`

<!-- ✅ Correct: language specified -->
\`\`\`typescript
const hello: string = 'world'
\`\`\`
```

**Configure Shiki** (optional):
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  content: {
    highlight: {
      theme: 'github-dark',
      langs: ['typescript', 'javascript', 'vue', 'css']
    }
  }
})
```

---

## Issue #17: Remote Repository Auth Fails

**Error**: `Authentication failed` when using remote repository

**Source**: Git authentication

**Why It Happens**: Invalid token or missing credentials

**Prevention**: Store GitHub token in environment variable and reference in `source.authToken`

**Solution**:
```bash
# .env
GITHUB_TOKEN=your_github_token_here
```

```ts
// content.config.ts
export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: {
        repository: 'owner/repo',
        prefix: 'docs',
        authToken: process.env.GITHUB_TOKEN
      }
    })
  }
})
```

**Token Permissions**: Ensure token has `repo` scope for private repositories.

---

## Issue #18: Prose Components Not Applied

**Error**: Custom Prose components don't override defaults

**Source**: MDC configuration

**Why It Happens**: Component name doesn't match exactly or not in `components/content/`

**Prevention**: Use exact names (`ProseA`, `ProseH1`, etc.) in `components/content/` directory

**Solution**:
```vue
<!-- components/content/ProseA.vue -->
<template>
  <a :href="href" class="custom-link" target="_blank">
    <slot />
  </a>
</template>

<script setup>
defineProps<{ href: string }>()
</script>
```

**Prose Component Names**:
- `ProseA` - Links
- `ProseH1`, `ProseH2`, etc. - Headings
- `ProseP` - Paragraphs
- `ProseCode` - Inline code
- `ProseCodeInline` - Code spans
- `ProseImg` - Images
- `ProseUl`, `ProseOl` - Lists

---

## Summary

**Total Issues Documented**: 18
**Categories**:
- Configuration: 7 issues (#1, #2, #4, #10, #13, #17, #18)
- Content Management: 6 issues (#6, #7, #11, #12, #15, #16)
- Development: 3 issues (#3, #5, #14)
- Studio Integration: 2 issues (#8, #9)

**Prevention**: Always follow the Quick Start guide and use proper TypeScript types for content collections.
