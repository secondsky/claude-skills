#!/usr/bin/env bash

# Validate Variants Script - Cloudflare Images
# List all configured variants and check variant count

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0;' # No Color

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
if [ -z "$CF_ACCOUNT_ID" ]; then
  echo -e "${RED}Error: CF_ACCOUNT_ID not set${NC}"
  echo "Set it in .env or export CF_ACCOUNT_ID=your_account_id"
  exit 1
fi

if [ -z "$CF_API_TOKEN" ]; then
  echo -e "${RED}Error: CF_API_TOKEN not set${NC}"
  echo "Set it in .env or export CF_API_TOKEN=your_api_token"
  exit 1
fi

echo -e "${GREEN}Fetching Cloudflare Images Variants...${NC}\n"

# Fetch variants from API
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/variants" \
  -H "Authorization: Bearer ${CF_API_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ne 200 ]; then
  echo -e "${RED}✗ Failed to fetch variants (HTTP $HTTP_CODE)${NC}"
  echo -e "${YELLOW}Response: $BODY${NC}"
  exit 1
fi

# Check if jq is available for pretty JSON parsing
if command -v jq &> /dev/null; then
  # Parse with jq
  VARIANT_COUNT=$(echo "$BODY" | jq '.result.variants | length')
  VARIANTS=$(echo "$BODY" | jq -r '.result.variants | keys[]')

  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}Variant Summary${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${YELLOW}Total Variants:${NC} $VARIANT_COUNT / 100 (max)"

  # Show warning if approaching limit
  if [ "$VARIANT_COUNT" -ge 80 ]; then
    echo -e "${RED}⚠ WARNING: Approaching variant limit!${NC}"
    echo -e "${RED}   You can create only $((100 - VARIANT_COUNT)) more variants.${NC}"
  elif [ "$VARIANT_COUNT" -ge 50 ]; then
    echo -e "${YELLOW}⚠ Notice: You have used $VARIANT_COUNT of 100 variants.${NC}"
  else
    echo -e "${GREEN}✓ Variant usage is healthy.${NC}"
  fi

  echo ""
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}Configured Variants${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"

  # Display each variant with details
  for VARIANT in $VARIANTS; do
    VARIANT_DATA=$(echo "$BODY" | jq -r ".result.variants[\"$VARIANT\"]")

    # Extract variant options
    WIDTH=$(echo "$VARIANT_DATA" | jq -r '.options.width // "auto"')
    HEIGHT=$(echo "$VARIANT_DATA" | jq -r '.options.height // "auto"')
    FIT=$(echo "$VARIANT_DATA" | jq -r '.options.fit // "scale-down"')
    QUALITY=$(echo "$VARIANT_DATA" | jq -r '.options.quality // "85"')

    echo -e "\n${GREEN}Variant:${NC} $VARIANT"
    echo -e "  ${YELLOW}Width:${NC}   $WIDTH"
    echo -e "  ${YELLOW}Height:${NC}  $HEIGHT"
    echo -e "  ${YELLOW}Fit:${NC}     $FIT"
    echo -e "  ${YELLOW}Quality:${NC} $QUALITY"
  done

else
  # Fallback without jq
  echo -e "${YELLOW}Note: Install 'jq' for better output formatting${NC}\n"

  # Simple count using grep
  VARIANT_COUNT=$(echo "$BODY" | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')

  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}Variant Summary${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${YELLOW}Total Variants:${NC} $VARIANT_COUNT / 100 (max)"

  # Show warning if approaching limit
  if [ "$VARIANT_COUNT" -ge 80 ]; then
    echo -e "${RED}⚠ WARNING: Approaching variant limit!${NC}"
  elif [ "$VARIANT_COUNT" -ge 50 ]; then
    echo -e "${YELLOW}⚠ Notice: You have used $VARIANT_COUNT of 100 variants.${NC}"
  else
    echo -e "${GREEN}✓ Variant usage is healthy.${NC}"
  fi

  echo ""
  echo -e "${YELLOW}Raw Response:${NC}"
  echo "$BODY"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Variant validation complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
