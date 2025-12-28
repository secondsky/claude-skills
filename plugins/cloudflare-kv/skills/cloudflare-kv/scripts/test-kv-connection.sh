#!/bin/bash

# Cloudflare Workers KV - Connection Tester
# Tests KV namespace connection and basic operations

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Cloudflare Workers KV - Connection Tester"
echo "=========================================="
echo ""

# Check if namespace binding name provided
if [ -z "$1" ]; then
  echo -e "${RED}Error:${NC} No namespace binding name provided"
  echo "Usage: $0 <NAMESPACE_BINDING>"
  echo ""
  echo "Example: $0 MY_KV_NAMESPACE"
  echo ""
  echo "The namespace binding should match what's in your wrangler.jsonc:"
  echo '  "kv_namespaces": [{ "binding": "MY_KV_NAMESPACE", "id": "..." }]'
  exit 1
fi

NAMESPACE=$1

echo "Testing namespace: $NAMESPACE"
echo ""

# Check if wrangler.jsonc exists
if [ ! -f "wrangler.jsonc" ] && [ ! -f "wrangler.json" ]; then
  echo -e "${RED}Error:${NC} No wrangler.jsonc or wrangler.json found"
  echo "Please run this script from your Worker project root"
  exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo -e "${RED}Error:${NC} Wrangler CLI not installed"
  echo "Install: npm install -g wrangler"
  exit 1
fi

echo "Step 1: Checking namespace configuration..."
echo ""

# Verify namespace exists in config
CONFIG_FILE="wrangler.jsonc"
if [ ! -f "$CONFIG_FILE" ]; then
  CONFIG_FILE="wrangler.json"
fi

if grep -q "\"binding\": \"$NAMESPACE\"" "$CONFIG_FILE"; then
  echo -e "${GREEN}✓${NC} Namespace binding found in $CONFIG_FILE"

  # Extract namespace ID
  NAMESPACE_ID=$(grep -A2 "\"binding\": \"$NAMESPACE\"" "$CONFIG_FILE" | grep "\"id\"" | grep -oE '[a-f0-9]{32}' | head -1)

  if [ -n "$NAMESPACE_ID" ]; then
    echo -e "${GREEN}✓${NC} Namespace ID: $NAMESPACE_ID"
  else
    echo -e "${YELLOW}⚠${NC} Could not extract namespace ID from config"
  fi
else
  echo -e "${RED}✗${NC} Namespace binding '$NAMESPACE' not found in $CONFIG_FILE"
  echo ""
  echo "Add it to your $CONFIG_FILE:"
  echo '  "kv_namespaces": ['
  echo '    {'
  echo "      \"binding\": \"$NAMESPACE\","
  echo '      "id": "your-namespace-id"'
  echo '    }'
  echo '  ]'
  exit 1
fi

echo ""
echo "Step 2: Testing KV operations..."
echo ""

# Test key for CRUD operations
TEST_KEY="__test_connection_$(date +%s)"
TEST_VALUE="test_value_$(date +%s)"

echo "Test key: $TEST_KEY"
echo ""

# Test 1: PUT operation
echo -n "Testing PUT operation... "
if wrangler kv key put --binding="$NAMESPACE" --local "$TEST_KEY" "$TEST_VALUE" &> /dev/null; then
  echo -e "${GREEN}✓ Success${NC}"
  PUT_SUCCESS=true
else
  echo -e "${RED}✗ Failed${NC}"
  PUT_SUCCESS=false
fi

# Test 2: GET operation
if [ "$PUT_SUCCESS" = true ]; then
  echo -n "Testing GET operation... "
  RETRIEVED=$(wrangler kv key get --binding="$NAMESPACE" --local "$TEST_KEY" 2>/dev/null)

  if [ "$RETRIEVED" = "$TEST_VALUE" ]; then
    echo -e "${GREEN}✓ Success (value matches)${NC}"
    GET_SUCCESS=true
  else
    echo -e "${RED}✗ Failed (value mismatch)${NC}"
    GET_SUCCESS=false
  fi
fi

# Test 3: DELETE operation
if [ "$PUT_SUCCESS" = true ]; then
  echo -n "Testing DELETE operation... "
  if wrangler kv key delete --binding="$NAMESPACE" --local "$TEST_KEY" &> /dev/null; then
    echo -e "${GREEN}✓ Success${NC}"
    DELETE_SUCCESS=true
  else
    echo -e "${RED}✗ Failed${NC}"
    DELETE_SUCCESS=false
  fi
fi

# Test 4: Verify deletion
if [ "$DELETE_SUCCESS" = true ]; then
  echo -n "Verifying deletion... "
  AFTER_DELETE=$(wrangler kv key get --binding="$NAMESPACE" --local "$TEST_KEY" 2>/dev/null)

  if [ -z "$AFTER_DELETE" ]; then
    echo -e "${GREEN}✓ Success (key removed)${NC}"
  else
    echo -e "${YELLOW}⚠ Warning (key still exists)${NC}"
  fi
fi

echo ""
echo "Summary:"
echo "========"

if [ "$PUT_SUCCESS" = true ] && [ "$GET_SUCCESS" = true ] && [ "$DELETE_SUCCESS" = true ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "Your KV namespace '$NAMESPACE' is working correctly."
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "1. Ensure namespace ID is correct in $CONFIG_FILE"
  echo "2. Check Cloudflare account permissions"
  echo "3. Verify wrangler is logged in: wrangler login"
  exit 1
fi
