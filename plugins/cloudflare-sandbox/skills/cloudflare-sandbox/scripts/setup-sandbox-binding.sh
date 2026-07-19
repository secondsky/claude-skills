#!/bin/bash

# Cloudflare Sandboxes - Interactive wrangler.jsonc Setup
# This script helps configure wrangler.jsonc for Sandboxes

set -euo pipefail

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

# D-009: timestamped backup (single-generation .backup silently overwrites prior backups).
BACKUP_FILE="wrangler.jsonc.backup.$(date +%Y%m%d%H%M%S)"
cp wrangler.jsonc "$BACKUP_FILE"
echo "📋 Created backup: $BACKUP_FILE"
echo ""

# D-023: grep-based idempotency is fragile (matches the literal anywhere, even
# in comments). Keep grep as the fast-path, but also do a structural jq check
# to confirm an actual container binding with image "cloudflare/sandbox".
has_sandbox_binding_structural() {
  if ! command -v jq &> /dev/null; then
    return 1
  fi
  # Strip JSONC // line-comments for jq, then look for a container image matching cloudflare/sandbox.
  grep -v '^\s*//' wrangler.jsonc 2>/dev/null \
    | jq -e '.containers[]?.image | test("cloudflare/sandbox")' &> /dev/null
}

if grep -q "cloudflare/sandbox" wrangler.jsonc && has_sandbox_binding_structural; then
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
  INSTALLED_VERSION=$(npm list @cloudflare/sandbox --depth=0 2>/dev/null | grep @cloudflare/sandbox | sed 's/.*@//' | sed 's/ .*//' || true)
  if [ -n "$INSTALLED_VERSION" ]; then
    SANDBOX_VERSION="$INSTALLED_VERSION"
    echo "📦 Detected @cloudflare/sandbox version: $SANDBOX_VERSION"
  fi
fi

echo ""
echo "Using Docker image version: cloudflare/sandbox:$SANDBOX_VERSION"
echo ""

# D-009: write to a mktemp path (not the predictable /tmp/sandbox_config.json,
# which is a symlink-attack vector). Clean up on exit.
SANDBOX_CONFIG=$(mktemp -t sandbox_config.XXXXXX) || {
  echo "❌ Failed to create temp file" >&2
  exit 1
}
trap 'rm -f "$SANDBOX_CONFIG"' EXIT

cat > "$SANDBOX_CONFIG" << EOF
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
echo "   (Or copy from $SANDBOX_CONFIG)"
echo ""
cat "$SANDBOX_CONFIG"
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
echo "Configuration saved to: $SANDBOX_CONFIG"
echo "Backup saved to: $BACKUP_FILE"
echo ""
echo "✅ Setup complete!"
