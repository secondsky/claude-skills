#!/usr/bin/env bash

# Analyze Usage Script - Cloudflare Images
# Query API for storage usage, delivered images, and estimated costs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${GREEN}Fetching Cloudflare Images Usage Stats...${NC}\n"

# Fetch usage stats
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/stats" \
  -H "Authorization: Bearer ${CF_API_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ne 200 ]; then
  echo -e "${RED}✗ Failed to fetch usage stats (HTTP $HTTP_CODE)${NC}"
  echo -e "${YELLOW}Response: $BODY${NC}"
  exit 1
fi

# Parse stats using jq or fallback
if command -v jq &> /dev/null; then
  # Parse with jq
  TOTAL_STORED=$(echo "$BODY" | jq -r '.result.count.current // 0')
  TOTAL_ALLOWED=$(echo "$BODY" | jq -r '.result.count.allowed // 100000')

  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}Storage Statistics${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${YELLOW}Images Stored:${NC}      $TOTAL_STORED"
  echo -e "${YELLOW}Storage Limit:${NC}      $TOTAL_ALLOWED"
  echo -e "${YELLOW}Storage Used:${NC}       $(echo "scale=2; $TOTAL_STORED * 100 / $TOTAL_ALLOWED" | bc)%"

  # Calculate estimated monthly cost (Images API pricing)
  # $5 per 100,000 images stored
  STORAGE_COST=$(echo "scale=2; $TOTAL_STORED / 100000 * 5" | bc)

  echo ""
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}Estimated Monthly Costs${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${YELLOW}Storage Cost:${NC}       \$$STORAGE_COST (at \$5/100k stored)"

  # Note: Delivery cost requires analytics data which may not be available via stats API
  echo -e "${YELLOW}Delivery Cost:${NC}      Check Analytics dashboard"
  echo -e "${GREEN}                      (\$1/100k delivered)${NC}"

  echo ""
  echo -e "${YELLOW}Transformations:${NC}    Check Analytics dashboard"
  echo -e "${GREEN}                      (\$0.50/1k transforms)${NC}"
  echo -e "${GREEN}                      (100k/month free per zone)${NC}"

  echo ""
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}Storage Quota Status${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"

  # Calculate remaining storage
  REMAINING=$(( TOTAL_ALLOWED - TOTAL_STORED ))
  PERCENT_USED=$(echo "scale=2; $TOTAL_STORED * 100 / $TOTAL_ALLOWED" | bc)

  if (( $(echo "$PERCENT_USED >= 90" | bc -l) )); then
    echo -e "${RED}⚠ WARNING: Storage quota at ${PERCENT_USED}%!${NC}"
    echo -e "${RED}   Only $REMAINING images remaining.${NC}"
    echo -e "${YELLOW}   Consider upgrading or cleaning up unused images.${NC}"
  elif (( $(echo "$PERCENT_USED >= 70" | bc -l) )); then
    echo -e "${YELLOW}⚠ Notice: Storage quota at ${PERCENT_USED}%.${NC}"
    echo -e "${YELLOW}   $REMAINING images remaining.${NC}"
  else
    echo -e "${GREEN}✓ Storage quota healthy (${PERCENT_USED}% used).${NC}"
    echo -e "${GREEN}   $REMAINING images remaining.${NC}"
  fi

  # Recommendations
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}Recommendations${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"

  if (( TOTAL_STORED > 10000 )); then
    echo -e "${YELLOW}→${NC} Use variants to reduce storage of multiple sizes"
    echo -e "${YELLOW}→${NC} Enable automatic format conversion (WebP/AVIF)"
    echo -e "${YELLOW}→${NC} Delete unused images to reduce costs"
  fi

  if (( $(echo "$PERCENT_USED < 10" | bc -l) )); then
    echo -e "${GREEN}→${NC} Low usage - you're on track for minimal costs"
  fi

  echo -e "${GREEN}→${NC} Monitor usage in Dashboard → Images → Analytics"
  echo -e "${GREEN}→${NC} Set up billing alerts for cost control"

else
  # Fallback without jq
  echo -e "${YELLOW}Note: Install 'jq' for better output formatting${NC}\n"

  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}Usage Statistics${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}Raw Response:${NC}"
  echo "$BODY"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Usage analysis complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}For detailed analytics:${NC}"
echo -e "  Dashboard → Images → Analytics"
echo -e "  https://dash.cloudflare.com/?to=/:account/images/analytics"
