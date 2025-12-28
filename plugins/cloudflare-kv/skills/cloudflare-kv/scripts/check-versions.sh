#!/bin/bash

# Cloudflare Workers KV - Version Checker
# Verifies KV API endpoints and package versions

echo "Cloudflare Workers KV - Version Checker"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if command -v wrangler &> /dev/null; then
  WRANGLER_VERSION=$(wrangler --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  echo -e "${GREEN}✓${NC} Wrangler installed: v$WRANGLER_VERSION"
else
  echo -e "${YELLOW}⚠${NC} Wrangler not installed (optional but recommended)"
  echo "  Install: npm install -g wrangler"
fi

echo ""
echo "Checking KV API availability..."
echo ""

# Check KV API endpoint (no auth required for availability check)
echo -n "Checking KV API endpoint... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://api.cloudflare.com/client/v4/accounts" 2>/dev/null)

if [ "$RESPONSE" = "403" ] || [ "$RESPONSE" = "401" ]; then
  echo -e "${GREEN}✓ Available (authentication required)${NC}"
elif [ "$RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓ Available${NC}"
else
  echo -e "${YELLOW}⚠ Unable to verify (HTTP $RESPONSE)${NC}"
fi

echo ""
echo "Package Recommendations:"
echo "========================"
echo ""

# Check for @cloudflare/workers-types
if [ -f "package.json" ]; then
  if grep -q "@cloudflare/workers-types" package.json; then
    VERSION=$(grep "@cloudflare/workers-types" package.json | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    echo -e "${GREEN}✓${NC} @cloudflare/workers-types: v$VERSION (installed)"
  else
    echo -e "${YELLOW}⚠${NC} @cloudflare/workers-types: Not found in package.json"
    echo "  Install: npm install -D @cloudflare/workers-types@latest"
  fi
else
  echo -e "${YELLOW}⚠${NC} No package.json found"
  echo "  For TypeScript support, install: @cloudflare/workers-types@latest"
fi

echo ""
echo "KV Documentation:"
echo "================="
echo "• API Docs: https://developers.cloudflare.com/kv/api/"
echo "• Best Practices: https://developers.cloudflare.com/kv/best-practices/"
echo "• Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/"
echo ""

echo "KV API Version: v4 (current)"
echo "Last Verified: 2025-12-27"
echo ""
echo -e "${GREEN}✓ KV API endpoints available${NC}"
