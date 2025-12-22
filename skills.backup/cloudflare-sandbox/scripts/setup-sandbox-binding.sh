#!/bin/bash

# Cloudflare Sandboxes - Interactive wrangler.jsonc Setup
# This script helps configure wrangler.jsonc for Sandboxes

set -e

echo "=================================="
echo "Cloudflare Sandboxes Setup Script"
echo "=================================="
echo ""

# Check if wrangler.jsonc exists
if [ ! -f "wrangler.jsonc" ]; then
  echo "❌ wrangler.jsonc not found in current directory"
  echo "Please run this script from your Worker project root"
  exit 1
fi

echo "✅ Found wrangler.jsonc"
echo ""

# Backup wrangler.jsonc
cp wrangler.jsonc wrangler.jsonc.backup
echo "📋 Created backup: wrangler.jsonc.backup"
echo ""

# Check if already configured
if grep -q "cloudflare/sandbox" wrangler.jsonc; then
  echo "⚠️  Sandboxes configuration already exists in wrangler.jsonc"
  echo "   If you want to reconfigure, manually edit the file"
  exit 0
fi

echo "This script will add the following to wrangler.jsonc:"
echo "  - nodejs_compat compatibility flag"
echo "  - Sandboxes container configuration"
echo "  - Durable Objects binding"
echo "  - Migration entry"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Get current package version
SANDBOX_VERSION="0.4.12"
if command -v npm &> /dev/null; then
  INSTALLED_VERSION=$(npm list @cloudflare/sandbox --depth=0 2>/dev/null | grep @cloudflare/sandbox | sed 's/.*@//' | sed 's/ .*//')
  if [ -n "$INSTALLED_VERSION" ]; then
    SANDBOX_VERSION="$INSTALLED_VERSION"
    echo "📦 Detected @cloudflare/sandbox version: $SANDBOX_VERSION"
  fi
fi

echo ""
echo "Using Docker image version: cloudflare/sandbox:$SANDBOX_VERSION"
echo ""

# Create temp file with configuration
cat > /tmp/sandbox_config.json << EOF
{
  "compatibility_flags": ["nodejs_compat"],
  "containers": [{
    "class_name": "Sandbox",
    "image": "cloudflare/sandbox:$SANDBOX_VERSION",
    "instance_type": "lite"
  }],
  "durable_objects": {
    "bindings": [{
      "class_name": "Sandbox",
      "name": "Sandbox"
    }]
  },
  "migrations": [{
    "tag": "v1",
    "new_sqlite_classes": ["Sandbox"]
  }]
}
EOF

echo "Configuration prepared. Next steps:"
echo ""
echo "1. Manually merge the following into your wrangler.jsonc:"
echo "   (Or copy from /tmp/sandbox_config.json)"
echo ""
cat /tmp/sandbox_config.json
echo ""
echo "2. Ensure your Worker exports the Sandbox class:"
echo "   import { getSandbox, type Sandbox } from '@cloudflare/sandbox';"
echo "   export { Sandbox } from '@cloudflare/sandbox';"
echo ""
echo "3. Test locally:"
echo "   npm run dev"
echo ""
echo "4. Deploy:"
echo "   npm run deploy"
echo ""
echo "Configuration saved to: /tmp/sandbox_config.json"
echo "Backup saved to: wrangler.jsonc.backup"
echo ""
echo "✅ Setup complete!"
