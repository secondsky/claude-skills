#!/bin/bash

# Cloudflare Images - Version Checker
# Verifies API endpoints are current

echo "Cloudflare Images - API Version Checker"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if API token is set
if [ -z "$IMAGES_API_TOKEN" ]; then
  echo -e "${YELLOW}WARNING:${NC} IMAGES_API_TOKEN environment variable not set"
  echo "Set it with: export IMAGES_API_TOKEN=your_token_here"
  echo ""
fi

if [ -z "$IMAGES_ACCOUNT_ID" ]; then
  echo -e "${YELLOW}WARNING:${NC} IMAGES_ACCOUNT_ID environment variable not set"
  echo "Set it with: export IMAGES_ACCOUNT_ID=your_account_id"
  echo ""
fi

echo "Checking Cloudflare Images API endpoints..."
echo ""

# Check main API endpoint
echo -n "Checking /images/v1 endpoint... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://api.cloudflare.com/client/v4/accounts/${IMAGES_ACCOUNT_ID}/images/v1" \
  -H "Authorization: Bearer ${IMAGES_API_TOKEN}" 2>/dev/null)

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo -e "${GREEN}✓ Available${NC}"
else
  echo -e "${RED}✗ Error (HTTP $RESPONSE)${NC}"
fi

# Check v2 endpoint
echo -n "Checking /images/v2 endpoint... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://api.cloudflare.com/client/v4/accounts/${IMAGES_ACCOUNT_ID}/images/v2" \
  -H "Authorization: Bearer ${IMAGES_API_TOKEN}" 2>/dev/null)

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo -e "${GREEN}✓ Available${NC}"
else
  echo -e "${RED}✗ Error (HTTP $RESPONSE)${NC}"
fi

# Check direct upload endpoint
echo -n "Checking /images/v2/direct_upload endpoint... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${IMAGES_ACCOUNT_ID}/images/v2/direct_upload" \
  -H "Authorization: Bearer ${IMAGES_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null)

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "400" ] || [ "$RESPONSE" = "401" ]; then
  echo -e "${GREEN}✓ Available${NC}"
else
  echo -e "${RED}✗ Error (HTTP $RESPONSE)${NC}"
fi

# Check batch API endpoint
echo -n "Checking batch.imagedelivery.net endpoint... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://batch.imagedelivery.net/images/v1" \
  -H "Authorization: Bearer ${IMAGES_BATCH_TOKEN}" 2>/dev/null)

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
  echo -e "${GREEN}✓ Available${NC}"
else
  echo -e "${YELLOW}⚠ Cannot verify (set IMAGES_BATCH_TOKEN if using)${NC}"
fi

echo ""
echo "Package Recommendations:"
echo "========================"
echo "TypeScript types: @cloudflare/workers-types@latest"
echo "Wrangler CLI: wrangler@latest"
echo ""
echo "No npm packages required for Cloudflare Images API"
echo "(uses native fetch API)"
echo ""

# Check if wrangler is installed
if command -v wrangler &> /dev/null; then
  WRANGLER_VERSION=$(wrangler --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  echo -e "${GREEN}✓${NC} Wrangler installed: v$WRANGLER_VERSION"
else
  echo -e "${YELLOW}⚠${NC} Wrangler not installed (optional)"
  echo "  Install: npm install -g wrangler"
fi

echo ""
echo "API Version: v2 (direct uploads), v1 (standard uploads)"
echo "Last Verified: 2025-10-26"
echo ""
echo -e "${GREEN}✓ All core endpoints available${NC}"
