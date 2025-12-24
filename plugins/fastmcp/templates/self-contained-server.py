"""
Self-Contained FastMCP Server
==============================
Production pattern with all utilities in one file.
Avoids circular import issues common in cloud deployment.
"""

from fastmcp import FastMCP, Context
import os
import time
import asyncio
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# Configuration (Self-contained)
# ============================================================================

class Config:
    """Application configuration from environment variables."""
    SERVER_NAME = os.getenv("SERVER_NAME", "Self-Contained Server")
    SERVER_VERSION = "1.0.0"
    API_BASE_URL = os.getenv("API_BASE_URL", "")
    API_KEY = os.getenv("API_KEY", "")
    CACHE_TTL = int(os.getenv("CACHE_TTL", "300"))
    MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))


# ============================================================================
# Utilities (All in one place)
# ============================================================================

def format_success(data: Any, message: str = "Success") -> Dict[str, Any]:
    """Format successful response."""
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }


def format_error(error: str, code: str = "ERROR") -> Dict[str, Any]:
    """Format error response."""
    return {
        "success": False,
        "error": error,
        "code": code,
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# API Client (Lazy Initialization)
# ============================================================================

class APIClient:
    """Singleton HTTP client with lazy initialization."""
    _instance: Optional[httpx.AsyncClient] = None

    @classmethod
    async def get_client(cls) -> Optional[httpx.AsyncClient]:
        """Get or create HTTP client (only when needed)."""
        if not Config.API_BASE_URL or not Config.API_KEY:
            return None

        if cls._instance is None:
            cls._instance = httpx.AsyncClient(
                base_url=Config.API_BASE_URL,
                headers={"Authorization": f"Bearer {Config.API_KEY}"},
                timeout=httpx.Timeout(30.0)
            )
        return cls._instance

    @classmethod
    async def cleanup(cls):
        """Cleanup HTTP client."""
        if cls._instance:
            await cls._instance.aclose()
            cls._instance = None


# ============================================================================
# Cache (Simple Implementation)
# ============================================================================

class SimpleCache:
    """Time-based cache."""
    _cache: Dict[str, Any] = {}
    _timestamps: Dict[str, float] = {}

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        """Get cached value if not expired."""
        if key in cls._cache:
            if time.time() - cls._timestamps[key] < Config.CACHE_TTL:
                return cls._cache[key]
            else:
                del cls._cache[key]
                del cls._timestamps[key]
        return None

    @classmethod
    def set(cls, key: str, value: Any):
        """Set cache value."""
        cls._cache[key] = value
        cls._timestamps[key] = time.time()

    @classmethod
    def clear(cls):
        """Clear all cache."""
        cls._cache.clear()
        cls._timestamps.clear()


# ============================================================================
# Retry Logic
# ============================================================================

async def retry_with_backoff(func, max_retries: int = 3):
    """Retry function with exponential backoff."""
    delay = 1.0
    last_exception = None

    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            last_exception = e
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
                delay *= 2

    raise last_exception


# ============================================================================
# Server Creation (Module Level - Required for Cloud!)
# ============================================================================

mcp = FastMCP(
    name=Config.SERVER_NAME,
    instructions=f"""
    {Config.SERVER_NAME} v{Config.SERVER_VERSION}

    A self-contained MCP server with production patterns.

    Available tools:
    - process_data: Process and transform data
    - fetch_from_api: Fetch data from external API (if configured)
    - calculate: Perform calculations

    Available resources:
    - info://status: Server status
    - info://config: Configuration details
    """
)


# ============================================================================
# Tools
# ============================================================================

@mcp.tool()
async def process_data(
    data: List[Dict[str, Any]],
    operation: str = "summarize"
) -> dict:
    """
    Process a list of data items.

    Args:
        data: List of data items
        operation: Operation to perform (summarize, filter, transform)

    Returns:
        Processed result
    """
    try:
        if operation == "summarize":
            return format_success({
                "count": len(data),
                "first": data[0] if data else None,
                "last": data[-1] if data else None
            })

        elif operation == "filter":
            filtered = [d for d in data if d.get("active", False)]
            return format_success({
                "original_count": len(data),
                "filtered_count": len(filtered),
                "data": filtered
            })

        elif operation == "transform":
            transformed = [
                {**d, "processed_at": datetime.now().isoformat()}
                for d in data
            ]
            return format_success({"data": transformed})

        else:
            return format_error(f"Unknown operation: {operation}", "INVALID_OPERATION")

    except Exception as e:
        return format_error(str(e), "PROCESSING_ERROR")


@mcp.tool()
async def fetch_from_api(
    endpoint: str,
    use_cache: bool = True
) -> dict:
    """
    Fetch data from external API.

    Args:
        endpoint: API endpoint path
        use_cache: Whether to use cached response

    Returns:
        API response or error
    """
    if not Config.API_BASE_URL:
        return format_error("API not configured", "API_NOT_CONFIGURED")

    cache_key = f"api:{endpoint}"

    # Check cache
    if use_cache:
        cached = SimpleCache.get(cache_key)
        if cached:
            return format_success(cached, "Retrieved from cache")

    # Fetch from API
    try:
        client = await APIClient.get_client()
        if not client:
            return format_error("API client not available", "CLIENT_ERROR")

        async def make_request():
            response = await client.get(endpoint)
            response.raise_for_status()
            return response.json()

        data = await retry_with_backoff(make_request, max_retries=Config.MAX_RETRIES)

        # Cache the result
        if use_cache:
            SimpleCache.set(cache_key, data)

        return format_success(data, "Fetched from API")

    except httpx.HTTPStatusError as e:
        return format_error(
            f"HTTP {e.response.status_code}",
            "HTTP_ERROR"
        )
    except Exception as e:
        return format_error(str(e), "API_ERROR")


@mcp.tool()
def calculate(operation: str, a: float, b: float) -> dict:
    """
    Perform mathematical operations.

    Args:
        operation: add, subtract, multiply, divide
        a: First number
        b: Second number

    Returns:
        Calculation result
    """
    operations = {
        "add": lambda x, y: x + y,
        "subtract": lambda x, y: x - y,
        "multiply": lambda x, y: x * y,
        "divide": lambda x, y: x / y if y != 0 else None
    }

    if operation not in operations:
        return format_error(
            f"Unknown operation: {operation}",
            "INVALID_OPERATION"
        )

    result = operations[operation](a, b)

    if result is None:
        return format_error("Division by zero", "DIVISION_BY_ZERO")

    return format_success({
        "operation": operation,
        "a": a,
        "b": b,
        "result": result
    })


@mcp.tool()
async def batch_process_with_progress(
    items: List[str],
    context: Context
) -> dict:
    """
    Process items with progress tracking.

    Args:
        items: List of items to process
        context: FastMCP context for progress reporting

    Returns:
        Processing results
    """
    results = []
    total = len(items)

    for i, item in enumerate(items):
        # Report progress
        await context.report_progress(
            progress=i + 1,
            total=total,
            message=f"Processing {i + 1}/{total}: {item}"
        )

        # Simulate processing
        await asyncio.sleep(0.1)
        results.append({
            "item": item,
            "processed": item.upper(),
            "index": i
        })

    return format_success({
        "total": total,
        "results": results
    }, "Batch processing complete")


@mcp.tool()
def clear_cache() -> dict:
    """Clear all cached data."""
    try:
        SimpleCache.clear()
        return format_success({"cleared": True}, "Cache cleared")
    except Exception as e:
        return format_error(str(e), "CACHE_ERROR")


# ============================================================================
# Resources
# ============================================================================

@mcp.resource("info://status")
async def server_status() -> dict:
    """Get current server status."""
    return {
        "server": Config.SERVER_NAME,
        "version": Config.SERVER_VERSION,
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "api_configured": bool(Config.API_BASE_URL and Config.API_KEY),
        "cache_entries": len(SimpleCache._cache)
    }


@mcp.resource("info://config")
def server_config() -> dict:
    """Get server configuration (non-sensitive)."""
    return {
        "server_name": Config.SERVER_NAME,
        "version": Config.SERVER_VERSION,
        "cache_ttl": Config.CACHE_TTL,
        "max_retries": Config.MAX_RETRIES,
        "api_configured": bool(Config.API_BASE_URL)
    }


@mcp.resource("health://check")
async def health_check() -> dict:
    """Comprehensive health check."""
    checks = {}

    # Check API
    if Config.API_BASE_URL:
        try:
            client = await APIClient.get_client()
            if client:
                response = await client.get("/health", timeout=5)
                checks["api"] = response.status_code == 200
        except:
            checks["api"] = False
    else:
        checks["api"] = None  # Not configured

    # Check cache
    checks["cache"] = True  # Always available

    return {
        "status": "healthy" if all(v for v in checks.values() if v is not None) else "degraded",
        "checks": checks,
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# Main Execution
# ============================================================================

if __name__ == "__main__":
    try:
        print(f"Starting {Config.SERVER_NAME}...")
        mcp.run()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        # Cleanup
        import asyncio
        asyncio.run(APIClient.cleanup())
