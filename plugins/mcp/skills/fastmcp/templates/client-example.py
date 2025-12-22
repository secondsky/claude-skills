"""
FastMCP Client Example
======================
Testing MCP servers with the FastMCP Client.
"""

import asyncio
from fastmcp import Client
from typing import Optional


async def test_basic_server():
    """Test a basic MCP server."""
    print("\n=== Testing Basic Server ===\n")

    async with Client("basic-server.py") as client:
        # List available tools
        tools = await client.list_tools()
        print(f"Available tools: {len(tools)}")
        for tool in tools:
            print(f"  - {tool.name}: {tool.description}")

        # Call a tool
        print("\nCalling 'greet' tool...")
        result = await client.call_tool("greet", {"name": "World"})
        print(f"Result: {result.data}")

        # Call another tool
        print("\nCalling 'calculate' tool...")
        result = await client.call_tool("calculate", {
            "operation": "add",
            "a": 10,
            "b": 5
        })
        print(f"Result: {result.data}")

        # List resources
        print("\nAvailable resources:")
        resources = await client.list_resources()
        for resource in resources:
            print(f"  - {resource.uri}: {resource.description}")

        # Read a resource
        print("\nReading 'info://status' resource...")
        status = await client.read_resource("info://status")
        print(f"Status: {status}")


async def test_tools_examples():
    """Test the tools examples server."""
    print("\n=== Testing Tools Examples ===\n")

    async with Client("tools-examples.py") as client:
        # Test sync tool
        print("Testing sync tool...")
        result = await client.call_tool("simple_sync_tool", {"text": "hello"})
        print(f"Sync result: {result.data}")

        # Test async tool
        print("\nTesting async tool...")
        result = await client.call_tool("simple_async_tool", {"text": "WORLD"})
        print(f"Async result: {result.data}")

        # Test validated search
        print("\nTesting validated search...")
        result = await client.call_tool("validated_search", {
            "params": {
                "query": "python",
                "limit": 5
            }
        })
        print(f"Search result: {result.data}")

        # Test batch processing
        print("\nTesting batch process...")
        result = await client.call_tool("batch_process", {
            "items": ["item1", "item2", "item3"]
        })
        print(f"Batch result: {result.data}")


async def test_resources_examples():
    """Test the resources examples server."""
    print("\n=== Testing Resources Examples ===\n")

    async with Client("resources-examples.py") as client:
        # List all resources
        resources = await client.list_resources()
        print(f"Total resources: {len(resources)}")

        # Test static resource
        print("\nReading static resource...")
        config = await client.read_resource("data://config")
        print(f"Config: {config}")

        # Test dynamic resource
        print("\nReading dynamic resource...")
        status = await client.read_resource("info://status")
        print(f"Status: {status}")

        # Test resource template
        print("\nReading resource template...")
        profile = await client.read_resource("user://123/profile")
        print(f"User profile: {profile}")


async def test_with_error_handling():
    """Test server with comprehensive error handling."""
    print("\n=== Testing with Error Handling ===\n")

    async with Client("error-handling.py") as client:
        # Test successful operation
        print("Testing successful operation...")
        try:
            result = await client.call_tool("divide_numbers", {
                "a": 10,
                "b": 2
            })
            print(f"Success: {result.data}")
        except Exception as e:
            print(f"Error: {e}")

        # Test error case
        print("\nTesting error case (division by zero)...")
        try:
            result = await client.call_tool("divide_numbers", {
                "a": 10,
                "b": 0
            })
            print(f"Result: {result.data}")
        except Exception as e:
            print(f"Error: {e}")

        # Test validation error
        print("\nTesting validation error...")
        try:
            result = await client.call_tool("validated_operation", {
                "data": ""
            })
            print(f"Result: {result.data}")
        except Exception as e:
            print(f"Error: {e}")


async def test_http_server():
    """Test server running on HTTP transport."""
    print("\n=== Testing HTTP Server ===\n")

    # Note: Server must be running on http://localhost:8000
    # Start with: python server.py --transport http --port 8000

    try:
        async with Client("http://localhost:8000/mcp") as client:
            print("Connected to HTTP server")

            tools = await client.list_tools()
            print(f"Available tools: {len(tools)}")

            if tools:
                result = await client.call_tool(tools[0].name, {})
                print(f"Tool result: {result.data}")

    except Exception as e:
        print(f"Could not connect to HTTP server: {e}")
        print("Make sure server is running with: python server.py --transport http --port 8000")


