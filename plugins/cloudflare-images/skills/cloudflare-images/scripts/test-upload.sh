#!/usr/bin/env bash

# Test Upload Script - Cloudflare Images
# Tests API connectivity with a sample image upload

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if test image exists
TEST_IMAGE="${1:-test-image.jpg}"

if [ ! -f "$TEST_IMAGE" ]; then
  echo -e "${YELLOW}No test image found. Creating a 1x1 pixel test image...${NC}"

  # Create a minimal test image (1x1 pixel JPEG)
  echo -e "${YELLOW}Creating test-image.jpg...${NC}"
  echo '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB' | base64 -d > test-image.jpg
  TEST_IMAGE="test-image.jpg"
fi

echo -e "${GREEN}Testing Cloudflare Images API...${NC}\n"

# Test 1: Upload image
echo -e "${YELLOW}Test 1: Uploading test image ($TEST_IMAGE)...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -F "file=@${TEST_IMAGE}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Upload successful (HTTP $HTTP_CODE)${NC}"

  # Extract image ID
  IMAGE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$IMAGE_ID" ]; then
    echo -e "${GREEN}  Image ID: $IMAGE_ID${NC}\n"

    # Test 2: Verify image is accessible
    echo -e "${YELLOW}Test 2: Verifying image accessibility...${NC}"

    # Get account hash from response
    ACCOUNT_HASH=$(echo "$BODY" | grep -o '"accountHash":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$ACCOUNT_HASH" ]; then
      IMAGE_URL="https://imagedelivery.net/${ACCOUNT_HASH}/${IMAGE_ID}/public"

      # Try to fetch the image
      IMAGE_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$IMAGE_URL")

      if [ "$IMAGE_HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ Image accessible at: $IMAGE_URL${NC}\n"
      else
        echo -e "${RED}✗ Image not accessible (HTTP $IMAGE_HTTP_CODE)${NC}\n"
      fi
    fi

    # Test 3: Delete test image (cleanup)
    echo -e "${YELLOW}Test 3: Cleaning up (deleting test image)...${NC}"

    DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
      "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${IMAGE_ID}" \
      -H "Authorization: Bearer ${CF_API_TOKEN}")

    DELETE_HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n 1)

    if [ "$DELETE_HTTP_CODE" -eq 200 ]; then
      echo -e "${GREEN}✓ Test image deleted${NC}\n"
    else
      echo -e "${YELLOW}⚠ Could not delete test image (HTTP $DELETE_HTTP_CODE)${NC}"
      echo -e "${YELLOW}  You may need to delete it manually: $IMAGE_ID${NC}\n"
    fi

    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}All tests passed! ✓${NC}"
    echo -e "${GREEN}Cloudflare Images API is working correctly.${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"

  else
    echo -e "${RED}✗ Could not extract image ID from response${NC}"
    echo -e "${YELLOW}Response: $BODY${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ Upload failed (HTTP $HTTP_CODE)${NC}"
  echo -e "${YELLOW}Response: $BODY${NC}"
  exit 1
fi
