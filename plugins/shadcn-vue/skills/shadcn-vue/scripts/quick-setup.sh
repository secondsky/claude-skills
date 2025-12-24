#!/bin/bash

# Quick Setup Script for shadcn-vue
# This script helps quickly set up shadcn-vue in a Vue or Nuxt project

set -e

echo "🎨 shadcn-vue Quick Setup"
echo "========================"
echo ""

# Check if we're in a Vue/Nuxt project
if [ ! -f "package.json" ]; then
  echo "❌ Error: No package.json found. Run this script from your project root."
  exit 1
fi

# Detect project type
PROJECT_TYPE="unknown"
if grep -q '"nuxt"' package.json; then
  PROJECT_TYPE="nuxt"
  echo "✓ Detected: Nuxt project"
elif grep -q '"vue"' package.json; then
  PROJECT_TYPE="vue"
  echo "✓ Detected: Vue project"
else
  echo "⚠️  Warning: Could not detect project type. Assuming Vue."
  PROJECT_TYPE="vue"
fi

echo ""

# Ask for package manager preference
echo "Choose package manager:"
echo "1) bun (recommended)"
echo "2) npm"
echo "3) pnpm"
read -p "Enter choice [1-3]: " pm_choice

case $pm_choice in
  1)
    PM="bun"
    PM_ADD="bun add"
    PM_RUN="bunx"
    ;;
  2)
    PM="npm"
    PM_ADD="npm install"
    PM_RUN="npx"
    ;;
  3)
    PM="pnpm"
    PM_ADD="pnpm add"
    PM_RUN="pnpm dlx"
    ;;
  *)
    echo "Invalid choice. Defaulting to bun."
    PM="bun"
    PM_ADD="bun add"
    PM_RUN="bunx"
    ;;
esac

echo ""
echo "Using: $PM"
echo ""

# Install Tailwind CSS if not present
if ! grep -q '"tailwindcss"' package.json; then
  echo "📦 Installing Tailwind CSS..."
  $PM_ADD tailwindcss @tailwindcss/vite
else
  echo "✓ Tailwind CSS already installed"
fi

# Install @types/node if TypeScript project
if [ -f "tsconfig.json" ]; then
  if ! grep -q '"@types/node"' package.json; then
    echo "📦 Installing @types/node..."
    $PM_ADD -D @types/node
  else
    echo "✓ @types/node already installed"
  fi
fi

echo ""
echo "🚀 Running shadcn-vue init..."
echo ""

# Run shadcn-vue init
$PM_RUN shadcn-vue@latest init

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your first component: $PM_RUN shadcn-vue@latest add button"
echo "2. Import in your Vue file: import { Button } from '@/components/ui/button'"
echo "3. Use in template: <Button>Click me</Button>"
echo ""
echo "For dark mode setup, see: references/dark-mode-setup.md"
echo "For full documentation, see: SKILL.md"
