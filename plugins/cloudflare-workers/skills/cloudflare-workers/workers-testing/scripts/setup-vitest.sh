#!/bin/bash
# setup-vitest.sh - Automated Vitest setup for Cloudflare Workers
#
# This script automates the installation and configuration of Vitest
# with @cloudflare/vitest-pool-workers for Workers testing.
#
# Usage:
#   ./setup-vitest.sh
#
# Features:
# - Detects package manager (bun/npm/pnpm)
# - Installs required dependencies
# - Creates vitest.config.ts
# - Creates test/ directory with example test
# - Updates package.json scripts
#
# Requirements:
# - wrangler.jsonc must exist in project root
# - Node.js 18+ installed

set -e # Exit on error

echo "🚀 Setting up Vitest for Cloudflare Workers..."

# Detect package manager
if command -v bun &> /dev/null; then
  PKG_MANAGER="bun"
  INSTALL_CMD="bun add -D"
  RUN_CMD="bun"
elif command -v pnpm &> /dev/null; then
  PKG_MANAGER="pnpm"
  INSTALL_CMD="pnpm add -D"
  RUN_CMD="pnpm"
elif command -v npm &> /dev/null; then
  PKG_MANAGER="npm"
  INSTALL_CMD="npm install --save-dev"
  RUN_CMD="npx"
else
  echo "❌ No package manager found (bun/npm/pnpm required)"
  exit 1
fi

echo "📦 Using package manager: $PKG_MANAGER"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required (current: v$NODE_VERSION)"
  echo "   Install via: nvm install 20 && nvm use 20"
  exit 1
fi

echo "✅ Node.js version: v$NODE_VERSION"

# Check for wrangler config
if [ ! -f "wrangler.jsonc" ] && [ ! -f "wrangler.toml" ]; then
  echo "❌ No wrangler.jsonc or wrangler.toml found"
  echo "   Create wrangler config first"
  exit 1
fi

WRANGLER_CONFIG="wrangler.jsonc"
if [ ! -f "wrangler.jsonc" ]; then
  WRANGLER_CONFIG="wrangler.toml"
fi

echo "✅ Found $WRANGLER_CONFIG"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
$INSTALL_CMD vitest@^2.1.8 @cloudflare/vitest-pool-workers@^0.7.2 @vitest/coverage-v8@^2.1.8

echo "✅ Dependencies installed"

# Create vitest.config.ts
if [ -f "vitest.config.ts" ]; then
  echo "⚠️  vitest.config.ts already exists, skipping..."
else
  echo ""
  echo "📝 Creating vitest.config.ts..."

  cat > vitest.config.ts << 'EOF'
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          compatibilityDate: '2025-01-27',
          compatibilityFlags: ['nodejs_compat']
        }
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
});
EOF

  # Update wrangler path if using .toml
  if [ "$WRANGLER_CONFIG" = "wrangler.toml" ]; then
    sed -i '' 's/wrangler.jsonc/wrangler.toml/g' vitest.config.ts
  fi

  echo "✅ Created vitest.config.ts"
fi

# Create test/ directory
if [ ! -d "test" ]; then
  echo ""
  echo "📁 Creating test/ directory..."
  mkdir -p test

  # Create example test
  cat > test/index.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index';

describe('Worker', () => {
  it('responds with 200', async () => {
    const request = new Request('http://example.com/');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
  });
});
EOF

  echo "✅ Created test/index.test.ts"
fi

# Update package.json scripts
if [ -f "package.json" ]; then
  echo ""
  echo "📝 Updating package.json scripts..."

  # Check if jq is installed
  if command -v jq &> /dev/null; then
    # Use jq for safer JSON manipulation
    TMP_FILE=$(mktemp)
    jq '.scripts.test = "vitest run" | .scripts["test:watch"] = "vitest" | .scripts["test:coverage"] = "vitest run --coverage"' package.json > "$TMP_FILE"
    mv "$TMP_FILE" package.json
    echo "✅ Updated package.json scripts"
  else
    echo "⚠️  jq not installed, skipping package.json update"
    echo "   Add manually:"
    echo '   "test": "vitest run",'
    echo '   "test:watch": "vitest",'
    echo '   "test:coverage": "vitest run --coverage"'
  fi
fi

# Success message
echo ""
echo "✨ Vitest setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run tests:           $RUN_CMD test"
echo "  2. Watch mode:          $RUN_CMD test:watch"
echo "  3. Coverage report:     $RUN_CMD test:coverage"
echo ""
echo "Example test created at: test/index.test.ts"
echo "Configuration file:      vitest.config.ts"
echo ""
echo "📚 Documentation: https://developers.cloudflare.com/workers/testing/"
