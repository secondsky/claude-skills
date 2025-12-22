#!/bin/bash
# FastMCP Server Tester
# Tests a FastMCP server using the FastMCP Client

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "======================================"
echo "FastMCP Server Tester"
echo "======================================"
echo ""

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <server.py> [--http] [--port 8000]"
    echo ""
    echo "Examples:"
    echo "  $0 server.py                    # Test stdio server"
    echo "  $0 server.py --http --port 8000 # Test HTTP server"
    exit 1
fi

SERVER_PATH=$1
TRANSPORT="stdio"
PORT="8000"

# Parse arguments
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --http)
            TRANSPORT="http"
            shift
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if server file exists
if [ ! -f "$SERVER_PATH" ]; then
    echo -e "${RED}✗${NC} Server file not found: $SERVER_PATH"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found server: $SERVER_PATH"
echo -e "${GREEN}✓${NC} Transport: $TRANSPORT"
if [ "$TRANSPORT" = "http" ]; then
    echo -e "${GREEN}✓${NC} Port: $PORT"
fi
echo ""

# Create test script
TEST_SCRIPT=$(mktemp)
cat > "$TEST_SCRIPT" << 'EOF'
import asyncio
import sys
from fastmcp import Client

async def test_server(server_path, transport, port):
    """Test MCP server."""
    print("Starting server test...\n")

    try:
        if transport == "http":
            server_url = f"http://localhost:{port}/mcp"
            print(f"Connecting to HTTP server at {server_url}...")
            client_context = Client(server_url)
        else:
            print(f"Connecting to stdio server: {server_path}...")
            client_context = Client(server_path)

        async with client_context as client:
            print("✓ Connected to server\n")

            # Test: List tools
            print("Testing: List tools")
            tools = await client.list_tools()
            print(f"✓ Found {len(tools)} tools")
            for tool in tools:
                print(f"  - {tool.name}: {tool.description[:60]}...")
            print()

            # Test: List resources
            print("Testing: List resources")
            resources = await client.list_resources()
            print(f"✓ Found {len(resources)} resources")
            for resource in resources:
                print(f"  - {resource.uri}: {resource.description[:60] if resource.description else 'No description'}...")
            print()

            # Test: List prompts
            print("Testing: List prompts")
            prompts = await client.list_prompts()
            print(f"✓ Found {len(prompts)} prompts")
            for prompt in prompts:
                print(f"  - {prompt.name}: {prompt.description[:60] if prompt.description else 'No description'}...")
            print()

            # Test: Call first tool (if any)
            if tools:
                print(f"Testing: Call tool '{tools[0].name}'")
                try:
                    # Try calling with empty args (may fail if required params)
                    result = await client.call_tool(tools[0].name, {})
                    print(f"✓ Tool executed successfully")
                    print(f"  Result: {str(result.data)[:100]}...")
                except Exception as e:
                    print(f"⚠ Tool call failed (may require parameters): {e}")
                print()

            # Test: Read first resource (if any)
            if resources:
                print(f"Testing: Read resource '{resources[0].uri}'")
                try:
                    data = await client.read_resource(resources[0].uri)
                    print(f"✓ Resource read successfully")
                    print(f"  Data: {str(data)[:100]}...")
                except Exception as e:
                    print(f"✗ Failed to read resource: {e}")
                print()

            print("=" * 50)
            print("✓ Server test completed successfully!")
            print("=" * 50)
            return 0

    except Exception as e:
        print(f"\n✗ Server test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    server_path = sys.argv[1]
    transport = sys.argv[2] if len(sys.argv) > 2 else "stdio"
    port = sys.argv[3] if len(sys.argv) > 3 else "8000"

    exit_code = asyncio.run(test_server(server_path, transport, port))
    sys.exit(exit_code)
EOF

# Run test
echo "Running tests..."
echo ""

if [ "$TRANSPORT" = "http" ]; then
    # For HTTP, start server in background
    echo "Starting HTTP server in background..."
    python3 "$SERVER_PATH" --transport http --port "$PORT" &
    SERVER_PID=$!

    # Wait for server to start
    sleep 2

    # Run test
    python3 "$TEST_SCRIPT" "$SERVER_PATH" "$TRANSPORT" "$PORT"
    TEST_EXIT=$?

    # Kill server
    kill $SERVER_PID 2>/dev/null || true

    # Cleanup
    rm "$TEST_SCRIPT"

    exit $TEST_EXIT
else
    # For stdio, run test directly
    python3 "$TEST_SCRIPT" "$SERVER_PATH" "$TRANSPORT"
    TEST_EXIT=$?

    # Cleanup
    rm "$TEST_SCRIPT"

    exit $TEST_EXIT
fi
