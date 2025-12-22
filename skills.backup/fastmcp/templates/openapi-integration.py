"""
FastMCP OpenAPI Integration Template
=====================================
Auto-generate MCP server from OpenAPI/Swagger specification.
"""

from fastmcp import FastMCP
from fastmcp.server.openapi import RouteMap, MCPType
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# Configuration
# ============================================================================

API_BASE_URL = os.getenv("API_BASE_URL", "https://api.example.com")
API_KEY = os.getenv("API_KEY", "")
OPENAPI_SPEC_URL = os.getenv("OPENAPI_SPEC_URL", f"{API_BASE_URL}/openapi.json")

# ============================================================================
# Load OpenAPI Specification
# ============================================================================

def load_openapi_spec():
    """Load OpenAPI specification from URL or file."""
    try:
        # Try loading from URL
        response = httpx.get(OPENAPI_SPEC_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Failed to load OpenAPI spec from URL: {e}")

        # Fallback: try loading from local file
        try:
            import json
            with open("openapi.json") as f:
                return json.load(f)
        except FileNotFoundError:
            print("Error: OpenAPI spec not found. Please provide OPENAPI_SPEC_URL or openapi.json file")
            return None


spec = load_openapi_spec()

# ============================================================================
# Create Authenticated HTTP Client
# ============================================================================

client = httpx.AsyncClient(
    base_url=API_BASE_URL,
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    },
    timeout=httpx.Timeout(30.0),
    limits=httpx.Limits(
        max_keepalive_connections=5,
        max_connections=10
    )
)

# ============================================================================
# Define Route Mapping Strategy
# ============================================================================

route_maps = [
    # GET endpoints with path parameters → Resource Templates
    # Example: /users/{user_id} → resource template
    RouteMap(
        methods=["GET"],
        pattern=r".*\{.*\}.*",  # Has path parameters
        mcp_type=MCPType.RESOURCE_TEMPLATE
    ),

    # GET endpoints without parameters → Static Resources
    # Example: /users → static resource
    RouteMap(
        methods=["GET"],
        pattern=r"^(?!.*\{.*\}).*$",  # No path parameters
        mcp_type=MCPType.RESOURCE
    ),

    # POST/PUT/PATCH → Tools (create/update operations)
    RouteMap(
        methods=["POST", "PUT", "PATCH"],
        mcp_type=MCPType.TOOL
    ),

    # DELETE → Tools (delete operations)
    RouteMap(
        methods=["DELETE"],
        mcp_type=MCPType.TOOL
    ),

    # Exclude internal endpoints
    RouteMap(
        pattern=r"/internal/.*",
        mcp_type=MCPType.EXCLUDE
    ),

    # Exclude health checks
    RouteMap(
        pattern=r"/(health|healthz|readiness|liveness)",
        mcp_type=MCPType.EXCLUDE
    )
]

# ============================================================================
# Generate MCP Server from OpenAPI
# ============================================================================

if spec:
    mcp = FastMCP.from_openapi(
        openapi_spec=spec,
        client=client,
        name="API Integration Server",
        route_maps=route_maps
    )

    print(f"✅ Generated MCP server from OpenAPI spec")
    print(f"   Base URL: {API_BASE_URL}")

else:
    # Fallback: create empty server if spec not available
    mcp = FastMCP("API Integration Server")
    print("⚠️  Running without OpenAPI spec - please configure OPENAPI_SPEC_URL")


# ============================================================================
# Add Custom Tools (on top of auto-generated ones)
# ============================================================================

@mcp.tool()
async def process_api_response(data: dict, operation: str = "format") -> dict:
    """
    Process API response data.

    Custom tool to transform or analyze data from API endpoints.
    """
    if operation == "format":
        # Format the data nicely
        return {
            "formatted": True,
            "data": data,
            "count": len(data) if isinstance(data, (list, dict)) else 1
        }

    elif operation == "summarize":
        # Summarize the data
        if isinstance(data, list):
            return {
                "type": "list",
                "count": len(data),
                "sample": data[:3] if len(data) > 3 else data
            }
        elif isinstance(data, dict):
            return {
                "type": "dict",
                "keys": list(data.keys()),
                "size": len(data)
            }
        else:
            return {
                "type": type(data).__name__,
                "value": str(data)
            }

    return {"error": f"Unknown operation: {operation}"}


@mcp.tool()
async def batch_api_request(endpoints: list[str]) -> dict:
    """
    Make multiple API requests in parallel.

    Useful for gathering data from multiple endpoints efficiently.
    """
    import asyncio

    async def fetch_endpoint(endpoint: str):
        try:
            response = await client.get(endpoint)
            response.raise_for_status()
            return {
                "endpoint": endpoint,
                "success": True,
                "data": response.json()
            }
        except Exception as e:
            return {
                "endpoint": endpoint,
                "success": False,
                "error": str(e)
            }

    # Execute all requests in parallel
    results = await asyncio.gather(*[fetch_endpoint(ep) for ep in endpoints])

    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]

    return {
        "total": len(endpoints),
        "successful": len(successful),
        "failed": len(failed),
        "results": results
    }


# ============================================================================
# Add Custom Resources
# ============================================================================

@mcp.resource("info://api-config")
def api_configuration() -> dict:
    """Get API configuration details."""
    return {
        "base_url": API_BASE_URL,
        "spec_url": OPENAPI_SPEC_URL,
        "authenticated": bool(API_KEY),
        "spec_loaded": spec is not None
    }


@mcp.resource("info://available-endpoints")
def list_available_endpoints() -> dict:
    """List all available API endpoints."""
    if not spec:
        return {"error": "OpenAPI spec not loaded"}

    endpoints = []

    for path, path_item in spec.get("paths", {}).items():
        for method in path_item.keys():
            if method.upper() in ["GET", "POST", "PUT", "PATCH", "DELETE"]:
                operation = path_item[method]
                endpoints.append({
                    "path": path,
                    "method": method.upper(),
                    "summary": operation.get("summary", ""),
                    "description": operation.get("description", "")
                })

    return {
        "total": len(endpoints),
        "endpoints": endpoints
    }


# ============================================================================
# Main Execution
# ============================================================================

if __name__ == "__main__":
    mcp.run()
