#!/bin/bash
# Check Base UI version and compare with latest

set -e

echo "🔍 Checking Base UI version..."
echo ""

# Check if in a Node.js project
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this in a Node.js project directory."
  exit 1
fi

# Check if Base UI is installed
if ! grep -q "@base-ui-components/react" package.json; then
  echo "⚠️  Base UI not installed in this project."
  echo ""
  echo "To install:"
  echo "  pnpm add @base-ui-components/react"
  exit 0
fi

# Get installed version
INSTALLED_VERSION=$(grep "@base-ui-components/react" package.json | sed 's/.*"@base-ui-components\/react": "\^*\([^"]*\)".*/\1/')

echo "📦 Installed version: @base-ui-components/react@$INSTALLED_VERSION"
echo ""

# Check npm for latest version
echo "🌐 Checking npm for latest version..."
LATEST_VERSION=$(npm view @base-ui-components/react version 2>/dev/null || echo "unknown")

if [ "$LATEST_VERSION" = "unknown" ]; then
  echo "⚠️  Could not fetch latest version from npm"
  exit 1
fi

echo "📦 Latest version:    @base-ui-components/react@$LATEST_VERSION"
echo ""

# Compare versions
if [ "$INSTALLED_VERSION" = "$LATEST_VERSION" ]; then
  echo "✅ You are on the latest version!"
else
  echo "⚠️  Update available: $INSTALLED_VERSION → $LATEST_VERSION"
  echo ""
  echo "To update:"
  echo "  pnpm add @base-ui-components/react@latest"
  echo ""
  echo "⚠️  Beta Warning:"
  echo "  Base UI is currently in beta. Check release notes before updating:"
  echo "  https://github.com/mui/base-ui/releases"
fi

echo ""
echo "📚 Official Docs: https://base-ui.com"
echo "📝 GitHub: https://github.com/mui/base-ui"
