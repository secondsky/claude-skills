#!/bin/bash
# Validates R2 binding configuration in wrangler.jsonc

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WRANGLER_FILE="wrangler.jsonc"
ERRORS=0
WARNINGS=0

echo "🔍 R2 Configuration Validator"
echo "=============================="
echo ""

# Check if wrangler.jsonc exists
if [ ! -f "$WRANGLER_FILE" ]; then
    echo -e "${RED}❌ Error: $WRANGLER_FILE not found${NC}"
    exit 1
fi

echo "✓ Found $WRANGLER_FILE"
echo ""

# Extract r2_buckets array using grep and sed (avoiding jq dependency)
echo "📋 Checking R2 bucket configuration..."
echo ""

# Check if r2_buckets field exists
if ! grep -q '"r2_buckets"' "$WRANGLER_FILE"; then
    echo -e "${RED}❌ Error: No r2_buckets configuration found${NC}"
    exit 1
fi

echo "✓ r2_buckets field exists"
echo ""

# Validate bucket name format (3-63 chars, lowercase, numbers, hyphens)
# Extract bucket names and validate each
BUCKET_NAMES=$(grep -oP '"bucket_name"\s*:\s*"\K[^"]+' "$WRANGLER_FILE" || true)

if [ -z "$BUCKET_NAMES" ]; then
    echo -e "${YELLOW}⚠ Warning: No bucket names found in configuration${NC}"
    ((WARNINGS++))
else
    echo "Validating bucket names:"
    while IFS= read -r bucket; do
        # Check length (3-63 chars)
        LENGTH=${#bucket}
        if [ "$LENGTH" -lt 3 ] || [ "$LENGTH" -gt 63 ]; then
            echo -e "${RED}  ❌ '$bucket': Invalid length ($LENGTH chars, must be 3-63)${NC}"
            ((ERRORS++))
        else
            echo -e "${GREEN}  ✓ '$bucket': Valid length${NC}"
        fi

        # Check format (lowercase, numbers, hyphens only)
        if ! echo "$bucket" | grep -qE '^[a-z0-9][a-z0-9-]*[a-z0-9]$'; then
            echo -e "${RED}  ❌ '$bucket': Invalid format (must be lowercase, numbers, hyphens only)${NC}"
            ((ERRORS++))
        else
            echo -e "${GREEN}  ✓ '$bucket': Valid format${NC}"
        fi
    done <<< "$BUCKET_NAMES"
fi

echo ""

# Validate binding names (should be uppercase, valid TypeScript identifiers)
BINDING_NAMES=$(grep -oP '"binding"\s*:\s*"\K[^"]+' "$WRANGLER_FILE" || true)

if [ -z "$BINDING_NAMES" ]; then
    echo -e "${YELLOW}⚠ Warning: No binding names found in configuration${NC}"
    ((WARNINGS++))
else
    echo "Validating binding names:"
    while IFS= read -r binding; do
        # Check if uppercase
        if [ "$binding" != "$(echo "$binding" | tr '[:lower:]' '[:upper:]')" ]; then
            echo -e "${YELLOW}  ⚠ '$binding': Should be uppercase (recommended)${NC}"
            ((WARNINGS++))
        else
            echo -e "${GREEN}  ✓ '$binding': Uppercase${NC}"
        fi

        # Check if valid TypeScript identifier
        if ! echo "$binding" | grep -qE '^[A-Z_][A-Z0-9_]*$'; then
            echo -e "${RED}  ❌ '$binding': Invalid TypeScript identifier${NC}"
            ((ERRORS++))
        else
            echo -e "${GREEN}  ✓ '$binding': Valid identifier${NC}"
        fi
    done <<< "$BINDING_NAMES"
fi

echo ""

# Check if buckets exist in Cloudflare account (requires wrangler CLI)
if command -v wrangler &> /dev/null; then
    echo "Checking bucket existence (requires authentication):"
    while IFS= read -r bucket; do
        if wrangler r2 bucket list 2>/dev/null | grep -q "$bucket"; then
            echo -e "${GREEN}  ✓ '$bucket': Exists in account${NC}"
        else
            echo -e "${YELLOW}  ⚠ '$bucket': Not found in account (may need creation)${NC}"
            ((WARNINGS++))
        fi
    done <<< "$BUCKET_NAMES"
else
    echo -e "${YELLOW}⚠ Skipping bucket existence check (wrangler CLI not found)${NC}"
    ((WARNINGS++))
fi

echo ""
echo "=============================="
echo "Summary:"
echo -e "  Errors: ${RED}$ERRORS${NC}"
echo -e "  Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ "$ERRORS" -gt 0 ]; then
    echo -e "${RED}❌ Validation failed with $ERRORS error(s)${NC}"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Validation passed with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${GREEN}✅ All checks passed!${NC}"
    exit 0
fi
