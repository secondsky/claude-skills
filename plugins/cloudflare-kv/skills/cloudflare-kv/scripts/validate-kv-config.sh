#!/bin/bash

# Cloudflare Workers KV - Configuration Validator
# Validates wrangler.jsonc KV namespace configuration

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "Cloudflare Workers KV - Configuration Validator"
echo "==============================================="
echo ""

# Determine config file
CONFIG_FILE=${1:-wrangler.jsonc}

# Check if config exists
if [ ! -f "$CONFIG_FILE" ]; then
  if [ -f "wrangler.json" ]; then
    CONFIG_FILE="wrangler.json"
    echo "Using wrangler.json"
  else
    echo -e "${RED}Error:${NC} No wrangler.jsonc or wrangler.json found"
    echo "Usage: $0 [path/to/wrangler.jsonc]"
    exit 1
  fi
else
  echo "Validating: $CONFIG_FILE"
fi

echo ""

# Initialize counters
ERRORS=0
WARNINGS=0

# Check if KV namespaces are configured
echo "Checking KV namespace configuration..."
echo ""

if grep -q "kv_namespaces" "$CONFIG_FILE"; then
  echo -e "${GREEN}✓${NC} KV namespaces section found"

  # Count namespaces
  NAMESPACE_COUNT=$(grep -c "\"binding\"" "$CONFIG_FILE" || echo "0")
  echo -e "${GREEN}✓${NC} Found $NAMESPACE_COUNT namespace(s) configured"
  echo ""

  # Validate each namespace
  echo "Validating namespace configurations..."
  echo ""

  # Extract namespace bindings
  BINDINGS=$(grep "\"binding\"" "$CONFIG_FILE" | sed 's/.*"binding": "\([^"]*\)".*/\1/')

  for BINDING in $BINDINGS; do
    echo "Namespace: $BINDING"

    # Check binding name format (should be uppercase, no spaces)
    if echo "$BINDING" | grep -qE '^[A-Z_][A-Z0-9_]*$'; then
      echo -e "  ${GREEN}✓${NC} Binding name format is valid"
    else
      echo -e "  ${YELLOW}⚠${NC} Binding name should be UPPERCASE_WITH_UNDERSCORES"
      WARNINGS=$((WARNINGS + 1))
    fi

    # Extract namespace ID for this binding
    NAMESPACE_ID=$(grep -A2 "\"binding\": \"$BINDING\"" "$CONFIG_FILE" | grep "\"id\"" | grep -oE '[a-f0-9]{32}' | head -1)

    if [ -n "$NAMESPACE_ID" ]; then
      echo -e "  ${GREEN}✓${NC} Namespace ID found: $NAMESPACE_ID"

      # Validate ID format (32 hex characters)
      if echo "$NAMESPACE_ID" | grep -qE '^[a-f0-9]{32}$'; then
        echo -e "  ${GREEN}✓${NC} ID format is valid"
      else
        echo -e "  ${RED}✗${NC} Invalid namespace ID format"
        ERRORS=$((ERRORS + 1))
      fi
    else
      echo -e "  ${RED}✗${NC} No namespace ID found"
      ERRORS=$((ERRORS + 1))
    fi

    # Check for preview_id
    PREVIEW_ID=$(grep -A3 "\"binding\": \"$BINDING\"" "$CONFIG_FILE" | grep "\"preview_id\"" | grep -oE '[a-f0-9]{32}' | head -1)

    if [ -n "$PREVIEW_ID" ]; then
      echo -e "  ${GREEN}✓${NC} Preview ID found: $PREVIEW_ID"
    else
      echo -e "  ${YELLOW}⚠${NC} No preview_id configured (recommended for testing)"
      WARNINGS=$((WARNINGS + 1))
    fi

    echo ""
  done

else
  echo -e "${RED}✗${NC} No kv_namespaces section found in $CONFIG_FILE"
  echo ""
  echo "Add KV namespace configuration:"
  echo '  "kv_namespaces": ['
  echo '    {'
  echo '      "binding": "MY_KV_NAMESPACE",'
  echo '      "id": "your-namespace-id",'
  echo '      "preview_id": "your-preview-id"'
  echo '    }'
  echo '  ]'
  ERRORS=$((ERRORS + 1))
  echo ""
fi

# Check for common issues
echo "Checking for common issues..."
echo ""

# Check for duplicate bindings
DUPLICATE_BINDINGS=$(grep "\"binding\"" "$CONFIG_FILE" | sed 's/.*"binding": "\([^"]*\)".*/\1/' | sort | uniq -d)

if [ -n "$DUPLICATE_BINDINGS" ]; then
  echo -e "${RED}✗${NC} Duplicate binding names found:"
  echo "$DUPLICATE_BINDINGS"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} No duplicate bindings"
fi

# Check for lowercase bindings (common mistake)
LOWERCASE_BINDINGS=$(grep "\"binding\"" "$CONFIG_FILE" | grep -E '"binding": "[a-z]' || true)

if [ -n "$LOWERCASE_BINDINGS" ]; then
  echo -e "${YELLOW}⚠${NC} Bindings with lowercase letters found (should be UPPERCASE)"
  echo "$LOWERCASE_BINDINGS"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✓${NC} All bindings use uppercase naming"
fi

# Check JSON syntax (basic)
if command -v jq &> /dev/null; then
  if jq empty "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} JSON syntax is valid"
  else
    echo -e "${RED}✗${NC} JSON syntax error detected"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "${YELLOW}⚠${NC} jq not installed (cannot validate JSON syntax)"
  echo "  Install: brew install jq (macOS) or apt-get install jq (Linux)"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "Summary:"
echo "========"
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Configuration is valid!${NC}"
  else
    echo -e "${YELLOW}⚠ Configuration is valid but has warnings${NC}"
  fi
  echo ""
  echo "You can now:"
  echo "1. Test your Worker: wrangler dev"
  echo "2. Deploy to production: wrangler deploy"
  exit 0
else
  echo -e "${RED}✗ Configuration has errors that need to be fixed${NC}"
  echo ""
  echo "Please correct the errors above and run this script again."
  exit 1
fi
