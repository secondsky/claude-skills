# FastMCP Production Patterns Reference

Battle-tested patterns for production-ready FastMCP servers.

## Self-Contained Server Pattern

**Problem:** Circular imports break cloud deployment
**Solution:** Keep all utilities in one file

```python
# src/utils.py - All utilities in one place
import os
from typing import Dict, Any
from datetime import datetime

class Config:
    """Configuration from environment."""
    SERVER_NAME = os.getenv("SERVER_NAME", "FastMCP Server")
    API_KEY = os.getenv("API_KEY", "")
    CACHE_TTL = int(os.getenv("CACHE_TTL", "300"))

def format_success(data: Any) -> Dict[str, Any]:
    """Format successful response."""
    return {
        "success": True,
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

# Usage in tools
from .utils import format_success, format_error, Config

@mcp.tool()
async def process_data(data: dict) -> dict:
    try:
        result = await process(data)
        return format_success(result)
    except Exception as e:
        return format_error(str(e))
```

**Why it works:**
- No circular dependencies
- Cloud deployment safe
- Easy to maintain
- Single source of truth

## Lazy Initialization Pattern

**Problem:** Creating expensive resources at import time fails in cloud
**Solution:** Initialize resources only when needed

```python
class ResourceManager:
    """Manages expensive resources with lazy initialization."""
    _db_pool = None
    _cache = None

    @classmethod
    async def get_db(cls):
        """Get database pool (create on first use)."""
        if cls._db_pool is None:
            cls._db_pool = await create_db_pool()
        return cls._db_pool

    @classmethod
    async def get_cache(cls):
        """Get cache (create on first use)."""
        if cls._cache is None:
            cls._cache = await create_cache()
        return cls._cache

# Usage - no initialization at module level
manager = ResourceManager()  # Lightweight

@mcp.tool()
async def database_operation():
    db = await manager.get_db()  # Initialization happens here
    return await db.query("SELECT * FROM users")
```

## Connection Pooling Pattern

**Problem:** Creating new connections for each request is slow
**Solution:** Reuse HTTP clients with connection pooling

```python
import httpx

class APIClient:
    _instance: Optional[httpx.AsyncClient] = None

    @classmethod
    async def get_client(cls) -> httpx.AsyncClient:
        """Get or create shared HTTP client."""
        if cls._instance is None:
            cls._instance = httpx.AsyncClient(
                base_url=API_BASE_URL,
                timeout=httpx.Timeout(30.0),
                limits=httpx.Limits(
                    max_keepalive_connections=5,
                    max_connections=10
                )
            )
        return cls._instance

    @classmethod
    async def cleanup(cls):
        """Cleanup on shutdown."""
        if cls._instance:
            await cls._instance.aclose()
            cls._instance = None

@mcp.tool()
async def api_request(endpoint: str) -> dict:
    client = await APIClient.get_client()
    response = await client.get(endpoint)
    return response.json()
```

## Retry with Exponential Backoff

**Problem:** Transient failures cause tool failures
**Solution:** Automatic retry with exponential backoff

```python
import asyncio

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
                await asyncio.sleep(delay)
                delay *= exponential_base

    raise last_exception

@mcp.tool()
async def resilient_api_call(endpoint: str) -> dict:
    """API call with automatic retry."""
    async def make_call():
        client = await APIClient.get_client()
        response = await client.get(endpoint)
        response.raise_for_status()
        return response.json()

    try:
        data = await retry_with_backoff(make_call)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

## Time-Based Caching Pattern

**Problem:** Repeated API calls for same data waste time/money
**Solution:** Cache with TTL (time-to-live)

```python
import time

class TimeBasedCache:
    def __init__(self, ttl: int = 300):
        self.ttl = ttl
        self.cache = {}
        self.timestamps = {}

    def get(self, key: str):
        if key in self.cache:
            if time.time() - self.timestamps[key] < self.ttl:
                return self.cache[key]
            else:
                del self.cache[key]
                del self.timestamps[key]
        return None

    def set(self, key: str, value):
        self.cache[key] = value
        self.timestamps[key] = time.time()

cache = TimeBasedCache(ttl=300)

@mcp.tool()
async def cached_fetch(resource_id: str) -> dict:
    """Fetch with caching."""
    cache_key = f"resource:{resource_id}"

    cached = cache.get(cache_key)
    if cached:
        return {"data": cached, "from_cache": True}

    data = await fetch_from_api(resource_id)
    cache.set(cache_key, data)

    return {"data": data, "from_cache": False}
```

## Structured Error Responses

**Problem:** Inconsistent error formats make debugging hard
**Solution:** Standardized error response format

```python
from enum import Enum

