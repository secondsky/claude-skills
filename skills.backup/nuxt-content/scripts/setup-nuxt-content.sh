#!/bin/bash
# Nuxt Content Setup Script
# Initializes a new Nuxt Content v3 project

set -e

echo "🚀 Nuxt Content v3 Setup"
echo "========================"
echo ""

# Check if we're in a Nuxt project
if [ ! -f "nuxt.config.ts" ] && [ ! -f "nuxt.config.js" ]; then
  echo "❌ Error: No nuxt.config file found. Are you in a Nuxt project?"
  echo "   Run 'npx nuxi init my-project' first."
  exit 1
fi

# Detect package manager
if [ -f "bun.lockb" ]; then
  PKG_MGR="bun"
  INSTALL_CMD="bun add"
elif [ -f "pnpm-lock.yaml" ]; then
  PKG_MGR="pnpm"
  INSTALL_CMD="pnpm add"
elif [ -f "yarn.lock" ]; then
  PKG_MGR="yarn"
  INSTALL_CMD="yarn add"
else
  PKG_MGR="npm"
  INSTALL_CMD="npm install"
fi

echo "📦 Detected package manager: $PKG_MGR"
echo ""

# Install dependencies
echo "📥 Installing @nuxt/content and better-sqlite3..."
$INSTALL_CMD @nuxt/content better-sqlite3

# Install Zod v4 for schema validation
echo "📥 Installing zod v4 for schema validation..."
$INSTALL_CMD -D zod@^4.1.12

echo ""
echo "✅ Dependencies installed!"
echo ""

# Add module to nuxt.config.ts if not already present
if ! grep -q "@nuxt/content" nuxt.config.ts 2>/dev/null; then
  echo "📝 Adding @nuxt/content to nuxt.config.ts..."

  # Create backup
  cp nuxt.config.ts nuxt.config.ts.backup

  # Add module (simple approach - user may need to adjust)
  if grep -q "modules: \[" nuxt.config.ts; then
    sed -i.tmp "s/modules: \[/modules: ['@nuxt\/content', /" nuxt.config.ts
    rm -f nuxt.config.ts.tmp
  else
    echo "⚠️  Please manually add '@nuxt/content' to your modules array"
  fi
fi

# Create content.config.ts
if [ ! -f "content.config.ts" ]; then
  echo "📝 Creating content.config.ts..."
  cat > content.config.ts << 'EOF'
import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        date: z.date().optional(),
        tags: z.array(z.string()).default([])
      })
    })
  }
})
EOF
  echo "✅ Created content.config.ts"
else
  echo "⚠️  content.config.ts already exists, skipping..."
fi

# Create content directory
if [ ! -d "content" ]; then
  echo "📁 Creating content/ directory..."
  mkdir -p content

  # Create example content file
  cat > content/index.md << 'EOF'
---
title: Welcome to Nuxt Content
description: Your content-driven site powered by Nuxt Content v3
date: 2024-01-01
tags: ['nuxt', 'content']
---

# Welcome to Nuxt Content v3

This is your first content page! Edit this file in `content/index.md`.

## Features

- 📝 **Markdown Support** - Write content in Markdown
- 🎨 **MDC Syntax** - Use Vue components in Markdown
- 🔍 **Type-Safe Queries** - Query content with TypeScript
- 🚀 **Git-Based** - Content stored in your repository

## Next Steps

1. Add more content files to `content/`
2. Create collections in `content.config.ts`
3. Query content with `queryCollection()`
4. Render with `<ContentRenderer>`

Happy writing! 🎉
EOF
  echo "✅ Created content/ directory with example file"
else
  echo "⚠️  content/ directory already exists, skipping..."
fi

# Create example page to render content
if [ ! -d "pages" ]; then
  mkdir -p pages
fi

if [ ! -f "pages/[...slug].vue" ]; then
  echo "📝 Creating pages/[...slug].vue..."
  cat > 'pages/[...slug].vue' << 'EOF'
<script setup>
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('content').path(route.path).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, message: 'Page not found' })
}

useHead({
  title: page.value.title,
  meta: [
    { name: 'description', content: page.value.description }
  ]
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <article class="prose dark:prose-invert max-w-none">
      <h1>{{ page.title }}</h1>
      <ContentRenderer :value="page" />
    </article>
  </div>
</template>
EOF
  echo "✅ Created pages/[...slug].vue"
else
  echo "⚠️  pages/[...slug].vue already exists, skipping..."
fi

echo ""
echo "🎉 Nuxt Content v3 setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run your dev server: $PKG_MGR run dev"
echo "  2. Visit http://localhost:3000"
echo "  3. Edit content/index.md"
echo "  4. Check SKILL.md for complete documentation"
echo ""
echo "📚 Resources:"
echo "  - Docs: https://content.nuxt.com/"
echo "  - Skill: skills/nuxt-content/SKILL.md"
echo ""
