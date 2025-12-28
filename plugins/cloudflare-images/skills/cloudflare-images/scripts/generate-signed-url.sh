#!/usr/bin/env bash

# Generate Signed URL Script - Cloudflare Images
# CLI tool to generate signed URLs for private images

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

# Usage
usage() {
  echo -e "${YELLOW}Usage:${NC} $0 <image-id> [variant] [expiry-seconds]"
  echo ""
  echo "Arguments:"
  echo "  image-id         Image ID (required)"
  echo "  variant          Variant name (default: public)"
  echo "  expiry-seconds   Expiry time in seconds (default: 3600 = 1 hour)"
  echo ""
  echo "Examples:"
  echo "  $0 2cdc28f0-017a-49c4-9ed7-87056c83901"
  echo "  $0 2cdc28f0-017a-49c4-9ed7-87056c83901 thumbnail"
  echo "  $0 2cdc28f0-017a-49c4-9ed7-87056c83901 public 7200"
  echo ""
  exit 1
}

# Check required environment variables
if [ -z "$CF_ACCOUNT_HASH" ]; then
  echo -e "${RED}Error: CF_ACCOUNT_HASH not set${NC}"
  echo "Set it in .env or export CF_ACCOUNT_HASH=your_account_hash"
  echo ""
  echo "Get it from: Dashboard → Images → Serving Images → Account Hash"
  exit 1
fi

if [ -z "$CF_IMAGES_SIGNING_KEY" ]; then
  echo -e "${RED}Error: CF_IMAGES_SIGNING_KEY not set${NC}"
  echo "Set it in .env or export CF_IMAGES_SIGNING_KEY=your_signing_key"
  echo ""
  echo "Get it from: Dashboard → Images → Signing Keys → Create Key"
  echo "Or generate with: openssl rand -hex 32"
  exit 1
fi

# Parse arguments
IMAGE_ID="$1"
VARIANT="${2:-public}"
EXPIRY_SECONDS="${3:-3600}"

if [ -z "$IMAGE_ID" ]; then
  usage
fi

echo -e "${GREEN}Generating Signed URL...${NC}\n"

# Calculate expiry timestamp (Unix epoch)
EXPIRY=$(( $(date +%s) + EXPIRY_SECONDS ))

# Data to sign: imageId/variant + expiry
DATA_TO_SIGN="${IMAGE_ID}/${VARIANT}${EXPIRY}"

# Generate HMAC-SHA256 signature
SIGNATURE=$(echo -n "$DATA_TO_SIGN" | openssl dgst -sha256 -hmac "$CF_IMAGES_SIGNING_KEY" -binary | base64)

# URL-encode the signature (replace + with -, / with _, remove =)
SIGNATURE_ENCODED=$(echo "$SIGNATURE" | tr '+/' '-_' | tr -d '=')

# Construct signed URL
SIGNED_URL="https://imagedelivery.net/${CF_ACCOUNT_HASH}/${IMAGE_ID}/${VARIANT}?exp=${EXPIRY}&sig=${SIGNATURE_ENCODED}"

# Calculate expiry date/time
EXPIRY_DATE=$(date -r $EXPIRY +"%Y-%m-%d %H:%M:%S %Z" 2>/dev/null || date -d @$EXPIRY +"%Y-%m-%d %H:%M:%S %Z" 2>/dev/null || echo "Unknown")

# Output
echo -e "${GREEN}Signed URL generated successfully!${NC}\n"
echo -e "${YELLOW}Image ID:${NC}      $IMAGE_ID"
echo -e "${YELLOW}Variant:${NC}       $VARIANT"
echo -e "${YELLOW}Expires In:${NC}    $EXPIRY_SECONDS seconds ($(($EXPIRY_SECONDS / 60)) minutes)"
echo -e "${YELLOW}Expires At:${NC}    $EXPIRY_DATE"
echo -e "${YELLOW}Signature:${NC}     $SIGNATURE_ENCODED"
echo ""
echo -e "${GREEN}Signed URL:${NC}"
echo "$SIGNED_URL"
echo ""

# Test if URL is accessible
echo -e "${YELLOW}Testing URL accessibility...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SIGNED_URL")

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ URL is accessible (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}✗ URL is not accessible (HTTP $HTTP_CODE)${NC}"
  echo -e "${YELLOW}This may indicate:${NC}"
  echo -e "  - Image does not exist"
  echo -e "  - Image does not require signed URLs"
  echo -e "  - Incorrect signing key"
  echo -e "  - Invalid variant"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Copy the URL above to use in your application${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