class ErrorCode(Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    API_ERROR = "API_ERROR"
    TIMEOUT = "TIMEOUT"
    UNKNOWN = "UNKNOWN"

def create_error(code: ErrorCode, message: str, details: dict = None):
    """Create structured error response."""
    return {
        "success": False,
        "error": {
            "code": code.value,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
    }

@mcp.tool()
async def validated_operation(data: str) -> dict:
    if not data:
        return create_error(
            ErrorCode.VALIDATION_ERROR,
            "Data is required",
            {"field": "data"}
        )

    try:
        result = await process(data)
        return {"success": True, "data": result}
    except Exception as e:
        return create_error(ErrorCode.UNKNOWN, str(e))
```

## Environment-Based Configuration

**Problem:** Different settings for dev/staging/production
**Solution:** Environment-based configuration class

```python
import os
from enum import Enum

class Environment(Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class Config:
    ENV = Environment(os.getenv("ENVIRONMENT", "development"))

    SETTINGS = {
        Environment.DEVELOPMENT: {
            "debug": True,
            "cache_ttl": 60,
            "log_level": "DEBUG"
        },
        Environment.STAGING: {
            "debug": True,
            "cache_ttl": 300,
            "log_level": "INFO"
        },
        Environment.PRODUCTION: {
            "debug": False,
            "cache_ttl": 3600,
            "log_level": "WARNING"
        }
    }

    @classmethod
    def get(cls, key: str):
        return cls.SETTINGS[cls.ENV].get(key)

# Use configuration
cache_ttl = Config.get("cache_ttl")
debug_mode = Config.get("debug")
```

## Health Check Pattern

**Problem:** Need to monitor server health in production
**Solution:** Comprehensive health check resource

```python
@mcp.resource("health://status")
async def health_check() -> dict:
    """Comprehensive health check."""
    checks = {}

    # Check API connectivity
    try:
        client = await APIClient.get_client()
        response = await client.get("/health", timeout=5)
        checks["api"] = response.status_code == 200
    except:
        checks["api"] = False

    # Check database (if applicable)
    try:
        db = await ResourceManager.get_db()
        await db.execute("SELECT 1")
        checks["database"] = True
    except:
        checks["database"] = False

    # System resources
    import psutil
    checks["memory_percent"] = psutil.virtual_memory().percent
    checks["cpu_percent"] = psutil.cpu_percent()

    # Overall status
    all_healthy = (
        checks.get("api", True) and
        checks.get("database", True) and
        checks["memory_percent"] < 90 and
        checks["cpu_percent"] < 90
    )

    return {
        "status": "healthy" if all_healthy else "degraded",
        "timestamp": datetime.now().isoformat(),
        "checks": checks
    }
```

## Parallel Processing Pattern

**Problem:** Sequential processing is slow for batch operations
**Solution:** Process items in parallel

```python
import asyncio

@mcp.tool()
async def batch_process(items: list[str]) -> dict:
    """Process multiple items in parallel."""
    async def process_single(item: str):
        try:
            result = await process_item(item)
            return {"item": item, "success": True, "result": result}
        except Exception as e:
            return {"item": item, "success": False, "error": str(e)}

    # Process all items in parallel
    tasks = [process_single(item) for item in items]
    results = await asyncio.gather(*tasks)

    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]

    return {
        "total": len(items),
        "successful": len(successful),
        "failed": len(failed),
        "results": results
    }
```

## State Management Pattern

**Problem:** Shared state causes race conditions
**Solution:** Thread-safe state management with locks

```python
import asyncio

class StateManager:
    def __init__(self):
        self._state = {}
        self._locks = {}

    async def get(self, key: str, default=None):
        return self._state.get(key, default)

    async def set(self, key: str, value):
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()

        async with self._locks[key]:
            self._state[key] = value

    async def update(self, key: str, updater):
        """Update with function."""
        if key not in self._locks:
            self._locks[key] = asyncio.Lock()

        async with self._locks[key]:
            current = self._state.get(key)
            self._state[key] = await updater(current)
            return self._state[key]

state = StateManager()

@mcp.tool()
async def increment_counter(name: str) -> dict:
    new_value = await state.update(
        f"counter_{name}",
        lambda x: (x or 0) + 1
    )
    return {"counter": name, "value": new_value}
```

## Anti-Patterns to Avoid

### ❌ Factory Functions in __init__.py

```python
# DON'T DO THIS
# shared/__init__.py
def get_api_client():
    from .api_client import APIClient  # Circular import risk
    return APIClient()
```

### ❌ Blocking Operations in Async

```python
# DON'T DO THIS
@mcp.tool()
async def bad_async():
    time.sleep(5)  # Blocks entire event loop!
    return "done"

# DO THIS INSTEAD
@mcp.tool()
async def good_async():
    await asyncio.sleep(5)
    return "done"
```

### ❌ Global Mutable State

```python
# DON'T DO THIS
results = []  # Race conditions!

@mcp.tool()
async def add_result(data: str):
    results.append(data)
```

## Production Deployment Checklist

- [ ] Module-level server object
- [ ] Environment variables for all config
- [ ] Connection pooling for HTTP clients
- [ ] Retry logic for transient failures
- [ ] Caching for expensive operations
- [ ] Structured error responses
- [ ] Health check endpoint
- [ ] Logging configured
- [ ] No circular imports
- [ ] No import-time async execution
- [ ] Rate limiting if needed
- [ ] Graceful shutdown handling

## Resources

- **Production Examples**: See `self-contained-server.py` template
- **Error Handling**: See `error-handling.py` template
- **API Patterns**: See `api-client-pattern.py` template
