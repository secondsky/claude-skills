#!/bin/bash

# Cloudflare Workers KV - Namespace Setup Wizard
# Interactive script to create and configure KV namespaces

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Cloudflare Workers KV - Namespace Setup Wizard${NC}"
echo "================================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo -e "${RED}Error:${NC} Wrangler CLI not installed"
  echo "Install: npm install -g wrangler"
  exit 1
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
  echo -e "${YELLOW}⚠${NC} Not logged in to Wrangler"
  echo ""
  echo "Please login first:"
  echo "  wrangler login"
  exit 1
fi

# Get namespace name
if [ -z "$1" ]; then
  echo "Enter namespace name (e.g., 'MY_KV' or 'USER_DATA'):"
  read -r NAMESPACE_NAME
else
  NAMESPACE_NAME=$1
fi

# Validate namespace name
if [ -z "$NAMESPACE_NAME" ]; then
  echo -e "${RED}Error:${NC} Namespace name cannot be empty"
  exit 1
fi

# Convert to uppercase and replace hyphens/spaces with underscores
NAMESPACE_NAME=$(echo "$NAMESPACE_NAME" | tr '[:lower:]' '[:upper:]' | tr '-' '_' | tr ' ' '_')

echo ""
echo -e "${BLUE}Creating KV namespaces for: $NAMESPACE_NAME${NC}"
echo ""

# Create production namespace
echo "Step 1: Creating production namespace..."
PROD_OUTPUT=$(wrangler kv namespace create "$NAMESPACE_NAME" 2>&1)

if echo "$PROD_OUTPUT" | grep -q "id"; then
  PROD_ID=$(echo "$PROD_OUTPUT" | grep -oE 'id = "[a-f0-9]{32}"' | cut -d'"' -f2)
  echo -e "${GREEN}✓${NC} Production namespace created"
  echo "   ID: $PROD_ID"
else
  echo -e "${RED}✗${NC} Failed to create production namespace"
  echo "$PROD_OUTPUT"
  exit 1
fi

echo ""

# Create preview namespace
echo "Step 2: Creating preview namespace..."
PREVIEW_OUTPUT=$(wrangler kv namespace create "${NAMESPACE_NAME}_preview" 2>&1)

if echo "$PREVIEW_OUTPUT" | grep -q "id"; then
  PREVIEW_ID=$(echo "$PREVIEW_OUTPUT" | grep -oE 'id = "[a-f0-9]{32}"' | cut -d'"' -f2)
  echo -e "${GREEN}✓${NC} Preview namespace created"
  echo "   ID: $PREVIEW_ID"
else
  echo -e "${YELLOW}⚠${NC} Failed to create preview namespace (continuing anyway)"
  PREVIEW_ID=""
fi

echo ""
echo -e "${GREEN}✓ Namespaces created successfully!${NC}"
echo ""

# Generate wrangler.jsonc configuration
echo "Step 3: Generating wrangler.jsonc configuration..."
echo ""

KV_CONFIG="  \"kv_namespaces\": [
    {
      \"binding\": \"$NAMESPACE_NAME\",
      \"id\": \"$PROD_ID\""

if [ -n "$PREVIEW_ID" ]; then
  KV_CONFIG="$KV_CONFIG,
      \"preview_id\": \"$PREVIEW_ID\""
fi

KV_CONFIG="$KV_CONFIG
    }
  ]"

echo "Add this to your wrangler.jsonc:"
echo ""
echo -e "${BLUE}$KV_CONFIG${NC}"
echo ""

# Check if wrangler.jsonc exists
if [ -f "wrangler.jsonc" ]; then
  echo -e "${YELLOW}Note:${NC} wrangler.jsonc exists. You'll need to manually add the KV namespace configuration."
  echo ""
  echo "Would you like to see your current wrangler.jsonc? (y/n)"
  read -r SHOW_CONFIG

  if [ "$SHOW_CONFIG" = "y" ] || [ "$SHOW_CONFIG" = "Y" ]; then
    echo ""
    cat wrangler.jsonc
    echo ""
  fi
elif [ -f "wrangler.json" ]; then
  echo -e "${YELLOW}Note:${NC} wrangler.json exists. You'll need to manually add the KV namespace configuration."
else
  echo -e "${YELLOW}Note:${NC} No wrangler.jsonc found in current directory."
  echo ""
  echo "Would you like to create a basic wrangler.jsonc? (y/n)"
  read -r CREATE_CONFIG

  if [ "$CREATE_CONFIG" = "y" ] || [ "$CREATE_CONFIG" = "Y" ]; then
    cat > wrangler.jsonc << EOF
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "$(date +%Y-%m-%d)",
$KV_CONFIG
}
EOF
    echo -e "${GREEN}✓${NC} Created wrangler.jsonc"
  fi
fi

echo ""
echo "Step 4: TypeScript type definition example..."
echo ""
echo "Add this to your Worker code for TypeScript support:"
echo ""
echo -e "${BLUE}type Env = {
  $NAMESPACE_NAME: KVNamespace;
};${NC}"
echo ""

echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Ensure wrangler.jsonc has the KV namespace configuration"
echo "2. Use env.$NAMESPACE_NAME in your Worker code"
echo "3. Test with: wrangler dev"
echo ""
echo "Example usage:"
echo -e "${BLUE}export default {
  async fetch(request, env: Env) {
    await env.$NAMESPACE_NAME.put('key', 'value');
    const value = await env.$NAMESPACE_NAME.get('key');
    return new Response(value);
  }
};${NC}"
echo ""
