"""
FastMCP API Client Pattern
===========================
Manual API integration with connection pooling, caching, and retry logic.
"""

from fastmcp import FastMCP
import httpx
import os
import time
import asyncio
from typing import Optional, Any, Dict
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

mcp = FastMCP("API Client Pattern")

# ============================================================================
# Configuration
# ============================================================================

class Config:
    """API configuration from environment."""
    API_BASE_URL = os.getenv("API_BASE_URL", "https://api.example.com")
    API_KEY = os.getenv("API_KEY", "")
    API_TIMEOUT = int(os.getenv("API_TIMEOUT", "30"))
    CACHE_TTL = int(os.getenv("CACHE_TTL", "300"))  # 5 minutes
    MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))


# ============================================================================
# API Client with Connection Pooling
# ============================================================================

class APIClient:
    """Singleton API client with connection pooling."""
    _instance: Optional[httpx.AsyncClient] = None

    @classmethod
    async def get_client(cls) -> httpx.AsyncClient:
        """Get or create the shared HTTP client."""
        if cls._instance is None:
            cls._instance = httpx.AsyncClient(
                base_url=Config.API_BASE_URL,
                headers={
                    "Authorization": f"Bearer {Config.API_KEY}",
                    "Content-Type": "application/json",
                    "User-Agent": "FastMCP-Client/1.0"
                },
                timeout=httpx.Timeout(Config.API_TIMEOUT),
                limits=httpx.Limits(
                    max_keepalive_connections=5,
                    max_connections=10
                )
            )
        return cls._instance

    @classmethod
    async def cleanup(cls):
        """Cleanup the HTTP client."""
        if cls._instance:
            await cls._instance.aclose()
            cls._instance = None


# ============================================================================
# Cache Implementation
# ============================================================================

