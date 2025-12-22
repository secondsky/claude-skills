#!/bin/bash
# Test MCP server connectivity and validate endpoints
# Usage: ./test-mcp-connection.sh [URL] [API_KEY]

set -e

# Default to local dev server
URL="${1:-http://localhost:8787/mcp}"
API_KEY="${2:-}"

echo "======================================"
echo "MCP Server Connection Test"
echo "======================================"
echo ""
echo "Testing: $URL"
echo ""

# Build headers
if [ -n "$API_KEY" ]; then
  HEADERS=(-H "Content-Type: application/json" -H "Authorization: Bearer $API_KEY")
  echo "🔐 Using API key authentication"
else
  HEADERS=(-H "Content-Type: application/json")
  echo "⚠️  No API key provided (testing without auth)"
fi
echo ""

# Test 1: List tools
echo "1️⃣  Testing tools/list..."
TOOLS_RESPONSE=$(curl -s -X POST "$URL" \
  "${HEADERS[@]}" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }')

if echo "$TOOLS_RESPONSE" | jq -e '.result.tools' > /dev/null 2>&1; then
  TOOL_COUNT=$(echo "$TOOLS_RESPONSE" | jq '.result.tools | length')
  echo "✅ Success: Found $TOOL_COUNT tool(s)"
  echo "$TOOLS_RESPONSE" | jq '.result.tools[] | {name: .name, description: .description}'
else
  echo "❌ Failed to list tools"
  echo "Response: $TOOLS_RESPONSE"
  exit 1
fi
echo ""

# Test 2: List resources
echo "2️⃣  Testing resources/list..."
RESOURCES_RESPONSE=$(curl -s -X POST "$URL" \
  "${HEADERS[@]}" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/list",
    "id": 2
  }')

if echo "$RESOURCES_RESPONSE" | jq -e '.result.resources' > /dev/null 2>&1; then
  RESOURCE_COUNT=$(echo "$RESOURCES_RESPONSE" | jq '.result.resources | length')
  echo "✅ Success: Found $RESOURCE_COUNT resource(s)"
  echo "$RESOURCES_RESPONSE" | jq '.result.resources[] | {uri: .uri, name: .name}'
elif echo "$RESOURCES_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "⚠️  No resources endpoint (some templates don't have resources)"
else
  echo "❌ Failed to list resources"
  echo "Response: $RESOURCES_RESPONSE"
fi
echo ""

# Test 3: List prompts
echo "3️⃣  Testing prompts/list..."
PROMPTS_RESPONSE=$(curl -s -X POST "$URL" \
  "${HEADERS[@]}" \
  -d '{
    "jsonrpc": "2.0",
    "method": "prompts/list",
    "id": 3
  }')

if echo "$PROMPTS_RESPONSE" | jq -e '.result.prompts' > /dev/null 2>&1; then
  PROMPT_COUNT=$(echo "$PROMPTS_RESPONSE" | jq '.result.prompts | length')
  echo "✅ Success: Found $PROMPT_COUNT prompt(s)"
  echo "$PROMPTS_RESPONSE" | jq '.result.prompts[] | {name: .name, description: .description}'
elif echo "$PROMPTS_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "⚠️  No prompts endpoint (some templates don't have prompts)"
else
  echo "❌ Failed to list prompts"
  echo "Response: $PROMPTS_RESPONSE"
fi
echo ""

# Test 4: Call first tool (if available)
FIRST_TOOL=$(echo "$TOOLS_RESPONSE" | jq -r '.result.tools[0].name // empty')

if [ -n "$FIRST_TOOL" ]; then
  echo "4️⃣  Testing tool call: $FIRST_TOOL..."

  # Determine arguments based on tool
  case "$FIRST_TOOL" in
    "echo")
      ARGS='{"text": "Hello, MCP!"}'
      ;;
    "add")
      ARGS='{"a": 5, "b": 3}'
      ;;
    "get-status")
      ARGS='{}'
      ;;
    *)
      echo "⚠️  Unknown tool, skipping test"
      ARGS=""
      ;;
  esac

  if [ -n "$ARGS" ]; then
    CALL_RESPONSE=$(curl -s -X POST "$URL" \
      "${HEADERS[@]}" \
      -d "{
        \"jsonrpc\": \"2.0\",
        \"method\": \"tools/call\",
        \"params\": {
          \"name\": \"$FIRST_TOOL\",
          \"arguments\": $ARGS
        },
        \"id\": 4
      }")

    if echo "$CALL_RESPONSE" | jq -e '.result' > /dev/null 2>&1; then
      echo "✅ Success: Tool executed"
      echo "$CALL_RESPONSE" | jq '.result'
    else
      echo "❌ Failed to call tool"
      echo "Response: $CALL_RESPONSE"
      exit 1
    fi
  fi
else
  echo "4️⃣  No tools to test"
fi
echo ""

# Summary
echo "======================================"
echo "✅ Connection test complete!"
echo "======================================"
echo ""
echo "Summary:"
echo "  Tools: $TOOL_COUNT"
echo "  Resources: ${RESOURCE_COUNT:-0}"
echo "  Prompts: ${PROMPT_COUNT:-0}"
echo ""
echo "Server is responding correctly! 🎉"
echo ""
