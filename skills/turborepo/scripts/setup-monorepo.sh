#!/bin/bash

# Turborepo Monorepo Setup Script
# Creates a basic monorepo structure with Turborepo

set -e

echo "🚀 Turborepo Monorepo Setup"
echo "=============================="
echo ""

# Get project name
read -p "Project name: " PROJECT_NAME
if [ -z "$PROJECT_NAME" ]; then
  echo "❌ Project name cannot be empty"
  exit 1
fi

# Get package manager
echo ""
echo "Select package manager:"
echo "1) npm"
echo "2) pnpm"
echo "3) yarn"
echo "4) bun (recommended)"
read -p "Choice [4]: " PM_CHOICE
PM_CHOICE=${PM_CHOICE:-4}

case $PM_CHOICE in
  1) PACKAGE_MANAGER="npm" ;;
  2) PACKAGE_MANAGER="pnpm" ;;
  3) PACKAGE_MANAGER="yarn" ;;
  4) PACKAGE_MANAGER="bun" ;;
  *) echo "Invalid choice, using bun"; PACKAGE_MANAGER="bun" ;;
esac

echo ""
echo "Creating monorepo with:"
echo "  Name: $PROJECT_NAME"
echo "  Package Manager: $PACKAGE_MANAGER"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "$PROJECT_NAME"/{apps,packages,tooling}
cd "$PROJECT_NAME"

# Create root package.json
echo "📝 Creating package.json..."
cat > package.json <<EOF
{
  "name": "$PROJECT_NAME",
  "version": "0.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
EOF

# Create turbo.json
echo "📝 Creating turbo.json..."
cat > turbo.json <<EOF
{
  "\$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    },
    "clean": {
      "cache": false
    }
  }
}
EOF

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore <<EOF
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Build outputs
dist/
build/
.next/
out/

# Turbo
.turbo/

# Environment
.env
.env.local
.env.*.local

# Misc
.DS_Store
*.log
*.log.*

# IDE
.vscode/
.idea/
*.swp
*.swo
EOF

# Create README
echo "📝 Creating README.md..."
cat > README.md <<EOF
# $PROJECT_NAME

A monorepo managed with Turborepo.

## Structure

\`\`\`
$PROJECT_NAME/
├── apps/          # Applications
├── packages/      # Shared packages
├── tooling/       # Development tools
└── turbo.json     # Turborepo configuration
\`\`\`

## Getting Started

### Install dependencies

\`\`\`bash
$PACKAGE_MANAGER install
\`\`\`

### Development

\`\`\`bash
$PACKAGE_MANAGER run dev
\`\`\`

### Build

\`\`\`bash
$PACKAGE_MANAGER run build
\`\`\`

### Test

\`\`\`bash
$PACKAGE_MANAGER run test
\`\`\`

## Learn More

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Turborepo LLM Docs](https://turborepo.com/llms.txt)
EOF

# Create example package
echo "📦 Creating example shared package..."
mkdir -p packages/ui/src
cat > packages/ui/package.json <<EOF
{
  "name": "@$PROJECT_NAME/ui",
  "version": "0.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint .",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
EOF

cat > packages/ui/src/index.ts <<EOF
export function hello(name: string): string {
  return \`Hello, \${name}!\`;
}
EOF

cat > packages/ui/tsconfig.json <<EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Initialize git
echo "🔧 Initializing git..."
git init
git add .
git commit -m "Initial commit: Turborepo monorepo setup"

# Install dependencies
echo "📦 Installing dependencies..."
case $PACKAGE_MANAGER in
  npm) npm install ;;
  pnpm) pnpm install ;;
  yarn) yarn install ;;
  bun) bun install ;;
esac

echo ""
echo "✅ Monorepo setup complete!"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  $PACKAGE_MANAGER run dev"
echo ""
echo "Add apps and packages:"
echo "  - Create apps in apps/"
echo "  - Create shared packages in packages/"
echo "  - Update turbo.json pipeline as needed"
echo ""
echo "Enable remote caching:"
case $PACKAGE_MANAGER in
  bun)
    echo "  bunx turbo login"
    echo "  bunx turbo link"
    ;;
  npm)
    echo "  npx turbo login"
    echo "  npx turbo link"
    ;;
  pnpm)
    echo "  pnpm dlx turbo login"
    echo "  pnpm dlx turbo link"
    ;;
  yarn)
    echo "  yarn dlx turbo login"
    echo "  yarn dlx turbo link"
    ;;
esac
echo ""