async def test_with_handlers():
    """Test server with client handlers (elicitation, progress, sampling)."""
    print("\n=== Testing with Handlers ===\n")

    # Define handlers
    async def elicitation_handler(message: str, response_type: type, context: dict):
        """Handle elicitation requests."""
        print(f"\n[ELICIT] {message}")
        return input("Your response: ")

    async def progress_handler(progress: float, total: Optional[float], message: Optional[str]):
        """Handle progress updates."""
        if total:
            pct = (progress / total) * 100
            print(f"\r[PROGRESS] {pct:.1f}% - {message}", end="", flush=True)
        else:
            print(f"\n[PROGRESS] {message}")

    async def sampling_handler(messages, params, context):
        """Handle sampling requests (LLM completions)."""
        print(f"\n[SAMPLE] LLM request with {len(messages)} messages")
        # In production, call actual LLM
        return {
            "content": "Mock LLM response",
            "model": params.get("model", "mock"),
            "usage": {"tokens": 100}
        }

    # Create client with handlers
    async with Client(
        "server.py",
        elicitation_handler=elicitation_handler,
        progress_handler=progress_handler,
        sampling_handler=sampling_handler
    ) as client:
        print("Client created with handlers")

        # Test tools that use handlers
        # Note: Requires server to have tools using context.request_elicitation, etc.
        tools = await client.list_tools()
        print(f"Available tools: {len(tools)}")


async def comprehensive_test():
    """Run comprehensive test suite."""
    print("=" * 60)
    print("FastMCP Client Test Suite")
    print("=" * 60)

    tests = [
        ("Basic Server", test_basic_server),
        ("Tools Examples", test_tools_examples),
        ("Resources Examples", test_resources_examples),
        ("Error Handling", test_with_error_handling),
        # ("HTTP Server", test_http_server),  # Uncomment if HTTP server is running
        # ("With Handlers", test_with_handlers),  # Uncomment if server supports handlers
    ]

    for test_name, test_func in tests:
        try:
            await test_func()
        except Exception as e:
            print(f"\n❌ {test_name} failed: {e}")
        else:
            print(f"\n✅ {test_name} passed")

        print("\n" + "-" * 60)

    print("\nTest suite completed!")


async def interactive_client():
    """Interactive client for manual testing."""
    print("\n=== Interactive FastMCP Client ===\n")

    server_path = input("Enter server path or URL: ").strip()

    if not server_path:
        server_path = "basic-server.py"
        print(f"Using default: {server_path}")

    async with Client(server_path) as client:
        print(f"\n✅ Connected to: {server_path}\n")

        while True:
            print("\nOptions:")
            print("1. List tools")
            print("2. List resources")
            print("3. Call tool")
            print("4. Read resource")
            print("5. Exit")

            choice = input("\nChoice: ").strip()

            if choice == "1":
                tools = await client.list_tools()
                print(f"\n📋 Available tools ({len(tools)}):")
                for i, tool in enumerate(tools, 1):
                    print(f"  {i}. {tool.name}")
                    print(f"     {tool.description}")

            elif choice == "2":
                resources = await client.list_resources()
                print(f"\n📋 Available resources ({len(resources)}):")
                for i, resource in enumerate(resources, 1):
                    print(f"  {i}. {resource.uri}")
                    print(f"     {resource.description}")

            elif choice == "3":
                tool_name = input("Tool name: ").strip()
                print("Arguments (as JSON): ")
                import json
                try:
                    args = json.loads(input().strip())
                    result = await client.call_tool(tool_name, args)
                    print(f"\n✅ Result: {result.data}")
                except Exception as e:
                    print(f"\n❌ Error: {e}")

            elif choice == "4":
                uri = input("Resource URI: ").strip()
                try:
                    data = await client.read_resource(uri)
                    print(f"\n✅ Data: {data}")
                except Exception as e:
                    print(f"\n❌ Error: {e}")

            elif choice == "5":
                print("\nGoodbye!")
                break

            else:
                print("Invalid choice")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        asyncio.run(interactive_client())
    else:
        asyncio.run(comprehensive_test())