class SimpleCache:
    """Time-based cache for API responses."""

    def __init__(self, ttl: int = 300):
        self.ttl = ttl
        self.cache: Dict[str, Any] = {}
        self.timestamps: Dict[str, float] = {}

    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired."""
        if key in self.cache:
            if time.time() - self.timestamps[key] < self.ttl:
                return self.cache[key]
            else:
                # Expired, remove it
                del self.cache[key]
                del self.timestamps[key]
        return None

    def set(self, key: str, value: Any):
        """Set cache value with timestamp."""
        self.cache[key] = value
        self.timestamps[key] = time.time()

    def invalidate(self, pattern: Optional[str] = None):
        """Invalidate cache entries."""
        if pattern:
            keys_to_delete = [k for k in self.cache if pattern in k]
            for key in keys_to_delete:
                del self.cache[key]
                del self.timestamps[key]
        else:
            self.cache.clear()
            self.timestamps.clear()


# Global cache instance
cache = SimpleCache(ttl=Config.CACHE_TTL)


# ============================================================================
# Retry Logic with Exponential Backoff
# ============================================================================

async def retry_with_backoff(
    func,
    max_retries: int = 3,
    initial_delay: float = 1.0,
    exponential_base: float = 2.0
):
    """Retry function with exponential backoff."""
    delay = initial_delay
    last_exception = None

    for attempt in range(max_retries):
        try:
            return await func()
        except (httpx.TimeoutException, httpx.NetworkError) as e:
            last_exception = e
            if attempt < max_retries - 1:
                print(f"Attempt {attempt + 1} failed, retrying in {delay}s...")
                await asyncio.sleep(delay)
                delay *= exponential_base
        except httpx.HTTPStatusError as e:
            # Don't retry client errors (4xx)
            if 400 <= e.response.status_code < 500:
                raise
            last_exception = e
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
                delay *= exponential_base

    raise last_exception


# ============================================================================
# API Tools
# ============================================================================

@mcp.tool()
async def api_get(
    endpoint: str,
    use_cache: bool = True
) -> dict:
    """
    Make a GET request to the API.

    Args:
        endpoint: API endpoint path (e.g., "/users/123")
        use_cache: Whether to use cached response if available

    Returns:
        API response data or error
    """
    cache_key = f"GET:{endpoint}"

    # Check cache
    if use_cache:
        cached = cache.get(cache_key)
        if cached:
            return {
                "success": True,
                "data": cached,
                "from_cache": True,
                "timestamp": datetime.now().isoformat()
            }

    # Make request with retry
    async def make_request():
        client = await APIClient.get_client()
        response = await client.get(endpoint)
        response.raise_for_status()
        return response.json()

    try:
        data = await retry_with_backoff(make_request, max_retries=Config.MAX_RETRIES)

        # Cache successful response
        if use_cache:
            cache.set(cache_key, data)

        return {
            "success": True,
            "data": data,
            "from_cache": False,
            "timestamp": datetime.now().isoformat()
        }

    except httpx.HTTPStatusError as e:
        return {
            "success": False,
            "error": f"HTTP {e.response.status_code}",
            "message": e.response.text,
            "endpoint": endpoint
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "endpoint": endpoint
        }


@mcp.tool()
async def api_post(
    endpoint: str,
    data: dict,
    invalidate_cache: bool = True
) -> dict:
    """
    Make a POST request to the API.

    Args:
        endpoint: API endpoint path
        data: Request body data
        invalidate_cache: Whether to invalidate related cache entries

    Returns:
        API response or error
    """
    async def make_request():
        client = await APIClient.get_client()
        response = await client.post(endpoint, json=data)
        response.raise_for_status()
        return response.json()

    try:
        result = await retry_with_backoff(make_request, max_retries=Config.MAX_RETRIES)

        # Invalidate cache for related endpoints
        if invalidate_cache:
            cache.invalidate(endpoint.split('/')[1] if '/' in endpoint else endpoint)

        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }

    except httpx.HTTPStatusError as e:
        return {
            "success": False,
            "error": f"HTTP {e.response.status_code}",
            "message": e.response.text
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
async def api_put(
    endpoint: str,
    data: dict,
    invalidate_cache: bool = True
) -> dict:
    """Make a PUT request to the API."""
    async def make_request():
        client = await APIClient.get_client()
        response = await client.put(endpoint, json=data)
        response.raise_for_status()
        return response.json()

    try:
        result = await retry_with_backoff(make_request)

        if invalidate_cache:
            cache.invalidate(endpoint)

        return {"success": True, "data": result}

    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
async def api_delete(
    endpoint: str,
    invalidate_cache: bool = True
) -> dict:
    """Make a DELETE request to the API."""
    async def make_request():
        client = await APIClient.get_client()
        response = await client.delete(endpoint)
        response.raise_for_status()
        return response.status_code

    try:
        status = await retry_with_backoff(make_request)

        if invalidate_cache:
            cache.invalidate(endpoint)

        return {
            "success": True,
            "status_code": status,
            "deleted": True
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
async def batch_api_requests(
    endpoints: list[str],
    use_cache: bool = True
) -> dict:
    """
    Make multiple GET requests in parallel.

    Args:
        endpoints: List of endpoint paths
        use_cache: Whether to use cache

    Returns:
        Batch results with successes and failures
    """
    async def fetch_one(endpoint: str):
        return await api_get(endpoint, use_cache=use_cache)

    results = await asyncio.gather(*[fetch_one(ep) for ep in endpoints])

    successful = [r for r in results if r.get("success")]
    failed = [r for r in results if not r.get("success")]

    return {
        "total": len(endpoints),
        "successful": len(successful),
        "failed": len(failed),
        "results": results
    }


@mcp.tool()
def clear_cache(pattern: Optional[str] = None) -> dict:
    """
    Clear API response cache.

    Args:
        pattern: Optional pattern to match cache keys (clears all if not provided)

    Returns:
        Cache clear status
    """
    try:
        cache.invalidate(pattern)
        return {
            "success": True,
            "message": f"Cache cleared{f' for pattern: {pattern}' if pattern else ''}"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================================
# Resources
# ============================================================================

@mcp.resource("info://api-status")
async def api_status() -> dict:
    """Check API connectivity and status."""
    try:
        client = await APIClient.get_client()
        response = await client.get("/health", timeout=5)
        return {
            "api_reachable": True,
            "status_code": response.status_code,
            "healthy": response.status_code == 200,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "api_reachable": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@mcp.resource("info://cache-stats")
def cache_statistics() -> dict:
    """Get cache statistics."""
    return {
        "total_entries": len(cache.cache),
        "ttl_seconds": cache.ttl,
        "entries": list(cache.cache.keys())
    }


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    try:
        mcp.run()
    finally:
        # Cleanup on exit
        import asyncio
        asyncio.run(APIClient.cleanup())
