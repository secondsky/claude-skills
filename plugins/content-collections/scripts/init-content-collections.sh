#!/bin/bash
# One-command setup for Content Collections in Vite + React project

set -e

echo "🚀 Initializing Content Collections..."
echo ""

# Check if in a Node.js project
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this in a Node.js project directory."
  exit 1
fi

# Check for bun (preferred), pnpm, npm, or yarn
if command -v bun &> /dev/null; then
  PKG_MANAGER="bun"
elif command -v pnpm &> /dev/null; then
  PKG_MANAGER="pnpm"
elif command -v yarn &> /dev/null; then
  PKG_MANAGER="yarn"
elif command -v npm &> /dev/null; then
  PKG_MANAGER="npm"
else
  echo "❌ Error: No package manager found (bun, pnpm, yarn, or npm)"
  exit 1
fi

echo "📦 Installing dependencies with $PKG_MANAGER..."
$PKG_MANAGER add -D @content-collections/core @content-collections/vite zod

echo ""
echo "⚙️  Configuring TypeScript..."

# Add path alias to tsconfig.json if it doesn't exist
if [ -f "tsconfig.json" ]; then
  # Check if path alias already exists
  if ! grep -q '"content-collections"' tsconfig.json; then
    # Use sed to add paths if compilerOptions exists
    if grep -q '"compilerOptions"' tsconfig.json; then
      echo "  Adding path alias to tsconfig.json..."
      # This is a basic implementation - may need adjustment for complex tsconfig.json files
      echo "  ⚠️  Manual step: Add this to tsconfig.json compilerOptions:"
      echo '  "paths": {'
      echo '    "content-collections": ["./.content-collections/generated"]'
      echo '  }'
    fi
  else
    echo "  ✅ Path alias already configured"
  fi
else
  echo "  ⚠️  tsconfig.json not found - skipping TypeScript configuration"
fi

echo ""
echo "📝 Creating collection configuration..."

# Create content-collections.ts
cat > content-collections.ts << 'EOF'
import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";

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
EOF

echo "  ✅ Created content-collections.ts"

echo ""
echo "📁 Creating content directory..."
mkdir -p content/posts

# Create example post
cat > content/posts/first-post.md << 'EOF'
---
title: My First Post
date: 2025-11-07
description: Introduction to Content Collections
---

# My First Post

Welcome to Content Collections! This is an example post.

## Features

- Type-safe content
- Automatic validation
- Hot module reloading
- MDX support (optional)

## Next Steps

1. Edit this file and watch it update
2. Create more posts in `content/posts/`
3. Import collections: `import { allPosts } from "content-collections"`
EOF

echo "  ✅ Created content/posts/ with example post"

echo ""
echo "🚫 Updating .gitignore..."

# Add .content-collections to .gitignore if not already there
if [ -f ".gitignore" ]; then
  if ! grep -q '.content-collections' .gitignore; then
    echo ".content-collections/" >> .gitignore
    echo "  ✅ Added .content-collections/ to .gitignore"
  else
    echo "  ✅ .gitignore already configured"
  fi
else
  echo ".content-collections/" > .gitignore
  echo "  ✅ Created .gitignore"
fi

echo ""
echo "🔧 Next steps:"
echo ""
echo "1. Add Vite plugin to vite.config.ts:"
echo '   import contentCollections from "@content-collections/vite"'
echo "   "
echo "   export default defineConfig({"
echo "     plugins: [react(), contentCollections()],"
echo "   });"
echo ""
echo "2. Add path alias to tsconfig.json (if not done automatically):"
echo '   "paths": {'
echo '     "content-collections": ["./.content-collections/generated"]'
echo '   }'
echo ""
echo "3. Start dev server:"
echo "   # bun (preferred): bun run dev"
echo "   # or: $PKG_MANAGER dev"
echo ""
echo "4. Import and use:"
echo '   import { allPosts } from "content-collections"'
echo ""
echo "✅ Content Collections initialization complete!"
